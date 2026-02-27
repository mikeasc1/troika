"""
Twitter/X follower fetching utilities with Apify token rotation.
"""

import time
from typing import Any

from apify_client import ApifyClient
from apify_client.errors import ApifyApiError

from app.core.config import settings
from utils.token_manager import TokenManager

# Lazy initialization: module-level token manager is created on first use
# rather than at import time, so the module can be imported without env vars.
_token_manager: TokenManager | None = None


def _get_default_token_manager() -> TokenManager:
    """Get or create the default token manager from env vars."""
    global _token_manager
    if _token_manager is None:
        keys = settings.get_apify_keys()
        if not keys:
            raise RuntimeError("No Apify API keys configured. Set APIFY_KEY or APIFY_KEYS in .env, or save via Settings.")
        _token_manager = TokenManager(keys)
    return _token_manager


# For backward compatibility
token_manager = property(lambda self: _get_default_token_manager())

ACTOR_ID = "j9BpynyyA9OYTHTtv"


def _get_client(tm: TokenManager) -> ApifyClient:
    """Get an ApifyClient with the current token."""
    return ApifyClient(tm.current_token)


def _is_credit_exhausted_error(error: ApifyApiError) -> bool:
    """Check if the error indicates credit exhaustion."""
    error_msg = str(error).lower()
    return any(
        phrase in error_msg
        for phrase in ["maximum charged results", "credit", "limit exceeded", "insufficient"]
    )


def get_followers_with_keys(user: str, apify_keys: list[str], cursor: str | None = None) -> list[dict[str, Any]]:
    """
    Fetch followers using explicitly provided Apify keys (e.g. from DB).

    Args:
        user: Twitter/X username to fetch followers for.
        apify_keys: List of Apify API keys to use with rotation.
        cursor: Username of the last known follower (cost optimization).

    Returns:
        List of follower data dictionaries.
    """
    tm = TokenManager(apify_keys)
    return _get_followers_impl(user, tm, cursor)


def get_followers(user: str, cursor: str | None = None) -> list[dict[str, Any]]:
    """
    Fetch followers using env-var configured keys (backward compatible).

    Args:
        user: Twitter/X username to fetch followers for.
        cursor: Username of the last known follower (cost optimization).

    Returns:
        List of follower data dictionaries.

    Raises:
        RuntimeError: If all tokens are exhausted.
        ApifyApiError: If a non-credit-related API error occurs.
    """
    tm = _get_default_token_manager()
    return _get_followers_impl(user, tm, cursor)


def _get_followers_impl(user: str, tm: TokenManager, cursor: str | None = None) -> list[dict[str, Any]]:
    """Internal implementation for fetching followers with a given token manager."""
    run_input = {
        "urls": [f"https://x.com/{user}/followers"],
        "maxItems": 2000,
    }

    while tm.has_available_tokens:
        client = _get_client(tm)
        print(f"Starting scrape for {user} (tokens available: {tm.available_count})...")

        try:
            run = client.actor(ACTOR_ID).start(run_input=run_input)
            run_id = run["id"]
            dataset_id = run["defaultDatasetId"]
            return _process_run(client, run_id, dataset_id, cursor)

        except ApifyApiError as e:
            if _is_credit_exhausted_error(e):
                print(f"Token exhausted: {e}")
                next_token = tm.mark_exhausted()
                if next_token:
                    print("Rotating to next token...")
                    continue
                else:
                    raise RuntimeError("All Apify tokens exhausted") from e
            else:
                raise

    raise RuntimeError("No available Apify tokens")


def _process_run(
    client: ApifyClient,
    run_id: str,
    dataset_id: str,
    cursor: str | None,
) -> list[dict[str, Any]]:
    """Process an Apify run, collecting results until cursor or completion."""
    new_followers: list[dict[str, Any]] = []
    offset = 0
    limit = 100
    cursor_found = False

    try:
        while True:
            run_info = client.run(run_id).get()
            status = run_info.get("status")

            items_page = client.dataset(dataset_id).list_items(
                offset=offset, limit=limit
            ).items

            if items_page:
                print(f"Fetched {len(items_page)} items at offset {offset}")
                for item in items_page:
                    item_username = (
                        item.get("username")
                        or item.get("screen_name")
                        or item.get("screenName")
                    )

                    if cursor and item_username == cursor:
                        print(f"Cursor '{cursor}' found. Aborting run.")
                        cursor_found = True
                        break

                    new_followers.append(item)

                offset += len(items_page)

            if cursor_found:
                client.run(run_id).abort()
                break

            if status in ["SUCCEEDED", "FAILED", "ABORTED"] and not items_page:
                print(f"Run finished with status: {status}")
                break

            time.sleep(5)

    except Exception as e:
        print(f"Error during run processing: {e}")
        try:
            client.run(run_id).abort()
        except Exception:
            pass
        raise

    print(f"Collected {len(new_followers)} new followers.")
    return new_followers


def _extract_username(follower: dict[str, Any]) -> str | None:
    """Extract username from a follower dict."""
    return (
        follower.get("username")
        or follower.get("screen_name")
        or follower.get("screenName")
    )


def compare_followers(
    old_followers: list[dict[str, Any]],
    new_followers: list[dict[str, Any]],
) -> tuple[list[str], list[str]]:
    """
    Compare two lists of followers to find who left and who joined.

    This is a pure in-memory operation - no API calls. Very cost-effective
    when you already have both snapshots.

    Args:
        old_followers: Previous snapshot of followers.
        new_followers: Current snapshot of followers.

    Returns:
        Tuple of (left_usernames, joined_usernames):
        - left_usernames: Users who were in old but not in new (unfollowed)
        - joined_usernames: Users who are in new but not in old (new followers)
    """
    old_usernames = {_extract_username(f) for f in old_followers if _extract_username(f)}
    new_usernames = {_extract_username(f) for f in new_followers if _extract_username(f)}

    left = old_usernames - new_usernames
    joined = new_usernames - old_usernames

    return sorted(left), sorted(joined)


def check_followers_batch(
    user: str,
    usernames_to_check: list[str],
    cached_followers: list[dict[str, Any]] | None = None,
) -> dict[str, bool]:
    """
    Check if a batch of users are followers of the target account.

    Cost-effective approach:
    - If cached_followers is provided, uses that (no API calls).
    - Otherwise, fetches current followers once and checks against that.

    Args:
        user: The account to check followers for.
        usernames_to_check: List of usernames to verify.
        cached_followers: Optional pre-fetched follower list to avoid API calls.

    Returns:
        Dict mapping each username to True (still following) or False (not following).
    """
    if cached_followers is not None:
        current_usernames = {
            _extract_username(f) for f in cached_followers if _extract_username(f)
        }
    else:
        # Fetch current followers (single API call)
        print(f"Fetching current followers to check batch of {len(usernames_to_check)} users...")
        followers = get_followers(user)
        current_usernames = {_extract_username(f) for f in followers if _extract_username(f)}

    return {username: username in current_usernames for username in usernames_to_check}


def get_follower_changes(
    user: str,
    previous_followers: list[dict[str, Any]],
) -> tuple[list[str], list[str], list[dict[str, Any]]]:
    """
    Get follower changes since the last snapshot.

    This is a convenience function that:
    1. Fetches current followers
    2. Compares with previous snapshot
    3. Returns changes and the new snapshot for future comparisons

    Args:
        user: The account to check.
        previous_followers: The previous follower snapshot.

    Returns:
        Tuple of (left_usernames, joined_usernames, current_followers):
        - left_usernames: Users who unfollowed
        - joined_usernames: New followers
        - current_followers: Current snapshot (save this for next comparison)
    """
    current_followers = get_followers(user)
    left, joined = compare_followers(previous_followers, current_followers)
    return left, joined, current_followers


if __name__ == "__main__":
    print("Testing follower fetching with token rotation...")
    print(f"Available tokens: {token_manager.available_count}")

    try:
        followers = get_followers("apify")
        print(f"Got {len(followers)} followers.")

        if followers:
            last_follower = (
                followers[0].get("username") or followers[0].get("screen_name")
            )
            print(f"Most recent follower: {last_follower}")

            print("Fetching again with cursor...")
            new_ones = get_followers("apify", cursor=last_follower)
            print(f"Got {len(new_ones)} new followers.")
    except RuntimeError as e:
        print(f"Failed: {e}")

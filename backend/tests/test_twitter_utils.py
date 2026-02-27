"""
Tests for Twitter utilities with token rotation.
"""

import pytest
from unittest.mock import MagicMock, patch


@patch("utils.twitter.token_manager")
@patch("utils.twitter._get_client")
def test_get_followers_cursor_found_first_page(mock_get_client, mock_token_manager):
    """Test that fetching stops when cursor is found."""
    from utils.twitter import get_followers

    # Setup token manager
    mock_token_manager.has_available_tokens = True
    mock_token_manager.available_count = 1

    # Setup mock client
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    # Mock actor start
    mock_client.actor.return_value.start.return_value = {
        "id": "run_id_1",
        "defaultDatasetId": "dataset_id_1",
    }

    # Mock run status
    mock_client.run.return_value.get.return_value = {"status": "RUNNING"}

    # Mock dataset items - cursor user is in first page
    mock_client.dataset.return_value.list_items.side_effect = [
        MagicMock(
            items=[
                {"username": "user1"},
                {"username": "user2"},
                {"username": "cursor_user"},
                {"username": "user4"},
            ]
        ),
        MagicMock(items=[]),
    ]

    # Execute
    followers = get_followers("target_user", cursor="cursor_user")

    # Verify - should only have users before cursor
    assert len(followers) == 2
    assert followers[0]["username"] == "user1"
    assert followers[1]["username"] == "user2"

    # Verify abort was called
    mock_client.run.return_value.abort.assert_called_once()


@patch("utils.twitter.token_manager")
@patch("utils.twitter._get_client")
def test_get_followers_no_cursor(mock_get_client, mock_token_manager):
    """Test full fetch when no cursor is provided."""
    from utils.twitter import get_followers

    # Setup token manager
    mock_token_manager.has_available_tokens = True
    mock_token_manager.available_count = 1

    # Setup mock client
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    # Mock actor start
    mock_client.actor.return_value.start.return_value = {
        "id": "run_id_2",
        "defaultDatasetId": "dataset_id_2",
    }

    # Mock run status - first RUNNING, then SUCCEEDED
    mock_client.run.return_value.get.side_effect = [
        {"status": "RUNNING"},
        {"status": "SUCCEEDED"},
    ]

    # Mock dataset items
    mock_client.dataset.return_value.list_items.side_effect = [
        MagicMock(items=[{"username": "user1"}, {"username": "user2"}]),
        MagicMock(items=[]),
    ]

    # Execute
    followers = get_followers("target_user")

    # Verify
    assert len(followers) == 2
    # Abort should NOT be called when no cursor
    mock_client.run.return_value.abort.assert_not_called()


@patch("utils.twitter.token_manager")
@patch("utils.twitter._get_client")
def test_token_rotation_on_credit_exhaustion(mock_get_client, mock_token_manager):
    """Test that token rotates when credit is exhausted."""
    from apify_client.errors import ApifyApiError
    from utils.twitter import get_followers

    # Setup token manager with 2 available tokens
    mock_token_manager.has_available_tokens = True
    mock_token_manager.available_count = 2
    mock_token_manager.mark_exhausted.return_value = "new_token"

    # Setup mock clients
    mock_client1 = MagicMock()
    mock_client2 = MagicMock()
    mock_get_client.side_effect = [mock_client1, mock_client2]

    # First client fails with credit error
    mock_error = MagicMock(spec=ApifyApiError)
    mock_error.__str__ = lambda self: "Maximum charged results must be greater than zero"
    mock_client1.actor.return_value.start.side_effect = ApifyApiError(
        MagicMock(status_code=400, text="Maximum charged results must be greater than zero"),
        1,
    )

    # Second client succeeds
    mock_client2.actor.return_value.start.return_value = {
        "id": "run_id_3",
        "defaultDatasetId": "dataset_id_3",
    }
    mock_client2.run.return_value.get.return_value = {"status": "SUCCEEDED"}
    mock_client2.dataset.return_value.list_items.side_effect = [
        MagicMock(items=[{"username": "user1"}]),
        MagicMock(items=[]),
    ]

    # Execute
    followers = get_followers("target_user")

    # Verify token was rotated
    mock_token_manager.mark_exhausted.assert_called_once()
    assert len(followers) == 1

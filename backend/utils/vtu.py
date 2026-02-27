"""
VTU.ng API utility for airtime and data purchases.

Supports multiple credentials with automatic rotation on auth failures.
"""

import uuid
from typing import Any

import httpx

from app.core.config import settings


class VTUError(Exception):
    """Base exception for VTU API errors."""
    pass


class VTUAuthError(VTUError):
    """Authentication failed."""
    pass


class VTUAPIError(VTUError):
    """API request failed."""
    def __init__(self, message: str, response_data: dict | None = None):
        super().__init__(message)
        self.response_data = response_data


class VTUCredentialsExhausted(VTUError):
    """All credentials have been exhausted."""
    pass


class CredentialManager:
    """Manages rotation of VTU credentials."""

    def __init__(self, credentials: list[tuple[str, str]]):
        if not credentials:
            raise VTUError("At least one credential is required")
        self._credentials = credentials
        self._current_index = 0
        self._exhausted: set[int] = set()

    @property
    def current(self) -> tuple[str, str]:
        """Get current (username, password)."""
        return self._credentials[self._current_index]

    @property
    def has_available(self) -> bool:
        """Check if there are non-exhausted credentials."""
        return len(self._exhausted) < len(self._credentials)

    @property
    def available_count(self) -> int:
        """Get count of available credentials."""
        return len(self._credentials) - len(self._exhausted)

    def rotate(self) -> tuple[str, str] | None:
        """Rotate to next available credential."""
        self._exhausted.add(self._current_index)

        for _ in range(len(self._credentials)):
            self._current_index = (self._current_index + 1) % len(self._credentials)
            if self._current_index not in self._exhausted:
                return self._credentials[self._current_index]

        return None

    def reset(self) -> None:
        """Reset all credentials to available."""
        self._exhausted.clear()
        self._current_index = 0


class VTUClient:
    """
    Async client for VTU.ng API with credential rotation.

    Usage:
        async with VTUClient() as client:
            balance = await client.check_balance()
            result = await client.buy_airtime("mtn", 100, "08012345678")
    """

    NETWORK_IDS = {
        "mtn": "mtn",
        "glo": "glo",
        "airtel": "airtel",
        "9mobile": "9mobile",
        "etisalat": "9mobile",
    }

    def __init__(
        self,
        credentials: list[tuple[str, str]] | None = None,
        base_url: str | None = None,
    ):
        creds = credentials or settings.get_vtu_credentials()
        if not creds:
            raise VTUError("No VTU credentials configured. Set VTU_CREDENTIALS or VTU_USERNAME/VTU_PASSWORD in .env")

        self._credential_manager = CredentialManager(creds)
        self._base_url = base_url or settings.VTU_BASE_URL
        self._client: httpx.AsyncClient | None = None
        self._token: str | None = None

    async def __aenter__(self) -> "VTUClient":
        """Async context manager entry."""
        self._client = httpx.AsyncClient(timeout=30.0)
        await self._authenticate_with_rotation()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def _authenticate_with_rotation(self) -> None:
        """Authenticate, rotating credentials on failure."""
        while self._credential_manager.has_available:
            username, password = self._credential_manager.current
            print(f"Authenticating with VTU (credentials available: {self._credential_manager.available_count})...")

            try:
                await self._authenticate(username, password)
                return
            except VTUAuthError as e:
                print(f"Auth failed for {username}: {e}")
                next_cred = self._credential_manager.rotate()
                if next_cred:
                    print("Rotating to next credential...")
                    continue
                else:
                    raise VTUCredentialsExhausted("All VTU credentials exhausted") from e

        raise VTUCredentialsExhausted("No available VTU credentials")

    async def _authenticate(self, username: str, password: str) -> None:
        """Authenticate with specific credentials."""
        if not self._client:
            raise VTUError("Client not initialized")

        try:
            response = await self._client.post(
                f"{self._base_url}/jwt-auth/v1/token",
                json={"username": username, "password": password},
            )
            response.raise_for_status()
            data = response.json()

            if "token" in data:
                self._token = data["token"]
                self._client.headers["Authorization"] = f"Bearer {self._token}"
            else:
                raise VTUAuthError(f"No token in response: {data}")

        except httpx.HTTPStatusError as e:
            raise VTUAuthError(f"Authentication failed: {e}") from e

    async def _request(self, method: str, endpoint: str, **kwargs) -> dict[str, Any]:
        """Make an authenticated API request."""
        if not self._client:
            raise VTUError("Client not initialized")

        url = f"{self._base_url}{endpoint}"
        response = await self._client.request(method, url, **kwargs)

        try:
            data = response.json()
        except Exception:
            data = {"raw": response.text}

        if not response.is_success:
            raise VTUAPIError(f"API error: {response.status_code}", data)

        return data

    async def check_balance(self) -> float:
        """Get current wallet balance."""
        data = await self._request("GET", "/api/v2/balance")
        try:
            return float(data.get("data", {}).get("balance", 0))
        except (ValueError, TypeError):
            raise VTUAPIError("Invalid balance response", data)

    async def get_airtime_providers(self) -> list[dict[str, Any]]:
        """Get available airtime providers."""
        data = await self._request("GET", "/api/v2/airtime/providers")
        return data.get("data", [])

    async def buy_airtime(self, network: str, amount: int | float, phone: str) -> dict[str, Any]:
        """Purchase airtime."""
        network_id = self.NETWORK_IDS.get(network.lower())
        if not network_id:
            raise VTUError(f"Invalid network: {network}. Use: {list(self.NETWORK_IDS.keys())}")

        request_id = str(uuid.uuid4())
        return await self._request(
            "POST",
            "/api/v2/airtime",
            json={"network": network_id, "amount": amount, "phone": phone, "request_id": request_id},
        )


# Convenience functions
async def check_vtu_balance() -> float:
    """Check VTU balance."""
    async with VTUClient() as client:
        return await client.check_balance()


async def buy_airtime(network: str, amount: int | float, phone: str) -> dict[str, Any]:
    """Buy airtime."""
    async with VTUClient() as client:
        return await client.buy_airtime(network, amount, phone)


if __name__ == "__main__":
    import asyncio

    async def main():
        print("Testing VTU client with credential rotation...")
        try:
            async with VTUClient() as client:
                balance = await client.check_balance()
                print(f"Balance: ₦{balance}")
        except VTUError as e:
            print(f"Error: {e}")

    asyncio.run(main())
"""
Tests for VTU utility with credential rotation.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx


@pytest.fixture
def mock_settings():
    """Mock settings with VTU credentials."""
    with patch("utils.vtu.settings") as mock:
        mock.VTU_USERNAME = "test_user"
        mock.VTU_PASSWORD = "test_pass"
        mock.VTU_CREDENTIALS = None
        mock.VTU_BASE_URL = "https://vtu.ng/wp-json"
        mock.get_vtu_credentials = lambda: [("test_user", "test_pass")]
        yield mock


@pytest.fixture
def mock_multi_credentials():
    """Mock settings with multiple VTU credentials."""
    with patch("utils.vtu.settings") as mock:
        mock.VTU_BASE_URL = "https://vtu.ng/wp-json"
        mock.get_vtu_credentials = lambda: [
            ("user1", "pass1"),
            ("user2", "pass2"),
            ("user3", "pass3"),
        ]
        yield mock


@pytest.mark.asyncio
async def test_vtu_client_authentication(mock_settings):
    """Test that VTU client authenticates on context entry."""
    from utils.vtu import VTUClient

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = MagicMock(
            json=lambda: {"token": "test_token"},
            raise_for_status=lambda: None,
        )

        async with VTUClient() as client:
            assert client._token == "test_token"


@pytest.mark.asyncio
async def test_vtu_check_balance(mock_settings):
    """Test checking balance."""
    from utils.vtu import VTUClient

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post, \
         patch.object(httpx.AsyncClient, "request", new_callable=AsyncMock) as mock_request:

        mock_post.return_value = MagicMock(
            json=lambda: {"token": "test_token"},
            raise_for_status=lambda: None,
        )

        mock_request.return_value = MagicMock(
            json=lambda: {"data": {"balance": "1500.50"}},
            is_success=True,
        )

        async with VTUClient() as client:
            balance = await client.check_balance()
            assert balance == 1500.50


@pytest.mark.asyncio
async def test_vtu_buy_airtime(mock_settings):
    """Test buying airtime."""
    from utils.vtu import VTUClient

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post, \
         patch.object(httpx.AsyncClient, "request", new_callable=AsyncMock) as mock_request:

        mock_post.return_value = MagicMock(
            json=lambda: {"token": "test_token"},
            raise_for_status=lambda: None,
        )

        mock_request.return_value = MagicMock(
            json=lambda: {"status": "success", "message": "Airtime sent"},
            is_success=True,
        )

        async with VTUClient() as client:
            result = await client.buy_airtime("mtn", 100, "08012345678")
            assert result["status"] == "success"


@pytest.mark.asyncio
async def test_vtu_invalid_network(mock_settings):
    """Test that invalid network raises error."""
    from utils.vtu import VTUClient, VTUError

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = MagicMock(
            json=lambda: {"token": "test_token"},
            raise_for_status=lambda: None,
        )

        async with VTUClient() as client:
            with pytest.raises(VTUError, match="Invalid network"):
                await client.buy_airtime("invalid_network", 100, "08012345678")


def test_vtu_missing_credentials():
    """Test that missing credentials raises error."""
    from utils.vtu import VTUClient, VTUError

    with patch("utils.vtu.settings") as mock:
        mock.get_vtu_credentials = lambda: []

        with pytest.raises(VTUError, match="No VTU credentials"):
            VTUClient()


@pytest.mark.asyncio
async def test_vtu_credential_rotation(mock_multi_credentials):
    """Test that credentials rotate on auth failure."""
    from utils.vtu import VTUClient
    import httpx

    call_count = 0

    async def mock_post(url, **kwargs):
        nonlocal call_count
        call_count += 1
        
        if call_count < 3:
            # First two credentials fail
            error = httpx.HTTPStatusError(
                "Auth failed",
                request=MagicMock(),
                response=MagicMock(status_code=401),
            )
            raise error
        else:
            # Third credential succeeds
            return MagicMock(
                json=lambda: {"token": "valid_token"},
                raise_for_status=lambda: None,
            )

    with patch.object(httpx.AsyncClient, "post", side_effect=mock_post):
        async with VTUClient() as client:
            assert client._token == "valid_token"
            assert call_count == 3  # Two failures + one success


@pytest.mark.asyncio
async def test_vtu_all_credentials_exhausted(mock_multi_credentials):
    """Test error when all credentials are exhausted."""
    from utils.vtu import VTUClient, VTUCredentialsExhausted
    import httpx

    async def mock_post(url, **kwargs):
        error = httpx.HTTPStatusError(
            "Auth failed",
            request=MagicMock(),
            response=MagicMock(status_code=401),
        )
        raise error

    with patch.object(httpx.AsyncClient, "post", side_effect=mock_post):
        with pytest.raises(VTUCredentialsExhausted, match="All VTU credentials exhausted"):
            async with VTUClient() as client:
                pass

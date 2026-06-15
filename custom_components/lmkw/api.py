"""Lmkw REST client."""

from __future__ import annotations

import aiohttp


class LmkwApiError(Exception):
    """Base API error."""


class LmkwAuthError(LmkwApiError):
    """401/403 from API."""


class LmkwApiClient:
    """Minimal client for GET /api/v1/watches."""

    def __init__(self, base_url: str, api_token: str, session: aiohttp.ClientSession) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_token = api_token.strip()
        self._session = session

    async def async_get_watches(self) -> list[dict]:
        url = f"{self._base_url}/api/v1/watches"
        headers = {"Authorization": f"Bearer {self._api_token}"}
        async with self._session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=30)) as resp:
            body = await resp.json(content_type=None)
            if resp.status == 401:
                raise LmkwAuthError(body.get("error", "Invalid API token"))
            if resp.status == 403 and body.get("code") == "subscription_required":
                raise LmkwAuthError("Premium or Ultra subscription required")
            if resp.status >= 400:
                raise LmkwApiError(body.get("error", f"HTTP {resp.status}"))
            if not body.get("ok"):
                raise LmkwApiError(body.get("error", "Unknown API error"))
            watches = body.get("watches")
            if not isinstance(watches, list):
                raise LmkwApiError("Malformed watches payload")
            return watches

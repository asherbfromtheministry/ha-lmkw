"""JavaScript module registration for bundled Lovelace card."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from ..const import JSMODULES, URL_BASE

_LOGGER = logging.getLogger(__name__)


class JSModuleRegistration:
    """Serve and register frontend card resources."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.lovelace = hass.data.get("lovelace")

    async def async_register(self) -> None:
        await self._async_register_path()
        lovelace = self.lovelace
        if lovelace is not None and getattr(lovelace, "mode", "yaml") == "storage":
            await self._async_register_resources()

    async def _async_register_path(self) -> None:
        await self.hass.http.async_register_static_paths(
            [StaticPathConfig(URL_BASE, Path(__file__).parent, False)]
        )

    async def _async_register_resources(self) -> None:
        for module in JSMODULES:
            url = f"{URL_BASE}/{module['filename']}?v={module['version']}"
            resource = {"type": "module", "url": url}
            existing = await self.lovelace.async_get_resources()
            prefix = f"{URL_BASE}/{module['filename']}"
            stale = [r for r in existing if r.get("url", "").startswith(prefix)]

            if any(r.get("url") == url for r in existing):
                for old in stale:
                    if old.get("url") != url:
                        await self.lovelace.async_delete_resource(old["id"])
                continue

            if stale:
                await self.lovelace.async_update_resource(stale[0]["id"], resource)
                for old in stale[1:]:
                    await self.lovelace.async_delete_resource(old["id"])
                _LOGGER.debug("Updated Lovelace resource for %s to %s", module["filename"], url)
                continue

            await self.lovelace.async_add_resource(resource)

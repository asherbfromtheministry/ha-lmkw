"""Data update coordinator."""

from __future__ import annotations

from datetime import timedelta
import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import LmkwApiClient, LmkwApiError, LmkwAuthError
from .const import UPDATE_INTERVAL_SECONDS

_LOGGER = logging.getLogger(__name__)


class LmkwDataUpdateCoordinator(DataUpdateCoordinator[list[dict[str, Any]]]):
    """Fetch watches from Lmkw."""

    def __init__(self, hass: HomeAssistant, client: LmkwApiClient) -> None:
        super().__init__(
            hass,
            _LOGGER,
            name="lmkw",
            update_interval=timedelta(seconds=UPDATE_INTERVAL_SECONDS),
        )
        self.client = client

    async def _async_update_data(self) -> list[dict[str, Any]]:
        try:
            return await self.client.async_get_watches()
        except LmkwAuthError as err:
            raise UpdateFailed(str(err)) from err
        except LmkwApiError as err:
            raise UpdateFailed(str(err)) from err

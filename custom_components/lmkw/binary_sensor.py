"""Binary sensor for update_found status."""

from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import LmkwDataUpdateCoordinator


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities,
) -> None:
    coordinator: LmkwDataUpdateCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        LmkwWatchUpdateBinary(coordinator, watch) for watch in (coordinator.data or [])
    )


class LmkwWatchUpdateBinary(CoordinatorEntity[LmkwDataUpdateCoordinator], BinarySensorEntity):
    """On when Lmkw reports update_found."""

    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_has_entity_name = True
    _attr_icon = "mdi:bell-ring"
    _attr_name = "Update found"

    def __init__(self, coordinator: LmkwDataUpdateCoordinator, watch: dict) -> None:
        super().__init__(coordinator)
        self._watch_id = int(watch["id"])
        self._attr_unique_id = f"lmkw_watch_{self._watch_id}_update"
        self._apply(watch)

    def _apply(self, watch: dict) -> None:
        self._attr_is_on = watch.get("status") == "update_found"

    def _handle_coordinator_update(self) -> None:
        for watch in self.coordinator.data or []:
            if int(watch.get("id", -1)) == self._watch_id:
                self._apply(watch)
                break
        super()._handle_coordinator_update()

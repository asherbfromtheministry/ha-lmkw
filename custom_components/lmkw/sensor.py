"""Sensor platform for Lmkw watches."""

from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
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
        LmkwWatchSensor(coordinator, watch) for watch in (coordinator.data or [])
    )


class LmkwWatchSensor(CoordinatorEntity[LmkwDataUpdateCoordinator], SensorEntity):
    """One sensor per Lmkw watch."""

    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_has_entity_name = True
    _attr_icon = "mdi:eye"

    @staticmethod
    def _format_facts(facts: list) -> str | None:
        lines: list[str] = []
        for item in facts:
            if not isinstance(item, dict):
                continue
            label = str(item.get("label") or "").strip()
            value = str(item.get("value") or "").strip()
            if label and value:
                lines.append(f"{label}: {value}")
        return "\n".join(lines) if lines else None

    @staticmethod
    def _format_sources(sources: list) -> str | None:
        lines: list[str] = []
        for item in sources:
            if not isinstance(item, dict):
                continue
            title = str(item.get("title") or "").strip()
            url = str(item.get("url") or "").strip()
            if title and url:
                lines.append(f"{title} ({url})")
            elif url:
                lines.append(url)
            elif title:
                lines.append(title)
        return "\n".join(lines) if lines else None

    def __init__(self, coordinator: LmkwDataUpdateCoordinator, watch: dict) -> None:
        super().__init__(coordinator)
        self._watch_id = int(watch["id"])
        title = watch.get("displayTitle") or watch.get("queryText") or f"Watch {self._watch_id}"
        self._attr_name = str(title)[:128]
        self._attr_unique_id = f"lmkw_watch_{self._watch_id}"
        self._apply(watch)

    def _apply(self, watch: dict) -> None:
        self._attr_native_value = watch.get("status")
        latest = watch.get("latestFromWeb") or {}
        facts = latest.get("facts") if isinstance(latest.get("facts"), list) else []
        sources = latest.get("sources") if isinstance(latest.get("sources"), list) else []
        summary = latest.get("summary")
        facts_display = self._format_facts(facts)
        sources_display = self._format_sources(sources)
        report_parts: list[str] = []
        if summary:
            report_parts.append(str(summary).strip())
        if facts_display:
            report_parts.append(facts_display)
        if sources_display:
            report_parts.append(sources_display)
        self._attr_extra_state_attributes = {
            "display_title": watch.get("displayTitle"),
            "query_text": watch.get("queryText"),
            "last_checked_at": watch.get("lastCheckedAt"),
            "updated_at": watch.get("updatedAt"),
            "is_community": watch.get("isCommunity"),
            "viewer_role": watch.get("viewerRole"),
            "tags": watch.get("tags") or [],
            "url": watch.get("url"),
            "watch_id": self._watch_id,
            "latest_summary": summary,
            "latest_detected_at": latest.get("detectedAt"),
            "latest_significant_update": latest.get("significantUpdate"),
            "latest_facts": facts,
            "latest_sources": sources,
            "latest_facts_display": facts_display,
            "latest_sources_display": sources_display,
            "ranger_report": "\n\n".join(report_parts) if report_parts else None,
        }

    def _handle_coordinator_update(self) -> None:
        for watch in self.coordinator.data or []:
            if int(watch.get("id", -1)) == self._watch_id:
                self._apply(watch)
                break
        super()._handle_coordinator_update()

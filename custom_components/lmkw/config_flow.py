"""Config flow for Let Me Know When."""

from __future__ import annotations

import logging
from typing import Any

import aiohttp
import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import LmkwApiClient, LmkwApiError, LmkwAuthError
from .const import CONF_API_TOKEN, CONF_BASE_URL, DEFAULT_BASE_URL, DOMAIN

_LOGGER = logging.getLogger(__name__)

STEP_USER_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_BASE_URL, default=DEFAULT_BASE_URL): str,
        vol.Required(CONF_API_TOKEN): str,
    }
)


class LmkwConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle config flow."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            base_url = user_input[CONF_BASE_URL].strip().rstrip("/")
            token = user_input[CONF_API_TOKEN].strip()
            session = async_get_clientsession(self.hass)
            client = LmkwApiClient(base_url, token, session)
            try:
                await client.async_get_watches()
            except LmkwAuthError as err:
                msg = str(err).lower()
                if "subscription" in msg:
                    errors["base"] = "subscription_required"
                else:
                    errors["base"] = "invalid_auth"
            except LmkwApiError:
                errors["base"] = "cannot_connect"
            except aiohttp.ClientError:
                errors["base"] = "cannot_connect"
            except Exception:  # noqa: BLE001
                _LOGGER.exception("Unexpected error validating Lmkw token")
                errors["base"] = "unknown"
            else:
                await self.async_set_unique_id(token[:24])
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title="Let Me Know When",
                    data={CONF_BASE_URL: base_url, CONF_API_TOKEN: token},
                )

        return self.async_show_form(
            step_id="user",
            data_schema=STEP_USER_SCHEMA,
            errors=errors,
        )

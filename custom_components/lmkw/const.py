"""Constants for the Let Me Know When integration."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Final

DOMAIN: Final = "lmkw"
CONF_BASE_URL: Final = "base_url"
CONF_API_TOKEN: Final = "api_token"

DEFAULT_BASE_URL: Final = "https://letmeknowwhen.net"
UPDATE_INTERVAL_SECONDS: Final = 600

MANIFEST_PATH = Path(__file__).parent / "manifest.json"
with MANIFEST_PATH.open(encoding="utf-8") as _f:
    INTEGRATION_VERSION: Final = json.load(_f).get("version", "0.0.0")

URL_BASE: Final = "/lmkw"
JSMODULES: Final = [
    {
        "name": "Let Me Know When Watches",
        "filename": "lmkw-watches-card.js",
        "version": INTEGRATION_VERSION,
    }
]

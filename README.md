# Let Me Know When — Home Assistant

[![Validate](https://github.com/asherbfromtheministry/ha-lmkw/actions/workflows/validate.yaml/badge.svg)](https://github.com/asherbfromtheministry/ha-lmkw/actions/workflows/validate.yaml)

Home Assistant integration for [Let Me Know When](https://letmeknowwhen.net) (Lmkw). Shows your watches on a Lovelace dashboard and exposes per-watch entities for automations.

**Premium or Ultra required.** Free accounts cannot create API tokens.

## Install

### HACS (recommended)

**Default store (after listing):** HACS → Integrations → search **Let Me Know When** → Download → restart Home Assistant.

**Until listed in the default store**, add as a custom repository once:

1. HACS → Integrations → ⋮ → **Custom repositories**
2. URL: `https://github.com/asherbfromtheministry/ha-lmkw`
3. Category: **Integration** → Add
4. Search **Let Me Know When** → Download
5. Restart Home Assistant

### Manual

Copy `custom_components/lmkw` into your Home Assistant `config/custom_components/lmkw` directory, then restart.

## Setup

1. In Lmkw, open **Account settings → Home Assistant** (Premium/Ultra only).
2. Create an API token and copy it once.
3. In Home Assistant: **Settings → Devices & services → Add integration → Let Me Know When**
   - **Site URL** — e.g. `https://letmeknowwhen.net`
   - **API token** — the `lmkw_pat_…` value from settings

The integration polls your watches every 10 minutes.

## Entities

| Entity | Description |
|--------|-------------|
| `sensor.lmkw_watch_<id>` | Title, status, last checked, link, **latest from the web** (summary, facts, sources), plus **`ranger_report`** / **`latest_facts_display`** for readable entity attributes |
| `binary_sensor.lmkw_watch_<id>_update` | On when status is `update_found` |

## Lovelace card

Bundled card type: `custom:lmkw-watches` (registers automatically in storage-mode Lovelace). The card uses the same **traffic-light colours** as [letmeknowwhen.net](https://letmeknowwhen.net): **blue** = update found, **green** = monitoring, **amber** = postponed, **red** = dismissed.

```yaml
type: custom:lmkw-watches
integration: lmkw
max_items: 20
```

Each watch tile shows title, tags, status pill, last-checked time, and a link to the watch on Lmkw. Updates sort to the top.

## For maintainers

- HACS default submission checklist: [HACS_DEFAULT.md](./HACS_DEFAULT.md)
- Optional [home-assistant/brands](https://github.com/home-assistant/brands) assets: `brands-submission/`

## License

MIT — see [LICENSE](./LICENSE).

# Let Me Know When — Home Assistant

Home Assistant integration for [Let Me Know When](https://letmeknowwhen.net) (Lmkw). Shows your watches on a Lovelace dashboard and exposes per-watch entities for automations.

**Premium or Ultra required.** Free accounts cannot create API tokens or use `/api/v1/watches`.

## Publish this repo to GitHub (maintainers)

This folder is a **standalone HACS integration repo**. Layout must stay:

```
hacs.json
README.md
custom_components/lmkw/
```

Recommended GitHub repo name: **`ha-lmkw`** (public).

### 1. Create an empty repo on GitHub

1. Open [github.com/new](https://github.com/new)
2. **Repository name:** `ha-lmkw`
3. **Public**
4. Do **not** add README, `.gitignore`, or license (this folder already has them)
5. Click **Create repository**

### 2. Push from your PC

In PowerShell, from **this folder** (`home-assistant/`):

```powershell
cd c:\temp\lmkw\home-assistant
git init
git add .
git commit -m "Initial Let Me Know When Home Assistant integration"
git branch -M main
git remote add origin https://github.com/asherbfromtheministry/ha-lmkw.git
git push -u origin main
```

### 3. Optional: first release

On GitHub: **Releases → Create a new release →** tag `v0.1.0`. HACS can install from the default branch without releases, but tags make upgrades clearer.

---

## Install (users)

### Via HACS custom repository

1. **HACS → ⋮ → Custom repositories**
2. URL: `https://github.com/asherbfromtheministry/ha-lmkw`
3. Category: **Integration** → **Add**
4. **HACS → Integrations →** search **Let Me Know When** → **Download**
5. Restart Home Assistant
6. **Settings → Devices & Services → Add integration → Let Me Know When**

### Manual

1. Copy `custom_components/lmkw` into Home Assistant `config/custom_components/lmkw`
2. Restart Home Assistant
3. Add the integration

---

## Setup

1. In Lmkw, open **Account settings → Home Assistant** (Premium/Ultra only)
2. Create an API token and copy it once
3. In Home Assistant, add the integration:
   - **Site URL** — e.g. `https://letmeknowwhen.net`
   - **API token** — the `lmkw_pat_…` value from settings

The integration polls `GET /api/v1/watches` every 10 minutes.

## Entities

| Entity | Description |
|--------|-------------|
| `sensor.lmkw_watch_<id>` | Title, status, last checked, link URL |
| `binary_sensor.lmkw_watch_<id>_update` | On when status is `update_found` |

## Lovelace card

Bundled card type: `custom:lmkw-watches` (registers automatically in storage-mode Lovelace).

```yaml
type: custom:lmkw-watches
integration: lmkw
max_items: 20
```

## Brand icon

Icons live at `custom_components/lmkw/brand/` (`icon.png`, `dark_icon.png`, `logo.png`). **Optional:** Home Assistant **2026.3+** serves these locally. On older HA versions the integration still works; the settings icon may show a generic placeholder because `lmkw` is not on the global brands CDN.

If you see **“icon not available”** on an older Home Assistant version, that is cosmetic only — you do not need to upgrade HA unless you want the elephant icon in the UI.

## Lmkw server database

Users need the `user_api_token` table on the Lmkw server. SQL: `scripts/add-user-api-tokens.sql` in the main [lmkw](https://github.com/ashleybaker75/lmkw) app repo.

## License

Same as the parent Lmkw project.

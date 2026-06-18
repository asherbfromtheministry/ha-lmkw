# Deploy — Home Assistant integration (ha-lmkw)

**Read this before shipping any HA / Lovelace / `custom_components/lmkw` change.**

This folder is a **separate Git repository** from the main Lmkw app. It is **not** included in `deploy.zip` and **must not** be deployed to HostArmada.

| What | Repository / path | How users get it |
|------|-------------------|------------------|
| **This integration** (card, Python, HACS) | `home-assistant/` → [github.com/asherbfromtheministry/ha-lmkw](https://github.com/asherbfromtheministry/ha-lmkw) | HACS → **Let Me Know When** → Update → **restart HA** |
| **Main Lmkw web app + API** | Repo root `c:\temp\lmkw` → `letmeknowwhen.net` | `npm run deploy:zip` (see parent `DEPLOY-SERVER.md`) |

When a feature touches **both** (e.g. card reads a new API field), ship **two deploys** in the right order:

1. **Production API first** (if the integration depends on new JSON from `/api/v1/…`)
2. **ha-lmkw release second** (integration + card)

---

## Agent / maintainer checklist (ha-lmkw)

Work **only** inside `home-assistant/` (this repo). Remote: `origin` → `https://github.com/asherbfromtheministry/ha-lmkw.git`.

### 1. Bump version

Edit **`custom_components/lmkw/manifest.json`** → `"version"` (semver, e.g. `0.1.14`).  
Tag name must match: **`v0.1.14`**.

### 2. Commit and push `main`

```powershell
cd c:\temp\lmkw\home-assistant
git status
git add -A
git commit -m "Short description of change (v0.1.14)."
git push origin main
```

### 3. Tag **and** GitHub Release (both required)

**HACS uses GitHub Releases, not git tags alone.**  
Pushing only `git tag v0.1.14` leaves HACS stuck on the previous release (e.g. “Version v0.1.12 will be downloaded”).

```powershell
git tag v0.1.14
git push origin v0.1.14
gh release create v0.1.14 --title "0.1.14" --notes "One-line summary for users."
```

If `gh` is not authenticated: GitHub → **Releases** → **Draft a new release** → choose existing tag `v0.1.14` → **Publish release**.

Verify: [github.com/asherbfromtheministry/ha-lmkw/releases](https://github.com/asherbfromtheministry/ha-lmkw/releases) shows the new version at the top.

### 4. CI

Confirm **Actions → Validate** is green on `main` (HACS + hassfest).

### 5. On Home Assistant (after release)

1. HACS → Integrations → **Let Me Know When** → **Update** (should offer the new release version).
2. **Restart Home Assistant** (`custom_components` changes require a full restart).
3. If the release adds new entities (e.g. `sensor.lmkw_account`): **Settings → Devices & services → Let Me Know When → Reload**.
4. Hard-refresh the Lovelace dashboard (card JS is cached in the browser).

---

## Do **not** do this for HA integration work

| Wrong | Why |
|-------|-----|
| `npm run deploy:zip` from repo root | Ships the **web app**, not HACS integration |
| SSH / FTP extract on `letmeknowwhen.net` | Production host; unrelated to HA install path `/config/custom_components/lmkw` |
| Push tag without **GitHub Release** | HACS UI keeps showing the old release version |
| Edit `_lmkw-watches-trim.js` / scratch files at repo root | Canonical card is **`custom_components/lmkw/frontend/lmkkw-watches-card.js`** here only |
| Assume `home-assistant/` is the same git repo as the main app | It has its **own** `.git`; commits here do not land on the main app unless copied manually |

---

## When the main app (`letmeknowwhen.net`) must also deploy

Deploy production **only** when HA changes depend on server-side behaviour, for example:

- New or changed fields on **`GET /api/v1/watches`** (`src/lib/server/watches-api.ts`, `src/routes/api/v1/watches/+server.ts`)
- New API routes the integration will call
- Static assets served under **`/lmkw/…`** that the card loads from the Lmkw site (unusual; most assets are bundled in this repo)

For those changes: run **`npm run deploy:zip`** from **`c:\temp\lmkw`** (parent repo), then complete host steps in **`DEPLOY-SERVER.md`**. That is **independent** of the ha-lmkw release above.

Card-only or Python-only changes in **`custom_components/lmkw/`** → **ha-lmkw release only**, no production zip.

---

## Release notes template

```markdown
Brief user-facing summary.

- Bullet for card / entity changes
- Mention restart HA after update
- Mention reload integration if new entities
```

---

## Related docs

- User install: [README.md](./README.md)
- HACS default store submission: [HACS_DEFAULT.md](./HACS_DEFAULT.md)
- Main app production deploy: `../DEPLOY-SERVER.md` (parent repo)

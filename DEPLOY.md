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

## Definition of done (agents)

A ha-lmkw deploy is **not finished** until **all** of the following are true. Do **not** stop early or ask the user to publish anything.

- [ ] `manifest.json` version bumped
- [ ] Changes committed and **pushed to `origin/main`**
- [ ] Git tag **`vX.Y.Z`** pushed
- [ ] **GitHub Release published** for that tag (HACS reads Releases, not tags alone)
- [ ] Verified latest release at [github.com/asherbfromtheministry/ha-lmkw/releases](https://github.com/asherbfromtheministry/ha-lmkw/releases)

**Never** tell the user to run `gh release create`, open the GitHub Releases UI, or “publish when you get a chance”. **You** publish the release as part of the same task.

If the user says **deploy**, **release**, **ship**, or **publish** for HA work, run the full checklist below yourself.

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

### 3. Tag, push tag, **publish GitHub Release** (all three)

**HACS uses GitHub Releases, not git tags alone.**  
Pushing only `git tag v0.1.14` leaves HACS stuck on the previous release (e.g. “Version v0.1.12 will be downloaded”).

```powershell
cd c:\temp\lmkw\home-assistant
$ver = "0.1.14"          # must match manifest.json
$tag = "v$ver"

git tag $tag
git push origin $tag
```

Then **publish the Release** (required — do not skip):

**Option A — `gh` (if logged in):**

```powershell
gh release create $tag --title $ver --notes "User-facing release notes."
```

**Option B — GitHub API via git credential helper (if `gh` is not logged in):**  
Use the same credentials that already work for `git push`. Run this yourself; do not delegate to the user.

```powershell
$ver = "0.1.14"
$tag = "v$ver"
$notes = @"
Brief user-facing summary.

- Bullet for card / entity changes
- Restart Home Assistant after update
- Reload integration if new entities
"@

$stdin = "protocol=https`nhost=github.com`n`n"
$credOutput = $stdin | git credential fill 2>$null
$token = ($credOutput | Where-Object { $_ -match '^password=' }) -replace '^password=',''
if (-not $token) { throw 'No GitHub token from git credential helper — fix git auth, do not ask the user to publish manually.' }

$headers = @{
  Authorization = "Bearer $token"
  Accept = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
}
$payload = @{
  tag_name = $tag
  name = $ver
  body = $notes
  draft = $false
  prerelease = $false
} | ConvertTo-Json

try {
  $r = Invoke-RestMethod -Uri 'https://api.github.com/repos/asherbfromtheministry/ha-lmkw/releases' `
    -Method Post -Headers $headers -Body $payload -ContentType 'application/json'
  Write-Output "Published release $($r.tag_name) at $($r.html_url)"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 422) {
    Write-Output "Release $tag already exists — verify it is published (not draft)."
  } else { throw }
}
```

**Verify:** GET [latest release API](https://api.github.com/repos/asherbfromtheministry/ha-lmkw/releases/latest) shows your tag, or open the releases page and confirm the new version is **Published** (not draft).

### 4. CI

Confirm **Actions → Validate** is green on `main` (HACS + hassfest).

### 5. On Home Assistant (optional — agent may do via HA MCP)

If the user’s Home Assistant is reachable (HA MCP):

1. HACS update **`asherbfromtheministry/ha-lmkw`** to the new version
2. **Restart Home Assistant**
3. **Reload** the Lmkw integration if new entities were added
4. Tell the user to hard-refresh the Lovelace dashboard (browser cache)

If HA MCP is unavailable, say the GitHub release is live and HACS will show the new version after cache refresh — **do not** substitute “you publish the release” for step 3 above.

---

## Do **not** do this for HA integration work

| Wrong | Why |
|-------|-----|
| `npm run deploy:zip` from repo root | Ships the **web app**, not HACS integration |
| SSH / FTP extract on `letmeknowwhen.net` | Production host; unrelated to HA install path `/config/custom_components/lmkw` |
| Push tag without **GitHub Release** | HACS UI keeps showing the old release version |
| Stop after `git push` and tell the user to publish | **Your job** — see Definition of done |
| Edit `_lmkw-watches-trim.js` / scratch files at repo root | Canonical card is **`custom_components/lmkw/frontend/lmkw-watches-card.js`** here only |
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
- Restart Home Assistant after update
- Reload integration if new entities
```

---

## Related docs

- User install: [README.md](./README.md)
- HACS default store submission: [HACS_DEFAULT.md](./HACS_DEFAULT.md)
- Main app production deploy: `../DEPLOY-SERVER.md` (parent repo)

# HACS default store submission

Use this checklist after CI passes on `main`.

## Repository requirements

- [x] Public repo: https://github.com/asherbfromtheministry/ha-lmkw
- [x] `hacs.json` at repo root
- [x] Integration under `custom_components/lmkw/`
- [x] `custom_components/lmkw/brand/icon.png`
- [x] `LICENSE` file
- [x] `.github/workflows/validate.yaml` (HACS + hassfest)
- [ ] GitHub **description** set (see below)
- [ ] GitHub **topics** set (see below)
- [ ] **Issues** enabled on the repo
- [ ] At least one **GitHub Release** published (not tag-only)

### Suggested GitHub description

```
Polls the Lmkw API and exposes your watches as Home Assistant sensors, with a bundled Lovelace card. Requires Premium or Ultra.
```

### Suggested topics

`home-assistant`, `hacs`, `hacs-integration`, `integration`, `letmeknowwhen`, `lmkw`

## Submit to hacs/default

1. Confirm **Actions → Validate** is green on `main` (both HACS and hassfest jobs).
2. Create **Release** `v0.1.5` (or latest version) from `main`.
3. Fork https://github.com/hacs/default
4. Create a branch from `master` (not `main`).
5. Add this line to the **`integration`** file in **alphabetical** order:

   ```
   https://github.com/asherbfromtheministry/ha-lmkw
   ```

   Insert between other `ha-` repos (after `ha-…` entries starting with letters before `lmkw`, before entries after `lmkw` alphabetically).

6. Open a PR using the template. Fill every field accurately.
7. Mark **Ready for review** when CI on your repo is green.

Official docs: [Include default repositories](https://www.hacs.xyz/docs/publish/include/)

## Important notes

- **PR author:** HACS requires the PR from a **personal** account that owns or is a major contributor to the repo. If `asherbfromtheministry` is an organization, open the PR from your personal GitHub user instead.
- **Review time:** Default-list PRs often wait **months** in the backlog. Until merged, users install via **HACS → Custom repositories** (documented in README).
- **Brands CDN:** Optional separate PR to [home-assistant/brands](https://github.com/home-assistant/brands) using files in `brands-submission/`. Not required for HACS default listing if `brand/icon.png` exists in this repo.

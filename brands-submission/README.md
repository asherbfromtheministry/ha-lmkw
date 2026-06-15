# home-assistant/brands submission (optional)

For the elephant icon on **any** Home Assistant version (including before 2026.3), add these files to [home-assistant/brands](https://github.com/home-assistant/brands) at:

```
custom_integrations/lmkw/icon.png
custom_integrations/lmkw/dark_icon.png
custom_integrations/lmkw/logo.png
```

Copy from this folder’s `custom_integrations/lmkw/` into a fork of `home-assistant/brands`, then open a PR.

HA serves them at `https://brands.home-assistant.io/_/lmkw/icon.png` — that is what Settings → Integrations uses on older cores.

Note: new custom-integration brand PRs may be auto-closed by the brands bot; if so, the inline `custom_components/lmkw/brand/` folder still helps on HA 2026.3+.

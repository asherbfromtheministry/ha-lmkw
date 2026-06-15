class LmkwWatchesCard extends HTMLElement {
  static getStubConfig() {
    return { type: "custom:lmkw-watches", integration: "lmkw", max_items: 20 };
  }

  setConfig(config) {
    this._config = { max_items: 20, ...config };
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 4;
  }

  _render() {
    if (!this._hass) return;
    const max = Number(this._config?.max_items) || 20;
    const watches = Object.values(this._hass.states)
      .filter((s) => s.entity_id.startsWith("sensor.lmkw_watch_") && !s.entity_id.endsWith("_update"))
      .slice(0, max);

    const statusClass = (status) => {
      if (status === "update_found") return "lmkw-status--update";
      if (status === "postponed") return "lmkw-status--postponed";
      if (status === "dismissed") return "lmkw-status--dismissed";
      return "lmkw-status--monitoring";
    };

    this.innerHTML = `
      <ha-card header="Let Me Know When">
        <div class="lmkw-list">
          ${
            watches.length
              ? watches
                  .map((s) => {
                    const title =
                      s.attributes.display_title ||
                      s.attributes.query_text ||
                      s.attributes.friendly_name ||
                      s.entity_id;
                    const url = s.attributes.url || "#";
                    const status = s.state || "monitoring";
                    return `<a class="lmkw-row" href="${url}" target="_blank" rel="noopener">
                      <span class="lmkw-title">${title}</span>
                      <span class="lmkw-status ${statusClass(status)}">${status.replace("_", " ")}</span>
                    </a>`;
                  })
                  .join("")
              : `<p class="lmkw-empty">No watches yet. Add the integration and wait for the first sync.</p>`
          }
        </div>
      </ha-card>
    `;

    if (!this._styleAttached) {
      this._styleAttached = true;
      const style = document.createElement("style");
      style.textContent = `
        .lmkw-list { padding: 0.5rem 0.75rem 0.85rem; display: grid; gap: 0.45rem; }
        .lmkw-row {
          display: flex; justify-content: space-between; gap: 0.75rem; align-items: center;
          padding: 0.55rem 0.65rem; border-radius: 0.45rem; text-decoration: none; color: inherit;
          border: 1px solid rgba(127,127,127,0.25);
        }
        .lmkw-row:hover { background: rgba(127,127,127,0.08); }
        .lmkw-title { font-weight: 600; font-size: 0.92rem; line-height: 1.3; }
        .lmkw-status {
          font-size: 0.72rem; text-transform: capitalize; padding: 0.15rem 0.45rem;
          border-radius: 999px; white-space: nowrap;
        }
        .lmkw-status--update { background: #fde68a; color: #713f12; }
        .lmkw-status--monitoring { background: #d1fae5; color: #065f46; }
        .lmkw-status--postponed { background: #dbeafe; color: #1e40af; }
        .lmkw-status--dismissed { background: #e5e7eb; color: #374151; }
        .lmkw-empty { margin: 0; opacity: 0.75; font-size: 0.88rem; }
      `;
      this.appendChild(style);
    }
  }
}

customElements.define("lmkw-watches-card", LmkwWatchesCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "lmkw-watches",
  name: "Let Me Know When Watches",
  description: "Your Lmkw watches with status pills",
  preview: true,
});

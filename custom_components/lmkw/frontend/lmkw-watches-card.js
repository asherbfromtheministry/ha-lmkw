class LmkwWatchesCard extends HTMLElement {
  static getStubConfig() {
    return { type: "custom:lmkw-watches", integration: "lmkw", max_items: 20 };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = { max_items: 20 };
    this._hass = null;
  }

  setConfig(config) {
    this._config = { max_items: 20, ...config };
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    const count = this._watches()?.length || 0;
    return Math.max(3, Math.min(12, 2 + count * 2));
  }

  _watches() {
    if (!this._hass) return [];
    const max = Number(this._config?.max_items) || 20;
    return Object.values(this._hass.states)
      .filter((s) => s.entity_id.startsWith("sensor.") && s.attributes?.watch_id != null)
      .sort((a, b) => {
        const rank = (s) => (s.state === "update_found" ? 0 : s.state === "postponed" ? 1 : 2);
        const d = rank(a) - rank(b);
        if (d !== 0) return d;
        const ta = Date.parse(a.attributes?.updated_at || 0);
        const tb = Date.parse(b.attributes?.updated_at || 0);
        return tb - ta;
      })
      .slice(0, max);
  }

  _escape(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  _relTime(iso) {
    if (!iso) return "";
    const ms = Date.now() - Date.parse(iso);
    if (Number.isNaN(ms)) return "";
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 48) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  _statusMeta(status) {
    switch (status) {
      case "update_found":
        return {
          label: "Update found",
          cls: "status--hit",
          icon: "mdi:bell-ring-outline",
          accent: "#fbbf24",
        };
      case "postponed":
        return {
          label: "Snoozed",
          cls: "status--snooze",
          icon: "mdi:clock-outline",
          accent: "#60a5fa",
        };
      case "dismissed":
        return {
          label: "Dismissed",
          cls: "status--muted",
          icon: "mdi:archive-outline",
          accent: "#94a3b8",
        };
      default:
        return {
          label: "Watching",
          cls: "status--watch",
          icon: "mdi:radar",
          accent: "#34d399",
        };
    }
  }

  _summarySnippet(summary, maxLen = 120) {
    const text = String(summary ?? "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen - 1).trim()}…`;
  }

  _renderWatch(s) {
    const title =
      s.attributes.display_title ||
      s.attributes.query_text ||
      s.attributes.friendly_name ||
      s.entity_id;
    const url = s.attributes.url || "#";
    const status = s.state || "monitoring";
    const meta = this._statusMeta(status);
    const checked = this._relTime(s.attributes.last_checked_at);
    const tags = Array.isArray(s.attributes.tags) ? s.attributes.tags.slice(0, 3) : [];
    const summary = this._summarySnippet(s.attributes.latest_summary);
    const hasHit = status === "update_found";

    const tagHtml = tags.length
      ? `<div class="tags">${tags.map((t) => `<span class="tag">${this._escape(t)}</span>`).join("")}</div>`
      : "";

    const insightHtml = summary
      ? `<p class="insight">${this._escape(summary)}</p>`
      : hasHit
        ? `<p class="insight insight--pulse">Fresh signal detected — open for details</p>`
        : "";

    return `
      <a class="watch ${hasHit ? "watch--hit" : ""}" href="${this._escape(url)}" target="_blank" rel="noopener" style="--watch-accent:${meta.accent}">
        <div class="watch-accent" aria-hidden="true"></div>
        <div class="watch-body">
          <div class="watch-top">
            <div class="watch-icon-wrap">
              <ha-icon icon="${meta.icon}"></ha-icon>
              ${hasHit ? '<span class="watch-pulse" aria-hidden="true"></span>' : ""}
            </div>
            <div class="watch-copy">
              <h3 class="watch-title">${this._escape(title)}</h3>
              ${tagHtml}
            </div>
            <div class="watch-status ${meta.cls}">
              <span class="status-dot"></span>
              <span>${this._escape(meta.label)}</span>
            </div>
          </div>
          ${insightHtml}
          <div class="watch-foot">
            <span class="watch-time">${checked ? `Checked ${this._escape(checked)}` : "Awaiting sync"}</span>
            <span class="watch-open">Open <ha-icon icon="mdi:arrow-top-right"></ha-icon></span>
          </div>
        </div>
      </a>`;
  }

  _render() {
    if (!this._hass) return;
    const watches = this._watches();
    const updates = watches.filter((w) => w.state === "update_found").length;
    const subtitle =
      watches.length === 0
        ? "Your personal signal desk"
        : updates > 0
          ? `${updates} live update${updates === 1 ? "" : "s"} · ${watches.length} watch${watches.length === 1 ? "" : "es"}`
          : `${watches.length} watch${watches.length === 1 ? "" : "es"} on patrol`;

    const listHtml = watches.length
      ? `<div class="watch-grid">${watches.map((w) => this._renderWatch(w)).join("")}</div>`
      : `
        <div class="empty">
          <div class="empty-orbit" aria-hidden="true">
            <span class="ring ring-1"></span>
            <span class="ring ring-2"></span>
            <span class="ring ring-3"></span>
            <ha-icon icon="mdi:eye-outline"></ha-icon>
          </div>
          <p class="empty-title">No watches yet</p>
          <p class="empty-text">Connect Let Me Know When and your watches will appear here with live status.</p>
        </div>`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          --lmkw-gold: #fbbf24;
          --lmkw-teal: #34d399;
          --lmkw-sky: #64b5f6;
          --lmkw-ink: #e8edf5;
          --lmkw-muted: rgba(232, 237, 245, 0.62);
          --lmkw-glass: rgba(12, 18, 28, 0.72);
          --lmkw-border: rgba(144, 164, 174, 0.55);
          --lmkw-radius: 18px;
          font-family: var(--ha-font-family, system-ui, sans-serif);
        }

        .frame {
          position: relative;
          border-radius: calc(var(--lmkw-radius) + 2px);
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(100, 181, 246, 0.85) 0%,
            rgba(52, 211, 153, 0.45) 35%,
            rgba(251, 191, 36, 0.55) 70%,
            rgba(144, 164, 174, 0.35) 100%
          );
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.04) inset,
            0 18px 40px rgba(0, 0, 0, 0.38),
            0 0 48px rgba(100, 181, 246, 0.08);
          overflow: hidden;
        }

        .shell {
          position: relative;
          border-radius: var(--lmkw-radius);
          background:
            radial-gradient(120% 80% at 100% 0%, rgba(100, 181, 246, 0.14), transparent 55%),
            radial-gradient(90% 60% at 0% 100%, rgba(52, 211, 153, 0.1), transparent 50%),
            linear-gradient(165deg, rgba(18, 24, 36, 0.96), rgba(8, 12, 20, 0.98));
          overflow: hidden;
        }

        .shell::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.06), transparent 28%);
          pointer-events: none;
        }

        .hero {
          position: relative;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 0.85rem;
          align-items: center;
          padding: 1rem 1.05rem 0.85rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .brand-mark {
          position: relative;
          width: 2.65rem;
          height: 2.65rem;
          border-radius: 0.85rem;
          display: grid;
          place-items: center;
          background: linear-gradient(145deg, rgba(100, 181, 246, 0.22), rgba(52, 211, 153, 0.12));
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
        }

        .brand-mark ha-icon {
          color: var(--lmkw-sky);
          --mdc-icon-size: 1.45rem;
          filter: drop-shadow(0 0 10px rgba(100, 181, 246, 0.55));
        }

        .brand-glow {
          position: absolute;
          inset: -30%;
          background: radial-gradient(circle, rgba(100, 181, 246, 0.35), transparent 70%);
          pointer-events: none;
          animation: breathe 4s ease-in-out infinite;
        }

        .hero-copy { min-width: 0; }

        .kicker {
          margin: 0;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--lmkw-muted);
          font-weight: 700;
        }

        .title {
          margin: 0.15rem 0 0;
          font-size: 1.08rem;
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -0.02em;
          background: linear-gradient(90deg, #f8fafc 0%, #dbeafe 45%, #a7f3d0 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .subtitle {
          margin: 0.28rem 0 0;
          font-size: 0.76rem;
          color: var(--lmkw-muted);
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.55rem;
          border-radius: 999px;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .hero-badge--live {
          color: #052e1a;
          background: linear-gradient(135deg, #6ee7b7, #34d399);
          box-shadow: 0 0 18px rgba(52, 211, 153, 0.35);
        }

        .hero-badge--hit {
          color: #78350f;
          background: linear-gradient(135deg, #fde68a, #fbbf24);
          box-shadow: 0 0 18px rgba(251, 191, 36, 0.4);
          animation: breathe 3s ease-in-out infinite;
        }

        .hero-badge ha-icon {
          --mdc-icon-size: 0.95rem;
        }

        .content {
          padding: 0.85rem;
        }

        .watch-grid {
          display: grid;
          gap: 0.65rem;
        }

        .watch {
          position: relative;
          display: block;
          text-decoration: none;
          color: inherit;
          border-radius: 14px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          transition:
            transform 0.22s cubic-bezier(0.25, 1, 0.5, 1),
            box-shadow 0.22s ease,
            border-color 0.22s ease,
            background 0.22s ease;
        }

        .watch:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.05);
          box-shadow:
            0 10px 28px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(255, 255, 255, 0.04) inset,
            0 0 24px color-mix(in srgb, var(--watch-accent) 22%, transparent);
        }

        .watch--hit {
          border-color: rgba(251, 191, 36, 0.35);
          box-shadow: 0 0 22px rgba(251, 191, 36, 0.08);
        }

        .watch-accent {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, var(--watch-accent), transparent);
          opacity: 0.95;
        }

        .watch-body {
          position: relative;
          padding: 0.72rem 0.78rem 0.72rem 0.9rem;
        }

        .watch-top {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 0.65rem;
          align-items: start;
        }

        .watch-icon-wrap {
          position: relative;
          width: 2rem;
          height: 2rem;
          border-radius: 0.65rem;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .watch-icon-wrap ha-icon {
          --mdc-icon-size: 1.05rem;
          color: var(--watch-accent);
        }

        .watch-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 0.75rem;
          border: 1px solid rgba(251, 191, 36, 0.45);
          animation: ping 2.2s ease-out infinite;
        }

        .watch-copy { min-width: 0; }

        .watch-title {
          margin: 0;
          font-size: 0.88rem;
          line-height: 1.25;
          font-weight: 700;
          color: var(--lmkw-ink);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.28rem;
          margin-top: 0.35rem;
        }

        .tag {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 0.12rem 0.42rem;
          border-radius: 999px;
          color: rgba(232, 237, 245, 0.88);
          background: rgba(100, 181, 246, 0.12);
          border: 1px solid rgba(100, 181, 246, 0.18);
        }

        .watch-status {
          display: inline-flex;
          align-items: center;
          gap: 0.32rem;
          padding: 0.22rem 0.48rem;
          border-radius: 999px;
          font-size: 0.64rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .status-dot {
          width: 0.42rem;
          height: 0.42rem;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 10px currentColor;
        }

        .status--hit {
          color: #78350f;
          background: linear-gradient(135deg, #fde68a, #fbbf24);
        }

        .status--watch {
          color: #064e3b;
          background: linear-gradient(135deg, #a7f3d0, #34d399);
        }

        .status--snooze {
          color: #1e3a8a;
          background: linear-gradient(135deg, #bfdbfe, #60a5fa);
        }

        .status--muted {
          color: #334155;
          background: linear-gradient(135deg, #e2e8f0, #94a3b8);
        }

        .insight {
          margin: 0.55rem 0 0;
          font-size: 0.76rem;
          line-height: 1.4;
          color: var(--lmkw-muted);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .insight--pulse {
          color: rgba(251, 191, 36, 0.92);
        }

        .watch-foot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.55rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 0.68rem;
          color: rgba(232, 237, 245, 0.48);
        }

        .watch-open {
          display: inline-flex;
          align-items: center;
          gap: 0.15rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(100, 181, 246, 0.92);
        }

        .watch-open ha-icon {
          --mdc-icon-size: 0.82rem;
        }

        .empty {
          text-align: center;
          padding: 1.4rem 0.8rem 1.1rem;
        }

        .empty-orbit {
          position: relative;
          width: 4.5rem;
          height: 4.5rem;
          margin: 0 auto 0.85rem;
          display: grid;
          place-items: center;
        }

        .empty-orbit ha-icon {
          --mdc-icon-size: 1.65rem;
          color: var(--lmkw-sky);
          filter: drop-shadow(0 0 12px rgba(100, 181, 246, 0.45));
        }

        .ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(100, 181, 246, 0.22);
        }

        .ring-1 { animation: spin 12s linear infinite; }
        .ring-2 { inset: 12%; animation: spin 18s linear infinite reverse; opacity: 0.7; }
        .ring-3 { inset: 24%; animation: spin 24s linear infinite; opacity: 0.45; }

        .empty-title {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--lmkw-ink);
        }

        .empty-text {
          margin: 0.35rem 0 0;
          font-size: 0.78rem;
          line-height: 1.45;
          color: var(--lmkw-muted);
          max-width: 16rem;
          margin-inline: auto;
        }

        @keyframes breathe {
          0%, 100% { opacity: 0.45; transform: scale(0.96); }
          50% { opacity: 0.85; transform: scale(1.04); }
        }

        @keyframes ping {
          0% { transform: scale(0.92); opacity: 0.85; }
          70% { transform: scale(1.12); opacity: 0; }
          100% { transform: scale(1.12); opacity: 0; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      </style>
      <div class="frame">
        <div class="shell">
          <header class="hero">
            <div class="brand-mark">
              <span class="brand-glow"></span>
              <ha-icon icon="mdi:eye-circle-outline"></ha-icon>
            </div>
            <div class="hero-copy">
              <p class="kicker">Intelligence</p>
              <h2 class="title">Let Me Know When</h2>
              <p class="subtitle">${this._escape(subtitle)}</p>
            </div>
            ${updates > 0 ? `<div class="hero-badge hero-badge--hit"><ha-icon icon="mdi:flash"></ha-icon>${updates} live</div>` : `<div class="hero-badge hero-badge--live"><ha-icon icon="mdi:shield-check"></ha-icon>Live</div>`}
          </header>
          <div class="content">${listHtml}</div>
        </div>
      </div>`;
  }
}

customElements.define("lmkw-watches", LmkwWatchesCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:lmkw-watches",
  name: "Let Me Know When Watches",
  description: "Premium Lmkw watch desk for Luxe dashboards",
  preview: true,
});

import { useState, useEffect } from "react";
import { Button }           from "@cloudflare/kumo/components/button";
import { Input, InputArea } from "@cloudflare/kumo/components/input";
import { Field }            from "@cloudflare/kumo/components/field";
import { Select }           from "@cloudflare/kumo/components/select";
import { Surface }          from "@cloudflare/kumo/components/surface";
import { apiGet, apiPost }  from "../../lib/api.js";

interface Design {
  chatMode: string; theme: string; accentColor: string; bgColor: string;
  userBubbleColor: string; botBubbleColor: string; chatTitle: string;
  chatSubtitle: string; chatPlaceholder: string; welcomeMessage: string;
  suggestions: string; logoUrl: string; fontSize: number; borderRadius: number;
}

const THEME_PRESETS = {
  dark:  { bgColor: "#0f1117", botBubbleColor: "#1e293b" },
  light: { bgColor: "#ffffff", botBubbleColor: "#f1f5f9" },
};

const DEFAULTS: Design = {
  chatMode: "floating", theme: "dark", accentColor: "#6366f1",
  ...THEME_PRESETS.dark,
  userBubbleColor: "#6366f1",
  chatTitle: "AI Assistant", chatSubtitle: "Ask me anything",
  chatPlaceholder: "Type your message",
  welcomeMessage: "Hi! How can I help you today?",
  suggestions: '["What are the main topics?","Summarize key points","What training is required?"]',
  logoUrl: "", fontSize: 14, borderRadius: 16,
};

export function DesignerTab() {
  const [design, setDesign] = useState<Design>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    apiGet<{ settings: Record<string, unknown> }>("settings/get").then((d) => {
      const s = d.settings ?? {};
      setDesign({
        chatMode:        String(s.chatMode        ?? DEFAULTS.chatMode),
        theme:           String(s.theme           ?? DEFAULTS.theme),
        accentColor:     String(s.accentColor     ?? DEFAULTS.accentColor),
        bgColor:         String(s.bgColor         ?? DEFAULTS.bgColor),
        userBubbleColor: String(s.userBubbleColor ?? DEFAULTS.userBubbleColor),
        botBubbleColor:  String(s.botBubbleColor  ?? DEFAULTS.botBubbleColor),
        chatTitle:       String(s.chatTitle       ?? DEFAULTS.chatTitle),
        chatSubtitle:    String(s.chatSubtitle    ?? DEFAULTS.chatSubtitle),
        chatPlaceholder: String(s.chatPlaceholder ?? DEFAULTS.chatPlaceholder),
        welcomeMessage:  String(s.welcomeMessage  ?? DEFAULTS.welcomeMessage),
        suggestions:     String(s.suggestions     ?? DEFAULTS.suggestions),
        logoUrl:         String(s.logoUrl         ?? DEFAULTS.logoUrl),
        fontSize:        Number(s.fontSize        ?? DEFAULTS.fontSize),
        borderRadius:    Number(s.borderRadius    ?? DEFAULTS.borderRadius),
      });
    }).catch(() => {});
  }, []);

  // When theme changes, auto-apply preset background + bot bubble colors
  function handleThemeChange(theme: string | null) {
    if (!theme) return;
    const preset = THEME_PRESETS[theme as keyof typeof THEME_PRESETS] ?? THEME_PRESETS.dark;
    setDesign((d) => ({ ...d, theme, ...preset }));
  }

  async function save() {
    setSaving(true); setMsg(null);
    try {
      await apiPost("settings/save", design);
      setMsg({ type: "success", text: "Design saved ✓" });
    } catch (e: any) {
      setMsg({ type: "error", text: `Error: ${e.message}` });
    } finally { setSaving(false); }
  }

  async function reset() {
    if (!confirm("Reset all chat design settings to defaults?")) return;
    try {
      await apiPost("design/reset");
      setDesign(DEFAULTS);
      setMsg({ type: "success", text: "Reset to defaults ✓" });
    } catch (e: any) {
      setMsg({ type: "error", text: `Error: ${e.message}` });
    }
  }

  const set = (k: keyof Design) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setDesign((d) => ({ ...d, [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value }));

  // Derived preview colors
  const isLight     = design.theme === "light";
  const accent      = design.accentColor  || "#6366f1";
  const bg          = design.bgColor      || (isLight ? "#ffffff" : "#0f1117");
  const textColor   = isLight ? "#1d2327" : "#e2e8f0";
  const mutedColor  = isLight ? "#646970" : "#94a3b8";
  const borderColor = isLight ? "#e0e0e0" : "#2d3148";
  const surfaceBg   = isLight ? "#f6f7f7" : "#1a1d27";

  let chips: string[] = [];
  try { chips = JSON.parse(design.suggestions); } catch { chips = []; }

  return (
    <div style={{ maxWidth: 1060, display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>

      {/* ── Controls ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Surface>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Display</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Chat Mode">
                <Select value={design.chatMode} onValueChange={(v) => setDesign((d) => ({ ...d, chatMode: v ?? d.chatMode }))}>
                  <Select.Option value="floating">Floating button (bottom-right)</Select.Option>
                  <Select.Option value="fullpage">Full-page (ChatGPT style)</Select.Option>
                </Select>
              </Field>
              <Field label="Theme">
                <Select value={design.theme} onValueChange={handleThemeChange}>
                  <Select.Option value="dark">Dark</Select.Option>
                  <Select.Option value="light">Light</Select.Option>
                </Select>
              </Field>
            </div>
          </div>
        </Surface>

        <Surface>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Colors</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {([
                ["accentColor",     "Accent / Button Color"],
                ["bgColor",         "Background"],
                ["userBubbleColor", "User Bubble"],
                ["botBubbleColor",  "Bot Bubble"],
              ] as [keyof Design, string][]).map(([k, label]) => (
                <Field key={k} label={label}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="color" value={String(design[k])} onChange={set(k)}
                      style={{ width: 36, height: 36, border: "none", borderRadius: 6, cursor: "pointer", padding: 2, flexShrink: 0 }} />
                    <Input value={String(design[k])} onChange={set(k)} />
                  </div>
                </Field>
              ))}
            </div>
          </div>
        </Surface>

        <Surface>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Text & Identity</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Chat Title"><Input value={design.chatTitle} onChange={set("chatTitle")} /></Field>
              <Field label="Chat Subtitle"><Input value={design.chatSubtitle} onChange={set("chatSubtitle")} /></Field>
              <Field label="Input Placeholder"><Input value={design.chatPlaceholder} onChange={set("chatPlaceholder")} /></Field>
              <Field label="Bot Logo URL"><Input value={design.logoUrl} onChange={set("logoUrl")} placeholder="https://…" /></Field>
            </div>
            <Field label="Welcome Message">
              <InputArea rows={2} value={design.welcomeMessage} onChange={set("welcomeMessage")} />
            </Field>
            <Field label="Suggestion Chips" description='JSON array, e.g. ["What topics?","Summarize"]'>
              <Input value={design.suggestions} onChange={set("suggestions")} />
            </Field>
          </div>
        </Surface>

        <Surface>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Typography & Shape</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Font Size (px)">
                <Input type="number" min={10} max={24} value={design.fontSize} onChange={set("fontSize")} />
              </Field>
              <Field label="Border Radius (px)">
                <Input type="number" min={0} max={32} value={design.borderRadius} onChange={set("borderRadius")} />
              </Field>
            </div>
          </div>
        </Surface>

        {msg && (
          <div style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13,
            background: msg.type === "success" ? "#dcfce7" : "#fee2e2",
            color: msg.type === "success" ? "#166534" : "#991b1b",
            border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
            {msg.text}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Design"}</Button>
          <Button variant="destructive" onClick={reset}>Reset to Defaults</Button>
        </div>
      </div>

      {/* ── Live Preview ── */}
      <div style={{ position: "sticky", top: 20 }}>
        <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "var(--color-text-muted, #888)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Live Preview — {design.chatMode === "floating" ? "Floating" : "Full-page"}
        </p>

        {design.chatMode === "floating" ? (
          <FloatingPreview
            design={design} accent={accent} bg={bg}
            textColor={textColor} mutedColor={mutedColor}
            borderColor={borderColor} surfaceBg={surfaceBg} chips={chips}
          />
        ) : (
          <FullpagePreview
            design={design} accent={accent} bg={bg}
            textColor={textColor} mutedColor={mutedColor}
            borderColor={borderColor} surfaceBg={surfaceBg} chips={chips}
          />
        )}
      </div>
    </div>
  );
}

// ── Shared chat body ──────────────────────────────────────────────────────

function ChatBody({ design, accent, bg, textColor, mutedColor, borderColor, surfaceBg, chips, compact = false }: {
  design: Design; accent: string; bg: string; textColor: string; mutedColor: string;
  borderColor: string; surfaceBg: string; chips: string[]; compact?: boolean;
}) {
  const avatarContent = design.logoUrl
    ? <img src={design.logoUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
    : <span>🤖</span>;

  return (
    <>
      {/* Header */}
      <div style={{ background: bg, borderBottom: `1px solid ${borderColor}`, padding: compact ? "10px 12px" : "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: compact ? 30 : 36, height: compact ? 30 : 36, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: compact ? 14 : 16, flexShrink: 0, overflow: "hidden" }}>
          {avatarContent}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: textColor, fontSize: compact ? 13 : 14 }}>{design.chatTitle || "AI Assistant"}</div>
          <div style={{ fontSize: 11, color: mutedColor }}>{design.chatSubtitle || "Ask me anything"}</div>
        </div>
        <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
      </div>

      {/* Messages */}
      <div style={{ padding: compact ? 10 : 14, background: bg, display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: compact ? 80 : 110 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, flexShrink: 0, overflow: "hidden" }}>
            {avatarContent}
          </div>
          <div style={{ background: design.botBubbleColor, borderRadius: 12, borderTopLeftRadius: 4, padding: "8px 12px", fontSize: design.fontSize, color: textColor, maxWidth: "80%", border: `1px solid ${borderColor}` }}>
            {design.welcomeMessage || "Hi! How can I help you today?"}
          </div>
        </div>

        {chips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingLeft: 34 }}>
            {chips.slice(0, 2).map((chip, i) => (
              <div key={i} style={{ background: surfaceBg, border: `1px solid ${borderColor}`, color: textColor, padding: "4px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>
                {chip}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexDirection: "row-reverse" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: surfaceBg, border: `1px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>👤</div>
          <div style={{ background: design.userBubbleColor, borderRadius: 12, borderTopRightRadius: 4, padding: "8px 12px", fontSize: design.fontSize, color: "#fff", maxWidth: "80%" }}>
            What are the main topics?
          </div>
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: compact ? "8px 10px" : "10px 14px", borderTop: `1px solid ${borderColor}`, display: "flex", gap: 8, background: bg }}>
        <div style={{ flex: 1, background: surfaceBg, borderRadius: 99, padding: "7px 14px", fontSize: design.fontSize, color: mutedColor, border: `1px solid ${borderColor}` }}>
          {design.chatPlaceholder || "Type your message"}
        </div>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, fontSize: 14 }}>
          ➤
        </div>
      </div>
    </>
  );
}

// ── Floating preview ──────────────────────────────────────────────────────

function FloatingPreview({ design, accent, bg, textColor, mutedColor, borderColor, surfaceBg, chips }: any) {
  const [open, setOpen] = useState(true);
  const logoContent = design.logoUrl
    ? <img src={design.logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
    : <span style={{ fontSize: 20 }}>💬</span>;

  return (
    <div style={{ position: "relative", height: 420, background: "var(--color-bg-secondary, #f5f5f5)", borderRadius: 12, border: "1px solid var(--color-border, #e5e7eb)", overflow: "hidden" }}>
      {/* Simulated page background */}
      <div style={{ padding: 16, fontSize: 12, color: "var(--color-text-muted, #888)" }}>
        <div style={{ height: 10, background: "var(--color-border, #e5e7eb)", borderRadius: 4, marginBottom: 8, width: "60%" }} />
        <div style={{ height: 8, background: "var(--color-border, #e5e7eb)", borderRadius: 4, marginBottom: 6, width: "80%" }} />
        <div style={{ height: 8, background: "var(--color-border, #e5e7eb)", borderRadius: 4, width: "45%" }} />
      </div>

      {/* Floating panel */}
      {open && (
        <div style={{
          position: "absolute", bottom: 72, right: 12,
          width: 280, borderRadius: design.borderRadius,
          border: `1px solid ${borderColor}`,
          boxShadow: "0 8px 32px rgba(0,0,0,.2)",
          overflow: "hidden", display: "flex", flexDirection: "column",
          fontFamily: "system-ui, sans-serif", fontSize: design.fontSize,
        }}>
          <ChatBody design={design} accent={accent} bg={bg} textColor={textColor} mutedColor={mutedColor} borderColor={borderColor} surfaceBg={surfaceBg} chips={chips} compact />
        </div>
      )}

      {/* Floating button */}
      <div style={{ position: "absolute", bottom: 12, right: 12, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{ width: 52, height: 52, borderRadius: "50%", border: "none", background: accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,.25)" }}
        >
          {open ? <span style={{ fontSize: 18 }}>✕</span> : logoContent}
        </button>
      </div>
    </div>
  );
}

// ── Full-page preview ─────────────────────────────────────────────────────

function FullpagePreview({ design, accent, bg, textColor, mutedColor, borderColor, surfaceBg, chips }: any) {
  const sidebarBg = design.theme === "light" ? "#f6f7f7" : "#1a1d27";

  return (
    <div style={{
      borderRadius: 12, border: `1px solid ${borderColor}`,
      overflow: "hidden", display: "flex",
      fontFamily: "system-ui, sans-serif", fontSize: design.fontSize,
      height: 420, boxShadow: "0 4px 24px rgba(0,0,0,.2)",
    }}>
      {/* Sidebar */}
      <div style={{ width: 90, background: sidebarBg, borderRight: `1px solid ${borderColor}`, display: "flex", flexDirection: "column", padding: "12px 8px", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: accent, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{design.chatTitle}</span>
        </div>
        <button style={{ background: accent, border: "none", borderRadius: 6, padding: "5px 6px", color: "#fff", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>+ New</button>
        <div style={{ fontSize: 10, color: mutedColor, padding: "4px 6px", borderRadius: 4, background: `${accent}22` }}>Today</div>
        <div style={{ fontSize: 10, color: mutedColor, padding: "4px 6px" }}>Yesterday</div>
      </div>

      {/* Main chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: bg }}>
        <ChatBody design={design} accent={accent} bg={bg} textColor={textColor} mutedColor={mutedColor} borderColor={borderColor} surfaceBg={surfaceBg} chips={chips} compact />
      </div>
    </div>
  );
}

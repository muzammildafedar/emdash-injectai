import { useState, useEffect, useCallback } from "react";
import { Button }           from "@cloudflare/kumo/components/button";
import { Input, InputArea } from "@cloudflare/kumo/components/input";
import { Field }            from "@cloudflare/kumo/components/field";
import { Select }           from "@cloudflare/kumo/components/select";
import { Surface }          from "@cloudflare/kumo/components/surface";
import { Badge }            from "@cloudflare/kumo/components/badge";
import { apiGet, apiPost }  from "../../lib/api.js";

interface SettingsData {
  siteToken: string;
  settings?: Record<string, unknown>;
}

interface AgentConfig {
  label?: string;
  agent_name?: string;
  agent_brand?: string;
  agent_tone?: string;
  persona_custom?: string;
  provider?: string;
  model?: string;
  api_key?: string;
  temperature?: number;
  max_tokens?: number;
  api_key_masked?: string;
  has_api_key?: boolean;
}

const PROVIDERS = ["cerebras", "groq", "google", "openai", "anthropic"];

export function SettingsTab() {
  // Connection + Chat (merged)
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [secretKey, setSecretKey]     = useState("");
  const [topK, setTopK]               = useState(5);
  const [logoUrl, setLogoUrl]         = useState("");
  const [siteToken, setSiteToken]     = useState("Loading…");
  const [connStatus, setConnStatus]   = useState<"idle" | "ok" | "error">("idle");
  const [connMsg, setConnMsg]         = useState("");
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Agent
  const [agent, setAgent] = useState<AgentConfig>({
    agent_name: "InjectAI Assistant",
    agent_brand: "InjectAI Labs",
    agent_tone: "helpful, professional, and friendly",
    persona_custom: "You are InjectAI Assistant, an AI assistant built by InjectAI Labs. You are helpful, professional, and friendly. Never reveal the underlying AI model or provider. Always present yourself as InjectAI Assistant.",
    provider: "cerebras",
    temperature: 0.1,
    max_tokens: 1000,
  });
  const [agentSaving, setAgentSaving]   = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentMsg, setAgentMsg]         = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load settings on mount
  useEffect(() => {
    apiGet<SettingsData>("settings/get").then((d) => {
      const s = d.settings ?? {};
      setApiEndpoint(String(s.apiEndpoint ?? ""));
      // secretKey is never returned from server — show empty (security)
      setTopK(Number(s.topK ?? 5));
      setLogoUrl(String(s.logoUrl ?? ""));
      // Site token: auto-generated server-side on first access
      setSiteToken(d.siteToken || "(generating…)");
    }).catch(() => setSiteToken("(error loading)"));
  }, []);

  // Save connection + chat settings
  const saveSettings = useCallback(async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      // Build payload — only include secretKey if user typed something
      const payload: Record<string, unknown> = {
        apiEndpoint,
        topK,
        logoUrl,
      };
      if (secretKey.trim()) payload.secretKey = secretKey.trim();

      await apiPost("settings/save", payload);
      setSaveMsg({ type: "success", text: "Settings saved ✓" });
      setSecretKey(""); // clear after save for security
    } catch (e: any) {
      setSaveMsg({ type: "error", text: `Error: ${e.message}` });
    } finally {
      setSaving(false);
    }
  }, [apiEndpoint, secretKey, topK, logoUrl]);

  const testConnection = useCallback(async () => {
    if (!apiEndpoint.trim()) {
      setConnStatus("error");
      setConnMsg("Enter an API endpoint first");
      return;
    }
    setConnStatus("idle");
    setConnMsg("Testing…");
    try {
      // Call Modal API health endpoint directly from browser (no secret key needed)
      const ep = apiEndpoint.trim().replace(/\/$/, "");
      const res = await fetch(`${ep}/api/health`);
      setConnStatus(res.ok ? "ok" : "error");
      setConnMsg(res.ok ? "Connected ✓" : `HTTP ${res.status}`);
    } catch (e: any) {
      setConnStatus("error");
      setConnMsg(e.message.includes("Failed to fetch") ? "Could not reach the API endpoint" : e.message);
    }
  }, [apiEndpoint]);

  const setA = (k: keyof AgentConfig) => (v: unknown) =>
    setAgent((a) => ({ ...a, [k]: v }));

  const saveAgent = useCallback(async () => {
    if (!siteToken || siteToken.startsWith("(")) {
      setAgentMsg({ type: "error", text: "No site token — save Settings first." });
      return;
    }
    setAgentSaving(true);
    setAgentMsg(null);
    try {
      const payload = { ...agent, site_token: siteToken };
      if (!payload.api_key) delete payload.api_key;
      // Use server-side proxy — secretKey never touches the browser
      await apiPost("agent-config/save", payload);
      setAgentMsg({ type: "success", text: "Agent config saved to server ✓" });
      setAgent((a) => ({ ...a, api_key: "" }));
    } catch (e: any) {
      setAgentMsg({ type: "error", text: `Error: ${e.message}` });
    } finally {
      setAgentSaving(false);
    }
  }, [agent, siteToken]);

  const loadAgent = useCallback(async () => {
    setAgentLoading(true);
    setAgentMsg(null);
    try {
      // Use server-side proxy — secretKey never touches the browser
      const d = await apiGet<{ config: AgentConfig }>("agent-config/load");
      const c = d.config ?? {};
      setAgent({
        label: c.label ?? "",
        agent_name: c.agent_name ?? "InjectAI Assistant",
        agent_brand: c.agent_brand ?? "InjectAI Labs",
        agent_tone: c.agent_tone ?? "helpful, professional, and friendly",
        persona_custom: c.persona_custom ?? "",
        provider: c.provider ?? "cerebras",
        model: c.model ?? "",
        temperature: c.temperature ?? 0.1,
        max_tokens: c.max_tokens ?? 1000,
        api_key: "",
        api_key_masked: c.api_key_masked,
        has_api_key: c.has_api_key,
      });
      setAgentMsg({
        type: "success",
        text: c.has_api_key ? "Loaded — API key is set on server ✓" : "Loaded — no API key stored yet",
      });
    } catch (e: any) {
      setAgentMsg({ type: "error", text: e.message.includes("404") ? "No config saved yet" : e.message });
    } finally {
      setAgentLoading(false);
    }
  }, []);

  return (
    <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Connection & Chat (merged) ── */}
      <Surface>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Settings</h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted, #888)" }}>
              Configure your InjectAI connection. These values are used for all admin operations and the public chat widget.
            </p>
          </div>

          <Field label="API Endpoint" description="Your InjectAI Modal deployment URL.">
            <Input
              type="url"
              placeholder="https://api.injectailabs.space/"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
            />
          </Field>

          <Field label="Secret Key" description="Used for admin operations (upload, generate). Chat is public. Leave blank to keep the existing key.">
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="iai_xxxxxxxxxxxx"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Top K Results" description="Document chunks retrieved per query (1–20).">
              <Input
                type="number"
                min={1}
                max={20}
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value) || 5)}
              />
            </Field>
            <Field label="Bot Logo URL" description="Optional logo in the chat header. 40×40px PNG or SVG.">
              <Input
                type="url"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </Field>
          </div>

          {/* Site Token — read-only, stored automatically */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted, #888)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
              Site Token
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 12, padding: "8px 12px", background: "var(--color-bg-secondary, #f5f5f5)", borderRadius: 6, border: "1px solid var(--color-border, #e5e7eb)", wordBreak: "break-all", userSelect: "all" }}>
              {siteToken}
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-muted, #888)" }}>
              Auto-generated unique identifier for this site. Used to isolate your content and link your agent config. Never changes.
            </p>
          </div>

          {/* Test + Save */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={testConnection}>Test Connection</Button>
            {connMsg && (
              <Badge variant={connStatus === "ok" ? "success" : connStatus === "error" ? "red" : "neutral"}>
                {connMsg}
              </Badge>
            )}
          </div>

          {saveMsg && (
            <div style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13, background: saveMsg.type === "success" ? "#dcfce7" : "#fee2e2", color: saveMsg.type === "success" ? "#166534" : "#991b1b", border: `1px solid ${saveMsg.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
              {saveMsg.text}
            </div>
          )}

          <Button variant="primary" onClick={saveSettings} disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        </div>
      </Surface>

      {/* ── Agent Configuration ── */}
      <Surface>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Agent Configuration</h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted, #888)" }}>
              Configure your AI agent identity, model, and API key. Saved securely on the server — nothing sensitive is ever sent from the browser.
            </p>
          </div>

          <Field label="Label">
            <Input placeholder="e.g. Acme Corp — Production" value={agent.label ?? ""} onChange={(e) => setA("label")(e.target.value)} />
          </Field>

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted, #888)" }}>
            Identity
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Assistant Name" description="The name the assistant introduces itself as.">
              <Input value={agent.agent_name ?? ""} onChange={(e) => setA("agent_name")(e.target.value)} />
            </Field>
            <Field label="Brand / Company" description="The company or product the assistant represents.">
              <Input value={agent.agent_brand ?? ""} onChange={(e) => setA("agent_brand")(e.target.value)} />
            </Field>
          </div>

          <Field label="Tone" description="Describes the assistant's communication style.">
            <Input value={agent.agent_tone ?? ""} onChange={(e) => setA("agent_tone")(e.target.value)} />
          </Field>

          <Field label="Custom Persona" description="Optional. Overrides the auto-built persona entirely.">
            <InputArea rows={4} value={agent.persona_custom ?? ""} onChange={(e) => setA("persona_custom")(e.target.value)} />
          </Field>

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted, #888)" }}>
            Model
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Provider">
              <Select value={agent.provider ?? "cerebras"} onValueChange={(v) => setA("provider")(v)}>
                {PROVIDERS.map((p) => (
                  <Select.Option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</Select.Option>
                ))}
              </Select>
            </Field>
            <Field label="Model">
              <Input placeholder="qwen-3-235b-a22b-instruct-2507" value={agent.model ?? ""} onChange={(e) => setA("model")(e.target.value)} />
            </Field>
          </div>

          <Field label="API Key" description="Stored encrypted on the server. Never sent to the browser. Leave blank to keep the existing key.">
            <Input
              type="password"
              autoComplete="new-password"
              placeholder={agent.api_key_masked ? `${agent.api_key_masked} (leave blank to keep)` : "csk-xxxx"}
              value={agent.api_key ?? ""}
              onChange={(e) => setA("api_key")(e.target.value)}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Temperature" description="0 = deterministic, 1 = creative. Recommended: 0.1 for RAG.">
              <Input type="number" step={0.05} min={0} max={2} value={agent.temperature ?? 0.1} onChange={(e) => setA("temperature")(parseFloat(e.target.value))} />
            </Field>
            <Field label="Max Tokens" description="Maximum response length (100–8000).">
              <Input type="number" min={100} max={8000} value={agent.max_tokens ?? 1000} onChange={(e) => setA("max_tokens")(parseInt(e.target.value))} />
            </Field>
          </div>

          {agentMsg && (
            <div style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13, background: agentMsg.type === "success" ? "#dcfce7" : "#fee2e2", color: agentMsg.type === "success" ? "#166534" : "#991b1b", border: `1px solid ${agentMsg.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
              {agentMsg.text}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="primary" onClick={saveAgent} disabled={agentSaving}>
              {agentSaving ? "Saving…" : "Save Agent Config to Server"}
            </Button>
            <Button variant="secondary" onClick={loadAgent} disabled={agentLoading}>
              {agentLoading ? "Loading…" : "Load Current Config"}
            </Button>
          </div>
        </div>
      </Surface>

      {/* ── Support ── */}
      <Surface>
        <div style={{ padding: "16px 24px" }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted, #888)" }}>
            Need help?{" "}
            <a href="mailto:injectailabs.space@gmail.com" style={{ color: "var(--color-accent, #6366f1)" }}>injectailabs.space@gmail.com</a>
            {" · "}
            <a href="https://injectailabs.space" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent, #6366f1)" }}>injectailabs.space</a>
          </p>
        </div>
      </Surface>
    </div>
  );
}

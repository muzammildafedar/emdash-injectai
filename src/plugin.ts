/**
 * InjectAI Plugin — runtime definition.
 * Loaded by emdash at request time via the `entrypoint` field.
 * No browser-only imports (no React, no Kumo).
 */
import { definePlugin } from "emdash";

export function createPlugin() {
  return definePlugin({
    id: "injectai",
    version: "1.0.0",
    capabilities: ["network:fetch"],
    // Allow any host — the API endpoint is user-configured and can be any domain.
    // In trusted mode (local plugins array) this is advisory only.
    // In sandboxed mode, use specific hosts or deploy as trusted.
    allowedHosts: ["*", "*.modal.run", "*.injectailabs.space", "localhost"],

    admin: {
      entry: "@injectailabs/emdash-injectai/admin",
      pages: [{ path: "/", label: "InjectAI", icon: "puzzle-piece" }],
      widgets: [{ id: "injectai-status", title: "InjectAI", size: "half" }],
      portableTextBlocks: [
        {
          type: "injectai-chat",
          label: "InjectAI Chat",
          icon: "link",
          description: "Embed the AI chatbot on this page. Mode is set in Chat Designer.",
          fields: [
            {
              type: "toggle",
              action_id: "enabled",
              label: "Insert chat widget on this page",
              initial_value: true,
            },
          ],
        },
      ],
      settingsSchema: {
        apiEndpoint: {
          type: "string", label: "API Endpoint",
          description: "Your InjectAI Modal deployment URL (e.g. https://api.injectailabs.space/)",
          default: "",
        },
        secretKey: {
          type: "secret", label: "Secret Key",
          description: "Used for admin operations (upload, generate). Chat is public.",
        },
        topK:     { type: "number", label: "Top K Results", default: 5, min: 1, max: 20 },
        logoUrl:  { type: "string", label: "Bot Logo URL", default: "" },
        chatMode: {
          type: "select", label: "Chat Mode",
          options: [
            { value: "floating", label: "Floating button (bottom-right)" },
            { value: "fullpage", label: "Full-page (ChatGPT style)" },
          ],
          default: "floating",
        },
        theme: {
          type: "select", label: "Theme",
          options: [{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }],
          default: "dark",
        },
        accentColor:     { type: "string", label: "Accent Color",      default: "#6366f1" },
        bgColor:         { type: "string", label: "Background Color",   default: "#0f1117" },
        userBubbleColor: { type: "string", label: "User Bubble Color",  default: "#6366f1" },
        botBubbleColor:  { type: "string", label: "Bot Bubble Color",   default: "#1e293b" },
        chatTitle:       { type: "string", label: "Chat Title",         default: "AI Assistant" },
        chatSubtitle:    { type: "string", label: "Chat Subtitle",      default: "Ask me anything" },
        chatPlaceholder: { type: "string", label: "Input Placeholder",  default: "Type your message" },
        welcomeMessage:  { type: "string", label: "Welcome Message",    default: "Hi! How can I help you today?", multiline: true },
        suggestions:     { type: "string", label: "Suggestion Chips (JSON array)", default: '["What are the main topics?","Summarize key points","What training is required?"]' },
        fontSize:        { type: "number", label: "Font Size (px)",     default: 14, min: 10, max: 24 },
        borderRadius:    { type: "number", label: "Border Radius (px)", default: 16, min: 0,  max: 32 },
      },
    },

    hooks: {
      "plugin:activate": {
        handler: async (_event, ctx) => {
          const existing = await ctx.kv.get("state:siteToken");
          if (!existing) {
            const token = "site_" + Array.from(crypto.getRandomValues(new Uint8Array(16)))
              .map((b) => b.toString(16).padStart(2, "0")).join("");
            await ctx.kv.set("state:siteToken", token);
          }
          const defaults: Record<string, unknown> = {
            "settings:topK": 5, "settings:chatMode": "floating", "settings:theme": "dark",
            "settings:accentColor": "#6366f1", "settings:bgColor": "#0f1117",
            "settings:userBubbleColor": "#6366f1", "settings:botBubbleColor": "#1e293b",
            "settings:chatTitle": "AI Assistant", "settings:chatSubtitle": "Ask me anything",
            "settings:chatPlaceholder": "Type your message",
            "settings:welcomeMessage": "Hi! How can I help you today?",
            "settings:suggestions": '["What are the main topics?","Summarize key points","What training is required?"]',
            "settings:fontSize": 14, "settings:borderRadius": 16, "settings:logoUrl": "",
          };
          for (const [k, v] of Object.entries(defaults)) {
            if ((await ctx.kv.get(k)) === null) await ctx.kv.set(k, v);
          }
        },
      },

    },

    routes: {
      config: {
        public: true,
        handler: async (ctx) => {
          const [topK, siteToken, chatMode, theme, accentColor, bgColor,
                 userBubbleColor, botBubbleColor, chatTitle, chatSubtitle, chatPlaceholder,
                 welcomeMessage, suggestions, fontSize, borderRadius, logoUrl] =
            await Promise.all([
              ctx.kv.get("settings:topK"),
              ctx.kv.get("state:siteToken"),
              ctx.kv.get("settings:chatMode"), ctx.kv.get("settings:theme"),
              ctx.kv.get("settings:accentColor"), ctx.kv.get("settings:bgColor"),
              ctx.kv.get("settings:userBubbleColor"), ctx.kv.get("settings:botBubbleColor"),
              ctx.kv.get("settings:chatTitle"), ctx.kv.get("settings:chatSubtitle"),
              ctx.kv.get("settings:chatPlaceholder"), ctx.kv.get("settings:welcomeMessage"),
              ctx.kv.get("settings:suggestions"), ctx.kv.get("settings:fontSize"),
              ctx.kv.get("settings:borderRadius"), ctx.kv.get("settings:logoUrl"),
            ]);
          // SECURITY: apiEndpoint is NOT returned — chat goes through server-side proxy routes
          return {
            topK: topK ?? 5,
            tenantMeta: { key: "site_id", value: siteToken ?? "" },
            chatDesign: {
              mode: chatMode ?? "floating", theme: theme ?? "dark",
              accent: accentColor ?? "#6366f1", bg: bgColor ?? "#0f1117",
              userBubble: userBubbleColor ?? "#6366f1", botBubble: botBubbleColor ?? "#1e293b",
              title: chatTitle ?? "AI Assistant", subtitle: chatSubtitle ?? "Ask me anything",
              placeholder: chatPlaceholder ?? "Type your message",
              welcome: welcomeMessage ?? "Hi! How can I help you today?",
              suggestions: suggestions ?? "[]", fontSize: fontSize ?? 14,
              radius: borderRadius ?? 16, logo: logoUrl ?? "",
            },
          };
        },
      },

      // Public chat proxy — browser never touches the Modal API directly
      "chat/session": {
        public: true,
        handler: async (ctx) => {
          const ep  = ((await ctx.kv.get<string>("settings:apiEndpoint")) ?? "").replace(/\/$/, "");
          const st  =  (await ctx.kv.get<string>("state:siteToken"))      ?? "";
          if (!ep) throw new Error("Chat not configured");
          const body = ctx.input as Record<string, unknown> ?? {};
          // Always inject the site's tenant metadata filter
          const metadata_filters = { ...(body.metadata_filters as Record<string, unknown> ?? {}), site_id: st };
          const res = await ctx.http!.fetch(`${ep}/api/chat/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...body, metadata_filters }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        },
      },

      "chat/session/get": {
        public: true,
        handler: async (ctx) => {
          const ep  = ((await ctx.kv.get<string>("settings:apiEndpoint")) ?? "").replace(/\/$/, "");
          const st  =  (await ctx.kv.get<string>("state:siteToken"))      ?? "";
          if (!ep) throw new Error("Chat not configured");
          const url = new URL(ctx.request.url);
          const sessionId = url.searchParams.get("sessionId") ?? "";
          if (!sessionId) throw new Error("sessionId required");
          const res = await ctx.http!.fetch(
            `${ep}/api/chat/sessions/${encodeURIComponent(sessionId)}?site_id=${encodeURIComponent(st)}`,
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        },
      },

      "chat/query": {
        public: true,
        handler: async (ctx) => {
          const ep   = ((await ctx.kv.get<string>("settings:apiEndpoint")) ?? "").replace(/\/$/, "");
          const st   =  (await ctx.kv.get<string>("state:siteToken"))      ?? "";
          const topK =  (await ctx.kv.get<number>("settings:topK"))        ?? 5;
          if (!ep) throw new Error("Chat not configured");
          const body = ctx.input as Record<string, unknown> ?? {};
          // Always enforce server-side topK and tenant filter — never trust browser values
          const res = await ctx.http!.fetch(`${ep}/api/rag/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...body, top_k: topK, site_id: st, use_agents: true }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        },
      },

      "settings/get": {
        handler: async (ctx) => {
          const all = await ctx.kv.list("settings:");
          const settings: Record<string, unknown> = {};
          for (const e of all) {
            const key = e.key.replace("settings:", "");
            // SECURITY: Never expose secretKey to the browser
            if (key === "secretKey") continue;
            settings[key] = e.value;
          }

          // Generate site token on first access if not yet created
          let siteToken = await ctx.kv.get<string>("state:siteToken");
          if (!siteToken) {
            siteToken = "site_" + Array.from(crypto.getRandomValues(new Uint8Array(16)))
              .map((b) => b.toString(16).padStart(2, "0")).join("");
            await ctx.kv.set("state:siteToken", siteToken);
          }

          // secretKey is intentionally NOT returned — admin routes use it server-side only
          return { settings, siteToken };
        },
      },
      "settings/save": {
        handler: async (ctx) => {
          const input = ctx.input as Record<string, unknown>;
          for (const [key, value] of Object.entries(input)) {
            if (value !== undefined) await ctx.kv.set(`settings:${key}`, value);
          }
          return { ok: true };
        },
      },

      "design/reset": {        handler: async (ctx) => {
          const d: Record<string, unknown> = {
            "settings:chatMode": "floating", "settings:theme": "dark",
            "settings:accentColor": "#6366f1", "settings:bgColor": "#0f1117",
            "settings:userBubbleColor": "#6366f1", "settings:botBubbleColor": "#1e293b",
            "settings:chatTitle": "AI Assistant", "settings:chatSubtitle": "Ask me anything",
            "settings:chatPlaceholder": "Type your message",
            "settings:welcomeMessage": "Hi! How can I help you today?",
            "settings:suggestions": '["What are the main topics?","Summarize key points","What training is required?"]',
            "settings:fontSize": 14, "settings:borderRadius": 16, "settings:logoUrl": "",
          };
          for (const [k, v] of Object.entries(d)) await ctx.kv.set(k, v);
          return { ok: true };
        },
      },

      health: {
        public: true,
        handler: async (ctx) => {
          // Allow passing endpoint directly as query param for "test before save"
          const url = new URL(ctx.request.url);
          const rawEp = url.searchParams.get("endpoint")
            ?? ((await ctx.kv.get<string>("settings:apiEndpoint")) ?? "").replace(/\/$/, "");
          if (!rawEp) return { ok: false, error: "API endpoint not configured" };

          // SECURITY: Validate URL — only allow http/https and block private/internal IP ranges
          let ep: string;
          try {
            const parsed = new URL(rawEp);
            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
              return { ok: false, error: "Invalid endpoint protocol" };
            }
            const host = parsed.hostname.toLowerCase();
            // Block private IP ranges, loopback, link-local, and metadata endpoints
            const blocked = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1|fc00:|fd[0-9a-f]{2}:)/i;
            if (blocked.test(host)) {
              return { ok: false, error: "Endpoint host not allowed" };
            }
            ep = parsed.origin + parsed.pathname.replace(/\/$/, "");
          } catch {
            return { ok: false, error: "Invalid endpoint URL" };
          }

          try {
            const res = await ctx.http!.fetch(`${ep}/api/health`);
            return { ok: res.ok, status: res.status };
          } catch (e) { return { ok: false, error: String(e) }; }
        },
      },

      "agent-config/save": {
        handler: async (ctx) => {
          const input = ctx.input as Record<string, unknown>;
          const ep  = ((await ctx.kv.get<string>("settings:apiEndpoint")) ?? "").replace(/\/$/, "");
          const sec =  (await ctx.kv.get<string>("settings:secretKey"))   ?? "";
          if (!ep || !sec) throw new Error("API endpoint or secret key not configured");
          const payload = { ...input };
          if (!payload.api_key) delete payload.api_key;
          const res = await ctx.http!.fetch(`${ep}/api/agent/config`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-InjectAI-Key": sec },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        },
      },

      "agent-config/load": {
        handler: async (ctx) => {
          const st  =  (await ctx.kv.get<string>("state:siteToken"))        ?? "";
          const ep  = ((await ctx.kv.get<string>("settings:apiEndpoint")) ?? "").replace(/\/$/, "");
          const sec =  (await ctx.kv.get<string>("settings:secretKey"))   ?? "";
          if (!ep || !sec) throw new Error("API endpoint or secret key not configured");
          const res = await ctx.http!.fetch(`${ep}/api/agent/config?site_token=${encodeURIComponent(st)}`, { headers: { "X-InjectAI-Key": sec } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        },
      },

      // TUS PATCH proxy — browser sends chunk as base64 JSON so EmDash's body parser doesn't conflict
      "upload/patch": {
        handler: async (ctx) => {
          const ep  = ((await ctx.kv.get<string>("settings:apiEndpoint")) ?? "").replace(/\/$/, "");
          const sec =  (await ctx.kv.get<string>("settings:secretKey"))   ?? "";
          if (!ep || !sec) throw new Error("API endpoint or secret key not configured");
          const input = ctx.input as { uploadId: string; offset: number; chunk: string };
          if (!input.uploadId) throw new Error("uploadId required");
          // Decode base64 chunk back to binary
          const binary = Uint8Array.from(atob(input.chunk), c => c.charCodeAt(0));
          const res = await ctx.http!.fetch(`${ep}/upload/large/${input.uploadId}`, {
            method: "PATCH",
            headers: {
              "Upload-Offset":  String(input.offset ?? 0),
              "Content-Type":   "application/offset+octet-stream",
              "Tus-Resumable":  "1.0.0",
              "X-InjectAI-Key": sec,
              "Content-Length": String(binary.byteLength),
            },
            body: binary,
          });
          if (!res.ok) throw new Error(`Upload patch failed: HTTP ${res.status}`);
          return res.json();
        },
      },

      "upload/init": {        handler: async (ctx) => {
          const input = ctx.input as { filename: string; filesize: number; filetype: string; batch_id?: string };
          const ep  = ((await ctx.kv.get<string>("settings:apiEndpoint")) ?? "").replace(/\/$/, "");
          const sec =  (await ctx.kv.get<string>("settings:secretKey"))   ?? "";
          const st  =  (await ctx.kv.get<string>("state:siteToken"))      ?? "";
          if (!ep || !sec) throw new Error("API endpoint or secret key not configured");
          const meta: Record<string, string> = { filename: input.filename, filetype: input.filetype, site_id: st, batch_id: input.batch_id ?? "" };
          const metaHeader = Object.entries(meta).map(([k, v]) => `${k} ${btoa(encodeURIComponent(v).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))}`).join(",");
          const res = await ctx.http!.fetch(`${ep}/upload/large`, {
            method: "POST",
            headers: { "Upload-Length": String(input.filesize), "Upload-Metadata": metaHeader, "Tus-Resumable": "1.0.0", "X-InjectAI-Key": sec },
          });
          if (!res.ok) throw new Error(`Upload init failed: HTTP ${res.status}`);
          const uploadId = res.headers.get("Upload-Id") ?? (res.headers.get("Location") ?? "").split("/").pop() ?? "";
          return { uploadId, location: res.headers.get("Location") };
        },
      },

      "uploads/list": {
        handler: async (ctx) => {
          const ep  = ((await ctx.kv.get<string>("settings:apiEndpoint")) ?? "").replace(/\/$/, "");
          const sec =  (await ctx.kv.get<string>("settings:secretKey"))   ?? "";
          const st  =  (await ctx.kv.get<string>("state:siteToken"))      ?? "";
          if (!ep || !sec) throw new Error("API endpoint or secret key not configured");
          const url = new URL(ctx.request.url);
          const limit  = url.searchParams.get("limit")  ?? "50";
          const offset = url.searchParams.get("offset") ?? "0";
          // site_id is passed as a dynamic metadata filter — Modal filters by metadata JSON field
          const params = new URLSearchParams({ limit, offset, site_id: st });
          const res = await ctx.http!.fetch(`${ep}/uploads?${params}`, { headers: { "X-InjectAI-Key": sec } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        },
      },

      "uploads/delete": {
        handler: async (ctx) => {
          const { uploadId } = ctx.input as { uploadId: string };
          const ep  = ((await ctx.kv.get<string>("settings:apiEndpoint")) ?? "").replace(/\/$/, "");
          const sec =  (await ctx.kv.get<string>("settings:secretKey"))   ?? "";
          if (!ep || !sec) throw new Error("API endpoint or secret key not configured");
          const res = await ctx.http!.fetch(`${ep}/uploads/${uploadId}`, { method: "DELETE", headers: { "X-InjectAI-Key": sec } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return { ok: true };
        },
      },

      generate: {
        handler: async (ctx) => {
          const input = ctx.input as { uploadId?: string; batchId?: string; type: string; systemPrompt: string; userPrompt: string; provider?: string; model?: string; temperature?: number; maxTokens?: number };
          const ep  = ((await ctx.kv.get<string>("settings:apiEndpoint")) ?? "").replace(/\/$/, "");
          const sec =  (await ctx.kv.get<string>("settings:secretKey"))   ?? "";
          if (!ep || !sec) throw new Error("API endpoint or secret key not configured");
          const endpoint = input.batchId ? `/generate_module/batch/${input.batchId}` : `/generate_module/${input.uploadId}`;
          // SECURITY: Read provider/model from server-side agent config — never trust browser-supplied values
          const agentRes = await ctx.http!.fetch(`${ep}/api/agent/config?site_token=${encodeURIComponent((await ctx.kv.get<string>("state:siteToken")) ?? "")}`, { headers: { "X-InjectAI-Key": sec } });
          const agentCfg = agentRes.ok ? await agentRes.json().catch(() => ({})) as Record<string, unknown> : {};
          const provider    = (agentCfg as any)?.config?.provider    ?? "cerebras";
          const model       = (agentCfg as any)?.config?.model       ?? "";
          const temperature = (agentCfg as any)?.config?.temperature ?? input.temperature ?? 0.1;
          const maxTokens   = (agentCfg as any)?.config?.max_tokens  ?? input.maxTokens   ?? 4000;
          const res = await ctx.http!.fetch(`${ep}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-InjectAI-Key": sec },
            body: JSON.stringify({ provider, model, temperature, max_tokens: maxTokens, stream: false, system_prompt: input.systemPrompt, user_prompt: input.userPrompt }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        },
      },

      "history/list": {
        handler: async (ctx) => {
          const ep  = ((await ctx.kv.get<string>("settings:apiEndpoint")) ?? "").replace(/\/$/, "");
          const sec =  (await ctx.kv.get<string>("settings:secretKey"))   ?? "";
          const st  =  (await ctx.kv.get<string>("state:siteToken"))      ?? "";
          if (!ep || !sec) throw new Error("API endpoint or secret key not configured");
          const url = new URL(ctx.request.url);
          const params = new URLSearchParams({ site_token: st, limit: url.searchParams.get("limit") ?? "50" });
          if (url.searchParams.get("cursor")) params.set("cursor", url.searchParams.get("cursor")!);
          const res = await ctx.http!.fetch(`${ep}/api/chat/sessions?${params}`, { headers: { "X-InjectAI-Key": sec } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        },
      },

      "history/messages": {
        handler: async (ctx) => {
          const { sessionId } = ctx.input as { sessionId: string };
          const ep  = ((await ctx.kv.get<string>("settings:apiEndpoint")) ?? "").replace(/\/$/, "");
          const sec =  (await ctx.kv.get<string>("settings:secretKey"))   ?? "";
          const st  =  (await ctx.kv.get<string>("state:siteToken"))      ?? "";
          if (!ep || !sec) throw new Error("API endpoint or secret key not configured");
          const res = await ctx.http!.fetch(`${ep}/api/chat/sessions/${encodeURIComponent(sessionId)}/messages?site_token=${encodeURIComponent(st)}`, { headers: { "X-InjectAI-Key": sec } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        },
      },

      "history/delete": {
        handler: async (ctx) => {
          const { sessionId } = ctx.input as { sessionId: string };
          const ep  = ((await ctx.kv.get<string>("settings:apiEndpoint")) ?? "").replace(/\/$/, "");
          const sec =  (await ctx.kv.get<string>("settings:secretKey"))   ?? "";
          const st  =  (await ctx.kv.get<string>("state:siteToken"))      ?? "";
          if (!ep || !sec) throw new Error("API endpoint or secret key not configured");
          const res = await ctx.http!.fetch(`${ep}/api/chat/sessions/${encodeURIComponent(sessionId)}?site_token=${encodeURIComponent(st)}`, { method: "DELETE", headers: { "X-InjectAI-Key": sec } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return { ok: true };
        },
      },
    },
  });
}

// Default export — the plugin instance, loaded by emdash at runtime
export default createPlugin();

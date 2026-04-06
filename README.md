# @injectailabs/emdash-injectai

AI chatbot plugin for [EmDash CMS](https://github.com/emdash-cms/emdash) — powered by your own content.

Upload PDFs, videos, and documents. Your visitors get an AI assistant that answers questions grounded in that content — no hallucinations, no generic responses.

```bash
npm install @injectailabs/emdash-injectai
```

[![npm](https://img.shields.io/npm/v/@injectailabs/emdash-injectai)](https://www.npmjs.com/package/@injectailabs/emdash-injectai)
[![license](https://img.shields.io/npm/l/@injectailabs/emdash-injectai)](./LICENSE)

---

## Requirements

- EmDash CMS `>=0.1.0`
- Astro `>=4.0.0` with `output: "server"`
- Node.js `>=18.0.0`
- An [InjectAI Labs](https://injectailabs.space) account — you need an API endpoint URL and a secret key

> This plugin uses **native format** (React admin UI + API routes). It must be installed via npm and registered in `astro.config.mjs`. It is not available through the EmDash admin marketplace.

---

## Installation

**1. Install the package**

```bash
npm install @injectailabs/emdash-injectai
```

**2. Register in `astro.config.mjs`**

```js
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import emdash from "emdash/astro";
import { injectAI } from "@injectailabs/emdash-injectai";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  vite: {
    optimizeDeps: {
      exclude: [
        "@injectailabs/emdash-injectai",
        "@injectailabs/emdash-injectai/sandbox",
        "@injectailabs/emdash-injectai/admin",
        "@injectailabs/emdash-injectai/astro",
      ],
    },
    ssr: {
      external: [
        "@injectailabs/emdash-injectai",
        "@injectailabs/emdash-injectai/sandbox",
      ],
    },
  },
  integrations: [
    react(),
    emdash({
      plugins: [injectAI()],
    }),
  ],
});
```

> The `vite.optimizeDeps.exclude` and `vite.ssr.external` entries are required. Without them, Vite's dep optimizer will try to pre-bundle the plugin and cause worker crashes in dev mode.

**3. Add fragment injection points to your layout**

The global chat widget uses EmDash's `page:fragments` hook. Your base layout **must** include both `<EmDashHead>` and `<EmDashBodyEnd>` — these are standard EmDash components that all plugins rely on.

```astro
---
import { EmDashHead, EmDashBodyEnd } from "emdash/ui";
import { createPublicPageContext } from "emdash/page";

const pageCtx = createPublicPageContext({ Astro, kind: "custom", ... });
---
<html>
  <head>
    <EmDashHead page={pageCtx} />
  </head>
  <body>
    <slot />
    <!-- Required for page:fragments hooks — global chat injects here -->
    <EmDashBodyEnd page={pageCtx} />
  </body>
</html>
```

> `<EmDashBodyEnd>` is a standard EmDash component — not specific to this plugin. Any EmDash plugin that uses `page:fragments` (analytics, SEO scripts, chat widgets) requires it. If your template already has it, no changes needed.

**4. Start your dev server**

```bash
npm run dev
```

Navigate to `/_emdash/admin/plugins/injectai` — the plugin panel will appear.

---

## First-time setup

### Step 1 — Connect your API

Go to **Admin → Plugins → InjectAI → Settings**.

| Field | What to enter |
|---|---|
| API Endpoint | Your InjectAI Modal deployment URL, e.g. `https://yourendpoint.injectailabs.space` |
| Secret Key | Your `iai_xxxx` secret key — used for uploads and admin operations only |
| Top K Results | How many document chunks to retrieve per query (default: 5) |
| Bot Logo URL | Optional — a 40×40px PNG/SVG shown in the chat header |

Click **Test Connection** to verify the endpoint is reachable, then **Save Settings**.

> The secret key is stored server-side only. It is never sent to the browser or included in any public API response.

### Step 2 — Configure your AI agent

Go to the **Settings** tab, scroll to **Agent Configuration**.

| Field | Description |
|---|---|
| Assistant Name | What the bot calls itself (e.g. "Acme Support") |
| Brand / Company | The company it represents |
| Tone | Communication style (e.g. "helpful, concise, professional") |
| Custom Persona | Optional — overrides the auto-built system prompt entirely |
| Provider | AI provider: `cerebras`, `groq`, `openai`, `anthropic`, `google` |
| Model | Model name for the chosen provider |
| API Key | Provider API key — stored encrypted on the server |
| Temperature | 0 = deterministic, 1 = creative. Recommended: `0.1` for RAG |
| Max Tokens | Max response length (100–8000) |

Click **Save Agent Config to Server**. Use **Load Current Config** to pull back what's stored.

### Step 3 — Upload content

Go to **Admin → Plugins → InjectAI → Upload**.

Drag and drop files or click to browse. Supported formats:

- Documents: PDF, DOCX, PPTX, TXT, XLSX, CSV
- Media: MP4, AVI, MOV, MP3, WAV
- Images: JPG, PNG

Files up to **5 GB** are supported. After uploading, switch to the **Files** tab to monitor processing status.

Processing goes through these stages: `uploading` → `processing` → `completed` (or `failed`).

### Step 4 — Design the chat widget

Go to **Admin → Plugins → InjectAI → Chat Designer**.

Customize:
- **Mode** — Floating button (bottom-right) or Full-page (ChatGPT-style with sidebar)
- **Theme** — Dark or Light
- **Colors** — Accent, background, user bubble, bot bubble
- **Typography** — Font size, border radius
- **Content** — Title, subtitle, placeholder text, welcome message, suggestion chips

A live preview updates as you change settings.

---

## Embedding the chat widget

### Option A — Global (all pages)

Go to **Admin → Plugins → InjectAI → Embed** and toggle **Show chat on all pages**.

This injects a floating chat button on every public page of your site. It always uses floating mode regardless of the Chat Designer mode setting.

If a page already has an InjectAI Chat block inserted via the content editor, the global widget is automatically suppressed on that page to avoid duplicates.

### Option B — Specific page via content editor

Open any page in the EmDash content editor, type `/` and select **InjectAI Chat** from the block menu.

The widget renders using the mode set in Chat Designer — floating or full-page. You can insert it on as many pages as you like independently.

### Option C — Astro template (manual)

Import the component directly in any `.astro` file:

```astro
---
import InjectAIChat from "@injectailabs/emdash-injectai/components";
---

<!-- Uses Chat Designer mode (floating or full-page) -->
<InjectAIChat />

<!-- Always floating, regardless of Chat Designer setting -->
<InjectAIChat forceFloating />
```

This is useful for custom layouts or pages outside the EmDash content system.

---

## Admin panel tabs

| Tab | What it does |
|---|---|
| **Settings** | API endpoint, secret key, agent config |
| **Upload** | Upload files to the knowledge base |
| **Files** | View uploaded files, check processing status, delete |
| **Generate** | Generate modules, quizzes, or checklists from uploaded content |
| **History** | Browse and inspect all public chat sessions |
| **Chat Designer** | Customize widget appearance with live preview |
| **Embed** | Toggle global chat, copy embed snippet |
| **Docs** | Quick reference |

---

## Generating content from uploads

Go to **Admin → Plugins → InjectAI → Generate**.

1. Choose a content type: **Module** (HTML), **Quiz** (JSON), or **Checklist** (JSON)
2. Enter the Upload ID or Batch ID from the Files tab
3. Optionally edit the system/user prompts
4. Click **Generate**

The provider and model are read from your saved Agent Configuration — you don't need to re-enter them here.

---

## Troubleshooting

**"API endpoint not configured" in the chat widget**
→ Go to Settings, enter your Modal URL, and click Save.

**"Secret key not configured" when saving agent config or uploading**
→ Enter your secret key in Settings and save. It only needs to be entered once.

**Site Token shows "(generating…)"**
→ Save Settings once — this triggers token generation.

**Files stuck in `processing`**
→ Check your Modal deployment logs. Processing is handled asynchronously by the backend.

**Global chat not appearing**
→ Two things to check:
1. Confirm the Embed toggle is on and `apiEndpoint` is saved in Settings.
2. Make sure your base layout has `<EmDashBodyEnd page={pageCtx} />` just before `</body>`. This is the injection point the plugin uses — without it the script is never written into the page HTML.

**Chat widget not rendering on a specific page**
→ Make sure the page renders its content through `<PortableText>`. If your template uses a custom wrapper component with an explicit `type` map (e.g. `components={{ type: myTypes }}`), add `"injectai-chat"` to that map:
```js
import InjectAIChat from "@injectailabs/emdash-injectai/components";

const myTypes = {
  // ...your existing types
  "injectai-chat": InjectAIChat,
};
```
Plugin components are auto-wired only when `<PortableText>` is used without a custom `type` override.

---

## Support

- Email: [injectailabs.space@gmail.com](mailto:injectailabs.space@gmail.com)
- Website: [injectailabs.space](https://injectailabs.space)
- Issues: [github.com/injectailabs/emdash-plugin-injectai/issues](https://github.com/injectailabs/emdash-plugin-injectai/issues)

---

## License

MIT © [InjectAI Labs](https://injectailabs.space)

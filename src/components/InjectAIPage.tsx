import { useState } from "react";
import { Tabs } from "@cloudflare/kumo/components/tabs";
import { SettingsTab }  from "./tabs/SettingsTab.js";
import { UploadTab }    from "./tabs/UploadTab.js";
import { FilesTab }     from "./tabs/FilesTab.js";
import { GenerateTab }  from "./tabs/GenerateTab.js";
import { HistoryTab }   from "./tabs/HistoryTab.js";
import { DesignerTab }  from "./tabs/DesignerTab.js";
import { DocsTab }      from "./tabs/DocsTab.js";

const TABS = [
  { value: "settings",  label: "Settings"      },
  { value: "upload",    label: "Upload"         },
  { value: "files",     label: "Files"          },
  { value: "generate",  label: "Generate"       },
  { value: "history",   label: "Chat History"   },
  { value: "designer",  label: "Chat Designer"  },
  { value: "docs",      label: "Documentation"  },
];

export function InjectAIPage() {
  const [tab, setTab] = useState("settings");

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700 }}>InjectAI</h1>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted, #888)" }}>
          AI chatbot powered by your own content — PDFs, videos, documents and more.
        </p>
      </div>

      {/* Top tabs */}
      <div style={{ borderBottom: "1px solid var(--color-border, #e5e7eb)", marginBottom: 28 }}>
        <Tabs
          variant="underline"
          tabs={TABS}
          value={tab}
          onValueChange={setTab}
        />
      </div>

      {/* Tab content */}
      {tab === "settings"  && <SettingsTab />}
      {tab === "upload"    && <UploadTab />}
      {tab === "files"     && <FilesTab />}
      {tab === "generate"  && <GenerateTab />}
      {tab === "history"   && <HistoryTab />}
      {tab === "designer"  && <DesignerTab />}
      {tab === "docs"      && <DocsTab />}
    </div>
  );
}

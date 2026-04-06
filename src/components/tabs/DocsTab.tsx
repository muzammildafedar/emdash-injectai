import { Surface } from "@cloudflare/kumo/components/surface";
import { Badge }   from "@cloudflare/kumo/components/badge";

export function DocsTab() {
  return (
    <div style={{maxWidth: 800, display: "flex", flexDirection: "column", gap: 20}}>
      <Surface>
        <div style={{padding:"20px 24px"}}>
          <h2 style={{margin:"0 0 16px",fontSize:16,fontWeight:600}}>Quick Start</h2>
          <ol style={{margin:0,paddingLeft:20,display:"flex",flexDirection:"column",gap:8,fontSize:13,lineHeight:1.6}}>
            <li>Get your credentials — Contact InjectAI Labs to receive your API Endpoint URL and Secret Key.</li>
            <li>Enter credentials — Go to <strong>Settings</strong> tab and configure via the auto-generated settings form.</li>
            <li>Set your AI agent — Choose provider (Cerebras recommended), enter model name and API key.</li>
            <li>Upload content — Go to <strong>Upload</strong> tab and drag your files.</li>
            <li>Design your chatbot — Go to <strong>Chat Designer</strong> tab to customize appearance.</li>
            <li>Embed — Add the <code style={{background:"var(--color-bg-secondary,#f5f5f5)",padding:"1px 6px",borderRadius:4,fontSize:12}}>&lt;InjectAIChat /&gt;</code> Astro component to any page.</li>
          </ol>
        </div>
      </Surface>

      <Surface>
        <div style={{padding:"20px 24px"}}>
          <h2 style={{margin:"0 0 16px",fontSize:16,fontWeight:600}}>Astro Component</h2>
          <pre style={{margin:0,padding:"14px 16px",background:"var(--color-bg-secondary,#f5f5f5)",borderRadius:8,fontSize:12,overflow:"auto",border:"1px solid var(--color-border,#e5e7eb)"}}>
{`---
import InjectAIChat from "@injectailabs/emdash-plugin-injectai/components";
---
<InjectAIChat />`}
          </pre>
          <p style={{margin:"10px 0 0",fontSize:13,color:"var(--color-text-muted,#888)"}}>
            The component auto-fetches design settings from <code style={{fontSize:12}}>/_emdash/api/plugins/injectai/config</code> and renders the chat widget. No configuration needed in the template.
          </p>
        </div>
      </Surface>

      <Surface>
        <div style={{padding:"20px 24px"}}>
          <h2 style={{margin:"0 0 16px",fontSize:16,fontWeight:600}}>Security Model</h2>
          <div style={{display:"flex",flexDirection:"column",gap:10,fontSize:13}}>
            {[
              ["Chat",              "Public — no key needed. Safe to embed anywhere.",                "success"],
              ["Upload & Generate", "Require secret key. Admin panel only.",                         "warning"],
              ["Tenant isolation",  "Each site's uploads tagged with an opaque site token.",         "default"],
              ["Agent API key",     "Stored encrypted on the server. Never sent to the browser.",    "default"],
            ].map(([label, desc, variant]) => (
              <div key={label} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <Badge variant={variant as any}>{label}</Badge>
                <span style={{color:"var(--color-text-muted,#888)"}}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </Surface>

      <Surface>
        <div style={{padding:"20px 24px"}}>
          <h2 style={{margin:"0 0 12px",fontSize:16,fontWeight:600}}>Support</h2>
          <p style={{margin:0,fontSize:13}}>
            Contact{" "}
            <a href="mailto:injectailabs.space@gmail.com" style={{color:"var(--color-accent,#6366f1)"}}>injectailabs.space@gmail.com</a>
            {" or visit "}
            <a href="https://injectailabs.space" target="_blank" rel="noopener noreferrer" style={{color:"var(--color-accent,#6366f1)"}}>injectailabs.space</a>.
          </p>
        </div>
      </Surface>
    </div>
  );
}

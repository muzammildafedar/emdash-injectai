import { useState } from "react";
import { Button }    from "@cloudflare/kumo/components/button";
import { Input, InputArea } from "@cloudflare/kumo/components/input";
import { Field }     from "@cloudflare/kumo/components/field";
import { Select }    from "@cloudflare/kumo/components/select";
import { Surface }   from "@cloudflare/kumo/components/surface";
import { Loader }    from "@cloudflare/kumo/components/loader";
import { apiPost }   from "../../lib/api.js";

type GenType = "module" | "quiz" | "checklist";

const SYS: Record<GenType, string> = {
  module:    "Create educational modules from provided content formatted as clean HTML. Output ONLY HTML, no markdown, no preamble.",
  quiz:      'Generate educational quizzes in valid JSON: {"title":"","description":"","questions":[{"id":1,"type":"multiple_choice","question":"","options":[],"correct_answer":"","explanation":""}]}. Output ONLY JSON.',
  checklist: 'Generate actionable checklists in valid JSON: {"title":"","description":"","sections":[{"title":"","items":[{"text":"","priority":"High|Medium|Low","estimated_time":"","tip":""}]}]}. Output ONLY JSON.',
};
const USR: Record<GenType, string> = {
  module:    "Create a comprehensive educational module from the following content. Output ONLY HTML:\n\n{content}",
  quiz:      "Generate a comprehensive quiz from the following content. Output ONLY valid JSON:\n\n{content}",
  checklist: "Create a comprehensive checklist from the following content. Output ONLY valid JSON:\n\n{content}",
};

export function GenerateTab() {
  const [genType, setGenType]   = useState<GenType>("module");
  const [mode, setMode]         = useState<"single"|"batch">("single");
  const [sourceId, setSourceId] = useState("");
  const [sys, setSys]           = useState(SYS.module);
  const [usr, setUsr]           = useState(USR.module);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<string | null>(null);
  const [error, setError]       = useState("");

  function selectType(t: GenType) {
    setGenType(t); setSys(SYS[t]); setUsr(USR[t]); setResult(null);
  }

  async function generate() {
    if (!sourceId.trim()) { setError("Enter an Upload ID or Batch ID"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      // Use server-side proxy route — secretKey never touches the browser
      const d = await apiPost<{generated_module?:string; generated_content?:string}>("generate", {
        uploadId: mode === "single" ? sourceId.trim() : undefined,
        batchId:  mode === "batch"  ? sourceId.trim() : undefined,
        type: genType,
        systemPrompt: sys,
        userPrompt: usr,
        // provider/model/temperature/maxTokens are read server-side from agent config
      });
      const raw = d.generated_module ?? d.generated_content ?? "";
      setResult(raw.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{maxWidth: 900, display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, alignItems: "start"}}>
      {/* Left controls */}
      <Surface>
        <div style={{padding: "20px 20px", display: "flex", flexDirection: "column", gap: 14}}>
          <h2 style={{margin: 0, fontSize: 16, fontWeight: 600}}>Generate Content</h2>

          <Field label="Content Type">
            <Select value={genType} onValueChange={v => selectType(v as GenType)}>
              <Select.Option value="module">📝 Module</Select.Option>
              <Select.Option value="quiz">❓ Quiz</Select.Option>
              <Select.Option value="checklist">✅ Checklist</Select.Option>
            </Select>
          </Field>

          <Field label="Source Mode">
            <Select value={mode} onValueChange={v => setMode(v as "single"|"batch")}>
              <Select.Option value="single">Single File</Select.Option>
              <Select.Option value="batch">Batch</Select.Option>
            </Select>
          </Field>

          <Field label="Upload ID or Batch ID">
            <Input placeholder="upload_abc123" value={sourceId} onChange={e => setSourceId(e.target.value)} />
          </Field>

          <details style={{fontSize: 13}}>
            <summary style={{cursor:"pointer",fontWeight:600,marginBottom:8}}>✏️ Edit Prompts</summary>
            <Field label="System Prompt">
              <InputArea rows={5} value={sys} onChange={e => setSys(e.target.value)} />
            </Field>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
              <Button variant="ghost" onClick={() => setSys(SYS[genType])}>↺ Reset</Button>
            </div>
            <Field label="User Prompt" description="Use {content} as placeholder for file content.">
              <InputArea rows={3} value={usr} onChange={e => setUsr(e.target.value)} />
            </Field>
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              <Button variant="ghost" onClick={() => setUsr(USR[genType])}>↺ Reset</Button>
            </div>
          </details>

          {error && <div style={{padding:"8px 12px",borderRadius:6,background:"#fee2e2",color:"#991b1b",fontSize:12,border:"1px solid #fecaca"}}>{error}</div>}

          <Button variant="primary" disabled={loading} onClick={generate}>
            {loading ? "Generating…" : "⚡ Generate"}
          </Button>
        </div>
      </Surface>

      {/* Right preview */}
      <Surface>
        <div style={{padding: "20px 24px", minHeight: 360}}>
          {!result && !loading && (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:280,gap:10,color:"var(--color-text-muted,#888)"}}>
              <span style={{fontSize:36}}>⚡</span>
              <p style={{margin:0,fontSize:13}}>Generated content appears here</p>
            </div>
          )}
          {loading && <div style={{display:"flex",justifyContent:"center",padding:32}}><Loader /></div>}
          {result && genType === "module" && (
            <div style={{fontSize:13,lineHeight:1.7}}>
              {/* SECURITY: Render as text to prevent XSS from AI-generated content */}
              <pre style={{whiteSpace:"pre-wrap",wordBreak:"break-word",fontFamily:"inherit",fontSize:13,lineHeight:1.7}}>{result}</pre>
            </div>
          )}
          {result && genType !== "module" && (
            <pre style={{fontSize:12,whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0}}>{result}</pre>
          )}
        </div>
      </Surface>
    </div>
  );
}

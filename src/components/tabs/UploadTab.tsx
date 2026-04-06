import { useState, useRef, useCallback } from "react";
import { Button }   from "@cloudflare/kumo/components/button";
import { Field }    from "@cloudflare/kumo/components/field";
import { Input }    from "@cloudflare/kumo/components/input";
import { Surface }  from "@cloudflare/kumo/components/surface";
import { Badge }    from "@cloudflare/kumo/components/badge";
import { apiGet, apiPost } from "../../lib/api.js";

const CHUNK = 10 * 1024 * 1024;
function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}

export function UploadTab() {
  const [files, setFiles]       = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [log, setLog]           = useState<{name:string; ok:boolean; msg:string}[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLog = (name: string, ok: boolean, msg: string) =>
    setLog(l => [...l, {name, ok, msg}]);

  const upload = useCallback(async () => {
    if (!files.length || uploading) return;
    setUploading(true); setLog([]);

    for (const file of files) {
      try {
        // Init via server-side proxy (secretKey used server-side only)
        const init = await apiPost<{uploadId:string; location:string|null}>("upload/init", {
          filename: file.name, filesize: file.size,
          filetype: file.type || "application/octet-stream",
        });
        const uploadId = init.uploadId;
        if (!uploadId) throw new Error("No upload ID returned");

        // TUS PATCH chunks via server-side proxy — secretKey never in browser
        // Chunks are base64-encoded and sent as JSON so EmDash's body parser handles it cleanly
        let offset = 0;
        while (offset < file.size) {
          const chunk = file.slice(offset, offset + CHUNK);
          // Convert blob to base64
          const arrayBuf = await chunk.arrayBuffer();
          const bytes = new Uint8Array(arrayBuf);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          const b64 = btoa(binary);

          const pr = await fetch(
            `/_emdash/api/plugins/injectai/upload/patch`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-emdash-request": "1" },
              body: JSON.stringify({ uploadId, offset, chunk: b64 }),
            }
          );
          if (!pr.ok) throw new Error(`Chunk upload failed: HTTP ${pr.status}`);
          const pd = await pr.json().catch(() => ({}));
          offset = (pd as any).uploaded_bytes ?? offset + chunk.size;
        }
        addLog(file.name, true, "Uploaded successfully");
      } catch (e: any) {
        addLog(file.name, false, e.message);
      }
    }
    setFiles([]); setUploading(false);
  }, [files, uploading]);

  return (
    <div style={{maxWidth: 720, display: "flex", flexDirection: "column", gap: 24}}>
      <Surface>
        <div style={{padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16}}>
          <h2 style={{margin: 0, fontSize: 16, fontWeight: 600}}>Upload Content</h2>
          <p style={{margin: 0, fontSize: 13, color: "var(--color-text-muted, #888)"}}>
            Upload files to your InjectAI knowledge base. Supported: PDF, DOCX, PPTX, MP4, MP3, images — up to 5 GB.
          </p>

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); setFiles(Array.from(e.dataTransfer.files)); }}
            style={{
              border: `2px dashed ${dragOver ? "var(--color-accent, #6366f1)" : "var(--color-border, #d1d5db)"}`,
              borderRadius: 10, padding: "32px 20px", textAlign: "center", cursor: "pointer",
              background: dragOver ? "var(--color-bg-hover, #f5f3ff)" : "var(--color-bg-secondary, #fafafa)",
              transition: "border-color 0.15s, background 0.15s",
            }}
          >
            <input ref={inputRef} type="file" multiple hidden
              accept=".mp4,.avi,.mov,.mp3,.wav,.pdf,.doc,.docx,.ppt,.pptx,.txt,.xls,.xlsx,.csv,.jpg,.jpeg,.png"
              onChange={e => setFiles(Array.from(e.target.files ?? []))} />
            <div style={{fontSize: 32, marginBottom: 8}}>⬆️</div>
            <p style={{margin: "0 0 4px", fontWeight: 600, fontSize: 14}}>Drag & drop or click to browse</p>
            <p style={{margin: 0, fontSize: 12, color: "var(--color-text-muted, #888)"}}>Video, Audio, PDF, DOCX, PPTX, Images — up to 5 GB</p>
          </div>

          {files.length > 0 && (
            <div style={{display: "flex", flexDirection: "column", gap: 6}}>
              {files.map(f => (
                <div key={f.name} style={{display: "flex", justifyContent: "space-between", padding: "6px 12px", background: "var(--color-bg-secondary, #f5f5f5)", borderRadius: 6, border: "1px solid var(--color-border, #e5e7eb)", fontSize: 13}}>
                  <span>{f.name}</span>
                  <span style={{color: "var(--color-text-muted, #888)"}}>{fmtSize(f.size)}</span>
                </div>
              ))}
            </div>
          )}

          <Button variant="primary" disabled={!files.length || uploading} onClick={upload}>
            {uploading ? "Uploading…" : "Upload Files"}
          </Button>

          {log.length > 0 && (
            <div style={{display: "flex", flexDirection: "column", gap: 6}}>
              {log.map((l, i) => (
                <div key={i} style={{display: "flex", alignItems: "center", gap: 8, fontSize: 13}}>
                  <Badge variant={l.ok ? "success" : "red"}>{l.ok ? "✓" : "✗"}</Badge>
                  <strong>{l.name}</strong> — {l.msg}
                </div>
              ))}
            </div>
          )}
        </div>
      </Surface>
    </div>
  );
}

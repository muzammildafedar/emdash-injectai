import { useState, useEffect } from "react";
import { Badge }   from "@cloudflare/kumo/components/badge";
import { apiGet }  from "../lib/api.js";

export function StatusWidget() {
  const [status, setStatus]           = useState<"checking"|"ok"|"error">("checking");
  const [uploadCount, setUploadCount] = useState<number|null>(null);

  useEffect(() => {
    Promise.all([
      apiGet<{ok:boolean}>("health"),
      apiGet<{uploads:unknown[]}>("uploads/list?limit=1"),
    ]).then(([health, uploads]) => {
      setStatus((health as any).ok !== false ? "ok" : "error");
      setUploadCount((uploads.uploads as any[])?.length ?? 0);
    }).catch(() => setStatus("error"));
  }, []);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10,padding:"4px 0"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>🤖</span>
        <strong style={{fontSize:14}}>InjectAI</strong>
        <Badge variant={status === "ok" ? "success" : status === "error" ? "red" : "neutral"}>
          {status === "checking" ? "Checking…" : status === "ok" ? "Connected" : "Unreachable"}
        </Badge>
      </div>
      {uploadCount !== null && (
        <p style={{margin:0,fontSize:12,color:"var(--color-text-muted,#888)"}}>
          {uploadCount} upload{uploadCount !== 1 ? "s" : ""} tracked
        </p>
      )}
      <a href="/_emdash/admin/plugins/injectai" style={{fontSize:12,color:"var(--color-accent,#6366f1)"}}>
        Open InjectAI →
      </a>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Button }  from "@cloudflare/kumo/components/button";
import { Surface } from "@cloudflare/kumo/components/surface";
import { Loader }  from "@cloudflare/kumo/components/loader";
import { apiGet, apiPost } from "../../lib/api.js";

// Matches the actual API response shape
interface Upload {
  upload_id: string;
  filename: string;
  file_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  batch_id?: string;
  error_message?: string | null;
  metadata?: Record<string, unknown>;
}

export function FilesTab() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      // Use server-side proxy — secretKey never touches the browser
      const d = await apiGet<{uploads: Upload[]}>("uploads/list");
      setUploads(d.uploads ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = useCallback(async (uploadId: string) => {
    if (!confirm("Delete this upload? This will remove it from the database, Pinecone index, and S3 storage.")) return;
    try {
      await apiPost("uploads/delete", { uploadId });
      setUploads(u => u.filter(x => x.upload_id !== uploadId));
    } catch (e: any) { alert(`Delete failed: ${e.message}`); }
  }, []);

  return (
    <div style={{ maxWidth: 960 }}>
      <Surface>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Uploaded Files</h2>
            <Button variant="secondary" onClick={load}>↺ Refresh</Button>
          </div>

          {loading && <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Loader /></div>}
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fee2e2", color: "#991b1b", fontSize: 13, border: "1px solid #fecaca" }}>
              {error}
            </div>
          )}

          {!loading && !error && uploads.length === 0 && (
            <p style={{ color: "var(--color-text-muted,#888)", fontSize: 13, textAlign: "center", padding: 32 }}>
              No uploads yet.
            </p>
          )}

          {!loading && uploads.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border,#e5e7eb)" }}>
                  {["File", "Type", "Status", "Progress", "Date", "Actions"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted,#888)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uploads.map(u => {
                  const progress = u.metadata?.upload_progress as number | undefined;
                  return (
                    <tr key={u.upload_id} style={{ borderBottom: "1px solid var(--color-border,#e5e7eb)" }}>
                      <td style={{ padding: "10px 12px", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {u.filename}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--color-text-muted,#888)" }}>
                        {u.file_type}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                          background:
                            u.status === "completed"  ? "#dcfce7" :
                            u.status === "failed"     ? "#fee2e2" :
                            u.status === "processing" ? "#fef9c3" :
                            u.status === "uploading"  ? "#dbeafe" : "#f3f4f6",
                          color:
                            u.status === "completed"  ? "#166534" :
                            u.status === "failed"     ? "#991b1b" :
                            u.status === "processing" ? "#854d0e" :
                            u.status === "uploading"  ? "#1e40af" : "#374151",
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                            background:
                              u.status === "completed"  ? "#16a34a" :
                              u.status === "failed"     ? "#dc2626" :
                              u.status === "processing" ? "#ca8a04" :
                              u.status === "uploading"  ? "#2563eb" : "#9ca3af",
                          }} />
                          {u.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--color-text-muted,#888)" }}>
                        {progress != null ? `${Math.round(progress)}%` : "—"}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--color-text-muted,#888)" }}>
                        {u.created_at?.slice(0, 10)}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Button variant="ghost" onClick={() => navigator.clipboard.writeText(u.upload_id)}>
                            Copy ID
                          </Button>
                          <Button variant="destructive" onClick={() => del(u.upload_id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Surface>
    </div>
  );
}

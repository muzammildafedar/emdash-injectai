import { useState, useEffect, useCallback } from "react";
import { Button }  from "@cloudflare/kumo/components/button";
import { Input }   from "@cloudflare/kumo/components/input";
import { Surface } from "@cloudflare/kumo/components/surface";
import { Loader }  from "@cloudflare/kumo/components/loader";
import { apiGet, apiPost } from "../../lib/api.js";

interface Session { session_id: string; created_at?: string; last_message?: string; title?: string; message_count?: number; }
interface Message { role?: string; type?: string; content?: string; message?: string; created_at?: string; }

export function HistoryTab() {
  const [sessions, setSessions]     = useState<Session[]>([]);
  const [filtered, setFiltered]     = useState<Session[]>([]);
  const [activeId, setActiveId]     = useState<string|null>(null);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [loading, setLoading]       = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [search, setSearch]         = useState("");
  const [error, setError]           = useState("");

  const loadSessions = useCallback(async () => {
    setLoading(true); setError(""); setActiveId(null); setMessages([]);
    try {
      // Use server-side proxy — secretKey never touches the browser
      const d = await apiGet<{sessions: Session[]}>("history/list");
      const list: Session[] = d.sessions ?? [];
      setSessions(list); setFiltered(list);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? sessions.filter(s =>
      s.session_id.toLowerCase().includes(q) ||
      (s.last_message ?? s.title ?? "").toLowerCase().includes(q)
    ) : sessions);
  }, [search, sessions]);

  const loadMessages = useCallback(async (sessionId: string) => {
    setActiveId(sessionId); setMsgLoading(true);
    try {
      const d = await apiGet<{messages: Message[]}>(`history/messages?sessionId=${encodeURIComponent(sessionId)}`);
      setMessages(d.messages ?? []);
    } catch { setMessages([]); }
    finally { setMsgLoading(false); }
  }, []);

  const delSession = useCallback(async (sessionId: string) => {
    if (!confirm("Delete this conversation? This cannot be undone.")) return;
    try {
      await apiPost("history/delete", { sessionId });
      setSessions(s => s.filter(x => x.session_id !== sessionId));
      if (activeId === sessionId) { setActiveId(null); setMessages([]); }
    } catch (e: any) { alert(`Could not delete: ${e.message}`); }
  }, [activeId]);

  return (
    <div style={{maxWidth: 1100, display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start"}}>
      {/* Sidebar */}
      <Surface>
        <div style={{padding: "16px 16px", display: "flex", flexDirection: "column", gap: 12}}>
          <div style={{display:"flex",gap:8}}>
            <Input placeholder="Search conversations…" value={search} onChange={e => setSearch(e.target.value)} style={{flex:1}} />
            <Button variant="secondary" onClick={loadSessions}>↺</Button>
          </div>

          {loading && <div style={{display:"flex",justifyContent:"center",padding:24}}><Loader /></div>}
          {error   && <p style={{color:"#991b1b",fontSize:12,margin:0}}>{error}</p>}
          {!loading && filtered.length === 0 && <p style={{color:"var(--color-text-muted,#888)",fontSize:13,margin:0}}>No conversations yet.</p>}

          {filtered.map(s => {
            const date = s.created_at ? new Date(s.created_at).toLocaleDateString([],{month:"short",day:"numeric",year:"numeric"}) : "";
            const active = s.session_id === activeId;
            return (
              <div key={s.session_id}
                onClick={() => loadMessages(s.session_id)}
                style={{padding:"10px 12px",borderRadius:8,cursor:"pointer",border:`1px solid ${active ? "var(--color-accent,#6366f1)" : "var(--color-border,#e5e7eb)"}`,background: active ? "var(--color-bg-hover,#f5f3ff)" : "transparent"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:11,fontFamily:"monospace",color:"var(--color-text-muted,#888)"}}>{s.session_id.slice(0,12)}…</span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:11,color:"var(--color-text-muted,#888)"}}>{date}</span>
                    <button onClick={e => {e.stopPropagation(); delSession(s.session_id);}}
                      style={{background:"none",border:"none",cursor:"pointer",color:"var(--color-text-muted,#888)",fontSize:14,padding:"0 2px",lineHeight:1}}>🗑</button>
                  </div>
                </div>
                <div style={{fontSize:12,color:"var(--color-text-muted,#888)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {(s.last_message ?? s.title ?? "").slice(0,50) || <em>No preview</em>}
                </div>
                {s.message_count != null && <div style={{fontSize:11,color:"var(--color-text-muted,#888)",marginTop:2}}>{s.message_count} message{s.message_count !== 1 ? "s" : ""}</div>}
              </div>
            );
          })}
        </div>
      </Surface>

      {/* Messages */}
      <Surface>
        <div style={{padding:"16px 20px", minHeight: 400}}>
          {!activeId && <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:300,gap:10,color:"var(--color-text-muted,#888)"}}>
            <span style={{fontSize:36}}>💬</span>
            <p style={{margin:0,fontSize:13}}>Select a conversation to view messages</p>
          </div>}
          {activeId && msgLoading && <div style={{display:"flex",justifyContent:"center",padding:32}}><Loader /></div>}
          {activeId && !msgLoading && messages.length === 0 && <p style={{color:"var(--color-text-muted,#888)",fontSize:13}}>No messages in this session.</p>}
          {activeId && !msgLoading && messages.length > 0 && (
            <>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:16,paddingBottom:12,borderBottom:"1px solid var(--color-border,#e5e7eb)"}}>
                <span style={{fontSize:12,fontFamily:"monospace",color:"var(--color-text-muted,#888)"}}>Session: {activeId}</span>
                <span style={{fontSize:12,color:"var(--color-text-muted,#888)"}}>{messages.length} message{messages.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {messages.map((m, i) => {
                  const isUser = (m.role ?? m.type) === "user";
                  const text = m.content ?? m.message ?? "";
                  const ts = m.created_at ? new Date(m.created_at).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "";
                  return (
                    <div key={i} style={{display:"flex",flexDirection:"column",alignItems: isUser ? "flex-end" : "flex-start",gap:4}}>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <span style={{fontSize:11,fontWeight:700,color: isUser ? "var(--color-accent,#6366f1)" : "var(--color-text-muted,#888)"}}>{isUser ? "You" : "AI Assistant"}</span>
                        {ts && <span style={{fontSize:11,color:"var(--color-text-muted,#888)"}}>{ts}</span>}
                      </div>
                      <div style={{maxWidth:"80%",padding:"10px 14px",borderRadius:12,fontSize:13,lineHeight:1.6,
                        background: isUser ? "var(--color-accent,#6366f1)" : "var(--color-bg-secondary,#f5f5f5)",
                        color: isUser ? "#fff" : "var(--color-text,#333)",
                        borderTopRightRadius: isUser ? 4 : 12,
                        borderTopLeftRadius: isUser ? 12 : 4,
                      }}>{text}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Surface>
    </div>
  );
}

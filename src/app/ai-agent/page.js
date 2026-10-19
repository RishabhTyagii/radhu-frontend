'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiUpload, apiDelete } from '@/lib/api';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function nowTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function escapeHtml(t) {
  return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function formatMessage(text) {
  let h = escapeHtml(text || '');
  h = h.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre class="r-pre"><code>${code.trim()}</code></pre>`);
  h = h.replace(/`([^`]+)`/g, '<code class="r-code">$1</code>');
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
  h = h.replace(/^#### (.+)$/gm, '<div class="r-h4">$1</div>');
  h = h.replace(/^### (.+)$/gm, '<div class="r-h3">$1</div>');
  h = h.replace(/^## (.+)$/gm, '<div class="r-h2">$1</div>');
  h = h.replace(/\|(.+)\|/g, (match) => {
    const cells = match.split('|').filter(c => c.trim() !== '');
    return '<div class="r-tr">' + cells.map(c => `<span class="r-td">${c.trim()}</span>`).join('') + '</div>';
  });
  h = h.replace(/^---+$/gm, '<hr class="r-hr"/>');
  h = h.replace(/^[*\-] (.+)$/gm, '<div class="r-li">$1</div>');
  h = h.replace(/^\d+\. (.+)$/gm, '<div class="r-li r-li-num">$1</div>');
  h = h.replace(/\n/g, '<br/>');
  return h;
}
function payloadPreview(action) {
  const p = action.payload || {};
  if (Array.isArray(p.rows) && p.rows.length) {
    const lines = p.rows.slice(0, 5).map(r =>
      Object.values(r).filter(v => v !== '' && v != null).slice(0, 4).join(' · '));
    return `${p.rows.length} rows\n${lines.join('\n')}${p.rows.length > 5 ? '\n…' : ''}`;
  }
  return Object.entries(p)
    .filter(([k]) => k !== 'module' && k !== 'clear_existing')
    .slice(0, 8).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n');
}

const WELCOME = {
  role: 'ai',
  text: `Namaste! Main **RADHU AI** hoon — Radhu Industries ERP ka poora assistant.

Mujhse pooch sakte ho:
- **Stock** — Auto Tyre, Cycle Tyre, Cycle Tube
- **Mixing** — Compound, Rubber, formulas
- **Tally** — invoices, parties, billing, GST
- **HRMS** — employees, attendance, salary
- **Orders, database, koi bhi page ya model**

Main live database directly query karta hoon — seedha sahi jawab milega.`,
  time: nowTime(),
};

const QUICK_PROMPTS = [
  'Aaj ka mixing compound total kitna hai?',
  'Sabse low stock wale cycle tyre dikhao',
  'Is mahine Auto Tyre production kitna hai?',
  'Tally mein is mahine billing kitni hai?',
  'Employee list with salary type dikhao',
  'Pending orders dikhao',
  'rawmaterial_mixing table schema batao',
  'Cycle Tube formula kya hai?',
];

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'rule', label: 'Business Rule' },
  { value: 'formula', label: 'Formula' },
  { value: 'correction', label: 'Correction' },
  { value: 'preference', label: 'Preference' },
  { value: 'party_note', label: 'Party Note' },
];

function badgeStyle(cat) {
  const map = {
    rule:       { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
    formula:    { background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' },
    correction: { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' },
    preference: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' },
    party_note: { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' },
    general:    { background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' },
  };
  return map[cat] || map.general;
}

// ─────────────────────────────────────────────
// TYPING DOT
// ─────────────────────────────────────────────
function Dot({ d }) {
  return <span style={{
    display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
    background: '#6366f1', animation: `rdot 1.3s ${d}s ease-in-out infinite`,
  }} />;
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function AIAgentPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sessionId]             = useState(() => `s_${Date.now()}`);
  const [file, setFile]         = useState(null);
  const [ready, setReady]       = useState(null); // null=loading, true, false
  const [tab, setTab]           = useState('prompts'); // prompts | memory
  const [memories, setMemories] = useState([]);
  const [memLoad, setMemLoad]   = useState(false);
  const [mKey, setMKey]         = useState('');
  const [mVal, setMVal]         = useState('');
  const [mCat, setMCat]         = useState('general');
  const [mSave, setMSave]       = useState(false);
  const bottomRef  = useRef(null);
  const fileRef    = useRef(null);
  const taRef      = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  useEffect(() => {
    apiGet('/ai/status/').then(d => {
      setReady(d?.ready ?? false);
    });
  }, []);

  useEffect(() => {
    if (tab === 'memory') loadMem();
  }, [tab]);

  const loadMem = async () => {
    setMemLoad(true);
    const d = await apiGet('/ai/memories/');
    setMemLoad(false);
    if (d?.memories) setMemories(d.memories);
  };

  const patchAction = useCallback((mi, aid, patch) => {
    setMessages(prev => prev.map((m, i) => i !== mi ? m : {
      ...m, proposed_actions: m.proposed_actions.map(a => a.id === aid ? { ...a, ...patch } : a)
    }));
  }, []);

  const confirmAction = useCallback(async (mi, action) => {
    if (action.requires_typed_delete && action.deleteTyped !== 'DELETE') {
      patchAction(mi, action.id, { uiError: 'Type DELETE to confirm.' }); return;
    }
    patchAction(mi, action.id, { uiStatus: 'loading', uiError: '' });
    const res = await apiPost('/ai/actions/confirm/', { id: action.id, token: action.confirm_token });
    if (res?.data?.ok || res?.ok)
      patchAction(mi, action.id, { uiStatus: 'executed' });
    else
      patchAction(mi, action.id, { uiStatus: 'failed', uiError: res?.data?.error || 'Failed.' });
  }, [patchAction]);

  const rejectAction = useCallback(async (mi, action) => {
    patchAction(mi, action.id, { uiStatus: 'loading' });
    await apiPost('/ai/actions/reject/', { id: action.id, token: action.confirm_token });
    patchAction(mi, action.id, { uiStatus: 'rejected' });
  }, [patchAction]);

  const confirmAll = useCallback(async (mi, actions) => {
    for (const a of actions)
      if (!a.requires_typed_delete && (!a.uiStatus || a.uiStatus === 'proposed' || a.uiStatus === 'failed'))
        await confirmAction(mi, a);
  }, [confirmAction]);

  const clear = async () => {
    await apiPost('/ai/chat/', { reset: 'true', session_id: sessionId });
    setMessages([WELCOME]);
  };

  const send = async (override) => {
    const txt = (override ?? input).trim();
    if (!txt && !file) return;
    if (loading) return;
    setMessages(prev => [...prev, { role: 'user', text: txt || `[File: ${file?.name}]`, time: nowTime(), fileName: file?.name }]);
    setInput('');
    setFile(null);
    setLoading(true);
    try {
      const fd = new FormData();
      if (txt) fd.append('message', txt);
      fd.append('session_id', sessionId);
      if (file) fd.append('file', file);
      const res = await apiUpload('/ai/chat/', fd);
      const d = res?.data || res || {};
      setMessages(prev => [...prev, {
        role: 'ai', text: d.reply || d.error || 'No response.',
        time: nowTime(), proposed_actions: d.proposed_actions || [], isError: !!d.error,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Network error. Backend se connect nahi ho raha.', time: nowTime(), isError: true }]);
    }
    setLoading(false);
    taRef.current?.focus();
  };

  const saveMem = async () => {
    if (!mKey.trim() || !mVal.trim()) return;
    setMSave(true);
    await apiPost('/ai/memories/', { key: mKey, content: mVal, category: mCat });
    setMSave(false);
    setMKey(''); setMVal(''); setMCat('general');
    await loadMem();
  };

  const delMem = async (id) => {
    await apiDelete(`/ai/memories/${id}/delete/`);
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div style={css.shell}>
      {/* ══ GLOBAL STYLES ══ */}
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes rdot {
          0%,80%,100% { transform:scale(0.4); opacity:0.3; }
          40%          { transform:scale(1);   opacity:1;   }
        }
        .r-h2 { font-size:1.05em; font-weight:700; color:#1e293b; margin:10px 0 4px; }
        .r-h3 { font-size:0.95em; font-weight:700; color:#334155; margin:8px 0 3px; }
        .r-h4 { font-size:0.88em; font-weight:700; color:#475569; margin:6px 0 2px; }
        .r-pre {
          background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;
          padding:12px 14px; overflow-x:auto; font-size:0.8em; margin:10px 0;
          color:#1e293b; font-family:'JetBrains Mono','Fira Code',monospace;
        }
        .r-code {
          background:#eff6ff; color:#2563eb; padding:1px 6px;
          border-radius:5px; font-size:0.85em; font-family:monospace;
        }
        .r-li { padding:2px 0 2px 16px; position:relative; color:#334155; }
        .r-li::before { content:"•"; position:absolute; left:4px; color:#6366f1; font-weight:700; }
        .r-tr { display:flex; border-bottom:1px solid #e2e8f0; }
        .r-td { flex:1; padding:5px 8px; font-size:0.82em; color:#475569; border-right:1px solid #f1f5f9; }
        .r-hr { border:none; border-top:1px solid #e2e8f0; margin:12px 0; }
        * { scrollbar-width:thin; scrollbar-color:#c7d2fe transparent; }
        *::-webkit-scrollbar { width:5px; height:5px; }
        *::-webkit-scrollbar-thumb { background:#c7d2fe; border-radius:10px; }
        button:hover { filter: brightness(0.97); }
      `}</style>

      {/* ══ HEADER ══ */}
      <header style={css.header}>
        <div style={css.hLeft}>
          {/* Logo mark */}
          <div style={css.logoBox}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                fill="#6366f1"/>
            </svg>
          </div>
          <div>
            <div style={css.brandName}>RADHU AI</div>
            <div style={css.brandSub}>
              {ready === null && <span style={{ color: '#94a3b8' }}>Connecting…</span>}
              {ready === true  && <span style={{ color: '#16a34a' }}>● Online</span>}
              {ready === false && <span style={{ color: '#dc2626' }}>⚠ Offline — API key check karo</span>}
            </div>
          </div>
        </div>
        <div style={css.hRight}>
          <button style={css.hBtn} onClick={() => router.push('/ai-agent/logs')}>Audit Log</button>
          <button style={css.hBtn} onClick={clear}>New Chat</button>
          <button style={{ ...css.hBtn, ...css.hBtnPrimary }} onClick={() => router.push('/')}>← Home</button>
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div style={css.body}>

        {/* ── SIDEBAR ── */}
        <aside style={css.sidebar}>
          {/* Tabs */}
          <div style={css.tabBar}>
            {[['prompts','Quick Prompts'], ['memory','AI Memory']].map(([k, lbl]) => (
              <button key={k} style={{ ...css.tabBtn, ...(tab === k ? css.tabBtnActive : {}) }}
                onClick={() => setTab(k)}>{lbl}</button>
            ))}
          </div>

          <div style={css.sideBody}>

            {/* PROMPTS TAB */}
            {tab === 'prompts' && (
              <>
                <div style={css.sideLabel}>Click karo — seedha pooch lo</div>
                {QUICK_PROMPTS.map(p => (
                  <button key={p} style={css.promptBtn} disabled={loading} onClick={() => send(p)}>
                    {p}
                  </button>
                ))}
              </>
            )}

            {/* MEMORY TAB */}
            {tab === 'memory' && (
              <>
                <div style={css.sideLabel}>AI ko nayi cheez sikhao</div>
                <input style={css.memInput} placeholder="Title — e.g. Auto Tyre formula"
                  value={mKey} onChange={e => setMKey(e.target.value)} />
                <textarea style={{ ...css.memInput, minHeight: 72, resize: 'vertical' }}
                  placeholder="Rule / Formula / Note…"
                  value={mVal} onChange={e => setMVal(e.target.value)} />
                <select style={css.memInput} value={mCat} onChange={e => setMCat(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <button style={css.saveMBtn} disabled={mSave || !mKey.trim() || !mVal.trim()} onClick={saveMem}>
                  {mSave ? 'Saving…' : '+ Save to Memory'}
                </button>

                <div style={css.memDivider} />
                <div style={{ ...css.sideLabel, marginBottom: 6 }}>
                  Saved Memories &nbsp;<span style={{ color: '#94a3b8', fontWeight: 400 }}>({memories.length})</span>
                </div>
                {memLoad && <div style={css.emptyNote}>Loading…</div>}
                {!memLoad && memories.length === 0 && (
                  <div style={css.emptyNote}>Koi memory nahi. Upar add karo — AI seekh jayega.</div>
                )}
                {memories.map(m => (
                  <div key={m.id} style={css.memCard}>
                    <div style={css.memCardTop}>
                      <span style={{ ...css.badge, ...badgeStyle(m.category) }}>{m.category}</span>
                      <button style={css.delBtn} onClick={() => delMem(m.id)}>✕</button>
                    </div>
                    <div style={css.memTitle}>{m.key}</div>
                    <div style={css.memBody}>{m.content}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </aside>

        {/* ── CHAT ── */}
        <main style={css.chat}>
          <div style={css.msgArea}>
            {messages.map((msg, i) => (
              <div key={`${i}-${msg.time}`} style={{ ...css.row, ...(msg.role === 'user' ? css.rowUser : {}) }}>

                {/* AI avatar */}
                {msg.role === 'ai' && (
                  <div style={css.aiAv}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="#6366f1"/>
                    </svg>
                  </div>
                )}

                <div style={{ maxWidth: '72%', minWidth: 0 }}>
                  <div style={css.senderLbl}>{msg.role === 'ai' ? 'RADHU AI' : 'Aap'}</div>
                  <div
                    style={{ ...css.bubble, ...(msg.role === 'user' ? css.bubbleUser : css.bubbleAi), ...(msg.isError ? css.bubbleErr : {}) }}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                  />
                  {msg.fileName && <div style={css.metaTxt}>📎 {msg.fileName}</div>}

                  {/* Proposed actions */}
                  {!!msg.proposed_actions?.length && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {msg.proposed_actions.filter(a => !a.uiStatus || a.uiStatus === 'proposed' || a.uiStatus === 'failed').length > 1 && (
                        <button style={css.confirmAllBtn} onClick={() => confirmAll(i, msg.proposed_actions)}>
                          Confirm all (except delete)
                        </button>
                      )}
                      {msg.proposed_actions.map(action => (
                        <div key={action.id} style={{ ...css.actionCard, ...(action.risk_level === 'high' ? css.actionHigh : {}) }}>
                          <div style={css.actionTitle}>{action.summary}</div>
                          <div style={css.actionMeta}>{action.module} · {action.action}</div>
                          <pre style={css.actionPre}>{payloadPreview(action)}</pre>
                          {action.requires_typed_delete && action.uiStatus !== 'executed' && action.uiStatus !== 'rejected' && (
                            <input style={css.delInput} placeholder="Type DELETE to confirm"
                              value={action.deleteTyped || ''}
                              onChange={e => patchAction(i, action.id, { deleteTyped: e.target.value, uiError: '' })} />
                          )}
                          {action.uiError && <div style={css.errTxt}>{action.uiError}</div>}
                          {action.uiStatus === 'executed' && <div style={css.okTxt}>✓ Saved. Audit log updated.</div>}
                          {action.uiStatus === 'rejected' && <div style={css.errTxt}>Cancelled.</div>}
                          {(!action.uiStatus || action.uiStatus === 'proposed' || action.uiStatus === 'failed') && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                              <button style={css.confirmBtn} onClick={() => confirmAction(i, action)}>Confirm & Save</button>
                              <button style={css.rejectBtn}  onClick={() => rejectAction(i, action)}>Cancel</button>
                            </div>
                          )}
                          {action.uiStatus === 'loading' && <div style={css.metaTxt}>Saving…</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={css.metaTxt}>{msg.time}</div>
                </div>

                {/* User avatar */}
                {msg.role === 'user' && <div style={css.userAv}>U</div>}
              </div>
            ))}

            {/* Typing dots */}
            {loading && (
              <div style={css.row}>
                <div style={css.aiAv}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="#6366f1"/>
                  </svg>
                </div>
                <div>
                  <div style={css.senderLbl}>RADHU AI</div>
                  <div style={{ ...css.bubble, ...css.bubbleAi, display:'flex', gap:6, padding:'14px 18px', alignItems:'center' }}>
                    <Dot d={0} /><Dot d={0.2} /><Dot d={0.4} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── COMPOSER ── */}
          <div style={css.composer}>
            {file && (
              <div style={css.filePill}>
                <span>📎 {file.name} &nbsp;({(file.size/1024).toFixed(1)} KB)</span>
                <button style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:15 }}
                  onClick={() => setFile(null)}>✕</button>
              </div>
            )}
            <div style={css.inputRow}>
              <button style={css.iconBtn} title="File attach karo" onClick={() => fileRef.current?.click()}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt,.json,.jpg,.jpeg,.png,.webp"
                hidden onChange={e => { setFile(e.target.files?.[0] || null); e.target.value = ''; }} />

              <textarea ref={taRef} value={input} rows={1} style={css.ta}
                placeholder="Kuch bhi pooch lo…  (Enter = bhejo,  Shift+Enter = naya line)"
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />

              <button style={{ ...css.sendBtn, opacity: (loading || (!input.trim() && !file)) ? 0.4 : 1 }}
                disabled={loading || (!input.trim() && !file)} onClick={() => send()}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <div style={css.hint}>Enter se bhejo · Shift+Enter se naya line · Excel/image bhi attach kar sakte ho</div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LIGHT-THEME STYLE OBJECT
// ─────────────────────────────────────────────
const css = {
  shell: {
    height: '100vh', display: 'flex', flexDirection: 'column',
    background: '#ffffff', color: '#1e293b',
    fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", overflow: 'hidden',
  },

  // Header
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0 24px', height: 58, background: '#ffffff',
    borderBottom: '1px solid #e2e8f0', flexShrink: 0, zIndex: 50,
  },
  hLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  logoBox: {
    width: 34, height: 34, borderRadius: 9, background: '#eef2ff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid #c7d2fe',
  },
  brandName: { fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.01em' },
  brandSub:  { fontSize: '0.72rem', marginTop: 1 },
  hRight: { display: 'flex', gap: 8 },
  hBtn: {
    padding: '7px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
    background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', cursor: 'pointer',
  },
  hBtnPrimary: { background: '#6366f1', color: '#fff', border: '1px solid #6366f1' },

  // Layout
  body: { display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' },

  // Sidebar
  sidebar: {
    width: 272, minWidth: 272, display: 'flex', flexDirection: 'column',
    background: '#f8fafc', borderRight: '1px solid #e2e8f0', overflow: 'hidden',
  },
  tabBar: { display: 'flex', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  tabBtn: {
    flex: 1, padding: '11px 6px', fontSize: '0.75rem', fontWeight: 600,
    background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
    borderBottom: '2px solid transparent', transition: 'all 0.15s',
  },
  tabBtnActive: { color: '#6366f1', borderBottomColor: '#6366f1', background: '#ffffff' },
  sideBody: { flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 6 },
  sideLabel: { fontSize: '0.67rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 },
  promptBtn: {
    textAlign: 'left', padding: '9px 11px', borderRadius: 9, fontSize: '0.79rem', lineHeight: 1.45,
    background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155', cursor: 'pointer',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  emptyNote: { fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6, padding: '4px 2px' },

  // Memory
  memInput: {
    width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: '0.78rem',
    background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155',
    outline: 'none', fontFamily: 'inherit',
  },
  saveMBtn: {
    padding: '9px', borderRadius: 9, fontSize: '0.78rem', fontWeight: 700,
    background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', width: '100%',
  },
  memDivider: { borderTop: '1px solid #e2e8f0', margin: '6px 0' },
  memCard: {
    padding: '10px', borderRadius: 10, background: '#ffffff',
    border: '1px solid #e2e8f0',
  },
  memCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  badge: { fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase' },
  delBtn: { background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 12, padding: 2 },
  memTitle: { fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', marginBottom: 3 },
  memBody:  { fontSize: '0.72rem', color: '#64748b', lineHeight: 1.55 },

  // Chat
  chat:    { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#ffffff' },
  msgArea: { flex: 1, overflowY: 'auto', padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: 22 },
  row:     { display: 'flex', gap: 12, alignItems: 'flex-start' },
  rowUser: { flexDirection: 'row-reverse' },

  aiAv: {
    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
    background: '#eef2ff', border: '1px solid #c7d2fe',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  userAv: {
    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
    background: '#6366f1', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.72rem', fontWeight: 800,
  },

  senderLbl: { fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 },

  bubble: {
    padding: '12px 16px', borderRadius: 14, fontSize: '0.88rem',
    lineHeight: 1.7, wordBreak: 'break-word', maxWidth: '100%',
  },
  bubbleAi: {
    background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b',
    borderRadius: '2px 14px 14px 14px',
  },
  bubbleUser: {
    background: '#6366f1', color: '#ffffff',
    borderRadius: '14px 2px 14px 14px',
  },
  bubbleErr: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' },
  metaTxt: { fontSize: '0.67rem', color: '#cbd5e1', marginTop: 5 },

  // Actions
  confirmAllBtn: {
    padding: '8px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
    background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', cursor: 'pointer',
  },
  actionCard: {
    padding: '12px 14px', borderRadius: 12,
    background: '#f8fafc', border: '1px solid #e2e8f0',
  },
  actionHigh: { borderColor: '#fecaca', background: '#fef2f2' },
  actionTitle: { fontSize: '0.83rem', fontWeight: 700, color: '#1e293b', marginBottom: 2 },
  actionMeta:  { fontSize: '0.7rem', color: '#94a3b8', marginBottom: 8 },
  actionPre: {
    background: '#f1f5f9', color: '#475569', fontSize: '0.72rem',
    padding: 8, borderRadius: 8, margin: '0 0 8px', whiteSpace: 'pre-wrap',
    maxHeight: 110, overflow: 'auto', border: '1px solid #e2e8f0', fontFamily: 'monospace',
  },
  delInput: {
    width: '100%', marginBottom: 8, padding: '8px 10px', borderRadius: 8,
    border: '1px solid #fca5a5', background: '#fff1f2', color: '#dc2626',
    fontSize: '0.82rem', boxSizing: 'border-box', fontFamily: 'inherit',
  },
  confirmBtn: {
    padding: '7px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
    background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer',
  },
  rejectBtn: {
    padding: '7px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
    background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', cursor: 'pointer',
  },
  okTxt:  { color: '#16a34a', fontSize: '0.75rem', marginTop: 4, fontWeight: 600 },
  errTxt: { color: '#dc2626', fontSize: '0.75rem', marginTop: 4 },

  // Composer
  composer: {
    padding: '12px 24px 14px', background: '#ffffff',
    borderTop: '1px solid #e2e8f0', flexShrink: 0,
  },
  filePill: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, padding: '7px 12px', borderRadius: 8,
    background: '#eef2ff', color: '#4338ca', fontSize: '0.78rem', border: '1px solid #c7d2fe',
  },
  inputRow: { display: 'flex', gap: 8, alignItems: 'flex-end' },
  iconBtn: {
    padding: '10px', borderRadius: 10, background: '#f8fafc',
    border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex',
    alignItems: 'center', flexShrink: 0,
  },
  ta: {
    flex: 1, minHeight: 42, maxHeight: 160, resize: 'none', borderRadius: 12,
    border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b',
    padding: '11px 14px', fontSize: '0.88rem', lineHeight: 1.6,
    outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s',
  },
  sendBtn: {
    padding: '10px 14px', borderRadius: 12, background: '#6366f1',
    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
    flexShrink: 0, transition: 'opacity 0.15s',
  },
  hint: { fontSize: '0.67rem', color: '#cbd5e1', marginTop: 7, textAlign: 'center' },
};

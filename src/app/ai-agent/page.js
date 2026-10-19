'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiUpload, apiDelete } from '@/lib/api';

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────
function nowTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(t) {
  return String(t || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatMessage(text) {
  let h = escapeHtml(text || '');
  // code blocks
  h = h.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre class="r-pre"><code>${code.trim()}</code></pre>`
  );
  // inline code
  h = h.replace(/`([^`]+)`/g, '<code class="r-code">$1</code>');
  // bold
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // italic
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // headings
  h = h.replace(/^#### (.+)$/gm, '<div class="r-h4">$1</div>');
  h = h.replace(/^### (.+)$/gm, '<div class="r-h3">$1</div>');
  h = h.replace(/^## (.+)$/gm, '<div class="r-h2">$1</div>');
  // table rows (GFM)
  h = h.replace(/\|(.+)\|/g, (match) => {
    const cells = match.split('|').filter(c => c.trim() !== '');
    return '<div class="r-tr">' + cells.map(c => `<span class="r-td">${c.trim()}</span>`).join('') + '</div>';
  });
  // horizontal rule
  h = h.replace(/^---+$/gm, '<hr class="r-hr"/>');
  // bullets
  h = h.replace(/^[*\-] (.+)$/gm, '<div class="r-li">$1</div>');
  // numbered list
  h = h.replace(/^\d+\. (.+)$/gm, '<div class="r-li r-li-num">$1</div>');
  // newlines
  h = h.replace(/\n/g, '<br/>');
  return h;
}

function payloadPreview(action) {
  const p = action.payload || {};
  if (Array.isArray(p.rows) && p.rows.length) {
    const lines = p.rows.slice(0, 5).map(r =>
      Object.values(r).filter(v => v !== '' && v != null).slice(0, 4).join(' · ')
    );
    return `${p.rows.length} rows\n${lines.join('\n')}${p.rows.length > 5 ? '\n…' : ''}`;
  }
  return Object.entries(p)
    .filter(([k]) => k !== 'module' && k !== 'clear_existing')
    .slice(0, 8)
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join('\n');
}

const WELCOME = {
  role: 'ai',
  text: `Namaste! Main **RADHU AI** hoon — Radhu Industries ERP ka Master Assistant.

Mujhse pooch sakte ho:
- **Stock** (Auto Tyre, Cycle Tyre, Cycle Tube)
- **Mixing Sheet** (Compound / Rubber / Auto-sync formulas)
- **Tally** (invoices, parties, billing, GST)
- **HRMS** (employees, attendance, salary)
- **Orders, Models, Views, Frontend pages** — kuch bhi

Main **live database** directly query karta hoon aur exact answers deta hoon.`,
  time: nowTime(),
};

const QUICK_PROMPTS = [
  'Aaj ka mixing compound total kitna hai?',
  'Sabse low stock wale cycle tyre dikhao',
  'Is mahine ka Auto Tyre production kitna hai?',
  'Tally mein is mahine ki billing kitni hai?',
  'Employee list dikhao with salary type',
  'rawmaterial_mixing table ka schema batao',
  'Cycle Tube mixing formula kya hai?',
  'Pending orders dikhao',
];

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'rule', label: 'Business Rule' },
  { value: 'formula', label: 'Formula' },
  { value: 'correction', label: 'Correction' },
  { value: 'preference', label: 'Preference' },
  { value: 'party_note', label: 'Party Note' },
];

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────
export default function AIAgentPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [selectedFile, setSelectedFile] = useState(null);
  const [aiReady, setAiReady] = useState(null);
  const [apiKeyMsg, setApiKeyMsg] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'memory' | 'prompts'
  const [memories, setMemories] = useState([]);
  const [memLoading, setMemLoading] = useState(false);
  const [newMemKey, setNewMemKey] = useState('');
  const [newMemContent, setNewMemContent] = useState('');
  const [newMemCat, setNewMemCat] = useState('general');
  const [memSaving, setMemSaving] = useState(false);
  const [modelName, setModelName] = useState('');
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);

  // scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // textarea auto-height
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
  }, [input]);

  // fetch AI status
  useEffect(() => {
    apiGet('/ai/status/').then((d) => {
      if (!d) { setAiReady(false); setApiKeyMsg('Could not reach AI.'); return; }
      setAiReady(!!d.ready);
      setModelName(d.model || '');
      if (!d.ready) setApiKeyMsg(d.message || 'API key missing.');
    });
  }, []);

  // fetch memories when tab opens
  useEffect(() => {
    if (activeTab === 'memory') loadMemories();
  }, [activeTab]);

  const loadMemories = async () => {
    setMemLoading(true);
    const d = await apiGet('/ai/memories/');
    setMemLoading(false);
    if (d?.memories) setMemories(d.memories);
  };

  // ── patch action in a message ──────────────────────────────
  const patchAction = useCallback((msgIdx, actionId, patch) => {
    setMessages(prev => prev.map((m, i) => {
      if (i !== msgIdx) return m;
      return { ...m, proposed_actions: m.proposed_actions.map(a => a.id === actionId ? { ...a, ...patch } : a) };
    }));
  }, []);

  // ── confirm single action ──────────────────────────────────
  const confirmAction = useCallback(async (msgIdx, action) => {
    if (action.requires_typed_delete && action.deleteTyped !== 'DELETE') {
      patchAction(msgIdx, action.id, { uiError: 'Type DELETE to confirm deletion.' }); return;
    }
    patchAction(msgIdx, action.id, { uiStatus: 'loading', uiError: '' });
    const res = await apiPost('/ai/actions/confirm/', { id: action.id, token: action.confirm_token });
    if (res?.ok && res.data?.ok) {
      patchAction(msgIdx, action.id, { uiStatus: 'executed' });
    } else {
      patchAction(msgIdx, action.id, { uiStatus: 'failed', uiError: res?.data?.error || 'Failed.' });
    }
  }, [patchAction]);

  // ── reject action ──────────────────────────────────────────
  const rejectAction = useCallback(async (msgIdx, action) => {
    patchAction(msgIdx, action.id, { uiStatus: 'loading' });
    await apiPost('/ai/actions/reject/', { id: action.id, token: action.confirm_token });
    patchAction(msgIdx, action.id, { uiStatus: 'rejected' });
  }, [patchAction]);

  // ── confirm all non-delete ─────────────────────────────────
  const confirmAll = useCallback(async (msgIdx, actions) => {
    for (const a of actions) {
      if (!a.requires_typed_delete && (!a.uiStatus || a.uiStatus === 'proposed' || a.uiStatus === 'failed')) {
        await confirmAction(msgIdx, a);
      }
    }
  }, [confirmAction]);

  // ── clear chat ─────────────────────────────────────────────
  const handleClear = async () => {
    await apiPost('/ai/chat/', { reset: 'true', session_id: sessionId });
    setMessages([WELCOME]);
  };

  // ── send message ───────────────────────────────────────────
  const sendMessage = async (override) => {
    const text = (override || input).trim();
    const upload = selectedFile;
    if (!text && !upload) return;
    if (loading) return;

    const userMsg = { role: 'user', text: text || `[File: ${upload?.name}]`, time: nowTime(), fileName: upload?.name };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedFile(null);
    setLoading(true);

    try {
      const formData = new FormData();
      if (text) formData.append('message', text);
      formData.append('session_id', sessionId);
      if (upload) formData.append('file', upload);

      const res = await apiUpload('/ai/chat/', formData);
      const d = res?.data || res || {};
      const reply = d.reply || d.error || 'No response.';
      const actions = d.proposed_actions || [];
      setMessages(prev => [...prev, {
        role: 'ai',
        text: reply,
        time: nowTime(),
        proposed_actions: actions,
        isError: !!d.error,
      }]);
      if (d.model_used) setModelName(d.model_used);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Network error. Backend se connect nahi ho pa raha.', time: nowTime(), isError: true }]);
    }
    setLoading(false);
    textareaRef.current?.focus();
  };

  // ── save memory ────────────────────────────────────────────
  const saveMemory = async () => {
    if (!newMemKey.trim() || !newMemContent.trim()) return;
    setMemSaving(true);
    const res = await apiPost('/ai/memories/', { key: newMemKey, content: newMemContent, category: newMemCat });
    setMemSaving(false);
    if (res?.data?.status === 'success' || res?.ok) {
      setNewMemKey(''); setNewMemContent(''); setNewMemCat('general');
      await loadMemories();
    }
  };

  const deleteMemory = async (id) => {
    await apiDelete(`/ai/memories/${id}/delete/`);
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  // ────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────
  return (
    <div style={S.shell}>
      {/* ── TOP HEADER ────────────────────────────────────── */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.logo}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#6366f1"/>
              <path d="M8 12h8M12 8v8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={S.appName}>RADHU AI</div>
            <div style={S.appSub}>
              {aiReady === null && 'Connecting…'}
              {aiReady === true && <>&#x2022; {modelName || 'Gemini'} &nbsp;·&nbsp; Live database access</>}
              {aiReady === false && <span style={{ color: '#f87171' }}>&#x26A0; {apiKeyMsg}</span>}
            </div>
          </div>
        </div>
        <div style={S.headerRight}>
          <button style={S.hBtn} onClick={() => router.push('/ai-agent/logs')}>Audit Log</button>
          <button style={S.hBtn} onClick={handleClear}>New Chat</button>
          <button style={{ ...S.hBtn, background: '#6366f1', color: '#fff', borderColor: '#6366f1' }} onClick={() => router.push('/')}>← Home</button>
        </div>
      </header>

      {/* ── BODY ──────────────────────────────────────────── */}
      <div style={S.body}>
        {/* LEFT SIDEBAR */}
        <aside style={S.sidebar}>
          {/* Tab switcher */}
          <div style={S.tabs}>
            {[['chat', 'Chat'], ['prompts', 'Prompts'], ['memory', 'Memory']].map(([k, label]) => (
              <button key={k} style={{ ...S.tab, ...(activeTab === k ? S.tabActive : {}) }} onClick={() => setActiveTab(k)}>
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'chat' && (
            <div style={S.sideSection}>
              <div style={S.sideLabel}>Recent</div>
              {messages.filter(m => m.role === 'user').slice(-8).reverse().map((m, i) => (
                <button key={i} style={S.sideItem} onClick={() => sendMessage(m.text)}>
                  {m.text.slice(0, 52)}{m.text.length > 52 ? '…' : ''}
                </button>
              ))}
              {messages.filter(m => m.role === 'user').length === 0 && (
                <div style={S.sideEmpty}>Abhi koi chat nahi.</div>
              )}
            </div>
          )}

          {activeTab === 'prompts' && (
            <div style={S.sideSection}>
              <div style={S.sideLabel}>Quick Questions</div>
              {QUICK_PROMPTS.map((p) => (
                <button key={p} style={S.sideItem} disabled={loading} onClick={() => sendMessage(p)}>
                  {p}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'memory' && (
            <div style={{ ...S.sideSection, gap: 8 }}>
              <div style={S.sideLabel}>AI ki Trained Memory &nbsp;<span style={{ color: '#94a3b8', fontWeight: 400 }}>({memories.length})</span></div>

              {/* Add new memory */}
              <input
                style={S.memInput}
                placeholder="Title (e.g. Auto Tyre formula)"
                value={newMemKey}
                onChange={e => setNewMemKey(e.target.value)}
              />
              <textarea
                style={{ ...S.memInput, minHeight: 64, resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Content / Rule / Formula..."
                value={newMemContent}
                onChange={e => setNewMemContent(e.target.value)}
              />
              <select style={S.memInput} value={newMemCat} onChange={e => setNewMemCat(e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <button style={S.memSaveBtn} disabled={memSaving || !newMemKey.trim() || !newMemContent.trim()} onClick={saveMemory}>
                {memSaving ? 'Saving…' : '+ Save to AI Memory'}
              </button>

              <div style={S.memDivider} />

              {memLoading && <div style={S.sideEmpty}>Loading…</div>}
              {!memLoading && memories.length === 0 && <div style={S.sideEmpty}>Abhi koi saved memory nahi. AI sikhne ke liye usse kuch batao.</div>}
              {memories.map(m => (
                <div key={m.id} style={S.memCard}>
                  <div style={S.memCardHeader}>
                    <span style={{ ...S.memBadge, ...(badgeColor(m.category)) }}>{m.category}</span>
                    <button style={S.memDel} onClick={() => deleteMemory(m.id)} title="Remove">✕</button>
                  </div>
                  <div style={S.memKey}>{m.key}</div>
                  <div style={S.memContent}>{m.content}</div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* CHAT AREA */}
        <main style={S.chatArea}>
          <div style={S.messages}>
            {messages.map((msg, i) => (
              <div key={`${i}-${msg.time}`} style={{ ...S.row, ...(msg.role === 'user' ? S.rowUser : {}) }}>
                {/* Avatar */}
                {msg.role === 'ai' && (
                  <div style={S.aiAvatar}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#6366f1"/>
                      <path d="M8 12h8M12 8v8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}

                <div style={{ maxWidth: '72%', minWidth: 0 }}>
                  {/* sender label */}
                  <div style={S.senderLabel}>{msg.role === 'ai' ? 'RADHU AI' : 'You'}</div>

                  {/* bubble */}
                  <div
                    style={{ ...S.bubble, ...(msg.role === 'user' ? S.bubbleUser : S.bubbleAi), ...(msg.isError ? S.bubbleErr : {}) }}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                  />

                  {msg.fileName && <div style={S.meta}>📎 {msg.fileName}</div>}

                  {/* proposed actions */}
                  {!!msg.proposed_actions?.length && (
                    <div style={S.actionsWrap}>
                      {msg.proposed_actions.filter(a => !a.uiStatus || a.uiStatus === 'proposed' || a.uiStatus === 'failed').length > 1 && (
                        <button style={S.confirmAllBtn} onClick={() => confirmAll(i, msg.proposed_actions)}>
                          Confirm all (except delete)
                        </button>
                      )}
                      {msg.proposed_actions.map(action => (
                        <div key={action.id} style={{ ...S.actionCard, ...(action.risk_level === 'high' ? S.actionHigh : {}) }}>
                          <div style={S.actionTitle}>{action.summary}</div>
                          <div style={S.actionMeta}>{action.module} · {action.action}</div>
                          <pre style={S.actionPayload}>{payloadPreview(action)}</pre>
                          {action.requires_typed_delete && action.uiStatus !== 'executed' && action.uiStatus !== 'rejected' && (
                            <input
                              style={S.deleteInput}
                              placeholder="Type DELETE to confirm"
                              value={action.deleteTyped || ''}
                              onChange={e => patchAction(i, action.id, { deleteTyped: e.target.value, uiError: '' })}
                            />
                          )}
                          {action.uiError && <div style={S.actionErr}>{action.uiError}</div>}
                          {action.uiStatus === 'executed' && <div style={S.actionOk}>✓ Saved in ERP. Audit log updated.</div>}
                          {action.uiStatus === 'rejected' && <div style={S.actionErr}>Cancelled.</div>}
                          {(!action.uiStatus || action.uiStatus === 'proposed' || action.uiStatus === 'failed') && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                              <button style={S.confirmBtn} onClick={() => confirmAction(i, action)}>Confirm & Save</button>
                              <button style={S.rejectBtn} onClick={() => rejectAction(i, action)}>Cancel</button>
                            </div>
                          )}
                          {action.uiStatus === 'loading' && <div style={S.meta}>Saving…</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={S.meta}>{msg.time}</div>
                </div>

                {msg.role === 'user' && (
                  <div style={S.userAvatar}>U</div>
                )}
              </div>
            ))}

            {/* typing indicator */}
            {loading && (
              <div style={S.row}>
                <div style={S.aiAvatar}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#6366f1"/>
                    <path d="M8 12h8M12 8v8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div style={S.senderLabel}>RADHU AI</div>
                  <div style={{ ...S.bubble, ...S.bubbleAi, display: 'flex', gap: 5, alignItems: 'center', padding: '14px 18px' }}>
                    <TypingDot delay={0} />
                    <TypingDot delay={0.15} />
                    <TypingDot delay={0.3} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── COMPOSER ──────────────────────────────────── */}
          <div style={S.composer}>
            {selectedFile && (
              <div style={S.filePreview}>
                <span>📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                <button style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16 }} onClick={() => setSelectedFile(null)}>✕</button>
              </div>
            )}
            <div style={S.inputRow}>
              <button style={S.iconBtn} title="Upload file" onClick={() => fileRef.current?.click()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt,.json,.jpg,.jpeg,.png,.webp" hidden onChange={e => { setSelectedFile(e.target.files?.[0] || null); e.target.value = ''; }} />

              <textarea
                ref={textareaRef}
                value={input}
                rows={1}
                style={S.textarea}
                placeholder="Kuch bhi pooch lo — stock, mixing, salary, formula, model, page…  (Enter to send)"
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />

              <button
                style={{ ...S.sendBtn, opacity: (loading || (!input.trim() && !selectedFile)) ? 0.45 : 1 }}
                disabled={loading || (!input.trim() && !selectedFile)}
                onClick={() => sendMessage()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22 11 13 2 9l20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div style={S.composerHint}>
              Shift+Enter for new line &nbsp;·&nbsp; Excel upload supported &nbsp;·&nbsp; All data is factory-confidential
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Typing dot sub-component ───────────────────────────────
function TypingDot({ delay }) {
  return (
    <span style={{
      width: 7, height: 7, borderRadius: '50%', background: '#6366f1', display: 'inline-block',
      animation: `radhuBounce 1.2s ${delay}s ease-in-out infinite`,
    }} />
  );
}

// ── Badge color helper ─────────────────────────────────────
function badgeColor(cat) {
  const map = {
    rule: { background: 'rgba(239,68,68,0.15)', color: '#f87171' },
    formula: { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' },
    correction: { background: 'rgba(234,179,8,0.15)', color: '#fde047' },
    preference: { background: 'rgba(20,184,166,0.15)', color: '#5eead4' },
    party_note: { background: 'rgba(249,115,22,0.15)', color: '#fb923c' },
    general: { background: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
  };
  return map[cat] || map.general;
}

// ────────────────────────────────────────────────────────────
// STYLES (plain JS objects — no CSS-in-JS library needed)
// ────────────────────────────────────────────────────────────
const S = {
  shell: {
    minHeight: '100vh', height: '100vh', background: '#0a0f1e',
    color: '#e2e8f0', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', 'Segoe UI', sans-serif",
    overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px', background: 'rgba(15,23,42,0.95)',
    borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
    backdropFilter: 'blur(10px)', zIndex: 100,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  logo: {
    width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid rgba(99,102,241,0.3)',
  },
  appName: { fontSize: '0.95rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' },
  appSub: { fontSize: '0.72rem', color: '#64748b', marginTop: 1 },
  headerRight: { display: 'flex', gap: 8 },
  hBtn: {
    padding: '7px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
    background: 'rgba(255,255,255,0.05)', color: '#cbd5e1',
    border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
  },
  body: { display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' },

  // Sidebar
  sidebar: {
    width: 280, minWidth: 280, background: 'rgba(15,23,42,0.7)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  tabs: { display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 },
  tab: {
    flex: 1, padding: '10px 4px', fontSize: '0.75rem', fontWeight: 600,
    background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
    borderBottom: '2px solid transparent', transition: 'all 0.15s',
  },
  tabActive: { color: '#a5b4fc', borderBottomColor: '#6366f1' },
  sideSection: {
    flex: 1, overflowY: 'auto', padding: '12px 10px',
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  sideLabel: { fontSize: '0.66rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 2px' },
  sideItem: {
    textAlign: 'left', padding: '9px 10px', borderRadius: 8,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
    color: '#cbd5e1', cursor: 'pointer', fontSize: '0.77rem', lineHeight: 1.45,
    transition: 'background 0.15s',
  },
  sideEmpty: { fontSize: '0.75rem', color: '#475569', padding: '8px 4px', lineHeight: 1.6 },

  // Memory
  memInput: {
    width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: '0.78rem',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0', outline: 'none', boxSizing: 'border-box',
  },
  memSaveBtn: {
    padding: '9px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
    background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', width: '100%',
  },
  memDivider: { borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' },
  memCard: {
    padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  memCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  memBadge: { fontSize: '0.66rem', fontWeight: 700, padding: '2px 7px', borderRadius: 100, textTransform: 'uppercase' },
  memDel: { background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 12, padding: 2 },
  memKey: { fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 4 },
  memContent: { fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.55 },

  // Chat
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' },
  messages: { flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 },
  row: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  rowUser: { flexDirection: 'row-reverse' },
  aiAvatar: {
    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  userAvatar: {
    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8',
  },
  senderLabel: { fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: 5 },
  bubble: { padding: '12px 16px', borderRadius: 14, fontSize: '0.88rem', lineHeight: 1.7, wordBreak: 'break-word' },
  bubbleAi: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#e2e8f0', borderRadius: '2px 14px 14px 14px',
  },
  bubbleUser: {
    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
    color: '#e2e8f0', borderRadius: '14px 2px 14px 14px',
  },
  bubbleErr: { borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' },
  meta: { fontSize: '0.67rem', color: '#334155', marginTop: 6 },

  // Actions
  actionsWrap: { marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 },
  confirmAllBtn: {
    padding: '8px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
    background: 'rgba(5,150,105,0.15)', color: '#6ee7b7', border: '1px solid rgba(5,150,105,0.3)', cursor: 'pointer',
  },
  actionCard: {
    padding: '12px', borderRadius: 12,
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
  },
  actionHigh: { borderColor: 'rgba(239,68,68,0.35)' },
  actionTitle: { fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginBottom: 2 },
  actionMeta: { fontSize: '0.7rem', color: '#64748b', marginBottom: 8 },
  actionPayload: {
    background: 'rgba(0,0,0,0.25)', color: '#94a3b8', fontSize: '0.7rem',
    padding: 8, borderRadius: 8, margin: '0 0 8px', whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  deleteInput: {
    width: '100%', marginBottom: 8, padding: '8px 10px', borderRadius: 8,
    border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.05)',
    color: '#fca5a5', fontSize: '0.82rem', boxSizing: 'border-box',
  },
  confirmBtn: {
    padding: '7px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
    background: '#059669', color: '#fff', border: 'none', cursor: 'pointer',
  },
  rejectBtn: {
    padding: '7px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
    background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
  },
  actionOk: { color: '#6ee7b7', fontSize: '0.75rem', marginTop: 4 },
  actionErr: { color: '#f87171', fontSize: '0.75rem', marginTop: 4 },

  // Composer
  composer: {
    padding: '14px 24px 16px', background: 'rgba(10,15,30,0.95)',
    borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
  },
  filePreview: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, padding: '8px 12px', borderRadius: 10,
    background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', fontSize: '0.78rem',
    border: '1px solid rgba(99,102,241,0.2)',
  },
  inputRow: { display: 'flex', gap: 10, alignItems: 'flex-end' },
  iconBtn: {
    padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', cursor: 'pointer',
    display: 'flex', alignItems: 'center', flexShrink: 0,
  },
  textarea: {
    flex: 1, minHeight: 44, maxHeight: 180, resize: 'none', borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
    color: '#f1f5f9', padding: '12px 16px', fontSize: '0.88rem', lineHeight: 1.6,
    outline: 'none', fontFamily: 'inherit',
  },
  sendBtn: {
    padding: '11px 14px', borderRadius: 12, background: '#6366f1', color: '#fff',
    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0,
    transition: 'opacity 0.15s',
  },
  composerHint: { fontSize: '0.67rem', color: '#334155', marginTop: 8, textAlign: 'center' },
};

// ── Global animation (injected once) ──────────────────────
if (typeof window !== 'undefined' && !document.getElementById('radhu-ai-anim')) {
  const style = document.createElement('style');
  style.id = 'radhu-ai-anim';
  style.textContent = `
    @keyframes radhuBounce {
      0%,80%,100% { transform: scale(0.4); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }
    .r-h2 { font-size:1.05em; font-weight:800; margin:10px 0 4px; color:#f8fafc; }
    .r-h3 { font-size:0.95em; font-weight:700; margin:8px 0 4px; color:#f1f5f9; }
    .r-h4 { font-size:0.88em; font-weight:700; margin:6px 0 2px; color:#e2e8f0; }
    .r-pre { background:rgba(0,0,0,0.35); padding:12px 14px; border-radius:10px; overflow-x:auto;
              font-size:0.8em; margin:10px 0; border:1px solid rgba(255,255,255,0.06); }
    .r-code { background:rgba(99,102,241,0.12); padding:1px 6px; border-radius:5px; font-size:0.85em; color:#a5b4fc; }
    .r-li { padding:2px 0 2px 14px; position:relative; }
    .r-li::before { content:"•"; position:absolute; left:2px; color:#6366f1; }
    .r-li-num::before { content:counter(li) "."; counter-increment:li; }
    .r-tr { display:flex; gap:0; border-bottom:1px solid rgba(255,255,255,0.06); }
    .r-td { flex:1; padding:4px 8px; font-size:0.82em; color:#cbd5e1; border-right:1px solid rgba(255,255,255,0.06); }
    .r-hr { border:none; border-top:1px solid rgba(255,255,255,0.07); margin:12px 0; }
    * { scrollbar-width: thin; scrollbar-color: rgba(99,102,241,0.3) transparent; }
    *::-webkit-scrollbar { width:5px; height:5px; }
    *::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.3); border-radius:10px; }
  `;
  document.head.appendChild(style);
}

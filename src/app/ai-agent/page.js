'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiUpload } from '@/lib/api';

const QUICK_PROMPTS = [
  'Sabse jyada stock wala cycle tyre kaunsa hai?',
  'Cycle tyre add karo: 26x1.75 BOX Nylon RADHU',
  'Is mahine ka Tally billing kitna hai?',
  'Kaunse items ka stock low hai?',
  'Pending aur overdue orders dikhao',
  'Excel se items import karne ke liye sheet upload karo',
];

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatMessage(text) {
  let html = escapeHtml(text || '');
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="ai-pre">$1</pre>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code class="ai-code">$1</code>');
  html = html.replace(/^### (.+)$/gm, '<div class="ai-h">$1</div>');
  html = html.replace(/^[-*] (.+)$/gm, '<div class="ai-li">• $1</div>');
  html = html.replace(/\n/g, '<br/>');
  return html;
}

function payloadPreview(action) {
  const p = action.payload || {};
  if (Array.isArray(p.rows) && p.rows.length) {
    const lines = p.rows.slice(0, 6).map((row) => (
      Object.values(row).filter((v) => v !== '' && v != null).slice(0, 5).join(' · ')
    ));
    return `${p.rows.length} rows\n${lines.join('\n')}${p.rows.length > 6 ? '\n…' : ''}`;
  }
  return Object.entries(p)
    .filter(([k]) => k !== 'module' && k !== 'clear_existing')
    .slice(0, 8)
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join('\n');
}
function nowTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const WELCOME = {
  role: 'ai',
  text: 'Namaste! Main **RADHU AI** hoon.\n\nPooch sakte ho stock, orders, Tally, employees.\nItem **add / delete / Excel import** bhi kar sakta hoon — pehle preview, phir Confirm. Delete pe **DELETE** type karna padega. Har change **Audit Log** mein save hota hai.',
  time: nowTime(),
};

export default function AIAgentPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [selectedFile, setSelectedFile] = useState(null);
  const [aiReady, setAiReady] = useState(null);
  const [apiKeyMsg, setApiKeyMsg] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    apiGet('/ai/status/').then((d) => {
      if (!d) {
        setAiReady(false);
        setApiKeyMsg('Could not reach AI status endpoint.');
        return;
      }
      setAiReady(!!d.ready);
      if (!d.ready) setApiKeyMsg(d.message || 'GEMINI_API_KEY not configured.');
    });
  }, []);

  const sendMessage = async (msg, file) => {
    const text = (msg || input).trim();
    const upload = file || selectedFile;
    if (!text && !upload) return;
    if (loading) return;

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text: text || `File uploaded: ${upload?.name}`,
        time: nowTime(),
        fileName: upload?.name,
      },
    ]);
    setInput('');
    setSelectedFile(null);
    setSidebarOpen(false);
    setLoading(true);

    const formData = new FormData();
    if (text) formData.append('message', text);
    formData.append('session_id', sessionId);
    if (upload) formData.append('file', upload);

    try {
      const res = await apiUpload('/ai/chat/', formData);
      if (!res) {
        setMessages((prev) => [...prev, {
          role: 'ai',
          text: 'Network error. Please try again.',
          time: nowTime(),
          isError: true,
        }]);
      } else {
        const data = res.data || {};
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: data.reply || data.error || 'Something went wrong.',
            time: nowTime(),
            isError: !res.ok || !!data.error,
            proposed_actions: (data.proposed_actions || []).map((a) => ({ ...a, uiStatus: 'proposed' })),
          },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `Network error: ${e.message || 'Please try again.'}`,
          time: nowTime(),
          isError: true,
        },
      ]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleClear = async () => {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('reset', 'true');
    formData.append('message', '');
    await apiUpload('/ai/chat/', formData);
    setMessages([{ ...WELCOME, time: nowTime(), text: 'Conversation cleared. Kaise help kar sakta hoon?' }]);
  };

  const patchAction = (messageIndex, actionId, patch) => {
    setMessages((prev) => prev.map((msg, i) => {
      if (i !== messageIndex || !msg.proposed_actions) return msg;
      return {
        ...msg,
        proposed_actions: msg.proposed_actions.map((a) => (
          a.id === actionId ? { ...a, ...patch } : a
        )),
      };
    }));
  };

  const confirmAction = async (messageIndex, action) => {
    if (action.uiStatus && action.uiStatus !== 'proposed') return;
    if (action.requires_typed_delete && (action.deleteTyped || '').trim().toUpperCase() !== 'DELETE') {
      patchAction(messageIndex, action.id, { uiError: 'Delete ke liye DELETE type karo.' });
      return;
    }
    patchAction(messageIndex, action.id, { uiStatus: 'loading', uiError: '' });
    const res = await apiPost('/ai/actions/confirm/', {
      id: action.id,
      token: action.token,
      confirm_text: action.deleteTyped || '',
    });
    if (res?.ok && res.data?.ok) {
      patchAction(messageIndex, action.id, {
        uiStatus: 'executed',
        uiResult: res.data.result,
        uiError: '',
      });
    } else {
      patchAction(messageIndex, action.id, {
        uiStatus: 'failed',
        uiError: res?.data?.error || 'Confirm failed.',
      });
    }
  };

  const rejectAction = async (messageIndex, action) => {
    if (action.uiStatus && action.uiStatus !== 'proposed' && action.uiStatus !== 'failed') return;
    patchAction(messageIndex, action.id, { uiStatus: 'loading' });
    const res = await apiPost('/ai/actions/reject/', { id: action.id, token: action.token });
    if (res?.ok) {
      patchAction(messageIndex, action.id, { uiStatus: 'rejected' });
    } else {
      patchAction(messageIndex, action.id, {
        uiStatus: 'failed',
        uiError: res?.data?.error || 'Reject failed.',
      });
    }
  };

  const confirmAll = async (messageIndex, actions) => {
    for (const action of actions) {
      if (action.requires_typed_delete) continue;
      if (action.uiStatus && action.uiStatus !== 'proposed' && action.uiStatus !== 'failed') continue;
      await confirmAction(messageIndex, action);
    }
  };

  return (
    <div className="ai-shell">
      <Navbar />

      <div className="ai-header">
        <div className="ai-header-left">
          <div className="ai-avatar">🤖</div>
          <div>
            <h1>RADHU AI</h1>
            <p>
              {aiReady === null && 'Connecting...'}
              {aiReady === true && 'Online — Gemini ERP assistant'}
              {aiReady === false && (apiKeyMsg || 'Not configured')}
            </p>
          </div>
        </div>
        <div className="ai-header-actions">
          {isMobile && (
            <button type="button" className="ai-btn" onClick={() => setSidebarOpen((v) => !v)}>
              Prompts
            </button>
          )}
          <button type="button" className="ai-btn" onClick={handleClear}>Clear</button>
          <button type="button" className="ai-btn" onClick={() => router.push('/ai-agent/logs')}>Audit Log</button>
          <button type="button" className="ai-btn" onClick={() => router.push('/')}>Home</button>
        </div>
      </div>

      {aiReady === false && (
        <div className="ai-banner">
          <strong>Gemini API key required.</strong>
          {' '}Get a key at{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
            Google AI Studio
          </a>
          {' '}and set <code>GEMINI_API_KEY</code> on the server.
        </div>
      )}

      <div className="ai-body">
        {(!isMobile || sidebarOpen) && (
          <aside className="ai-sidebar">
            <div className="ai-side-label">Quick questions</div>
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="ai-prompt"
                disabled={loading}
                onClick={() => sendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
            <div className="ai-file-card">
              <div className="ai-side-label">Uploads</div>
              <p>Excel/CSV import: sheet upload karo + “ye items add karo”. Confirm ke baad save. Audit Log mein record.</p>
            </div>
          </aside>
        )}

        <section className="ai-chat">
          <div className="ai-messages">
            {messages.map((msg, i) => (
              <div key={`${msg.time}-${i}`} className={`ai-row ${msg.role}`}>
                <div className="ai-face">{msg.role === 'ai' ? '🤖' : '👤'}</div>
                <div className="ai-col">
                  <div
                    className={`ai-bubble ${msg.role} ${msg.isError ? 'error' : ''}`}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                  />
                  {msg.fileName && <div className="ai-meta">📎 {msg.fileName}</div>}
                  {!!msg.proposed_actions?.length && (
                    <div className="ai-actions">
                      {msg.proposed_actions.filter((a) => !a.uiStatus || a.uiStatus === 'proposed' || a.uiStatus === 'failed').length > 1 && (
                        <button
                          type="button"
                          className="ai-confirm"
                          onClick={() => confirmAll(i, msg.proposed_actions)}
                        >
                          Confirm all (except delete)
                        </button>
                      )}
                      {msg.proposed_actions.map((action) => (
                        <div key={action.id} className={`ai-action ${action.risk_level} ${action.uiStatus || ''}`}>
                          <div className="ai-action-title">{action.summary}</div>
                          <div className="ai-action-meta">{action.module} · {action.action}</div>
                          <pre className="ai-payload">{payloadPreview(action)}</pre>
                          {action.requires_typed_delete && action.uiStatus !== 'executed' && action.uiStatus !== 'rejected' && (
                            <input
                              className="ai-delete-input"
                              placeholder='Type DELETE to confirm'
                              value={action.deleteTyped || ''}
                              onChange={(e) => patchAction(i, action.id, { deleteTyped: e.target.value, uiError: '' })}
                            />
                          )}
                          {action.uiError && <div className="ai-action-err">{action.uiError}</div>}
                          {action.uiStatus === 'executed' && <div className="ai-action-ok">Saved in ERP. Audit log updated.</div>}
                          {action.uiStatus === 'rejected' && <div className="ai-action-err">Cancelled. Kuch save nahi hua.</div>}
                          {(!action.uiStatus || action.uiStatus === 'proposed' || action.uiStatus === 'failed') && (
                            <div className="ai-action-btns">
                              <button type="button" className="ai-confirm" onClick={() => confirmAction(i, action)}>Confirm & save</button>
                              <button type="button" className="ai-reject" onClick={() => rejectAction(i, action)}>Cancel</button>
                            </div>
                          )}
                          {action.uiStatus === 'loading' && <div className="ai-meta">Saving...</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="ai-meta">{msg.time}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="ai-row ai">
                <div className="ai-face">🤖</div>
                <div className="ai-bubble ai typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="ai-composer">
            {selectedFile && (
              <div className="ai-file-preview">
                <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                <button type="button" onClick={() => setSelectedFile(null)}>✕</button>
              </div>
            )}
            <div className="ai-input-row">
              <button
                type="button"
                className="ai-icon-btn"
                title="Upload file"
                onClick={() => fileRef.current?.click()}
              >
                📎
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt,.json,.jpg,.jpeg,.png,.webp"
                hidden
                onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] || null);
                  e.target.value = '';
                }}
              />
              <textarea
                ref={inputRef}
                value={input}
                rows={1}
                placeholder="Stock, party, orders, billing... Enter to send"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                type="button"
                className="ai-send"
                disabled={loading || (!input.trim() && !selectedFile)}
                onClick={() => sendMessage()}
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .ai-shell {
          min-height: 100vh;
          background: #070f1c;
          color: #e2e8f0;
          display: flex;
          flex-direction: column;
        }
        .ai-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          background: linear-gradient(135deg, #0f172a, #1e1b4b);
          border-bottom: 1px solid #1e293b;
          flex-wrap: wrap;
        }
        .ai-header-left { display: flex; align-items: center; gap: 12px; }
        .ai-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.25rem;
        }
        .ai-header h1 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #fff; }
        .ai-header p { margin: 0; font-size: 0.75rem; color: #94a3b8; }
        .ai-header-actions { display: flex; gap: 8px; }
        .ai-btn {
          padding: 7px 12px; border-radius: 8px;
          background: rgba(255,255,255,0.08); color: #fff;
          border: 1px solid rgba(255,255,255,0.15); cursor: pointer;
          font-size: 0.78rem; font-weight: 600;
        }
        .ai-banner {
          background: #7f1d1d; color: #fecaca; padding: 12px 20px; font-size: 0.85rem;
        }
        .ai-banner a { color: #fca5a5; font-weight: 700; }
        .ai-body { display: flex; flex: 1; min-height: 0; }
        .ai-sidebar {
          width: 280px; min-width: 280px; padding: 16px;
          background: #0f172a; border-right: 1px solid #1e293b;
          display: flex; flex-direction: column; gap: 8px; overflow-y: auto;
        }
        .ai-side-label {
          font-size: 0.68rem; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;
        }
        .ai-prompt {
          text-align: left; padding: 10px 12px; border-radius: 10px;
          background: #1e293b; border: 1px solid #334155; color: #e2e8f0;
          cursor: pointer; font-size: 0.8rem; line-height: 1.4;
        }
        .ai-prompt:hover { background: #334155; }
        .ai-file-card {
          margin-top: 12px; padding: 12px; border-radius: 12px;
          background: #1e293b; border: 1px solid #334155; font-size: 0.75rem; color: #94a3b8;
        }
        .ai-chat { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .ai-messages {
          flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px;
        }
        .ai-row { display: flex; gap: 10px; align-items: flex-start; }
        .ai-row.user { flex-direction: row-reverse; }
        .ai-face {
          width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          display: flex; align-items: center; justify-content: center;
        }
        .ai-col { max-width: 75%; }
        .ai-row.user .ai-col { text-align: right; }
        .ai-bubble {
          padding: 12px 16px; border-radius: 16px; font-size: 0.9rem; line-height: 1.65;
          word-break: break-word;
        }
        .ai-bubble.user {
          background: linear-gradient(135deg, #7c3aed, #2563eb); color: #fff;
          border-radius: 16px 16px 4px 16px;
        }
        .ai-bubble.ai {
          background: #1e293b; border: 1px solid #334155; color: #f1f5f9;
          border-radius: 4px 16px 16px 16px;
        }
        .ai-bubble.error { color: #fca5a5; }
        .ai-meta { font-size: 0.68rem; color: #64748b; margin-top: 4px; }
        .ai-pre {
          background: #020617; padding: 10px; border-radius: 8px;
          overflow-x: auto; font-size: 0.8rem; margin: 8px 0;
        }
        .ai-code { background: #0f172a; padding: 1px 6px; border-radius: 4px; font-size: 0.85em; }
        .ai-h { font-weight: 800; margin: 8px 0 4px; }
        .ai-actions { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; text-align: left; }
        .ai-action {
          padding: 12px; border-radius: 12px; background: #0b1220;
          border: 1px solid #334155;
        }
        .ai-action.high { border-color: #ef4444; }
        .ai-action-title { font-weight: 700; font-size: 0.85rem; color: #f8fafc; }
        .ai-action-meta { font-size: 0.72rem; color: #94a3b8; margin: 4px 0 8px; }
        .ai-payload {
          background: #020617; color: #cbd5e1; font-size: 0.72rem;
          padding: 8px; border-radius: 8px; margin: 0 0 8px; white-space: pre-wrap;
          max-height: 140px; overflow: auto;
        }
        .ai-delete-input {
          width: 100%; margin-bottom: 8px; padding: 8px 10px; border-radius: 8px;
          border: 1px solid #7f1d1d; background: #1e293b; color: #fecaca; font: inherit;
        }
        .ai-action-btns { display: flex; gap: 8px; }
        .ai-confirm, .ai-reject {
          border: none; cursor: pointer; border-radius: 8px; padding: 8px 12px;
          font-weight: 700; font-size: 0.78rem;
        }
        .ai-confirm { background: #059669; color: #fff; }
        .ai-reject { background: #334155; color: #e2e8f0; }
        .ai-action-ok { color: #6ee7b7; font-size: 0.78rem; }
        .ai-action-err { color: #fca5a5; font-size: 0.78rem; margin-bottom: 6px; }
        .ai-composer {
          padding: 14px 18px; background: #0f172a; border-top: 1px solid #1e293b;
        }
        .ai-file-preview {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 8px; padding: 8px 12px; border-radius: 8px;
          background: rgba(124,58,237,0.15); color: #c4b5fd; font-size: 0.8rem;
        }
        .ai-file-preview button { background: none; border: none; color: #f87171; cursor: pointer; }
        .ai-input-row { display: flex; gap: 8px; align-items: flex-end; }
        .ai-icon-btn, .ai-send {
          border: none; cursor: pointer; border-radius: 12px; padding: 12px 14px;
        }
        .ai-icon-btn { background: #1e293b; color: #cbd5e1; }
        .ai-input-row textarea {
          flex: 1; min-height: 44px; max-height: 120px; resize: none;
          border-radius: 12px; border: 1px solid #334155; background: #1e293b;
          color: #f1f5f9; padding: 12px 14px; font: inherit;
        }
        .ai-send {
          background: linear-gradient(135deg, #7c3aed, #2563eb); color: #fff; font-weight: 700;
        }
        .ai-send:disabled { opacity: 0.45; cursor: not-allowed; }
        .ai-bubble.typing { display: flex; gap: 6px; align-items: center; }
        .ai-bubble.typing span {
          width: 8px; height: 8px; border-radius: 50%; background: #a78bfa;
          animation: aiBounce 1.1s infinite ease-in-out;
        }
        .ai-bubble.typing span:nth-child(2) { animation-delay: 0.15s; }
        .ai-bubble.typing span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes aiBounce {
          0%, 80%, 100% { transform: scale(0.5); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @media (max-width: 900px) {
          .ai-sidebar { width: 100%; min-width: 0; border-right: none; border-bottom: 1px solid #1e293b; max-height: 240px; }
          .ai-body { flex-direction: column; }
          .ai-col { max-width: 90%; }
        }
      `}</style>
    </div>
  );
}

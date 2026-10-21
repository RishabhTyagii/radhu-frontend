'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page: { background: 'linear-gradient(135deg,#f0f4ff,#f8fafc)', minHeight: '100vh', padding: '24px 20px' },
  wrap: { maxWidth: '1500px', margin: '0 auto' },
  card: { background: '#fff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden' },
  hdr: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f1f5f9' },
  inp: { padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', background: '#fff', boxSizing: 'border-box' },
  btn: (bg, clr) => ({ padding: '9px 18px', background: bg, color: clr, border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer' }),
  th: { padding: '11px 14px', fontSize: '0.72rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', background: '#1e293b' },
  td: { padding: '10px 14px', fontSize: '0.84rem', borderBottom: '1px solid #f1f5f9', color: '#1e293b' },
  chip: (bg, clr) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: '12px', background: bg, color: clr, fontSize: '0.72rem', fontWeight: 700 }),
  lbl: { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '5px' },
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = ['Tally Ledger', 'Current Stock', 'Add Entry', 'Manage'];

export default function TallyPage() {
  const [tab, setTab] = useState('Tally Ledger');
  const [groups, setGroups] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [entries, setEntries] = useState([]);
  const [currentStock, setCurrentStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Ledger filters
  const [filterMat, setFilterMat] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Add Entry form
  const [entryForm, setEntryForm] = useState({
    material_id: '',
    date: new Date().toISOString().slice(0, 10),
    received_quantity: '',
    used_quantity: '',
    received_by: '',
  });
  const [saving, setSaving] = useState(false);

  // Manage — new group / new material
  const [newGroup, setNewGroup] = useState('');
  const [newMat, setNewMat] = useState({ name: '', group_id: '', unit: 'Kg', minimum_stock: '' });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [g, m, cs] = await Promise.all([
      apiGet('/rawmaterial/groups/'),
      apiGet('/rawmaterial/materials/'),
      apiGet('/rawmaterial/current-stock/'),
    ]);
    if (g) setGroups(g);
    if (m) setMaterials(m);
    if (cs) setCurrentStock(cs);
    setLoading(false);
  }

  async function fetchLedger() {
    setLoading(true);
    let url = '/rawmaterial/stock-entries/?';
    if (filterMat) url += `material_id=${filterMat}&`;
    if (filterFrom) url += `from_date=${filterFrom}&`;
    if (filterTo) url += `to_date=${filterTo}&`;
    const res = await apiGet(url);
    if (res) setEntries(res);
    setLoading(false);
  }

  useEffect(() => { if (tab === 'Tally Ledger') fetchLedger(); }, [tab]);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };

  // ── Add Entry Submit ──────────────────────────────────────────────────────
  async function handleEntrySubmit(e) {
    e.preventDefault();
    if (!entryForm.material_id || !entryForm.date) return showMsg('error', 'Material aur date zaroori hai');
    setSaving(true);
    const res = await apiPost('/rawmaterial/stock-entries/', entryForm);
    setSaving(false);
    if (res && res.id) {
      showMsg('success', `Entry saved! Closing: ${res.closing} ${res.unit}`);
      setEntryForm(p => ({ ...p, received_quantity: '', used_quantity: '', received_by: '' }));
      fetchAll();
    } else {
      showMsg('error', 'Save failed. Entry already exists for this date?');
    }
  }

  // ── Add Group ─────────────────────────────────────────────────────────────
  async function handleAddGroup(e) {
    e.preventDefault();
    if (!newGroup.trim()) return;
    const res = await apiPost('/rawmaterial/groups/', { name: newGroup.trim() });
    if (res && res.id) { showMsg('success', 'Group added!'); setNewGroup(''); fetchAll(); }
    else showMsg('error', res?.error || 'Failed');
  }

  // ── Add Material ─────────────────────────────────────────────────────────
  async function handleAddMaterial(e) {
    e.preventDefault();
    if (!newMat.name.trim() || !newMat.group_id) return showMsg('error', 'Name aur group zaroori hai');
    const res = await apiPost('/rawmaterial/materials/', newMat);
    if (res && res.id) { showMsg('success', 'Material added!'); setNewMat({ name: '', group_id: '', unit: 'Kg', minimum_stock: '' }); fetchAll(); }
    else showMsg('error', res?.error || 'Failed');
  }

  // ── Delete Group ─────────────────────────────────────────────────────────
  async function delGroup(id, name) {
    if (!confirm(`Delete group "${name}"? All materials inside will also be deleted!`)) return;
    await apiDelete(`/rawmaterial/groups/${id}/`);
    showMsg('success', 'Deleted'); fetchAll();
  }

  // ── Delete Material ──────────────────────────────────────────────────────
  async function delMaterial(id, name) {
    if (!confirm(`Delete material "${name}"?`)) return;
    await apiDelete(`/rawmaterial/materials/${id}/`);
    showMsg('success', 'Deleted'); fetchAll();
  }

  // ── Delete Entry ─────────────────────────────────────────────────────────
  async function delEntry(id) {
    if (!confirm('Delete this entry?')) return;
    await apiDelete(`/rawmaterial/stock-entries/${id}/`);
    fetchLedger();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Navbar />
      <div style={s.page}>
        <div style={s.wrap}>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Raw Material Tally Cards</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.9rem' }}>Stock ledger — Opening → Received → Used → Closing</p>
          </div>

          {/* ── Alert ────────────────────────────────────────────────────── */}
          {msg && (
            <div style={{ padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', fontWeight: 700, fontSize: '0.875rem', background: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#166534' : '#991b1b' }}>
              {msg.text}
            </div>
          )}

          {/* ── Tab Bar ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: '9px 20px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', background: tab === t ? '#7c3aed' : '#f1f5f9', color: tab === t ? '#fff' : '#475569' }}>
                {t}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 1: TALLY LEDGER                                           */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {tab === 'Tally Ledger' && (
            <div>
              {/* Filter bar */}
              <div style={{ ...s.card, marginBottom: '16px' }}>
                <div style={{ padding: '16px 20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div>
                    <label style={s.lbl}>Material</label>
                    <select style={{ ...s.inp, minWidth: '200px' }} value={filterMat} onChange={e => setFilterMat(e.target.value)}>
                      <option value="">-- All Materials --</option>
                      {groups.map(g => (
                        <optgroup key={g.id} label={g.name}>
                          {materials.filter(m => m.group_id === g.id).map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={s.lbl}>From Date</label>
                    <input type="date" style={s.inp} value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
                  </div>
                  <div>
                    <label style={s.lbl}>To Date</label>
                    <input type="date" style={s.inp} value={filterTo} onChange={e => setFilterTo(e.target.value)} />
                  </div>
                  <button onClick={fetchLedger} style={s.btn('#7c3aed', '#fff')}>Search</button>
                  <button onClick={() => { setFilterMat(''); setFilterFrom(''); setFilterTo(''); }} style={s.btn('#f1f5f9', '#475569')}>Reset</button>
                </div>
              </div>

              {/* Table */}
              <div style={s.card}>
                <div style={s.hdr}>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>Stock Ledger</span>
                  <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.78rem' }}>{entries.length} entries</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                      <tr>
                        {['Date', 'Group', 'Material', 'Unit', 'Opening', 'Received', 'Received By', 'Used', 'Closing', ''].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading…</td></tr>
                      ) : entries.length === 0 ? (
                        <tr><td colSpan={10} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '0.9rem' }}>No records found. Use Add Entry to create entries.</td></tr>
                      ) : entries.map((e, i) => {
                        const isToday = e.date === today;
                        const rowBg = isToday ? 'linear-gradient(90deg,rgba(124,58,237,0.08),rgba(124,58,237,0.02))' : (i % 2 === 0 ? '#fff' : '#fafafa');
                        const borderLeft = isToday ? '4px solid #7c3aed' : '4px solid transparent';
                        return (
                          <tr key={e.id} style={{ background: rowBg, borderLeft }}>
                            <td style={{ ...s.td, fontWeight: isToday ? 800 : 600, color: isToday ? '#7c3aed' : '#475569', whiteSpace: 'nowrap' }}>
                              {e.date}
                              {isToday && <span style={{ marginLeft: '6px', ...s.chip('#7c3aed', '#fff') }}>TODAY</span>}
                            </td>
                            <td style={{ ...s.td, color: '#64748b', fontSize: '0.8rem' }}>{e.group_name}</td>
                            <td style={{ ...s.td, fontWeight: 700 }}>{e.material_name}</td>
                            <td style={{ ...s.td, color: '#94a3b8', fontSize: '0.78rem' }}>{e.unit}</td>
                            <td style={{ ...s.td, color: '#3b82f6', fontWeight: 600 }}>{e.opening}</td>
                            <td style={{ ...s.td, color: '#10b981', fontWeight: 700 }}>{e.received_quantity > 0 ? '+' : ''}{e.received_quantity}</td>
                            <td style={{ ...s.td, color: '#64748b', fontSize: '0.8rem' }}>{e.received_by || '—'}</td>
                            <td style={{ ...s.td, color: '#ef4444', fontWeight: 700 }}>{e.used_quantity > 0 ? '−' : ''}{e.used_quantity}</td>
                            <td style={{ ...s.td, fontWeight: 900, color: e.closing < 0 ? '#ef4444' : '#0f172a', fontSize: '0.95rem' }}>{e.closing}</td>
                            <td style={s.td}>
                              <button onClick={() => delEntry(e.id)} style={{ ...s.btn('#fee2e2', '#dc2626'), padding: '4px 10px', fontSize: '0.72rem' }}>Del</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 2: CURRENT STOCK                                          */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {tab === 'Current Stock' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {loading ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Loading…</p>
                : currentStock.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    <p style={{ fontSize: '1rem' }}>No data yet. Add materials and entries first.</p>
                  </div>
                )
                : currentStock.map(group => (
                  <div key={group.group_id} style={s.card}>
                    <div style={{ ...s.hdr, background: '#1e293b' }}>
                      <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>{group.group_name}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{group.materials.length} materials</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1px', background: '#f1f5f9' }}>
                      {group.materials.map(m => {
                        const isLow = m.is_low;
                        const isOut = m.closing_stock <= 0;
                        const cardBg = isOut ? '#fff5f5' : isLow ? '#fffbeb' : '#fff';
                        const borderColor = isOut ? '#ef4444' : isLow ? '#f59e0b' : '#e2e8f0';
                        const stockColor = isOut ? '#ef4444' : isLow ? '#d97706' : '#10b981';
                        return (
                          <div key={m.material_id} style={{ background: cardBg, border: `1px solid ${borderColor}`, margin: '1px', padding: '16px 18px', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', marginBottom: '6px' }}>{m.material_name}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: stockColor, lineHeight: 1.1 }}>
                              {m.closing_stock}
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginLeft: '4px' }}>{m.unit}</span>
                            </div>
                            {isOut && <div style={{ marginTop: '6px', ...s.chip('#fee2e2', '#ef4444') }}>OUT OF STOCK</div>}
                            {isLow && !isOut && <div style={{ marginTop: '6px', ...s.chip('#fef3c7', '#d97706') }}>LOW STOCK</div>}
                            {!isLow && !isOut && <div style={{ marginTop: '6px', ...s.chip('#dcfce7', '#16a34a') }}>OK</div>}
                            {m.last_entry_date && <div style={{ marginTop: '4px', fontSize: '0.72rem', color: '#94a3b8' }}>Last: {m.last_entry_date}</div>}
                            {m.minimum_stock > 0 && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Min: {m.minimum_stock} {m.unit}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 3: ADD ENTRY                                              */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {tab === 'Add Entry' && (
            <div style={{ maxWidth: '640px' }}>
              <div style={s.card}>
                <div style={s.hdr}><span style={{ fontWeight: 800, color: '#0f172a' }}>New Stock Entry</span></div>
                <form onSubmit={handleEntrySubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  <div>
                    <label style={s.lbl}>Material *</label>
                    <select style={{ ...s.inp, width: '100%' }} value={entryForm.material_id}
                      onChange={e => setEntryForm(p => ({ ...p, material_id: e.target.value }))} required>
                      <option value="">-- Select Material --</option>
                      {groups.map(g => (
                        <optgroup key={g.id} label={g.name}>
                          {materials.filter(m => m.group_id === g.id).map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {entryForm.material_id && (() => {
                      const sel = materials.find(m => String(m.id) === String(entryForm.material_id));
                      if (!sel) return null;
                      // Find latest closing from currentStock
                      let closing = '—';
                      currentStock.forEach(grp => {
                        const found = grp.materials.find(mm => mm.material_id === sel.id);
                        if (found) closing = `${found.closing_stock} ${found.unit}`;
                      });
                      return <div style={{ marginTop: '5px', fontSize: '0.78rem', color: '#2563eb', fontWeight: 700 }}>Current Stock: {closing}</div>;
                    })()}
                  </div>

                  <div>
                    <label style={s.lbl}>Date *</label>
                    <input type="date" style={{ ...s.inp, width: '100%' }} value={entryForm.date}
                      onChange={e => setEntryForm(p => ({ ...p, date: e.target.value }))} required />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={s.lbl}>Received Qty</label>
                      <input type="number" step="0.01" min="0" style={{ ...s.inp, width: '100%', color: '#10b981', fontWeight: 800 }}
                        placeholder="0" value={entryForm.received_quantity}
                        onChange={e => setEntryForm(p => ({ ...p, received_quantity: e.target.value }))} />
                    </div>
                    <div>
                      <label style={s.lbl}>Used Qty</label>
                      <input type="number" step="0.01" min="0" style={{ ...s.inp, width: '100%', color: '#ef4444', fontWeight: 800 }}
                        placeholder="0" value={entryForm.used_quantity}
                        onChange={e => setEntryForm(p => ({ ...p, used_quantity: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label style={s.lbl}>Received By</label>
                    <input type="text" style={{ ...s.inp, width: '100%' }} placeholder="Name of person"
                      value={entryForm.received_by} onChange={e => setEntryForm(p => ({ ...p, received_by: e.target.value }))} />
                  </div>

                  {/* Preview */}
                  {(entryForm.received_quantity || entryForm.used_quantity) && (() => {
                    const sel = materials.find(m => String(m.id) === String(entryForm.material_id));
                    let opening = 0;
                    if (sel) {
                      currentStock.forEach(grp => {
                        const found = grp.materials.find(mm => mm.material_id === sel.id);
                        if (found) opening = found.closing_stock;
                      });
                    }
                    const recv = parseFloat(entryForm.received_quantity) || 0;
                    const used = parseFloat(entryForm.used_quantity) || 0;
                    const closing = opening + recv - used;
                    return (
                      <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                        {[
                          ['Opening', opening, '#3b82f6'],
                          ['+ Received', `+${recv}`, '#10b981'],
                          ['− Used', `-${used}`, '#ef4444'],
                          ['= Closing', closing, closing < 0 ? '#ef4444' : '#0f172a'],
                        ].map(([lbl, val, clr]) => (
                          <div key={lbl}>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{lbl}</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: clr }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <button type="submit" disabled={saving}
                    style={{ padding: '13px', background: saving ? '#94a3b8' : '#7c3aed', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
                    {saving ? 'Saving…' : 'Save Entry'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 4: MANAGE (Groups & Materials)                            */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {tab === 'Manage' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

              {/* Groups */}
              <div style={s.card}>
                <div style={s.hdr}><span style={{ fontWeight: 800, color: '#0f172a' }}>Material Groups</span></div>
                <div style={{ padding: '20px' }}>
                  <form onSubmit={handleAddGroup} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input type="text" placeholder="New group name…" value={newGroup}
                      onChange={e => setNewGroup(e.target.value)}
                      style={{ ...s.inp, flex: 1 }} />
                    <button type="submit" style={s.btn('#7c3aed', '#fff')}>Add</button>
                  </form>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {groups.map(g => (
                      <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>{g.name}</span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={s.chip('#eff6ff', '#1d4ed8')}>{materials.filter(m => m.group_id === g.id).length} items</span>
                          <button onClick={() => delGroup(g.id, g.name)} style={{ ...s.btn('#fee2e2', '#dc2626'), padding: '4px 10px', fontSize: '0.72rem' }}>Del</button>
                        </div>
                      </div>
                    ))}
                    {groups.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No groups yet.</p>}
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div style={s.card}>
                <div style={s.hdr}><span style={{ fontWeight: 800, color: '#0f172a' }}>Materials</span></div>
                <div style={{ padding: '20px' }}>
                  <form onSubmit={handleAddMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={s.lbl}>Material Name *</label>
                        <input type="text" placeholder="e.g. RSS 1" style={{ ...s.inp, width: '100%' }}
                          value={newMat.name} onChange={e => setNewMat(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div>
                        <label style={s.lbl}>Group *</label>
                        <select style={{ ...s.inp, width: '100%' }} value={newMat.group_id}
                          onChange={e => setNewMat(p => ({ ...p, group_id: e.target.value }))}>
                          <option value="">-- Group --</option>
                          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={s.lbl}>Unit</label>
                        <select style={{ ...s.inp, width: '100%' }} value={newMat.unit}
                          onChange={e => setNewMat(p => ({ ...p, unit: e.target.value }))}>
                          {['Kg', 'Litre', 'Pcs', 'Bundle', 'Bag', 'Drum', 'Meter'].map(u => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={s.lbl}>Min Stock</label>
                        <input type="number" min="0" step="0.01" placeholder="0" style={{ ...s.inp, width: '100%' }}
                          value={newMat.minimum_stock} onChange={e => setNewMat(p => ({ ...p, minimum_stock: e.target.value }))} />
                      </div>
                    </div>
                    <button type="submit" style={s.btn('#10b981', '#fff')}>Add Material</button>
                  </form>

                  {/* Material list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '400px', overflowY: 'auto' }}>
                    {groups.map(g => (
                      <div key={g.id}>
                        <div style={{ padding: '5px 8px', fontSize: '0.72rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{g.name}</div>
                        {materials.filter(m => m.group_id === g.id).map(m => (
                          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 14px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '6px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>{m.name}</span>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{m.unit}</span>
                              <button onClick={() => delMaterial(m.id, m.name)} style={{ ...s.btn('#fee2e2', '#dc2626'), padding: '3px 8px', fontSize: '0.7rem' }}>Del</button>
                            </div>
                          </div>
                        ))}
                        {materials.filter(mm => mm.group_id === g.id).length === 0 && (
                          <div style={{ padding: '5px 14px', color: '#94a3b8', fontSize: '0.78rem' }}>No materials in this group.</div>
                        )}
                      </div>
                    ))}
                    {groups.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No groups yet. Create a group first.</p>}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}

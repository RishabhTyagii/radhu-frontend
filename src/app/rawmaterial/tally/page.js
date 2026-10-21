'use client';
import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#f0f4f8',
  white: '#ffffff',
  border: '#e2e8f0',
  borderDark: '#cbd5e1',
  text: '#0f172a',
  textMd: '#334155',
  textSm: '#64748b',
  textXs: '#94a3b8',
  primary: '#1d4ed8',
  primaryLight: '#eff6ff',
  primaryDark: '#1e40af',
  green: '#16a34a',
  greenLight: '#dcfce7',
  red: '#dc2626',
  redLight: '#fee2e2',
  amber: '#d97706',
  amberLight: '#fef3c7',
  purple: '#7c3aed',
  purpleLight: '#f5f3ff',
  headerBg: '#0f172a',
  headerText: '#f8fafc',
  rowAlt: '#f8fafc',
};

const inp = {
  padding: '10px 14px',
  border: `1.5px solid ${C.border}`,
  borderRadius: '8px',
  fontSize: '0.875rem',
  color: C.text,
  background: C.white,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const btn = (bg, clr, hover) => ({
  padding: '10px 20px',
  background: bg,
  color: clr,
  border: 'none',
  borderRadius: '8px',
  fontWeight: 700,
  fontSize: '0.85rem',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
});

const card = {
  background: C.white,
  borderRadius: '12px',
  border: `1px solid ${C.border}`,
  overflow: 'hidden',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const th = {
  padding: '12px 16px',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: C.headerText,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  background: C.headerBg,
  whiteSpace: 'nowrap',
  textAlign: 'left',
  position: 'sticky',
  top: 0,
  zIndex: 1,
};

const td = {
  padding: '11px 16px',
  fontSize: '0.85rem',
  color: C.textMd,
  borderBottom: `1px solid ${C.border}`,
  whiteSpace: 'nowrap',
};

const lbl = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: C.textSm,
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const chip = (bg, clr) => ({
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: '20px',
  background: bg,
  color: clr,
  fontSize: '0.7rem',
  fontWeight: 800,
  letterSpacing: '0.04em',
});

const TABS = [
  { id: 'ledger', label: 'Stock Ledger' },
  { id: 'stock', label: 'Current Stock' },
  { id: 'entry', label: 'New Entry' },
  { id: 'setup', label: 'Setup' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TallyPage() {
  const [tab, setTab] = useState('ledger');
  const [groups, setGroups] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [entries, setEntries] = useState([]);
  const [currentStock, setCurrentStock] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [toast, setToast] = useState(null);

  // Ledger filters
  const [filterMat, setFilterMat] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Entry form
  const [ef, setEf] = useState({
    material_id: '',
    date: new Date().toISOString().slice(0, 10),
    received_quantity: '',
    used_quantity: '',
    received_by: '',
  });
  const [saving, setSaving] = useState(false);
  const [openingPreview, setOpeningPreview] = useState(null);

  // Setup forms
  const [newGroupName, setNewGroupName] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [newMat, setNewMat] = useState({ name: '', group_id: '', unit: 'Kg', minimum_stock: '' });
  const [savingMat, setSavingMat] = useState(false);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchBase = useCallback(async () => {
    setLoadingData(true);
    const [g, m, cs] = await Promise.all([
      apiGet('/rawmaterial/groups/'),
      apiGet('/rawmaterial/materials/'),
      apiGet('/rawmaterial/current-stock/'),
    ]);
    if (g) setGroups(g);
    if (m) setMaterials(m);
    if (cs) setCurrentStock(cs);
    setLoadingData(false);
  }, []);

  const fetchLedger = useCallback(async () => {
    setLoadingLedger(true);
    let url = '/rawmaterial/stock-entries/?';
    if (filterMat) url += `material_id=${filterMat}&`;
    if (filterFrom) url += `from_date=${filterFrom}&`;
    if (filterTo) url += `to_date=${filterTo}&`;
    const res = await apiGet(url);
    if (res) setEntries(res);
    setLoadingLedger(false);
  }, [filterMat, filterFrom, filterTo]);

  useEffect(() => { fetchBase(); }, [fetchBase]);
  useEffect(() => { if (tab === 'ledger') fetchLedger(); }, [tab]);

  // ── Opening preview when entry material/date changes ────────────────────────
  useEffect(() => {
    if (!ef.material_id || !ef.date) { setOpeningPreview(null); return; }
    const mat = materials.find(m => String(m.id) === String(ef.material_id));
    if (!mat) { setOpeningPreview(null); return; }
    // Get closing from current stock
    let closing = 0;
    currentStock.forEach(g => {
      const found = g.materials.find(mm => mm.material_id === mat.id);
      if (found) closing = found.closing_stock;
    });
    setOpeningPreview({ closing, unit: mat.unit, name: mat.name, group: mat.group_name });
  }, [ef.material_id, ef.date, materials, currentStock]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function handleEntrySubmit(e) {
    e.preventDefault();
    if (!ef.material_id) return showToast('error', 'Material select karo');
    setSaving(true);
    const payload = {
      material_id: ef.material_id,
      date: ef.date,
      received_quantity: ef.received_quantity || 0,
      used_quantity: ef.used_quantity || 0,
      received_by: ef.received_by,
    };
    const res = await apiPost('/rawmaterial/stock-entries/', payload);
    setSaving(false);
    if (res && res.id) {
      showToast('success', `Entry saved! Closing: ${res.closing} ${res.unit}`);
      setEf(p => ({ ...p, received_quantity: '', used_quantity: '', received_by: '' }));
      fetchBase();
    } else {
      showToast('error', res?.error || 'Failed — entry for this date may already exist');
    }
  }

  async function handleAddGroup(e) {
    e.preventDefault();
    if (!newGroupName.trim()) return showToast('error', 'Group name dalo');
    setSavingGroup(true);
    const res = await apiPost('/rawmaterial/groups/', { name: newGroupName.trim() });
    setSavingGroup(false);
    if (res && res.id) {
      showToast('success', `Group "${res.name}" added!`);
      setNewGroupName('');
      fetchBase();
    } else {
      showToast('error', res?.error || 'Group add failed');
    }
  }

  async function handleAddMaterial(e) {
    e.preventDefault();
    if (!newMat.name.trim()) return showToast('error', 'Material name dalo');
    if (!newMat.group_id) return showToast('error', 'Group select karo');
    setSavingMat(true);
    const res = await apiPost('/rawmaterial/materials/', {
      name: newMat.name.trim(),
      group_id: newMat.group_id,
      unit: newMat.unit,
      minimum_stock: newMat.minimum_stock || 0,
    });
    setSavingMat(false);
    if (res && res.id) {
      showToast('success', `Material "${res.name}" added!`);
      setNewMat(p => ({ ...p, name: '', minimum_stock: '' }));
      fetchBase();
    } else {
      showToast('error', res?.error || 'Material add failed');
    }
  }

  async function delGroup(id, name) {
    if (!confirm(`Delete group "${name}"? Iske andar ke saare materials bhi delete ho jayenge.`)) return;
    const res = await apiDelete(`/rawmaterial/groups/${id}/`);
    if (res) { showToast('success', 'Group deleted'); fetchBase(); }
    else showToast('error', 'Delete failed');
  }

  async function delMaterial(id, name) {
    if (!confirm(`Delete material "${name}"?`)) return;
    const res = await apiDelete(`/rawmaterial/materials/${id}/`);
    if (res) { showToast('success', 'Material deleted'); fetchBase(); }
    else showToast('error', 'Delete failed');
  }

  async function delEntry(id) {
    if (!confirm('Delete this stock entry?')) return;
    await apiDelete(`/rawmaterial/stock-entries/${id}/`);
    fetchLedger();
  }

  const today = new Date().toISOString().slice(0, 10);
  const recv = parseFloat(ef.received_quantity) || 0;
  const used = parseFloat(ef.used_quantity) || 0;
  const previewClosing = openingPreview ? openingPreview.closing + recv - used : null;

  // ── Aggregate stats ─────────────────────────────────────────────────────────
  const totalMaterials = materials.length;
  const totalGroups = groups.length;
  let lowCount = 0, outCount = 0;
  currentStock.forEach(g => g.materials.forEach(m => {
    if (m.closing_stock <= 0) outCount++;
    else if (m.is_low) lowCount++;
  }));

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <div style={{ background: C.bg, minHeight: '100vh', padding: '28px 24px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
        <div style={{ maxWidth: '1480px', margin: '0 auto' }}>

          {/* ── TOAST ──────────────────────────────────────────────────────── */}
          {toast && (
            <div style={{
              position: 'fixed', top: '20px', right: '24px', zIndex: 9999,
              padding: '14px 22px', borderRadius: '10px', fontWeight: 700, fontSize: '0.875rem',
              background: toast.type === 'success' ? C.greenLight : C.redLight,
              color: toast.type === 'success' ? C.green : C.red,
              border: `1.5px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              maxWidth: '400px',
            }}>
              {toast.text}
            </div>
          )}

          {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: C.text, margin: 0, letterSpacing: '-0.5px' }}>
              Raw Material Tally Cards
            </h1>
            <p style={{ color: C.textSm, margin: '5px 0 0', fontSize: '0.9rem' }}>
              Stock Ledger — Opening → Received → Used → Closing
            </p>
          </div>

          {/* ── STATS BAR ───────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '22px' }}>
            {[
              { label: 'Total Groups', value: totalGroups, color: C.primary, bg: C.primaryLight },
              { label: 'Total Materials', value: totalMaterials, color: '#6d28d9', bg: '#f5f3ff' },
              { label: 'Low Stock', value: lowCount, color: C.amber, bg: C.amberLight },
              { label: 'Out of Stock', value: outCount, color: C.red, bg: C.redLight },
            ].map(s => (
              <div key={s.label} style={{ ...card, padding: '18px 22px', borderLeft: `4px solid ${s.color}` }}>
                <div style={{ fontSize: '1.9rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: C.textSm, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── TAB BAR ─────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '0', marginBottom: '22px', background: C.white, borderRadius: '10px', border: `1px solid ${C.border}`, padding: '4px', width: 'fit-content', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  padding: '9px 22px', borderRadius: '7px', border: 'none', fontWeight: 700,
                  fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  background: tab === t.id ? C.primary : 'transparent',
                  color: tab === t.id ? '#fff' : C.textSm,
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB: STOCK LEDGER                                                 */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {tab === 'ledger' && (
            <div>
              {/* Filter Row */}
              <div style={{ ...card, marginBottom: '16px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ minWidth: '220px' }}>
                    <label style={lbl}>Material</label>
                    <select style={inp} value={filterMat} onChange={e => setFilterMat(e.target.value)}>
                      <option value="">All Materials</option>
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
                    <label style={lbl}>From Date</label>
                    <input type="date" style={{ ...inp, width: 'auto' }} value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>To Date</label>
                    <input type="date" style={{ ...inp, width: 'auto' }} value={filterTo} onChange={e => setFilterTo(e.target.value)} />
                  </div>
                  <button onClick={fetchLedger} style={btn(C.primary, '#fff')}>Search</button>
                  <button onClick={() => { setFilterMat(''); setFilterFrom(''); setFilterTo(''); setEntries([]); }} style={btn('#f1f5f9', C.textMd)}>Reset</button>
                </div>
              </div>

              {/* Ledger Table */}
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: C.text }}>Stock Ledger</div>
                  <span style={chip('#f1f5f9', C.textSm)}>{entries.length} records</span>
                </div>
                <div style={{ overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                    <thead>
                      <tr>
                        {['Date', 'Group', 'Material', 'Unit', 'Opening', 'Received', 'Received By', 'Used', 'Closing', ''].map(h => (
                          <th key={h} style={h === 'Opening' || h === 'Received' || h === 'Used' || h === 'Closing' ? { ...th, textAlign: 'right' } : th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingLedger ? (
                        <tr><td colSpan={10} style={{ ...td, textAlign: 'center', padding: '48px', color: C.textXs }}>Loading records…</td></tr>
                      ) : entries.length === 0 ? (
                        <tr><td colSpan={10} style={{ ...td, textAlign: 'center', padding: '60px', color: C.textXs }}>
                          <div style={{ fontSize: '0.9rem', marginBottom: '6px' }}>No records found</div>
                          <div style={{ fontSize: '0.8rem' }}>Use New Entry tab to add entries, or adjust filters</div>
                        </td></tr>
                      ) : entries.map((e, i) => {
                        const isToday = e.date === today;
                        const rowBg = isToday ? '#faf5ff' : (i % 2 === 0 ? C.white : C.rowAlt);
                        const borderLeft = isToday ? `3px solid ${C.purple}` : `3px solid transparent`;
                        return (
                          <tr key={e.id} style={{ background: rowBg, borderLeft }}>
                            <td style={{ ...td, fontWeight: isToday ? 800 : 600, color: isToday ? C.purple : C.textSm }}>
                              {e.date}
                              {isToday && <span style={{ ...chip(C.purpleLight, C.purple), marginLeft: '8px', fontSize: '0.65rem' }}>TODAY</span>}
                            </td>
                            <td style={{ ...td, fontSize: '0.78rem', color: C.textXs }}>{e.group_name}</td>
                            <td style={{ ...td, fontWeight: 700, color: C.text }}>{e.material_name}</td>
                            <td style={{ ...td, fontSize: '0.78rem', color: C.textXs }}>{e.unit}</td>
                            <td style={{ ...td, textAlign: 'right', color: C.primary, fontWeight: 600 }}>{Number(e.opening).toFixed(2)}</td>
                            <td style={{ ...td, textAlign: 'right', color: C.green, fontWeight: 700 }}>{Number(e.received_quantity) > 0 ? `+${Number(e.received_quantity).toFixed(2)}` : '—'}</td>
                            <td style={{ ...td, fontSize: '0.8rem', color: C.textSm }}>{e.received_by || '—'}</td>
                            <td style={{ ...td, textAlign: 'right', color: C.red, fontWeight: 700 }}>{Number(e.used_quantity) > 0 ? `−${Number(e.used_quantity).toFixed(2)}` : '—'}</td>
                            <td style={{ ...td, textAlign: 'right', fontWeight: 900, fontSize: '0.95rem', color: Number(e.closing) < 0 ? C.red : C.text }}>
                              {Number(e.closing).toFixed(2)}
                            </td>
                            <td style={{ ...td, textAlign: 'right' }}>
                              <button onClick={() => delEntry(e.id)} style={{ ...btn(C.redLight, C.red), padding: '4px 12px', fontSize: '0.75rem' }}>Delete</button>
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

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB: CURRENT STOCK                                                */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {tab === 'stock' && (
            <div>
              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '60px', color: C.textXs, fontSize: '0.9rem' }}>Loading stock data…</div>
              ) : currentStock.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px', color: C.textXs }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: C.textSm }}>No stock data yet</div>
                  <div style={{ fontSize: '0.85rem' }}>Add material groups and materials in Setup, then create entries</div>
                </div>
              ) : currentStock.map(group => (
                <div key={group.group_id} style={{ ...card, marginBottom: '18px' }}>
                  <div style={{ padding: '14px 20px', background: C.headerBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: C.headerText, fontSize: '0.95rem', letterSpacing: '0.01em' }}>{group.group_name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{group.materials.length} materials</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Material', 'Unit', 'Current Stock', 'Min Stock', 'Last Entry', 'Status'].map(h => (
                            <th key={h} style={{ ...th, background: '#1e293b', position: 'static' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.materials.length === 0 ? (
                          <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: C.textXs, padding: '24px' }}>No materials in this group</td></tr>
                        ) : group.materials.map((m, i) => {
                          const isOut = m.closing_stock <= 0;
                          const isLow = !isOut && m.is_low;
                          const statusLabel = isOut ? 'OUT' : isLow ? 'LOW' : 'OK';
                          const statusChip = isOut ? chip(C.redLight, C.red) : isLow ? chip(C.amberLight, C.amber) : chip(C.greenLight, C.green);
                          const stockColor = isOut ? C.red : isLow ? C.amber : C.text;
                          return (
                            <tr key={m.material_id} style={{ background: i % 2 === 0 ? C.white : C.rowAlt }}>
                              <td style={{ ...td, fontWeight: 700, color: C.text }}>{m.material_name}</td>
                              <td style={{ ...td, color: C.textXs, fontSize: '0.8rem' }}>{m.unit}</td>
                              <td style={{ ...td, fontWeight: 900, fontSize: '1.05rem', color: stockColor }}>{Number(m.closing_stock).toFixed(2)}</td>
                              <td style={{ ...td, color: C.textSm }}>{m.minimum_stock > 0 ? Number(m.minimum_stock).toFixed(2) : '—'}</td>
                              <td style={{ ...td, color: C.textXs, fontSize: '0.8rem' }}>{m.last_entry_date || '—'}</td>
                              <td style={td}><span style={statusChip}>{statusLabel}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB: NEW ENTRY                                                    */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {tab === 'entry' && (
            <div style={{ display: 'grid', gridTemplateColumns: '500px 1fr', gap: '24px', alignItems: 'start' }}>

              {/* Form */}
              <div style={card}>
                <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.border}`, background: '#fafafa' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: C.text }}>Add Stock Entry</div>
                  <div style={{ fontSize: '0.78rem', color: C.textSm, marginTop: '2px' }}>Opening auto-calculated from previous closing</div>
                </div>
                <form onSubmit={handleEntrySubmit} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                  <div>
                    <label style={lbl}>Material *</label>
                    <select style={inp} value={ef.material_id} onChange={e => setEf(p => ({ ...p, material_id: e.target.value }))} required>
                      <option value="">-- Select Material --</option>
                      {groups.map(g => (
                        <optgroup key={g.id} label={g.name}>
                          {materials.filter(m => m.group_id === g.id).map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {openingPreview !== null && (
                      <div style={{ marginTop: '6px', padding: '8px 12px', background: C.primaryLight, borderRadius: '6px', fontSize: '0.78rem', color: C.primary, fontWeight: 700 }}>
                        Current Closing Stock: {Number(openingPreview.closing).toFixed(2)} {openingPreview.unit}
                        <span style={{ color: C.textSm, fontWeight: 400, marginLeft: '6px' }}>(will be used as Opening)</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={lbl}>Date *</label>
                    <input type="date" style={inp} value={ef.date} onChange={e => setEf(p => ({ ...p, date: e.target.value }))} required />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ ...lbl, color: C.green }}>Received Qty (IN)</label>
                      <input type="number" step="0.01" min="0" placeholder="0.00"
                        style={{ ...inp, fontWeight: 800, color: C.green, borderColor: '#86efac' }}
                        value={ef.received_quantity} onChange={e => setEf(p => ({ ...p, received_quantity: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ ...lbl, color: C.red }}>Used Qty (OUT)</label>
                      <input type="number" step="0.01" min="0" placeholder="0.00"
                        style={{ ...inp, fontWeight: 800, color: C.red, borderColor: '#fca5a5' }}
                        value={ef.used_quantity} onChange={e => setEf(p => ({ ...p, used_quantity: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label style={lbl}>Received By</label>
                    <input type="text" style={inp} placeholder="Person who received material"
                      value={ef.received_by} onChange={e => setEf(p => ({ ...p, received_by: e.target.value }))} />
                  </div>

                  {/* Live Preview */}
                  {openingPreview !== null && (recv > 0 || used > 0) && (
                    <div style={{ background: '#f8fafc', border: `1.5px solid ${C.border}`, borderRadius: '10px', padding: '16px 18px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: C.textXs, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Live Calculation Preview</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', textAlign: 'center' }}>
                        {[
                          { label: 'Opening', val: openingPreview.closing, clr: C.primary },
                          { label: '+ Received', val: recv, clr: C.green },
                          { label: '− Used', val: used, clr: C.red },
                          { label: '= Closing', val: previewClosing, clr: previewClosing < 0 ? C.red : C.text, big: true },
                        ].map(row => (
                          <div key={row.label} style={{ padding: '8px', background: C.white, borderRadius: '8px', border: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: '0.65rem', color: C.textXs, fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{row.label}</div>
                            <div style={{ fontSize: row.big ? '1.4rem' : '1.1rem', fontWeight: 900, color: row.clr }}>{Number(row.val).toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.75rem', color: C.textXs }}>{openingPreview.unit}</div>
                    </div>
                  )}

                  <button type="submit" disabled={saving}
                    style={{ ...btn(saving ? '#94a3b8' : C.primary, '#fff'), padding: '13px', width: '100%', fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
                    {saving ? 'Saving…' : 'Save Stock Entry'}
                  </button>
                </form>
              </div>

              {/* Right: Today's entries for selected material */}
              <div style={card}>
                <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.border}`, background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: C.text }}>Today's Entries</div>
                  <span style={{ fontSize: '0.78rem', color: C.textXs }}>{today}</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Group', 'Material', 'Opening', 'Received', 'Used', 'Closing'].map(h => (
                          <th key={h} style={{ ...th, background: '#1e293b', position: 'static', textAlign: h === 'Group' || h === 'Material' ? 'left' : 'right' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const todayEntries = entries.filter(e => e.date === today);
                        if (todayEntries.length === 0) return (
                          <tr><td colSpan={6} style={{ ...td, textAlign: 'center', padding: '40px', color: C.textXs }}>No entries today yet</td></tr>
                        );
                        return todayEntries.map((e, i) => (
                          <tr key={e.id} style={{ background: i % 2 === 0 ? C.white : C.rowAlt }}>
                            <td style={{ ...td, fontSize: '0.78rem', color: C.textXs }}>{e.group_name}</td>
                            <td style={{ ...td, fontWeight: 700 }}>{e.material_name}</td>
                            <td style={{ ...td, textAlign: 'right', color: C.primary }}>{Number(e.opening).toFixed(2)}</td>
                            <td style={{ ...td, textAlign: 'right', color: C.green, fontWeight: 700 }}>{Number(e.received_quantity) > 0 ? `+${Number(e.received_quantity).toFixed(2)}` : '—'}</td>
                            <td style={{ ...td, textAlign: 'right', color: C.red, fontWeight: 700 }}>{Number(e.used_quantity) > 0 ? `−${Number(e.used_quantity).toFixed(2)}` : '—'}</td>
                            <td style={{ ...td, textAlign: 'right', fontWeight: 900, color: Number(e.closing) < 0 ? C.red : C.text }}>{Number(e.closing).toFixed(2)}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB: SETUP                                                        */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {tab === 'setup' && (
            <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '22px', alignItems: 'start' }}>

              {/* Groups Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={card}>
                  <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: '#fafafa' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: C.text }}>Material Groups</div>
                    <div style={{ fontSize: '0.75rem', color: C.textSm, marginTop: '2px' }}>
                      E.g. Rubber, Compound, Chemical, Carbon Black
                    </div>
                  </div>
                  <div style={{ padding: '18px 20px' }}>
                    <form onSubmit={handleAddGroup} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                      <input type="text" placeholder="Group name (e.g. Rubber)" style={{ ...inp, flex: 1 }}
                        value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                      <button type="submit" disabled={savingGroup} style={{ ...btn(C.primary, '#fff'), padding: '10px 18px', cursor: savingGroup ? 'not-allowed' : 'pointer' }}>
                        {savingGroup ? '…' : 'Add'}
                      </button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {groups.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: C.textXs, fontSize: '0.85rem', border: `1px dashed ${C.border}`, borderRadius: '8px' }}>
                          No groups yet. Create one above.
                        </div>
                      ) : groups.map(g => (
                        <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                          <div>
                            <span style={{ fontWeight: 700, color: C.text, fontSize: '0.875rem' }}>{g.name}</span>
                            <span style={{ ...chip(C.primaryLight, C.primary), marginLeft: '10px' }}>
                              {materials.filter(m => m.group_id === g.id).length} materials
                            </span>
                          </div>
                          <button onClick={() => delGroup(g.id, g.name)}
                            style={{ ...btn(C.redLight, C.red), padding: '5px 12px', fontSize: '0.75rem' }}>
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Materials Panel */}
              <div style={card}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: '#fafafa' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: C.text }}>Materials</div>
                  <div style={{ fontSize: '0.75rem', color: C.textSm, marginTop: '2px' }}>
                    E.g. RSS 1, RSS 3, Carbon Black N330, Sulphur
                  </div>
                </div>
                <div style={{ padding: '18px 20px' }}>
                  {/* Add Material Form */}
                  <form onSubmit={handleAddMaterial}
                    style={{ background: '#f8fafc', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px', marginBottom: '18px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: C.textSm, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                      Add New Material
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                      <div>
                        <label style={lbl}>Material Name *</label>
                        <input type="text" placeholder="e.g. RSS 1" style={inp}
                          value={newMat.name} onChange={e => setNewMat(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div>
                        <label style={lbl}>Group *</label>
                        <select style={inp} value={newMat.group_id} onChange={e => setNewMat(p => ({ ...p, group_id: e.target.value }))}>
                          <option value="">-- Group --</option>
                          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Unit</label>
                        <select style={inp} value={newMat.unit} onChange={e => setNewMat(p => ({ ...p, unit: e.target.value }))}>
                          {['Kg', 'Gram', 'Litre', 'ML', 'Pcs', 'Bundle', 'Bag', 'Drum', 'Meter', 'Ton'].map(u => (
                            <option key={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Min Stock</label>
                        <input type="number" min="0" step="0.01" placeholder="0" style={inp}
                          value={newMat.minimum_stock} onChange={e => setNewMat(p => ({ ...p, minimum_stock: e.target.value }))} />
                      </div>
                    </div>
                    <button type="submit" disabled={savingMat}
                      style={{ ...btn(C.green, '#fff'), cursor: savingMat ? 'not-allowed' : 'pointer' }}>
                      {savingMat ? 'Adding…' : 'Add Material'}
                    </button>
                  </form>

                  {/* Material List */}
                  <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                    {groups.map(g => {
                      const gMats = materials.filter(m => m.group_id === g.id);
                      return (
                        <div key={g.id} style={{ marginBottom: '12px' }}>
                          <div style={{ padding: '6px 10px', fontSize: '0.72rem', fontWeight: 800, color: C.purple, textTransform: 'uppercase', letterSpacing: '0.06em', background: C.purpleLight, borderRadius: '6px', marginBottom: '4px' }}>
                            {g.name}
                          </div>
                          {gMats.length === 0 ? (
                            <div style={{ padding: '8px 12px', color: C.textXs, fontSize: '0.78rem' }}>No materials in this group</div>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  {['Material', 'Unit', 'Min Stock', ''].map(h => (
                                    <th key={h} style={{ ...th, background: '#334155', position: 'static', fontSize: '0.68rem' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {gMats.map((m, i) => (
                                  <tr key={m.id} style={{ background: i % 2 === 0 ? C.white : C.rowAlt }}>
                                    <td style={{ ...td, fontWeight: 700, color: C.text, fontSize: '0.83rem' }}>{m.name}</td>
                                    <td style={{ ...td, color: C.textXs, fontSize: '0.78rem' }}>{m.unit}</td>
                                    <td style={{ ...td, color: C.textSm, fontSize: '0.78rem' }}>{m.minimum_stock > 0 ? `${m.minimum_stock} ${m.unit}` : '—'}</td>
                                    <td style={{ ...td, textAlign: 'right' }}>
                                      <button onClick={() => delMaterial(m.id, m.name)}
                                        style={{ ...btn(C.redLight, C.red), padding: '4px 10px', fontSize: '0.72rem' }}>
                                        Delete
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      );
                    })}
                    {groups.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px', color: C.textXs, fontSize: '0.85rem' }}>
                        Create groups first, then add materials
                      </div>
                    )}
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

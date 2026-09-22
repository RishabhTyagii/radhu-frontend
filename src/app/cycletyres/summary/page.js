'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmtDate = (ds) => {
  if (!ds) return '-';
  const d = new Date(ds + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const diffColor = (v) => {
  const n = parseFloat(v);
  if (n < -0.01) return '#ef4444';
  if (n > 0.01) return '#22c55e';
  return '#94a3b8';
};

// ─── Inline editable cell ─────────────────────────────────────────────────────
function Cell({ value, onSave, color, bold, isInt = false, readOnly = false, highlight = false }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? '');
  const inputRef = useRef();

  useEffect(() => setVal(value ?? ''), [value]);

  const commit = () => {
    setEditing(false);
    const changed = val !== String(value ?? '');
    if (changed) onSave(val);
  };

  const numDisplay = () => {
    const n = isInt ? parseInt(val) : parseFloat(val);
    if (isNaN(n) || n === 0) return <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.75rem' }}>—</span>;
    return isInt ? n : n.toFixed(2);
  };

  const tdStyle = {
    textAlign: 'right',
    padding: '7px 10px',
    fontWeight: bold ? 700 : 500,
    color: color || '#1e293b',
    fontSize: '0.85rem',
    background: highlight ? '#fefce8' : 'transparent',
  };

  if (readOnly) return (
    <td style={tdStyle}>{numDisplay()}</td>
  );

  if (editing) return (
    <td style={{ padding: '2px 4px', background: '#eff6ff' }}>
      <input
        ref={inputRef}
        type="number"
        step={isInt ? '1' : '0.01'}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { setEditing(false); setVal(value ?? ''); }
        }}
        autoFocus
        style={{
          width: '76px', height: '30px', border: '2px solid #3b82f6',
          borderRadius: '5px', textAlign: 'right', padding: '0 6px',
          fontSize: '0.83rem', background: 'white', outline: 'none',
          boxShadow: '0 0 0 3px rgba(59,130,246,0.15)',
        }}
      />
    </td>
  );

  return (
    <td
      onClick={() => setEditing(true)}
      title="Click to edit"
      style={{
        ...tdStyle,
        cursor: 'pointer',
        borderBottom: '1.5px dashed #93c5fd',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
      onMouseLeave={e => e.currentTarget.style.background = highlight ? '#fefce8' : 'transparent'}
    >
      {numDisplay()}
    </td>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CycleTyresSummary() {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [editMap, setEditMap] = useState({});
  const [toast, setToast] = useState(null);
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState(today);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await apiGet(`/cycletyres/daily-summary/?from_date=${fromDate}&to_date=${toDate}`);
    if (res) {
      setRows(res.summary || []);
      setTotals(res.totals || {});
      const em = {};
      (res.summary || []).forEach(r => {
        em[r.date] = {
          packing_pcs: String(r.packing_pcs || 0),
          parchi_kg: r.parchi_kg || '0',
          mixing_actual_compound: r.mixing_actual_compound || '0',
          chakka: r.chakka || '0',
          calander_bias_cutt: r.calander_bias_cutt || '0',
          packing_wastage: r.packing_wastage || '0',
          tar: r.tar || '0',
        };
      });
      setEditMap(em);
    }
    setLoading(false);
  }, [fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveField = async (date, field, value) => {
    // Optimistic
    setEditMap(prev => ({ ...prev, [date]: { ...prev[date], [field]: value } }));
    setSaving(date);

    const cur = editMap[date] || {};
    const payload = {
      date,
      packing_pcs: cur.packing_pcs || '0',
      parchi_kg: cur.parchi_kg || '0',
      mixing_actual_compound: cur.mixing_actual_compound || '0',
      chakka: cur.chakka || '0',
      calander_bias_cutt: cur.calander_bias_cutt || '0',
      packing_wastage: cur.packing_wastage || '0',
      tar: cur.tar || '0',
      [field]: value,
    };

    const res = await apiPost('/cycletyres/daily-summary/', payload);
    setSaving(null);
    if (res) {
      showToast(`✅ ${date} saved`);
      fetchData();
    } else {
      showToast('❌ Save failed', 'error');
    }
  };

  const g = (date, field) => editMap[date]?.[field] ?? '0';

  // ── Stats cards ──
  const stats = [
    { label: 'Curing PCS', value: totals.production_pcs || 0, icon: '🔥', color: '#7c3aed', bg: '#7c3aed22' },
    { label: 'Packing PCS', value: totals.packing_pcs || 0, icon: '📦', color: '#0284c7', bg: '#0284c722' },
    { label: 'Theo KG', value: parseFloat(totals.theoretical_kg || 0).toFixed(1), icon: '⚖️', color: '#0f766e', bg: '#0f766e22' },
    { label: 'Parchi KG', value: parseFloat(totals.parchi_kg || 0).toFixed(1), icon: '📋', color: '#d97706', bg: '#d9770622' },
    { label: 'KG Diff', value: parseFloat(totals.difference || 0).toFixed(1), icon: '📐', color: '#dc2626', bg: '#dc262622' },
    { label: 'Variance', value: parseFloat(totals.variance || 0).toFixed(1), icon: '📉', color: '#db2777', bg: '#db277722' },
    { label: 'Chakka', value: parseFloat(totals.chakka || 0).toFixed(1), icon: '🔩', color: '#475569', bg: '#47556922' },
    { label: 'Tar', value: parseFloat(totals.tar || 0).toFixed(1), icon: '🛢️', color: '#57534e', bg: '#57534e22' },
  ];

  return (
    <>
      <Navbar />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          background: toast.type === 'error' ? '#450a0a' : '#052e16',
          color: toast.type === 'error' ? '#fca5a5' : '#86efac',
          border: `1px solid ${toast.type === 'error' ? '#7f1d1d' : '#14532d'}`,
          padding: '12px 22px', borderRadius: '10px', fontWeight: 700,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', fontSize: '0.88rem',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ background: '#0f172a', minHeight: '100vh', paddingBottom: 48 }}>

        {/* ── Header ── */}
        <div style={{
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          padding: '14px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9' }}>
              📊 Cycle Tyre Daily Summary
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.78rem', marginTop: 2 }}>
              ✏️ dashed cells ko click karo — inline edit hoga, blur pe auto-save
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {[['FROM', fromDate, setFromDate], ['TO', toDate, setToDate]].map(([label, val, setter]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>{label}</span>
                <input type="date" value={val} onChange={e => setter(e.target.value)}
                  style={{
                    background: '#0f172a', border: '1px solid #475569', borderRadius: 8,
                    padding: '6px 10px', fontSize: '0.83rem', color: '#e2e8f0', cursor: 'pointer',
                    outline: 'none',
                  }} />
              </div>
            ))}
            <button onClick={fetchData} style={{
              background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8,
              padding: '8px 18px', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(59,130,246,0.4)',
            }}>🔄 Refresh</button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 20px', overflowX: 'auto', flexWrap: 'nowrap' }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: s.bg, border: `1px solid ${s.color}55`,
              borderRadius: 12, padding: '12px 18px', minWidth: 110,
              flexShrink: 0, textAlign: 'center', backdropFilter: 'blur(4px)',
            }}>
              <div style={{ fontSize: '1.3rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div style={{ margin: '0 16px', borderRadius: 14, overflow: 'hidden', border: '1px solid #334155', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#64748b', background: '#1e293b' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>⏳</div>
              Loading…
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>

                {/* THEAD */}
                <thead>
                  <tr style={{ background: '#1e293b', position: 'sticky', top: 61, zIndex: 50 }}>
                    {[
                      ['DATE', '#e2e8f0', true],
                      ['CURING PCS', '#c4b5fd', false],
                      ['PACKING PCS ✏️', '#7dd3fc', false],
                      ['THEO KG', '#6ee7b7', false],
                      ['PARCHI KG ✏️', '#fde68a', false],
                      ['DIFF KG', '#fca5a5', false],
                      ['THEO COMP', '#a5f3fc', false],
                      ['MIXING ACT ✏️', '#fde68a', false],
                      ['VARIANCE', '#fca5a5', false],
                      ['CHAKKA ✏️', '#fde68a', false],
                      ['CALANDER ✏️', '#fde68a', false],
                      ['PACK WASTE ✏️', '#fde68a', false],
                      ['TAR ✏️', '#fde68a', false],
                      ['', '#475569', false],
                    ].map(([label, color, left], i) => (
                      <th key={i} style={{
                        padding: '10px 10px',
                        textAlign: left ? 'left' : 'right',
                        color, fontSize: '0.7rem', fontWeight: 800,
                        letterSpacing: '0.05em', whiteSpace: 'nowrap',
                        borderBottom: '1px solid #334155',
                        background: '#1e293b',
                        ...(left ? { position: 'sticky', left: 0, zIndex: 51, paddingLeft: 16 } : {}),
                      }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* TBODY */}
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={14} style={{ textAlign: 'center', padding: 50, color: '#475569', background: '#0f172a' }}>
                        Koi data nahi mila is range mein.
                      </td>
                    </tr>
                  )}
                  {rows.map((r, i) => {
                    const bg = i % 2 === 0 ? '#0f172a' : '#1a2540';
                    const isSaving = saving === r.date;
                    const diff = parseFloat(r.difference || 0);
                    const variance = parseFloat(r.variance || 0);

                    return (
                      <tr key={r.date}
                        style={{ background: bg, borderBottom: '1px solid #1e293b', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#1e3a5f'}
                        onMouseLeave={e => e.currentTarget.style.background = bg}
                      >
                        {/* DATE sticky */}
                        <td style={{
                          padding: '9px 16px', fontWeight: 700, color: '#e2e8f0',
                          fontSize: '0.85rem', position: 'sticky', left: 0, background: bg,
                          zIndex: 5, borderRight: '1px solid #334155', whiteSpace: 'nowrap',
                        }}>
                          {fmtDate(r.date)}
                          <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', fontWeight: 400 }}>{r.date}</span>
                        </td>

                        {/* CURING PCS — read only */}
                        <td style={{ textAlign: 'right', padding: '9px 10px', fontWeight: 800, color: '#a78bfa', fontSize: '0.9rem' }}>
                          {r.production_pcs > 0 ? r.production_pcs : <span style={{ color: '#334155' }}>—</span>}
                        </td>

                        {/* PACKING PCS — NOW EDITABLE */}
                        <Cell
                          value={g(r.date, 'packing_pcs')}
                          onSave={v => saveField(r.date, 'packing_pcs', v)}
                          color="#38bdf8" bold isInt
                        />

                        {/* THEO KG */}
                        <td style={{ textAlign: 'right', padding: '9px 10px', color: '#34d399', fontWeight: 500 }}>
                          {parseFloat(r.theoretical_kg) !== 0 ? parseFloat(r.theoretical_kg).toFixed(2) : <span style={{ color: '#334155' }}>—</span>}
                        </td>

                        {/* PARCHI KG editable */}
                        <Cell value={g(r.date, 'parchi_kg')} onSave={v => saveField(r.date, 'parchi_kg', v)} color="#fbbf24" bold />

                        {/* DIFF */}
                        <td style={{ textAlign: 'right', padding: '9px 10px', fontWeight: 700, color: diffColor(diff), fontSize: '0.85rem' }}>
                          {diff !== 0 ? (diff > 0 ? '+' : '') + diff.toFixed(2) : <span style={{ color: '#334155' }}>—</span>}
                        </td>

                        {/* THEO COMP */}
                        <td style={{ textAlign: 'right', padding: '9px 10px', color: '#67e8f9', fontWeight: 500 }}>
                          {parseFloat(r.theoretical_total_compound) !== 0 ? parseFloat(r.theoretical_total_compound).toFixed(2) : <span style={{ color: '#334155' }}>—</span>}
                        </td>

                        {/* MIXING ACTUAL editable */}
                        <Cell value={g(r.date, 'mixing_actual_compound')} onSave={v => saveField(r.date, 'mixing_actual_compound', v)} color="#c084fc" bold />

                        {/* VARIANCE */}
                        <td style={{ textAlign: 'right', padding: '9px 10px', fontWeight: 700, color: diffColor(variance), fontSize: '0.85rem' }}>
                          {variance !== 0 ? (variance > 0 ? '+' : '') + variance.toFixed(2) : <span style={{ color: '#334155' }}>—</span>}
                        </td>

                        {/* CHAKKA editable */}
                        <Cell value={g(r.date, 'chakka')} onSave={v => saveField(r.date, 'chakka', v)} color="#cbd5e1" />
                        {/* CALANDER editable */}
                        <Cell value={g(r.date, 'calander_bias_cutt')} onSave={v => saveField(r.date, 'calander_bias_cutt', v)} color="#cbd5e1" />
                        {/* PACK WASTAGE editable */}
                        <Cell value={g(r.date, 'packing_wastage')} onSave={v => saveField(r.date, 'packing_wastage', v)} color="#cbd5e1" />
                        {/* TAR editable */}
                        <Cell value={g(r.date, 'tar')} onSave={v => saveField(r.date, 'tar', v)} color="#cbd5e1" />

                        {/* Status */}
                        <td style={{ textAlign: 'center', padding: '9px 8px' }}>
                          {isSaving
                            ? <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>💾</span>
                            : <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>✓</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* TOTALS footer */}
                {rows.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#1e3a5f', borderTop: '2px solid #3b82f6' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 800, color: '#f1f5f9', fontSize: '0.85rem', position: 'sticky', left: 0, background: '#1e3a5f', borderRight: '1px solid #334155' }}>TOTALS</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 800, color: '#a78bfa' }}>{totals.production_pcs || 0}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 800, color: '#38bdf8' }}>{totals.packing_pcs || 0}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: '#34d399' }}>{parseFloat(totals.theoretical_kg || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: '#fbbf24' }}>{parseFloat(totals.parchi_kg || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: diffColor(totals.difference) }}>{parseFloat(totals.difference || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: '#67e8f9' }}>{parseFloat(totals.theoretical_total_compound || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: '#c084fc' }}>{parseFloat(totals.mixing_actual_compound || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: diffColor(totals.variance) }}>{parseFloat(totals.variance || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', color: '#cbd5e1', fontWeight: 700 }}>{parseFloat(totals.chakka || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', color: '#cbd5e1', fontWeight: 700 }}>{parseFloat(totals.calander_bias_cutt || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', color: '#cbd5e1', fontWeight: 700 }}>{parseFloat(totals.packing_wastage || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', color: '#cbd5e1', fontWeight: 700 }}>{parseFloat(totals.tar || 0).toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        {/* Formula bar */}
        <div style={{
          margin: '12px 16px 0', padding: '10px 16px',
          background: '#1e293b', borderRadius: 10, border: '1px solid #334155',
          fontSize: '0.73rem', color: '#94a3b8', display: 'flex', flexWrap: 'wrap', gap: 10,
        }}>
          <span>⚖️ <strong style={{ color: '#e2e8f0' }}>Theo KG</strong> = Curing × Weight</span>
          <span style={{ color: '#475569' }}>|</span>
          <span>🧪 <strong style={{ color: '#e2e8f0' }}>Theo Comp</strong> = Theo KG × 0.825</span>
          <span style={{ color: '#475569' }}>|</span>
          <span>📏 <strong style={{ color: '#e2e8f0' }}>Diff</strong> = Parchi − Theo KG</span>
          <span style={{ color: '#475569' }}>|</span>
          <span>📉 <strong style={{ color: '#e2e8f0' }}>Variance</strong> = Mixing − Theo Comp</span>
          <span style={{ color: '#475569' }}>|</span>
          <span>✏️ <strong style={{ color: '#93c5fd' }}>Dashed cells</strong> = click to edit</span>
        </div>

      </div>
    </>
  );
}

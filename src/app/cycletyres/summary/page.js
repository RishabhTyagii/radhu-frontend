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
  if (n < -0.01) return '#dc2626';
  if (n > 0.01) return '#16a34a';
  return '#64748b';
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
    if (isNaN(n) || n === 0) return <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.75rem' }}>—</span>;
    return isInt ? n : n.toFixed(2);
  };

  const tdStyle = {
    textAlign: 'right',
    padding: '9px 12px',
    fontWeight: bold ? 700 : 500,
    color: color || '#1e293b',
    fontSize: '0.85rem',
    background: highlight ? '#fefce8' : 'transparent',
  };

  if (readOnly) return (
    <td style={tdStyle}>{numDisplay()}</td>
  );

  if (editing) return (
    <td style={{ padding: '4px 6px', background: '#eff6ff' }}>
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
          width: '80px', height: '32px', border: '2px solid #2563eb',
          borderRadius: '6px', textAlign: 'right', padding: '0 8px',
          fontSize: '0.85rem', background: '#ffffff', outline: 'none',
          boxShadow: '0 0 0 3px rgba(37,99,235,0.15)', color: '#0f172a', fontWeight: 700
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
        borderBottom: '1.5px dashed #60a5fa',
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
    { label: 'Curing PCS', value: totals.production_pcs || 0, icon: '🔥', color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
    { label: 'Packing PCS', value: totals.packing_pcs || 0, icon: '📦', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
    { label: 'Theo KG', value: parseFloat(totals.theoretical_kg || 0).toFixed(1), icon: '⚖️', color: '#0f766e', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: 'Parchi KG', value: parseFloat(totals.parchi_kg || 0).toFixed(1), icon: '📋', color: '#b45309', bg: '#fffbeb', border: '#fef3c7' },
    { label: 'KG Diff', value: parseFloat(totals.difference || 0).toFixed(1), icon: '📐', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
    { label: 'Variance', value: parseFloat(totals.variance || 0).toFixed(1), icon: '📉', color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' },
    { label: 'Chakka', value: parseFloat(totals.chakka || 0).toFixed(1), icon: '🔩', color: '#334155', bg: '#f8fafc', border: '#e2e8f0' },
    { label: 'Tar', value: parseFloat(totals.tar || 0).toFixed(1), icon: '🛢️', color: '#44403c', bg: '#fafaf9', border: '#e7e5e4' },
  ];

  return (
    <>
      <Navbar />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: toast.type === 'error' ? '#991b1b' : '#166534',
          border: `1px solid ${toast.type === 'error' ? '#fca5a5' : '#86efac'}`,
          padding: '12px 22px', borderRadius: '10px', fontWeight: 700,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: '0.88rem',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 48, color: '#0f172a' }}>

        {/* ── Header ── */}
        <div style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              📊 Cycle Tyre Daily Summary
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', marginTop: 3 }}>
              ✏️ Dashed cells ko click karke edit karo — Packing PCS, Parchi KG, Mixing, Chakka, Calander, Pack Waste, Tar.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {[['FROM', fromDate, setFromDate], ['TO', toDate, setToDate]].map(([label, val, setter]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 800 }}>{label}</span>
                <input type="date" value={val} onChange={e => setter(e.target.value)}
                  style={{
                    background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8,
                    padding: '6px 10px', fontSize: '0.83rem', color: '#0f172a', cursor: 'pointer',
                    outline: 'none', fontWeight: 600
                  }} />
              </div>
            ))}
            <button onClick={fetchData} style={{
              background: '#2563eb', color: 'white', border: 'none', borderRadius: 8,
              padding: '8px 18px', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
            }}>🔄 Refresh</button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div style={{ display: 'flex', gap: 12, padding: '16px 24px', overflowX: 'auto', flexWrap: 'nowrap' }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: 12, padding: '12px 18px', minWidth: 110,
              flexShrink: 0, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '1.3rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Table Container ── */}
        <div style={{ margin: '0 24px', borderRadius: 14, overflow: 'hidden', border: '1px solid #cbd5e1', background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#64748b', background: '#ffffff' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>⏳</div>
              Loading Daily Summary…
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 270px)', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.84rem' }}>

                {/* THEAD */}
                <thead>
                  <tr>
                    {[
                      ['DATE', '#0f172a', true],
                      ['CURING PCS', '#5b21b6', false],
                      ['PACKING PCS ✏️', '#0369a1', false],
                      ['THEO KG', '#047857', false],
                      ['PARCHI KG ✏️', '#b45309', false],
                      ['DIFF KG', '#b91c1c', false],
                      ['THEO COMP', '#0e7490', false],
                      ['MIXING ACT ✏️', '#7e22ce', false],
                      ['VARIANCE', '#be185d', false],
                      ['CHAKKA ✏️', '#334155', false],
                      ['CALANDER ✏️', '#334155', false],
                      ['PACK WASTE ✏️', '#334155', false],
                      ['TAR ✏️', '#334155', false],
                      ['', '#64748b', false],
                    ].map(([label, color, left], i) => (
                      <th key={i} style={{
                        padding: '12px 10px',
                        textAlign: left ? 'left' : 'right',
                        color, fontSize: '0.72rem', fontWeight: 800,
                        letterSpacing: '0.05em', whiteSpace: 'nowrap',
                        borderBottom: '2px solid #cbd5e1',
                        background: '#f1f5f9',
                        position: 'sticky', top: 0, zIndex: left ? 30 : 20,
                        ...(left ? { left: 0, paddingLeft: 16 } : {}),
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
                      <td colSpan={14} style={{ textAlign: 'center', padding: 50, color: '#64748b', background: '#ffffff' }}>
                        Is date range mein koi data nahi mila.
                      </td>
                    </tr>
                  )}
                  {rows.map((r, i) => {
                    const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
                    const isSaving = saving === r.date;
                    const diff = parseFloat(r.difference || 0);
                    const variance = parseFloat(r.variance || 0);

                    return (
                      <tr key={r.date}
                        style={{ background: bg, borderBottom: '1px solid #e2e8f0', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseLeave={e => e.currentTarget.style.background = bg}
                      >
                        {/* DATE sticky */}
                        <td style={{
                          padding: '10px 16px', fontWeight: 700, color: '#0f172a',
                          fontSize: '0.85rem', position: 'sticky', left: 0, background: bg,
                          zIndex: 10, borderRight: '1px solid #e2e8f0', whiteSpace: 'nowrap',
                        }}>
                          {fmtDate(r.date)}
                          <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', fontWeight: 400 }}>{r.date}</span>
                        </td>

                        {/* CURING PCS — read only */}
                        <td style={{ textAlign: 'right', padding: '10px', fontWeight: 800, color: '#6d28d9', fontSize: '0.9rem' }}>
                          {r.production_pcs > 0 ? r.production_pcs : <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>

                        {/* PACKING PCS — EDITABLE */}
                        <Cell
                          value={g(r.date, 'packing_pcs')}
                          onSave={v => saveField(r.date, 'packing_pcs', v)}
                          color="#0284c7" bold isInt
                        />

                        {/* THEO KG */}
                        <td style={{ textAlign: 'right', padding: '10px', color: '#047857', fontWeight: 600 }}>
                          {parseFloat(r.theoretical_kg) !== 0 ? parseFloat(r.theoretical_kg).toFixed(2) : <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>

                        {/* PARCHI KG editable */}
                        <Cell value={g(r.date, 'parchi_kg')} onSave={v => saveField(r.date, 'parchi_kg', v)} color="#b45309" bold />

                        {/* DIFF */}
                        <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: diffColor(diff), fontSize: '0.85rem' }}>
                          {diff !== 0 ? (diff > 0 ? '+' : '') + diff.toFixed(2) : <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>

                        {/* THEO COMP */}
                        <td style={{ textAlign: 'right', padding: '10px', color: '#0e7490', fontWeight: 600 }}>
                          {parseFloat(r.theoretical_total_compound) !== 0 ? parseFloat(r.theoretical_total_compound).toFixed(2) : <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>

                        {/* MIXING ACTUAL editable */}
                        <Cell value={g(r.date, 'mixing_actual_compound')} onSave={v => saveField(r.date, 'mixing_actual_compound', v)} color="#7e22ce" bold />

                        {/* VARIANCE */}
                        <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: diffColor(variance), fontSize: '0.85rem' }}>
                          {variance !== 0 ? (variance > 0 ? '+' : '') + variance.toFixed(2) : <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>

                        {/* CHAKKA editable */}
                        <Cell value={g(r.date, 'chakka')} onSave={v => saveField(r.date, 'chakka', v)} color="#334155" />
                        {/* CALANDER editable */}
                        <Cell value={g(r.date, 'calander_bias_cutt')} onSave={v => saveField(r.date, 'calander_bias_cutt', v)} color="#334155" />
                        {/* PACK WASTAGE editable */}
                        <Cell value={g(r.date, 'packing_wastage')} onSave={v => saveField(r.date, 'packing_wastage', v)} color="#334155" />
                        {/* TAR editable */}
                        <Cell value={g(r.date, 'tar')} onSave={v => saveField(r.date, 'tar', v)} color="#334155" />

                        {/* Status */}
                        <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                          {isSaving
                            ? <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>💾</span>
                            : <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>✓</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* TOTALS footer */}
                {rows.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#f1f5f9', borderTop: '2px solid #cbd5e1' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0f172a', fontSize: '0.85rem', position: 'sticky', left: 0, background: '#f1f5f9', zIndex: 10, borderRight: '1px solid #cbd5e1' }}>TOTALS</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 800, color: '#6d28d9' }}>{totals.production_pcs || 0}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 800, color: '#0284c7' }}>{totals.packing_pcs || 0}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: '#047857' }}>{parseFloat(totals.theoretical_kg || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: '#b45309' }}>{parseFloat(totals.parchi_kg || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: diffColor(totals.difference) }}>{parseFloat(totals.difference || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: '#0e7490' }}>{parseFloat(totals.theoretical_total_compound || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: '#7e22ce' }}>{parseFloat(totals.mixing_actual_compound || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: diffColor(totals.variance) }}>{parseFloat(totals.variance || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', color: '#334155', fontWeight: 700 }}>{parseFloat(totals.chakka || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', color: '#334155', fontWeight: 700 }}>{parseFloat(totals.calander_bias_cutt || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', color: '#334155', fontWeight: 700 }}>{parseFloat(totals.packing_wastage || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', color: '#334155', fontWeight: 700 }}>{parseFloat(totals.tar || 0).toFixed(2)}</td>
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
          margin: '16px 24px 0', padding: '12px 18px',
          background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0',
          fontSize: '0.75rem', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <span>⚖️ <strong style={{ color: '#0f172a' }}>Theo KG</strong> = Curing × Weight</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span>🧪 <strong style={{ color: '#0f172a' }}>Theo Comp</strong> = Theo KG × 0.825</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span>📏 <strong style={{ color: '#0f172a' }}>Diff</strong> = Parchi − Theo KG</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span>📉 <strong style={{ color: '#0f172a' }}>Variance</strong> = Mixing − Theo Comp</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span>✏️ <strong style={{ color: '#2563eb' }}>Dashed cells</strong> = Click to edit manually</span>
        </div>

      </div>
    </>
  );
}

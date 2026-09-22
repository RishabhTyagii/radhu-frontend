'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmt = (v) => {
  const n = parseFloat(v);
  if (isNaN(n) || n === 0) return <span style={{ color: '#cbd5e1' }}>—</span>;
  return n.toFixed(2);
};

const fmtPcs = (v) => {
  const n = parseInt(v);
  if (isNaN(n) || n === 0) return <span style={{ color: '#cbd5e1' }}>—</span>;
  return n;
};

const fmtDate = (ds) => {
  if (!ds) return '-';
  const d = new Date(ds + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

// Editable cell - inline input that saves on blur/enter
function EditCell({ value, onSave, color, bold, align = 'right', readOnly = false }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? '');
  const inputRef = useRef();

  useEffect(() => setVal(value ?? ''), [value]);

  if (readOnly) {
    return (
      <td style={{ textAlign: align, padding: '6px 10px', fontWeight: bold ? 700 : 400, color: color || 'inherit', fontSize: '0.85rem' }}>
        {parseFloat(value) !== 0 ? value : <span style={{ color: '#cbd5e1' }}>—</span>}
      </td>
    );
  }

  const handleSave = () => {
    setEditing(false);
    if (val !== String(value ?? '')) onSave(val);
  };

  if (editing) {
    return (
      <td style={{ padding: '2px', textAlign: align }}>
        <input
          ref={inputRef}
          type="number"
          step="0.01"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => { if (e.key === 'Enter') { handleSave(); } if (e.key === 'Escape') { setEditing(false); setVal(value ?? ''); } }}
          autoFocus
          style={{
            width: '80px', height: '28px', border: '2px solid #3b82f6', borderRadius: '4px',
            textAlign: 'right', padding: '0 4px', fontSize: '0.82rem', background: '#eff6ff', outline: 'none'
          }}
        />
      </td>
    );
  }

  const n = parseFloat(val);
  return (
    <td
      onClick={() => { setEditing(true); }}
      title="Click to edit"
      style={{
        textAlign: align, padding: '6px 10px', cursor: 'pointer',
        fontWeight: bold ? 700 : 400, color: color || '#1e293b', fontSize: '0.85rem',
        borderBottom: '1px dashed #e2e8f0',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {isNaN(n) || n === 0 ? <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>tap</span> : n % 1 === 0 ? n : n.toFixed(2)}
    </td>
  );
}

export default function CycleTyresSummary() {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // date string of row being saved
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [toDate, setToDate] = useState(today());
  const [editMap, setEditMap] = useState({}); // { date: { parchi_kg, mixing_actual_compound, ... } }
  const [toast, setToast] = useState(null);

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
      // Initialize editMap from existing data
      const em = {};
      (res.summary || []).forEach(r => {
        em[r.date] = {
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

  const handleFieldChange = async (date, field, value) => {
    // Optimistic update
    setEditMap(prev => ({
      ...prev,
      [date]: { ...prev[date], [field]: value }
    }));

    setSaving(date);
    const currentRow = editMap[date] || {};
    const payload = {
      date,
      parchi_kg: currentRow.parchi_kg || '0',
      mixing_actual_compound: currentRow.mixing_actual_compound || '0',
      chakka: currentRow.chakka || '0',
      calander_bias_cutt: currentRow.calander_bias_cutt || '0',
      packing_wastage: currentRow.packing_wastage || '0',
      tar: currentRow.tar || '0',
      [field]: value,
    };

    const res = await apiPost('/cycletyres/daily-summary/', payload);
    setSaving(null);
    if (res) {
      showToast(`✅ Saved ${date}`);
      fetchData(); // refresh totals
    } else {
      showToast('❌ Save failed', 'error');
    }
  };

  const getField = (date, field) => editMap[date]?.[field] ?? '0';

  const diffColor = (v) => {
    const n = parseFloat(v);
    if (n < 0) return '#ef4444';
    if (n > 0) return '#10b981';
    return '#94a3b8';
  };

  const COLS = [
    { key: 'date', label: 'DATE', width: 80, sticky: true },
    { key: 'production_pcs', label: 'CURING PCS', width: 90, readOnly: true, color: '#7c3aed', bold: true },
    { key: 'packing_pcs', label: 'PACKING PCS', width: 95, readOnly: true, color: '#0284c7', bold: true },
    { key: 'theoretical_kg', label: 'THEO KG', width: 85, readOnly: true },
    { key: 'parchi_kg', label: 'PARCHI KG', width: 90, editable: true },
    { key: 'difference', label: 'DIFF (KG)', width: 85, readOnly: true, diffColor: true },
    { key: 'theoretical_total_compound', label: 'THEO COMP', width: 90, readOnly: true },
    { key: 'mixing_actual_compound', label: 'MIXING ACT', width: 95, editable: true },
    { key: 'variance', label: 'VARIANCE', width: 85, readOnly: true, diffColor: true },
    { key: 'chakka', label: 'CHAKKA', width: 80, editable: true },
    { key: 'calander_bias_cutt', label: 'CALANDER', width: 85, editable: true },
    { key: 'packing_wastage', label: 'PACK WASTE', width: 90, editable: true },
    { key: 'tar', label: 'TAR', width: 75, editable: true },
  ];

  return (
    <>
      <Navbar />
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: toast.type === 'error' ? '#dc2626' : '#16a34a',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          padding: '12px 20px', borderRadius: '10px', fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontSize: '0.9rem',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Full-width layout — no container */}
      <div style={{ padding: '0 0 40px 0', background: '#f1f5f9', minHeight: '100vh' }}>

        {/* Header bar */}
        <div style={{
          background: 'white', borderBottom: '1px solid #e2e8f0',
          padding: '16px 28px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '12px', position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
              📊 Cycle Tyre Daily Summary
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>
              Click any <span style={{ color: '#3b82f6', fontWeight: 600 }}>blue-dashed</span> cell to edit inline • Auto-saves on change
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>FROM</span>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', fontSize: '0.85rem', cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TO</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', fontSize: '0.85rem', cursor: 'pointer' }} />
            </div>
            <button onClick={fetchData} style={{
              background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px',
              padding: '8px 18px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
            }}>🔄 Refresh</button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', overflowX: 'auto' }}>
          {[
            { label: 'Curing PCS', value: totals.production_pcs || 0, icon: '🔥', color: '#7c3aed', bg: '#f5f3ff' },
            { label: 'Packing PCS', value: totals.packing_pcs || 0, icon: '📦', color: '#0284c7', bg: '#eff6ff' },
            { label: 'Theo KG', value: parseFloat(totals.theoretical_kg || 0).toFixed(1), icon: '⚖️', color: '#0f766e', bg: '#f0fdfa' },
            { label: 'Parchi KG', value: parseFloat(totals.parchi_kg || 0).toFixed(1), icon: '📋', color: '#c2410c', bg: '#fff7ed' },
            { label: 'KG Diff', value: parseFloat(totals.difference || 0).toFixed(1), icon: '📐', color: '#64748b', bg: '#f8fafc' },
            { label: 'Variance', value: parseFloat(totals.variance || 0).toFixed(1), icon: '📉', color: '#be123c', bg: '#fff1f2' },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, border: `1px solid ${s.color}22`, borderRadius: '12px',
              padding: '12px 20px', minWidth: '120px', flexShrink: 0, textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.4rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '2px', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Main Table - edge to edge */}
        <div style={{ margin: '0 16px', background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
              Loading summary...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', position: 'sticky', top: '61px', zIndex: 50 }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', color: 'white', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', minWidth: '90px', position: 'sticky', left: 0, background: '#0f172a', zIndex: 51 }}>DATE</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right', color: '#c4b5fd', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', minWidth: '85px' }}>CURING PCS</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right', color: '#7dd3fc', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', minWidth: '90px' }}>PACKING PCS</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right', color: '#6ee7b7', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', minWidth: '80px' }}>THEO KG</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right', color: '#fde68a', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', minWidth: '90px' }}>PARCHI KG ✏️</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right', color: '#fca5a5', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', minWidth: '75px' }}>DIFF KG</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right', color: '#a5f3fc', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', minWidth: '85px' }}>THEO COMP</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right', color: '#fde68a', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', minWidth: '90px' }}>MIXING ACT ✏️</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right', color: '#fca5a5', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', minWidth: '80px' }}>VARIANCE</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right', color: '#fde68a', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', minWidth: '75px' }}>CHAKKA ✏️</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right', color: '#fde68a', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', minWidth: '85px' }}>CALANDER ✏️</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right', color: '#fde68a', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', minWidth: '85px' }}>PACK WASTE ✏️</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right', color: '#fde68a', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', minWidth: '70px' }}>TAR ✏️</th>
                    <th style={{ padding: '10px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, minWidth: '60px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={14} style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', fontSize: '0.9rem' }}>
                      No data for this range. Add production entries first.
                    </td></tr>
                  )}
                  {rows.map((r, i) => {
                    const isSaving = saving === r.date;
                    const em = editMap[r.date] || {};
                    const diff = parseFloat(r.difference || 0);
                    const variance = parseFloat(r.variance || 0);
                    return (
                      <tr key={r.date} style={{ background: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#f8fafc'}
                      >
                        {/* Date - sticky */}
                        <td style={{ padding: '8px 14px', fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', position: 'sticky', left: 0, background: i % 2 === 0 ? 'white' : '#f8fafc', zIndex: 5, borderRight: '2px solid #e2e8f0' }}>
                          {fmtDate(r.date)}<br />
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 400 }}>{r.date?.slice(0, 7)}</span>
                        </td>
                        {/* Curing PCS — read only from production */}
                        <td style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 800, color: '#7c3aed', fontSize: '0.9rem' }}>
                          {r.production_pcs > 0 ? r.production_pcs : <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>
                        {/* Packing PCS — read only from production */}
                        <td style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 800, color: '#0284c7', fontSize: '0.9rem' }}>
                          {r.packing_pcs > 0 ? r.packing_pcs : <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>
                        {/* Theo KG — computed */}
                        <td style={{ textAlign: 'right', padding: '8px 10px', color: '#0f766e' }}>{parseFloat(r.theoretical_kg) !== 0 ? parseFloat(r.theoretical_kg).toFixed(2) : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                        {/* PARCHI KG — editable */}
                        <EditCell
                          value={em.parchi_kg}
                          onSave={(v) => handleFieldChange(r.date, 'parchi_kg', v)}
                          bold color="#c2410c"
                        />
                        {/* DIFF */}
                        <td style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 700, color: diffColor(diff), fontSize: '0.85rem' }}>
                          {diff !== 0 ? (diff > 0 ? '+' : '') + diff.toFixed(2) : <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>
                        {/* THEO COMP */}
                        <td style={{ textAlign: 'right', padding: '8px 10px', color: '#0f766e' }}>{parseFloat(r.theoretical_total_compound) !== 0 ? parseFloat(r.theoretical_total_compound).toFixed(2) : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                        {/* MIXING ACTUAL — editable */}
                        <EditCell
                          value={em.mixing_actual_compound}
                          onSave={(v) => handleFieldChange(r.date, 'mixing_actual_compound', v)}
                          bold color="#7c3aed"
                        />
                        {/* VARIANCE */}
                        <td style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 700, color: diffColor(variance), fontSize: '0.85rem' }}>
                          {variance !== 0 ? (variance > 0 ? '+' : '') + variance.toFixed(2) : <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>
                        {/* CHAKKA */}
                        <EditCell value={em.chakka} onSave={(v) => handleFieldChange(r.date, 'chakka', v)} />
                        {/* CALANDER */}
                        <EditCell value={em.calander_bias_cutt} onSave={(v) => handleFieldChange(r.date, 'calander_bias_cutt', v)} />
                        {/* PACK WASTAGE */}
                        <EditCell value={em.packing_wastage} onSave={(v) => handleFieldChange(r.date, 'packing_wastage', v)} />
                        {/* TAR */}
                        <EditCell value={em.tar} onSave={(v) => handleFieldChange(r.date, 'tar', v)} />
                        {/* Saving indicator */}
                        <td style={{ textAlign: 'center', padding: '8px' }}>
                          {isSaving
                            ? <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700 }}>💾…</span>
                            : <span style={{ fontSize: '0.7rem', color: '#22c55e' }}>✓</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#fef3c7', borderTop: '2px solid #f59e0b' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 800, fontSize: '0.85rem', position: 'sticky', left: 0, background: '#fef3c7', borderRight: '2px solid #e2e8f0' }}>TOTALS</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 800, color: '#7c3aed' }}>{totals.production_pcs || 0}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 800, color: '#0284c7' }}>{totals.packing_pcs || 0}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700 }}>{parseFloat(totals.theoretical_kg || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: '#c2410c' }}>{parseFloat(totals.parchi_kg || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: diffColor(totals.difference) }}>{parseFloat(totals.difference || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700 }}>{parseFloat(totals.theoretical_total_compound || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700 }}>{parseFloat(totals.mixing_actual_compound || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: diffColor(totals.variance) }}>{parseFloat(totals.variance || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700 }}>{parseFloat(totals.chakka || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700 }}>{parseFloat(totals.calander_bias_cutt || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700 }}>{parseFloat(totals.packing_wastage || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700 }}>{parseFloat(totals.tar || 0).toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        {/* Formula legend */}
        <div style={{ margin: '12px 16px 0', padding: '10px 16px', background: 'white', borderRadius: '10px', fontSize: '0.75rem', color: '#64748b', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <span>📐 <strong>Theo KG</strong> = Curing Pcs × Item Weight</span>
          <span>|</span>
          <span>📊 <strong>Theo Compound</strong> = Theo KG × 0.825</span>
          <span>|</span>
          <span>📏 <strong>Diff</strong> = Parchi KG − Theo KG</span>
          <span>|</span>
          <span>📉 <strong>Variance</strong> = Mixing Actual − Theo Compound</span>
          <span>|</span>
          <span>✏️ = Click to edit inline</span>
        </div>
      </div>
    </>
  );
}

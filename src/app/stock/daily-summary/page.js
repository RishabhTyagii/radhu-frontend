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

// Inline editable cell
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
    if (isNaN(n) || n === 0) return <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.75rem' }}>-</span>;
    return isInt ? n : n.toFixed(2);
  };

  const tdStyle = {
    textAlign: 'right',
    padding: '9px 12px',
    fontWeight: bold ? 700 : 500,
    color: color || '#1e293b',
    fontSize: '0.85rem',
    background: highlight ? '#fefce8' : 'transparent',
    whiteSpace: 'nowrap'
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

export default function AutoTyresSummary() {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMap, setEditMap] = useState({});
  const [toast, setToast] = useState(null);
  
  // Date range
  const d = new Date();
  d.setDate(1);
  const [fromDate, setFromDate] = useState(d.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today());

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await apiGet(`/stock/daily-summary/?from_date=${fromDate}&to_date=${toDate}`);
    if (res && Array.isArray(res)) {
      setRows(res);
      
      const em = {};
      let tot = { curing: 0, packing: 0, theoretical_kg: 0, parchi_kg: 0, difference: 0, theoretical_compound: 0, mixing_actual_compound: 0, variance: 0, wastage: 0 };
      
      res.forEach(r => {
        em[r.date] = {
          parchi_kg: String(r.parchi_kg || '0'),
          mixing_actual_compound: String(r.mixing_actual_compound || '0'),
          wastage: String(r.wastage || '0'),
        };
        tot.curing += Number(r.curing || 0);
        tot.packing += Number(r.packing || 0);
        tot.theoretical_kg += Number(r.theoretical_kg || 0);
        tot.parchi_kg += Number(r.parchi_kg || 0);
        tot.difference += Number(r.difference || 0);
        tot.theoretical_compound += Number(r.theoretical_compound || 0);
        tot.mixing_actual_compound += Number(r.mixing_actual_compound || 0);
        tot.variance += Number(r.variance || 0);
        tot.wastage += Number(r.wastage || 0);
      });
      setTotals(tot);
      setEditMap(em);
    }
    setLoading(false);
  }, [fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveField = async (date, field, value) => {
    setEditMap(prev => ({ ...prev, [date]: { ...prev[date], [field]: value } }));
    
    const cur = editMap[date] || {};
    const payload = {
      entry_date: date,
      parchi_kg: cur.parchi_kg || '0',
      mixing_actual_compound: cur.mixing_actual_compound || '0',
      wastage: cur.wastage || '0',
      [field]: value,
    };

    const res = await apiPost('/stock/daily-summary/', payload);
    if (res) {
      showToast(`✏️ ${date} saved`);
      fetchData();
    } else {
      showToast('❌ Save failed', 'error');
    }
  };

  const g = (date, field) => editMap[date]?.[field] ?? '0';

  const stats = [
    { label: 'Curing PCS', value: totals.curing || 0, icon: '🏭', color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
    { label: 'Packing PCS', value: totals.packing || 0, icon: '📦', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
    { label: 'Theo KG', value: parseFloat(totals.theoretical_kg || 0).toFixed(1), icon: '⚖️', color: '#0f766e', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: 'Parchi KG', value: parseFloat(totals.parchi_kg || 0).toFixed(1), icon: '🎫', color: '#b45309', bg: '#fffbeb', border: '#fef3c7' },
    { label: 'KG Diff', value: parseFloat(totals.difference || 0).toFixed(1), icon: '📉', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
    { label: 'Variance', value: parseFloat(totals.variance || 0).toFixed(1), icon: '📊', color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' },
  ];

  return (
    <>
      <Navbar />

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
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                🚜 Auto Tyre Summary
              </h1>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.95rem' }}>Daily summary with auto-calculated formulas + ground-truth manual entry</p>
            </div>
            
            <div style={{ display: 'flex', gap: 12, background: '#fff', padding: '8px 16px', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ border: 'none', outline: 'none', color: '#334155', fontWeight: 600, background: 'transparent' }} />
              <span style={{ color: '#cbd5e1' }}>|</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ border: 'none', outline: 'none', color: '#334155', fontWeight: 600, background: 'transparent' }} />
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  <div style={{ color: s.color, fontSize: '1.4rem', fontWeight: 800, marginTop: 2 }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 270px)', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Loading data...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <tr>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'left', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 11 }}>Date</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Curing PCS</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Packing PCS</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right', borderLeft: '1px solid #e2e8f0' }}>Theo KG</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Parchi KG ✏️</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Difference</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right', borderLeft: '1px solid #e2e8f0' }}>Theo Compound</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Actual Compound ✏️</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#be185d', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Variance</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right', borderLeft: '1px solid #e2e8f0' }}>Wastage ✏️</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const isEven = i % 2 === 0;
                      const bg = isEven ? '#ffffff' : '#fafafa';
                      const diff = parseFloat(r.difference);
                      const vari = parseFloat(r.variance);
                      
                      return (
                        <tr key={r.date} style={{ background: bg, transition: 'background 0.15s' }}>
                          <td style={{ padding: '9px 12px', fontSize: '0.85rem', fontWeight: 700, color: '#334155', borderBottom: '1px solid #f1f5f9', position: 'sticky', left: 0, background: bg, zIndex: 5, borderRight: '1px solid #f1f5f9' }}>
                            {fmtDate(r.date)}
                          </td>
                          <Cell readOnly isInt value={r.curing} bold color="#6d28d9" />
                          <Cell readOnly isInt value={r.packing} bold color="#0369a1" />
                          
                          <td style={{borderLeft: '1px solid #f1f5f9'}}></td><Cell readOnly value={r.theoretical_kg} color="#0f766e" />
                          <Cell value={g(r.date, 'parchi_kg')} onSave={v => saveField(r.date, 'parchi_kg', v)} highlight color="#92400e" />
                          <Cell readOnly value={r.difference} color={diffColor(diff)} bold={Math.abs(diff) > 0.1} />
                          
                          <td style={{borderLeft: '1px solid #f1f5f9'}}></td><Cell readOnly value={r.theoretical_compound} />
                          <Cell value={g(r.date, 'mixing_actual_compound')} onSave={v => saveField(r.date, 'mixing_actual_compound', v)} highlight color="#92400e" />
                          <Cell readOnly value={r.variance} color={diffColor(vari)} bold={Math.abs(vari) > 0.1} />
                          
                          <td style={{borderLeft: '1px solid #f1f5f9'}}></td><Cell value={g(r.date, 'wastage')} onSave={v => saveField(r.date, 'wastage', v)} highlight />
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc' }}>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', borderTop: '2px solid #e2e8f0', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 5, borderRight: '1px solid #e2e8f0' }}>TOTALS</td>
                      <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 800, color: '#6d28d9', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseInt(totals.curing || 0)}</td>
                      <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 800, color: '#0369a1', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseInt(totals.packing || 0)}</td>
                      
                      <td style={{borderLeft: '1px solid #e2e8f0', borderTop: '2px solid #e2e8f0'}}></td><td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#0f766e', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.theoretical_kg || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#92400e', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.parchi_kg || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: diffColor(totals.difference), borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.difference || 0).toFixed(2)}</td>
                      
                      <td style={{borderLeft: '1px solid #e2e8f0', borderTop: '2px solid #e2e8f0'}}></td><td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#334155', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.theoretical_compound || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#92400e', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.mixing_actual_compound || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: diffColor(totals.variance), borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.variance || 0).toFixed(2)}</td>
                      
                      <td style={{borderLeft: '1px solid #e2e8f0', borderTop: '2px solid #e2e8f0'}}></td><td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#475569', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.wastage || 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

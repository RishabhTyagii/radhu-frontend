'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

const today = () => {
  const d = new Date();
  return "${d.getFullYear()}--";
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

export default function CycleTubeSummary() {
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
    const res = await apiGet(/cycletube/production-summary/?start_date=&end_date=);
    if (res) {
      setRows(res.summary || []);
      setTotals(res.totals || {});
      const em = {};
      (res.summary || []).forEach(r => {
        em[r.date] = {
          valve_body_issued: String(r.valve_body_issued || '0'),
          actual_wt_gross: String(r.actual_wt_gross || '0'),
          actual_mixing_compound: String(r.actual_mixing_compound || '0'),
          jali: String(r.jali || '0'),
          die_wastage: String(r.die_wastage || '0'),
          tube_cutting: String(r.tube_cutting || '0'),
          total_tube_waste: String(r.total_tube_waste || '0'),
        };
      });
      setEditMap(em);
    }
    setLoading(false);
  }, [fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveField = async (date, field, value) => {
    setEditMap(prev => ({ ...prev, [date]: { ...prev[date], [field]: value } }));
    
    const cur = editMap[date] || {};
    const payload = {
      date,
      valve_body_issued: cur.valve_body_issued || '0',
      actual_wt_gross: cur.actual_wt_gross || '0',
      actual_mixing_compound: cur.actual_mixing_compound || '0',
      jali: cur.jali || '0',
      die_wastage: cur.die_wastage || '0',
      tube_cutting: cur.tube_cutting || '0',
      total_tube_waste: cur.total_tube_waste || '0',
      [field]: value,
    };

    const res = await apiPost('/cycletube/production-summary/', payload);
    if (res) {
      showToast(✏️  saved);
      fetchData();
    } else {
      showToast('❌ Save failed', 'error');
    }
  };

  const g = (date, field) => editMap[date]?.[field] ?? '0';

  const stats = [
    { label: 'Production PCS', value: totals.pcs || 0, icon: '🏭', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
    { label: 'Gross Wt', value: parseFloat(totals.actual_wt_gross || 0).toFixed(1), icon: '⚖️', color: '#b45309', bg: '#fffbeb', border: '#fef3c7' },
    { label: 'Target Wt', value: parseFloat(totals.target_wt || 0).toFixed(1), icon: '🎯', color: '#0f766e', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: 'Variance (Wt)', value: parseFloat(totals.variance_wt || 0).toFixed(1), icon: '📈', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
    { label: 'Actual Mixing', value: parseFloat(totals.actual_mixing || 0).toFixed(1), icon: '🌀', color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
    { label: 'Variance (Mix)', value: parseFloat(totals.variance_mixing || 0).toFixed(1), icon: '📊', color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' },
  ];

  return (
    <>
      <Navbar />

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: toast.type === 'error' ? '#991b1b' : '#166534',
          border: 1px solid ,
          padding: '12px 22px', borderRadius: '10px', fontWeight: 700,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: '0.88rem',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 48, color: '#0f172a' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                🚴‍♂️ Cycle Tube Summary
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ background: s.bg, border: 1px solid , borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
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
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '1300px' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <tr>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'left', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 11 }}>Date</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Production<br/>Pcs</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right', borderLeft: '1px solid #e2e8f0' }}>Valve Body<br/>Issued ✏️</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Target wt<br/>Kgs inc VB</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Actual wt kgs<br/>Gross ✏️</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Actual weight<br/>Net less</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Variance (wt)</th>
                      
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right', borderLeft: '1px solid #e2e8f0' }}>Target Consmpt<br/>less VB</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Actual Comp Wt<br/>(-Pck+VB)</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Variance<br/>(Comp)</th>
                      
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right', borderLeft: '1px solid #e2e8f0' }}>Actual Mixing<br/>Compound ✏️</th>
                      <th style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#be185d', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Variance<br/>(Mixing)</th>
                      
                      <th colSpan="4" style={{ padding: '12px', fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>Wastage in Tube Production ✏️</th>
                    </tr>
                    <tr>
                      <th colSpan="12" style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: 0 }}></th>
                      <th style={{ padding: '8px 12px', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textAlign: 'right', borderBottom: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0', background: '#f8fafc' }}>Jali</th>
                      <th style={{ padding: '8px 12px', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textAlign: 'right', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>Die Wstg</th>
                      <th style={{ padding: '8px 12px', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textAlign: 'right', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>Tube Cut</th>
                      <th style={{ padding: '8px 12px', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textAlign: 'right', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const isEven = i % 2 === 0;
                      const bg = isEven ? '#ffffff' : '#fafafa';
                      const v_wt = parseFloat(r.variance_wt);
                      const v_comp = parseFloat(r.variance_comp);
                      const v_mix = parseFloat(r.variance_mixing);
                      
                      return (
                        <tr key={r.date} style={{ background: bg, transition: 'background 0.15s' }}>
                          <td style={{ padding: '9px 12px', fontSize: '0.85rem', fontWeight: 700, color: '#334155', borderBottom: '1px solid #f1f5f9', position: 'sticky', left: 0, background: bg, zIndex: 5, borderRight: '1px solid #f1f5f9' }}>
                            {fmtDate(r.date)}
                          </td>
                          <Cell readOnly isInt value={r.pcs} bold color="#0284c7" />
                          <td style={{borderLeft: '1px solid #f1f5f9'}}></td><Cell value={g(r.date, 'valve_body_issued')} onSave={v => saveField(r.date, 'valve_body_issued', v)} highlight color="#92400e" />
                          <Cell readOnly value={r.target_wt} color="#0f766e" />
                          <Cell value={g(r.date, 'actual_wt_gross')} onSave={v => saveField(r.date, 'actual_wt_gross', v)} highlight color="#92400e" />
                          <Cell readOnly value={r.actual_wt_net} />
                          <Cell readOnly value={r.variance_wt} color={diffColor(v_wt)} bold={Math.abs(v_wt) > 0.1} />
                          
                          <td style={{borderLeft: '1px solid #f1f5f9'}}></td><Cell readOnly value={r.target_consmpt} />
                          <Cell readOnly value={r.actual_comp_net} />
                          <Cell readOnly value={r.variance_comp} color={diffColor(v_comp)} bold={Math.abs(v_comp) > 0.1} />
                          
                          <td style={{borderLeft: '1px solid #f1f5f9'}}></td><Cell value={g(r.date, 'actual_mixing_compound')} onSave={v => saveField(r.date, 'actual_mixing_compound', v)} highlight color="#92400e" />
                          <Cell readOnly value={r.variance_mixing} color={diffColor(v_mix)} bold={Math.abs(v_mix) > 0.1} />
                          
                          <td style={{borderLeft: '1px solid #f1f5f9'}}></td><Cell value={g(r.date, 'jali')} onSave={v => saveField(r.date, 'jali', v)} highlight />
                          <Cell value={g(r.date, 'die_wastage')} onSave={v => saveField(r.date, 'die_wastage', v)} highlight />
                          <Cell value={g(r.date, 'tube_cutting')} onSave={v => saveField(r.date, 'tube_cutting', v)} highlight />
                          <Cell value={g(r.date, 'total_tube_waste')} onSave={v => saveField(r.date, 'total_tube_waste', v)} highlight bold color="#475569" />
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc' }}>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', borderTop: '2px solid #e2e8f0', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 5, borderRight: '1px solid #e2e8f0' }}>TOTALS</td>
                      <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 800, color: '#0284c7', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseInt(totals.pcs || 0)}</td>
                      <td style={{borderLeft: '1px solid #e2e8f0', borderTop: '2px solid #e2e8f0'}}></td><td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#92400e', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.valve_body_issued || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#0f766e', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.target_wt || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#92400e', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.actual_wt_gross || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#334155', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.actual_wt_net || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: diffColor(totals.variance_wt), borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.variance_wt || 0).toFixed(2)}</td>
                      
                      <td style={{borderLeft: '1px solid #e2e8f0', borderTop: '2px solid #e2e8f0'}}></td><td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#334155', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.target_consmpt || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#334155', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.actual_comp_net || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: diffColor(totals.variance_comp), borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.variance_comp || 0).toFixed(2)}</td>
                      
                      <td style={{borderLeft: '1px solid #e2e8f0', borderTop: '2px solid #e2e8f0'}}></td><td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#92400e', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.actual_mixing || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: diffColor(totals.variance_mixing), borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.variance_mixing || 0).toFixed(2)}</td>
                      
                      <td style={{borderLeft: '1px solid #e2e8f0', borderTop: '2px solid #e2e8f0'}}></td><td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#475569', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.jali || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#475569', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.die_wastage || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#475569', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.tube_cutting || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', borderTop: '2px solid #e2e8f0', textAlign: 'right' }}>{parseFloat(totals.total_tube_waste || 0).toFixed(2)}</td>
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

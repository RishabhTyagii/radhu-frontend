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

function Cell({ value, onSave, color, bold, isInt = false, readOnly = false, highlight = false }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? '');

  useEffect(() => setVal(value ?? ''), [value]);

  const commit = () => {
    setEditing(false);
    const changed = val !== String(value ?? '');
    if (changed && onSave) onSave(val);
  };

  const numDisplay = () => {
    const n = isInt ? parseInt(val) : parseFloat(val);
    if (isNaN(n) || n === 0) return <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.75rem' }}>-</span>;
    return isInt ? n : n.toFixed(2);
  };

  const tdStyle = {
    textAlign: 'right',
    padding: '8px 10px',
    fontWeight: bold ? 700 : 500,
    color: color || '#1e293b',
    fontSize: '0.82rem',
    background: highlight ? '#fefce8' : 'transparent',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid #f1f5f9',
  };

  if (readOnly) return <td style={tdStyle}>{numDisplay()}</td>;

  if (editing) return (
    <td style={{ padding: '3px 5px', background: '#eff6ff', borderBottom: '1px solid #f1f5f9' }}>
      <input
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
          width: '75px', height: '28px', border: '2px solid #2563eb',
          borderRadius: '5px', textAlign: 'right', padding: '0 6px',
          fontSize: '0.82rem', background: '#fff', outline: 'none', color: '#0f172a', fontWeight: 700
        }}
      />
    </td>
  );

  return (
    <td
      onClick={() => setEditing(true)}
      title="Click to edit"
      style={{ ...tdStyle, cursor: 'pointer', borderBottom: '1.5px dashed #93c5fd' }}
      onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
      onMouseLeave={e => e.currentTarget.style.background = highlight ? '#fefce8' : 'transparent'}
    >
      {numDisplay()}
    </td>
  );
}

const TH = ({ children, color = '#475569', align = 'right', rowSpan, colSpan, noBorderLeft }) => (
  <th style={{
    padding: '10px 10px',
    fontSize: '0.65rem',
    fontWeight: 800,
    color,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '2px solid #e2e8f0',
    borderLeft: noBorderLeft ? 'none' : undefined,
    textAlign: align,
    background: '#f1f5f9',
    whiteSpace: 'nowrap',
    lineHeight: 1.3,
    verticalAlign: 'middle',
  }} rowSpan={rowSpan} colSpan={colSpan}>
    {children}
  </th>
);

export default function CycleTubeSummary() {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMap, setEditMap] = useState({});
  const [toast, setToast] = useState(null);

  const d0 = new Date(); d0.setDate(1);
  const [fromDate, setFromDate] = useState(d0.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today());

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await apiGet(`/cycletube/production-summary/?start_date=${fromDate}&end_date=${toDate}`);
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
    const cur = editMap[date] || {};
    const updated = { ...cur, [field]: value };
    setEditMap(prev => ({ ...prev, [date]: updated }));

    const payload = {
      date,
      valve_body_issued: updated.valve_body_issued || '0',
      actual_wt_gross: updated.actual_wt_gross || '0',
      actual_mixing_compound: updated.actual_mixing_compound || '0',
      jali: updated.jali || '0',
      die_wastage: updated.die_wastage || '0',
      tube_cutting: updated.tube_cutting || '0',
      total_tube_waste: updated.total_tube_waste || '0',
    };

    const res = await apiPost('/cycletube/production-summary/', payload);
    if (res) { showToast(`✏️ ${date} saved`); fetchData(); }
    else showToast('❌ Save failed', 'error');
  };

  const g = (date, field) => editMap[date]?.[field] ?? '0';

  const stats = [
    { label: 'Production PCS', value: totals.pcs || 0, color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
    { label: 'Gross Wt', value: parseFloat(totals.actual_wt_gross || 0).toFixed(1), color: '#b45309', bg: '#fffbeb', border: '#fef3c7' },
    { label: 'Target Wt', value: parseFloat(totals.target_wt || 0).toFixed(1), color: '#0f766e', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: 'Variance (Wt)', value: parseFloat(totals.variance_wt || 0).toFixed(1), color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
    { label: 'Actual Mixing', value: parseFloat(totals.actual_mixing || 0).toFixed(1), color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
    { label: 'Variance (Mix)', value: parseFloat(totals.variance_mixing || 0).toFixed(1), color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' },
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

      {/* Full-width page — no maxWidth container */}
      <div style={{ background: '#f1f5f9', minHeight: '100vh', paddingBottom: 32 }}>

        {/* Top bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>🚴 Cycle Tube Summary</h1>
            <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>Daily production summary — click yellow cells to edit</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f8fafc', padding: '6px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ border: 'none', outline: 'none', color: '#334155', fontWeight: 600, background: 'transparent', fontSize: '0.88rem' }} />
            <span style={{ color: '#cbd5e1', fontWeight: 700 }}>→</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ border: 'none', outline: 'none', color: '#334155', fontWeight: 600, background: 'transparent', fontSize: '0.88rem' }} />
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, padding: '14px 20px', overflowX: 'auto' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '10px 18px', minWidth: 130, flexShrink: 0 }}>
              <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ color: s.color, fontSize: '1.3rem', fontWeight: 800, marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Table — truly edge-to-edge */}
        <div style={{ padding: '0 12px 20px' }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Loading...</div>
              ) : rows.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>No data for this range.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      {/* Fixed date col */}
                      <TH align="left" rowSpan={2}>Date</TH>
                      {/* Pcs */}
                      <TH color="#0369a1" rowSpan={2}>Prod<br/>PCS</TH>
                      {/* Weight block */}
                      <TH color="#7c3aed" colSpan={5} align="center">Weight (KG)</TH>
                      {/* Compound block */}
                      <TH color="#0f766e" colSpan={3} align="center">Compound (KG)</TH>
                      {/* Mixing block */}
                      <TH color="#b45309" colSpan={2} align="center">Mixing (KG)</TH>
                      {/* Wastage block */}
                      <TH color="#64748b" colSpan={4} align="center">Wastage in Tube Production ✏️</TH>
                    </tr>
                    <tr>
                      {/* Weight sub-headers */}
                      <TH color="#b45309">Valve Body<br/>Issued ✏️</TH>
                      <TH color="#0f766e">Target Wt<br/>inc VB</TH>
                      <TH color="#b45309">Actual Wt<br/>Gross ✏️</TH>
                      <TH color="#475569">Actual Wt<br/>Net Less</TH>
                      <TH color="#b91c1c">Variance<br/>(Wt)</TH>
                      {/* Compound sub-headers */}
                      <TH color="#475569">Target<br/>Consmpt</TH>
                      <TH color="#475569">Actual Comp<br/>(-Pck+VB)</TH>
                      <TH color="#b91c1c">Variance<br/>(Comp)</TH>
                      {/* Mixing sub-headers */}
                      <TH color="#b45309">Actual Mix<br/>Compound ✏️</TH>
                      <TH color="#be185d">Variance<br/>(Mixing)</TH>
                      {/* Wastage sub-headers */}
                      <TH color="#64748b">Jali</TH>
                      <TH color="#64748b">Die Wstg</TH>
                      <TH color="#64748b">Tube Cut</TH>
                      <TH color="#0f172a">Total</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const bg = i % 2 === 0 ? '#ffffff' : '#fafafa';
                      const v_wt = parseFloat(r.variance_wt);
                      const v_comp = parseFloat(r.variance_comp);
                      const v_mix = parseFloat(r.variance_mixing);
                      return (
                        <tr key={r.date} style={{ background: bg }}>
                          <td style={{ padding: '8px 10px', fontSize: '0.82rem', fontWeight: 700, color: '#334155', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                            {fmtDate(r.date)}
                          </td>
                          <Cell readOnly isInt value={r.pcs} bold color="#0284c7" />
                          {/* Weight */}
                          <Cell value={g(r.date, 'valve_body_issued')} onSave={v => saveField(r.date, 'valve_body_issued', v)} highlight color="#92400e" />
                          <Cell readOnly value={r.target_wt} color="#0f766e" />
                          <Cell value={g(r.date, 'actual_wt_gross')} onSave={v => saveField(r.date, 'actual_wt_gross', v)} highlight color="#92400e" />
                          <Cell readOnly value={r.actual_wt_net} />
                          <Cell readOnly value={r.variance_wt} color={diffColor(v_wt)} bold={Math.abs(v_wt) > 0.1} />
                          {/* Compound */}
                          <Cell readOnly value={r.target_consmpt} />
                          <Cell readOnly value={r.actual_comp_net} />
                          <Cell readOnly value={r.variance_comp} color={diffColor(v_comp)} bold={Math.abs(v_comp) > 0.1} />
                          {/* Mixing */}
                          <Cell value={g(r.date, 'actual_mixing_compound')} onSave={v => saveField(r.date, 'actual_mixing_compound', v)} highlight color="#92400e" />
                          <Cell readOnly value={r.variance_mixing} color={diffColor(v_mix)} bold={Math.abs(v_mix) > 0.1} />
                          {/* Wastage */}
                          <Cell value={g(r.date, 'jali')} onSave={v => saveField(r.date, 'jali', v)} highlight />
                          <Cell value={g(r.date, 'die_wastage')} onSave={v => saveField(r.date, 'die_wastage', v)} highlight />
                          <Cell value={g(r.date, 'tube_cutting')} onSave={v => saveField(r.date, 'tube_cutting', v)} highlight />
                          <Cell value={g(r.date, 'total_tube_waste')} onSave={v => saveField(r.date, 'total_tube_waste', v)} highlight bold color="#0f172a" />
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f1f5f9' }}>
                      <td style={{ padding: '10px', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', borderTop: '2px solid #cbd5e1' }}>TOTALS</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#0284c7', borderTop: '2px solid #cbd5e1', fontSize: '0.88rem' }}>{parseInt(totals.pcs || 0)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#92400e', borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.valve_body_issued || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#0f766e', borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.target_wt || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#92400e', borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.actual_wt_gross || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#334155', borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.actual_wt_net || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: diffColor(totals.variance_wt), borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.variance_wt || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#334155', borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.target_consmpt || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#334155', borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.actual_comp_net || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: diffColor(totals.variance_comp), borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.variance_comp || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#92400e', borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.actual_mixing || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: diffColor(totals.variance_mixing), borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.variance_mixing || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#475569', borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.jali || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#475569', borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.die_wastage || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#475569', borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.tube_cutting || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#0f172a', borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.total_tube_waste || 0).toFixed(2)}</td>
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

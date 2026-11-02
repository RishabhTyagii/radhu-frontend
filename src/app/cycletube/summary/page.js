'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';
import { exportStyledExcel } from '@/lib/exportExcel';

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
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = Newest first (ulta), 'asc' = Oldest first (uper se niche)

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const ta = new Date(a.date).getTime();
      const tb = new Date(b.date).getTime();
      return sortOrder === 'asc' ? ta - tb : tb - ta;
    });
  }, [rows, sortOrder]);

  const handleExportExcel = async () => {
    if (!sortedRows.length) return;
    const columns = [
      { header: 'Date', key: 'date', align: 'center', width: 14 },
      { header: 'Prod PCS', key: 'pcs', isInt: true, align: 'right', width: 12 },
      { header: 'Valve Body Issued', key: 'valve_body_issued', isFloat: true, align: 'right', width: 18 },
      { header: 'Target Wt inc VB', key: 'target_wt', isFloat: true, align: 'right', width: 17 },
      { header: 'Actual Wt Gross', key: 'actual_wt_gross', isFloat: true, align: 'right', width: 17 },
      { header: 'Actual Wt Net Less', key: 'actual_wt_net', isFloat: true, align: 'right', width: 17 },
      { header: 'Variance (Wt)', key: 'variance_wt', isFloat: true, align: 'right', width: 14 },
      { header: 'Target Consmpt', key: 'target_consmpt', isFloat: true, align: 'right', width: 16 },
      { header: 'Actual Comp Net', key: 'actual_comp_net', isFloat: true, align: 'right', width: 16 },
      { header: 'Variance (Comp)', key: 'variance_comp', isFloat: true, align: 'right', width: 15 },
      { header: 'Actual Mix Compound', key: 'actual_mixing_compound', isFloat: true, align: 'right', width: 20 },
      { header: 'Variance (Mixing)', key: 'variance_mixing', isFloat: true, align: 'right', width: 16 },
      { header: 'Jali (KG)', key: 'jali', isFloat: true, align: 'right', width: 12 },
      { header: 'Die Wstg (KG)', key: 'die_wastage', isFloat: true, align: 'right', width: 14 },
      { header: 'Tube Cut (KG)', key: 'tube_cutting', isFloat: true, align: 'right', width: 14 },
      { header: 'Total Waste (KG)', key: 'total_tube_waste', isFloat: true, align: 'right', width: 16 },
    ];

    const dataRows = sortedRows.map(r => ({
      date: r.date,
      pcs: parseInt(r.pcs || 0),
      valve_body_issued: parseFloat(editMap[r.date]?.valve_body_issued ?? r.valve_body_issued ?? 0),
      target_wt: parseFloat(r.target_wt || 0),
      actual_wt_gross: parseFloat(editMap[r.date]?.actual_wt_gross ?? r.actual_wt_gross ?? 0),
      actual_wt_net: parseFloat(r.actual_wt_net || 0),
      variance_wt: parseFloat(r.variance_wt || 0),
      target_consmpt: parseFloat(r.target_consmpt || 0),
      actual_comp_net: parseFloat(r.actual_comp_net || 0),
      variance_comp: parseFloat(r.variance_comp || 0),
      actual_mixing_compound: parseFloat(editMap[r.date]?.actual_mixing_compound ?? r.actual_mixing_compound ?? 0),
      variance_mixing: parseFloat(r.variance_mixing || 0),
      jali: parseFloat(editMap[r.date]?.jali ?? r.jali ?? 0),
      die_wastage: parseFloat(editMap[r.date]?.die_wastage ?? r.die_wastage ?? 0),
      tube_cutting: parseFloat(editMap[r.date]?.tube_cutting ?? r.tube_cutting ?? 0),
      total_tube_waste: parseFloat(editMap[r.date]?.total_tube_waste ?? r.total_tube_waste ?? 0),
    }));

    const totalsObj = {
      date: 'TOTALS',
      pcs: parseInt(totals.pcs || 0),
      valve_body_issued: parseFloat(totals.valve_body_issued || 0),
      target_wt: parseFloat(totals.target_wt || 0),
      actual_wt_gross: parseFloat(totals.actual_wt_gross || 0),
      actual_wt_net: parseFloat(totals.actual_wt_net || 0),
      variance_wt: parseFloat(totals.variance_wt || 0),
      target_consmpt: parseFloat(totals.target_consmpt || 0),
      actual_comp_net: parseFloat(totals.actual_comp_net || 0),
      variance_comp: parseFloat(totals.variance_comp || 0),
      actual_mixing_compound: parseFloat(totals.actual_mixing || 0),
      variance_mixing: parseFloat(totals.variance_mixing || 0),
      jali: parseFloat(totals.jali || 0),
      die_wastage: parseFloat(totals.die_wastage || 0),
      tube_cutting: parseFloat(totals.tube_cutting || 0),
      total_tube_waste: parseFloat(totals.total_tube_waste || 0),
    };

    await exportStyledExcel({
      title: 'Radhu Enterprises - Cycle Tube Daily Summary',
      subtitle: `Period: ${fromDate} to ${toDate} | Sort: ${sortOrder === 'asc' ? 'Oldest to Newest (Uper se Niche)' : 'Newest to Oldest (Ulta)'} | Exported: ${new Date().toLocaleString('en-IN')}`,
      sheetName: 'Cycle Tube Summary',
      filename: `Cycle_Tube_Daily_Summary_${sortOrder}_${fromDate}_to_${toDate}.xlsx`,
      columns,
      data: dataRows,
      totals: totalsObj,
    });
  };

  const handlePrint = () => {
    window.print();
  };

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
      <style>{`
        @page {
          size: A4 landscape;
          margin: 4mm 5mm 4mm 5mm;
        }
        @media print {
          nav, .no-print, header, footer {
            display: none !important;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 6.2pt !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-header {
            display: block !important;
            margin-bottom: 5px !important;
            padding: 0 0 3px 0 !important;
            border-bottom: 1.5px solid #000000 !important;
          }
          .print-header h2 {
            font-size: 10.5pt !important;
            font-weight: 900 !important;
            color: #000000 !important;
            margin: 0 !important;
            text-transform: uppercase !important;
          }
          .print-header p {
            font-size: 6.5pt !important;
            color: #000000 !important;
            margin: 2px 0 0 !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          .print-table-wrapper {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            max-height: none !important;
          }
          table {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            border-collapse: collapse !important;
            page-break-inside: auto;
            table-layout: fixed !important;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
          th {
            border: 1px solid #000000 !important;
            padding: 2.5px 1.5px !important;
            font-size: 5.8pt !important;
            font-weight: 800 !important;
            background: #ffffff !important;
            color: #000000 !important;
            text-align: center !important;
            line-height: 1.05 !important;
          }
          th * {
            color: #000000 !important;
          }
          td {
            border: 1px solid #000000 !important;
            padding: 2px 1.5px !important;
            font-size: 5.8pt !important;
            background: #ffffff !important;
            color: #000000 !important;
            line-height: 1.05 !important;
          }
          td * {
            color: #000000 !important;
          }
          input {
            border: none !important;
            background: transparent !important;
            color: #000000 !important;
            font-size: 5.8pt !important;
            font-weight: 600 !important;
            padding: 0 !important;
            margin: 0 !important;
            text-align: right !important;
            width: 100% !important;
            box-shadow: none !important;
          }
          tfoot tr td {
            font-weight: 900 !important;
            border-top: 1.5px solid #000000 !important;
            border-bottom: 2px solid #000000 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
        @media screen {
          .print-header {
            display: none !important;
          }
        }
      `}</style>
      <Navbar />

      <div className="print-header" style={{ padding: '10px 20px 0' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>🚴 Cycle Tube Daily Summary</h2>
        <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#475569' }}>
          Period: {fromDate} to {toDate} | Sort: {sortOrder === 'asc' ? 'Oldest to Newest (Uper se Niche)' : 'Newest to Oldest (Ulta)'} | Exported on: {new Date().toLocaleString('en-IN')}
        </p>
      </div>

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
      <div className="print-container" style={{ background: '#f1f5f9', minHeight: '100vh', paddingBottom: 32 }}>

        {/* Top bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }} className="no-print">
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>🚴 Cycle Tube Summary</h1>
            <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>Daily production summary — click yellow cells to edit</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f8fafc', padding: '6px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ border: 'none', outline: 'none', color: '#334155', fontWeight: 600, background: 'transparent', fontSize: '0.88rem' }} />
              <span style={{ color: '#cbd5e1', fontWeight: 700 }}>→</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ border: 'none', outline: 'none', color: '#334155', fontWeight: 600, background: 'transparent', fontSize: '0.88rem' }} />
            </div>

            {/* Sort Toggle Button */}
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              title="Change date sorting order"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#fff',
                border: '1.5px solid #cbd5e1',
                borderRadius: 8,
                padding: '7px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              {sortOrder === 'asc' ? '⬆️ Date: Oldest First' : '⬇️ Date: Newest First'}
            </button>

            {/* Excel Export Button */}
            <button
              onClick={handleExportExcel}
              disabled={!sortedRows.length}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#047857',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: sortedRows.length ? 'pointer' : 'not-allowed',
                opacity: sortedRows.length ? 1 : 0.6,
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
              }}
            >
              📥 Export Excel
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              disabled={!sortedRows.length}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: sortedRows.length ? 'pointer' : 'not-allowed',
                opacity: sortedRows.length ? 1 : 0.6,
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
              }}
            >
              🖨️ Direct Print
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, padding: '14px 20px', overflowX: 'auto' }} className="no-print">
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
            <div className="print-table-wrapper" style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Loading...</div>
              ) : rows.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>No data for this range.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      {/* Fixed date col */}
                      <TH align="left" rowSpan={2}>
                        <div
                          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Click to toggle Date Sort"
                        >
                          Date <span style={{ color: '#0284c7', fontSize: '0.8rem' }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>
                        </div>
                      </TH>
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
                    {sortedRows.map((r, i) => {
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

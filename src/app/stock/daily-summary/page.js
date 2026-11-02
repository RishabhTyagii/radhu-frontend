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

const TH = ({ children, color = '#475569', align = 'right', rowSpan, colSpan }) => (
  <th style={{
    padding: '10px 10px',
    fontSize: '0.65rem',
    fontWeight: 800,
    color,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '2px solid #e2e8f0',
    textAlign: align,
    background: '#f1f5f9',
    whiteSpace: 'nowrap',
    lineHeight: 1.3,
    verticalAlign: 'middle',
  }} rowSpan={rowSpan} colSpan={colSpan}>
    {children}
  </th>
);

export default function AutoTyresSummary() {
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
      { header: 'Curing PCS', key: 'curing', isInt: true, align: 'right', width: 14 },
      { header: 'Packing PCS', key: 'packing', isInt: true, align: 'right', width: 14 },
      { header: 'Theo KG', key: 'theoretical_kg', isFloat: true, align: 'right', width: 14 },
      { header: 'Parchi KG', key: 'parchi_kg', isFloat: true, align: 'right', width: 14 },
      { header: 'KG Diff', key: 'difference', isFloat: true, align: 'right', width: 14 },
      { header: 'Theo Compound (KG)', key: 'theoretical_compound', isFloat: true, align: 'right', width: 22 },
      { header: 'Actual Compound (KG)', key: 'mixing_actual_compound', isFloat: true, align: 'right', width: 22 },
      { header: 'Variance', key: 'variance', isFloat: true, align: 'right', width: 14 },
      { header: 'Wastage (KG)', key: 'wastage', isFloat: true, align: 'right', width: 16 },
    ];

    const dataRows = sortedRows.map(r => ({
      date: r.date,
      curing: parseInt(r.curing || 0),
      packing: parseInt(r.packing || 0),
      theoretical_kg: parseFloat(r.theoretical_kg || 0),
      parchi_kg: parseFloat(editMap[r.date]?.parchi_kg ?? r.parchi_kg ?? 0),
      difference: parseFloat(r.difference || 0),
      theoretical_compound: parseFloat(r.theoretical_compound || 0),
      mixing_actual_compound: parseFloat(editMap[r.date]?.mixing_actual_compound ?? r.mixing_actual_compound ?? 0),
      variance: parseFloat(r.variance || 0),
      wastage: parseFloat(editMap[r.date]?.wastage ?? r.wastage ?? 0),
    }));

    const totalsObj = {
      date: 'TOTALS',
      curing: parseInt(totals.curing || 0),
      packing: parseInt(totals.packing || 0),
      theoretical_kg: parseFloat(totals.theoretical_kg || 0),
      parchi_kg: parseFloat(totals.parchi_kg || 0),
      difference: parseFloat(totals.difference || 0),
      theoretical_compound: parseFloat(totals.theoretical_compound || 0),
      mixing_actual_compound: parseFloat(totals.mixing_actual_compound || 0),
      variance: parseFloat(totals.variance || 0),
      wastage: parseFloat(totals.wastage || 0),
    };

    await exportStyledExcel({
      title: 'Radhu Enterprises - Auto Tyre Daily Summary',
      subtitle: `Period: ${fromDate} to ${toDate} | Sort: ${sortOrder === 'asc' ? 'Oldest to Newest (Uper se Niche)' : 'Newest to Oldest (Ulta)'} | Exported: ${new Date().toLocaleString('en-IN')}`,
      sheetName: 'Auto Tyre Summary',
      filename: `Auto_Tyre_Daily_Summary_${sortOrder}_${fromDate}_to_${toDate}.xlsx`,
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
    const cur = editMap[date] || {};
    const updated = { ...cur, [field]: value };
    setEditMap(prev => ({ ...prev, [date]: updated }));

    const payload = {
      entry_date: date,
      parchi_kg: updated.parchi_kg || '0',
      mixing_actual_compound: updated.mixing_actual_compound || '0',
      wastage: updated.wastage || '0',
    };

    const res = await apiPost('/stock/daily-summary/', payload);
    if (res) { showToast(`✏️ ${date} saved`); fetchData(); }
    else showToast('❌ Save failed', 'error');
  };

  const g = (date, field) => editMap[date]?.[field] ?? '0';

  const stats = [
    { label: 'Curing PCS', value: totals.curing || 0, color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
    { label: 'Packing PCS', value: totals.packing || 0, color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
    { label: 'Theo KG', value: parseFloat(totals.theoretical_kg || 0).toFixed(1), color: '#0f766e', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: 'Parchi KG', value: parseFloat(totals.parchi_kg || 0).toFixed(1), color: '#b45309', bg: '#fffbeb', border: '#fef3c7' },
    { label: 'KG Diff', value: parseFloat(totals.difference || 0).toFixed(1), color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
    { label: 'Variance', value: parseFloat(totals.variance || 0).toFixed(1), color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' },
  ];

  return (
    <>
      <style>{`
        @page {
          size: A4 landscape;
          margin: 5mm 6mm 5mm 6mm;
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
            font-size: 7.5pt !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-header {
            display: block !important;
            margin-bottom: 6px !important;
            padding: 0 0 4px 0 !important;
            border-bottom: 1.5px solid #000000 !important;
          }
          .print-header h2 {
            font-size: 11pt !important;
            font-weight: 900 !important;
            color: #000000 !important;
            margin: 0 !important;
            text-transform: uppercase !important;
          }
          .print-header p {
            font-size: 7pt !important;
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
            padding: 4px 2px !important;
            font-size: 6.8pt !important;
            font-weight: 800 !important;
            background: #ffffff !important;
            color: #000000 !important;
            text-align: center !important;
            line-height: 1.1 !important;
          }
          th * {
            color: #000000 !important;
          }
          td {
            border: 1px solid #000000 !important;
            padding: 3px 2px !important;
            font-size: 6.8pt !important;
            background: #ffffff !important;
            color: #000000 !important;
            line-height: 1.1 !important;
          }
          td * {
            color: #000000 !important;
          }
          input {
            border: none !important;
            background: transparent !important;
            color: #000000 !important;
            font-size: 6.8pt !important;
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
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>🚜 Auto Tyre Daily Summary</h2>
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

      <div className="print-container" style={{ background: '#f1f5f9', minHeight: '100vh', paddingBottom: 32 }}>

        {/* Top bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }} className="no-print">
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>🚜 Auto Tyre Summary</h1>
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

        {/* Table — edge-to-edge */}
        <div style={{ padding: '0 12px 20px' }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div className="print-table-wrapper" style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Loading...</div>
              ) : rows.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>No data for this range.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      <TH align="left" rowSpan={2}>
                        <div
                          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Click to toggle Date Sort"
                        >
                          Date <span style={{ color: '#0284c7', fontSize: '0.8rem' }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>
                        </div>
                      </TH>
                      <TH color="#6d28d9" rowSpan={2}>Curing<br/>PCS</TH>
                      <TH color="#0369a1" rowSpan={2}>Packing<br/>PCS</TH>
                      {/* KG block */}
                      <TH color="#0f766e" colSpan={3} align="center">KG Tracking</TH>
                      {/* Compound block */}
                      <TH color="#b45309" colSpan={3} align="center">Compound (KG)</TH>
                      {/* Wastage */}
                      <TH color="#64748b" rowSpan={2}>Wastage ✏️</TH>
                    </tr>
                    <tr>
                      {/* KG sub */}
                      <TH color="#0f766e">Theo KG</TH>
                      <TH color="#b45309">Parchi KG ✏️</TH>
                      <TH color="#b91c1c">Difference</TH>
                      {/* Compound sub */}
                      <TH color="#475569">Theo<br/>Compound</TH>
                      <TH color="#b45309">Actual<br/>Compound ✏️</TH>
                      <TH color="#be185d">Variance</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((r, i) => {
                      const bg = i % 2 === 0 ? '#ffffff' : '#fafafa';
                      const diff = parseFloat(r.difference);
                      const vari = parseFloat(r.variance);
                      return (
                        <tr key={r.date} style={{ background: bg }}>
                          <td style={{ padding: '8px 10px', fontSize: '0.82rem', fontWeight: 700, color: '#334155', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                            {fmtDate(r.date)}
                          </td>
                          <Cell readOnly isInt value={r.curing} bold color="#6d28d9" />
                          <Cell readOnly isInt value={r.packing} bold color="#0369a1" />
                          {/* KG */}
                          <Cell readOnly value={r.theoretical_kg} color="#0f766e" />
                          <Cell value={g(r.date, 'parchi_kg')} onSave={v => saveField(r.date, 'parchi_kg', v)} highlight color="#92400e" />
                          <Cell readOnly value={r.difference} color={diffColor(diff)} bold={Math.abs(diff) > 0.1} />
                          {/* Compound */}
                          <Cell readOnly value={r.theoretical_compound} />
                          <Cell value={g(r.date, 'mixing_actual_compound')} onSave={v => saveField(r.date, 'mixing_actual_compound', v)} highlight color="#92400e" />
                          <Cell readOnly value={r.variance} color={diffColor(vari)} bold={Math.abs(vari) > 0.1} />
                          {/* Wastage */}
                          <Cell value={g(r.date, 'wastage')} onSave={v => saveField(r.date, 'wastage', v)} highlight />
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f1f5f9' }}>
                      <td style={{ padding: '10px', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', borderTop: '2px solid #cbd5e1' }}>TOTALS</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#6d28d9', borderTop: '2px solid #cbd5e1', fontSize: '0.88rem' }}>{parseInt(totals.curing || 0)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#0369a1', borderTop: '2px solid #cbd5e1', fontSize: '0.88rem' }}>{parseInt(totals.packing || 0)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#0f766e', borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.theoretical_kg || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#92400e', borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.parchi_kg || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: diffColor(totals.difference), borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.difference || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#334155', borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.theoretical_compound || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#92400e', borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.mixing_actual_compound || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: diffColor(totals.variance), borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.variance || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#475569', borderTop: '2px solid #cbd5e1', fontSize: '0.85rem' }}>{parseFloat(totals.wastage || 0).toFixed(2)}</td>
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

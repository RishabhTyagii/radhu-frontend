'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiFetch } from '@/lib/api';

export default function CycleTubeProductionSheet() {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7);

  const getPrevMonth = (mStr) => {
    const d = new Date(mStr + '-01');
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  };
  const prevMonth = getPrevMonth(currentMonth);

  const [filterType, setFilterType] = useState('month');
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState({ total_qty: 0, total_kgs: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [hasAutoSwitched, setHasAutoSwitched] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterType, date, month]);

  async function fetchData() {
    setLoading(true);
    const param = filterType === 'date' ? `date=${date}` : `month=${month}`;
    const res = await apiGet(`/cycletube/production-sheet/?${param}`);
    if (res && res.data && res.data.length > 0) {
      const rows = res.data.map((item) => {
        const total_qty = Object.values(item.dates_data || {}).reduce(
          (sum, d) => sum + (d.total || 0),
          0
        );
        const weight = parseFloat(item.weight || 0);
        const total_kgs = parseFloat((total_qty * weight).toFixed(2));
        return { ...item, total_qty, weight, total_kgs };
      });
      setData(rows);
      setTotals({
        total_qty: rows.reduce((s, r) => s + r.total_qty, 0),
        total_kgs: parseFloat(rows.reduce((s, r) => s + r.total_kgs, 0).toFixed(2)),
      });
    } else if (!hasAutoSwitched && filterType === 'month' && month === currentMonth) {
      // Auto fallback to previous month on initial load if current month has no data
      setHasAutoSwitched(true);
      setMonth(prevMonth);
      return;
    } else {
      setData([]);
      setTotals({ total_qty: 0, total_kgs: 0 });
    }
    setLoading(false);
  }

  const handleExport = async () => {
    setExporting(true);
    const exportMonth = filterType === 'date' ? date.slice(0, 7) : month;
    try {
      const res = await apiFetch(`/cycletube/export-production-sheet/?month=${exportMonth}`);
      if (!res || !res.ok) {
        alert('Export karne mein error aaya.');
        setExporting(false);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CYCLE_TUBE_PRODUCTION_${exportMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Export failed. Dobara try karein.');
    } finally {
      setExporting(false);
    }
  };

  const changeDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const changeMonth = (months) => {
    const d = new Date(month + '-01');
    d.setMonth(d.getMonth() + months);
    setMonth(d.toISOString().slice(0, 7));
  };

  return (
    <>
      <Navbar />
      <div className="container">
        {/* ── Header ── */}
        <div className="page-header print-hidden">
          <div>
            <h1>📝 Cycle Tube Production Sheet</h1>
            <p style={{ color: 'var(--text-muted)' }}>Item-wise production output</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filter type toggle */}
            <select
              className="form-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="month">By Month</option>
              <option value="date">By Date</option>
            </select>

            {/* Date / Month with prev-next nav */}
            {filterType === 'date' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button className="btn btn-secondary" onClick={() => changeDate(-1)}>
                  <i className="fas fa-chevron-left" />
                </button>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <button className="btn btn-secondary" onClick={() => changeDate(1)}>
                  <i className="fas fa-chevron-right" />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button className="btn btn-secondary" onClick={() => changeMonth(-1)}>
                  <i className="fas fa-chevron-left" />
                </button>
                <input
                  type="month"
                  className="form-input"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
                <button className="btn btn-secondary" onClick={() => changeMonth(1)}>
                  <i className="fas fa-chevron-right" />
                </button>
              </div>
            )}

            {/* Export button */}
            <button
              className="btn btn-success"
              onClick={handleExport}
              disabled={exporting}
            >
              <i className="fas fa-file-excel" />{' '}
              {exporting ? 'Exporting...' : `📊 Export ${filterType === 'date' ? date.slice(0, 7) : month} (Excel)`}
            </button>

            <button
              onClick={() => window.print()}
              className="btn"
              style={{ background: '#475569', color: 'white' }}
            >
              🖨 Print
            </button>
          </div>
        </div>

        {/* ── Smart notice if period has no entries ── */}
        {data.length === 0 && !loading && (
          <div style={{
            margin: '16px 0',
            padding: '16px 20px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fas fa-info-circle" style={{ color: '#2563eb', fontSize: '1.3rem' }} />
              <div>
                <strong style={{ color: '#1e40af', fontSize: '0.95rem' }}>
                  {filterType === 'date' ? `Tareekh ${date}` : `Mahina ${month}`} mein abhi tak koi production entry nahi mili.
                </strong>
                <div style={{ color: '#3b82f6', fontSize: '0.85rem', marginTop: '2px' }}>
                  Factory ka pichhla production data <strong>October 2026 (2026-10)</strong> mein darj hai.
                </div>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                setFilterType('month');
                setMonth('2026-10');
              }}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: 600,
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              👉 October 2026 Dekhein
            </button>
          </div>
        )}

        {/* ── Table ── */}
        {loading ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            Loading sheet...
          </div>
        ) : (
          <div className="card" id="print-area">
            <h2
              className="print-only"
              style={{ textAlign: 'center', marginBottom: '20px' }}
            >
              Cycle Tube Production Sheet (
              {filterType === 'date' ? date : month})
            </h2>

            <div className="table-container">
              <table>
                <thead>
                  <tr style={{ background: '#1e293b', color: 'white' }}>
                    <th>S.No</th>
                    <th>Code</th>
                    <th>Tube Name</th>
                    <th>Size</th>
                    <th>Type</th>
                    <th>Brand</th>
                    <th style={{ textAlign: 'right', background: '#2563eb' }}>
                      ALL CURING / Total Production
                    </th>
                    <th style={{ textAlign: 'right' }}>Weight (Kg/pc)</th>
                    <th style={{ textAlign: 'right', background: '#059669' }}>
                      Total Kgs
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>
                        {item.sku ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe'
                          }}>
                            {item.sku}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{item.tube_name}</td>
                      <td>{item.size}</td>
                      <td>{item.type}</td>
                      <td>{item.brand}</td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 'bold',
                          color: '#1d4ed8',
                          background: '#eff6ff',
                        }}
                      >
                        {item.total_qty || '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: '#64748b' }}>
                        {item.weight > 0 ? item.weight : '-'}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 'bold',
                          color: '#065f46',
                          background: '#ecfdf5',
                        }}
                      >
                        {item.total_kgs > 0 ? item.total_kgs : '-'}
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td
                        colSpan="9"
                        style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}
                      >
                        No production data found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
                {data.length > 0 && (
                  <tfoot>
                    <tr
                      style={{
                        background: '#1e293b',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      <td colSpan="6" style={{ textAlign: 'right' }}>
                        GRAND TOTAL
                      </td>
                      <td style={{ textAlign: 'right', background: '#1d4ed8' }}>
                        {totals.total_qty}
                      </td>
                      <td />
                      <td style={{ textAlign: 'right', background: '#059669' }}>
                        {totals.total_kgs} Kg
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

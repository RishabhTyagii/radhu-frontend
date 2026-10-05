'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';
import * as XLSX from 'xlsx';

export default function CycleTubeProductionSheet() {
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState({});
  const [sheetData, setSheetData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState('');
  const [month, setMonth] = useState('');
  const [filterType, setFilterType] = useState('month');

  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    setMonth(`${y}-${m}`);
    setDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if ((filterType === 'month' && month) || (filterType === 'date' && date)) {
      fetchData();
    }
  }, [filterType, date, month]);

  async function fetchData() {
    setLoading(true);
    // Fetch both: regular sheet (for table display) + new sheet endpoint (for export)
    let url = '/cycletube/production-sheet/';
    let legacyUrl = '/cycletube/production-sheet/';
    if (filterType === 'date') {
      url += `?date=${date}`;
      legacyUrl = `/cycletube/monthly-report/?date=${date}`;
    } else {
      url += `?month=${month}`;
      legacyUrl = `/cycletube/monthly-report/?month=${month}`;
    }

    const [res, legacyRes] = await Promise.all([
      apiGet(url),
      apiGet(filterType === 'date' ? `/cycletube/production-sheet/?date=${date}` : `/cycletube/production-sheet/?month=${month}`)
    ]);

    if (res && res.data) {
      setSheetData(res);
    }

    // Also fetch normal display data
    const displayRes = await apiGet(filterType === 'date' ? `/cycletube/entries/?date=${date}&type=production` : `/cycletube/entries/?month=${month}&type=production`);

    // Use sheetData for both table and export
    if (res && res.data) {
      // Build display-friendly data from sheetData
      const displayData = res.data.map(item => {
        let normal = 0, molded = 0, second = 0, total = 0;
        Object.values(item.dates_data || {}).forEach(d => {
          normal += d.normal || 0;
          molded += d.molded || 0;
          second += d.second || 0;
          total += d.total || 0;
        });
        return { ...item, normal_qty: normal, molded_qty: molded, second_qty: second, total_qty: total };
      });
      setData(displayData);
      const tot = displayData.reduce((acc, item) => ({
        normal_qty: (acc.normal_qty || 0) + item.normal_qty,
        molded_qty: (acc.molded_qty || 0) + item.molded_qty,
        second_qty: (acc.second_qty || 0) + item.second_qty,
        total_qty: (acc.total_qty || 0) + item.total_qty,
      }), {});
      setTotals(tot);
    }
    setLoading(false);
  }

  const handleExportExcel = () => {
    if (!sheetData || !sheetData.data || sheetData.data.length === 0) {
      alert('Pehle data load karo, phir export karo.');
      return;
    }

    const itemsList = sheetData.data;

    let uniqueDates = new Set();
    itemsList.forEach(item => {
      Object.keys(item.dates_data || {}).forEach(d => uniqueDates.add(d));
    });
    let sortedDates = Array.from(uniqueDates).sort();
    if (sortedDates.length === 0) sortedDates = [filterType === 'date' ? date : `${month}-01`];

    const rows = [];

    // Header row 1 - dates
    const header1 = ['ITEM NAME', 'SIZE', 'TYPE', 'BRAND'];
    sortedDates.forEach(d => { header1.push(d, '', '', ''); });
    header1.push('TOTAL NORMAL', 'TOTAL MOLDED', 'TOTAL SECOND', 'GRAND TOTAL');
    rows.push(header1);

    // Header row 2 - sub columns
    const header2 = ['', '', '', ''];
    sortedDates.forEach(() => { header2.push('Normal', 'Molded', 'Second', 'Total'); });
    header2.push('', '', '', '');
    rows.push(header2);

    // Data rows
    let totNormal = 0, totMolded = 0, totSecond = 0, totTotal = 0;
    itemsList.forEach(item => {
      const row = [item.tube_name || '', item.size || '', item.type || '', item.brand || ''];
      let tn = 0, tm = 0, ts = 0, tt = 0;
      sortedDates.forEach(d => {
        if (item.dates_data && item.dates_data[d]) {
          const day = item.dates_data[d];
          row.push(day.normal || 0, day.molded || 0, day.second || 0, day.total || 0);
          tn += day.normal || 0;
          tm += day.molded || 0;
          ts += day.second || 0;
          tt += day.total || 0;
        } else {
          row.push(0, 0, 0, 0);
        }
      });
      row.push(tn, tm, ts, tt);
      totNormal += tn; totMolded += tm; totSecond += ts; totTotal += tt;
      rows.push(row);
    });

    // Total row
    const totRow = ['GRAND TOTAL', '', '', ''];
    sortedDates.forEach(() => { totRow.push('', '', '', ''); });
    totRow.push(totNormal, totMolded, totSecond, totTotal);
    rows.push(totRow);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Production');
    XLSX.writeFile(workbook, `Cycle_Tube_Production_${filterType === 'date' ? date : month}.xlsx`);
  };

  const handlePrint = () => { window.print(); };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header print-hidden">
          <div>
            <h1>📝 Cycle Tube Production Sheet</h1>
            <p style={{ color: 'var(--text-muted)' }}>Detailed item-wise production output</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="month">By Month</option>
              <option value="date">By Date</option>
            </select>

            {filterType === 'date' ? (
              <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
            ) : (
              <input type="month" className="form-input" value={month} onChange={(e) => setMonth(e.target.value)} />
            )}

            {/* DATE-WISE EXPORT BUTTON */}
            <button
              onClick={handleExportExcel}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16,185,129,0.4)',
              }}
            >
              📅 Date-wise Export
            </button>

            <button onClick={handlePrint} className="btn" style={{ background: '#475569', color: 'white' }}>
              🖨 Print
            </button>
          </div>
        </div>

        {loading ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>Loading sheet...</div>
        ) : (
          <div className="card" id="print-area">
            <h2 className="print-only" style={{ textAlign: 'center', marginBottom: '20px' }}>
              Cycle Tube Production Sheet ({filterType === 'date' ? date : month})
            </h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr style={{ background: '#1e293b', color: 'white' }}>
                    <th>S.No</th>
                    <th>Tube Name</th>
                    <th>Size</th>
                    <th>Type</th>
                    <th>Brand</th>
                    <th style={{ textAlign: 'right' }}>Normal Qty</th>
                    <th style={{ textAlign: 'right' }}>Molded Qty</th>
                    <th style={{ textAlign: 'right' }}>Second Qty</th>
                    <th style={{ textAlign: 'right', background: '#3b82f6' }}>Total Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 'bold' }}>{item.tube_name}</td>
                      <td>{item.size}</td>
                      <td>{item.type}</td>
                      <td>{item.brand}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 'bold' }}>{item.normal_qty || '-'}</td>
                      <td style={{ textAlign: 'right', color: '#d97706' }}>{item.molded_qty || '-'}</td>
                      <td style={{ textAlign: 'right', color: '#dc2626' }}>{item.second_qty || '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', background: '#eff6ff' }}>{item.total_qty || '-'}</td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>
                        No production data found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
                {data.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                      <td colSpan="5" style={{ textAlign: 'right' }}>GRAND TOTAL</td>
                      <td style={{ textAlign: 'right', color: '#16a34a' }}>{totals.normal_qty}</td>
                      <td style={{ textAlign: 'right', color: '#d97706' }}>{totals.molded_qty}</td>
                      <td style={{ textAlign: 'right', color: '#dc2626' }}>{totals.second_qty}</td>
                      <td style={{ textAlign: 'right', background: '#dbeafe', color: '#1e40af' }}>{totals.total_qty}</td>
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

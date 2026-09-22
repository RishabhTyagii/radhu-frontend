'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function CycleTubeProductionSheet() {
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState('');
  const [month, setMonth] = useState('');
  const [filterType, setFilterType] = useState('month'); // 'date' or 'month'

  useEffect(() => {
    // Set default month to current month YYYY-MM
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
    let url = '/cycletube/production-sheet/';
    if (filterType === 'date') url += `?date=${date}`;
    else url += `?month=${month}`;

    const res = await apiGet(url);
    if (res && res.data) {
      setData(res.data);
      setTotals(res.totals);
    }
    setLoading(false);
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header print-hidden">
          <div>
            <h1>📝 Cycle Tube Production Sheet</h1>
            <p style={{ color: 'var(--text-muted)' }}>Detailed item-wise production output</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              className="form-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="month">By Month</option>
              <option value="date">By Date</option>
            </select>

            {filterType === 'date' ? (
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            ) : (
              <input
                type="month"
                className="form-input"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            )}
            
            <button onClick={handlePrint} className="btn" style={{ background: '#475569', color: 'white' }}>
              <i className="fas fa-print"></i> Print
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
                      <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 'bold' }}>
                        {item.normal_qty || '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: '#d97706' }}>
                        {item.molded_qty || '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: '#dc2626' }}>
                        {item.second_qty || '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', background: '#eff6ff' }}>
                        {item.total_qty || '-'}
                      </td>
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

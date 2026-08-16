'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function ProductionSheet() {
  const [viewMode, setViewMode] = useState('date'); // 'date' or 'month'
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7);
  
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(currentMonth);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [viewMode, date, month, page]);

  async function fetchData() {
    setLoading(true);
    let url = `/stock/production-sheet/?page=${page}`;
    if (viewMode === 'date') {
      url += `&date=${date}`;
    } else {
      url += `&month=${month}`;
    }
    const result = await apiGet(url);
    if (result) setData(result);
    setLoading(false);
  }

  const handleExport = () => {
    const url = `http://localhost:8000/api/stock/production-sheet/export/?${viewMode === 'date' ? `date=${date}` : `month=${month}`}`;
    window.open(url, '_blank');
  };

  const changeDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
    setPage(1);
  };

  const changeMonth = (months) => {
    const d = new Date(month + '-01');
    d.setMonth(d.getMonth() + months);
    setMonth(d.toISOString().slice(0, 7));
  };

  const items = data?.data || data?.results || [];

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Production Sheet</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select className="form-select" value={viewMode} onChange={(e) => { setViewMode(e.target.value); setPage(1); }} style={{ width: 'auto' }}>
              <option value="date">Daily View</option>
              <option value="month">Monthly View</option>
            </select>
            
            {viewMode === 'date' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => changeDate(-1)}><i className="fas fa-chevron-left"></i></button>
                <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
                <button className="btn btn-secondary" onClick={() => changeDate(1)}><i className="fas fa-chevron-right"></i></button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => changeMonth(-1)}><i className="fas fa-chevron-left"></i></button>
                <input type="month" className="form-input" value={month} onChange={(e) => setMonth(e.target.value)} />
                <button className="btn btn-secondary" onClick={() => changeMonth(1)}><i className="fas fa-chevron-right"></i></button>
              </div>
            )}
            
            <button className="btn btn-success" onClick={handleExport}>
              <i className="fas fa-file-excel"></i> Export
            </button>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>Loading production sheet...</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {viewMode === 'date' && <th>Date</th>}
                    <th>Tyre Item</th>
                    <th>All Curing</th>
                    <th>Production</th>
                    <th>Repair</th>
                    <th>2nd Grade</th>
                    <th>3rd Grade</th>
                    <th>Lose Tyre</th>
                    {viewMode === 'date' && <th>RFM Adj</th>}
                    <th>Packing</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      {viewMode === 'date' && <td>{date}</td>}
                      <td style={{ fontWeight: 600 }}>{item.tyre_name}</td>
                      <td>{item.all_curing}</td>
                      <td>{item.production_tyre}</td>
                      <td>{item.repair}</td>
                      <td>{item.second_grade}</td>
                      <td>{item.third_grade}</td>
                      <td>{item.lose_tyre}</td>
                      {viewMode === 'date' && <td>{item.rfm_adjustment || 0}</td>}
                      <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{item.packing}</td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr>
                      <td colSpan={viewMode === 'date' ? 10 : 9} style={{ textAlign: 'center', color: '#64748b' }}>No production entries found</td>
                    </tr>
                  )}
                </tbody>
                {data?.totals && (
                  <tfoot>
                    <tr style={{ background: 'var(--bg)', fontWeight: 'bold' }}>
                      <td colSpan={viewMode === 'date' ? 2 : 1}>TOTALS</td>
                      <td>{data.totals.all_curing}</td>
                      <td>{data.totals.production_tyre}</td>
                      <td>{data.totals.repair}</td>
                      <td>{data.totals.second_grade}</td>
                      <td>{data.totals.third_grade}</td>
                      <td>{data.totals.lose_tyre}</td>
                      {viewMode === 'date' && <td>{data.totals.rfm_adjustment}</td>}
                      <td style={{ color: 'var(--primary)' }}>{data.totals.packing}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

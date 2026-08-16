'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await apiGet(`/stock/dashboard/?q=${encodeURIComponent(debouncedSearch)}`);
      if (result) setData(result);
      setLoading(false);
    }
    fetchData();
  }, [debouncedSearch]);

  const items = data?.items || [];
  const totals = data?.totals || {};

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Stock Dashboard</h1>
          <div style={{ position: 'relative', width: '300px' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}></i>
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '36px' }}
              placeholder="Search tyre..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <span className="stat-label">Today Production</span>
            <span className="stat-number">{data?.today_production ?? '-'}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Today Dispatch</span>
            <span className="stat-number">{data?.today_dispatch ?? '-'}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Month Production</span>
            <span className="stat-number">{data?.month_production ?? '-'}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Month Dispatch</span>
            <span className="stat-number">{data?.month_dispatch ?? '-'}</span>
          </div>
        </div>

        <div className="card">
          <div className="table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading stock data...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>TYRE</th>
                    <th>PATTERN</th>
                    <th>TYPE</th>
                    <th>Monthly Curing</th>
                    <th>Repair</th>
                    <th>RFM OK</th>
                    <th>2025 Old</th>
                    <th>STOCK</th>
                    <th>On Hold/Export</th>
                    <th>TOTAL STOCK</th>
                    <th>Monthly Despatch</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.tyre}</td>
                      <td>{item.pattern}</td>
                      <td>{item.type}</td>
                      <td>{item.month_curing}</td>
                      <td>{item.repair_tyre_stock}</td>
                      <td>{item.rfm_ok_tyre}</td>
                      <td>{item.old_tyres_2025}</td>
                      <td style={{ fontWeight: 'bold' }}>{item.stock}</td>
                      <td>{item.on_hold_export}</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{item.total_stock}</td>
                      <td>{item.month_despatch}</td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                        {loading ? 'Loading...' : 'No tyres found. Add tyres first using the "Add Tyre" page.'}
                      </td>
                    </tr>
                  )}
                </tbody>
                {items.length > 0 && (
                  <tfoot>
                    <tr style={{ background: 'var(--bg)', fontWeight: 'bold' }}>
                      <td colSpan="3">TOTALS</td>
                      <td>{totals.curing}</td>
                      <td>{totals.repair}</td>
                      <td>{totals.rfm}</td>
                      <td>{totals.old}</td>
                      <td>{totals.stock}</td>
                      <td>{totals.hold}</td>
                      <td style={{ color: 'var(--primary)' }}>{totals.grand_total}</td>
                      <td>{totals.despatch}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

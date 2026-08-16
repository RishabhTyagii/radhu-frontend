'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function CycleTubeMonthlyReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthStr, setMonthStr] = useState('');

  useEffect(() => {
    fetchReport();
  }, [monthStr]);

  async function fetchReport() {
    setLoading(true);
    let query = '';
    if (monthStr) {
      const [year, month] = monthStr.split('-');
      query = `?year=${year}&month=${month}`;
    }
    const res = await apiGet(`/cycletube/monthly-report/${query}`);
    if (res) setData(res);
    setLoading(false);
  }

  const items = data?.items || [];
  const totals = data?.totals || {};

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>🚲 Cycle Tube Monthly Report</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {data ? `Report for ${data.month}/${data.year}` : 'Current Month'}
            </p>
          </div>
          <div>
            <input
              type="month"
              className="form-input"
              value={monthStr}
              onChange={(e) => setMonthStr(e.target.value)}
            />
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <span className="stat-label">Total Production</span>
            <span className="stat-number" style={{ color: '#10b981' }}>{totals.total_monthly_production ?? 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Sale</span>
            <span className="stat-number" style={{ color: '#ef4444' }}>{totals.total_monthly_sale ?? 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Main Stock</span>
            <span className="stat-number" style={{ color: '#2563eb' }}>{totals.total_stock ?? 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total RFM Stock</span>
            <span className="stat-number" style={{ color: '#8b5cf6' }}>{totals.total_rfm_stock ?? 0}</span>
          </div>
        </div>

        <div className="card">
          <div className="table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading monthly report...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>SIZE</th>
                    <th>TYPE</th>
                    <th>BRAND</th>
                    <th style={{ textAlign: 'right' }}>MONTHLY PRODUCTION</th>
                    <th style={{ textAlign: 'right' }}>MONTHLY SALE</th>
                    <th style={{ textAlign: 'right' }}>STOCK</th>
                    <th style={{ textAlign: 'right' }}>RFM STOCK</th>
                    <th style={{ textAlign: 'right' }}>TOTAL STOCK</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 600 }}>{row.size}</td>
                      <td><span className="badge green">{row.type}</span></td>
                      <td>{row.brand}</td>
                      <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{row.monthly_production}</td>
                      <td style={{ textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>{row.monthly_sale}</td>
                      <td style={{ textAlign: 'right' }}>{row.stock}</td>
                      <td style={{ textAlign: 'right' }}>{row.rfm_stock}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{row.total_stock}</td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                        No items found for this month.
                      </td>
                    </tr>
                  )}
                </tbody>
                {items.length > 0 && (
                  <tfoot>
                    <tr style={{ background: 'var(--bg)', fontWeight: 'bold' }}>
                      <td colSpan="3">TOTALS</td>
                      <td style={{ textAlign: 'right', color: '#10b981' }}>{totals.total_monthly_production || 0}</td>
                      <td style={{ textAlign: 'right', color: '#ef4444' }}>{totals.total_monthly_sale || 0}</td>
                      <td style={{ textAlign: 'right', color: '#2563eb' }}>{totals.total_stock || 0}</td>
                      <td style={{ textAlign: 'right', color: '#8b5cf6' }}>{totals.total_rfm_stock || 0}</td>
                      <td style={{ textAlign: 'right', color: 'var(--primary)' }}>{(totals.total_stock || 0) + (totals.total_rfm_stock || 0)}</td>
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

'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function CycleTubeDashboard() {
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
      const result = await apiGet('/cycletube/dashboard/');
      if (result) setData(result);
      setLoading(false);
    }
    fetchData();
  }, []);

  const rawItems = data?.items || [];
  const items = rawItems.filter((item) => {
    if (!debouncedSearch) return true;
    const term = debouncedSearch.toLowerCase();
    return (
      (item.size && item.size.toLowerCase().includes(term)) ||
      (item.type && item.type.toLowerCase().includes(term)) ||
      (item.brand && item.brand.toLowerCase().includes(term))
    );
  });

  const stats = data?.stats || {};
  const totals = data?.totals || {};

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>🚲 Cycle Tube Stock Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Size, Type, Brand wise cycle tube stock management</p>
          </div>
          <div style={{ position: 'relative', width: '300px' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}></i>
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '36px' }}
              placeholder="Search Size / Type / Brand..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <span className="stat-label">Today Production</span>
            <span className="stat-number" style={{ color: '#10b981' }}>{stats.today_production ?? 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Today Sale</span>
            <span className="stat-number" style={{ color: '#ef4444' }}>{stats.today_sale ?? 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Month Production</span>
            <span className="stat-number" style={{ color: '#2563eb' }}>{stats.month_production ?? 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Month Sale</span>
            <span className="stat-number" style={{ color: '#8b5cf6' }}>{stats.month_sale ?? 0}</span>
          </div>
        </div>

        <div className="card">
          <div className="table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading cycle tube stock data...</div>
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
                    <th style={{ textAlign: 'right' }}>R.F.M. STOCK</th>
                    <th style={{ textAlign: 'right' }}>TOTAL STOCK</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.size}</td>
                      <td>
                        <span className="badge green">{item.type}</span>
                      </td>
                      <td>{item.brand}</td>
                      <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{item.month_production}</td>
                      <td style={{ textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>{item.month_sale}</td>
                      <td style={{ textAlign: 'right', color: '#2563eb', fontWeight: 600 }}>{item.stock}</td>
                      <td style={{ textAlign: 'right', color: '#8b5cf6', fontWeight: 600 }}>{item.rfm_stock}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>{item.total_stock}</td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                        No cycle tube items found. Add items using the "+ Add Tube" page.
                      </td>
                    </tr>
                  )}
                </tbody>
                {items.length > 0 && (
                  <tfoot>
                    <tr style={{ background: 'var(--bg)', fontWeight: 'bold' }}>
                      <td colSpan="3">TOTALS</td>
                      <td style={{ textAlign: 'right', color: '#10b981' }}>{totals.total_month_production || 0}</td>
                      <td style={{ textAlign: 'right', color: '#ef4444' }}>{totals.total_month_sale || 0}</td>
                      <td style={{ textAlign: 'right', color: '#2563eb' }}>{totals.total_stock || 0}</td>
                      <td style={{ textAlign: 'right', color: '#8b5cf6' }}>{totals.total_rfm_stock || 0}</td>
                      <td style={{ textAlign: 'right', color: 'var(--primary)' }}>{totals.total_combined_stock || 0}</td>
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

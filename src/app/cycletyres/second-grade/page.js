'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function CycleTyresSecondGradeStock() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSecondGrade();
  }, []);

  async function fetchSecondGrade() {
    setLoading(true);
    const res = await apiGet('/cycletyres/second-grade/');
    if (res) setData(res);
    setLoading(false);
  }

  const rawItems = data?.items || [];
  const items = rawItems.filter((item) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (item.size && item.size.toLowerCase().includes(term)) ||
      (item.box_type && item.box_type.toLowerCase().includes(term)) ||
      (item.material && item.material.toLowerCase().includes(term)) ||
      (item.brand && item.brand.toLowerCase().includes(term))
    );
  });

  const recentProd = data?.second_grade_entries || [];
  const recentSales = data?.second_grade_sales || [];

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>🏷️ Cycle Tyre 2nd Grade (B-Grade) Management</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              View 2nd grade stock & separate B-Grade sales records
            </p>
          </div>
          <div style={{ position: 'relative', width: '300px' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}></i>
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '36px' }}
              placeholder="Search Tyre..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid-2" style={{ marginBottom: '24px' }}>
          <div className="stat-card" style={{ borderLeft: '6px solid #f59e0b' }}>
            <span className="stat-label">Total 2nd Grade Stock (Current)</span>
            <span className="stat-number" style={{ color: '#f59e0b' }}>
              {data?.total_second_stock?.toLocaleString('en-IN') || 0} <span style={{ fontSize: '1rem', fontWeight: 500 }}>pcs</span>
            </span>
          </div>

          <div className="stat-card" style={{ borderLeft: '6px solid #ef4444' }}>
            <span className="stat-label">Total B-Grade Sales (Sold)</span>
            <span className="stat-number" style={{ color: '#ef4444' }}>
              {data?.total_second_sales?.toLocaleString('en-IN') || 0} <span style={{ fontSize: '1rem', fontWeight: 500 }}>pcs</span>
            </span>
          </div>
        </div>

        {/* 2nd Grade Stock Per Item */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2>🏷️ 2nd Grade Stock Per Item</h2>
          <div className="table-container" style={{ marginTop: '16px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>Loading stock...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>SIZE</th>
                    <th>BOX TYPE</th>
                    <th>MATERIAL</th>
                    <th>BRAND</th>
                    <th style={{ textAlign: 'right' }}>2ND GRADE STOCK</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.size}</td>
                      <td><span className="badge yellow">{item.box_type}</span></td>
                      <td>{item.material}</td>
                      <td>{item.brand}</td>
                      <td style={{ textAlign: 'right', color: '#f59e0b', fontWeight: 'bold', fontSize: '1rem' }}>{item.second_stock}</td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>No items found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Two Columns: Recent 2nd Grade Sales & Production Logs */}
        <div className="grid-2">
          {/* B-Grade Sales Logs */}
          <div className="card">
            <h2>🛒 B-Grade Sales Logs</h2>
            <div className="table-container" style={{ marginTop: '16px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Tyre</th>
                    <th>Qty Sold</th>
                    <th>Bill No</th>
                    <th>Remark / Party</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((e) => (
                    <tr key={e.id}>
                      <td>{e.date}</td>
                      <td>{e.tyre_item_detail ? `${e.tyre_item_detail.size} ${e.tyre_item_detail.box_type}` : '-'}</td>
                      <td style={{ color: '#ef4444', fontWeight: 'bold' }}>-{e.quantity}</td>
                      <td><span className="badge red">{e.bill_number || '-'}</span></td>
                      <td>{e.remark || '-'}</td>
                    </tr>
                  ))}
                  {!recentSales.length && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                        No B-Grade sales recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2nd Grade Production Logs */}
          <div className="card">
            <h2>🏭 2nd Grade Production Logs</h2>
            <div className="table-container" style={{ marginTop: '16px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Tyre</th>
                    <th>All Curing</th>
                    <th>2nd Grade Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProd.map((e) => (
                    <tr key={e.id}>
                      <td>{e.date}</td>
                      <td>{e.tyre_item_detail ? `${e.tyre_item_detail.size} ${e.tyre_item_detail.box_type}` : '-'}</td>
                      <td>{e.all_curing}</td>
                      <td style={{ color: '#f59e0b', fontWeight: 'bold' }}>+{e.second_grade}</td>
                    </tr>
                  ))}
                  {!recentProd.length && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                        No 2nd grade production logs.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function AdminAllOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  async function fetchOrders() {
    setLoading(true);
    let query = '?all=true&';
    if (statusFilter) query += `status=${statusFilter}&`;

    const res = await apiGet(`/orders/${query}`);
    if (res) setOrders(res);
    setLoading(false);
  }

  // Compute overall Category Summary
  const categoryStats = {
    auto_tyre: { count: 0, totalPcs: 0, pendingPcs: 0, completedPcs: 0 },
    cycle_tube: { count: 0, totalPcs: 0, pendingPcs: 0, completedPcs: 0 },
    cycle_tyre: { count: 0, totalPcs: 0, pendingPcs: 0, completedPcs: 0 },
  };

  // Compute Employee-wise Sales Summary
  const employeeSalesMap = {};

  orders.forEach((ord) => {
    const user = ord.user_name || 'Unknown';
    if (!employeeSalesMap[user]) {
      employeeSalesMap[user] = {
        username: user,
        orderCount: 0,
        pendingCount: 0,
        completedCount: 0,
        totalPcs: 0,
        autoTyrePcs: 0,
        cycleTubePcs: 0,
        cycleTyrePcs: 0,
      };
    }
    const emp = employeeSalesMap[user];
    emp.orderCount += 1;
    if (ord.status === 'pending' || ord.status === 'approved') emp.pendingCount += 1;
    if (ord.status === 'completed' || ord.status === 'dispatched') emp.completedCount += 1;

    (ord.items || []).forEach((it) => {
      const cat = it.category;
      const qty = parseInt(it.quantity, 10) || 0;

      if (categoryStats[cat]) {
        categoryStats[cat].count += 1;
        categoryStats[cat].totalPcs += qty;
        if (ord.status === 'pending' || ord.status === 'approved') {
          categoryStats[cat].pendingPcs += qty;
        } else if (ord.status === 'completed' || ord.status === 'dispatched') {
          categoryStats[cat].completedPcs += qty;
        }
      }

      emp.totalPcs += qty;
      if (cat === 'auto_tyre') emp.autoTyrePcs += qty;
      if (cat === 'cycle_tube') emp.cycleTubePcs += qty;
      if (cat === 'cycle_tyre') emp.cycleTyrePcs += qty;
    });
  });

  const employeeSalesList = Object.values(employeeSalesMap);

  // Filter Orders Table
  const filteredOrders = orders.filter((ord) => {
    if (search) {
      const term = search.toLowerCase();
      const matchParty = ord.party_name && ord.party_name.toLowerCase().includes(term);
      const matchUser = ord.user_name && ord.user_name.toLowerCase().includes(term);
      const matchId = String(ord.id).includes(term);
      if (!matchParty && !matchUser && !matchId) return false;
    }

    if (userFilter !== 'all' && ord.user_name !== userFilter) {
      return false;
    }

    if (categoryFilter !== 'all') {
      const hasCatItem = (ord.items || []).some((it) => it.category === categoryFilter);
      if (!hasCatItem) return false;
    }

    return true;
  });

  return (
    <>
      <Navbar />
      <div className="container">
        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              📋 Admin Orders & Sales Control Panel
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
              Overall order summaries by product category (Auto Tyre, Cycle Tube, Cycle Tyre) & Employee-wise sales performance
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/orders/create" className="btn btn-primary" style={{ background: '#2563eb' }}>
              <i className="fas fa-cart-plus mr-1"></i> + Book New Order
            </Link>
            <Link href="/orders" className="btn" style={{ background: '#f1f5f9', color: '#475569' }}>
              My Orders
            </Link>
          </div>
        </div>

        {/* 1. Category KPI Stat Cards */}
        <div className="grid-3" style={{ marginBottom: '24px', gap: '16px' }}>
          {/* Auto Tyre Summary Card */}
          <div className="card" style={{ borderLeft: '4px solid #2563eb', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem', background: '#dbeafe', padding: '8px', borderRadius: '8px' }}>🚗</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Auto Tyre Orders</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Stock & Production Sales</span>
                </div>
              </div>
              <span className="badge blue" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                {categoryStats.auto_tyre.totalPcs} Pcs Total
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <span><strong style={{ color: '#d97706' }}>{categoryStats.auto_tyre.pendingPcs} Pcs</strong> Pending</span>
              <span><strong style={{ color: '#16a34a' }}>{categoryStats.auto_tyre.completedPcs} Pcs</strong> Delivered</span>
            </div>
          </div>

          {/* Cycle Tube Summary Card */}
          <div className="card" style={{ borderLeft: '4px solid #10b981', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem', background: '#d1fae5', padding: '8px', borderRadius: '8px' }}>🚲</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Cycle Tube Orders</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Graded Tube Inventory</span>
                </div>
              </div>
              <span className="badge green" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                {categoryStats.cycle_tube.totalPcs} Pcs Total
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <span><strong style={{ color: '#d97706' }}>{categoryStats.cycle_tube.pendingPcs} Pcs</strong> Pending</span>
              <span><strong style={{ color: '#16a34a' }}>{categoryStats.cycle_tube.completedPcs} Pcs</strong> Delivered</span>
            </div>
          </div>

          {/* Cycle Tyre Summary Card */}
          <div className="card" style={{ borderLeft: '4px solid #f59e0b', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem', background: '#fef3c7', padding: '8px', borderRadius: '8px' }}>🚴</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Cycle Tyre Orders</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Box/Bucket Curing Tyres</span>
                </div>
              </div>
              <span className="badge yellow" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                {categoryStats.cycle_tyre.totalPcs} Pcs Total
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <span><strong style={{ color: '#d97706' }}>{categoryStats.cycle_tyre.pendingPcs} Pcs</strong> Pending</span>
              <span><strong style={{ color: '#16a34a' }}>{categoryStats.cycle_tyre.completedPcs} Pcs</strong> Delivered</span>
            </div>
          </div>
        </div>

        {/* 2. Employee-wise Sales Summary Card */}
        <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#1e293b', margin: 0 }}>
              <i className="fas fa-users text-blue-600 mr-2"></i> Employee-wise Sales & Orders Summary
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {employeeSalesList.length} Active Sales Representatives
            </span>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th>EMPLOYEE / SALES REP</th>
                  <th style={{ textAlign: 'center' }}>TOTAL ORDERS</th>
                  <th style={{ textAlign: 'center' }}>PENDING ORDERS</th>
                  <th style={{ textAlign: 'center' }}>COMPLETED ORDERS</th>
                  <th style={{ textAlign: 'center' }}>🚗 AUTO TYRE (PCS)</th>
                  <th style={{ textAlign: 'center' }}>🚲 CYCLE TUBE (PCS)</th>
                  <th style={{ textAlign: 'center' }}>🚴 CYCLE TYRE (PCS)</th>
                  <th style={{ textAlign: 'right' }}>TOTAL ORDERED QTY</th>
                  <th style={{ textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {employeeSalesList.map((emp) => (
                  <tr key={emp.username} style={{ background: userFilter === emp.username ? '#eff6ff' : 'transparent' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', background: '#2563eb', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem'
                        }}>
                          {emp.username.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{emp.username}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{emp.orderCount}</td>
                    <td style={{ textAlign: 'center', color: '#d97706', fontWeight: 600 }}>{emp.pendingCount}</td>
                    <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{emp.completedCount}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#2563eb' }}>{emp.autoTyrePcs} Pcs</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#10b981' }}>{emp.cycleTubePcs} Pcs</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#f59e0b' }}>{emp.cycleTyrePcs} Pcs</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}>{emp.totalPcs} Pcs</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => setUserFilter(userFilter === emp.username ? 'all' : emp.username)}
                        className="btn"
                        style={{
                          padding: '4px 10px', fontSize: '0.75rem',
                          background: userFilter === emp.username ? '#2563eb' : '#f1f5f9',
                          color: userFilter === emp.username ? 'white' : '#475569'
                        }}
                      >
                        {userFilter === emp.username ? 'Showing All' : 'Filter Orders'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!employeeSalesList.length && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                      No orders placed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Category & Employee Filters Bar */}
        <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className="btn"
                style={{
                  background: categoryFilter === 'all' ? '#0f172a' : '#f1f5f9',
                  color: categoryFilter === 'all' ? 'white' : '#475569',
                  fontSize: '0.8rem'
                }}
              >
                All Categories ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('auto_tyre')}
                className="btn"
                style={{
                  background: categoryFilter === 'auto_tyre' ? '#2563eb' : '#f1f5f9',
                  color: categoryFilter === 'auto_tyre' ? 'white' : '#475569',
                  fontSize: '0.8rem'
                }}
              >
                🚗 Auto Tyre ({categoryStats.auto_tyre.totalPcs} Pcs)
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('cycle_tube')}
                className="btn"
                style={{
                  background: categoryFilter === 'cycle_tube' ? '#10b981' : '#f1f5f9',
                  color: categoryFilter === 'cycle_tube' ? 'white' : '#475569',
                  fontSize: '0.8rem'
                }}
              >
                🚲 Cycle Tube ({categoryStats.cycle_tube.totalPcs} Pcs)
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('cycle_tyre')}
                className="btn"
                style={{
                  background: categoryFilter === 'cycle_tyre' ? '#f59e0b' : '#f1f5f9',
                  color: categoryFilter === 'cycle_tyre' ? 'white' : '#475569',
                  fontSize: '0.8rem'
                }}
              >
                🚴 Cycle Tyre ({categoryStats.cycle_tyre.totalPcs} Pcs)
              </button>
            </div>

            {/* Dropdown Filters & Search */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Employee Filter */}
              <select
                className="form-select"
                style={{ width: '180px' }}
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              >
                <option value="all">All Employees</option>
                {employeeSalesList.map((emp) => (
                  <option key={emp.username} value={emp.username}>{emp.username}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                className="form-select"
                style={{ width: '150px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="dispatched">Dispatched</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Search Box */}
              <div style={{ position: 'relative', width: '220px' }}>
                <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}></i>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Search party or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Detailed Orders Table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#1e293b', margin: 0 }}>
              Orders Register ({filteredOrders.length})
            </h2>
            {(categoryFilter !== 'all' || userFilter !== 'all' || search) && (
              <button
                onClick={() => { setCategoryFilter('all'); setUserFilter('all'); setSearch(''); setStatusFilter(''); }}
                className="btn"
                style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }}
              >
                Clear All Filters
              </button>
            )}
          </div>

          <div className="table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading orders list...</div>
            ) : (
              <table>
                <thead>
                  <tr style={{ background: '#1e293b', color: 'white' }}>
                    <th style={{ width: '80px' }}>#</th>
                    <th>EMPLOYEE</th>
                    <th>PARTY NAME</th>
                    <th>DATE & DEADLINE</th>
                    <th>ORDERED ITEMS BREAKDOWN</th>
                    <th style={{ textAlign: 'right' }}>TOTAL QTY</th>
                    <th style={{ textAlign: 'center' }}>STATUS</th>
                    <th style={{ textAlign: 'center' }}>RESOLVED BY</th>
                    <th style={{ textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} style={{ transition: 'background 0.2s' }}>
                      <td style={{ fontWeight: 800, color: '#2563eb' }}>#{ord.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '26px', height: '26px', borderRadius: '50%', background: '#dbeafe', color: '#1e40af',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem'
                          }}>
                            {ord.user_name ? ord.user_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{ord.user_name}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{ord.party_name}</td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <div>{ord.date}</div>
                        {ord.deadline ? (
                          <div style={{ color: ord.is_overdue ? '#ef4444' : '#64748b', fontWeight: ord.is_overdue ? 700 : 400, fontSize: '0.75rem' }}>
                            Target: {ord.deadline} {ord.is_overdue ? '⚠ Overdue' : ''}
                          </div>
                        ) : (
                          <div style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>No deadline</div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {(ord.items || []).map((it) => (
                            <div key={it.id} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 700, color: '#0f172a' }}>{it.quantity} Pcs</span>
                              <span style={{ color: '#475569' }}>× {it.item_display}</span>
                              <span className={`badge ${
                                it.category === 'auto_tyre' ? 'blue' :
                                it.category === 'cycle_tube' ? 'green' : 'violet'
                              }`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                {it.category === 'auto_tyre' ? 'Auto Tyre' : it.category === 'cycle_tube' ? 'Cycle Tube' : 'Cycle Tyre'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                        {ord.total_quantity} Pcs
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${
                          ord.status === 'completed' ? 'green' :
                          ord.status === 'dispatched' ? 'blue' :
                          ord.status === 'approved' ? 'yellow' :
                          ord.status === 'cancelled' ? 'red' : 'yellow'
                        }`} style={{ padding: '5px 12px', fontWeight: 700 }}>
                          {ord.status_display}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                        {ord.resolved_by_name ? (
                          <div>
                            <strong>{ord.resolved_by_name}</strong>
                            {ord.resolved_at && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(ord.resolved_at).toLocaleDateString()}</div>}
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Link href={`/orders/${ord.id}`} className="btn" style={{ padding: '5px 14px', fontSize: '0.75rem', background: '#2563eb', color: 'white' }}>
                          <i className="fas fa-eye mr-1"></i> Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!filteredOrders.length && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                        No orders found matching selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

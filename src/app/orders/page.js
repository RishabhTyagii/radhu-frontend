'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [partyName, setPartyName] = useState('');
  const [addingParty, setAddingParty] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [ordRes, partyRes] = await Promise.all([
      apiGet('/orders/'),
      apiGet('/orders/parties/'),
    ]);

    if (ordRes) setOrders(ordRes);
    if (partyRes) setParties(partyRes);
    setLoading(false);
  }

  const handleAddParty = async (e) => {
    e.preventDefault();
    if (!partyName.trim()) return;

    setAddingParty(true);
    setMessage(null);

    const res = await apiPost('/orders/parties/', { name: partyName.trim() });
    setAddingParty(false);

    if (res && res.ok && res.data) {
      setMessage({ type: 'success', text: `Party "${partyName}" added!` });
      setPartyName('');
      fetchData();
    } else {
      setMessage({ type: 'error', text: res?.data?.error || 'Failed to add party' });
    }
  };

  const handleDeleteParty = async (id, pName) => {
    if (!confirm(`Delete party "${pName}"?`)) return;
    const res = await apiDelete(`/orders/parties/${id}/`);
    if (res && res.ok) {
      fetchData();
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header" style={{ marginBottom: '20px' }}>
          <div>
            <h1>📦 Order Management & Booking</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Book & track customer orders across Auto Tyre, Cycle Tube & Cycle Tyre
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/orders/create" className="btn btn-primary" style={{ background: '#2563eb' }}>
              <i className="fas fa-cart-plus mr-1"></i> + Book New Order
            </Link>
      
          </div>
        </div>

        {message && <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>{message.text}</div>}

        <div className="grid-2">
          {/* Recent Orders List */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h2><i className="fas fa-box text-blue-600 mr-2"></i> Recent Orders ({orders.length})</h2>
            <div className="table-container" style={{ marginTop: '16px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>Loading orders...</div>
              ) : (
                <table>
                  <thead>
                    <tr style={{ background: '#1e293b', color: 'white' }}>
                      <th>ORDER ID</th>
                      <th>DATE</th>
                      <th>PARTY NAME</th>
                      <th>TOTAL ITEMS</th>
                      <th>DEADLINE</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: 'center' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => (
                      <tr key={ord.id}>
                        <td style={{ fontWeight: 800, color: '#2563eb' }}>#{ord.id}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{ord.date}</td>
                        <td style={{ fontWeight: 600 }}>{ord.party_name}</td>
                        <td style={{ fontWeight: 'bold' }}>{ord.total_quantity} pcs ({ord.items?.length || 0} items)</td>
                        <td>
                          {ord.deadline ? (
                            <span style={{ color: ord.is_overdue ? '#ef4444' : '#475569', fontWeight: ord.is_overdue ? 'bold' : 'normal' }}>
                              {ord.deadline} {ord.is_overdue ? '(Overdue!)' : ''}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          <span className={`badge ${
                            ord.status === 'completed' ? 'green' :
                            ord.status === 'dispatched' ? 'blue' :
                            ord.status === 'approved' ? 'yellow' :
                            ord.status === 'cancelled' ? 'red' : 'yellow'
                          }`}>
                            {ord.status_display}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Link href={`/orders/${ord.id}`} className="btn" style={{ padding: '4px 12px', fontSize: '0.75rem', background: '#f1f5f9', color: '#1e293b' }}>
                            <i className="fas fa-eye mr-1"></i> Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {!orders.length && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                          No orders placed yet. Click "+ Book New Order" above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Customer Parties Card */}
          <div className="card">
            <h2>Party Directory ({parties.length})</h2>
            <div className="table-container" style={{ marginTop: '16px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Party Name</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {parties.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteParty(p.id, p.name)}
                          className="btn"
                          style={{ background: 'transparent', color: '#ef4444', padding: '4px' }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!parties.length && (
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                        No party added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Add Party */}
          <div className="card">
            <h2>Add Customer Party</h2>
            <form onSubmit={handleAddParty} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Party / Customer Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sharma Trading Co, Radhu Agencies"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', background: '#10b981' }} disabled={addingParty}>
                {addingParty ? 'Adding...' : 'Save Party'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

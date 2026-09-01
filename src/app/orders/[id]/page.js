'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet, apiFetch } from '@/lib/api';

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchDetail();
  }, [params.id]);

  async function fetchDetail() {
    setLoading(true);
    const res = await apiGet(`/orders/${params.id}/`);
    if (res) setOrder(res);
    setLoading(false);
  }

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    setMessage(null);

    const res = await apiFetch(`/orders/${params.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    setUpdating(false);

    if (res && res.ok) {
      setMessage({ type: 'success', text: `Order status updated to "${newStatus.toUpperCase()}"!` });
      fetchDetail();
    } else {
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '60px' }}>Loading order details...</div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '60px' }}>
          <h2>Order Not Found</h2>
          <Link href="/orders" className="btn btn-primary" style={{ marginTop: '16px' }}>Back to Orders</Link>
        </div>
      </>
    );
  }

  const items = order.items || [];

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header no-print" style={{ marginBottom: '20px' }}>
          <div>
            <h1>📦 Order #{order.id} Details</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Customer: <strong>{order.party_name}</strong> | Booked on: {order.date}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/orders" className="btn" style={{ background: '#f1f5f9', color: '#475569' }}>
              ← Back to Orders List
            </Link>
            <button onClick={() => window.print()} className="btn btn-primary" style={{ background: '#dc2626' }}>
              <i className="fas fa-print mr-1"></i> Print Order Sheet
            </button>
          </div>
        </div>

        {message && <div className={`message ${message.type} no-print`} style={{ marginBottom: '20px' }}>{message.text}</div>}

        <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, color: '#1e293b' }}>Party: {order.party_name}</h2>
              {order.party_gstin && <p style={{ margin: '4px 0 0', color: '#334155', fontSize: '0.9rem' }}><strong>GSTIN:</strong> {order.party_gstin}</p>}
              {order.party_address && <p style={{ margin: '4px 0 0', color: '#334155', fontSize: '0.9rem' }}><strong>Address:</strong> {order.party_address}</p>}
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.875rem' }}>Booked By User: {order.user_name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${
                order.status === 'completed' ? 'green' :
                order.status === 'dispatched' ? 'blue' :
                order.status === 'approved' ? 'yellow' :
                order.status === 'cancelled' ? 'red' : 'yellow'
              }`} style={{ fontSize: '0.9rem', padding: '6px 16px' }}>
                STATUS: {order.status_display.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Target Deadline</span>
              <p style={{ margin: '4px 0', fontWeight: 600, color: order.is_overdue ? '#dc2626' : '#1e293b' }}>
                {order.deadline || 'No deadline specified'} {order.is_overdue ? '(Overdue!)' : ''}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Total Order Value</span>
              <p style={{ margin: '4px 0', fontWeight: 800, color: '#059669', fontSize: '1.2rem' }}>
                ₹{parseFloat(order.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Resolved Info</span>
              <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>
                {order.resolved_at ? `Resolved on ${new Date(order.resolved_at).toLocaleDateString()}` : 'Order Pending'}
              </p>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>📝 Extra Notes / Remarks / Special Instructions</span>
            <p style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap', fontSize: '1rem', color: '#1e293b', lineHeight: 1.5, background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              {order.notes || 'No extra notes provided for this order.'}
            </p>
          </div>

          {/* Status Update Quick Buttons */}
          <div className="no-print" style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                <i className="fas fa-sliders-h mr-2 text-blue-600"></i> UPDATE ORDER STATUS:
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Click a button below to update status instantly
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleStatusChange('pending')}
                disabled={updating || order.status === 'pending'}
                className="btn"
                style={{
                  background: order.status === 'pending' ? '#f59e0b' : '#fef3c7',
                  color: order.status === 'pending' ? 'white' : '#92400e',
                  fontWeight: 700, padding: '8px 16px', borderRadius: '8px'
                }}
              >
                {order.status === 'pending' && '✓ '} Pending
              </button>
              <button
                onClick={() => handleStatusChange('approved')}
                disabled={updating || order.status === 'approved'}
                className="btn"
                style={{
                  background: order.status === 'approved' ? '#2563eb' : '#dbeafe',
                  color: order.status === 'approved' ? 'white' : '#1e40af',
                  fontWeight: 700, padding: '8px 16px', borderRadius: '8px'
                }}
              >
                {order.status === 'approved' && '✓ '} Approve Order
              </button>
              <button
                onClick={() => handleStatusChange('dispatched')}
                disabled={updating || order.status === 'dispatched'}
                className="btn"
                style={{
                  background: order.status === 'dispatched' ? '#6366f1' : '#e0e7ff',
                  color: order.status === 'dispatched' ? 'white' : '#3730a3',
                  fontWeight: 700, padding: '8px 16px', borderRadius: '8px'
                }}
              >
                {order.status === 'dispatched' && '✓ '} Mark Dispatched
              </button>
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={updating || order.status === 'completed'}
                className="btn"
                style={{
                  background: order.status === 'completed' ? '#10b981' : '#dcfce7',
                  color: order.status === 'completed' ? 'white' : '#15803d',
                  fontWeight: 700, padding: '8px 16px', borderRadius: '8px'
                }}
              >
                {order.status === 'completed' && '✓ '} Complete Order
              </button>
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={updating || order.status === 'cancelled'}
                className="btn"
                style={{
                  background: order.status === 'cancelled' ? '#ef4444' : '#fee2e2',
                  color: order.status === 'cancelled' ? 'white' : '#991b1b',
                  fontWeight: 700, padding: '8px 16px', borderRadius: '8px'
                }}
              >
                {order.status === 'cancelled' && '✓ '} Cancel Order
              </button>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr style={{ background: '#1e293b', color: 'white' }}>
                  <th>#</th>
                  <th>CATEGORY</th>
                  <th>ITEM DESCRIPTION</th>
                  <th style={{ textAlign: 'center' }}>CURRENT STOCK</th>
                  <th style={{ textAlign: 'right' }}>ORDERED QTY</th>
                  <th style={{ textAlign: 'right' }}>UNIT PRICE (₹)</th>
                  <th style={{ textAlign: 'right' }}>SUBTOTAL (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <span className={`badge ${
                        it.category === 'auto_tyre' ? 'blue' :
                        it.category === 'cycle_tube' ? 'green' : 'yellow'
                      }`}>
                        {it.category === 'auto_tyre' ? 'Auto Tyre' : it.category === 'cycle_tube' ? 'Cycle Tube' : 'Cycle Tyre'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{it.item_display}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: it.item_stock >= it.quantity ? '#16a34a' : '#dc2626' }}>
                      {it.item_stock} Pcs
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.05rem' }}>{it.quantity} Pcs</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{parseFloat(it.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                      ₹{parseFloat(it.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                  <td colSpan="4">TOTAL ORDER SUMMARY</td>
                  <td style={{ textAlign: 'right', color: '#2563eb', fontSize: '1.1rem' }}>
                    {items.reduce((acc, i) => acc + i.quantity, 0)} Pcs
                  </td>
                  <td></td>
                  <td style={{ textAlign: 'right', color: '#059669', fontSize: '1.2rem' }}>
                    ₹{parseFloat(order.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

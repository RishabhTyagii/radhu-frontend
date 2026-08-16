'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function CreateOrderPage() {
  const router = useRouter();
  const [parties, setParties] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [selectedParty, setSelectedParty] = useState('');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [quantities, setQuantities] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [partyRes, catRes] = await Promise.all([
      apiGet('/orders/parties/'),
      apiGet('/orders/catalog/'),
    ]);

    if (partyRes) {
      setParties(partyRes);
      if (partyRes.length > 0) setSelectedParty(partyRes[0].id);
    }
    if (catRes) setCatalog(catRes);
    setLoading(false);
  }

  const handleQtyChange = (key, val) => {
    setQuantities((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedParty) {
      alert('Please select a customer party!');
      return;
    }

    const items = [];
    Object.keys(quantities).forEach((key) => {
      const qty = parseInt(quantities[key], 10);
      if (qty > 0) {
        // key format: "category:item_id"
        const [category, item_id] = key.split(':');
        items.push({ category, item_id: parseInt(item_id, 10), quantity: qty });
      }
    });

    if (items.length === 0) {
      setMessage({ type: 'error', text: 'Please enter quantity for at least one item!' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const res = await apiPost('/orders/', {
      party_id: selectedParty,
      deadline: deadline || null,
      notes,
      items,
    });
    setSaving(false);

    if (res && res.ok) {
      alert(`Order #${res.data.id} booked successfully with ${items.length} line items!`);
      router.push(`/orders/${res.data.id}`);
    } else {
      setMessage({ type: 'error', text: res?.data?.error || 'Failed to place order' });
    }
  };

  const filteredCatalog = catalog.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const totalOrderedItems = Object.values(quantities).reduce((acc, q) => acc + (parseInt(q, 10) || 0), 0);

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header" style={{ marginBottom: '20px' }}>
          <div>
            <h1>🛒 Book New Multi-Item Order</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Select items across Auto Tyre, Cycle Tube & Cycle Tyre with live stock availability
            </p>
          </div>
          <Link href="/orders" className="btn" style={{ background: '#f1f5f9', color: '#475569' }}>
            ← Back to Orders List
          </Link>
        </div>

        {message && <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>{message.text}</div>}

        <form onSubmit={handleSubmit}>
          {/* Header Party & Order Info Card */}
          <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Order Details</h2>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Customer Party *</label>
                <select
                  className="form-select"
                  value={selectedParty}
                  onChange={(e) => setSelectedParty(e.target.value)}
                  required
                >
                  <option value="">-- Select Party --</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Delivery Deadline (Optional)</label>
                <input
                  type="date"
                  className="form-input"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Instructions</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Urgent dispatch via Jaipur Transport"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Item Catalog Picker */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className="btn"
                  style={{ background: activeCategory === 'all' ? '#1e293b' : '#f1f5f9', color: activeCategory === 'all' ? 'white' : '#475569' }}
                >
                  All Items ({catalog.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('auto_tyre')}
                  className="btn"
                  style={{ background: activeCategory === 'auto_tyre' ? '#2563eb' : '#f1f5f9', color: activeCategory === 'auto_tyre' ? 'white' : '#475569' }}
                >
                  🚗 Auto Tyre
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('cycle_tube')}
                  className="btn"
                  style={{ background: activeCategory === 'cycle_tube' ? '#10b981' : '#f1f5f9', color: activeCategory === 'cycle_tube' ? 'white' : '#475569' }}
                >
                  🚲 Cycle Tube
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('cycle_tyre')}
                  className="btn"
                  style={{ background: activeCategory === 'cycle_tyre' ? '#f59e0b' : '#f1f5f9', color: activeCategory === 'cycle_tyre' ? 'white' : '#475569' }}
                >
                  🚴 Cycle Tyre
                </button>
              </div>

              <div style={{ background: '#f0fdf4', padding: '8px 16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontWeight: 700, color: '#166534' }}>Total Order Qty: {totalOrderedItems} Pcs</span>
              </div>
            </div>

            <div className="table-container">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading catalog...</div>
              ) : (
                <table>
                  <thead>
                    <tr style={{ background: '#1e293b', color: 'white' }}>
                      <th>CATEGORY</th>
                      <th>ITEM DESCRIPTION</th>
                      <th style={{ textAlign: 'center' }}>PHYSICAL STOCK</th>
                      <th style={{ textAlign: 'center' }}>PENDING ORDERS</th>
                      <th style={{ textAlign: 'center' }}>AVAILABLE STOCK</th>
                      <th style={{ width: '130px', textAlign: 'center' }}>ORDER QTY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCatalog.map((item) => {
                      const itemKey = `${item.category}:${item.item_id}`;
                      const currentVal = quantities[itemKey] || '';
                      return (
                        <tr key={itemKey} style={{ background: currentVal > 0 ? '#f0fdf4' : 'transparent' }}>
                          <td>
                            <span className={`badge ${
                              item.category === 'auto_tyre' ? 'blue' :
                              item.category === 'cycle_tube' ? 'green' : 'yellow'
                            }`}>
                              {item.category_label}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{item.display}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.total_stock}</td>
                          <td style={{ textAlign: 'center', color: '#64748b' }}>{item.my_orders + item.other_orders}</td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: item.available > 0 ? '#16a34a' : '#dc2626' }}>
                            {item.available}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              className="form-input"
                              placeholder="0"
                              style={{ textAlign: 'center', fontWeight: 700, borderColor: currentVal > 0 ? '#10b981' : '#cbd5e1' }}
                              value={currentVal}
                              onChange={(e) => handleQtyChange(itemKey, e.target.value)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {!filteredCatalog.length && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                          No catalog items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '12px 36px', fontSize: '1rem', background: '#2563eb' }}
                disabled={saving || totalOrderedItems === 0}
              >
                {saving ? 'Placing Order...' : `Confirm & Place Order (${totalOrderedItems} Pcs)`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

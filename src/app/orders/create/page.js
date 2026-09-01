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
  const [prices, setPrices] = useState({});
  const [gstPrices, setGstPrices] = useState({});
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

  const handlePriceChange = (key, val, gstRate) => {
    setPrices((prev) => ({
      ...prev,
      [key]: val,
    }));
    setGstPrices((prev) => ({
      ...prev,
      [key]: val === '' ? '' : (parseFloat(val || 0) * (1 + gstRate)).toFixed(2),
    }));
  };

  const handleGstPriceChange = (key, val, gstRate) => {
    setGstPrices((prev) => ({
      ...prev,
      [key]: val,
    }));
    setPrices((prev) => ({
      ...prev,
      [key]: val === '' ? '' : (parseFloat(val || 0) / (1 + gstRate)).toFixed(2),
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
        const price = parseFloat(prices[key] || 0) || 0;
        items.push({ category, item_id: parseInt(item_id, 10), quantity: qty, price });
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
      const errText = res?.data?.error
        || res?.data?.detail
        || (res?.data && typeof res.data === 'object' ? JSON.stringify(res.data) : null)
        || `Failed to place order (HTTP ${res?.status || 'unknown'})`;
      setMessage({ type: 'error', text: errText });
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
      <div className="container" style={{ maxWidth: '100%', padding: '0 20px' }}>
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

              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Extra Notes / Remarks / Special Instructions</label>
                <textarea
                  className="form-input"
                  rows="4"
                  style={{ width: '100%', resize: 'vertical', minHeight: '90px', padding: '12px', fontSize: '0.95rem' }}
                  placeholder="Enter detailed dispatch notes, transport preferences, payment terms, or special instructions here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
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

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ background: '#f0fdf4', padding: '8px 16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontWeight: 700, color: '#166534' }}>Total Order Qty: {totalOrderedItems} Pcs</span>
                </div>
                <div style={{ background: '#eff6ff', padding: '8px 16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontWeight: 700, color: '#1e40af' }}>
                    Total Estimated Amount: ₹{Object.keys(quantities).reduce((acc, k) => {
                      const q = parseInt(quantities[k], 10) || 0;
                      const p = parseFloat(prices[k]) || 0;
                      return acc + (q * p);
                    }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
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
                      <th style={{ textAlign: 'center', width: '80px' }}>TYPE</th>
                      <th style={{ textAlign: 'center' }}>PHYSICAL STOCK</th>
                      <th style={{ textAlign: 'center' }}>PENDING ORDERS</th>
                      <th style={{ textAlign: 'center' }}>AVAILABLE STOCK</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>ORDER QTY</th>
                      <th style={{ width: '110px', textAlign: 'center' }}>PRICE (BASE)</th>
                      <th style={{ width: '110px', textAlign: 'center' }}>PRICE (+GST)</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>SUBTOTAL (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCatalog.map((item) => {
                      const itemKey = `${item.category}:${item.item_id}`;
                      const currentVal = quantities[itemKey] || '';
                      const currentPrice = prices[itemKey] || '';
                      const currentGstPrice = gstPrices[itemKey] || '';
                      
                      const gstRate = item.category === 'auto_tyre' ? 0.18 : 0.05;
                      
                      const subtotal = (parseInt(currentVal, 10) || 0) * (parseFloat(currentPrice) || 0);

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
                          <td style={{ textAlign: 'center' }}>
                            {item.item_type && (
                              <span style={{
                                padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                                background: item.item_type.toLowerCase() === 'tl' ? '#dbeafe' : 
                                           item.item_type.toLowerCase() === 'tt' ? '#d1fae5' : '#f1f5f9',
                                color: item.item_type.toLowerCase() === 'tl' ? '#1d4ed8' : 
                                       item.item_type.toLowerCase() === 'tt' ? '#047857' : '#475569',
                                border: '1px solid',
                                borderColor: item.item_type.toLowerCase() === 'tl' ? '#bfdbfe' : 
                                            item.item_type.toLowerCase() === 'tt' ? '#a7f3d0' : '#e2e8f0'
                              }}>
                                {item.item_type}
                              </span>
                            )}
                          </td>
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
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-input"
                              placeholder="₹ Base"
                              style={{ textAlign: 'center', fontWeight: 600, borderColor: currentPrice > 0 ? '#3b82f6' : '#cbd5e1' }}
                              value={currentPrice}
                              onChange={(e) => handlePriceChange(itemKey, e.target.value, gstRate)}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-input"
                              placeholder={`₹ +${gstRate*100}% GST`}
                              style={{ textAlign: 'center', fontWeight: 600, borderColor: currentGstPrice > 0 ? '#8b5cf6' : '#cbd5e1', backgroundColor: '#f5f3ff' }}
                              value={currentGstPrice}
                              onChange={(e) => handleGstPriceChange(itemKey, e.target.value, gstRate)}
                            />
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                            ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                    {!filteredCatalog.length && (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
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

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiPost } from '@/lib/api';

export default function AddCycleTubeItem() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    size: '',
    type: '',
    brand: '',
    weight: '0.2809',
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await apiPost('/cycletube/add-item/', formData);
    setLoading(false);

    if (res && res.ok) {
      setMessage({ type: 'success', text: `Cycle Tube "${res.data.size} ${res.data.type} ${res.data.brand}" added successfully!` });
      setFormData({ size: '', type: '', brand: '', weight: '0.2809' });
    } else {
      const errText = res?.data ? JSON.stringify(res.data) : 'Failed to add item';
      setMessage({ type: 'error', text: errText });
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="page-header">
          <h1>🚲 Add Cycle Tube Item</h1>
        </div>

        <div className="card">
          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Size * (e.g. 28x1.5, 26x1.75)</label>
              <input
                type="text"
                className="form-input"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g. 28x1.5"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Type * (e.g. JT, MLD)</label>
              <input
                type="text"
                className="form-input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="e.g. JT / MLD"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Brand * (e.g. TAHALKA)</label>
              <input
                type="text"
                className="form-input"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. TAHALKA"
                required
              />
            </div>

            <div className="form-group" style={{ background: '#fffbeb', padding: '16px', borderRadius: '8px', border: '1px solid #fef3c7' }}>
              <label className="form-label" style={{ color: '#92400e' }}>
                ⚖️ Weight (Kg per tube) * (e.g. 0.2809)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                className="form-input"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                required
              />
              <p style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '6px' }}>
                Weight is used for Target Weight calculation in Production Summary.
              </p>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Tube'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

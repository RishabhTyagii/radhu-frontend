'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiPost } from '@/lib/api';

export default function AddCycleTyreItem() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    box_type: '',
    size: '',
    material: '',
    brand: '',
    weight: '0.850',
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await apiPost('/cycletyres/add-item/', formData);
    setLoading(false);

    if (res && res.ok) {
      setMessage({ type: 'success', text: `Cycle Tyre "${res.data.size} ${res.data.box_type}" added successfully!` });
      setFormData({ box_type: '', size: '', material: '', brand: '', weight: '0.850' });
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
          <h1>🚴 Add Cycle Tyre Item</h1>
        </div>

        <div className="card">
          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Box Type * (e.g. 6 ply, 4 ply)</label>
              <input
                type="text"
                className="form-input"
                value={formData.box_type}
                onChange={(e) => setFormData({ ...formData, box_type: e.target.value })}
                placeholder="e.g. 6 ply"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Size * (e.g. 28 x 1.5, 26 x 1.75)</label>
              <input
                type="text"
                className="form-input"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g. 28 x 1.5"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Material * (e.g. CTC, NYL)</label>
              <input
                type="text"
                className="form-input"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="e.g. CTC"
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
                ⚖️ Weight (Kg per tyre) * (e.g. 0.850)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                className="form-input"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Cycle Tyre'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

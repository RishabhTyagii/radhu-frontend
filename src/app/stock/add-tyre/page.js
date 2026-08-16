'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { apiPost } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AddTyre() {
  const router = useRouter();
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({
    tyre: '',
    pattern: '',
    type: 'TT',
    weight: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const res = await apiPost('/stock/tyres/create/', {
      ...form,
      weight: parseFloat(form.weight) || 0
    });
    if (res && res.ok) {
      setMsg({ type: 'success', text: 'Tyre created successfully' });
      setTimeout(() => router.push('/'), 1200);
    } else {
      const errText = typeof res?.data === 'object' ? JSON.stringify(res.data) : (res?.data?.error || 'Failed to create tyre');
      setMsg({ type: 'error', text: errText });
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Add New Tyre</h1>
        </div>

        {msg && <div className={`message ${msg.type}`}>{msg.text}</div>}

        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Tyre Name (e.g. 275-18)</label>
              <input type="text" className="form-input" name="tyre" value={form.tyre} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Pattern (e.g. PANTHER)</label>
              <input type="text" className="form-input" name="pattern" value={form.pattern} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" name="type" value={form.type} onChange={handleChange}>
                <option value="TT">TT</option>
                <option value="TL">TL</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input type="number" step="0.01" className="form-input" name="weight" value={form.weight} onChange={handleChange} required />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
              <i className="fas fa-plus-circle"></i> Create Tyre
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

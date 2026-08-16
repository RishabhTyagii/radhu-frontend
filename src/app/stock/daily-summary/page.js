'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function DailySummary() {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  const today = date.toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(firstDay);
  const [toDate, setToDate] = useState(today);
  const [data, setData] = useState(null);

  // Track which row is being edited, and its temp values
  const [editingDate, setEditingDate] = useState(null);
  const [editValues, setEditValues] = useState({ parchi_kg: '', mixing_actual_compound: '', wastage: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  async function fetchData() {
    const result = await apiGet(`/stock/daily-summary/?from_date=${fromDate}&to_date=${toDate}`);
    if (result) setData(result);
  }

  const startEdit = (item) => {
    setEditingDate(item.date);
    setEditValues({
      parchi_kg: item.parchi_kg ?? 0,
      mixing_actual_compound: item.mixing_actual_compound ?? 0,
      wastage: item.wastage ?? 0
    });
  };

  const cancelEdit = () => {
    setEditingDate(null);
    setEditValues({ parchi_kg: '', mixing_actual_compound: '', wastage: '' });
  };

  const handleFieldChange = (field, value) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = async (entryDate) => {
    setSaving(true);
    const res = await apiPost('/stock/daily-summary/', {
      entry_date: entryDate,
      parchi_kg: parseFloat(editValues.parchi_kg) || 0,
      mixing_actual_compound: parseFloat(editValues.mixing_actual_compound) || 0,
      wastage: parseFloat(editValues.wastage) || 0
    });
    setSaving(false);

    if (res && res.ok) {
      setEditingDate(null);
      fetchData();
    } else {
      alert('Failed to save');
    }
  };

  const handleKeyDown = (e, entryDate) => {
    if (e.key === 'Enter') {
      saveEdit(entryDate);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const getNumColor = (val) => {
    if (!val || val === 0) return 'inherit';
    return val > 0 ? 'var(--danger)' : 'var(--success)';
  };

  const editInputStyle = {
    width: '80px',
    padding: '4px 6px',
    border: '1px solid var(--border, #ccc)',
    borderRadius: '4px'
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Daily Summary</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="form-label" style={{ marginBottom: 0 }}>From</span>
              <input type="date" className="form-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="form-label" style={{ marginBottom: 0 }}>To</span>
              <input type="date" className="form-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Curing</th>
                  <th>Packing</th>
                  <th>Theoretical KG</th>
                  <th>Parchi KG</th>
                  <th>Difference</th>
                  <th>Mixing Actual</th>
                  <th>Theo Compound</th>
                  <th>Variance</th>
                  <th>Wastage</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((item) => {
                  const isEditing = editingDate === item.date;
                  return (
                    <tr key={item.date}>
                      <td style={{ whiteSpace: 'nowrap' }}>{item.date}</td>
                      <td>{item.curing}</td>
                      <td>{item.packing}</td>
                      <td>{item.theoretical_kg?.toFixed(2) || '-'}</td>

                      {/* Parchi KG - editable */}
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            style={editInputStyle}
                            value={editValues.parchi_kg}
                            onChange={(e) => handleFieldChange('parchi_kg', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, item.date)}
                            autoFocus
                          />
                        ) : (
                          item.parchi_kg || '-'
                        )}
                      </td>

                      <td style={{ color: getNumColor(item.difference), fontWeight: 'bold' }}>
                        {item.difference ? item.difference.toFixed(2) : '-'}
                      </td>

                      {/* Mixing Actual - editable */}
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            style={editInputStyle}
                            value={editValues.mixing_actual_compound}
                            onChange={(e) => handleFieldChange('mixing_actual_compound', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, item.date)}
                          />
                        ) : (
                          item.mixing_actual_compound || '-'
                        )}
                      </td>

                      <td>{item.theoretical_compound?.toFixed(2) || '-'}</td>
                      <td style={{ color: getNumColor(item.variance), fontWeight: 'bold' }}>
                        {item.variance ? item.variance.toFixed(2) : '-'}
                      </td>

                      {/* Wastage - editable */}
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            style={editInputStyle}
                            value={editValues.wastage}
                            onChange={(e) => handleFieldChange('wastage', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, item.date)}
                          />
                        ) : (
                          item.wastage || '-'
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '4px 8px' }}
                              disabled={saving}
                              onClick={() => saveEdit(item.date)}
                            >
                              <i className="fas fa-check"></i> {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px' }}
                              disabled={saving}
                              onClick={cancelEdit}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px' }}
                            onClick={() => startEdit(item)}
                          >
                            <i className="fas fa-edit"></i> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!data?.length && (
                  <tr><td colSpan="11" style={{ textAlign: 'center' }}>No data for selected range</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
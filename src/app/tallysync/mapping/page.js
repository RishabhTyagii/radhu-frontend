'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiDelete, apiFetch } from '@/lib/api';

export default function TallyMappingList() {
  const [mappings, setMappings] = useState([]);
  const [stockItems, setStockItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tyre'); // 'tyre', 'cycletyre', 'tube', 'other'
  const [formData, setFormData] = useState({
    tally_item_name: '',
    item_choice: '', // format "module:id"
  });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [mapRes, itemsRes] = await Promise.all([
      apiGet('/tallysync/mapping/'),
      apiGet('/tallysync/add-mapping/'),
    ]);
    if (mapRes) setMappings(mapRes);
    if (itemsRes) setStockItems(itemsRes);
    setLoading(false);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tally_item_name || !formData.item_choice) return;

    setSaving(true);
    setMessage(null);

    const [module, item_id] = formData.item_choice.split(':');
    const res = await apiPost('/tallysync/add-mapping/', {
      tally_item_name: formData.tally_item_name,
      module,
      item_id,
    });
    setSaving(false);

    if (res && res.ok) {
      setMessage({
        type: 'success',
        text: `Mapping saved! ${res.resolved_count ? `${res.resolved_count} pending items automatically resolved!` : ''}`,
      });
      setFormData({ tally_item_name: '', item_choice: '' });
      fetchData();
    } else {
      setMessage({ type: 'error', text: res?.data?.error || 'Failed to save mapping' });
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete mapping for "${name}"?`)) return;
    const res = await apiDelete(`/tallysync/mapping/${id}/delete/`);
    if (res && res.ok) {
      setMappings(mappings.filter(m => m.id !== id));
      setMessage({ type: 'success', text: `Mapping for "${name}" deleted.` });
    }
  };

  const handleTransferModule = async (mappingId, newChoice) => {
    if (!newChoice) return;
    const [newModule, newItemId] = newChoice.split(':');
    setUpdatingId(mappingId);

    const res = await apiFetch(`/tallysync/mapping/${mappingId}/update/`, {
      method: 'PATCH',
      body: JSON.stringify({ module: newModule, item_id: newItemId }),
    });

    setUpdatingId(null);
    if (res && res.ok) {
      const data = await res.json();
      setMessage({
        type: 'success',
        text: `Transferred successfully! ${data.resolved_count ? `${data.resolved_count} pending items resolved.` : ''}`,
      });
      // Update local mappings state instantly
      setMappings(mappings.map(m => m.id === mappingId ? data.mapping : m));
    } else {
      alert('Failed to transfer module');
    }
  };

  // Group mappings by Tab
  const tyreMappings = mappings.filter(m => m.module === 'tyre');
  const cycleTyreMappings = mappings.filter(m => m.module === 'cycletyre');
  const tubeMappings = mappings.filter(m => m.module === 'tube');
  const otherMappings = mappings.filter(m => !['tyre', 'cycletyre', 'tube'].includes(m.module));

  let currentTabMappings = [];
  if (activeTab === 'tyre') currentTabMappings = tyreMappings;
  else if (activeTab === 'cycletyre') currentTabMappings = cycleTyreMappings;
  else if (activeTab === 'tube') currentTabMappings = tubeMappings;
  else if (activeTab === 'other') currentTabMappings = otherMappings;

  const filteredMappings = currentTabMappings.filter((m) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (m.tally_item_name && m.tally_item_name.toLowerCase().includes(term)) ||
      (m.resolved_item_label && m.resolved_item_label.toLowerCase().includes(term))
    );
  });

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <div>
            <h1>🔗 Tally Item Mappings</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Map and transfer Tally stock items across Auto Tyre, Cycle Tyre, Cycle Tube, and Other categories
            </p>
          </div>
          <div style={{ position: 'relative', width: '300px' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}></i>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search in this tab..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {message && <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>{message.text}</div>}

        <div className="grid-2">
          {/* Add Mapping Form */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h2><i className="fas fa-plus-circle mr-1" style={{ color: '#2563eb' }}></i> Add / Edit Item Mapping</h2>
            <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Tally Item Name * (Exact name in Tally Prime)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 28X1.50 NYLON TUBE TAHALKA"
                  value={formData.tally_item_name}
                  onChange={(e) => setFormData({ ...formData, tally_item_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Portal Item *</label>
                <select
                  className="form-select"
                  value={formData.item_choice}
                  onChange={(e) => setFormData({ ...formData, item_choice: e.target.value })}
                  required
                >
                  <option value="">-- Select Matching Item --</option>
                  
                  {stockItems?.tyre_items?.length > 0 && (
                    <optgroup label="🚗 Auto Tyre Items">
                      {stockItems.tyre_items.map((t) => (
                        <option key={`tyre:${t.id}`} value={`tyre:${t.id}`}>
                          Auto Tyre: {t.label}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {stockItems?.cycletyre_items?.length > 0 && (
                    <optgroup label="🚴 Cycle Tyre Items">
                      {stockItems.cycletyre_items.map((t) => (
                        <option key={`cycletyre:${t.id}`} value={`cycletyre:${t.id}`}>
                          Cycle Tyre: {t.label}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {stockItems?.tube_items?.length > 0 && (
                    <optgroup label="🚲 Cycle Tube Items">
                      {stockItems.tube_items.map((t) => (
                        <option key={`tube:${t.id}`} value={`tube:${t.id}`}>
                          Cycle Tube: {t.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', background: '#2563eb' }} disabled={saving}>
                {saving ? 'Saving...' : 'Save Mapping'}
              </button>
            </form>
          </div>

          {/* Mappings Tabs Container */}
          <div className="card">
            {/* 4 Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab('tyre')}
                className="btn"
                style={{
                  background: activeTab === 'tyre' ? '#2563eb' : '#f1f5f9',
                  color: activeTab === 'tyre' ? 'white' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                🏎️ Auto Tyre ({tyreMappings.length})
              </button>

              <button
                onClick={() => setActiveTab('cycletyre')}
                className="btn"
                style={{
                  background: activeTab === 'cycletyre' ? '#059669' : '#f1f5f9',
                  color: activeTab === 'cycletyre' ? 'white' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                🚴 Cycle Tyre ({cycleTyreMappings.length})
              </button>

              <button
                onClick={() => setActiveTab('tube')}
                className="btn"
                style={{
                  background: activeTab === 'tube' ? '#d97706' : '#f1f5f9',
                  color: activeTab === 'tube' ? 'white' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                🚲 Cycle Tube ({tubeMappings.length})
              </button>

              <button
                onClick={() => setActiveTab('other')}
                className="btn"
                style={{
                  background: activeTab === 'other' ? '#64748b' : '#f1f5f9',
                  color: activeTab === 'other' ? 'white' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                📦 Other ({otherMappings.length})
              </button>
            </div>

            <div className="table-container">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>Loading mappings...</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Tally Item Name</th>
                      <th>Current Portal Item</th>
                      <th style={{ minWidth: '220px' }}>Transfer / Change Target</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMappings.map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600 }}>{m.tally_item_name}</td>
                        <td>
                          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{m.resolved_item_label}</span>
                        </td>
                        <td>
                          <select
                            className="form-select"
                            style={{ fontSize: '0.78rem', padding: '4px 6px' }}
                            defaultValue={`${m.module}:${m.item_id}`}
                            disabled={updatingId === m.id}
                            onChange={(e) => handleTransferModule(m.id, e.target.value)}
                          >
                            <option value="">-- Transfer Target --</option>

                            {stockItems?.tyre_items?.length > 0 && (
                              <optgroup label="🏎️ Auto Tyre">
                                {stockItems.tyre_items.map((t) => (
                                  <option key={`tyre:${t.id}`} value={`tyre:${t.id}`}>
                                    Auto Tyre: {t.label}
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            {stockItems?.cycletyre_items?.length > 0 && (
                              <optgroup label="🚴 Cycle Tyre">
                                {stockItems.cycletyre_items.map((t) => (
                                  <option key={`cycletyre:${t.id}`} value={`cycletyre:${t.id}`}>
                                    Cycle Tyre: {t.label}
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            {stockItems?.tube_items?.length > 0 && (
                              <optgroup label="🚲 Cycle Tube">
                                {stockItems.tube_items.map((t) => (
                                  <option key={`tube:${t.id}`} value={`tube:${t.id}`}>
                                    Cycle Tube: {t.label}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleDelete(m.id, m.tally_item_name)}
                            className="btn"
                            style={{ background: 'transparent', color: '#ef4444', padding: '4px 8px' }}
                            title="Delete Mapping"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!filteredMappings.length && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                          No mapped items in this category tab.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

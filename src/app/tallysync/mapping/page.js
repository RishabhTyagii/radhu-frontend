'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiDelete, apiFetch } from '@/lib/api';

export default function TallyMappingList() {
  const [mappings, setMappings] = useState([]);
  const [stockItems, setStockItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tyre'); // 'tyre', 'cycletyre', 'tube', 'other'
  
  // Add mapping form state
  const [formData, setFormData] = useState({
    tally_item_name: '',
    item_choice: '', // format "module:id"
  });
  const [searchFormItem, setSearchFormItem] = useState('');
  
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState('');

  // Delete modal state
  const [deleteModalItem, setDeleteModalItem] = useState(null);

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
      setSearchFormItem('');
      fetchData();
    } else {
      setMessage({ type: 'error', text: res?.data?.error || 'Failed to save mapping' });
    }
  };

  const confirmDelete = async (mode) => {
    if (!deleteModalItem) return;
    const { id, name } = deleteModalItem;
    setDeleteModalItem(null);

    const res = await apiDelete(`/tallysync/mapping/${id}/delete/`);
    if (res && res.ok) {
      setMappings(mappings.filter(m => m.id !== id));
      setMessage({
        type: 'success',
        text: mode === 'full' 
          ? `FULL DELETE: Mapping "${name}" deleted & stock/invoices reverted.` 
          : `Mapping for "${name}" deleted.`,
      });
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

  // Get items relevant for active tab in form
  function getTabItems(modKey) {
    if (modKey === 'tyre') return stockItems?.tyre_items || [];
    if (modKey === 'cycletyre') return stockItems?.cycletyre_items || [];
    if (modKey === 'tube') return stockItems?.tube_items || [];
    return [
      ...(stockItems?.tyre_items || []),
      ...(stockItems?.cycletyre_items || []),
      ...(stockItems?.tube_items || []),
    ];
  }

  const currentSelectItems = getTabItems(activeTab).filter(it => 
    !searchFormItem || it.label.toLowerCase().includes(searchFormItem.toLowerCase())
  );

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
            <h2><i className="fas fa-plus-circle mr-1" style={{ color: '#2563eb' }}></i> Add Item Mapping ({activeTab.toUpperCase()})</h2>
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

              {/* Real-Time Searchable Dropdown for Tab */}
              <div className="form-group">
                <label className="form-label">Target Item in {activeTab.toUpperCase()} *</label>
                
                {/* Search Input Filter */}
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <i className="fas fa-search" style={{ position: 'absolute', left: '10px', top: '10px', fontSize: '0.8rem', color: '#94a3b8' }}></i>
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '30px', fontSize: '0.82rem', height: '36px' }}
                    placeholder={`Type to search in ${activeTab.toUpperCase()} items...`}
                    value={searchFormItem}
                    onChange={(e) => setSearchFormItem(e.target.value)}
                  />
                </div>

                <select
                  className="form-select"
                  value={formData.item_choice}
                  onChange={(e) => setFormData({ ...formData, item_choice: e.target.value })}
                  required
                  size={5}
                  style={{ height: '140px' }}
                >
                  <option value="">-- Select Matching Item --</option>
                  {currentSelectItems.map((t) => (
                    <option key={`${activeTab}:${t.id}`} value={`${activeTab}:${t.id}`}>
                      [{activeTab.toUpperCase()}] {t.label}
                    </option>
                  ))}
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
                onClick={() => { setActiveTab('tyre'); setSearchFormItem(''); }}
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
                onClick={() => { setActiveTab('cycletyre'); setSearchFormItem(''); }}
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
                onClick={() => { setActiveTab('tube'); setSearchFormItem(''); }}
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
                onClick={() => { setActiveTab('other'); setSearchFormItem(''); }}
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
                      <th>Current Item</th>
                      <th style={{ minWidth: '180px' }}>Transfer to Other Tab</th>
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
                            value={`${m.module}:${m.item_id}`}
                            disabled={updatingId === m.id}
                            onChange={(e) => handleTransferModule(m.id, e.target.value)}
                          >
                            <option value="">-- Transfer Target --</option>
                            <optgroup label="🏎️ Auto Tyre">
                              {stockItems?.tyre_items?.map((t) => (
                                <option key={`tyre:${t.id}`} value={`tyre:${t.id}`}>Auto Tyre: {t.label}</option>
                              ))}
                            </optgroup>
                            <optgroup label="🚴 Cycle Tyre">
                              {stockItems?.cycletyre_items?.map((t) => (
                                <option key={`cycletyre:${t.id}`} value={`cycletyre:${t.id}`}>Cycle Tyre: {t.label}</option>
                              ))}
                            </optgroup>
                            <optgroup label="🚲 Cycle Tube">
                              {stockItems?.tube_items?.map((t) => (
                                <option key={`tube:${t.id}`} value={`tube:${t.id}`}>Cycle Tube: {t.label}</option>
                              ))}
                            </optgroup>
                          </select>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => setDeleteModalItem({ id: m.id, name: m.tally_item_name })}
                            className="btn"
                            style={{ background: '#fee2e2', color: '#ef4444', padding: '4px 8px' }}
                            title="Delete Mapping"
                          >
                            <i className="fas fa-trash"></i> Delete
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

      {/* Delete Confirmation Modal with 2 Explicit Options */}
      {deleteModalItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '90%', padding: '24px' }}>
            <h3 style={{ color: '#ef4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-exclamation-triangle"></i> Delete Confirmation
            </h3>
            <p style={{ marginBottom: '16px', fontSize: '0.9rem', color: '#334155' }}>
              Aap <strong>"{deleteModalItem.name}"</strong> ko delete kar rahe hain. Kaunsa delete option apply karna chahte hain?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => confirmDelete('mapping_only')}
                className="btn"
                style={{
                  background: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155',
                  textAlign: 'left', padding: '10px 14px', borderRadius: '6px',
                }}
              >
                <strong>⚠️ Option 1: Remove Mapping Only</strong>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  Sirf Tally Mapping remove hogi. Invoice totals, GST, aur Stock safe rahenge.
                </div>
              </button>

              <button
                onClick={() => confirmDelete('full')}
                className="btn"
                style={{
                  background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b',
                  textAlign: 'left', padding: '10px 14px', borderRadius: '6px',
                }}
              >
                <strong>🗑️ Option 2: Full Delete (Revert Stock & Deduct Bill/GST)</strong>
                <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '2px' }}>
                  Pura remove hoga — Stock revert hoga aur Invoice Total/GST se amount minus ho jayegi.
                </div>
              </button>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setDeleteModalItem(null)} className="btn" style={{ background: '#e2e8f0', color: '#475569' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function Entries() {
  const [entries, setEntries] = useState([]);
  const [tyreItems, setTyreItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    date: '',
    month: '',
    type: '',
    tyre_id: '',
    search: ''
  });

  useEffect(() => {
    fetchTyres();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [filters]);

  async function fetchTyres() {
    const data = await apiGet('/stock/tyres/');
    if (data) setTyreItems(data);
  }

  async function fetchEntries() {
    setLoading(true);
    let query = '?';
    if (filters.type && filters.type !== 'all') query += `type=${filters.type}&`;
    if (filters.date) query += `date=${filters.date}&`;
    else if (filters.month) query += `month=${filters.month}&`;
    if (filters.tyre_id) query += `tyre_id=${filters.tyre_id}&`;
    if (filters.search) query += `search=${encodeURIComponent(filters.search)}&`;
    
    const data = await apiGet(`/stock/entries/${query}`);
    if (data) setEntries(data);
    setLoading(false);
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'date' && value) {
      setFilters({ ...filters, date: value, month: '' });
    } else if (name === 'month' && value) {
      setFilters({ ...filters, month: value, date: '' });
    } else {
      setFilters({ ...filters, [name]: value });
    }
  };

  const getTypeBadge = (type) => {
    switch(type) {
      case 'production': return <span className="badge green">Production</span>;
      case 'dispatch': return <span className="badge red">Dispatch</span>;
      case 'adjustment': return <span className="badge purple">Adjustment</span>;
      default: return <span className="badge">{type}</span>;
    }
  };

  return (
    <>
      <style>{`
        footer { display: none !important; }
        .hover-nav-area { position: fixed; top: 0; left: 0; right: 0; height: 18px; z-index: 999; }
        .hover-navbar { position: fixed; top: -70px; left: 0; right: 0; transition: top 0.3s ease; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .hover-nav-area:hover + .hover-navbar, .hover-navbar:hover { top: 0; }
        
        body, html { margin: 0; padding: 0; height: 100%; background: #f8fafc; }
        .fullscreen-container { padding: 20px; max-width: 100%; box-sizing: border-box; padding-top: 40px; }
        .glass-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; margin-bottom: 20px; }
        
        .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 0 10px; }
        .page-title { font-size: 1.5rem; font-weight: bold; color: #1e293b; margin: 0; }
        
        .filter-toolbar { display: flex; flex-wrap: wrap; gap: 15px; padding: 15px 20px; background: #f1f5f9; border-radius: 10px; border: 1px solid #e2e8f0; align-items: center; }
        .filter-group { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 150px; }
        .filter-label { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .filter-input, .filter-select { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.875rem; outline: none; background: white; transition: all 0.2s; }
        .filter-input:focus, .filter-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        
        .table-responsive { width: 100%; overflow-x: auto; background: white; border-radius: 10px; }
        .modern-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
        .modern-table th { background: #f8fafc; color: #475569; font-weight: 600; padding: 12px 16px; border-bottom: 2px solid #e2e8f0; font-size: 0.85rem; text-transform: uppercase; white-space: nowrap; }
        .modern-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.9rem; }
        .modern-table tbody tr:hover td { background: #f8fafc; }
        
        .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
        .badge.green { background: #dcfce7; color: #166534; }
        .badge.red { background: #fee2e2; color: #991b1b; }
        .badge.purple { background: #f3e8ff; color: #6b21a8; }
        
        .empty-state { text-align: center; padding: 40px; color: #64748b; }
      `}</style>
      
      <div className="hover-nav-area"></div>
      <div className="hover-navbar">
        <Navbar />
      </div>

      <div className="fullscreen-container">
        <div className="header-flex">
          <h1 className="page-title">Auto Tyre Entries Log</h1>
        </div>

        <div className="glass-card">
          <div className="filter-toolbar">
            <div className="filter-group" style={{ flex: 1.5 }}>
              <span className="filter-label">Search (Party / Bill No / Tyre)</span>
              <input type="text" className="filter-input" name="search" placeholder="Type to search..." value={filters.search} onChange={handleFilterChange} />
            </div>
            <div className="filter-group">
              <span className="filter-label">Tyre Item</span>
              <select className="filter-select" name="tyre_id" value={filters.tyre_id} onChange={handleFilterChange}>
                <option value="">All Tyres</option>
                {tyreItems.map(t => (
                  <option key={t.id} value={t.id}>{t.tyre} {t.pattern} {t.type} </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <span className="filter-label">Entry Type</span>
              <select className="filter-select" name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="">All Types</option>
                <option value="production">Production</option>
                <option value="dispatch">Dispatch</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
            <div className="filter-group">
              <span className="filter-label">Specific Date</span>
              <input type="date" className="filter-input" name="date" value={filters.date} onChange={handleFilterChange} />
            </div>
            <div className="filter-group">
              <span className="filter-label">Month</span>
              <input type="month" className="filter-input" name="month" value={filters.month} onChange={handleFilterChange} />
            </div>
          </div>
        </div>

        <div className="glass-card table-responsive">
          {loading ? (
            <div className="empty-state">Loading entries...</div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Tyre</th>
                  <th>Type</th>
                  <th>Bucket</th>
                  <th>Qty</th>
                  <th>Bill No</th>
                  <th>Party / Remark</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((item) => (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: '500' }}>{item.date}</td>
                    <td style={{ fontWeight: '600' }}>{item.tyre_item ? `${item.tyre_item.tyre} ${item.tyre_item.pattern} ${item.tyre_item.type}` : '-'}</td>
                    <td>{getTypeBadge(item.entry_type)}</td>
                    <td><span style={{color:'#64748b', fontSize:'0.8rem', textTransform:'capitalize'}}>{item.bucket_display || item.bucket || '-'}</span></td>
                    <td style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.quantity}</td>
                    <td>{item.bill_number || '-'}</td>
                    <td>{item.remark || '-'}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.user_display || '-'}</td>
                  </tr>
                ))}
                {!entries.length && (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      No entries found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

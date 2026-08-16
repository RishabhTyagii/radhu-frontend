'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function Entries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    date: '',
    month: '',
    type: ''
  });

  useEffect(() => {
    fetchEntries();
  }, [filters]);

  async function fetchEntries() {
    setLoading(true);
    let query = '?';
    if (filters.type && filters.type !== 'all') query += `type=${filters.type}&`;
    if (filters.date) query += `date=${filters.date}&`;
    else if (filters.month) query += `month=${filters.month}&`;
    
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
      default: return <span>{type}</span>;
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Entries Log</h1>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Filter by Date</label>
              <input type="date" className="form-input" name="date" value={filters.date} onChange={handleFilterChange} />
            </div>
            <div className="form-group">
              <label className="form-label">OR Filter by Month</label>
              <input type="month" className="form-input" name="month" value={filters.month} onChange={handleFilterChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Entry Type</label>
              <select className="form-select" name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="">All Entries</option>
                <option value="production">Production</option>
                <option value="dispatch">Dispatch</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>Loading entries...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Tyre</th>
                    <th>Type</th>
                    <th>Bucket</th>
                    <th>Qty</th>
                    <th>Bill No</th>
                    <th>Remark</th>
                    <th>User</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((item) => (
                    <tr key={item.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{item.date}</td>
                      <td>{item.tyre_item ? `${item.tyre_item.tyre} ${item.tyre_item.pattern}` : '-'}</td>
                      <td>{getTypeBadge(item.entry_type)}</td>
                      <td>{item.bucket_display || item.bucket || '-'}</td>
                      <td style={{ fontWeight: 'bold' }}>{item.quantity}</td>
                      <td>{item.bill_number || '-'}</td>
                      <td>{item.remark || '-'}</td>
                      <td>{item.user_display || '-'}</td>
                    </tr>
                  ))}
                  {!entries.length && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                        No entries found. Try changing your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

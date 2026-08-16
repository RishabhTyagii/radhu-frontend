'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function TallySalesSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    party: '',
    month: '',
    from_date: '',
    to_date: '',
  });

  useEffect(() => {
    fetchSummary();
  }, [filters]);

  async function fetchSummary() {
    setLoading(true);
    let query = '?';
    if (filters.party) query += `party=${encodeURIComponent(filters.party)}&`;
    if (filters.from_date || filters.to_date) {
      if (filters.from_date) query += `from_date=${filters.from_date}&`;
      if (filters.to_date) query += `to_date=${filters.to_date}&`;
    } else if (filters.month) {
      query += `month=${filters.month}&`;
    }

    const res = await apiGet(`/tallysync/sales/${query}`);
    if (res) setData(res);
    setLoading(false);
  }

  const handleReset = () => {
    setFilters({ party: '', month: '', from_date: '', to_date: '' });
  };

  const invoices = data?.invoices || [];
  const totals = data?.totals || {};

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header" style={{ marginBottom: '20px' }}>
          <div>
            <h1>📊 Tally Sales & GST Summary</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Real-time synced vouchers from Tally Prime ({data?.invoice_count || 0} invoices)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/tallysync/mapping" className="btn btn-primary" style={{ background: '#2563eb' }}>
              <i className="fas fa-link mr-1"></i> Item Mappings
            </Link>
            <Link href="/tallysync/logs" className="btn btn-primary" style={{ background: '#475569' }}>
              <i className="fas fa-history mr-1"></i> Sync Logs ({data?.unmapped_count || 0} Pending)
            </Link>
          </div>
        </div>

        {Boolean(data?.unmapped_count) && (
          <div className="message warning" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
              <strong>{data.unmapped_count} invoice(s)</strong> have unmapped items or insufficient stock.
            </div>
            <Link href="/tallysync/logs" style={{ color: '#b45309', fontWeight: 600, textDecoration: 'underline' }}>
              View & Resolve in Sync Logs →
            </Link>
          </div>
        )}

        {/* Filters Card */}
        <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
          <div className="grid-4" style={{ alignItems: 'flex-end' }}>
            <div className="form-group">
              <label className="form-label">Search Party / Voucher</label>
              <input
                type="text"
                className="form-input"
                placeholder="Party name or voucher no..."
                value={filters.party}
                onChange={(e) => setFilters({ ...filters, party: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Month Filter</label>
              <input
                type="month"
                className="form-input"
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">From Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.from_date}
                onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">To Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={filters.to_date}
                  onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                />
              </div>
              <button onClick={handleReset} className="btn" style={{ background: '#f1f5f9', color: '#475569', height: '42px' }}>
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid-4" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <div className="stat-card">
            <span className="stat-label">Total Sale</span>
            <span className="stat-number" style={{ color: '#2563eb' }}>₹{Number(totals.total_sale || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Taxable Value</span>
            <span className="stat-number">₹{Number(totals.total_taxable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">CGST</span>
            <span className="stat-number" style={{ color: '#16a34a' }}>₹{Number(totals.total_cgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">SGST</span>
            <span className="stat-number" style={{ color: '#16a34a' }}>₹{Number(totals.total_sgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">IGST</span>
            <span className="stat-number" style={{ color: '#16a34a' }}>₹{Number(totals.total_igst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total GST Payable</span>
            <span className="stat-number" style={{ color: '#dc2626' }}>₹{Number(totals.total_gst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="card">
          <div className="table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading Tally invoices...</div>
            ) : (
              <table>
                <thead>
                  <tr style={{ background: '#1e293b', color: 'white' }}>
                    <th>DATE</th>
                    <th>VOUCHER NO.</th>
                    <th>PARTY NAME</th>
                    <th>GSTIN</th>
                    <th style={{ textAlign: 'right' }}>TAXABLE (₹)</th>
                    <th style={{ textAlign: 'right' }}>GST (₹)</th>
                    <th style={{ textAlign: 'right' }}>TOTAL (₹)</th>
                    <th>STOCK SYNC</th>
                    <th style={{ textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{inv.voucher_date}</td>
                      <td style={{ fontWeight: 600 }}>{inv.voucher_number}</td>
                      <td style={{ fontWeight: 500 }}>{inv.party_name || '-'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{inv.party_gstin || '-'}</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(inv.taxable_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a' }}>₹{Number(inv.gst_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{Number(inv.total_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td>
                        {inv.stock_synced ? (
                          <span className="badge green"><i className="fas fa-check-circle mr-1"></i> Synced</span>
                        ) : (
                          <span className="badge red"><i className="fas fa-exclamation-triangle mr-1"></i> Pending</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Link href={`/tallysync/invoice/${inv.id}`} className="btn" style={{ padding: '4px 12px', fontSize: '0.75rem', background: '#f1f5f9', color: '#1e293b' }}>
                          <i className="fas fa-eye mr-1"></i> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!invoices.length && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                        No synced invoices found for this filter. Run TallySync app on your PC to sync.
                      </td>
                    </tr>
                  )}
                </tbody>
                {invoices.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                      <td colSpan="4">TOTAL ({invoices.length} invoices)</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(totals.total_taxable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a' }}>₹{Number(totals.total_gst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', color: '#2563eb' }}>₹{Number(totals.total_sale || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost } from '@/lib/api';

export default function TallySalesSummary() {
  const [data, setData] = useState(null);
  const [stockItems, setStockItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'tyre', 'cycletyre', 'tube'
  const [filters, setFilters] = useState({
    party: '',
    month: '',
    from_date: '',
    to_date: '',
  });

  // Transfer modal state
  const [transferModalInvoice, setTransferModalInvoice] = useState(null);
  const [transferModule, setTransferModule] = useState('tyre');
  const [transferItemId, setTransferItemId] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [message, setMessage] = useState(null);

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

    const [salesRes, itemsRes] = await Promise.all([
      apiGet(`/tallysync/sales/${query}`),
      apiGet('/tallysync/stock-items/'),
    ]);

    if (salesRes) setData(salesRes);
    if (itemsRes) setStockItems(itemsRes);
    setLoading(false);
  }

  const handleReset = () => {
    setFilters({ party: '', month: '', from_date: '', to_date: '' });
  };

  const handleExecuteTransfer = async () => {
    if (!transferModalInvoice || !transferModule || !transferItemId) {
      alert('Pehle module aur matching item select karo!');
      return;
    }

    setTransferring(true);
    setMessage(null);

    // Get unmapped/first line item name from invoice
    const pendingItem = transferModalInvoice.pending_items?.[0] || {};
    const tallyItemName = pendingItem.tally_item_name || 'Voucher Item';

    const res = await apiPost('/tallysync/add-mapping/', {
      tally_item_name: tallyItemName,
      module: transferModule,
      item_id: transferItemId,
    });

    setTransferring(false);
    setTransferModalInvoice(null);

    if (res && res.ok) {
      setMessage({
        type: 'success',
        text: `✓ Item transferred & mapped to ${transferModule.toUpperCase()} successfully!`,
      });
      fetchSummary();
    } else {
      setMessage({ type: 'error', text: res?.data?.error || 'Failed to transfer item' });
    }
  };

  const invoices = data?.invoices || [];
  const totals = data?.totals || {};

  // Filter invoices for category tabs
  function getInvoiceCategory(inv) {
    const raw = (inv.raw_payload || '').toLowerCase();
    const party = (inv.party_name || '').toLowerCase();
    if (raw.includes('tube') || raw.includes('tb') || raw.includes('mld') || raw.includes('jt')) return 'tube';
    if (raw.includes('cycle') && raw.includes('tyre')) return 'cycletyre';
    if (raw.includes('tyre') || party.includes('tyre')) return 'tyre';
    return 'all';
  }

  const tyreInvoices = invoices.filter(inv => getInvoiceCategory(inv) === 'tyre');
  const cycleTyreInvoices = invoices.filter(inv => getInvoiceCategory(inv) === 'cycletyre');
  const tubeInvoices = invoices.filter(inv => getInvoiceCategory(inv) === 'tube');

  let filteredInvoices = invoices;
  if (activeTab === 'tyre') filteredInvoices = tyreInvoices;
  else if (activeTab === 'cycletyre') filteredInvoices = cycleTyreInvoices;
  else if (activeTab === 'tube') filteredInvoices = tubeInvoices;

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

        {message && <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>{message.text}</div>}

        {Boolean(data?.unmapped_count) && (
          <div className="message warning" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
              <strong>{data.unmapped_count} invoice(s)</strong> have unmapped items or pending stock sync.
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

        {/* Invoices Table Card with 4 Category Tabs */}
        <div className="card">
          {/* 4 Tabs Navigation */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('all')}
              className="btn"
              style={{
                background: activeTab === 'all' ? '#1e293b' : '#f1f5f9',
                color: activeTab === 'all' ? 'white' : '#475569',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              🌟 All Invoices ({invoices.length})
            </button>

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
              🏎️ Auto Tyre ({tyreInvoices.length})
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
              🚴 Cycle Tyre ({cycleTyreInvoices.length})
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
              🚲 Cycle Tube ({tubeInvoices.length})
            </button>
          </div>

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
                    <th style={{ textAlign: 'center', minWidth: '150px' }}>ACTION / TRANSFER</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
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
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <Link href={`/tallysync/invoice/${inv.id}`} className="btn" style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#f1f5f9', color: '#1e293b' }}>
                            <i className="fas fa-eye mr-1"></i> View
                          </Link>

                          <button
                            onClick={() => {
                              setTransferModalInvoice(inv);
                              setTransferModule('tyre');
                              setTransferItemId('');
                            }}
                            className="btn"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#e0e7ff', color: '#3730a3' }}
                            title="Transfer / Assign category tab"
                          >
                            <i className="fas fa-exchange-alt mr-1"></i> Transfer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredInvoices.length && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                        No synced invoices found in this tab filter.
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredInvoices.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                      <td colSpan="4">TOTAL ({filteredInvoices.length} invoices)</td>
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

      {/* Category Transfer Modal */}
      {transferModalInvoice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '90%', padding: '24px' }}>
            <h3 style={{ color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-exchange-alt" style={{ color: '#2563eb' }}></i> Transfer Voucher Category Tab
            </h3>
            <p style={{ marginBottom: '16px', fontSize: '0.88rem', color: '#475569' }}>
              Voucher <strong>#{transferModalInvoice.voucher_number}</strong> ({transferModalInvoice.party_name}) ko kis category tab mein transfer/map karna chahte hain?
            </p>

            <div className="form-group">
              <label className="form-label">Target Module Tab *</label>
              <select
                className="form-select"
                value={transferModule}
                onChange={(e) => {
                  setTransferModule(e.target.value);
                  setTransferItemId('');
                }}
              >
                <option value="tyre">🏎️ Auto Tyre</option>
                <option value="cycletyre">🚴 Cycle Tyre</option>
                <option value="tube">🚲 Cycle Tube</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Select Matching Stock Item *</label>
              <select
                className="form-select"
                value={transferItemId}
                onChange={(e) => setTransferItemId(e.target.value)}
              >
                <option value="">-- Select Item --</option>
                {transferModule === 'tyre' && stockItems?.tyre_items?.map((it) => (
                  <option key={`tyre:${it.id}`} value={it.id}>Auto Tyre: {it.label}</option>
                ))}
                {transferModule === 'cycletyre' && stockItems?.cycletyre_items?.map((it) => (
                  <option key={`cycletyre:${it.id}`} value={it.id}>Cycle Tyre: {it.label}</option>
                ))}
                {transferModule === 'tube' && stockItems?.tube_items?.map((it) => (
                  <option key={`tube:${it.id}`} value={it.id}>Cycle Tube: {it.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setTransferModalInvoice(null)} className="btn" style={{ background: '#e2e8f0', color: '#475569' }}>
                Cancel
              </button>
              <button
                onClick={handleExecuteTransfer}
                className="btn btn-primary"
                style={{ background: '#2563eb' }}
                disabled={transferring}
              >
                {transferring ? 'Transferring...' : 'Execute Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

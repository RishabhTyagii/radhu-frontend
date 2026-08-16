'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function TallyInvoiceDetail() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      const res = await apiGet(`/tallysync/invoice/${params.id}/`);
      if (res) setData(res);
      setLoading(false);
    }
    if (params.id) fetchDetail();
  }, [params.id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '60px' }}>Loading invoice details...</div>
      </>
    );
  }

  if (!data || !data.invoice) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '60px' }}>
          <h2>Invoice Not Found</h2>
          <Link href="/tallysync" className="btn btn-primary" style={{ marginTop: '16px' }}>Back to Sales Summary</Link>
        </div>
      </>
    );
  }

  const { invoice, pending_items = [], logs = [] } = data;
  const items = invoice.items || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="no-print">
        <Navbar />
      </div>

      <div className="container">
        {/* Actions bar */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
          <Link href="/tallysync" className="btn" style={{ background: '#f1f5f9', color: '#475569' }}>
            <i className="fas fa-arrow-left mr-1"></i> Back to Sales Summary
          </Link>
          <button onClick={handlePrint} className="btn btn-primary" style={{ background: '#dc2626' }}>
            <i className="fas fa-print mr-1"></i> Print Tax Invoice
          </button>
        </div>

        {/* Invoice Printable Document Card */}
        <div className="card" style={{ padding: '32px', background: 'white', borderRadius: '12px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>RADHU INDUSTRIES</h1>
              <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>TAX INVOICE / SALES VOUCHER</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563eb', margin: 0 }}>#{invoice.voucher_number}</h2>
              <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>Date: <strong>{invoice.voucher_date}</strong></p>
              <span className={`badge ${invoice.stock_synced ? 'green' : 'red'}`} style={{ marginTop: '6px' }}>
                {invoice.stock_synced ? 'Stock Synced' : 'Sync Pending'}
              </span>
            </div>
          </div>

          {/* Party & Voucher Details Grid */}
          <div className="grid-2" style={{ marginBottom: '24px', gap: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: '#64748b', margin: '0 0 12px' }}>
                <i className="fas fa-user-tie mr-1"></i> Billed To (Party Details)
              </h3>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
                {invoice.party_name || 'N/A'}
              </p>
              <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: '#475569' }}>
                <strong>GSTIN:</strong> {invoice.party_gstin || 'URP / N/A'}
              </p>
              <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: '#475569' }}>
                <strong>Address:</strong> {invoice.party_address || 'N/A'}
              </p>
              <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: '#475569' }}>
                <strong>State:</strong> {invoice.state_name || 'N/A'} | <strong>POS:</strong> {invoice.place_of_supply || 'N/A'}
              </p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>
                <strong>Registration:</strong> {invoice.gst_registration_type || 'Regular'}
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: '#64748b', margin: '0 0 12px' }}>
                <i className="fas fa-shipping-fast mr-1"></i> Consignee & Voucher Details
              </h3>
              {invoice.consignee_name ? (
                <>
                  <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '0.95rem', color: '#0f172a' }}>
                    {invoice.consignee_name}
                  </p>
                  <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: '#475569' }}>
                    <strong>Consignee GSTIN:</strong> {invoice.consignee_gstin || 'N/A'}
                  </p>
                </>
              ) : (
                <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '0.875rem' }}>Same as Billed To</p>
              )}
              <p style={{ margin: '12px 0 4px', fontSize: '0.875rem', color: '#475569' }}>
                <strong>Synced At:</strong> {new Date(invoice.synced_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="table-container" style={{ marginBottom: '24px' }}>
            <table>
              <thead>
                <tr style={{ background: '#1e293b', color: 'white' }}>
                  <th>#</th>
                  <th>ITEM NAME</th>
                  <th style={{ textAlign: 'right' }}>QTY</th>
                  <th style={{ textAlign: 'right' }}>AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.qty}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No line items found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* GST Breakdown & Total */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '320px', background: '#f8fafc', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}>
                <span>Taxable Value</span>
                <span style={{ fontWeight: 600 }}>₹{Number(invoice.taxable_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#16a34a' }}>
                <span>CGST</span>
                <span>₹{Number(invoice.cgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#16a34a' }}>
                <span>SGST</span>
                <span>₹{Number(invoice.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#16a34a' }}>
                <span>IGST</span>
                <span>₹{Number(invoice.igst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: '8px', borderTop: '2px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 800, color: '#2563eb' }}>
                <span>Total Invoice Value</span>
                <span>₹{Number(invoice.total_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Items & Sync Logs (Screen only) */}
        {pending_items.length > 0 && (
          <div className="card no-print" style={{ marginTop: '24px', borderColor: '#fef3c7', background: '#fffbeb' }}>
            <h3 style={{ color: '#92400e', margin: '0 0 12px' }}>
              <i className="fas fa-exclamation-circle mr-1"></i> Pending Line Items for this Invoice
            </h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Qty</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pending_items.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.tally_item_name}</td>
                      <td>{p.qty}</td>
                      <td><span className="badge red">{p.reason_display}</span></td>
                      <td>{p.resolved ? <span className="badge green">Resolved</span> : <span className="badge yellow">Pending</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

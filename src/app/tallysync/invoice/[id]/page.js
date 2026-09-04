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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      const res = await apiGet(`/tallysync/invoice/${params.id}/`);
      if (res) setData(res);
      setLoading(false);
    }
    if (params.id) fetchDetail();
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyVoucher = (vno) => {
    navigator.clipboard.writeText(vno);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b1120', color: '#f8fafc' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }} className="fa-spin">
            <i className="fas fa-circle-notch"></i>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Loading Tax Invoice Details...</h2>
        </div>
      </div>
    );
  }

  if (!data || !data.invoice) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b1120', color: '#f8fafc' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📄</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>Invoice Not Found</h2>
          <p style={{ marginBottom: '24px' }}>This voucher may have been removed or does not exist.</p>
          <Link
            href="/tallysync"
            style={{
              background: '#2563eb',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ← Back to Tally Hub
          </Link>
        </div>
      </div>
    );
  }

  const { invoice, pending_items = [], logs = [] } = data;
  const items = invoice.items || [];

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: '#f8fafc' }}>
      
      {/* Screen Only Navigation Bar */}
      <div className="no-print">
        <Navbar />
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-sheet {
            box-shadow: none !important;
            border: 1px solid #94a3b8 !important;
            margin: 0 !important;
            padding: 24px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Main Full-Screen Layout */}
      <main style={{ padding: '24px 32px 60px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Top Breadcrumb & Action Toolbar */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' }}>
              <Link href="/tallysync" style={{ color: '#60a5fa', textDecoration: 'none' }}>Tally Sales Hub</Link>
              <span>/</span>
              <span style={{ color: '#cbd5e1' }}>Voucher {invoice.voucher_number}</span>
            </div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span>Tax Invoice #{invoice.voucher_number}</span>
              <button
                onClick={() => handleCopyVoucher(invoice.voucher_number)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Copy Voucher Number"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              background: invoice.stock_synced ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${invoice.stock_synced ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: invoice.stock_synced ? '#34d399' : '#f87171',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: invoice.stock_synced ? '#10b981' : '#ef4444' }}></span>
              {invoice.stock_synced ? 'Stock Ledger Synced' : 'Stock Sync Pending'}
            </span>

            <Link
              href="/tallysync"
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#e2e8f0',
                fontWeight: 600,
                fontSize: '0.875rem',
                padding: '10px 18px',
                borderRadius: '10px',
                textDecoration: 'none',
              }}
            >
              ← Back to Hub
            </Link>

            <button
              onClick={handlePrint}
              style={{
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                padding: '10px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)'
              }}
            >
              <i className="fas fa-print"></i> Print Official Invoice
            </button>
          </div>
        </div>

        {/* The Formal Tax Invoice Sheet (High-Contrast White Paper Theme for Real Invoices) */}
        <div
          className="print-sheet"
          style={{
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '32px',
          }}
        >
          {/* Header Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #0f172a',
            paddingBottom: '24px',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <div style={{
                display: 'inline-block',
                background: '#0f172a',
                color: '#ffffff',
                padding: '4px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '8px',
              }}>
                GST TAX INVOICE
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
                RADHU INDUSTRIES
              </h1>
              <p style={{ color: '#475569', margin: '4px 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
              
              </p>
              <p style={{ color: '#64748b', margin: '2px 0 0', fontSize: '0.85rem' }}>
               17/5, MILE STONE, DUHAI MEERUT ROAD  MURAD NAGAR, Ghaziabad, Uttar Pradesh 201206  
              </p>
              <p>GSTIN / UIN  : 09AAEPR4168E1ZJ </p>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px 20px',
              minWidth: '260px',
              textAlign: 'right',
            }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>Invoice Number</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#2563eb', marginBottom: '8px' }}>
                {invoice.voucher_number}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                Invoice Date: <strong style={{ color: '#0f172a' }}>{invoice.voucher_date}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                Voucher Type: <strong style={{ color: '#0f172a' }}>{invoice.voucher_type || 'Sales'}</strong>
              </div>
            </div>
          </div>

          {/* e-Invoice & E-Way Bill Compliance Banner (if available) */}
          {(invoice.irn || invoice.eway_bill_number || invoice.ack_number) && (
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#f8fafc',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '28px',
              border: '1px solid #334155',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <i className="fas fa-shield-alt mr-1"></i> GST e-Invoice & E-Way Bill Details
                </span>
                {invoice.ack_number && (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Ack No: <strong style={{ color: '#ffffff' }}>{invoice.ack_number}</strong> {invoice.ack_date ? `(${invoice.ack_date})` : ''}
                  </span>
                )}
              </div>
              {invoice.irn && (
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', wordBreak: 'break-all', marginBottom: '6px' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>IRN:</span> <span style={{ fontFamily: 'monospace' }}>{invoice.irn}</span>
                </div>
              )}
              {invoice.eway_bill_number && (
                <div style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700 }}>
                  <i className="fas fa-barcode mr-1"></i> E-Way Bill No: {invoice.eway_bill_number} {invoice.eway_bill_date ? `(Date: ${invoice.eway_bill_date})` : ''}
                </div>
              )}
            </div>
          )}

          {/* Party, Shipping & Logistics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '32px',
          }}>
            {/* Bill To */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '18px',
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#2563eb',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <i className="fas fa-building"></i> Details of Receiver / Billed To
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                {invoice.party_name || 'Cash Customer'}
              </div>
              {invoice.party_gstin && (
                <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>GSTIN / UIN:</span> <strong style={{ fontFamily: 'monospace' }}>{invoice.party_gstin}</strong>
                </div>
              )}
              {invoice.party_address && (
                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, marginBottom: '6px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Address:</span> {invoice.party_address} {invoice.party_pincode ? ` - ${invoice.party_pincode}` : ''}
                </div>
              )}
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#475569', marginTop: '6px' }}>
                <div><span style={{ color: '#64748b', fontWeight: 600 }}>State:</span> {invoice.state_name || '—'}</div>
                <div><span style={{ color: '#64748b', fontWeight: 600 }}>Place of Supply:</span> {invoice.place_of_supply || '—'}</div>
              </div>
            </div>

            {/* Consignee / Dispatch */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '18px',
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#10b981',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <i className="fas fa-truck"></i> Details of Consignee / Shipped To
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                {invoice.consignee_name || invoice.party_name || 'Same as Billed To'}
              </div>
              {invoice.consignee_gstin && (
                <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Consignee GSTIN:</span> <strong style={{ fontFamily: 'monospace' }}>{invoice.consignee_gstin}</strong>
                </div>
              )}
              {invoice.consignee_address && (
                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, marginBottom: '6px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Ship-To Address:</span> {invoice.consignee_address} {invoice.consignee_pincode ? ` - ${invoice.consignee_pincode}` : ''}
                </div>
              )}
              <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Registration Type: <strong style={{ color: '#0f172a' }}>{invoice.gst_registration_type || 'Regular'}</strong>
              </div>
            </div>

            {/* Transporter & Logistics Details */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '18px',
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#f59e0b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <i className="fas fa-shipping-fast"></i> Transporter & Logistics
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                {invoice.transporter_name || '— (Direct / Self)'}
              </div>
              {invoice.transporter_id && (
                <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Transporter ID:</span> {invoice.transporter_id}
                </div>
              )}
              {invoice.vehicle_number && (
                <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Vehicle No:</span> <strong style={{ color: '#0f172a' }}>{invoice.vehicle_number}</strong>
                </div>
              )}
              {invoice.lr_number && (
                <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>LR / Doc No:</span> {invoice.lr_number} {invoice.lr_date ? `(${invoice.lr_date})` : ''}
                </div>
              )}
              {invoice.sales_ledger && (
                <div style={{ marginTop: '8px', padding: '4px 8px', background: '#e0f2fe', color: '#0369a1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                  <i className="fas fa-book mr-1"></i> {invoice.sales_ledger}
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div style={{ overflowX: 'auto', marginBottom: '28px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, width: '48px' }}>#</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Description of Goods / Item Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right', width: '120px' }}>Quantity</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right', width: '140px' }}>Rate / Item (₹)</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right', width: '160px' }}>Taxable Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const qty = Number(item.qty || 0);
                  const amt = Number(item.amount || 0);
                  const rate = qty > 0 ? (amt / qty).toFixed(2) : '—';
                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                        <div>{item.name}</div>
                        {item.sales_ledger && (
                          <span style={{
                            display: 'inline-block',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '2px 6px',
                            marginTop: '4px',
                          }}>
                            {item.sales_ledger}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        {qty.toLocaleString('en-IN')} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>pcs</span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#475569', fontWeight: 600 }}>
                        {rate !== '—' ? `₹${Number(rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        ₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}

                {!items.length && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No inventory line items recorded on this voucher.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tax Calculation Summary Box */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '24px',
            borderTop: '2px solid #e2e8f0',
            paddingTop: '24px',
          }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Terms & Supply Conditions
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6 }}>
                  <li>Goods once sold will not be taken back or exchanged.</li>
                  <li>Interest @ 18% p.a. will be charged if payment is not made within due time.</li>
                  <li>Subject to Kannauj (Uttar Pradesh) Jurisdiction only.</li>
                </ul>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div style={{
              width: '360px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem', color: '#475569' }}>
                <span>Subtotal (Taxable Base Value)</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  ₹{Number(invoice.taxable_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {Number(invoice.cgst || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem', color: '#16a34a' }}>
                  <span>CGST (Central GST)</span>
                  <span style={{ fontWeight: 700 }}>+₹{Number(invoice.cgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {Number(invoice.sgst || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem', color: '#16a34a' }}>
                  <span>SGST (State GST)</span>
                  <span style={{ fontWeight: 700 }}>+₹{Number(invoice.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {Number(invoice.igst || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem', color: '#16a34a' }}>
                  <span>IGST (Integrated GST)</span>
                  <span style={{ fontWeight: 700 }}>+₹{Number(invoice.igst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0 0',
                marginTop: '10px',
                borderTop: '2px solid #0f172a',
                fontSize: '1.2rem',
                fontWeight: 900,
                color: '#0f172a',
              }}>
                <span>Total Invoice Value</span>
                <span style={{ color: '#2563eb' }}>
                  ₹{Number(invoice.total_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Authorised Signatory Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '1px dashed #cbd5e1',
          }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Prepared by: <strong>Tally Prime ERP Connector</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '40px' }}>
                For RADHU INDUSTRIES
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid #94a3b8', paddingTop: '4px', minWidth: '180px' }}>
                Authorised Signatory
              </div>
            </div>
          </div>
        </div>

        {/* Screen Only: Pending Items & Sync Logs */}
        {pending_items.length > 0 && (
          <div className="no-print" style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
          }}>
            <h3 style={{ color: '#fbbf24', margin: '0 0 16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-exclamation-circle"></i> Unmapped Line Items on this Voucher
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(30, 41, 59, 0.9)', color: '#94a3b8' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Item Name</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Quantity</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Reason</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pending_items.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{p.tally_item_name}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>{p.qty}</td>
                      <td style={{ padding: '10px 14px', color: '#f87171' }}>{p.reason}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          background: p.resolved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: p.resolved ? '#34d399' : '#fbbf24',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}>
                          {p.resolved ? 'Resolved' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


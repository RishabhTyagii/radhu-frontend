'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

export default function MixingPage() {
  const [selectedMonth, setSelectedMonth] = useState('9');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [data, setData] = useState({ entries: [], totals: {} });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialForm = {
    date: new Date().toISOString().split('T')[0],
    compound: {
      ct: '', cc: '', crt: '', ncc: '', nct: '', nrt: '',
      tar: '', cycle_tube: '', moulding_tube: '', auto_tyre: '',
      lcv_tyre: '', auto_calender: '', tractor: ''
    },
    rubber: {
      ct: '', cc: '', crt: '', ncc: '', nct: '', nrt: '',
      tar: '', cycle_tube: '', moulding_tube: '', auto_tyre: '',
      lcv_tyre: '', auto_calender: '', tractor: ''
    },
    reconciliation: {
      rubber_bdls: ''
    },
    notes: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchSheetData = async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/rawmaterial/mixing/?month=${selectedMonth}&year=${selectedYear}`);
      if (res && res.status === 'success') {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching mixing sheet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheetData();
  }, [selectedMonth, selectedYear]);

  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await apiPost('/rawmaterial/mixing/', formData);
      if (res && (res.ok || res.status === 'success' || res.data?.status === 'success')) {
        setShowModal(false);
        setFormData(initialForm);
        fetchSheetData();
      } else {
        const errorMsg = res?.data?.error || res?.error || 'Failed to save entry';
        alert(errorMsg);
      }
    } catch (err) {
      console.error(err);
      alert('Error saving mixing entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this date entry?')) return;
    try {
      const res = await apiDelete(`/rawmaterial/mixing/${id}/`);
      if (res && (res.ok || res.status === 'success' || res.data?.status === 'success')) {
        fetchSheetData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (entry) => {
    setFormData({
      date: entry.date,
      compound: { ...entry.compound },
      rubber: { ...entry.rubber },
      reconciliation: {
        rubber_bdls: entry.reconciliation.rubber_bdls || ''
      },
      notes: entry.notes || ''
    });
    setShowModal(true);
  };

  // Calculate live modal totals
  const modalCompTotal = Object.entries(formData.compound).reduce((acc, [k, v]) => {
    if (k === 'total') return acc;
    return acc + (parseFloat(v) || 0);
  }, 0);

  const modalRubTotal = Object.entries(formData.rubber).reduce((acc, [k, v]) => {
    if (k === 'total') return acc;
    return acc + (parseFloat(v) || 0);
  }, 0);

  const modalRubKgs = (parseFloat(formData.reconciliation.rubber_bdls) || 0) * 50;
  const modalDiff = modalRubTotal - modalRubKgs;

  const handleExport = () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.radhuerp.site'}/api/rawmaterial/mixing/export-excel/?month=${selectedMonth}&year=${selectedYear}`;
    window.open(url, '_blank');
  };

  const totals = data.totals || {};
  const cb = totals.compound_breakdown || {};
  const rb = totals.rubber_breakdown || {};

  return (
    <>
      <Navbar />
      <div style={{ padding: '24px', maxWidth: '100%', background: '#f8fafc', minHeight: '100vh', fontFamily: 'inherit' }}>
        
        {/* Top Header & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>
              <i className="fas fa-blender" style={{ color: '#0ea5e9', marginRight: '10px' }}></i>
              Compound Mixing &amp; Rubber Sheet
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Daily mixing entries, rubber consumption breakdown, and reconciliation
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Month & Year Filter */}
            <div style={{ display: 'flex', gap: '6px', background: '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ border: 'none', outline: 'none', fontWeight: '600', color: '#334155', background: 'transparent' }}
              >
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{ border: 'none', outline: 'none', fontWeight: '600', color: '#334155', background: 'transparent' }}
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>

            {/* Export Excel */}
            <button
              onClick={handleExport}
              style={{
                background: '#059669',
                color: '#fff',
                padding: '9px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-file-excel"></i> Export Excel
            </button>

            {/* Add Entry */}
            <button
              onClick={() => {
                setFormData(initialForm);
                setShowModal(true);
              }}
              style={{
                background: '#0284c7',
                color: '#fff',
                padding: '9px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-plus"></i> New Daily Entry
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
          <div style={{ background: '#fff', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Compound
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              {(totals.compound_total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>Kgs</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Monthly Mixing Output</div>
          </div>

          <div style={{ background: '#fff', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Rubber Consumption
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              {(totals.rubber_total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>Kgs</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Calculated from Formulas</div>
          </div>

          <div style={{ background: '#fff', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Physical Rubber Issued
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              {(totals.rubber_kgs || 0).toLocaleString('en-IN')} <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>Kgs</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {(totals.rubber_bdls || 0)} Bundles (@ 50 Kg/Bdl)
            </div>
          </div>

          <div style={{
            background: '#fff',
            padding: '18px',
            borderRadius: '10px',
            border: `1px solid ${totals.diff < 0 ? '#fecaca' : '#bbf7d0'}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: totals.diff < 0 ? '#dc2626' : '#16a34a',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Net Difference (Variance)
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: totals.diff < 0 ? '#dc2626' : '#16a34a',
              marginTop: '4px'
            }}>
              {(totals.diff || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} <span style={{ fontSize: '13px', fontWeight: '500' }}>Kgs</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Formula Rubber vs Issued Rubber
            </div>
          </div>
        </div>

        {/* Excel-style Side-by-Side Dual Sheet */}
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #cbd5e1', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '28px', color: '#0ea5e9', marginBottom: '10px' }}></i>
              <div>Loading Mixing &amp; Rubber Sheet...</div>
            </div>
          ) : data.entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <i className="fas fa-folder-open" style={{ fontSize: '32px', color: '#94a3b8', marginBottom: '10px' }}></i>
              <div>No mixing entries found for this month. Click <strong>"New Daily Entry"</strong> to add one.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'right' }}>
              <thead>
                {/* Top Section Headers */}
                <tr style={{ background: '#0f172a', color: '#fff', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  <th colSpan="15" style={{ padding: '8px 12px', textAlign: 'center', borderRight: '2px solid #fff', background: '#0284c7' }}>
                    <i className="fas fa-industry" style={{ marginRight: '6px' }}></i> Compound Mixing (Kgs)
                  </th>
                  <th colSpan="15" style={{ padding: '8px 12px', textAlign: 'center', borderRight: '2px solid #fff', background: '#d97706' }}>
                    <i className="fas fa-recycle" style={{ marginRight: '6px' }}></i> Rubber Consumption (Kgs)
                  </th>
                  <th colSpan="4" style={{ padding: '8px 12px', textAlign: 'center', background: '#059669' }}>
                    <i className="fas fa-balance-scale" style={{ marginRight: '6px' }}></i> Audit &amp; Reconciliation
                  </th>
                </tr>

                {/* Column Headers */}
                <tr style={{ background: '#f1f5f9', color: '#1e293b', fontWeight: '600', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'center', minWidth: '95px' }}>Date</th>
                  <th style={{ padding: '8px 6px' }}>CT</th>
                  <th style={{ padding: '8px 6px' }}>CC</th>
                  <th style={{ padding: '8px 6px' }}>CRT</th>
                  <th style={{ padding: '8px 6px' }}>NCC</th>
                  <th style={{ padding: '8px 6px' }}>NCT</th>
                  <th style={{ padding: '8px 6px' }}>NRT</th>
                  <th style={{ padding: '8px 6px' }}>Tar</th>
                  <th style={{ padding: '8px 6px' }}>Cycle Tube</th>
                  <th style={{ padding: '8px 6px' }}>Moulding</th>
                  <th style={{ padding: '8px 6px' }}>Auto Tyre</th>
                  <th style={{ padding: '8px 6px' }}>LCV</th>
                  <th style={{ padding: '8px 6px' }}>Auto Cal</th>
                  <th style={{ padding: '8px 6px' }}>Tractor</th>
                  <th style={{ padding: '8px 8px', background: '#e0f2fe', color: '#0369a1', fontWeight: '700', borderRight: '2px solid #94a3b8' }}>Total Comp</th>

                  {/* Rubber columns */}
                  <th style={{ padding: '8px 10px', textAlign: 'center', minWidth: '95px' }}>Date</th>
                  <th style={{ padding: '8px 6px' }}>CT</th>
                  <th style={{ padding: '8px 6px' }}>CC</th>
                  <th style={{ padding: '8px 6px' }}>CRT</th>
                  <th style={{ padding: '8px 6px' }}>NCC</th>
                  <th style={{ padding: '8px 6px' }}>NCT</th>
                  <th style={{ padding: '8px 6px' }}>NRT</th>
                  <th style={{ padding: '8px 6px' }}>Tar</th>
                  <th style={{ padding: '8px 6px' }}>Cycle Tube</th>
                  <th style={{ padding: '8px 6px' }}>Moulding</th>
                  <th style={{ padding: '8px 6px' }}>Auto Tyre</th>
                  <th style={{ padding: '8px 6px' }}>LCV</th>
                  <th style={{ padding: '8px 6px' }}>Auto Cal</th>
                  <th style={{ padding: '8px 6px' }}>Tractor</th>
                  <th style={{ padding: '8px 8px', background: '#fef3c7', color: '#b45309', fontWeight: '700', borderRight: '2px solid #94a3b8' }}>Total Rub</th>

                  {/* Reconciliation */}
                  <th style={{ padding: '8px 6px', background: '#f0fdf4' }}>Bdls</th>
                  <th style={{ padding: '8px 6px', background: '#f0fdf4' }}>Rub Kgs</th>
                  <th style={{ padding: '8px 8px', background: '#dcfce7', fontWeight: '700' }}>Diff</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry) => {
                  const comp = entry.compound;
                  const rub = entry.rubber;
                  const rec = entry.reconciliation;
                  const isDiffNegative = rec.diff < 0;

                  return (
                    <tr
                      key={entry.id}
                      style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                      {/* Compound Data */}
                      <td style={{ padding: '7px 8px', textAlign: 'center', fontWeight: '600', color: '#334155' }}>
                        {entry.date}
                      </td>
                      <td style={{ padding: '7px 6px' }}>{comp.ct || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{comp.cc || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{comp.crt || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{comp.ncc || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{comp.nct || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{comp.nrt || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{comp.tar || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{comp.cycle_tube || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{comp.moulding_tube || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{comp.auto_tyre || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{comp.lcv_tyre || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{comp.auto_calender || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{comp.tractor || '-'}</td>
                      <td style={{ padding: '7px 8px', fontWeight: '700', color: '#0284c7', background: '#f0f9ff', borderRight: '2px solid #cbd5e1' }}>
                        {comp.total.toLocaleString()}
                      </td>

                      {/* Rubber Data */}
                      <td style={{ padding: '7px 8px', textAlign: 'center', color: '#64748b' }}>
                        {entry.date}
                      </td>
                      <td style={{ padding: '7px 6px' }}>{rub.ct || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{rub.cc || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{rub.crt || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{rub.ncc || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{rub.nct || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{rub.nrt || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{rub.tar || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{rub.cycle_tube || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{rub.moulding_tube || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{rub.auto_tyre || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{rub.lcv_tyre || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{rub.auto_calender || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{rub.tractor || '-'}</td>
                      <td style={{ padding: '7px 8px', fontWeight: '700', color: '#b45309', background: '#fffbeb', borderRight: '2px solid #cbd5e1' }}>
                        {rub.total.toLocaleString()}
                      </td>

                      {/* Reconciliation */}
                      <td style={{ padding: '7px 6px', background: '#f8fafc', color: '#0f172a' }}>
                        {rec.rubber_bdls || '-'}
                      </td>
                      <td style={{ padding: '7px 6px', background: '#f8fafc', fontWeight: '600' }}>
                        {rec.rubber_kgs.toLocaleString()}
                      </td>
                      <td style={{
                        padding: '7px 8px',
                        fontWeight: '700',
                        color: isDiffNegative ? '#dc2626' : '#16a34a',
                        background: isDiffNegative ? '#fef2f2' : '#f0fdf4'
                      }}>
                        {rec.diff}
                      </td>
                      <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEdit(entry)}
                          title="Edit Entry"
                          style={{ background: 'transparent', border: 'none', color: '#0ea5e9', cursor: 'pointer', marginRight: '6px' }}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          title="Delete Entry"
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Monthly Totals Row */}
                <tr style={{ background: '#f1f5f9', fontWeight: '800', borderTop: '2px solid #94a3b8', borderBottom: '2px solid #94a3b8' }}>
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: '#0f172a' }}>TOTAL</td>
                  <td style={{ padding: '10px 6px' }}>{cb.ct ? cb.ct.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{cb.cc ? cb.cc.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{cb.crt ? cb.crt.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{cb.ncc ? cb.ncc.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{cb.nct ? cb.nct.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{cb.nrt ? cb.nrt.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{cb.tar ? cb.tar.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{cb.cycle_tube ? cb.cycle_tube.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{cb.moulding_tube ? cb.moulding_tube.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{cb.auto_tyre ? cb.auto_tyre.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{cb.lcv_tyre ? cb.lcv_tyre.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{cb.auto_calender ? cb.auto_calender.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{cb.tractor ? cb.tractor.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 8px', color: '#0284c7', background: '#e0f2fe', borderRight: '2px solid #94a3b8' }}>
                    {(totals.compound_total || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                  </td>

                  <td style={{ padding: '10px 8px', textAlign: 'center', color: '#0f172a' }}>TOTAL</td>
                  <td style={{ padding: '10px 6px' }}>{rb.ct ? rb.ct.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{rb.cc ? rb.cc.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{rb.crt ? rb.crt.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{rb.ncc ? rb.ncc.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{rb.nct ? rb.nct.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{rb.nrt ? rb.nrt.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{rb.tar ? rb.tar.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{rb.cycle_tube ? rb.cycle_tube.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{rb.moulding_tube ? rb.moulding_tube.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{rb.auto_tyre ? rb.auto_tyre.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{rb.lcv_tyre ? rb.lcv_tyre.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{rb.auto_calender ? rb.auto_calender.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 6px' }}>{rb.tractor ? rb.tractor.toFixed(1) : '-'}</td>
                  <td style={{ padding: '10px 8px', color: '#b45309', background: '#fef3c7', borderRight: '2px solid #94a3b8' }}>
                    {(totals.rubber_total || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                  </td>

                  <td style={{ padding: '10px 6px', background: '#f0fdf4' }}>{(totals.rubber_bdls || 0)}</td>
                  <td style={{ padding: '10px 6px', background: '#f0fdf4' }}>{(totals.rubber_kgs || 0).toLocaleString()}</td>
                  <td style={{
                    padding: '10px 8px',
                    color: totals.diff < 0 ? '#dc2626' : '#16a34a',
                    background: totals.diff < 0 ? '#fef2f2' : '#dcfce7'
                  }}>
                    {(totals.diff || 0).toFixed(1)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Entry / Edit Modal */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              width: '950px',
              maxWidth: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  <i className="fas fa-blender" style={{ color: '#0284c7', marginRight: '8px' }}></i>
                  Daily Mixing &amp; Rubber Consumption Entry
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Date Picker */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                    Entry Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '220px' }}
                  />
                </div>

                {/* Section 1: Compound Inputs */}
                <div style={{ background: '#f0f9ff', padding: '14px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase' }}>
                      1. Compound Output (Kgs)
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0284c7' }}>
                      Live Compound Total: {modalCompTotal.toFixed(2)} Kg
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {[
                      { key: 'ct', label: 'CT' },
                      { key: 'cc', label: 'CC' },
                      { key: 'crt', label: 'CRT' },
                      { key: 'ncc', label: 'NCC' },
                      { key: 'nct', label: 'NCT' },
                      { key: 'nrt', label: 'NRT' },
                      { key: 'tar', label: 'Air Bag / Tar' },
                      { key: 'cycle_tube', label: 'Cycle Tube' },
                      { key: 'moulding_tube', label: 'Moulding Tube' },
                      { key: 'auto_tyre', label: 'Auto Tyre' },
                      { key: 'lcv_tyre', label: 'LCV Tyre' },
                      { key: 'auto_calender', label: 'Auto Calender' },
                      { key: 'tractor', label: 'Tractor' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#475569', fontWeight: '600', marginBottom: '2px' }}>
                          {label}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.compound[key] || ''}
                          onChange={(e) => handleInputChange('compound', key, e.target.value)}
                          placeholder="0"
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Rubber Inputs */}
                <div style={{ background: '#fffbeb', padding: '14px', borderRadius: '8px', border: '1px solid #fde68a', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase' }}>
                      2. Rubber Consumption (Kgs)
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#b45309' }}>
                      Live Rubber Total: {modalRubTotal.toFixed(2)} Kg
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {[
                      { key: 'ct', label: 'CT Rubber' },
                      { key: 'cc', label: 'CC Rubber' },
                      { key: 'crt', label: 'CRT Rubber' },
                      { key: 'ncc', label: 'NCC Rubber' },
                      { key: 'nct', label: 'NCT Rubber' },
                      { key: 'nrt', label: 'NRT Rubber' },
                      { key: 'tar', label: 'Air Bag / Tar' },
                      { key: 'cycle_tube', label: 'Cycle Tube' },
                      { key: 'moulding_tube', label: 'Moulding Tube' },
                      { key: 'auto_tyre', label: 'Auto Tyre' },
                      { key: 'lcv_tyre', label: 'LCV Tyre' },
                      { key: 'auto_calender', label: 'Auto Calender' },
                      { key: 'tractor', label: 'Tractor' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#475569', fontWeight: '600', marginBottom: '2px' }}>
                          {label}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.rubber[key] || ''}
                          onChange={(e) => handleInputChange('rubber', key, e.target.value)}
                          placeholder="0"
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Reconciliation (Bundles) */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px' }}>
                    3. Rubber Reconciliation (Bundles @ 50 Kg)
                  </div>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: '180px' }}>
                      <label style={{ display: 'block', fontSize: '11px', color: '#475569', fontWeight: '600', marginBottom: '2px' }}>
                        Rubber Bundles Issued
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.reconciliation.rubber_bdls || ''}
                        onChange={(e) => handleInputChange('reconciliation', 'rubber_bdls', e.target.value)}
                        placeholder="e.g. 21"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ padding: '8px 14px', background: '#e2e8f0', borderRadius: '6px', fontSize: '12px' }}>
                      Rubber Kgs: <strong>{modalRubKgs} Kg</strong>
                    </div>
                    <div style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: modalDiff < 0 ? '#fef2f2' : '#f0fdf4',
                      color: modalDiff < 0 ? '#dc2626' : '#16a34a',
                      border: `1px solid ${modalDiff < 0 ? '#fecaca' : '#bbf7d0'}`
                    }}>
                      Net Variance (Diff): {modalDiff.toFixed(2)} Kg
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      background: submitting ? '#94a3b8' : '#0284c7',
                      color: '#fff',
                      fontWeight: '600',
                      cursor: submitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {submitting ? 'Saving...' : 'Save Mixing Entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

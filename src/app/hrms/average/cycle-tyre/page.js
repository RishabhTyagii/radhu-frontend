'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

const s = {
  inp: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#fff' },
  lbl: { display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '5px' },
  card: { background: '#fff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden' },
  th: { padding: '13px 16px', fontSize: '0.73rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', textAlign: 'center', borderBottom: '2px solid #e2e8f0' },
  td: { padding: '12px 16px', fontSize: '0.88rem', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: 600 },
};

const KPI = ({ icon, label, value, color, sub }) => (
  <div style={{ background: '#fff', borderRadius: '14px', padding: '20px 22px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', color, flexShrink: 0 }}>
      <i className={icon} />
    </div>
    <div>
      <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{sub}</div>}
    </div>
  </div>
);

export default function AvgProductionCycleTyre() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [deptId, setDeptId] = useState('');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const today = new Date();
    const thirtyAgo = new Date(today);
    thirtyAgo.setDate(today.getDate() - 30);
    setFromDate(thirtyAgo.toISOString().slice(0, 10));
    setToDate(today.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (fromDate && toDate) fetchData();
  }, [fromDate, toDate, deptId]);

  async function fetchData() {
    setLoading(true);
    let url = `/hrms/avg-production/cycle-tyre/?from_date=${fromDate}&to_date=${toDate}`;
    if (deptId) url += `&department_id=${deptId}`;
    const res = await apiGet(url);
    if (res) {
      setData(res);
      if (res.departments) setDepartments(res.departments);
    }
    setLoading(false);
  }

  const sum = data?.summary || {};
  const rows = data?.daily_data || [];

  return (
    <>
      <Navbar />
      <div style={{ background: 'linear-gradient(135deg,#f0f4ff 0%,#f8fafc 100%)', minHeight: '100vh', padding: '24px 20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                <i className="fas fa-chart-bar" style={{ color: '#6366f1', marginRight: '10px' }} />
                Cycle Tyre — Avg Production
              </h1>
              <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.88rem' }}>
                Daily manpower, overtime & per-person production analysis
              </p>
            </div>
          </div>

          {/* Filters */}
          <div style={{ ...s.card, padding: '20px 24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '160px' }}>
                <label style={s.lbl}>From Date</label>
                <input type="date" style={s.inp} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div style={{ minWidth: '160px' }}>
                <label style={s.lbl}>To Date</label>
                <input type="date" style={s.inp} value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <div style={{ minWidth: '200px' }}>
                <label style={s.lbl}>Department</label>
                <select style={s.inp} value={deptId} onChange={(e) => setDeptId(e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <button onClick={fetchData}
                style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', height: '42px' }}>
                <i className="fas fa-sync-alt" style={{ marginRight: '6px' }} />Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8', fontSize: '1.1rem' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '12px', display: 'block' }} />
              Loading...
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <KPI icon="fas fa-users" label="Avg Man Power" value={sum.avg_man_power || 0} color="#3b82f6" sub={`${sum.working_days || 0} working days`} />
                <KPI icon="fas fa-clock" label="Total OT Hours" value={sum.total_ot || 0} color="#f59e0b" sub="Overtime hours in period" />
                <KPI icon="fas fa-user-clock" label="Avg Time (Equiv)" value={sum.avg_avg_time || 0} color="#8b5cf6" sub="Avg equivalent manpower" />
                <KPI icon="fas fa-industry" label="Total Production" value={(sum.total_production || 0).toLocaleString()} color="#10b981" sub={`${sum.avg_daily_production || 0} avg/day`} />
                <KPI icon="fas fa-chart-line" label="Avg Production" value={sum.overall_avg_production || 0} color="#ef4444" sub="Per person per day" />
              </div>

              {/* Table */}
              <div style={s.card}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    <i className="fas fa-table" style={{ color: '#6366f1', marginRight: '8px' }} />
                    Daily Breakdown
                  </h2>
                  <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.78rem' }}>
                    {rows.length} days
                  </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ ...s.th, textAlign: 'left', paddingLeft: '24px' }}>Date</th>
                        <th style={s.th}>Day</th>
                        <th style={s.th}>
                          <div>Man Power</div>
                          <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, textTransform: 'none' }}>Workers Present</div>
                        </th>
                        <th style={s.th}>
                          <div>OT</div>
                          <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, textTransform: 'none' }}>Overtime Hours</div>
                        </th>
                        <th style={s.th}>
                          <div>Avg Time</div>
                          <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, textTransform: 'none' }}>(MP×8+OT)÷8</div>
                        </th>
                        <th style={s.th}>
                          <div>Production</div>
                          <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, textTransform: 'none' }}>All Curing</div>
                        </th>
                        <th style={s.th}>
                          <div>Avg Prod</div>
                          <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, textTransform: 'none' }}>Prod÷AvgTime</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => {
                        const isZero = r.man_power === 0 && r.production === 0;
                        const bgColor = isZero ? '#fefce8' : (i % 2 === 0 ? '#fff' : '#fafbfc');
                        return (
                          <tr key={r.date} style={{ background: bgColor }}>
                            <td style={{ ...s.td, textAlign: 'left', paddingLeft: '24px', fontWeight: 800, color: '#1e293b' }}>
                              {new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td style={{ ...s.td, color: r.day === 'Sun' ? '#ef4444' : '#64748b', fontWeight: r.day === 'Sun' ? 800 : 600 }}>{r.day}</td>
                            <td style={{ ...s.td, color: '#3b82f6', fontWeight: 800, fontSize: '1rem' }}>{r.man_power}</td>
                            <td style={{ ...s.td, color: r.ot > 0 ? '#f59e0b' : '#cbd5e1', fontWeight: r.ot > 0 ? 800 : 500 }}>{r.ot}</td>
                            <td style={{ ...s.td, color: '#8b5cf6', fontWeight: 800 }}>{r.avg_time}</td>
                            <td style={{ ...s.td, color: '#10b981', fontWeight: 900, fontSize: '1rem' }}>{r.production.toLocaleString()}</td>
                            <td style={{
                              ...s.td,
                              fontWeight: 900,
                              fontSize: '1.05rem',
                              color: r.avg_production >= 150 ? '#10b981' : r.avg_production >= 100 ? '#3b82f6' : r.avg_production > 0 ? '#f59e0b' : '#cbd5e1'
                            }}>
                              {r.avg_production}
                            </td>
                          </tr>
                        );
                      })}
                      {/* Totals/Avg Row */}
                      {rows.length > 0 && (
                        <tr style={{ background: '#f0f4ff', borderTop: '3px solid #6366f1' }}>
                          <td style={{ ...s.td, textAlign: 'left', paddingLeft: '24px', fontWeight: 900, color: '#0f172a', fontSize: '0.9rem' }} colSpan={2}>
                            PERIOD AVERAGE
                          </td>
                          <td style={{ ...s.td, fontWeight: 900, color: '#3b82f6', fontSize: '1.05rem' }}>{sum.avg_man_power}</td>
                          <td style={{ ...s.td, fontWeight: 900, color: '#f59e0b', fontSize: '1.05rem' }}>{sum.total_ot}</td>
                          <td style={{ ...s.td, fontWeight: 900, color: '#8b5cf6', fontSize: '1.05rem' }}>{sum.avg_avg_time}</td>
                          <td style={{ ...s.td, fontWeight: 900, color: '#10b981', fontSize: '1.05rem' }}>{(sum.total_production || 0).toLocaleString()}</td>
                          <td style={{ ...s.td, fontWeight: 900, color: '#ef4444', fontSize: '1.15rem' }}>{sum.overall_avg_production}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {rows.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                      <i className="fas fa-inbox" style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'block' }} />
                      No data found for selected filters
                    </div>
                  )}
                </div>
              </div>

              {/* Formula Explanation */}
              <div style={{ ...s.card, padding: '20px 24px', marginTop: '20px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 800, color: '#475569' }}>
                  <i className="fas fa-info-circle" style={{ color: '#6366f1', marginRight: '8px' }} />
                  Formula Guide
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {[
                    { col: 'Man Power', formula: 'Total workers present on that day (Present + Half Day + Late)', icon: 'fa-users', color: '#3b82f6' },
                    { col: 'OT', formula: 'Sum of overtime hours for all present workers', icon: 'fa-clock', color: '#f59e0b' },
                    { col: 'Avg Time', formula: '(Man Power × 8 + OT) ÷ 8 → Equivalent full-shift workers', icon: 'fa-user-clock', color: '#8b5cf6' },
                    { col: 'Production', formula: 'Sum of All Curing from Cycle Tyre entries', icon: 'fa-industry', color: '#10b981' },
                    { col: 'Avg Production', formula: 'Production ÷ Avg Time → Per-person output', icon: 'fa-chart-line', color: '#ef4444' },
                  ].map((f) => (
                    <div key={f.col} style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 800, color: f.color, fontSize: '0.82rem', marginBottom: '4px' }}>
                        <i className={`fas ${f.icon}`} style={{ marginRight: '6px' }} />{f.col}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{f.formula}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

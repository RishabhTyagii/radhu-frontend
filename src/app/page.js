'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';

const MODULE_COLORS = {
  'Auto Tyre':          { accent: '#2563eb', light: '#EFF6FF', icon: 'fa-car-side' },
  'Cycle Tyre':         { accent: '#7c3aed', light: '#F5F3FF', icon: 'fa-bicycle' },
  'Cycle Tube':         { accent: '#0891b2', light: '#ECFEFF', icon: 'fa-life-ring' },
  'Tally Sync':         { accent: '#059669', light: '#ECFDF5', icon: 'fa-file-invoice-dollar' },
  'HRMS & Payroll':     { accent: '#d97706', light: '#FFFBEB', icon: 'fa-users' },
  'Order Booking':      { accent: '#dc2626', light: '#FEF2F2', icon: 'fa-box' },
  'Admin Orders & Sales':{ accent: '#9333ea', light: '#FAF5FF', icon: 'fa-tasks' },
  'User Management':    { accent: '#475569', light: '#F8FAFC', icon: 'fa-cog' },
  'RADHU AI':           { accent: '#0ea5e9', light: '#F0F9FF', icon: 'fa-robot' },
};

export default function Home() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const data = await apiGet('/auth/me/');
      if (data && data.authenticated && data.user) {
        setUserData(data.user);
      } else {
        router.push('/login');
      }
    }
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await apiPost('/auth/logout/', {});
    router.push('/login');
  };

  if (!userData) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '4px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>Loading workspace...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isAllowed = (key) => userData.is_superuser || userData.permissions?.includes(key);

  const modulesList = [
    {
      title: 'Auto Tyre',
      description: 'Production, dispatch, adjustments, monthly reports & daily summary',
      path: '/stock',
      features: ['Stock Dashboard', 'Production Entry', 'Dispatch / Sale', 'Monthly Report', 'Production Sheet', 'Daily Summary'],
      keys: ['dashboard', 'add_tyre', 'add_production', 'add_dispatch', 'add_adjustment', 'entries_log', 'monthly_report', 'production_sheet', 'daily_summary'],
    },
    {
      title: 'Cycle Tyre',
      description: '1st/2nd/RFM grade production, bucket-wise sales & compound summary',
      path: '/cycletyres',
      features: ['Tyre Dashboard', 'Production (Curing)', '2nd Grade Stock', 'Bucket-wise Sale', 'Monthly Report', 'Daily Summary'],
      keys: ['cycletyre_dashboard', 'cycletyre_add_item', 'cycletyre_add_production', 'cycletyre_add_sale', 'cycletyre_add_adjustment', 'cycletyre_entries_log', 'cycletyre_monthly_report', 'cycletyre_daily_summary'],
    },
    {
      title: 'Cycle Tube',
      description: 'Quality-grade production, sales, adjustments & inventory summary',
      path: '/cycletube',
      features: ['Tube Dashboard', 'Production (Quality)', 'Sale Entry', 'Monthly Report', 'Daily Summary', 'Stock Adjustment'],
      keys: ['tube_dashboard', 'tube_add_item', 'tube_add_production', 'tube_add_sale', 'tube_add_adjustment', 'tube_entries_log', 'tube_monthly_report', 'tube_production_summary'],
    },
    {
      title: 'Tally Sync',
      description: 'Automated Tally Prime integration — auto stock deduction & GST sync',
      path: '/tallysync',
      features: ['Sales & GST Summary', 'Party/GST Breakup', 'Item Mappings', 'Auto Stock Deduction', 'Print Tax Invoice', 'Sync Logs'],
      keys: ['tally_sales_summary', 'tally_mapping_list', 'tally_sync_log', 'tally_map_pending_item'],
    },
    {
      title: 'HRMS & Payroll',
      description: 'Employee directory, attendance, piece-rate production & salary engine',
      path: '/hrms',
      features: ['Employee Directory', 'Daily Attendance', 'Worker Piece Production', 'Salary Engine', 'Print Payslips', 'Departments'],
      keys: ['hr_dashboard', 'employee_list', 'attendance_list', 'bulk_attendance', 'production_list', 'salary_list'],
    },
    {
      title: 'Order Booking',
      description: 'Multi-item customer orders across Auto Tyre, Cycle Tube & Cycle Tyre',
      path: '/orders',
      features: ['Book Multi-Item Orders', 'Live Stock Catalog', 'Customer Parties', 'My Orders List'],
      keys: ['my_orders', 'create_order', 'order_detail', 'import_orders'],
    },
    {
      title: 'Admin Orders & Sales',
      description: 'Master control — category summaries & employee sales performance',
      path: '/orders/all',
      features: ['All Orders Master View', 'Category Breakdown', 'Employee Sales Stats', 'Status Control'],
      keys: ['admin_orders'],
    },
    {
      title: 'User Management',
      description: 'User creation, password management & module-level access control',
      path: '/users',
      features: ['User Directory', 'Role Levels', 'Module Access', 'Page Permissions', 'Password Manager'],
      keys: ['manage_users', 'create_user', 'edit_user'],
    },
    {
      title: 'RADHU AI',
      description: 'AI ERP assistant — stock queries, data analysis & workflow automation',
      path: '/ai-agent',
      features: ['Data Analysis', 'Stock Status', 'Audit Logs', 'Automated Workflows'],
      keys: ['ai_agent'],
      alwaysShow: true,
    },
  ];

  const visibleModules = modulesList.filter(
    (m) => m.alwaysShow || m.keys.some((k) => isAllowed(k))
  );

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* ── TOP CORPORATE BRANDING BAR (REPLACED NAVBAR) ── */}
      <header style={{
        background: '#0f172a',
        borderBottom: '1px solid #1e293b',
        padding: '14px 32px',
        color: '#ffffff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1400, margin: '0 auto' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(37,99,235,0.4)' }}>
              <i className="fas fa-industry" style={{ color: '#ffffff', fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.04em', lineHeight: 1.1 }}>
                RADHU <span style={{ color: '#38bdf8', fontSize: '0.9em', fontWeight: 700 }}>ERP</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.02em', marginTop: 2 }}>
                Radhu Rubber Industries &middot; Enterprise Portal
              </div>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {userData.is_superuser && (
              <a
                href="https://api.radhuerp.site/admin/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = '#475569'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#334155'; }}
              >
                <i className="fas fa-database" style={{ fontSize: '0.75rem' }} />
                <span>Django Admin</span>
                <i className="fas fa-external-link-alt" style={{ fontSize: '0.6rem', opacity: 0.6 }} />
              </a>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12, borderLeft: '1px solid #334155' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: '#2563eb', color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.85rem',
              }}>
                {userData.username?.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
                  {userData.username}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  {userData.is_superuser ? 'Super Admin' : 'Staff User'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = '#f87171'; }}
              title="Logout from ERP"
            >
              <i className="fas fa-sign-out-alt" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── WORKSPACE SUB-HEADER ── */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-th-large" style={{ color: '#2563eb', fontSize: 13 }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Main System Modules
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{today}</span>
            <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
              {visibleModules.length} Modules Available
            </span>
          </div>
        </div>
      </div>

      {/* ── MODULE CARDS GRID ── */}
      <main style={{ flex: 1, maxWidth: 1400, margin: '0 auto', width: '100%', padding: '28px 32px', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {visibleModules.map((mod) => {
            const c = MODULE_COLORS[mod.title] || { accent: '#2563eb', light: '#EFF6FF', icon: 'fa-cube' };
            return (
              <div
                key={mod.path}
                onClick={() => router.push(mod.path)}
                style={{
                  background: 'white',
                  borderRadius: 14,
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.18s, transform 0.18s, border-color 0.18s',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 10px 28px rgba(15,23,42,0.08)`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = c.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                {/* Accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: c.accent }} />

                <div>
                  {/* Icon + Title */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: c.light,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <i className={`fas ${c.icon}`} style={{ fontSize: 18, color: c.accent }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                        {mod.title}
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  {/* Feature tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18, marginTop: 14 }}>
                    {mod.features.map((f) => (
                      <span
                        key={f}
                        style={{
                          background: '#f8fafc',
                          color: '#334155',
                          border: '1px solid #e2e8f0',
                          padding: '3px 9px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 14, borderTop: '1px solid #f1f5f9',
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: c.accent, display: 'flex', alignItems: 'center', gap: 6 }}>
                    Access Module
                  </span>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: c.light,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="fas fa-arrow-right" style={{ fontSize: 10, color: c.accent }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {visibleModules.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
            <i className="fas fa-lock" style={{ fontSize: 40, marginBottom: 16, display: 'block' }} />
            <p style={{ fontSize: '1rem', fontWeight: 700 }}>No modules available for your access level.</p>
            <p style={{ fontSize: '0.85rem' }}>Contact your administrator to request access.</p>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '0.75rem', background: '#ffffff' }}>
        Radhu Rubber Industries ERP &nbsp;&middot;&nbsp; All rights reserved
      </footer>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiGet } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

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
    
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [router]);

  if (!userData) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ padding: '24px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          Loading system resources...
        </div>
      </div>
    );
  }

  // Check permissions (Superusers see everything, standard users see based on their roles)
  const isAllowed = (key) => userData.is_superuser || userData.permissions?.includes(key);

  const modulesList = [
    {
      title: 'Auto Tyre',
      icon: <i className="fas fa-car-side"></i>,
      description: 'Auto tyre stock management — production, dispatch, adjustments, reports & daily summary',
      path: '/stock',
      color: '#0f172a',
      features: ['Stock Dashboard', 'Production Entry', 'Dispatch / Sale', 'Monthly Report', 'Production Sheet', 'Daily Summary'],
      keys: ['dashboard', 'add_tyre', 'add_production', 'add_dispatch', 'add_adjustment', 'entries_log', 'monthly_report', 'production_sheet', 'daily_summary'],
    },
    {
      title: 'Cycle Tube',
      icon: <i className="fas fa-life-ring"></i>,
      description: 'Cycle tube inventory — production with quality grades, sales, adjustments & daily summary',
      path: '/cycletube',
      color: '#0f172a',
      features: ['Tube Dashboard', 'Production (Quality)', 'Sale Entry', 'Monthly Report', 'Daily Summary', 'Stock Adjustment'],
      keys: ['tube_dashboard', 'tube_add_item', 'tube_add_production', 'tube_add_sale', 'tube_add_adjustment', 'tube_entries_log', 'tube_monthly_report', 'tube_production_summary'],
    },
    {
      title: 'Cycle Tyre',
      icon: <i className="fas fa-bicycle"></i>,
      description: 'Cycle tyre stock — 1st/2nd/RFM grade production, bucket-wise sales & compound summary',
      path: '/cycletyres',
      color: '#0f172a',
      features: ['Tyre Dashboard', 'Production (Curing)', '2nd Grade Stock', 'Bucket-wise Sale', 'Monthly Report', 'Daily Summary'],
      keys: ['cycletyre_dashboard', 'cycletyre_add_item', 'cycletyre_add_production', 'cycletyre_add_sale', 'cycletyre_add_adjustment', 'cycletyre_entries_log', 'cycletyre_monthly_report', 'cycletyre_daily_summary'],
    },
    {
      title: 'Tally Sync',
      icon: <i className="fas fa-file-invoice-dollar"></i>,
      description: 'Automated Tally Prime sales & GST integration — auto stock deduction, item mappings & sync logs',
      path: '/tallysync',
      color: '#0f172a',
      features: ['Sales & GST Summary', 'Party/GST Breakup', 'Item Mappings', 'Automatic Stock Deduction', 'Print Tax Invoice', 'Sync Logs'],
      keys: ['tally_sales_summary', 'tally_mapping_list', 'tally_sync_log', 'tally_map_pending_item'],
    },
    {
      title: 'HRMS & Payroll',
      icon: <i className="fas fa-users"></i>,
      description: 'Human resource & payroll management — employee directory, attendance, piece-rate production & salary engine',
      path: '/hrms',
      color: '#0f172a',
      features: ['Employee Directory', 'Daily Attendance Sheet', 'Worker Piece Production', 'Automated Salary Engine', 'Print Payslips', 'Departments'],
      keys: ['hr_dashboard', 'employee_list', 'attendance_list', 'bulk_attendance', 'production_list', 'salary_list'],
    },
    {
      title: 'Order Booking',
      icon: <i className="fas fa-box"></i>,
      description: 'Multi-item customer order booking across Auto Tyre, Cycle Tube & Cycle Tyre with live stock availability',
      path: '/orders',
      color: '#0f172a',
      features: ['Book Multi-Item Orders', 'Live Stock Catalog', 'Customer Parties', 'My Orders List'],
      keys: ['my_orders', 'create_order', 'order_detail', 'import_orders'],
    },
    {
      title: 'Admin Orders & Sales',
      icon: <i className="fas fa-tasks"></i>,
      description: 'Master control panel — category summaries (Auto Tyre, Cycle Tube, Cycle Tyre) & employee sales performance',
      path: '/orders/all',
      color: '#0f172a',
      features: ['All Orders Master View', 'Category Breakdown', 'Employee Sales Stats', 'Status Change Control'],
      keys: ['admin_orders'],
    },
    {
      title: 'User Management',
      icon: <i className="fas fa-cog"></i>,
      description: 'System user creation, password management & module-level page access permissions control',
      path: '/users',
      color: '#0f172a',
      features: ['User Directory', 'Role Levels (Superuser / User)', 'Module Access Checkboxes', 'Granular Page Permissions', 'Password Manager', 'Live Search'],
      keys: ['manage_users', 'create_user', 'edit_user'],
    },
    {
      title: 'RADHU AI',
      icon: <i className="fas fa-robot"></i>,
      description: 'AI ERP assistant — stock queries, data analysis, and secure workflow automation',
      path: '/ai-agent',
      color: '#0f172a',
      features: ['Data Analysis', 'Stock Status', 'Audit Logs', 'Automated Workflows'],
      keys: ['ai_agent'],
      alwaysShow: true,
    }
  ];

  const visibleModules = modulesList.filter((m) => m.alwaysShow || m.keys.some(k => isAllowed(k)));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ 
        flex: 1,
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        padding: isMobile ? '20px 16px' : '40px 24px',
      }}>
        
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>System Modules</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Select a module below to access its dashboard and tools.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px',
        }}>
          {visibleModules.map((mod) => (
            <div
              key={mod.path}
              onClick={() => router.push(mod.path)}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                }}>
                  {mod.icon}
                </div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>
                  {mod.title}
                </h2>
              </div>

              <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 20px 0', flex: 1 }}>
                {mod.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', color: '#2563eb', fontSize: '0.85rem', fontWeight: 500 }}>
                Open Module <i className="fas fa-arrow-right" style={{ marginLeft: '6px', fontSize: '0.75rem' }}></i>
              </div>
            </div>
          ))}
          
          {!visibleModules.length && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <p style={{ color: '#64748b', margin: 0 }}>No modules available for your access level.</p>
            </div>
          )}
        </div>

      </main>
      
      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '20px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>© {new Date().getFullYear()} Radhu ERP System. All rights reserved.</p>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>System Status: <span style={{ color: '#10b981', fontWeight: 500 }}>Online</span></div>
        </div>
      </footer>
    </div>
  );
}
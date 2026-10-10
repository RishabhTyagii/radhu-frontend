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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8', fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <Navbar />

      {/* DJANGO ADMIN HEADER */}
      <div style={{ backgroundColor: '#417690', padding: '10px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'normal' }}>Radhu Industries ERP</h1>
        <span style={{ fontSize: '12px', color: '#c4dce8' }}>System Status: Online</span>
      </div>

      {/* BREADCRUMB */}
      <div style={{ padding: '8px 20px', backgroundColor: '#79aec8', color: '#fff', fontSize: '12px' }}>
        Home &rsaquo; System Modules
      </div>

      <main style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>

        <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
          Select a module to access its dashboard and tools.
        </p>

        {/* MODULE TABLE (BIOS/Admin style) */}
        <div style={{ border: '1px solid #ccc', backgroundColor: '#fff' }}>
          <div style={{ backgroundColor: '#417690', padding: '6px 12px', color: '#fff', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            AVAILABLE MODULES — {visibleModules.length} found
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#efefef', borderBottom: '1px solid #ccc' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderRight: '1px solid #ccc', width: '32px' }}></th>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Module</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderRight: '1px solid #ccc' }}>Description</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Key Features</th>
              </tr>
            </thead>
            <tbody>
              {visibleModules.map((mod, idx) => (
                <tr
                  key={mod.path}
                  onClick={() => router.push(mod.path)}
                  style={{ borderBottom: '1px solid #eee', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8f0f7'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#fafafa'; }}
                >
                  <td style={{ padding: '10px 12px', borderRight: '1px solid #eee', color: '#417690', fontSize: '16px', textAlign: 'center' }}>
                    {mod.icon}
                  </td>
                  <td style={{ padding: '10px 12px', borderRight: '1px solid #eee', fontWeight: 'bold', color: '#003b5c', whiteSpace: 'nowrap' }}>
                    {mod.title}
                  </td>
                  <td style={{ padding: '10px 12px', borderRight: '1px solid #eee', color: '#555', lineHeight: 1.4 }}>
                    {mod.description}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {mod.features.map((f) => (
                        <span key={f} style={{ display: 'inline-block', backgroundColor: '#e8f0f7', border: '1px solid #c4dce8', color: '#003b5c', padding: '2px 7px', fontSize: '11px', borderRadius: '3px' }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {!visibleModules.length && (
                <tr>
                  <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No modules available for your access level.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '20px', fontSize: '11px', color: '#999', textAlign: 'right' }}>
          &copy; {new Date().getFullYear()} Radhu Industries ERP
        </div>
      </main>
    </div>
  );
}


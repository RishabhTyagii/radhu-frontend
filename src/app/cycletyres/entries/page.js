"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Navbar from "@/components/Navbar";
import { apiGet, apiPost } from "@/lib/api";

export default function CycleTyresEntries() {
  const [entries, setEntries] = useState([]);
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const [filters, setFilters] = useState({
    date: "",
    month: "",
    entry_type: "",
    tyre_item: "",
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchItems();
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [filters]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchItems() {
    const res = await apiGet("/cycletyres/dashboard/");
    if (res && res.items) setItems(res.items);
  }

  async function fetchEmployees() {
    const res = await apiGet("/hrms/employees/?status=Active");
    if (res) {
      setEmployees(res.filter(e => (e.department_name || "").toLowerCase().includes("cycle press")));
    }
  }

  async function fetchEntries() {
    setLoading(true);
    let query = "?";
    if (filters.entry_type) query += `entry_type=${filters.entry_type}&`;
    if (filters.date) query += `date=${filters.date}&`;
    else if (filters.month) query += `month=${filters.month}&`;
    if (filters.tyre_item) query += `tyre_item=${filters.tyre_item}&`;

    const data = await apiGet(`/cycletyres/entries/${query}`);
    if (data) setEntries(data);
    setLoading(false);
  }

  async function updateEmployee(entryId, empId) {
    const rate = localStorage.getItem("ct_prod_rates") ? JSON.parse(localStorage.getItem("ct_prod_rates"))[`${empId}_${entries.find(e => e.id === entryId)?.tyre_item}`] : "";
    const res = await apiPost(`/cycletyres/production/${entryId}/employee/`, { employee_id: empId, rate });
    if (res && res.ok) {
      fetchEntries();
    } else {
      alert("Failed to update employee: " + (res?.data?.error || "Unknown error"));
    }
  }

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((t) => {
      const name = `${t.size || ""} ${t.box_type || ""} ${t.material || ""} ${t.brand || ""}`.toLowerCase();
      return name.includes(q);
    });
  }, [items, searchQuery]);

  const selectedItemObject = useMemo(() => {
    if (!filters.tyre_item) return null;
    return items.find((t) => String(t.id) === String(filters.tyre_item));
  }, [filters.tyre_item, items]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === "date" && value) {
      setFilters({ ...filters, date: value, month: "" });
    } else if (name === "month" && value) {
      setFilters({ ...filters, month: value, date: "" });
    } else {
      setFilters({ ...filters, [name]: value });
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "production": return <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: "12px", fontWeight: "bold", fontSize: "12px" }}>Production</span>;
      case "sale": return <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 8px", borderRadius: "12px", fontWeight: "bold", fontSize: "12px" }}>Sale</span>;
      case "adjustment": return <span style={{ background: "#f3e8ff", color: "#7c3aed", padding: "4px 8px", borderRadius: "12px", fontWeight: "bold", fontSize: "12px" }}>Adjustment</span>;
      default: return <span>{type}</span>;
    }
  };

  return (
    <>
      <style>{`
        body, html { margin: 0; padding: 0; background: #f8fafc; }
        .hover-nav-area { position: fixed; top: 0; left: 0; right: 0; height: 18px; z-index: 999; }
        .hover-navbar { position: fixed; top: -70px; left: 0; right: 0; transition: top 0.3s ease; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .hover-nav-area:hover + .hover-navbar, .hover-navbar:hover { top: 0; }
        footer { display: none !important; }
        
        .fullscreen-container { padding: 40px 20px 20px; max-width: 100%; box-sizing: border-box; }
        .glass-card { background: white; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); border: 1px solid #e2e8f0; margin-bottom: 20px; }
        
        .page-title { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0 0 20px 0; }
        
        .filter-toolbar { display: flex; flex-wrap: wrap; gap: 15px; padding: 20px; background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; align-items: flex-end; }
        .filter-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 180px; }
        .filter-group label { font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .filter-input { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; font-weight: 600; color: #1e293b; outline: none; transition: all 0.2s; }
        .filter-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        
        /* Custom Dropdown */
        .custom-dropdown-container { position: relative; }
        .custom-dropdown-btn { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer; text-align: left; font-size: 0.9rem; font-weight: 600; color: #1e293b; transition: all 0.2s; }
        .custom-dropdown-btn:hover { border-color: #94a3b8; }
        .custom-dropdown-menu { position: absolute; top: calc(100% + 5px); left: 0; width: 100%; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 100; max-height: 300px; display: flex; flex-direction: column; overflow: hidden; }
        .custom-dropdown-search { padding: 10px; border-bottom: 1px solid #f1f5f9; }
        .custom-dropdown-search input { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; outline: none; font-size: 0.85rem; box-sizing: border-box; }
        .custom-dropdown-list { overflow-y: auto; flex: 1; }
        .custom-dropdown-item { padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #f8fafc; font-size: 0.85rem; transition: background 0.1s; display: flex; justify-content: space-between; align-items: center; }
        .custom-dropdown-item:hover { background: #f1f5f9; }
        .custom-dropdown-item.selected { background: #eff6ff; color: #1d4ed8; font-weight: bold; }
        
        .modern-table-container { overflow-x: auto; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; }
        .modern-table { width: 100%; border-collapse: collapse; }
        .modern-table th { background: #f8fafc; padding: 14px 20px; text-align: left; font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
        .modern-table td { padding: 14px 20px; font-size: 0.9rem; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .modern-table tr:hover td { background: #f8fafc; }
        
        .emp-select { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8rem; font-weight: 600; outline: none; cursor: pointer; width: 150px; }
        .emp-select:focus { border-color: #3b82f6; }
      `}</style>

      <div className="hover-nav-area"></div>
      <div className="hover-navbar">
        <Navbar />
      </div>

      <div className="fullscreen-container">
        <h1 className="page-title">🚴 Cycle Tyre Entries</h1>

        <div className="glass-card">
          <div className="filter-toolbar">
            <div className="filter-group">
              <label>Date</label>
              <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="filter-input" />
            </div>
            <div className="filter-group" style={{ maxWidth: '40px', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', marginTop: '15px' }}>OR</span>
            </div>
            <div className="filter-group">
              <label>Month</label>
              <input type="month" name="month" value={filters.month} onChange={handleFilterChange} className="filter-input" />
            </div>
            
            <div className="filter-group">
              <label>Entry Type</label>
              <select name="entry_type" value={filters.entry_type} onChange={handleFilterChange} className="filter-input">
                <option value="">All Types</option>
                <option value="production">Production</option>
                <option value="sale">Sale / Dispatch</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>

            <div className="filter-group" style={{ flex: 1.5 }}>
              <label>Search & Filter Item</label>
              <div className="custom-dropdown-container" ref={dropdownRef}>
                <div 
                  className="custom-dropdown-btn" 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{ borderColor: isDropdownOpen ? '#3b82f6' : '#cbd5e1', boxShadow: isDropdownOpen ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none' }}
                >
                  <span style={{ color: selectedItemObject ? '#0f172a' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedItemObject 
                      ? `${selectedItemObject.size} ${selectedItemObject.box_type} ${selectedItemObject.brand}`
                      : 'Select Tyre Item...'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>▼</span>
                </div>
                
                {isDropdownOpen && (
                  <div className="custom-dropdown-menu">
                    <div className="custom-dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Type to search tyre..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="custom-dropdown-list">
                      <div 
                        className={`custom-dropdown-item ${!filters.tyre_item ? 'selected' : ''}`}
                        onClick={() => { setFilters({...filters, tyre_item: ''}); setIsDropdownOpen(false); }}
                      >
                        <span>All Items</span>
                      </div>
                      {filteredItems.map(t => (
                        <div 
                          key={t.id} 
                          className={`custom-dropdown-item ${String(filters.tyre_item) === String(t.id) ? 'selected' : ''}`}
                          onClick={() => { setFilters({...filters, tyre_item: t.id}); setIsDropdownOpen(false); }}
                        >
                          <div>
                            <span style={{ fontWeight: 700, color: '#1e293b' }}>{t.size}</span>
                            <span style={{ margin: '0 6px', color: '#64748b' }}>{t.box_type} {t.material}</span>
                            <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{t.brand}</span>
                          </div>
                        </div>
                      ))}
                      {filteredItems.length === 0 && (
                        <div style={{ padding: '15px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No items found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="modern-table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontWeight: 600 }}>Loading entries...</div>
            ) : (
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Tyre Item</th>
                    <th>Type</th>
                    <th>Bucket</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th>Worker / Employee</th>
                    <th>Bill / Reference</th>
                    <th>Remark</th>
                    <th>User</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{item.date}</td>
                      <td>
                        {item.tyre_item_detail ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#1d4ed8' }}>{item.tyre_item_detail.size}</span>
                            <span style={{ color: '#475569', fontSize: '0.85rem' }}>{item.tyre_item_detail.box_type} {item.tyre_item_detail.material}</span>
                            <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{item.tyre_item_detail.brand}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td>{getTypeBadge(item.entry_type)}</td>
                      <td>{item.bucket ? <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>{item.bucket}</span> : '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 900, color: '#0f172a', fontSize: '1.05rem' }}>{item.quantity}</td>
                      <td>
                        {item.entry_type === 'production' ? (
                          <select 
                            className="emp-select"
                            value={item.linked_employee_id || ''} 
                            onChange={(e) => updateEmployee(item.id, e.target.value)}
                          >
                            <option value="">-- Assign --</option>
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                          </select>
                        ) : '-'}
                      </td>
                      <td style={{ fontWeight: 600, color: '#64748b' }}>{item.bill_number || '-'}</td>
                      <td style={{ fontSize: '0.85rem' }}>{item.remark || '-'}</td>
                      <td style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>{item.user_username || '-'}</td>
                    </tr>
                  ))}
                  {!entries.length && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontWeight: 600, fontSize: '1.1rem' }}>
                        No entries found matching your filters.
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

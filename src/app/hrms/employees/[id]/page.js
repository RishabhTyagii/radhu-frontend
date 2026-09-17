"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiGet, apiPatch } from "@/lib/api";

const th = { padding: "14px 18px", fontSize: "0.75rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", textAlign: "left", whiteSpace: "nowrap" };
const td = { padding: "12px 18px", fontSize: "0.85rem", color: "#334155", borderBottom: "1px solid #f1f5f9" };

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed #e2e8f0", paddingBottom: "10px" }}>
      <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 700 }}>{value || "-"}</span>
    </div>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#fff", padding: "20px 24px", borderRadius: "16px", boxShadow: "0 4px 16px rgba(0,0,0,0.03)", borderBottom: `4px solid ${accent}` }}>
      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0f172a" }}>{value}</div>
      <div style={{ fontSize: "0.82rem", color: "#94a3b8", fontWeight: 600, marginTop: "6px" }}>{sub}</div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthStr, setMonthStr] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState("attendance");
  const [fullScreen, setFullScreen] = useState(null);

  const [itemRates, setItemRates] = useState([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [rateSearch, setRateSearch] = useState("");
  const [editingRateId, setEditingRateId] = useState(null);
  const [editingRateVal, setEditingRateVal] = useState("");
  const [rateSaving, setRateSaving] = useState(false);
  const [rateMsg, setRateMsg] = useState(null);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    apiGet(`/hrms/employees/${params.id}/?month=${monthStr}`).then(res => {
      if (res && res.employee) setData(res);
      setLoading(false);
    });
  }, [params.id, monthStr]);

  useEffect(() => {
    if (activeTab === "rates" && params.id) {
      setRatesLoading(true);
      apiGet(`/hrms/item-rates/?employee_id=${params.id}`).then(res => {
        if (Array.isArray(res)) setItemRates(res);
        setRatesLoading(false);
      });
    }
  }, [activeTab, params.id]);

  async function saveRate(id) {
    setRateSaving(true);
    const res = await apiPatch(`/hrms/item-rates/${id}/`, { rate: editingRateVal });
    setRateSaving(false);
    if (res && res.ok) {
      setRateMsg({ type: "success", text: "✅ Rate updated successfully!" });
      setEditingRateId(null);
      apiGet(`/hrms/item-rates/?employee_id=${params.id}`).then(r => { if (Array.isArray(r)) setItemRates(r); });
      setTimeout(() => setRateMsg(null), 3000);
    } else {
      setRateMsg({ type: "error", text: "❌ Failed to update rate." });
    }
  }

  if (loading) return <><Navbar /><div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#64748b", fontSize: "1.2rem", fontWeight: 600 }}>Loading...</div></>;
  if (!data || !data.employee) return <><Navbar /><div style={{ textAlign: "center", padding: "60px", color: "#dc2626", fontWeight: 700 }}>Error loading employee.</div></>;

  const emp = data.employee;
  const aStats = data.attendance_stats || {};
  const pStats = data.production_stats || {};
  const curSal = data.current_salary;
  const attList = data.attendance_list || [];
  const prodList = data.production_list || [];

  const prodSummary = {};
  prodList.forEach((p) => {
    if (!prodSummary[p.product_name]) prodSummary[p.product_name] = { qty: 0, amount: 0, rate: Number(p.rate) || 0 };
    prodSummary[p.product_name].qty += Number(p.quantity);
    prodSummary[p.product_name].amount += Number(p.total_amount);
  });
  const summaryKeys = Object.keys(prodSummary).sort();
  const filteredRates = itemRates.filter(r => r.product_name.toLowerCase().includes(rateSearch.toLowerCase()));

  const tabBtn = (t, label) => (
    <button onClick={() => setActiveTab(t)} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", background: activeTab === t ? "#3b82f6" : "#f1f5f9", color: activeTab === t ? "#fff" : "#475569", transition: "all 0.2s ease" }}>{label}</button>
  );

  return (
    <>
      <Navbar />
      {fullScreen && (
        <div style={{ position: "fixed", inset: 0, background: "#f8fafc", zIndex: 9999, display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>
          {/* Header */}
          <div style={{ background: "#ffffff", padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ width: "48px", height: "48px", background: "#eff6ff", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                {fullScreen === "attendance" ? "📅" : "⚙️"}
              </div>
              <div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#0f172a", margin: "0 0 4px 0" }}>{fullScreen === "attendance" ? "Attendance Register" : "Production Register"}</h2>
                <div style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 600 }}>{emp.name} ({emp.employee_code}) <span style={{ padding: "0 8px" }}>•</span> <span style={{ color: "#3b82f6", fontWeight: 700 }}>{monthStr}</span></div>
              </div>
            </div>
            <button onClick={() => setFullScreen(null)} style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", padding: "12px 24px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", transition: "all 0.2s ease" }} onMouseOver={(e)=>e.currentTarget.style.background="#e2e8f0"} onMouseOut={(e)=>e.currentTarget.style.background="#f1f5f9"}>✕ Close</button>
          </div>
          
          {/* Content */}
          <div style={{ flex: 1, overflow: "auto", padding: "40px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "100%", maxWidth: "1200px", background: "#fff", borderRadius: "20px", boxShadow: "0 10px 40px rgba(0,0,0,0.04)", overflow: "hidden", border: "1px solid #e2e8f0" }}>
              {fullScreen === "attendance" ? (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ position: "sticky", top: 0, background: "#f8fafc", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", zIndex: 10 }}>
                    <tr>
                      {["Date","Day","Status","Work Hrs","OT Hrs","OT Amount"].map(h => <th key={h} style={{ ...th, color: "#64748b", padding: "16px 24px", borderBottom: "2px solid #e2e8f0" }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {attList.map((a, i) => {
                      const otAmt = (Number(a.overtime_hours) * Number(emp.overtime_rate || 0)).toFixed(2);
                      const day = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(a.date + "T00:00:00").getDay()];
                      const isSun = day === "Sun";
                      return (
                        <tr key={a.id} style={{ background: isSun ? "#fffbeb" : (i % 2 === 0 ? "#ffffff" : "#f8fafc"), transition: "all 0.1s ease" }} onMouseOver={(e)=>e.currentTarget.style.background="#f1f5f9"} onMouseOut={(e)=>e.currentTarget.style.background=isSun ? "#fffbeb" : (i % 2 === 0 ? "#ffffff" : "#f8fafc")}>
                          <td style={{ ...td, color: "#0f172a", fontWeight: 700, padding: "16px 24px" }}>{a.date}</td>
                          <td style={{ ...td, color: "#64748b", padding: "16px 24px", fontWeight: isSun ? 700 : 500 }}>{day}</td>
                          <td style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}><span style={{ fontSize: "0.75rem", fontWeight: 800, padding: "6px 14px", borderRadius: "20px", background: a.status === "Present" ? "#dcfce7" : a.status === "Half Day" ? "#fef9c3" : "#fee2e2", color: a.status === "Present" ? "#166534" : a.status === "Half Day" ? "#854d0e" : "#991b1b", border: `1px solid ${a.status === "Present" ? "#bbf7d0" : a.status === "Half Day" ? "#fde047" : "#fecaca"}` }}>{a.status}</span></td>
                          <td style={{ ...td, color: "#334155", fontWeight: 700, textAlign: "right", padding: "16px 24px" }}>{a.working_hours}h</td>
                          <td style={{ ...td, color: "#7c3aed", fontWeight: 700, textAlign: "right", padding: "16px 24px" }}>{Number(a.overtime_hours) > 0 ? `+${a.overtime_hours}h` : "-"}</td>
                          <td style={{ ...td, color: "#16a34a", fontWeight: 700, textAlign: "right", padding: "16px 24px" }}>{Number(otAmt) > 0 ? `₹${otAmt}` : "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot><tr style={{ background: "#f1f5f9", borderTop: "2px solid #cbd5e1" }}>
                    <td colSpan="3" style={{ padding: "20px 24px", color: "#334155", fontWeight: 800, fontSize: "0.9rem" }}>TOTAL: <span style={{ color: "#16a34a" }}>Present {aStats.present_days || 0}</span> <span style={{ color: "#cbd5e1", padding: "0 6px" }}>|</span> <span style={{ color: "#dc2626" }}>Absent {aStats.absent_days || 0}</span> <span style={{ color: "#cbd5e1", padding: "0 6px" }}>|</span> <span style={{ color: "#ca8a04" }}>Half {aStats.half_days || 0}</span></td>
                    <td style={{ padding: "20px 24px", color: "#0f172a", fontWeight: 900, textAlign: "right", fontSize: "1rem" }}>{aStats.total_work_hrs || 0}h</td>
                    <td style={{ padding: "20px 24px", color: "#7c3aed", fontWeight: 900, textAlign: "right", fontSize: "1rem" }}>{aStats.total_ot_hrs || 0}h</td>
                    <td style={{ padding: "20px 24px", color: "#16a34a", fontWeight: 900, textAlign: "right", fontSize: "1.1rem" }}>₹{((aStats.total_ot_hrs || 0) * Number(emp.overtime_rate || 0)).toFixed(2)}</td>
                  </tr></tfoot>
                </table>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ position: "sticky", top: 0, background: "#f8fafc", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", zIndex: 10 }}>
                    <tr>
                      {["Date","Item / Tyre","Qty","Rate/pc","Amount"].map(h => <th key={h} style={{ ...th, color: "#64748b", padding: "16px 24px", borderBottom: "2px solid #e2e8f0" }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {prodList.map((p, i) => (
                      <tr key={p.id} style={{ background: i % 2 === 0 ? "#ffffff" : "#f8fafc", transition: "all 0.1s ease" }} onMouseOver={(e)=>e.currentTarget.style.background="#f1f5f9"} onMouseOut={(e)=>e.currentTarget.style.background=i % 2 === 0 ? "#ffffff" : "#f8fafc"}>
                        <td style={{ ...td, color: "#0f172a", fontWeight: 700, padding: "16px 24px" }}>{p.date}</td>
                        <td style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}><span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "6px 12px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 700, border: "1px solid #bfdbfe" }}>{p.product_name}</span></td>
                        <td style={{ ...td, color: "#0f172a", fontWeight: 900, textAlign: "right", padding: "16px 24px", fontSize: "1.05rem" }}>{p.quantity}</td>
                        <td style={{ ...td, color: "#d97706", fontWeight: 700, textAlign: "right", padding: "16px 24px" }}>₹{Number(p.rate).toFixed(4)}</td>
                        <td style={{ ...td, color: "#16a34a", fontWeight: 900, textAlign: "right", padding: "16px 24px", fontSize: "1.05rem" }}>₹{Number(p.total_amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr style={{ background: "#f0fdf4", borderTop: "2px solid #86efac" }}>
                    <td colSpan="2" style={{ padding: "20px 24px", color: "#166534", fontWeight: 900, fontSize: "1rem" }}>GRAND TOTAL</td>
                    <td style={{ padding: "20px 24px", color: "#15803d", fontWeight: 900, textAlign: "right", fontSize: "1.1rem" }}>{pStats.total_qty || 0} pcs</td>
                    <td style={{ padding: "20px 24px" }}></td>
                    <td style={{ padding: "20px 24px", color: "#16a34a", fontWeight: 900, textAlign: "right", fontSize: "1.3rem" }}>₹{pStats.total_amount || "0.00"}</td>
                  </tr></tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", minHeight: "100vh", padding: "30px 20px" }}>
        <div style={{ maxWidth: "1500px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <button onClick={() => router.push("/hrms/employees")} style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "10px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: 700, color: "#475569", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>← Back</button>
              <div>
                <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a", margin: "0 0 8px 0" }}>{emp.name} <span style={{ fontSize: "1.1rem", color: "#94a3b8" }}>({emp.employee_code})</span></h1>
                <div style={{ display: "flex", gap: "10px" }}>
                  <span style={{ background: "#eff6ff", color: "#2563eb", padding: "4px 14px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700 }}>{emp.department_name}</span>
                  <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 14px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700 }}>{emp.designation}</span>
                  <span style={{ background: emp.status === "Active" ? "#dcfce7" : "#fee2e2", color: emp.status === "Active" ? "#166534" : "#991b1b", padding: "4px 14px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700 }}>{emp.status}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fff", padding: "10px 18px", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
              <label style={{ fontWeight: 800, color: "#475569", fontSize: "0.85rem" }}>Month:</label>
              <input type="month" value={monthStr} onChange={(e) => setMonthStr(e.target.value)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: 700, outline: "none", color: "#0f172a" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "28px" }}>
            <StatCard label="Present Days" value={aStats.present_days || 0} sub={`Half: ${aStats.half_days || 0} | Absent: ${aStats.absent_days || 0}`} accent="#3b82f6" />
            <StatCard label="Working Hrs" value={`${aStats.total_work_hrs || 0}h`} sub={`+ ${aStats.total_ot_hrs || 0}h Overtime`} accent="#8b5cf6" />
            <StatCard label="Production Earnings" value={`₹${pStats.total_amount || 0}`} sub={`${pStats.total_qty || 0} pieces built`} accent="#10b981" />
            <div style={{ background: "linear-gradient(135deg,#1e293b,#0f172a)", padding: "20px 24px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>Salary ({monthStr})</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#4ade80" }}>{curSal ? `₹${Number(curSal.net_salary || 0).toLocaleString("en-IN")}` : "Pending"}</div>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "6px" }}>{curSal ? `Generated: ${curSal.generated_on}` : "Not generated yet"}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px", alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {[
                { title: "Personal Details", rows: [["Father Name", emp.father_name],["Mobile", emp.mobile],["Alt Mobile", emp.alternate_mobile],["Date of Birth", emp.dob],["Joining Date", emp.joining_date],["Address", emp.address]] },
                { title: "Bank & Statutory", rows: [["Aadhaar", emp.aadhaar],["PAN", emp.pan],["Bank", emp.bank_name],["Account No", emp.account_number],["IFSC", emp.ifsc],["UAN", emp.uan],["ESI No", emp.esi_number]] },
                { title: "Salary & Rates", rows: [["Basic Monthly", emp.basic_salary ? `₹${Number(emp.basic_salary).toLocaleString("en-IN")}` : null],["Hourly Rate", emp.hourly_rate ? `₹${emp.hourly_rate}/hr` : null],["OT Rate", emp.overtime_rate ? `₹${emp.overtime_rate}/hr` : null],["PF %", emp.pf_percent ? `${emp.pf_percent}%` : null],["ESI %", emp.esi_percent ? `${emp.esi_percent}%` : null]] }
              ].map(({ title, rows }) => (
                <div key={title} style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "2px solid #f1f5f9" }}>{title}</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {rows.map(([l, v]) => <DetailRow key={l} label={l} value={v} />)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>Production Summary — {monthStr}</h2>
                  <span style={{ background: "#f0fdf4", color: "#166534", padding: "5px 14px", borderRadius: "20px", fontWeight: 700, fontSize: "0.8rem" }}>{summaryKeys.length} items</span>
                </div>
                {summaryKeys.length > 0 ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                      {summaryKeys.map((k) => (
                        <div key={k} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#1d4ed8", marginBottom: "10px", lineHeight: 1.4 }}>{k}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                            <div>
                              <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Qty</div>
                              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0f172a" }}>{prodSummary[k].qty}</div>
                              {prodSummary[k].rate > 0 && <div style={{ fontSize: "0.7rem", color: "#d97706", fontWeight: 700, marginTop: "2px", background: "#fef3c7", padding: "2px 6px", borderRadius: "6px", display: "inline-block" }}>@ ₹{prodSummary[k].rate.toFixed(4)}</div>}
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Earned</div>
                              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#16a34a" }}>₹{prodSummary[k].amount.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: "linear-gradient(135deg,#dcfce7,#bbf7d0)", padding: "16px 24px", borderRadius: "12px", border: "1px solid #86efac", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div><span style={{ fontWeight: 800, color: "#166534", fontSize: "0.95rem" }}>Grand Total this month</span><span style={{ marginLeft: "12px", color: "#16a34a", fontWeight: 800, fontSize: "0.95rem" }}>{pStats.total_qty || 0} pcs</span></div>
                      <span style={{ fontWeight: 900, color: "#15803d", fontSize: "1.5rem" }}>₹{pStats.total_amount || "0"}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "40px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", color: "#64748b", fontWeight: 600 }}>No production entries this month.</div>
                )}
              </div>

              <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" }}>
                  {tabBtn("attendance", "📅 Attendance Log")}
                  {tabBtn("production", "⚙️ Daily Production")}
                  {tabBtn("rates", "💰 Item Rates")}
                  <div style={{ flex: 1 }} />
                  {(activeTab === "attendance" || activeTab === "production") && (
                    <button onClick={() => setFullScreen(activeTab)} style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid #bfdbfe", cursor: "pointer", fontWeight: 800, fontSize: "0.85rem", background: "#eff6ff", color: "#1d4ed8", transition: "all 0.2s ease", boxShadow: "0 2px 4px rgba(37,99,235,0.1)" }} onMouseOver={(e)=>e.currentTarget.style.background="#dbeafe"} onMouseOut={(e)=>e.currentTarget.style.background="#eff6ff"}>⛶ View Full Register</button>
                  )}
                </div>

                {activeTab === "attendance" && (
                  <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                        <tr><th style={th}>Date</th><th style={th}>Status</th><th style={{ ...th, textAlign: "right" }}>Work Hrs</th><th style={{ ...th, textAlign: "right" }}>OT Hrs</th></tr>
                      </thead>
                      <tbody>
                        {attList.length === 0 ? <tr><td colSpan="4" style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontWeight: 600 }}>No attendance data.</td></tr>
                          : attList.map((a, i) => (
                            <tr key={a.id} style={{ background: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                              <td style={td}>{a.date}</td>
                              <td style={td}><span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "4px 10px", borderRadius: "8px", background: a.status === "Present" ? "#dcfce7" : a.status === "Half Day" ? "#fef9c3" : "#fee2e2", color: a.status === "Present" ? "#166534" : a.status === "Half Day" ? "#854d0e" : "#991b1b" }}>{a.status}</span></td>
                              <td style={{ ...td, fontWeight: 700, textAlign: "right", color: "#0f172a" }}>{a.working_hours}h</td>
                              <td style={{ ...td, textAlign: "right" }}>{Number(a.overtime_hours) > 0 && <span style={{ color: "#7c3aed", fontWeight: 700, background: "#f3e8ff", padding: "4px 8px", borderRadius: "6px" }}>+{a.overtime_hours}h</span>}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === "production" && (
                  <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                        <tr><th style={th}>Date</th><th style={th}>Item</th><th style={{ ...th, textAlign: "right" }}>Qty</th><th style={{ ...th, textAlign: "right" }}>Rate/pc</th><th style={{ ...th, textAlign: "right" }}>Amount</th></tr>
                      </thead>
                      <tbody>
                        {prodList.length === 0 ? <tr><td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontWeight: 600 }}>No production entries.</td></tr>
                          : prodList.map((p, i) => (
                            <tr key={p.id} style={{ background: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                              <td style={{ ...td, fontWeight: 600 }}>{String(p.date).slice(5)}</td>
                              <td style={{ ...td, fontWeight: 700, fontSize: "0.75rem", color: "#1d4ed8" }}><span style={{ background: "#eff6ff", padding: "4px 8px", borderRadius: "6px", border: "1px solid #bfdbfe" }}>{p.product_name}</span></td>
                              <td style={{ ...td, fontWeight: 800, textAlign: "right", color: "#0f172a" }}>{p.quantity}</td>
                              <td style={{ ...td, textAlign: "right", color: "#d97706", fontWeight: 700 }}>₹{Number(p.rate).toFixed(4)}</td>
                              <td style={{ ...td, fontWeight: 800, textAlign: "right", color: "#16a34a" }}>₹{Number(p.total_amount).toFixed(2)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === "rates" && (
                  <div>
                    {rateMsg && <div style={{ padding: "12px 16px", marginBottom: "16px", borderRadius: "10px", fontWeight: 700, background: rateMsg.type === "success" ? "#dcfce7" : "#fee2e2", color: rateMsg.type === "success" ? "#166534" : "#991b1b", border: `1px solid ${rateMsg.type === "success" ? "#86efac" : "#fca5a5"}`, display: "flex", alignItems: "center", gap: "8px" }}>{rateMsg.text}</div>}
                    <div style={{ position: "relative", marginBottom: "20px" }}>
                      <input type="text" placeholder="🔍 Search item by name..." value={rateSearch} onChange={(e) => setRateSearch(e.target.value)} style={{ width: "100%", padding: "12px 16px 12px 40px", borderRadius: "10px", border: "2px solid #e2e8f0", fontSize: "0.95rem", fontWeight: 600, outline: "none", boxSizing: "border-box", color: "#0f172a", transition: "border 0.2s ease" }} onFocus={(e)=>e.target.style.borderColor="#3b82f6"} onBlur={(e)=>e.target.style.borderColor="#e2e8f0"} />
                      <span style={{ position: "absolute", left: "14px", top: "12px", opacity: 0.5 }}>🔍</span>
                    </div>
                    {ratesLoading ? <div style={{ textAlign: "center", padding: "40px", color: "#64748b", fontWeight: 600 }}>Loading rates...</div>
                      : filteredRates.length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontWeight: 600, background: "#f8fafc", borderRadius: "12px" }}>{rateSearch ? "No items match your search." : "No rates saved."}</div>
                        : (
                          <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", background: "#fff" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                                <tr><th style={th}>#</th><th style={th}>Item / Tyre</th><th style={{ ...th, textAlign: "right" }}>Rate / Piece</th><th style={{ ...th, textAlign: "center" }}>Updated</th><th style={{ ...th, textAlign: "center" }}>Action</th></tr>
                              </thead>
                              <tbody>
                                {filteredRates.map((r, i) => (
                                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#ffffff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ ...td, color: "#94a3b8", fontWeight: 600 }}>{i + 1}</td>
                                    <td style={{ ...td, fontWeight: 700, color: "#1d4ed8", fontSize: "0.85rem" }}>{r.product_name}</td>
                                    <td style={{ ...td, textAlign: "right" }}>
                                      {editingRateId === r.id ? (
                                        <input type="number" step="0.0001" value={editingRateVal} onChange={(e) => setEditingRateVal(e.target.value)} style={{ width: "120px", padding: "8px 12px", borderRadius: "8px", border: "2px solid #3b82f6", fontWeight: 800, textAlign: "right", fontSize: "1rem", color: "#0f172a", outline: "none", boxShadow: "0 0 0 3px rgba(59,130,246,0.1)" }} autoFocus />
                                      ) : (
                                        <span style={{ fontWeight: 900, color: "#16a34a", fontSize: "1.05rem", background: "#f0fdf4", padding: "4px 10px", borderRadius: "6px" }}>₹{Number(r.rate).toFixed(4)}</span>
                                      )}
                                    </td>
                                    <td style={{ ...td, textAlign: "center", color: "#94a3b8", fontSize: "0.78rem" }}>{r.updated_at}</td>
                                    <td style={{ ...td, textAlign: "center" }}>
                                      {editingRateId === r.id ? (
                                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                                          <button onClick={() => saveRate(r.id)} disabled={rateSaving} style={{ padding: "8px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 800, fontSize: "0.85rem", boxShadow: "0 2px 4px rgba(22,163,74,0.2)" }}>{rateSaving ? "Saving..." : "Save"}</button>
                                          <button onClick={() => setEditingRateId(null)} style={{ padding: "8px 14px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>Cancel</button>
                                        </div>
                                      ) : (
                                        <button onClick={() => { setEditingRateId(r.id); setEditingRateVal(r.rate); }} style={{ padding: "6px 14px", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", transition: "all 0.2s ease" }} onMouseOver={(e)=>e.currentTarget.style.background="#dbeafe"} onMouseOut={(e)=>e.currentTarget.style.background="#eff6ff"}>✏️ Edit</button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiGet } from "@/lib/api";

const th = {
  padding: "12px 14px",
  fontSize: "0.75rem",
  fontWeight: 800,
  color: "#475569",
  textTransform: "uppercase",
  textAlign: "left",
  whiteSpace: "nowrap",
};
const td = {
  padding: "10px 14px",
  fontSize: "0.85rem",
  color: "#475569",
  borderBottom: "1px solid #f1f5f9",
};

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed #e2e8f0", paddingBottom: "10px" }}>
      <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 700 }}>{value || "-"}</span>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthStr, setMonthStr] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      const res = await apiGet(
        `/hrms/employees/${params.id}/?month=${monthStr}`
      );
      if (res && res.employee) setData(res);
      setLoading(false);
    }
    if (params.id) fetchDetail();
  }, [params.id, monthStr]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#64748b", fontSize: "1.2rem", fontWeight: 600 }}>
          Loading employee profile...
        </div>
      </>
    );
  }

  if (!data || !data.employee) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", padding: "60px", color: "#dc2626", fontWeight: 700 }}>
          Error loading employee details.
        </div>
      </>
    );
  }

  const emp = data.employee;
  const aStats = data.attendance_stats || {};
  const pStats = data.production_stats || {};
  const curSal = data.current_salary;
  const attList = data.attendance_list || [];
  const prodList = data.production_list || [];

  // Group production items dynamically
  const prodSummary = {};
  prodList.forEach((p) => {
    if (!prodSummary[p.product_name]) {
      prodSummary[p.product_name] = { qty: 0, amount: 0 };
    }
    prodSummary[p.product_name].qty += Number(p.quantity);
    prodSummary[p.product_name].amount += Number(p.total_amount);
  });
  const summaryKeys = Object.keys(prodSummary).sort();

  return (
    <>
      <Navbar />
      <div style={{ background: "linear-gradient(135deg, #f0f4ff, #f8fafc)", minHeight: "100vh", padding: "30px 20px" }}>
        <div style={{ maxWidth: "1500px", margin: "0 auto" }}>

          {/* Header Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <button
                onClick={() => router.push("/hrms/employees")}
                style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: 700, color: "#475569", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                Back
              </button>
              <div>
                <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a", margin: "0 0 8px 0" }}>
                  {emp.name}{" "}
                  <span style={{ fontSize: "1.1rem", color: "#94a3b8", fontWeight: 600 }}>
                    ({emp.employee_code})
                  </span>
                </h1>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ background: "#eff6ff", color: "#2563eb", padding: "4px 14px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700 }}>
                    {emp.department_name}
                  </span>
                  <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 14px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700 }}>
                    {emp.employee_type_display}
                  </span>
                  <span style={{ background: emp.status === "Active" ? "#dcfce7" : "#fee2e2", color: emp.status === "Active" ? "#166534" : "#991b1b", padding: "4px 14px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700 }}>
                    {emp.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fff", padding: "8px 16px", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
              <label style={{ fontWeight: 700, color: "#475569", fontSize: "0.85rem" }}>
                Month:
              </label>
              <input
                type="month"
                value={monthStr}
                onChange={(e) => setMonthStr(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: 700, color: "#0f172a", outline: "none" }}
              />
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "28px" }}>
            <StatCard label="Present Days" value={aStats.present_days || 0} sub={`Half: ${aStats.half_days || 0} | Absent: ${aStats.absent_days || 0}`} accent="#3b82f6" />
            <StatCard label="Working Hrs" value={`${aStats.total_work_hrs || 0}h`} sub={`+ ${aStats.total_ot_hrs || 0}h Overtime`} accent="#8b5cf6" />
            <StatCard label="Production Earnings" value={`Rs ${pStats.total_amount || 0}`} sub={`${pStats.total_qty || 0} pieces built`} accent="#10b981" />
            <div style={{ background: "linear-gradient(135deg,#1e293b,#0f172a)", padding: "20px 24px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
                Salary ({monthStr})
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#4ade80" }}>
                {curSal ? `Rs ${Number(curSal.net_salary || 0).toLocaleString("en-IN")}` : "Pending"}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600, marginTop: "6px" }}>
                {curSal ? `Generated: ${curSal.generated_on}` : "Not generated yet"}
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px", alignItems: "start" }}>

            {/* Left: Personal & Bank */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "2px solid #f1f5f9" }}>
                  Personal Details
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <DetailRow label="Father's Name" value={emp.father_name} />
                  <DetailRow label="Mobile" value={emp.alternate_mobile} />
                  <DetailRow label="Date of Birth" value={emp.dob} />
                  <DetailRow label="Joining Date" value={emp.joining_date} />
                  <DetailRow label="Designation" value={emp.designation} />
                  <DetailRow label="Address" value={emp.address} />
                </div>
              </div>

              <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "2px solid #f1f5f9" }}>
                  Bank & Statutory
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <DetailRow label="Aadhaar" value={emp.aadhaar} />
                  <DetailRow label="PAN" value={emp.pan} />
                  <DetailRow label="Bank" value={emp.bank_name} />
                  <DetailRow label="Account No" value={emp.account_number} />
                  <DetailRow label="IFSC" value={emp.ifsc} />
                  <DetailRow label="UAN" value={emp.uan} />
                  <DetailRow label="ESI No" value={emp.esi_number} />
                </div>
              </div>

              <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "2px solid #f1f5f9" }}>
                  Salary & Rates
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <DetailRow label="Basic Monthly" value={emp.basic_salary ? `Rs ${Number(emp.basic_salary).toLocaleString("en-IN")}` : null} />
                  <DetailRow label="Hourly Rate" value={emp.hourly_rate ? `Rs ${emp.hourly_rate}/hr` : null} />
                  <DetailRow label="OT Rate" value={emp.overtime_rate ? `Rs ${emp.overtime_rate}/hr` : null} />
                  <DetailRow label="PF %" value={emp.pf_percent ? `${emp.pf_percent}%` : null} />
                  <DetailRow label="ESI %" value={emp.esi_percent ? `${emp.esi_percent}%` : null} />
                </div>
              </div>
            </div>

            {/* Right: Production Summary + Tables */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* DYNAMIC PRODUCTION SUMMARY CARDS */}
              <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                    Production Summary — {monthStr}
                  </h2>
                  <span style={{ background: "#f0fdf4", color: "#166534", padding: "5px 14px", borderRadius: "20px", fontWeight: 700, fontSize: "0.8rem" }}>
                    {summaryKeys.length} items
                  </span>
                </div>

                {summaryKeys.length > 0 ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                      {summaryKeys.map((k) => (
                        <div key={k} style={{ background: "linear-gradient(135deg,#f8fafc,#eff6ff)", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "16px" }}>
                          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1d4ed8", marginBottom: "12px", lineHeight: 1.4 }}>{k}</div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>
                              <div style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Qty</div>
                              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0f172a" }}>{prodSummary[k].qty}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Earned</div>
                              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#16a34a" }}>
                                Rs {prodSummary[k].amount.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Grand Total Bar */}
                    <div style={{ background: "linear-gradient(135deg,#dcfce7,#bbf7d0)", padding: "14px 20px", borderRadius: "10px", border: "2px solid #4ade80", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontWeight: 800, color: "#166534", fontSize: "0.95rem" }}>Grand Total this month</span>
                        <span style={{ marginLeft: "12px", fontSize: "0.85rem", color: "#16a34a", fontWeight: 700 }}>{pStats.total_qty || 0} pcs</span>
                      </div>
                      <span style={{ fontWeight: 900, color: "#15803d", fontSize: "1.5rem" }}>
                        Rs {pStats.total_amount || "0.00"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "40px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", color: "#64748b", fontWeight: 600 }}>
                    No production entries this month.
                  </div>
                )}
              </div>

              {/* Attendance + Daily Production side by side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                
                {/* Attendance Log */}
                <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", margin: "0 0 16px" }}>
                    Attendance Log
                  </h3>
                  <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead style={{ position: "sticky", top: 0, background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                        <tr>
                          <th style={th}>Date</th>
                          <th style={th}>Status</th>
                          <th style={{ ...th, textAlign: "right" }}>Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attList.length === 0 ? (
                          <tr><td colSpan="3" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No attendance data.</td></tr>
                        ) : attList.map((a, i) => (
                          <tr key={a.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                            <td style={td}>{a.date}</td>
                            <td style={td}>
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", background: a.status === "Present" ? "#dcfce7" : a.status === "Half Day" ? "#fef9c3" : "#fee2e2", color: a.status === "Present" ? "#166534" : a.status === "Half Day" ? "#a16207" : "#991b1b" }}>
                                {a.status}
                              </span>
                            </td>
                            <td style={{ ...td, fontWeight: 700, textAlign: "right" }}>
                              {a.working_hours}h
                              {Number(a.overtime_hours) > 0 && (
                                <span style={{ color: "#8b5cf6", marginLeft: "4px" }}>+{a.overtime_hours}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Daily Production Log */}
                <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", margin: "0 0 16px" }}>
                    Daily Production
                  </h3>
                  <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead style={{ position: "sticky", top: 0, background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                        <tr>
                          <th style={th}>Date</th>
                          <th style={th}>Item</th>
                          <th style={{ ...th, textAlign: "right" }}>Qty</th>
                          <th style={{ ...th, textAlign: "right" }}>Amt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prodList.length === 0 ? (
                          <tr><td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No production entries.</td></tr>
                        ) : prodList.map((p, i) => (
                          <tr key={p.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                            <td style={td}>{String(p.date).slice(5)}</td>
                            <td style={{ ...td, fontWeight: 700, fontSize: "0.75rem", color: "#1d4ed8" }}>
                              <span style={{ background: "#eff6ff", padding: "2px 8px", borderRadius: "4px" }}>{p.product_name}</span>
                            </td>
                            <td style={{ ...td, fontWeight: 800, textAlign: "right" }}>{p.quantity}</td>
                            <td style={{ ...td, fontWeight: 800, textAlign: "right", color: "#16a34a" }}>
                              Rs{Number(p.total_amount).toFixed(0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#fff", padding: "20px 24px", borderRadius: "16px", boxShadow: "0 4px 16px rgba(0,0,0,0.05)", borderBottom: `4px solid ${accent}` }}>
      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0f172a" }}>{value}</div>
      <div style={{ fontSize: "0.82rem", color: "#94a3b8", fontWeight: 600, marginTop: "6px" }}>{sub}</div>
    </div>
  );
}

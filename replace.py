import sys

with open('src/app/hrms/monthly-register/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    ""status: a.status === 'Present' ? 'P' : a.status === 'Absent' ? 'A' : a.status === 'Half Day' ? 'HD' : a.status === 'Holiday' ? 'H' : a.status === 'Week Off' ? 'W' : '',"",
    ""status: a.leave_type ? a.leave_type : (a.status === 'Present' ? 'P' : a.status === 'Absent' ? 'A' : a.status === 'Half Day' ? 'HD' : a.status === 'Holiday' ? 'H' : a.status === 'Week Off' ? 'W' : ''),""
)

old_st = ""let st = 'Absent';\n          let wh = 0;\n          if (cell.status === 'P') { st = 'Present'; wh = 8; }\n          else if (cell.status === 'A') { st = 'Absent'; wh = 0; }\n          else if (cell.status === 'HD') { st = 'Half Day'; wh = 4; }\n          else if (cell.status === 'H') { st = 'Holiday'; wh = 0; }\n          else if (cell.status === 'W') { st = 'Week Off'; wh = 0; }""

new_st = ""let st = 'Absent';\n          let wh = 0;\n          let lt = '';\n          if (cell.status === 'P') { st = 'Present'; wh = 8; }\n          else if (cell.status === 'A') { st = 'Absent'; wh = 0; }\n          else if (cell.status === 'HD') { st = 'Half Day'; wh = 4; }\n          else if (cell.status === 'H') { st = 'Holiday'; wh = 0; }\n          else if (cell.status === 'W') { st = 'Week Off'; wh = 0; }\n          else if (cell.status === 'CL' || cell.status === 'EL') { st = 'Present'; wh = 8; lt = cell.status; }\n          else if (cell.status === 'LOP') { st = 'Absent'; wh = 0; lt = 'LOP'; }""

content = content.replace(old_st, new_st)

content = content.replace(""overtime_hours: parseFloat(cell.ot) || 0"", ""overtime_hours: parseFloat(cell.ot) || 0, leave_type: lt"")
content = content.replace(""if (cell.status === 'P' || cell.status === 'H') totalDays += 1;"", ""if (cell.status === 'P' || cell.status === 'H' || cell.status === 'CL' || cell.status === 'EL') totalDays += 1;"")
content = content.replace(""P: Present (8h) | A: Absent (0h) | HD: Half Day (4h) | H: Holiday | W: Week Off"", ""P: Present | A: Absent | HD: Half Day | H: Holiday | W: Week Off | CL | EL | LOP"")
content = content.replace(""title=\""Status (P, A, HD, H, W)\"""", ""title=\""Status (P, A, HD, H, W, CL, EL, LOP)\"""")
content = content.replace("".status-P { color: #16a34a; }"", "".status-P { color: #16a34a; } .status-CL, .status-EL { color: #8b5cf6; } .status-LOP { color: #ef4444; }"")

with open('src/app/hrms/monthly-register/page.js', 'w', encoding='utf-8') as f:
    f.write(content)

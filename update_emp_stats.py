file_path = r'C:\Users\risha\Documents\radhufullstack\frontend\src\app\hrms\employees\[id]\page.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

old_stat = '              <StatCard label="Present Days" value={aStats.present_days || 0} sub={`Half: ${aStats.half_days || 0} | Absent: ${aStats.absent_days || 0}`} accent="#3b82f6" />'
new_stat = '              <StatCard label="Present Days" value={aStats.present_days || 0} sub={`Hol: ${aStats.holiday_days || 0} | Half: ${aStats.half_days || 0} | Abs: ${aStats.absent_days || 0}`} accent="#3b82f6" />'
text = text.replace(old_stat, new_stat)

old_tfoot = '                  <td colSpan="3" style={{ padding: "12px 18px", color: "#7dd3fc", fontWeight: 800 }}>TOTAL: Present {aStats.present_days || 0} | Absent {aStats.absent_days || 0} | Half {aStats.half_days || 0}</td>'
new_tfoot = '                  <td colSpan="3" style={{ padding: "12px 18px", color: "#7dd3fc", fontWeight: 800 }}>TOTAL: P {aStats.present_days || 0} | Hol {aStats.holiday_days || 0} | Abs {aStats.absent_days || 0} | Half {aStats.half_days || 0}</td>'
text = text.replace(old_tfoot, new_tfoot)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated employee details page")

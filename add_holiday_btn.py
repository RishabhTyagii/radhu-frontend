file_path = r'C:\Users\risha\Documents\radhufullstack\frontend\src\app\hrms\attendance\page.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

old_absent = (
    "  const markAllAbsent = () => {\n"
    "    const nextMap = { ...attendanceMap };\n"
    "    filteredEmployees.forEach((e) => {\n"
    "      nextMap[e.id] = { ...(nextMap[e.id] || {}), status: 'Absent', working_hours: '0', overtime_hours: '0' };\n"
    "    });\n"
    "    setAttendanceMap(nextMap);\n"
    "  };"
)

new_holiday = (
    "  const markAllAbsent = () => {\n"
    "    const nextMap = { ...attendanceMap };\n"
    "    filteredEmployees.forEach((e) => {\n"
    "      nextMap[e.id] = { ...(nextMap[e.id] || {}), status: 'Absent', working_hours: '0', overtime_hours: '0' };\n"
    "    });\n"
    "    setAttendanceMap(nextMap);\n"
    "  };\n\n"
    "  const markAllHoliday = () => {\n"
    "    const nextMap = { ...attendanceMap };\n"
    "    filteredEmployees.forEach((e) => {\n"
    "      nextMap[e.id] = { ...(nextMap[e.id] || {}), status: 'Holiday', working_hours: '0', overtime_hours: '0' };\n"
    "    });\n"
    "    setAttendanceMap(nextMap);\n"
    "  };"
)

text = text.replace(old_absent, new_holiday)

old_buttons = (
    "            <button onClick={markAllAbsent} className=\"btn\" style={{ background: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}>\n"
    "              Mark Filtered Absent\n"
    "            </button>"
)

new_buttons = (
    "            <button onClick={markAllAbsent} className=\"btn\" style={{ background: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}>\n"
    "              Mark Filtered Absent\n"
    "            </button>\n"
    "            <button onClick={markAllHoliday} className=\"btn\" style={{ background: '#fef3c7', color: '#d97706', fontWeight: 600 }}>\n"
    "              Mark Filtered Holiday\n"
    "            </button>"
)

text = text.replace(old_buttons, new_buttons)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated attendance page")

file_path = r'C:\Users\risha\Documents\radhufullstack\frontend\src\app\hrms\employees\[id]\page.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix saveRate - replace raw fetch with apiPatch
old_save = (
    "  async function saveRate(id) {\n"
    "      setRateSaving(true);\n"
    "      const token = localStorage.getItem(\"radhu_token\");\n"
    "      const res = await fetch(`/api/hrms/item-rates/${id}/`, {\n"
    "        method: \"PATCH\",\n"
    "        headers: { \"Content-Type\": \"application/json\", Authorization: `Bearer ${token}` },\n"
    "        body: JSON.stringify({ rate: editingRateVal }),\n"
    "      });\n"
    "      setRateSaving(false);\n"
    "      if (res.ok) {\n"
    "        setRateMsg({ type: \"success\", text: \"Rate updated!\" });\n"
    "        setEditingRateId(null);\n"
    "        apiGet(`/hrms/item-rates/?employee_id=${params.id}`).then(r => { if (Array.isArray(r)) setItemRates(r); });\n"
    "        setTimeout(() => setRateMsg(null), 3000);\n"
    "      } else {\n"
    "        setRateMsg({ type: \"error\", text: \"Failed to update rate.\" });\n"
    "      }\n"
    "    }"
)

new_save = (
    "  async function saveRate(id) {\n"
    "      setRateSaving(true);\n"
    "      const res = await apiPatch(`/hrms/item-rates/${id}/`, { rate: editingRateVal });\n"
    "      setRateSaving(false);\n"
    "      if (res && !res.error && !res.detail) {\n"
    "        setRateMsg({ type: \"success\", text: \"Rate updated!\" });\n"
    "        setEditingRateId(null);\n"
    "        apiGet(`/hrms/item-rates/?employee_id=${params.id}`).then(r => { if (Array.isArray(r)) setItemRates(r); });\n"
    "        setTimeout(() => setRateMsg(null), 3000);\n"
    "      } else {\n"
    "        setRateMsg({ type: \"error\", text: \"Failed to update rate.\" });\n"
    "      }\n"
    "    }"
)

if old_save in text:
    text = text.replace(old_save, new_save)
    print("saveRate function replaced!")
else:
    print("WARNING: old_save not found exactly. Trying partial fix...")
    # Fallback: just fix the fetch line
    text = text.replace(
        "const token = localStorage.getItem(\"radhu_token\");\n"
        "      const res = await fetch(`/api/hrms/item-rates/${id}/`, {\n"
        "        method: \"PATCH\",\n"
        "        headers: { \"Content-Type\": \"application/json\", Authorization: `Bearer ${token}` },\n"
        "        body: JSON.stringify({ rate: editingRateVal }),\n"
        "      });\n"
        "      setRateSaving(false);\n"
        "      if (res.ok) {",
        "const res = await apiPatch(`/hrms/item-rates/${id}/`, { rate: editingRateVal });\n"
        "      setRateSaving(false);\n"
        "      if (res && !res.error && !res.detail) {"
    )
    print("Partial fix applied")

# Ensure apiPatch is imported
if "'apiPatch'" not in text and '"apiPatch"' not in text and 'apiPatch' not in text.split('from')[0]:
    text = text.replace("import { apiGet,", "import { apiGet, apiPatch,")
    text = text.replace("import { apiGet }", "import { apiGet, apiPatch }")
    print("Added apiPatch to imports")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

# Verify
with open(file_path, 'r', encoding='utf-8') as f:
    c = f.read()
print("apiPatch in file:", 'apiPatch' in c)
print("raw fetch for item-rates in file:", "fetch(`/api/hrms/item-rates" in c)

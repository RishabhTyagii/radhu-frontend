
with open('src/app/hrms/salary/page.js', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.rstrip().rstrip(';') + '\n' + chr(96) + ';\n'
with open('src/app/hrms/salary/page.js', 'w', encoding='utf-8') as f:
    f.write(content)


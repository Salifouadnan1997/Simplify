import sys
content = open("src/components/DocumentEditor.tsx").read()
target = """              <span className="hidden sm:inline">Aperçu</span>
              <span className="inline sm:hidden">Aperçu</span>"""
replacement = """              <span>Aperçu</span>"""
new_content = content.replace(target, replacement)
if new_content != content:
    open("src/components/DocumentEditor.tsx", "w").write(new_content)
    print("Replaced successfully")
else:
    print("Target not found")

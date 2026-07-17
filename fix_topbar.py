import sys
content = open("src/components/DocumentEditor.tsx").read()
target = """      {/* Document Topbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center space-x-3 w-full max-w-lg">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-sm border border-slate-200 uppercase">"""
replacement = """      {/* Document Topbar */}
      <div className="flex items-center justify-between px-3 md:px-6 py-3 bg-white border-b border-slate-200 shrink-0 overflow-x-auto scrollbar-none w-full">
        <div className="flex items-center space-x-2 md:space-x-3 min-w-[150px] md:w-full md:max-w-lg mr-2 shrink-0">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-sm border border-slate-200 uppercase hidden sm:inline-block">"""
new_content = content.replace(target, replacement)
if new_content != content:
    open("src/components/DocumentEditor.tsx", "w").write(new_content)
    print("Replaced successfully")
else:
    print("Target not found")

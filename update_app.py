import sys
content = open("src/App.tsx").read()
target = """        {viewMode === "documentsList" && (
          <div className="flex-1 w-full h-full">
            <DocumentsList 
              onSelectDocument={(doc) => {
                setSelectedSupabaseDoc(doc);
                setViewMode("documentDetail");
              }} 
            />
          </div>
        )}"""
replacement = """        {viewMode === "documentsList" && (
          <div className="flex-1 w-full h-full">
            <DocumentsList 
              documents={documents}
              onSelectDocument={(id) => {
                setActiveDocId(id);
                setViewMode("editor");
              }}
              onCreateNewDocument={handleCreateNewDocument}
              onDeleteDocument={async (id) => {
                const newList = await deleteDocument(id);
                setDocuments(newList);
                if (activeDocId === id) {
                  setActiveDocId(newList.length > 0 ? newList[0].id : "");
                }
              }}
            />
          </div>
        )}"""
new_content = content.replace(target, replacement)
if new_content != content:
    open("src/App.tsx", "w").write(new_content)
    print("Replaced successfully")
else:
    print("Target not found")

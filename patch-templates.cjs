const fs = require('fs');

// App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
const handleReplaceContentStr = `  const handleReplaceContent = (htmlTemplate: string) => {
    const targetDocId = activeDocId || (documents.length > 0 ? documents[0].id : null);
    if (!targetDocId) return;
    setDocuments(prevDocs => {
      const docIndex = prevDocs.findIndex(d => d.id === targetDocId);
      if (docIndex === -1) return prevDocs;
      
      const doc = prevDocs[docIndex];
      const updatedDoc = { ...doc, content: htmlTemplate };
      saveDocument(updatedDoc).catch(e => console.error(e));
      
      const newList = [...prevDocs];
      newList[docIndex] = updatedDoc;
      return newList;
    });
  };`;

appContent = appContent.replace('const handleInsertTextAtCursor = (htmlTemplate: string) => {', handleReplaceContentStr + '\n\n  const handleInsertTextAtCursor = (htmlTemplate: string) => {');
appContent = appContent.replace('<TemplatesPanel \n                onInsertTemplate={handleInsertTextAtCursor}\n              />', '<TemplatesPanel \n                onInsertTemplate={handleReplaceContent}\n              />');
fs.writeFileSync('src/App.tsx', appContent);


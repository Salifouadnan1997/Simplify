const fs = require('fs');
const content = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf8');
const toInsert = `
  const exportToPDF = async () => {
    // Basic wrapper, actual logic is in FormattingPanel for now, or we can use window.print() as fallback
    window.print();
  };
`;
const newContent = content.replace('const handleContentChange = (content: string) => {', toInsert + '\n  const handleContentChange = (content: string) => {');
fs.writeFileSync('src/components/DocumentEditor.tsx', newContent);

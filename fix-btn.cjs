const fs = require('fs');
let content = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf8');

const btnSearch = `handleContentChange(fullContent + "<div style=\\"break-before: column; height: 100%;\\"><br/></div>");`;
const btnReplace = `const editor = document.getElementById("document-content-editor");
                if (editor) {
                   editor.innerHTML += "<div style=\\"break-before: column; min-height: 20px;\\"><br/><br/></div>";
                   handleContentChange(editor.innerHTML);
                   // Scroll to right to see the new page
                   setTimeout(() => {
                     const wrapper = document.getElementById("document-wrapper");
                     if (wrapper) wrapper.scrollLeft = wrapper.scrollWidth;
                   }, 100);
                }`;
content = content.replace(btnSearch, btnReplace);

// Remove the minHeight from document-wrapper to fully remove the bottom space if zoom is small
const wrapperSearch = `className="flex-1 overflow-x-auto overflow-y-auto bg-slate-200/50 flex items-start justify-start p-8 hide-scrollbar"
        style={{ minHeight: "calc(100vh - 120px)" }}`;
const wrapperReplace = `className="flex-1 overflow-x-auto overflow-y-auto bg-slate-200/50 flex items-start justify-start p-8 hide-scrollbar"
        style={{}}`;
content = content.replace(wrapperSearch, wrapperReplace);

fs.writeFileSync('src/components/DocumentEditor.tsx', content);

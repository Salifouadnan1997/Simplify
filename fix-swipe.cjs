const fs = require('fs');
let content = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf8');

const touchEndSearch = `handleContentChange(doc.content + "<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>");`;
const touchEndReplace = `const editor = document.getElementById("document-content-editor");
                if (editor) {
                   editor.innerHTML += "<div style=\\"break-before: column; min-height: 20px;\\"><br/><br/></div>";
                   handleContentChange(editor.innerHTML);
                   setTimeout(() => {
                     const wrapper = document.getElementById("document-wrapper");
                     if (wrapper) wrapper.scrollLeft = wrapper.scrollWidth;
                   }, 100);
                }`;
content = content.replace(touchEndSearch, touchEndReplace);
fs.writeFileSync('src/components/DocumentEditor.tsx', content);

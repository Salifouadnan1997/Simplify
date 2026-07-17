const fs = require('fs');
let content = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf8');

const hookSearch = `const contentEditableKey = useRef(0);`;
const hookReplace = `const contentEditableKey = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      // If mobile, auto-scale so the 800px width + padding fits in the screen
      if (w < 850) {
        setZoom(w / 864);
      } else {
        setZoom(1);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);`;
content = content.replace(hookSearch, hookReplace);

fs.writeFileSync('src/components/DocumentEditor.tsx', content);

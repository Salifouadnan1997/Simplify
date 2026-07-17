const fs = require('fs');
let content = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf8');

const touchState = `  const [zoom, setZoom] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);`;
content = content.replace(`  const [zoom, setZoom] = useState(1);`, touchState);

const touchEvents = `        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            setTouchStartX(e.touches[0].clientX);
          }
        }}
        onTouchEnd={(e) => {
          if (touchStartX !== null && e.changedTouches.length === 1) {
            const touchEndX = e.changedTouches[0].clientX;
            const diffX = touchStartX - touchEndX;
            
            // Swipe right to left (distance > 50px)
            if (diffX > 50) {
              const target = e.currentTarget;
              // Only add page if we are scrolled near the end
              if (target.scrollLeft + target.clientWidth >= target.scrollWidth - 100) {
                handleContentChange(doc.content + "<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>");
              }
            }
          }
          setTouchStartX(null);
        }}
        onScroll={(e) => {`;
content = content.replace(`        onTouchEnd={(e) => {
          // Detect swipe right to left (very simple detection, usually you need touchstart as well)
          // Actually, if we are at the right edge, we might just want to add a page.
          const target = e.currentTarget;
          if (target.scrollLeft + target.clientWidth >= target.scrollWidth - 10) {
             // We are at the end, maybe show a hint or add page
          }
        }}
        onScroll={(e) => {`, touchEvents);

fs.writeFileSync('src/components/DocumentEditor.tsx', content);

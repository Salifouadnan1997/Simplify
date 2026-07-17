const fs = require('fs');

let content = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf8');
content = content.replace(
`        <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono hidden md:flex uppercase tracking-wider">
          </div>`,
`        <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono hidden md:flex uppercase tracking-wider">`
);

content = content.replace(
`          </button>
        </div>
      </div>

      {/* Editor Main Canvas */}`,
`          </button>
        </div>
        </div>
      </div>

      {/* Editor Main Canvas */}`
);

fs.writeFileSync('src/components/DocumentEditor.tsx', content);

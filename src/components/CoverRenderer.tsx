import React from 'react';
import { SmartDocument } from '../types';

interface CoverRendererProps {
  doc: SmartDocument;
}

export default function CoverRenderer({ doc }: CoverRendererProps) {
  const templateId = doc.coverImage;
  const title = doc.title || "Document sans titre";
  const subtitle = doc.coverSubtitle || "PROJET / DOCUMENT";
  const type = doc.type || "Document Professionnel";
  const companyName = doc.coverCompanyName || "SIMPLIFY CREATIVE";
  const date = doc.coverDate || new Date(doc.createdAt || Date.now()).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getFirstWords = (str: string, count: number) => {
    const words = str.split(" ");
    return words.slice(0, count).join(" ");
  };

  const getLastWords = (str: string, count: number) => {
    const words = str.split(" ");
    return words.slice(count).join(" ");
  };

  if (templateId === "template-riche") {
    return (
      <div className="w-full h-full bg-[#0a1128] flex flex-col items-center p-12 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="mt-16 text-center w-full z-10">
          <h2 className="text-[#e2c779] font-sans font-bold text-4xl tracking-wide uppercase mb-2" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
            {subtitle}
          </h2>
          <h1 className="text-[#f4d068] font-sans font-extrabold text-[100px] leading-none uppercase tracking-tighter" style={{ 
            textShadow: "0 10px 20px rgba(0,0,0,0.8), 0 2px 4px rgba(255,255,255,0.3) inset",
            background: "linear-gradient(to bottom, #fff5c3, #d4af37, #997a00)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            {title}
          </h1>
        </div>

        <div className="mt-16 relative w-[600px] border-2 border-[#d4af37] p-6 text-center z-10 bg-[#0a1128]/80 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="#d4af37" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.55 18.55 20 18 20H6C5.45 20 5 19.55 5 19V18H19V19Z" />
            </svg>
          </div>
          <p className="text-[#e2c779] font-serif text-2xl uppercase tracking-[0.2em] mt-4 font-bold">
            {type}
          </p>
          <div className="flex justify-center mt-4">
             <div className="w-32 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"></div>
          </div>
          <p className="text-[#e2c779]/70 font-sans mt-4 uppercase tracking-[0.3em] text-sm">
            {date}
          </p>
        </div>

        <div className="mt-auto mb-12 w-full flex flex-col items-center z-10">
          <div className="px-10 py-3 border border-[#d4af37]/30 bg-[#d4af37]/10 rounded-sm shadow-[0_0_10px_rgba(212,175,55,0.2)_inset] backdrop-blur-sm">
            <p className="text-white font-serif text-2xl tracking-widest uppercase">{companyName}</p>
          </div>
        </div>
      </div>
    );
  }

  if (templateId === "template-foi") {
    return (
      <div className="w-full h-full bg-[#050505] flex flex-col items-center p-16 relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-b from-transparent via-red-900/30 to-orange-600/40 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[600px] bg-black rounded-t-[250px] blur-[10px] pointer-events-none opacity-90"></div>
        <div className="absolute bottom-[400px] left-1/2 -translate-x-1/2 w-[150px] h-[150px] bg-white rounded-full blur-[60px] pointer-events-none z-20 opacity-80"></div>

        <div className="relative z-30 mt-auto mb-10 w-full">
          <h2 className="text-white/60 font-sans text-xl uppercase tracking-[0.5em] mb-12">{subtitle}</h2>
          <h1 className="text-white font-serif font-bold text-[80px] leading-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {title}
          </h1>
          
          <p className="text-white/90 font-sans text-3xl font-light uppercase tracking-widest mt-12 px-12 leading-relaxed">
            {type}
          </p>

          <div className="mt-16 flex flex-col items-center">
            <div className="w-[1px] h-20 bg-white/30 mb-8"></div>
            <span className="text-white/60 text-lg uppercase tracking-widest">{date}</span>
            <span className="text-white/90 text-2xl font-bold uppercase tracking-widest mt-4">{companyName}</span>
          </div>
        </div>
      </div>
    );
  }

  if (templateId === "template-law") {
    return (
      <div className="w-full h-full bg-[#381607] flex flex-col items-center p-16 relative overflow-hidden border-8 border-[#753414]">
        <div className="absolute inset-0 bg-[#4a1d09] mix-blend-multiply opacity-50" style={{ backgroundImage: "radial-gradient(#753414 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
        
        <div className="relative z-10 w-full border border-[#9c4a22] h-full p-12 flex flex-col bg-[#2e1104]/80 backdrop-blur-sm">
          <div className="flex justify-between items-start w-full">
            <h2 className="text-[#d88755] font-sans text-lg uppercase tracking-[0.3em] font-bold">{subtitle}</h2>
            <span className="text-[#d88755]/70 font-sans text-sm tracking-widest">{date}</span>
          </div>
          
          <div className="flex flex-col justify-center flex-1 my-12">
            <div className="w-16 h-1 bg-[#d88755] mb-8"></div>
            <h1 className="text-white font-serif text-[85px] leading-tight uppercase tracking-wide">
              {title}
            </h1>
            <p className="text-[#e8a379] font-sans text-3xl mt-12 italic font-light tracking-wide">{type}</p>
          </div>
          
          <div className="w-full mt-auto flex items-end justify-between border-t border-[#9c4a22]/50 pt-8">
             <div className="w-24 h-24 rounded-full border-4 border-[#d88755]/30 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-[#d88755]/60 flex items-center justify-center">
                   <div className="w-8 h-8 rounded-full bg-[#d88755]/90"></div>
                </div>
             </div>
             <h3 className="text-[#fff3eb] font-sans text-2xl font-bold uppercase tracking-[0.2em]">{companyName}</h3>
          </div>
        </div>
      </div>
    );
  }

  if (templateId === "template-effective") {
    const titleWords = title.split(" ");
    const goldWord = titleWords[0] || "";
    const blackWords = titleWords.slice(1).join(" ");

    return (
      <div className="w-full h-full bg-[#f8f9fa] flex flex-col items-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/5 mix-blend-multiply pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"noiseFilter\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(%23noiseFilter)\"/></svg>')", opacity: 0.4 }}></div>
        
        <div className="relative z-10 w-full mt-10">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="h-px bg-slate-800 w-16"></div>
            <h2 className="text-slate-900 font-sans text-xl uppercase tracking-[0.3em] font-bold">{subtitle}</h2>
            <div className="h-px bg-slate-800 w-16"></div>
          </div>

          <div className="text-center flex flex-col">
            <span className="text-[#b58c2a] font-sans font-extrabold text-[100px] leading-none uppercase tracking-tighter" style={{ transform: "scaleY(1.2)" }}>{goldWord}</span>
            <span className="text-slate-900 font-sans font-extrabold text-[110px] leading-none uppercase tracking-tighter" style={{ transform: "scaleY(1.2)" }}>{blackWords}</span>
          </div>

          <p className="text-slate-700 font-serif text-2xl text-center mt-12 px-10 leading-snug">{type}</p>
        </div>

        <div className="relative z-10 mt-auto w-full flex flex-col items-center">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="#b58c2a" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-10 drop-shadow-xl"> 
            <path d="M7 20h10" /><path d="M10 20v-5h4v5" /><path d="M12 15V8" /><path d="M12 8l3 3" /><path d="M12 8l-3 3" /><path d="M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
          <div className="w-full h-px bg-slate-300 mb-6"></div>
          <h3 className="text-slate-900 font-sans text-3xl font-bold uppercase tracking-widest">{companyName}</h3>
        </div>
      </div>
    );
  }

  if (templateId === "template-beginner") {
    return (
      <div className="w-full h-full bg-[#fdfcfb] flex flex-col relative overflow-hidden">
        <div className="bg-[#1b4332] w-full py-6 flex justify-center mt-12">
          <h2 className="text-white font-sans text-2xl uppercase tracking-[0.4em] font-bold">{subtitle}</h2>
        </div>
        
        <div className="px-16 mt-16 z-10">
          <h1 className="text-[#1b4332] font-sans font-extrabold text-[90px] leading-[0.9] uppercase tracking-tight">
            {title}
          </h1>
          <p className="text-slate-800 font-sans text-3xl font-medium mt-10 leading-snug max-w-[80%]">
            {type}
          </p>
        </div>

        <div className="mt-auto relative w-full h-[450px] flex items-end justify-center pb-0">
          <svg width="500" height="400" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="0.5" className="opacity-80 absolute bottom-10">
            <path d="M3 3v18h18" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M18 17V9" strokeWidth="2" strokeLinecap="round" />
            <path d="M13 17V5" strokeWidth="2" strokeLinecap="round" />
            <path d="M8 17v-3" strokeWidth="2" strokeLinecap="round" />
            <circle cx="15" cy="18" r="4" fill="#fbbf24" stroke="none" />
            <text x="13.5" y="19.5" fill="#b45309" fontSize="4" fontWeight="bold">$</text>
          </svg>
          
          <div className="w-full flex justify-between px-16 absolute bottom-10 z-10">
            <div className="w-16 h-32 bg-[#40916c] rounded-t-md opacity-20"></div>
            <div className="w-16 h-48 bg-[#40916c] rounded-t-md opacity-40"></div>
            <div className="w-16 h-64 bg-[#40916c] rounded-t-md opacity-60"></div>
            <div className="w-16 h-80 bg-[#40916c] rounded-t-md opacity-80"></div>
          </div>
          
          <div className="absolute bottom-8 right-32 z-20 w-32 h-32 bg-[#fbbf24] rounded-full flex items-center justify-center shadow-lg border-4 border-white">
            <span className="text-[#b45309] text-6xl font-bold font-serif">$</span>
          </div>
        </div>
      </div>
    );
  }

  if (templateId === "template-designing") {
    const titleWords = title.split(" ");
    const goldWord = titleWords[0] || "";
    const otherWords = titleWords.slice(1).join(" ");

    return (
      <div className="w-full h-full bg-[#0a0a0b] flex flex-col items-center p-20 relative overflow-hidden text-center">
        
        <div className="relative z-10 w-full mt-24">
          <h2 className="text-white font-sans text-2xl uppercase tracking-[0.4em] mb-12">{subtitle}</h2>
          <h1 className="text-[#e8c37a] font-serif text-[110px] leading-[0.9] uppercase drop-shadow-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
            {goldWord}<br />{otherWords}
          </h1>
          <p className="text-white font-sans text-2xl mt-12 tracking-wide font-light">{type}</p>
        </div>

        {/* Glowing swoosh */}
        <div className="absolute bottom-60 left-1/2 -translate-x-1/2 w-[120%] h-[200px] border-b-[4px] border-white/80 rounded-[50%] blur-[2px]" style={{
          boxShadow: "0 20px 50px -10px #3b82f6, 0 10px 30px -5px #f59e0b"
        }}></div>
        <div className="absolute bottom-60 left-1/2 -translate-x-1/2 w-[120%] h-[200px] border-b-[2px] border-white rounded-[50%]"></div>
        
        <div className="absolute bottom-52 left-1/4 w-[100px] h-[100px] bg-orange-500 rounded-full blur-[60px] opacity-60"></div>
        <div className="absolute bottom-52 right-1/4 w-[100px] h-[100px] bg-blue-500 rounded-full blur-[60px] opacity-60"></div>

        <div className="relative z-10 mt-auto w-full">
          <div className="w-full h-[1px] bg-white/20 mb-8"></div>
          <h3 className="text-white font-sans text-2xl uppercase tracking-widest">{companyName}</h3>
        </div>
      </div>
    );
  }

  
  // --- NEW THEMES HANDLING ---
  
  if (templateId?.startsWith("template-minimal-")) {
    const colorMap = {
      "1": "bg-white text-slate-900 border-slate-200",
      "2": "bg-[#0a0a0b] text-white border-slate-800",
      "3": "bg-[#f5f5f4] text-stone-900 border-stone-300",
      "4": "bg-[#f0f9ff] text-sky-950 border-sky-200",
      "5": "bg-[#fff1f2] text-rose-950 border-rose-200",
      "6": "bg-[#f0fdf4] text-emerald-950 border-emerald-200",
    };
    const suffix = templateId.split("-").pop();
    const classes = colorMap[suffix] || colorMap["1"];
    
    return (
      <div className={`w-full h-full flex flex-col p-20 relative overflow-hidden ${classes}`}>
        <div className="absolute top-20 right-20 w-32 h-[1px] bg-current opacity-30"></div>
        <div className="absolute top-20 right-20 w-[1px] h-32 bg-current opacity-30"></div>
        
        <div className="mt-32 w-full z-10 flex flex-col">
          <h2 className="font-sans text-lg uppercase tracking-[0.4em] mb-16 opacity-60 font-light">{subtitle}</h2>
          <h1 className="font-sans text-[70px] leading-[1.1] tracking-tight font-extrabold max-w-[90%]">
            {title}
          </h1>
          <p className="font-serif text-3xl mt-12 opacity-80 italic">{type}</p>
        </div>
        
        <div className="mt-auto w-full flex justify-between items-end pb-8 border-b border-current border-opacity-20">
          <div>
            <p className="font-mono text-sm opacity-50 uppercase tracking-widest mb-2">DATE</p>
            <p className="font-sans text-lg">{date}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm opacity-50 uppercase tracking-widest mb-2">ÉDITEUR</p>
            <p className="font-sans font-bold text-xl uppercase tracking-widest">{companyName}</p>
          </div>
        </div>
      </div>
    );
  }

  if (templateId?.startsWith("template-editorial-")) {
    const colorMap = {
      "1": { bg: "bg-[#FDFBF7]", text: "text-[#2C2C2C]", accent: "bg-[#2C2C2C]" },
      "2": { bg: "bg-[#1A1A1A]", text: "text-[#F5F5F5]", accent: "bg-[#D4AF37]" },
      "3": { bg: "bg-[#EEF2FF]", text: "text-[#312E81]", accent: "bg-[#4338CA]" },
      "4": { bg: "bg-[#022C22]", text: "text-[#D1FAE5]", accent: "bg-[#10B981]" },
      "5": { bg: "bg-[#4C0519]", text: "text-[#FFE4E6]", accent: "bg-[#F43F5E]" },
      "6": { bg: "bg-[#FEFCE8]", text: "text-[#713F12]", accent: "bg-[#EAB308]" },
    };
    const suffix = templateId.split("-").pop();
    const colors = colorMap[suffix] || colorMap["1"];
    
    return (
      <div className={`w-full h-full flex flex-col items-center p-12 relative overflow-hidden border-[16px] border-white shadow-inner ${colors.bg} ${colors.text}`}>
        <div className="w-full border-b-2 border-current pb-6 mb-16 flex justify-between items-center opacity-80">
          <span className="font-sans text-sm uppercase tracking-widest">{date}</span>
          <span className="font-serif text-sm uppercase tracking-[0.3em]">{subtitle}</span>
          <span className="font-sans text-sm uppercase tracking-widest">N° 01</span>
        </div>
        
        <div className="text-center w-full px-8">
          <h1 className="font-serif text-[100px] leading-[0.9] tracking-tighter uppercase">
            {title}
          </h1>
        </div>
        
        <div className="mt-16 w-full flex justify-center">
          <div className={`w-24 h-1 ${colors.accent}`}></div>
        </div>
        
        <div className="mt-12 text-center max-w-lg">
          <p className="font-serif text-2xl italic leading-relaxed opacity-90">{type}</p>
        </div>
        
        <div className="mt-auto w-full pt-12 text-center">
          <h3 className="font-sans text-3xl font-bold uppercase tracking-[0.2em]">{companyName}</h3>
        </div>
      </div>
    );
  }

  if (templateId?.startsWith("template-corporate-")) {
    const colorMap = {
      "1": { bg: "bg-slate-900", text: "text-white", primary: "bg-blue-600" },
      "2": { bg: "bg-slate-100", text: "text-slate-900", primary: "bg-slate-800" },
      "3": { bg: "bg-blue-950", text: "text-blue-50", primary: "bg-cyan-500" },
      "4": { bg: "bg-zinc-950", text: "text-zinc-50", primary: "bg-zinc-700" },
      "5": { bg: "bg-blue-50", text: "text-sky-900", primary: "bg-sky-500" },
      "6": { bg: "bg-stone-900", text: "text-orange-50", primary: "bg-orange-600" },
    };
    const suffix = templateId.split("-").pop();
    const colors = colorMap[suffix] || colorMap["1"];
    
    return (
      <div className={`w-full h-full flex flex-col relative overflow-hidden ${colors.bg} ${colors.text}`}>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-bl-full opacity-10 bg-white"></div>
        <div className={`absolute top-0 right-0 w-[400px] h-[400px] rounded-bl-full opacity-20 ${colors.primary}`}></div>
        
        <div className="p-20 relative z-10 flex flex-col h-full">
          <div className="flex items-center space-x-4 mb-24">
            <div className={`w-12 h-12 ${colors.primary} rounded-br-3xl`}></div>
            <h3 className="font-sans font-bold text-2xl tracking-widest uppercase">{companyName}</h3>
          </div>
          
          <div className="mt-10">
            <h2 className={`font-sans text-xl uppercase tracking-widest mb-6 font-semibold opacity-80`}>{subtitle}</h2>
            <h1 className="font-sans text-[75px] leading-[1.1] font-bold tracking-tight mb-12 max-w-[90%]">
              {title}
            </h1>
            <div className={`w-20 h-2 ${colors.primary} mb-12`}></div>
            <p className="font-sans text-3xl font-light opacity-90">{type}</p>
          </div>
          
          <div className="mt-auto">
            <p className="font-mono text-lg opacity-60 uppercase tracking-widest">{date}</p>
          </div>
        </div>
      </div>
    );
  }

  if (templateId?.startsWith("template-modern-")) {
    const colorMap = {
      "1": "from-purple-900 via-[#0a0a0a] to-black",
      "2": "from-cyan-900 via-[#0a0a0a] to-black",
      "3": "from-rose-900 via-[#0a0a0a] to-black",
      "4": "from-emerald-900 via-[#0a0a0a] to-black",
      "5": "from-orange-900 via-[#0a0a0a] to-black",
      "6": "from-sky-900 via-[#0a0a0a] to-[#0f172a]",
    };
    const glowMap = {
      "1": "bg-purple-500", "2": "bg-cyan-500", "3": "bg-rose-500",
      "4": "bg-emerald-500", "5": "bg-orange-500", "6": "bg-sky-500"
    };
    const suffix = templateId.split("-").pop();
    const gradient = colorMap[suffix] || colorMap["1"];
    const glow = glowMap[suffix] || glowMap["1"];
    
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center p-20 relative overflow-hidden bg-gradient-to-br ${gradient} text-white text-center`}>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${glow} rounded-full blur-[150px] opacity-20 pointer-events-none`}></div>
        
        <div className="relative z-10 w-full flex flex-col items-center">
          <p className="font-mono text-sm tracking-[0.5em] opacity-60 uppercase mb-16 border-b border-white/20 pb-4 px-8">{subtitle}</p>
          
          <h1 className="font-sans text-[80px] leading-tight font-extrabold tracking-tighter mb-8 drop-shadow-2xl">
            {title}
          </h1>
          
          <p className="font-sans text-2xl font-light opacity-80 mb-20">{type}</p>
        </div>
        
        <div className="absolute bottom-20 left-20 right-20 flex justify-between items-center opacity-60 font-mono text-sm tracking-widest uppercase">
          <span>{date}</span>
          <span className="font-bold">{companyName}</span>
        </div>
      </div>
    );
  }

  if (templateId?.startsWith("template-brutalist-")) {
    const colorMap = {
      "1": { bg: "bg-yellow-400", text: "text-black", accent: "bg-black" },
      "2": { bg: "bg-[#111111]", text: "text-white", accent: "bg-white" },
      "3": { bg: "bg-red-600", text: "text-white", accent: "bg-[#111111]" },
      "4": { bg: "bg-blue-600", text: "text-white", accent: "bg-black" },
      "5": { bg: "bg-[#f4f4f0]", text: "text-black", accent: "bg-blue-600" },
      "6": { bg: "bg-green-500", text: "text-black", accent: "bg-black" },
    };
    const suffix = templateId.split("-").pop();
    const colors = colorMap[suffix] || colorMap["1"];
    
    return (
      <div className={`w-full h-full flex flex-col p-16 relative overflow-hidden ${colors.bg} ${colors.text}`}>
        <div className="w-full h-full border-8 border-current relative p-12 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <h2 className={`font-mono text-xl uppercase font-bold py-2 px-4 ${colors.accent} ${colors.bg === 'bg-[#111111]' || colors.bg === 'bg-red-600' || colors.bg === 'bg-blue-600' ? 'text-black' : 'text-white'}`}>
              {subtitle}
            </h2>
            <span className="font-mono text-2xl font-bold uppercase border-b-4 border-current pb-2">{date}</span>
          </div>
          
          <div className="my-16">
            <h1 className="font-sans text-[110px] leading-[0.85] font-black uppercase tracking-tighter mix-blend-difference" style={{ wordBreak: 'break-word' }}>
              {title}
            </h1>
          </div>
          
          <div className="flex justify-between items-end">
            <p className="font-sans text-4xl font-bold uppercase max-w-[50%]">{type}</p>
            <div className="text-right">
              <div className="w-32 h-4 bg-current mb-4 ml-auto"></div>
              <h3 className="font-mono text-3xl font-black uppercase">{companyName}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // Fallback for standard or unknown custom images
  const isImported = doc.coverImage?.startsWith('data:') || doc.coverImage?.startsWith('http');
  
  if (isImported) {
    return (
      <img 
        src={doc.coverImage} 
        alt="Page de couverture" 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  const isLight = doc.coverImage?.includes('light-cover') || doc.coverImage?.includes('light');
  
  return (
    <>
      <div className={`w-full h-full ${isLight ? 'bg-slate-50' : 'bg-slate-900'}`}></div>
      
      {/* Dynamic Cover Overlay for elegant preset themes */}
      <div className={`absolute inset-0 flex flex-col justify-between p-[100px] text-center pointer-events-none select-none z-10 ${
        isLight ? 'text-slate-900' : 'text-white'
      }`}>
        <div className="mt-12">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] opacity-75">{subtitle}</p>
          <div className={`w-16 h-[2px] mx-auto mt-6 opacity-40 ${isLight ? 'bg-slate-900' : 'bg-white'}`}></div>
        </div>
        <div className="my-auto px-8">
          <h1 className="font-sans font-bold text-5xl tracking-tight leading-snug drop-shadow-sm mb-6">{title}</h1>
          <p className="text-xl font-light opacity-80 uppercase tracking-widest">{type}</p>
        </div>
        <div className="mb-12 text-sm">
          <p className="font-bold tracking-widest uppercase mb-2">{companyName}</p>
          <p className="opacity-70 font-mono text-sm">{date}</p>
        </div>
      </div>
    </>
  );
}

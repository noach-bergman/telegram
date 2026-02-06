
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

interface PizzaStats {
  level: number; // 1-5 scale as used in pizzint.watch
  threatLevel: string;
  why: string;
  facts: string[];
  lastUpdate: string;
}

const PizzaMeter: React.FC = () => {
  const [stats, setStats] = useState<PizzaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRealPizzaData = async () => {
    setLoading(true);
    setError(null);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const targetUrl = "https://www.pizzint.watch/";
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    
    try {
      const htmlResponse = await fetch(proxyUrl);
      let siteContext = "";
      if (htmlResponse.ok) {
        const rawHtml = await htmlResponse.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, 'text/html');
        
        // Extract specific elements known to be on pizzint.watch
        const mainContent = doc.querySelector('main') || doc.body;
        siteContext = mainContent.innerText.substring(0, 4000);
      }

      const prompt = `אתה אנליסט מודיעין. חלץ נתונים מהטקסט הבא שנלקח מהאתר pizzint.watch (אתר העוקב אחר 'מדד הפיצה' בפנטגון).
      עליך להחזיר אובייקט JSON מדויק עם השדות הבאים בעברית:
      - level: מספר הרמה הנוכחי (בד"כ 1-5).
      - threatLevel: שם רמת האיום (למשל: "Low", "Elevated", "High"). תרגם לעברית מקצועית.
      - why: הסבר קצר (השדה "Why?" באתר) המסביר מדוע המדד ברמה הזו.
      - facts: רשימה של 3-4 עובדות או אירועים גיאופוליטיים שמוזכרים באתר כקשורים למדד.
      - lastUpdate: זמן העדכון האחרון שמופיע.

      הטקסט מהאתר:
      ${siteContext}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              level: { type: Type.NUMBER },
              threatLevel: { type: Type.STRING },
              why: { type: Type.STRING },
              facts: { type: Type.ARRAY, items: { type: Type.STRING } },
              lastUpdate: { type: Type.STRING }
            },
            required: ["level", "threatLevel", "why", "facts", "lastUpdate"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setStats(result);
    } catch (err) {
      console.error("Pizza Meter Error:", err);
      setError("נכשל בניסיון לשאוב נתונים חיים. מציג נתוני שגרה.");
      setStats({
        level: 1,
        threatLevel: "שגרה (Low)",
        why: "לא ניתן היה להתחבר לשרתי Pizzint.watch. ייתכן שיש עומס על הפרוקסי.",
        facts: ["הפנטגון פועל כבשגרה.", "אין דיווחים חריגים על הזמנות פיצה ליליות."],
        lastUpdate: new Date().toLocaleTimeString('he-IL')
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealPizzaData();
  }, []);

  const getLevelColor = (level: number) => {
    switch(level) {
      case 1: return 'text-emerald-500 bg-emerald-500';
      case 2: return 'text-yellow-500 bg-yellow-500';
      case 3: return 'text-orange-500 bg-orange-500';
      case 4: return 'text-red-500 bg-red-500';
      case 5: return 'text-purple-600 bg-purple-600';
      default: return 'text-slate-400 bg-slate-400';
    }
  };

  const getLevelName = (level: number) => {
    const names = ["", "שגרה מלאה", "ערנות מוגברת", "דריכות גבוהה", "סכנה מיידית", "חירום לאומי"];
    return names[level] || "לא ידוע";
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-10 overflow-y-auto bg-[#0a0a0c] text-white">
      <div className="max-w-4xl mx-auto w-full">
        
        {/* Header - Modern Tactical Look */}
        <div className="mb-12 border-b border-white/10 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="flex h-3 w-3 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[11px] font-black tracking-[0.3em] text-white/40 uppercase">Global Strategic Monitoring</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter italic">PIZZINT<span className="text-orange-500">.</span>WATCH</h1>
            <p className="text-white/60 text-sm mt-2 font-medium">מעקב בזמן אמת אחר פעילות חריגה במרכזי קבלת החלטות</p>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black text-white/30 uppercase mb-1">Last Intelligence Sync</div>
             <div className="text-sm font-mono text-orange-500">{stats?.lastUpdate || '--:--:--'}</div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="w-16 h-16 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin"></div>
            <div className="text-xs font-black tracking-widest text-white/40 uppercase animate-pulse">Establishing Secure Connection...</div>
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-1000">
            
            {/* Left Side: The Meter */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center justify-center relative group">
              <div className="absolute top-8 left-8 flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${getLevelColor(stats.level).split(' ')[1]}`}></div>
                 <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Current Alert Status</span>
              </div>

              {/* Tactical Level Display */}
              <div className="relative mb-8">
                <svg className="w-64 h-64 -rotate-90">
                  <circle cx="128" cy="128" r="120" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" strokeDasharray="8 8" />
                  <circle 
                    cx="128" cy="128" r="110" fill="none" 
                    stroke="rgba(255,255,255,0.05)" strokeWidth="20" 
                  />
                  <circle 
                    cx="128" cy="128" r="110" fill="none" 
                    stroke="currentColor" strokeWidth="20" 
                    strokeDasharray={691}
                    strokeDashoffset={691 - (691 * (stats.level / 5))}
                    className={`transition-all duration-1000 ease-out ${getLevelColor(stats.level).split(' ')[0]}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <div className="text-8xl font-black italic">{stats.level}</div>
                   <div className="text-[10px] font-black text-white/40 tracking-[0.4em] -mt-2">LEVEL</div>
                </div>
              </div>

              <div className="text-center">
                 <h2 className={`text-3xl font-black uppercase tracking-tight mb-2 ${getLevelColor(stats.level).split(' ')[0]}`}>
                   {stats.threatLevel}
                 </h2>
                 <p className="text-white/40 text-xs font-bold">{getLevelName(stats.level)}</p>
              </div>
            </div>

            {/* Right Side: Intelligence & "Why" */}
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                <h3 className="text-orange-500 text-[11px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                  מדוע המדד השתנה?
                </h3>
                <p className="text-lg font-bold leading-relaxed text-white/90 italic">
                  "{stats.why}"
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                <h3 className="text-white/40 text-[11px] font-black uppercase tracking-widest mb-6">Key Intelligence Indicators</h3>
                <div className="space-y-4">
                  {stats.facts.map((fact, i) => (
                    <div key={i} className="flex gap-4 items-start group">
                      <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-[10px] font-black text-white/30 border border-white/10 shrink-0 group-hover:border-orange-500/50 transition-colors">
                        0{i+1}
                      </div>
                      <p className="text-sm font-medium text-white/70 leading-snug group-hover:text-white transition-colors">
                        {fact}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={fetchRealPizzaData}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-5 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-orange-600/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                סנכרן נתונים מול PIZZINT.WATCH
              </button>
            </div>

          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <footer className="mt-20 text-center opacity-20 hover:opacity-100 transition-opacity">
           <p className="text-[9px] font-black tracking-[0.5em] uppercase">All data processed via secure proxy and decentralized intelligence analysis.</p>
        </footer>
      </div>
    </div>
  );
};

export default PizzaMeter;

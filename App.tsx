
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import NewsCard from './components/NewsCard';
import PizzaMeter from './components/PizzaMeter';
import { TelegramMessage, AppStatus } from './types';
import { telegramService } from './services/telegramService';

const App: React.FC = () => {
  const [news, setNews] = useState<TelegramMessage[]>([]);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'news' | 'pizza'>('news');
  
  const [channels, setChannels] = useState<string[]>(() => {
    const saved = localStorage.getItem('telnews_channels');
    return saved ? JSON.parse(saved) : ['abualiexpress', 'lelotsenzura', 'moriah_news', 'salehdesk1'];
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // פונקציה אמינה יותר לגלילה לסוף
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      // שימוש ב-requestAnimationFrame כדי להבטיח שה-DOM הספיק להתרנדר
      requestAnimationFrame(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: behavior
        });
      });
    }
  }, []);

  // אפקט לגלילה אוטומטית כשעוברים בין תצוגות או כשיש הודעות חדשות
  useEffect(() => {
    if (currentView === 'news' && news.length > 0) {
      // אם זו טעינה ראשונה, נגלול מהר ללא אנימציה כדי לא להציק למשתמש
      scrollToBottom(isFirstLoad.current ? 'auto' : 'smooth');
      if (isFirstLoad.current) isFirstLoad.current = false;
    }
  }, [currentView, news.length, scrollToBottom]);

  const loadData = useCallback(async (isAuto = false) => {
    if (channels.length === 0) {
      setNews([]);
      setStatus(AppStatus.SUCCESS);
      return;
    }

    if (!isAuto) setStatus(AppStatus.LOADING);
    
    try {
      const data = await telegramService.fetchLatestNews(channels);
      // בדיקה אם הגיעו הודעות חדשות באמת כדי לא להקפיץ את הגלילה סתם
      setNews(prev => {
        if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
        return data;
      });
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      console.error("Load Error:", err);
      if (!isAuto) setStatus(AppStatus.ERROR);
    }
  }, [channels]);

  useEffect(() => {
    localStorage.setItem('telnews_channels', JSON.stringify(channels));
    loadData();
  }, [channels, loadData]);

  useEffect(() => {
    const interval = setInterval(() => loadData(true), 60000); 
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredNews = useMemo(() => {
    if (!selectedChannel) return news;
    return news.filter(m => m.channelUsername.toLowerCase() === selectedChannel.toLowerCase());
  }, [news, selectedChannel]);

  const groupedNews = useMemo(() => {
    const groups: { [key: string]: TelegramMessage[] } = {};
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1); yesterday.setHours(0,0,0,0);

    filteredNews.forEach(msg => {
      const d = new Date(msg.date); d.setHours(0,0,0,0);
      let label = d.getTime() === today.getTime() ? "היום" : 
                  (d.getTime() === yesterday.getTime() ? "אתמול" : 
                  d.toLocaleDateString('he-IL', {day:'numeric', month:'long'}));
      if (!groups[label]) groups[label] = [];
      groups[label].push(msg);
    });
    return Object.entries(groups);
  }, [filteredNews]);

  const handleAddChannel = (name: string) => {
    const cleanName = name.replace('https://t.me/', '').replace('@', '').replace('/s/', '').split('?')[0].trim();
    if (cleanName && !channels.some(c => c.toLowerCase() === cleanName.toLowerCase())) {
      setChannels([...channels, cleanName]);
    }
  };

  return (
    <div className="min-h-screen flex h-screen overflow-hidden bg-slate-100">
      <Sidebar 
        channels={channels} 
        activeChannel={selectedChannel}
        currentView={currentView}
        onViewChange={setCurrentView}
        onSelectChannel={(ch) => { 
          setSelectedChannel(ch); 
          setCurrentView('news'); 
          // גלילה לסוף כשמחליפים ערוץ
          setTimeout(() => scrollToBottom('smooth'), 100);
        }}
        onAddChannel={handleAddChannel} 
        onRemoveChannel={(n) => setChannels(channels.filter(c => c !== n))} 
        onClearAll={() => { if(confirm('למחוק את כל הערוצים?')) setChannels([]); }}
      />
      
      <main className="flex-1 lg:mr-80 flex flex-col h-full relative overflow-hidden">
        {currentView === 'news' ? (
          <>
            <header className="flex-shrink-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black uppercase shadow-lg shadow-blue-600/20">
                   {selectedChannel ? selectedChannel[0] : 'ALL'}
                 </div>
                 <div>
                    <h2 className="text-base font-black text-slate-900 leading-tight">
                      {selectedChannel ? `@${selectedChannel}` : 'פיד משולב'}
                    </h2>
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{filteredNews.length} הודעות זמינות</span>
                 </div>
              </div>
              <button 
                onClick={() => loadData()} 
                disabled={status === AppStatus.LOADING}
                className="p-2 hover:bg-slate-100 rounded-full transition-all disabled:opacity-50 group"
                title="רענן חדשות"
              >
                <svg className={`w-5 h-5 ${status === AppStatus.LOADING ? 'animate-spin text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar bg-[#e7ebf0] relative">
              <div className="max-w-3xl mx-auto w-full pb-24">
                {status === AppStatus.LOADING && news.length === 0 && (
                    <div className="bg-white/90 backdrop-blur p-12 rounded-3xl border border-blue-100 text-center mb-6 shadow-xl animate-pulse">
                       <div className="text-4xl mb-4">📡</div>
                       <p className="text-blue-600 font-black text-lg">סורק ערוצים כעת...</p>
                       <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-widest">מנסה להתחבר דרך Triple-Path Proxy</p>
                    </div>
                )}

                {status === AppStatus.SUCCESS && news.length === 0 && channels.length > 0 && (
                   <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-lg">
                      <div className="text-5xl mb-4">⏳</div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">לא נמצאו הודעות חדשות</h3>
                      <p className="text-slate-500 text-sm mb-6 font-medium">המערכת לא זיהתה פעילות בערוצים אלו ב-48 השעות האחרונות או שיש חסימת תקשורת זמנית.</p>
                      <button onClick={() => loadData()} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 uppercase">נסה שוב</button>
                   </div>
                )}
                
                <div className="flex flex-col space-y-4">
                    {groupedNews.map(([label, messages]) => (
                      <React.Fragment key={label}>
                        <div className="flex justify-center my-6 sticky top-4 z-10 pointer-events-none">
                            <span className="bg-slate-500/80 backdrop-blur text-white text-[10px] font-black px-5 py-2 rounded-full shadow-xl border border-white/20 uppercase tracking-[0.2em]">
                              {label}
                            </span>
                        </div>
                        {messages.map((item) => (
                            <NewsCard key={`${item.channelUsername}-${item.id}`} message={item} />
                        ))}
                      </React.Fragment>
                    ))}
                </div>
              </div>
            </div>
          </>
        ) : <PizzaMeter />}

        {/* כפתור גלילה מהירה למטה - תמיד זמין ומשופר */}
        <button 
           onClick={() => scrollToBottom('smooth')}
           className="fixed bottom-8 left-8 w-14 h-14 bg-white text-blue-600 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-slate-100 z-50 active:scale-90 transition-all hover:bg-blue-50 hover:shadow-blue-200 group"
           title="גלול לסוף"
        >
           <svg className="w-6 h-6 transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
           </svg>
        </button>
      </main>
    </div>
  );
};

export default App;

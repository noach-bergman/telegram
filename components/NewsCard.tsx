
import React, { useState } from 'react';
import { TelegramMessage, NewsInsight } from '../types';
import { geminiService } from '../services/geminiService';

interface NewsCardProps {
  message: TelegramMessage;
}

const NewsCard: React.FC<NewsCardProps> = ({ message }) => {
  const [insight, setInsight] = useState<NewsInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (insight) return;
    setLoading(true);
    setError(null);
    try {
      const result = await geminiService.analyzeNews(message.text);
      setInsight(result);
    } catch (err) {
      setError('שגיאה בניתוח AI');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: number) => {
    return new Date(date).toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col items-start mb-4 group animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="message-bubble bg-white rounded-2xl rounded-tr-none shadow-md border border-slate-200/60 w-full max-w-2xl overflow-hidden transition-all hover:shadow-lg">
        
        {/* ערוץ וזמן */}
        <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-black text-blue-600 uppercase tracking-tighter">
            {message.channelName}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
            <span>{formatTime(message.date)}</span>
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
        </div>

        {/* תוכן ויזואלי */}
        {message.photoUrl && (
          <div className="relative group/img overflow-hidden">
            <img 
              src={message.photoUrl} 
              alt="Content" 
              className="w-full object-cover max-h-[500px] transition-transform duration-500 group-hover/img:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
          </div>
        )}

        {/* טקסט */}
        <div className="px-4 py-4">
          <p className="text-[15px] text-slate-800 leading-[1.6] whitespace-pre-wrap break-words font-medium">
            {message.text}
          </p>
        </div>

        {/* פעולות AI */}
        <div className="px-4 pb-4 flex items-center">
             <button 
                onClick={handleAnalyze}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border ${
                  insight ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className={`${loading ? 'animate-spin' : ''}`}>
                   {insight ? '✨' : '⚡'}
                </div>
                <span className="text-[11px] font-black uppercase">{loading ? 'מנתח...' : insight ? 'ניתוח AI הושלם' : 'ניתוח AI מהיר'}</span>
              </button>
        </div>

        {/* תוצאות AI */}
        {insight && (
          <div className="mx-4 mb-4 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 animate-in zoom-in-95 duration-500">
             <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">מסקנות בינה מלאכותית</span>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black text-white ${
                  insight.impact === 'high' ? 'bg-red-500' : 'bg-indigo-500'
                }`}>
                  {insight.impact === 'high' ? 'דחוף' : 'רגיל'}
                </span>
             </div>
             <p className="text-sm text-slate-700 leading-relaxed font-bold mb-3">{insight.summary}</p>
             <div className="flex flex-wrap gap-1.5">
                {insight.tags.map(tag => (
                  <span key={tag} className="text-[9px] bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-md border border-indigo-100 text-indigo-500 font-bold">#{tag}</span>
                ))}
             </div>
          </div>
        )}

        {error && <div className="px-4 pb-3 text-[10px] text-red-500 font-bold">{error}</div>}
      </div>
    </div>
  );
};

export default NewsCard;

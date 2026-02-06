
import React, { useState } from 'react';

interface SidebarProps {
  channels: string[];
  activeChannel: string | null;
  currentView: 'news' | 'pizza';
  onViewChange: (view: 'news' | 'pizza') => void;
  onSelectChannel: (name: string | null) => void;
  onAddChannel: (name: string) => void;
  onRemoveChannel: (name: string) => void;
  onClearAll: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  channels, 
  activeChannel, 
  currentView,
  onViewChange,
  onSelectChannel, 
  onAddChannel, 
  onRemoveChannel, 
  onClearAll 
}) => {
  const [newChannel, setNewChannel] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChannel.trim()) {
      onAddChannel(newChannel.trim());
      setNewChannel('');
    }
  };

  const handleCombinedFeed = () => {
    onSelectChannel(null);
    onViewChange('news');
  };

  return (
    <aside className="w-80 bg-slate-950 text-white h-screen fixed right-0 top-0 z-50 hidden lg:flex flex-col shadow-2xl border-l border-slate-800">
      <div className="p-8 border-b border-slate-800/50">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">TeleNews<span className="text-blue-500 text-3xl leading-none">.</span></h1>
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Professional Aggregator</p>
      </div>
      
      <div className="p-6 flex-1 flex flex-col min-h-0">
        
        <div className="space-y-1 mb-8">
           <button 
            onClick={handleCombinedFeed}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
              currentView === 'news' && activeChannel === null ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-900 text-slate-400'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${currentView === 'news' && activeChannel === null ? 'bg-white/20' : 'bg-slate-800'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1" /></svg>
            </div>
            <span className="text-sm font-bold">פיד משולב</span>
          </button>

          <button 
            onClick={() => onViewChange('pizza')}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
              currentView === 'pizza' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'hover:bg-slate-900 text-slate-400'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${currentView === 'pizza' ? 'bg-white/20' : 'bg-slate-800'}`}>
              🍕
            </div>
            <span className="text-sm font-bold">מדד הפיצה</span>
          </button>
        </div>

        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
          <span>ערוצים</span>
          {channels.length > 0 && (
            <button onClick={onClearAll} className="text-[10px] text-red-400 hover:text-red-300 transition-colors lowercase font-medium">
              נקה
            </button>
          )}
        </h3>
        
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="relative group">
            <input 
              type="text"
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              placeholder="הוסף ערוץ..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 px-4 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-right placeholder:text-slate-600"
            />
            <button type="submit" className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-1 rounded-lg hover:bg-blue-500 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
        </form>

        <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-1">
          {channels.map(channel => (
            <div key={channel} className="group relative">
              <button 
                onClick={() => onSelectChannel(channel)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                  activeChannel === channel && currentView === 'news' ? 'bg-slate-900 border-r-4 border-blue-500' : 'hover:bg-slate-900/50 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                    activeChannel === channel && currentView === 'news' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {channel[0]}
                  </div>
                  <span className={`text-sm font-semibold truncate max-w-[140px] ${activeChannel === channel && currentView === 'news' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {channel}
                  </span>
                </div>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onRemoveChannel(channel); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

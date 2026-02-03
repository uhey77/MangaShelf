import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Library, 
  Heart, 
  Settings, 
  Bell, 
  Calendar, 
  ExternalLink, 
  ChevronRight, 
  Moon, 
  Sun, 
  CloudUpload,
  Filter,
  ArrowUpDown,
  StickyNote,
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';

// --- Types ---
interface MangaSeries {
  id: string;
  title: string;
  author: string;
  latestVolume: number;
  ownedVolumes: number[];
  nextReleaseDate?: string;
  isFavorite: boolean;
  notes: string;
  coverUrl: string;
  genre: string[];
}

// --- Mock Data ---
const INITIAL_DATA: MangaSeries[] = [
  {
    id: '1',
    title: '海辺のアドベンチャー',
    author: '山田 太郎',
    latestVolume: 12,
    ownedVolumes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    nextReleaseDate: '2026-03-15',
    isFavorite: true,
    notes: '5巻のラストシーンが最高。',
    coverUrl: 'https://images.unsplash.com/photo-1695671548955-74a180b8777d?q=80&w=400',
    genre: ['冒険', 'ファンタジー']
  },
  {
    id: '2',
    title: '都会の静寂',
    author: '佐藤 花子',
    latestVolume: 5,
    ownedVolumes: [1, 2, 3, 4, 5],
    nextReleaseDate: '2026-05-20',
    isFavorite: false,
    notes: '読んでいると落ち着く。',
    coverUrl: 'https://images.unsplash.com/photo-1705927450843-3c1abe9b17d6?q=80&w=400',
    genre: ['日常', 'ドラマ']
  },
  {
    id: '3',
    title: 'ネオン・ナイト',
    author: '田中 二郎',
    latestVolume: 8,
    ownedVolumes: [1, 2, 3],
    nextReleaseDate: '2026-02-10',
    isFavorite: false,
    notes: '3巻まで購入済み。続きが気になる。',
    coverUrl: 'https://images.unsplash.com/photo-1627905644737-c10eef6c542d?q=80&w=400',
    genre: ['SF', 'アクション']
  }
];

// --- Components ---

const ThemeContext = React.createContext({
  isDark: false,
  toggleTheme: () => {}
});

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState<'shelf' | 'search' | 'favorites' | 'settings'>('shelf');
  const [series, setSeries] = useState<MangaSeries[]>(INITIAL_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<MangaSeries | null>(null);

  const toggleTheme = () => setIsDark(!isDark);

  const filteredSeries = useMemo(() => {
    let result = series;
    if (searchQuery) {
      result = result.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeTab === 'favorites') {
      result = result.filter(s => s.isFavorite);
    }
    return result;
  }, [series, searchQuery, activeTab]);

  const updateSeries = (updated: MangaSeries) => {
    setSeries(prev => prev.map(s => s.id === updated.id ? updated : s));
    setSelectedSeries(updated);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-md bg-opacity-80 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Manga Shelf</h1>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Search Bar (Static on Shelf/Search/Fav tabs) */}
        {activeTab !== 'settings' && !selectedSeries && (
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text"
                placeholder="作品名・作者で検索"
                className={`w-full pl-10 pr-4 py-2 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800 focus:border-zinc-700' : 'bg-white border-zinc-200 focus:border-zinc-300'} focus:outline-none transition-all`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="pb-24">
          <AnimatePresence mode="wait">
            {!selectedSeries ? (
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 space-y-4"
              >
                {activeTab === 'settings' ? (
                  <SettingsView />
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredSeries.map(item => (
                      <SeriesCard 
                        key={item.id} 
                        item={item} 
                        onClick={() => setSelectedSeries(item)}
                        isDark={isDark}
                      />
                    ))}
                    {filteredSeries.length === 0 && (
                      <div className="py-20 text-center text-zinc-500">
                        <Library className="mx-auto mb-2 opacity-20" size={48} />
                        <p>作品が見つかりませんでした</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <SeriesDetail 
                series={selectedSeries} 
                onBack={() => setSelectedSeries(null)}
                onUpdate={updateSeries}
                isDark={isDark}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        {!selectedSeries && (
          <nav className={`fixed bottom-0 left-0 right-0 z-50 border-t ${isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white/80 border-zinc-200'} backdrop-blur-lg`}>
            <div className="max-w-md mx-auto flex items-center justify-around py-2">
              <NavButton active={activeTab === 'shelf'} onClick={() => setActiveTab('shelf')} icon={<Library size={22} />} label="本棚" />
              <NavButton active={activeTab === 'search'} onClick={() => setActiveTab('search')} icon={<Search size={22} />} label="検索" />
              <NavButton active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} icon={<Heart size={22} />} label="お気に入り" />
              <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={22} />} label="設定" />
            </div>
          </nav>
        )}
      </div>
    </ThemeContext.Provider>
  );
}

// --- Sub-components ---

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-blue-500' : 'text-zinc-400'}`}>
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function SeriesCard({ item, onClick, isDark }: { item: MangaSeries, onClick: () => void, isDark: boolean }) {
  const lastOwned = Math.max(...item.ownedVolumes, 0);
  const isUpToDate = lastOwned === item.latestVolume;

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex gap-4 p-3 rounded-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'} cursor-pointer`}
    >
      <div className="w-20 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-200 dark:bg-zinc-800">
        <ImageWithFallback src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold truncate">{item.title}</h3>
            {item.isFavorite && <Heart size={16} className="text-red-500 fill-red-500 flex-shrink-0" />}
          </div>
          <p className="text-xs text-zinc-500 truncate">{item.author}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {item.genre.map(g => (
              <span key={g} className={`text-[10px] px-1.5 py-0.5 rounded-md ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>
                {g}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">所持巻数</span>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold">{lastOwned}</span>
              <span className="text-zinc-400 text-xs">/ {item.latestVolume}</span>
              {isUpToDate ? (
                <CheckCircle2 size={14} className="text-green-500" />
              ) : (
                <AlertCircle size={14} className="text-amber-500" />
              )}
            </div>
          </div>
          {item.nextReleaseDate && !isUpToDate && (
            <div className={`text-[10px] px-2 py-1 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'} flex items-center gap-1`}>
              <Calendar size={10} />
              {item.nextReleaseDate.replace(/-/g, '/')} 次巻
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SeriesDetail({ series, onBack, onUpdate, isDark }: { series: MangaSeries, onBack: () => void, onUpdate: (s: MangaSeries) => void, isDark: boolean }) {
  const [noteText, setNoteText] = useState(series.notes);
  const lastOwned = Math.max(...series.ownedVolumes, 0);

  const toggleVolume = (vol: number) => {
    let newOwned = [...series.ownedVolumes];
    if (newOwned.includes(vol)) {
      newOwned = newOwned.filter(v => v !== vol);
    } else {
      newOwned = [...newOwned, vol].sort((a, b) => a - b);
    }
    onUpdate({ ...series, ownedVolumes: newOwned });
  };

  const toggleAll = () => {
    const isAllOwned = series.ownedVolumes.length === series.latestVolume;
    const newOwned = isAllOwned ? [] : Array.from({ length: series.latestVolume }, (_, i) => i + 1);
    onUpdate({ ...series, ownedVolumes: newOwned });
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 z-50 flex flex-col bg-inherit"
    >
      <header className={`px-4 py-3 flex items-center justify-between border-b ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-bold truncate px-4">{series.title}</h2>
        <button 
          onClick={() => onUpdate({ ...series, isFavorite: !series.isFavorite })}
          className={`p-2 rounded-full ${series.isFavorite ? 'text-red-500' : 'text-zinc-400'}`}
        >
          <Heart size={22} className={series.isFavorite ? 'fill-red-500' : ''} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <div className="flex gap-4">
          <div className="w-28 h-40 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
            <ImageWithFallback src={series.coverUrl} alt={series.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-lg font-bold">{series.title}</h3>
            <p className="text-zinc-500">{series.author}</p>
            <div className="mt-3 flex gap-2">
              <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors">
                購入ページへ <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Volume Tracker */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2">
              巻数管理 <span className="text-sm font-normal text-zinc-500">{series.ownedVolumes.length}/{series.latestVolume}</span>
            </h4>
            <button 
              onClick={toggleAll}
              className="text-xs font-medium text-blue-500 hover:underline"
            >
              {series.ownedVolumes.length === series.latestVolume ? 'すべて未購入にする' : 'すべて購入済みにする'}
            </button>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
            {Array.from({ length: series.latestVolume }).map((_, i) => {
              const vol = i + 1;
              const isOwned = series.ownedVolumes.includes(vol);
              return (
                <button
                  key={vol}
                  onClick={() => toggleVolume(vol)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all border ${
                    isOwned 
                      ? 'bg-blue-500 border-blue-600 text-white' 
                      : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-400'
                  }`}
                >
                  {vol}
                </button>
              );
            })}
          </div>
          {series.nextReleaseDate && (
            <div className={`mt-4 p-3 rounded-xl flex items-center justify-between ${isDark ? 'bg-amber-900/20 border border-amber-800/50' : 'bg-amber-50 border border-amber-100'}`}>
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-amber-500" />
                <div>
                  <p className="text-xs font-medium text-amber-600">次巻発売予定</p>
                  <p className="text-sm font-bold">{series.nextReleaseDate.replace(/-/g, '.')} (予定)</p>
                </div>
              </div>
              <button className="text-xs font-bold text-amber-600 underline">予約する</button>
            </div>
          )}
        </section>

        {/* Reading Log / Notes */}
        <section>
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <StickyNote size={18} /> 読書メモ
          </h4>
          <textarea
            className={`w-full p-4 rounded-xl border min-h-[120px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'
            }`}
            placeholder="感想やお気に入りのシーンなどをメモ..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onBlur={() => onUpdate({ ...series, notes: noteText })}
          />
        </section>
      </div>
    </motion.div>
  );
}

function SettingsView() {
  return (
    <div className="space-y-6 pt-4">
      <section>
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">アカウント・データ</h3>
        <div className="space-y-2">
          <SettingsItem 
            icon={<CloudUpload className="text-blue-500" />} 
            title="Google Drive バックアップ" 
            description="前回の同期: 2026/02/01"
            action={<button className="text-xs font-bold text-blue-500">同期する</button>}
          />
          <SettingsItem 
            icon={<ArrowUpDown className="text-zinc-400" />} 
            title="データのインポート/エクスポート" 
          />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">アプリ設定</h3>
        <div className="space-y-2">
          <SettingsItem 
            icon={<Bell size={20} className="text-orange-500" />} 
            title="通知設定" 
            description="新刊発売日の通知を受け取る"
            action={<div className="w-10 h-6 bg-green-500 rounded-full flex items-center justify-end px-1"><div className="w-4 h-4 bg-white rounded-full" /></div>}
          />
          <SettingsItem 
            icon={<Filter size={20} className="text-zinc-400" />} 
            title="表示設定" 
            description="巻数の並び順やグリッド数"
          />
        </div>
      </section>

      <div className="mt-8 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-center">
        <p className="text-xs text-zinc-500">Manga Shelf v1.0.0</p>
      </div>
    </div>
  );
}

function SettingsItem({ icon, title, description, action }: { icon: React.ReactNode, title: string, description?: string, action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
      <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold truncate">{title}</h4>
        {description && <p className="text-[11px] text-zinc-500 truncate">{description}</p>}
      </div>
      {action ? action : <ChevronRight size={18} className="text-zinc-300" />}
    </div>
  );
}
import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
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
  AlertCircle,
  X,
  Plus,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { MangaSeries } from '@domain/entities/MangaSeries';
import { ImageWithFallback } from '@components/figma/ImageWithFallback';
import { useLibrary } from '@presentation/hooks/useLibrary';
import { useSearch } from '@presentation/hooks/useSearch';
import { buildMetaLine, formatDate } from '@presentation/utils/formatters';

const ThemeContext = React.createContext({
  isDark: false,
  toggleTheme: () => {}
});

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState<'shelf' | 'search' | 'favorites' | 'settings'>(
    'shelf'
  );
  const [libraryQuery, setLibraryQuery] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<MangaSeries | null>(null);

  const { library, libraryError, updateSeries } = useLibrary();
  const {
    searchForm,
    setSearchForm,
    searchResults,
    searchTotal,
    searchPage,
    searchLoading,
    searchError,
    searchLimit,
    hasSearchCondition,
    handleSearch,
    handleSearchSubmit,
    clearSearch
  } = useSearch();

  const toggleTheme = () => setIsDark(!isDark);

  const libraryIndex = useMemo(() => new Map(library.map((item) => [item.id, item])), [library]);

  const selectSeriesFromSearch = (item: MangaSeries) => {
    const saved = libraryIndex.get(item.id);
    setSelectedSeries(saved ?? item);
  };

  const handleUpdateSeries = (updated: MangaSeries) => {
    void updateSeries(updated).then((saved) => {
      if (saved) {
        setSelectedSeries(saved);
      }
    });
  };

  const filteredLibrary = useMemo(() => {
    let result = library;
    if (libraryQuery.trim()) {
      const query = libraryQuery.toLowerCase();
      result = result.filter((item) => {
        const title = item.title.toLowerCase();
        const author = item.author.toLowerCase();
        const publisher = item.publisher?.toLowerCase() ?? '';
        return title.includes(query) || author.includes(query) || publisher.includes(query);
      });
    }
    if (activeTab === 'favorites') {
      result = result.filter((item) => item.isFavorite);
    }
    return result;
  }, [library, libraryQuery, activeTab]);

  const totalSearchPages = Math.max(1, Math.ceil(Math.min(searchTotal, 500) / searchLimit));

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div
        className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-md bg-opacity-80 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Manga Shelf</h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Search Area */}
        {activeTab !== 'settings' && !selectedSeries && (
          <div className="px-4 py-3 space-y-3">
            {activeTab === 'search' ? (
              <form onSubmit={handleSearchSubmit} className="space-y-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="キーワード検索"
                    className={`w-full pl-10 pr-10 py-2 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800 focus:border-zinc-700' : 'bg-white border-zinc-200 focus:border-zinc-300'} focus:outline-none transition-all`}
                    value={searchForm.q}
                    onChange={(e) => setSearchForm((prev) => ({ ...prev, q: e.target.value }))}
                  />
                  {searchForm.q && (
                    <button
                      type="button"
                      onClick={() => setSearchForm((prev) => ({ ...prev, q: '' }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      aria-label="キーワードをクリア"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="タイトル"
                    className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800 focus:border-zinc-700' : 'bg-white border-zinc-200 focus:border-zinc-300'} focus:outline-none`}
                    value={searchForm.title}
                    onChange={(e) => setSearchForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="著者"
                    className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800 focus:border-zinc-700' : 'bg-white border-zinc-200 focus:border-zinc-300'} focus:outline-none`}
                    value={searchForm.author}
                    onChange={(e) => setSearchForm((prev) => ({ ...prev, author: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="出版社"
                    className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800 focus:border-zinc-700' : 'bg-white border-zinc-200 focus:border-zinc-300'} focus:outline-none`}
                    value={searchForm.publisher}
                    onChange={(e) =>
                      setSearchForm((prev) => ({ ...prev, publisher: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="date"
                    aria-label="発売日（開始）"
                    className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800 focus:border-zinc-700' : 'bg-white border-zinc-200 focus:border-zinc-300'} focus:outline-none`}
                    value={searchForm.from}
                    onChange={(e) => setSearchForm((prev) => ({ ...prev, from: e.target.value }))}
                  />
                  <input
                    type="date"
                    aria-label="発売日（終了）"
                    className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800 focus:border-zinc-700' : 'bg-white border-zinc-200 focus:border-zinc-300'} focus:outline-none`}
                    value={searchForm.until}
                    onChange={(e) => setSearchForm((prev) => ({ ...prev, until: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!hasSearchCondition || searchLoading}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${hasSearchCondition ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-zinc-200 text-zinc-500'} ${searchLoading ? 'opacity-70' : ''}`}
                  >
                    {searchLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin" size={16} /> 検索中
                      </span>
                    ) : (
                      '検索する'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={clearSearch}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border ${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-900' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'} transition-colors`}
                  >
                    クリア
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>データ提供: 国立国会図書館サーチ / 楽天ブックス / Google Books</span>
                  <span>{hasSearchCondition ? `${searchTotal}件` : '検索条件を入力'}</span>
                </div>
              </form>
            ) : (
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="本棚内を検索"
                  className={`w-full pl-10 pr-10 py-2 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800 focus:border-zinc-700' : 'bg-white border-zinc-200 focus:border-zinc-300'} focus:outline-none transition-all`}
                  value={libraryQuery}
                  onChange={(e) => setLibraryQuery(e.target.value)}
                />
                {libraryQuery && (
                  <button
                    type="button"
                    onClick={() => setLibraryQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    aria-label="検索をクリア"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
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
                ) : activeTab === 'search' ? (
                  <div className="space-y-4">
                    {searchError && (
                      <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm">
                        {searchError}
                      </div>
                    )}
                    {searchLoading && searchResults.length === 0 && (
                      <div className="py-16 text-center text-zinc-500">
                        <Loader2 className="mx-auto mb-2 animate-spin" size={32} />
                        <p>検索しています...</p>
                      </div>
                    )}
                    {!searchLoading && searchResults.length === 0 && hasSearchCondition && (
                      <div className="py-20 text-center text-zinc-500">
                        <Library className="mx-auto mb-2 opacity-20" size={48} />
                        <p>検索結果が見つかりませんでした</p>
                      </div>
                    )}
                    {!searchLoading && searchResults.length === 0 && !hasSearchCondition && (
                      <div className="py-20 text-center text-zinc-500">
                        <Search className="mx-auto mb-2 opacity-20" size={48} />
                        <p>検索条件を入力してください</p>
                      </div>
                    )}
                    {searchResults.length > 0 && (
                      <div className="grid grid-cols-1 gap-4">
                        {searchResults.map((item) => {
                          const isInLibrary = libraryIndex.has(item.id);
                          return (
                            <SeriesCard
                              key={item.id}
                              item={item}
                              onClick={() => selectSeriesFromSearch(item)}
                              isDark={isDark}
                              statusLabel={isInLibrary ? '所持' : '未所持'}
                              statusTone={isInLibrary ? 'owned' : 'missing'}
                            />
                          );
                        })}
                      </div>
                    )}
                    {searchResults.length > 0 && totalSearchPages > 1 && (
                      <div className="flex items-center justify-between text-sm text-zinc-500">
                        <button
                          onClick={() => handleSearch(searchPage - 1)}
                          disabled={searchPage === 1 || searchLoading}
                          className={`px-3 py-1 rounded-lg border ${isDark ? 'border-zinc-800' : 'border-zinc-200'} disabled:opacity-40`}
                        >
                          前へ
                        </button>
                        <span>
                          {searchPage} / {totalSearchPages}
                        </span>
                        <button
                          onClick={() => handleSearch(searchPage + 1)}
                          disabled={searchPage >= totalSearchPages || searchLoading}
                          className={`px-3 py-1 rounded-lg border ${isDark ? 'border-zinc-800' : 'border-zinc-200'} disabled:opacity-40`}
                        >
                          次へ
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {libraryError && (
                      <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm">
                        {libraryError}
                      </div>
                    )}
                    {filteredLibrary.map((item) => (
                      <SeriesCard
                        key={item.id}
                        item={item}
                        onClick={() => setSelectedSeries(item)}
                        isDark={isDark}
                      />
                    ))}
                    {filteredLibrary.length === 0 && (
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
                onUpdate={handleUpdateSeries}
                isDark={isDark}
                isInLibrary={libraryIndex.has(selectedSeries.id)}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        {!selectedSeries && (
          <nav
            className={`fixed bottom-0 left-0 right-0 z-50 border-t ${isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white/80 border-zinc-200'} backdrop-blur-lg`}
          >
            <div className="max-w-md mx-auto flex items-center justify-around py-2">
              <NavButton
                active={activeTab === 'shelf'}
                onClick={() => setActiveTab('shelf')}
                icon={<Library size={22} />}
                label="本棚"
              />
              <NavButton
                active={activeTab === 'search'}
                onClick={() => setActiveTab('search')}
                icon={<Search size={22} />}
                label="検索"
              />
              <NavButton
                active={activeTab === 'favorites'}
                onClick={() => setActiveTab('favorites')}
                icon={<Heart size={22} />}
                label="お気に入り"
              />
              <NavButton
                active={activeTab === 'settings'}
                onClick={() => setActiveTab('settings')}
                icon={<Settings size={22} />}
                label="設定"
              />
            </div>
          </nav>
        )}
      </div>
    </ThemeContext.Provider>
  );
}

// --- Sub-components ---

function NavButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-blue-500' : 'text-zinc-400'}`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function SeriesCard({
  item,
  onClick,
  isDark,
  statusLabel,
  statusTone
}: {
  item: MangaSeries;
  onClick: () => void;
  isDark: boolean;
  statusLabel?: string;
  statusTone?: 'owned' | 'missing';
}) {
  const lastOwned = Math.max(...item.ownedVolumes, 0);
  const isUpToDate = lastOwned === item.latestVolume && item.latestVolume > 0;
  const metaLine = buildMetaLine(item.publisher, item.publishedDate);

  const statusStyle =
    statusTone === 'owned' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex gap-4 p-3 rounded-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'} cursor-pointer`}
    >
      <div className="w-20 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-200 dark:bg-zinc-800">
        <ImageWithFallback
          src={item.coverUrl}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold truncate">{item.title}</h3>
            <div className="flex items-center gap-2">
              {statusLabel && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusStyle}`}>
                  {statusLabel}
                </span>
              )}
              {item.isFavorite && (
                <Heart size={16} className="text-red-500 fill-red-500 flex-shrink-0" />
              )}
            </div>
          </div>
          <p className="text-xs text-zinc-500 truncate">{item.author}</p>
          {metaLine && <p className="text-[11px] text-zinc-400 truncate">{metaLine}</p>}
          <div className="mt-2 flex flex-wrap gap-1">
            {item.genre.map((g) => (
              <span
                key={g}
                className={`text-[10px] px-1.5 py-0.5 rounded-md ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}
              >
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
            <div
              className={`text-[10px] px-2 py-1 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'} flex items-center gap-1`}
            >
              <Calendar size={10} />
              {formatDate(item.nextReleaseDate)} 次巻
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SeriesDetail({
  series,
  onBack,
  onUpdate,
  isDark,
  isInLibrary
}: {
  series: MangaSeries;
  onBack: () => void;
  onUpdate: (s: MangaSeries) => void;
  isDark: boolean;
  isInLibrary: boolean;
}) {
  const [noteText, setNoteText] = useState(series.notes);
  const sourceLabel = (() => {
    switch (series.source) {
      case 'ndl':
        return 'NDLで見る';
      case 'rakuten':
        return '楽天で見る';
      case 'google':
        return 'Google Booksで見る';
      default:
        return '外部で見る';
    }
  })();

  useEffect(() => {
    setNoteText(series.notes);
  }, [series.id, series.notes]);

  const toggleVolume = (vol: number) => {
    let newOwned = [...series.ownedVolumes];
    if (newOwned.includes(vol)) {
      newOwned = newOwned.filter((v) => v !== vol);
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
      <header
        className={`px-4 py-3 flex items-center justify-between border-b ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}
      >
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800"
        >
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
            <ImageWithFallback
              src={series.coverUrl}
              alt={series.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-lg font-bold">{series.title}</h3>
            <p className="text-zinc-500">{series.author}</p>
            {buildMetaLine(series.publisher, series.publishedDate) && (
              <p className="text-xs text-zinc-500 mt-1">
                {buildMetaLine(series.publisher, series.publishedDate)}
              </p>
            )}
            {series.isbn && <p className="text-xs text-zinc-400 mt-1">ISBN: {series.isbn}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {series.sourceUrl && (
                <a
                  href={series.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
                >
                  {sourceLabel} <ExternalLink size={12} />
                </a>
              )}
              {!isInLibrary && (
                <button
                  onClick={() => onUpdate({ ...series })}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
                >
                  本棚に追加 <Plus size={12} />
                </button>
              )}
              {isInLibrary && (
                <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600">
                  本棚に追加済み
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Volume Tracker */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold flex items-center gap-2">
              巻数管理{' '}
              <span className="text-sm font-normal text-zinc-500">
                {series.ownedVolumes.length}/{series.latestVolume}
              </span>
            </h4>
            <button
              onClick={toggleAll}
              className="text-xs font-medium text-blue-500 hover:underline"
            >
              {series.ownedVolumes.length === series.latestVolume
                ? 'すべて未購入にする'
                : 'すべて購入済みにする'}
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
                      : isDark
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-500'
                        : 'bg-white border-zinc-200 text-zinc-400'
                  }`}
                >
                  {vol}
                </button>
              );
            })}
          </div>
          {series.nextReleaseDate && (
            <div
              className={`mt-4 p-3 rounded-xl flex items-center justify-between ${isDark ? 'bg-amber-900/20 border border-amber-800/50' : 'bg-amber-50 border border-amber-100'}`}
            >
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-amber-500" />
                <div>
                  <p className="text-xs font-medium text-amber-600">次巻発売予定</p>
                  <p className="text-sm font-bold">{formatDate(series.nextReleaseDate)} (予定)</p>
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
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                : 'bg-white border-zinc-200 text-zinc-700'
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
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
          アカウント・データ
        </h3>
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
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
          アプリ設定
        </h3>
        <div className="space-y-2">
          <SettingsItem
            icon={<Bell size={20} className="text-orange-500" />}
            title="通知設定"
            description="新刊発売日の通知を受け取る"
            action={
              <div className="w-10 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
            }
          />
          <SettingsItem
            icon={<Filter size={20} className="text-zinc-400" />}
            title="表示設定"
            description="巻数の並び順やグリッド数"
          />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">データ</h3>
        <div className="space-y-2">
          <SettingsItem
            icon={<Library size={18} className="text-zinc-400" />}
            title="データソース"
            description="国立国会図書館サーチ API"
          />
        </div>
      </section>

      <div className="mt-8 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-center">
        <p className="text-xs text-zinc-500">Manga Shelf v1.0.0</p>
      </div>
    </div>
  );
}

function SettingsItem({
  icon,
  title,
  description,
  action
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
      <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">{icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold truncate">{title}</h4>
        {description && <p className="text-[11px] text-zinc-500 truncate">{description}</p>}
      </div>
      {action ? action : <ChevronRight size={18} className="text-zinc-300" />}
    </div>
  );
}

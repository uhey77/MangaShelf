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
import { AnimatePresence, motion } from 'motion/react';

import { AppSettings, ShelfGridColumns, ShelfSort } from '@domain/entities/AppSettings';
import { MangaSeries } from '@domain/entities/MangaSeries';
import {
  buildSeriesKey,
  extractVolumeNumber,
  toSeriesDisplayTitle
} from '@domain/services/seriesIdentity';
import { ImageWithFallback } from '@components/figma/ImageWithFallback';
import { useAppSettings } from '@presentation/hooks/useAppSettings';
import { useLibrary } from '@presentation/hooks/useLibrary';
import { useAppContainer } from '@presentation/providers/AppProvider';
import { useSearch } from '@presentation/hooks/useSearch';
import { buildMetaLine, formatDate } from '@presentation/utils/formatters';

type ActiveTab = 'shelf' | 'search' | 'favorites' | 'settings';
type NotificationPermissionState = NotificationPermission | 'unsupported';
type SeriesLibraryStatus = 'notInLibrary' | 'sameSeriesDifferentId' | 'sameId';

function sortLibraryItems(items: MangaSeries[], sort: ShelfSort): MangaSeries[] {
  const sorted = [...items];

  if (sort === 'latestVolumeDesc') {
    sorted.sort((a, b) => {
      if (b.latestVolume !== a.latestVolume) {
        return b.latestVolume - a.latestVolume;
      }
      return a.title.localeCompare(b.title, 'ja');
    });
    return sorted;
  }

  sorted.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
  return sorted;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('shelf');
  const [libraryQuery, setLibraryQuery] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<MangaSeries | null>(null);

  const { library, libraryError, updateSeries, replaceLibrary } = useLibrary();
  const {
    settings,
    settingsError,
    googleDriveSyncing,
    googleDriveSyncError,
    googleDriveRestoring,
    googleDriveRestoreError,
    googleDriveBidirectionalSyncing,
    googleDriveBidirectionalSyncError,
    notificationPermission,
    notificationSupported,
    notificationStatusMessage,
    toggleThemeMode,
    setShelfSort,
    setShelfGridColumns,
    setNotificationsEnabled,
    syncGoogleDriveBackup,
    restoreGoogleDriveBackup,
    syncGoogleDriveBidirectionally
  } = useAppSettings({
    library,
    onLibraryReplace: replaceLibrary
  });
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

  const isDark = settings.themeMode === 'dark';

  const libraryIndex = useMemo(() => new Map(library.map((item) => [item.id, item])), [library]);
  const librarySeriesIndex = useMemo(
    () => new Map(library.map((item) => [buildSeriesKey(item.title, item.author), item])),
    [library]
  );

  const selectSeriesFromSearch = (item: MangaSeries) => {
    const libraryItem = libraryIndex.get(item.id);
    if (libraryItem) {
      setSelectedSeries(libraryItem);
      return;
    }
    setSelectedSeries(item);
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

    if (activeTab === 'shelf' || activeTab === 'favorites') {
      result = sortLibraryItems(result, settings.shelfSort);
    }

    return result;
  }, [activeTab, library, libraryQuery, settings.shelfSort]);

  const totalSearchPages = Math.max(1, Math.ceil(Math.min(searchTotal, 500) / searchLimit));
  const shelfGridClass = settings.shelfGridColumns === 2 ? 'grid-cols-2' : 'grid-cols-1';
  const useCompactShelfCard = settings.shelfGridColumns === 2;
  const selectedSeriesStatus = useMemo<SeriesLibraryStatus>(() => {
    if (!selectedSeries) {
      return 'notInLibrary';
    }
    if (libraryIndex.has(selectedSeries.id)) {
      return 'sameId';
    }
    const key = buildSeriesKey(selectedSeries.title, selectedSeries.author);
    if (librarySeriesIndex.has(key)) {
      return 'sameSeriesDifferentId';
    }
    return 'notInLibrary';
  }, [selectedSeries, libraryIndex, librarySeriesIndex]);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-opacity-80 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Manga Shelf</h1>
        <button
          onClick={toggleThemeMode}
          className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          aria-label="テーマを切り替える"
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
                <SettingsView
                  isDark={isDark}
                  settings={settings}
                  settingsError={settingsError}
                  googleDriveSyncing={googleDriveSyncing}
                  googleDriveSyncError={googleDriveSyncError}
                  googleDriveRestoring={googleDriveRestoring}
                  googleDriveRestoreError={googleDriveRestoreError}
                  googleDriveBidirectionalSyncing={googleDriveBidirectionalSyncing}
                  googleDriveBidirectionalSyncError={googleDriveBidirectionalSyncError}
                  notificationPermission={notificationPermission}
                  notificationSupported={notificationSupported}
                  notificationStatusMessage={notificationStatusMessage}
                  onNotificationsChange={setNotificationsEnabled}
                  onGoogleDriveSync={syncGoogleDriveBackup}
                  onGoogleDriveRestore={restoreGoogleDriveBackup}
                  onGoogleDriveBidirectionalSync={syncGoogleDriveBidirectionally}
                />
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
                        const isInLibrary = librarySeriesIndex.has(
                          buildSeriesKey(item.title, item.author)
                        );
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
                <div className="space-y-3">
                  <ShelfDisplayControls
                    isDark={isDark}
                    activeTab={activeTab}
                    settings={settings}
                    onShelfSortChange={setShelfSort}
                    onShelfGridColumnsChange={setShelfGridColumns}
                  />
                  <div className={`grid gap-4 ${shelfGridClass}`}>
                    {libraryError && (
                      <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm col-span-full">
                        {libraryError}
                      </div>
                    )}
                    {filteredLibrary.map((item) => (
                      <SeriesCard
                        key={item.id}
                        item={item}
                        onClick={() => setSelectedSeries(item)}
                        isDark={isDark}
                        compact={useCompactShelfCard}
                        seriesTitleOnly
                      />
                    ))}
                    {filteredLibrary.length === 0 && (
                      <div className="py-20 text-center text-zinc-500 col-span-full">
                        <Library className="mx-auto mb-2 opacity-20" size={48} />
                        <p>作品が見つかりませんでした</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <SeriesDetail
              series={selectedSeries}
              onBack={() => setSelectedSeries(null)}
              onUpdate={handleUpdateSeries}
              isDark={isDark}
              libraryStatus={selectedSeriesStatus}
              seriesTitleOnly={activeTab !== 'search'}
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

function ShelfDisplayControls({
  isDark,
  activeTab,
  settings,
  onShelfSortChange,
  onShelfGridColumnsChange
}: {
  isDark: boolean;
  activeTab: ActiveTab;
  settings: AppSettings;
  onShelfSortChange: (sort: ShelfSort) => void;
  onShelfGridColumnsChange: (columns: ShelfGridColumns) => void;
}) {
  const containerClass = isDark
    ? 'border-zinc-800 bg-zinc-900/80'
    : 'border-zinc-200 bg-white/90 shadow-sm';
  const optionPanelClass = isDark
    ? 'rounded-xl border border-zinc-800 bg-zinc-950/60 p-3'
    : 'rounded-xl border border-zinc-200 bg-white p-3';
  const optionButtonBaseClass =
    'w-full rounded-lg border px-3 py-2 text-xs font-semibold transition-all duration-200';
  const activeButtonClass = isDark
    ? 'border-blue-400 bg-blue-500 text-white shadow-md shadow-blue-900/30'
    : 'border-blue-500 bg-blue-500 text-white shadow-sm shadow-blue-200/80';
  const inactiveButtonClass = isDark
    ? 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800'
    : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100';

  return (
    <section className={`relative overflow-hidden rounded-2xl border ${containerClass}`}>
      <div
        className={`pointer-events-none absolute -top-10 -right-8 h-24 w-24 rounded-full blur-2xl ${isDark ? 'bg-blue-500/20' : 'bg-sky-200/80'}`}
      />
      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-xl p-2 ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-500'}`}
            >
              <Filter size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {activeTab === 'favorites' ? 'お気に入り表示設定' : '本棚表示設定'}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">並び順とグリッドをすばやく切り替え</p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}
          >
            {settings.shelfGridColumns}列
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={optionPanelClass}>
            <p className="text-[11px] font-medium text-zinc-500 mb-2">並び順</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={settings.shelfSort === 'title'}
                onClick={() => onShelfSortChange('title')}
                className={`${optionButtonBaseClass} ${
                  settings.shelfSort === 'title' ? activeButtonClass : inactiveButtonClass
                }`}
              >
                タイトル順
              </button>
              <button
                type="button"
                aria-pressed={settings.shelfSort === 'latestVolumeDesc'}
                onClick={() => onShelfSortChange('latestVolumeDesc')}
                className={`${optionButtonBaseClass} ${
                  settings.shelfSort === 'latestVolumeDesc'
                    ? activeButtonClass
                    : inactiveButtonClass
                }`}
              >
                最新巻順
              </button>
            </div>
          </div>

          <div className={optionPanelClass}>
            <p className="text-[11px] font-medium text-zinc-500 mb-2">グリッド</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={settings.shelfGridColumns === 1}
                onClick={() => onShelfGridColumnsChange(1)}
                className={`${optionButtonBaseClass} ${
                  settings.shelfGridColumns === 1 ? activeButtonClass : inactiveButtonClass
                }`}
              >
                <span>1列</span>
                <span className="mt-1 block h-1 rounded bg-current/25" />
              </button>
              <button
                type="button"
                aria-pressed={settings.shelfGridColumns === 2}
                onClick={() => onShelfGridColumnsChange(2)}
                className={`${optionButtonBaseClass} ${
                  settings.shelfGridColumns === 2 ? activeButtonClass : inactiveButtonClass
                }`}
              >
                <span>2列</span>
                <span className="mt-1 grid grid-cols-2 gap-1">
                  <span className="h-1 rounded bg-current/25" />
                  <span className="h-1 rounded bg-current/25" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SeriesCard({
  item,
  onClick,
  isDark,
  statusLabel,
  statusTone,
  compact = false,
  seriesTitleOnly = false
}: {
  item: MangaSeries;
  onClick: () => void;
  isDark: boolean;
  statusLabel?: string;
  statusTone?: 'owned' | 'missing';
  compact?: boolean;
  seriesTitleOnly?: boolean;
}) {
  const displayTitle = seriesTitleOnly ? toSeriesDisplayTitle(item.title) : item.title;
  const ownedCount = item.ownedVolumes.length;
  const isUpToDate =
    item.latestVolume > 0 &&
    ownedCount === item.latestVolume &&
    item.ownedVolumes.every((volume, index) => volume === index + 1);
  const metaLine = seriesTitleOnly
    ? (item.publisher ?? '').trim()
    : buildMetaLine(item.publisher, item.publishedDate);

  const statusStyle =
    statusTone === 'owned' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600';

  if (compact) {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`p-3 rounded-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'} cursor-pointer`}
      >
        <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800">
          <ImageWithFallback
            src={item.coverUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="mt-2 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-sm font-bold leading-tight break-words">{displayTitle}</h3>
            {item.isFavorite && <Heart size={14} className="text-red-500 fill-red-500 shrink-0" />}
          </div>
          <p className="text-[11px] text-zinc-500 truncate mt-1">{item.author}</p>
          {metaLine && <p className="text-[10px] text-zinc-400 truncate mt-0.5">{metaLine}</p>}
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="text-xs font-bold">
            {ownedCount}
            <span className="text-zinc-400 text-[11px]"> / {item.latestVolume}</span>
          </div>
          {statusLabel && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusStyle}`}>
              {statusLabel}
            </span>
          )}
        </div>
        {item.nextReleaseDate && !isUpToDate && (
          <div
            className={`mt-2 text-[10px] px-2 py-1 rounded-full inline-flex items-center gap-1 ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}
          >
            <Calendar size={10} />
            {formatDate(item.nextReleaseDate)} 次巻
          </div>
        )}
      </motion.div>
    );
  }

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
            <h3 className="font-bold truncate">{displayTitle}</h3>
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
              <span className="text-lg font-bold">{ownedCount}</span>
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
  libraryStatus,
  seriesTitleOnly
}: {
  series: MangaSeries;
  onBack: () => void;
  onUpdate: (s: MangaSeries) => void;
  isDark: boolean;
  libraryStatus: SeriesLibraryStatus;
  seriesTitleOnly?: boolean;
}) {
  const { searchBooks } = useAppContainer();
  const [noteText, setNoteText] = useState(series.notes);
  const [volumeCoverByVolume, setVolumeCoverByVolume] = useState<Record<number, string>>({});
  const displayTitle = seriesTitleOnly ? toSeriesDisplayTitle(series.title) : series.title;
  const detailMetaLine = seriesTitleOnly
    ? (series.publisher ?? '').trim()
    : buildMetaLine(series.publisher, series.publishedDate);
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

  useEffect(() => {
    const seed: Record<number, string> = {};
    const currentVolume = extractVolumeNumber(series.title);
    if (currentVolume && series.coverUrl) {
      seed[currentVolume] = series.coverUrl;
    }
    setVolumeCoverByVolume(seed);

    const baseTitle = toSeriesDisplayTitle(series.title).trim();
    if (!baseTitle) {
      return;
    }

    let active = true;
    const loadVolumeCovers = async () => {
      try {
        const result = await searchBooks.handle({
          title: baseTitle,
          author: series.author.trim() || undefined,
          page: 1,
          limit: 120
        });
        if (!active) {
          return;
        }

        const discovered: Record<number, string> = {};
        for (const item of result.items) {
          if (!item.coverUrl) {
            continue;
          }
          const volume = extractVolumeNumber(item.title);
          if (!volume || discovered[volume]) {
            continue;
          }
          discovered[volume] = item.coverUrl;
        }

        setVolumeCoverByVolume((prev) => ({ ...discovered, ...prev }));
      } catch {
        // 巻別画像の補完失敗時は既存表示を維持する
      }
    };

    void loadVolumeCovers();
    return () => {
      active = false;
    };
  }, [searchBooks, series.id, series.title, series.author, series.coverUrl]);

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
        <h2 className="font-bold truncate px-4">{displayTitle}</h2>
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
              alt={displayTitle}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-lg font-bold">{displayTitle}</h3>
            <p className="text-zinc-500">{series.author}</p>
            {detailMetaLine && <p className="text-xs text-zinc-500 mt-1">{detailMetaLine}</p>}
            {!seriesTitleOnly && series.isbn && (
              <p className="text-xs text-zinc-400 mt-1">ISBN: {series.isbn}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {!seriesTitleOnly && series.sourceUrl && (
                <a
                  href={series.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
                >
                  {sourceLabel} <ExternalLink size={12} />
                </a>
              )}
              {libraryStatus !== 'sameId' && (
                <button
                  onClick={() => onUpdate({ ...series })}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
                >
                  {libraryStatus === 'sameSeriesDifferentId' ? 'この巻を所持に反映' : '本棚に追加'}{' '}
                  <Plus size={12} />
                </button>
              )}
              {libraryStatus === 'sameId' && (
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
              const coverUrl = volumeCoverByVolume[vol];
              return (
                <button
                  key={vol}
                  onClick={() => toggleVolume(vol)}
                  aria-label={`${vol}巻`}
                  className={
                    coverUrl
                      ? `relative aspect-square overflow-hidden rounded-lg transition-all border ${
                          isOwned
                            ? 'border-blue-500 ring-2 ring-blue-500/60'
                            : isDark
                              ? 'border-zinc-700'
                              : 'border-zinc-200'
                        }`
                      : `aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all border ${
                          isOwned
                            ? 'bg-blue-500 border-blue-600 text-white'
                            : isDark
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-500'
                              : 'bg-white border-zinc-200 text-zinc-400'
                        }`
                  }
                >
                  {coverUrl ? (
                    <>
                      <ImageWithFallback
                        src={coverUrl}
                        alt={`${displayTitle} ${vol}巻`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div
                        className={`absolute inset-0 ${isOwned ? 'bg-blue-900/20' : 'bg-black/30'}`}
                      />
                      <span className="absolute right-1.5 bottom-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-bold text-white">
                        {vol}
                      </span>
                    </>
                  ) : (
                    vol
                  )}
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

function SettingsView({
  isDark,
  settings,
  settingsError,
  googleDriveSyncing,
  googleDriveSyncError,
  googleDriveRestoring,
  googleDriveRestoreError,
  googleDriveBidirectionalSyncing,
  googleDriveBidirectionalSyncError,
  notificationPermission,
  notificationSupported,
  notificationStatusMessage,
  onNotificationsChange,
  onGoogleDriveSync,
  onGoogleDriveRestore,
  onGoogleDriveBidirectionalSync
}: {
  isDark: boolean;
  settings: AppSettings;
  settingsError: string | null;
  googleDriveSyncing: boolean;
  googleDriveSyncError: string | null;
  googleDriveRestoring: boolean;
  googleDriveRestoreError: string | null;
  googleDriveBidirectionalSyncing: boolean;
  googleDriveBidirectionalSyncError: string | null;
  notificationPermission: NotificationPermissionState;
  notificationSupported: boolean;
  notificationStatusMessage: string;
  onNotificationsChange: (enabled: boolean) => Promise<void>;
  onGoogleDriveSync: () => Promise<void>;
  onGoogleDriveRestore: () => Promise<void>;
  onGoogleDriveBidirectionalSync: () => Promise<void>;
}) {
  const cardClass = isDark
    ? 'rounded-xl border border-zinc-800 bg-zinc-900 p-4'
    : 'rounded-xl border border-zinc-200 bg-white p-4';
  const googleDriveBusy =
    googleDriveSyncing || googleDriveRestoring || googleDriveBidirectionalSyncing;

  const googleDriveSyncLabel = (() => {
    const raw = settings.googleDriveLastSyncedAt;
    if (!raw) return '未同期';
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return '未同期';
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(parsed);
  })();

  const permissionLabel = (() => {
    switch (notificationPermission) {
      case 'granted':
        return '許可済み';
      case 'denied':
        return '拒否';
      case 'default':
        return '未許可';
      default:
        return '未対応';
    }
  })();

  return (
    <div className="space-y-6 pt-4">
      {settingsError && (
        <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm">{settingsError}</div>
      )}

      <section>
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
          アカウント・データ
        </h3>
        <div className="space-y-2">
          <SettingsItem
            isDark={isDark}
            icon={<CloudUpload className="text-blue-500" />}
            title="Google Drive にバックアップ"
            description={`保存先: Drive > MangaShelf / 前回同期: ${googleDriveSyncLabel}`}
            action={
              <button
                type="button"
                onClick={() => void onGoogleDriveSync()}
                disabled={googleDriveBusy}
                className={`text-xs font-bold ${googleDriveBusy ? 'text-zinc-400' : 'text-blue-500 hover:underline'}`}
              >
                {googleDriveSyncing ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" />
                    同期中
                  </span>
                ) : settings.googleDriveLinked ? (
                  '同期する'
                ) : (
                  '連携して同期'
                )}
              </button>
            }
          />
          {googleDriveSyncError && (
            <p className="px-1 text-[11px] text-rose-500">{googleDriveSyncError}</p>
          )}
          <SettingsItem
            isDark={isDark}
            icon={<ArrowUpDown className="text-zinc-400" />}
            title="Drive から復元"
            description="最新バックアップで本棚データを置き換えます"
            action={
              <button
                type="button"
                onClick={() => void onGoogleDriveRestore()}
                disabled={googleDriveBusy}
                className={`text-xs font-bold ${googleDriveBusy ? 'text-zinc-400' : 'text-blue-500 hover:underline'}`}
              >
                {googleDriveRestoring ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" />
                    復元中
                  </span>
                ) : (
                  '復元する'
                )}
              </button>
            }
          />
          {googleDriveRestoreError && (
            <p className="px-1 text-[11px] text-rose-500">{googleDriveRestoreError}</p>
          )}
          <SettingsItem
            isDark={isDark}
            icon={<ArrowUpDown className="text-emerald-500" />}
            title="Drive と双方向同期"
            description="シリーズ重複はローカル優先でマージし、Driveにも反映します"
            action={
              <button
                type="button"
                onClick={() => void onGoogleDriveBidirectionalSync()}
                disabled={googleDriveBusy}
                className={`text-xs font-bold ${googleDriveBusy ? 'text-zinc-400' : 'text-blue-500 hover:underline'}`}
              >
                {googleDriveBidirectionalSyncing ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" />
                    同期中
                  </span>
                ) : (
                  '双方向同期'
                )}
              </button>
            }
          />
          {googleDriveBidirectionalSyncError && (
            <p className="px-1 text-[11px] text-rose-500">{googleDriveBidirectionalSyncError}</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
          アプリ設定
        </h3>
        <div className="space-y-3">
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Bell size={18} className="text-orange-500" /> 通知設定
                </h4>
                <p className="text-[11px] text-zinc-500 mt-1">新刊発売のブラウザ通知を受け取る</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.notificationsEnabled}
                aria-label="通知設定"
                disabled={!notificationSupported}
                onClick={() => void onNotificationsChange(!settings.notificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notificationsEnabled ? 'bg-green-500' : 'bg-zinc-300'
                } ${notificationSupported ? '' : 'opacity-50 cursor-not-allowed'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">権限状態: {permissionLabel}</p>
            <p className="text-[11px] text-zinc-500 mt-1">{notificationStatusMessage}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SettingsItem({
  isDark,
  icon,
  title,
  description,
  action
}: {
  isDark: boolean;
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-xl border ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'
      }`}
    >
      <div className={`p-2 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-zinc-50'}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold truncate">{title}</h4>
        {description && <p className="text-[11px] text-zinc-500 truncate">{description}</p>}
      </div>
      {action ? action : <ChevronRight size={18} className="text-zinc-300" />}
    </div>
  );
}

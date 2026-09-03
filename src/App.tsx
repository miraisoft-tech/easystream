import React, { useState } from 'react';
import { useWorshipSync } from './hooks/useWorshipSync';
import { Header } from './components/Header';
import { SchedulePanel } from './components/SchedulePanel';
import { LiveConsole } from './components/LiveConsole';
import { StyleEditor } from './components/StyleEditor';
import { LibraryModal } from './components/LibraryModal';
import { OnlineLyricsSearchModal } from './components/OnlineLyricsSearchModal';
import { DisplayView } from './components/DisplayView';
import { StageView } from './components/StageView';
import { TimerDisplayView } from './components/TimerDisplayView';
import { TimerModal } from './components/TimerModal';
import { LibraryItem, ScheduleItem } from './types';

export const App: React.FC = () => {
  const {
    state,
    isConnected,
    progress,
    jumpTo,
    togglePlay,
    restart,
    setWpm,
    setLines,
    updateTheme,
    updateLiveState,
    setQuickAlert,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustTimer,
    setTimerConfig,
    setTimerPrompt,
    addTimerSlot,
    updateTimerSlot,
    deleteTimerSlot,
    reorderTimerSlots,
    jumpToTimerSlot,
    nextTimerSlot,
    prevTimerSlot,
    setTimerSlots,
    loadScheduleItem,
    updateSchedule,
    saveSchedule,
    loadSchedule,
    deleteSchedule,
    saveLibraryItem,
    deleteLibraryItem,
    resetToDefault,
  } = useWorshipSync();

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isOnlineSearchOpen, setIsOnlineSearchOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);

  // Simple client-side route checking
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const isOverlayMode = searchParams.get('overlay') === '1' || searchParams.get('transparent') === '1';

  if (pathname === '/display' || pathname === '/display.html') {
    return <DisplayView state={state} progress={progress} isOverlay={isOverlayMode} />;
  }

  if (pathname === '/stage' || pathname === '/stage.html') {
    return <StageView state={state} progress={progress} />;
  }

  if (pathname === '/timer' || pathname === '/timer.html' || pathname === '/countdown' || pathname === '/countdown.html') {
    return <TimerDisplayView timerState={state.timerState} liveState={state.liveState} isOverlay={isOverlayMode} onSetTimerConfig={setTimerConfig} />;
  }

  // Handle adding an item from library to the active schedule
  const handleAddToSchedule = (item: LibraryItem) => {
    const newScheduleItem: ScheduleItem = {
      id: `sched-item-${Date.now()}`,
      libraryItemId: item.id,
      title: item.title,
      category: item.category,
      lines: item.lines,
      themeOverride: item.themeOverride,
    };
    updateSchedule([...state.schedule, newScheduleItem]);
  };

  // Handle instantly presenting an item live
  const handleGoLiveWithLibraryItem = (item: LibraryItem) => {
    setLines(item.title, item.author || '', item.lines, item.category);
    if (item.themeOverride) {
      updateTheme(item.themeOverride);
    }
  };

  return (
    <div className="studio-container">
      {/* Top Header Navigation & Emergency Live Bar */}
      <Header
        isConnected={isConnected}
        liveState={state.liveState}
        timerState={state.timerState}
        onUpdateLiveState={updateLiveState}
        onSetQuickAlert={setQuickAlert}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenOnlineSearch={() => setIsOnlineSearchOpen(true)}
        onOpenTimer={() => setIsTimerOpen(true)}
        onResetToDefault={resetToDefault}
      />

      {/* Main Studio 3-Column Work Area */}
      <div className="studio-grid">
        {/* Left Column: Service Schedule & Sets */}
        <SchedulePanel
          schedule={state.schedule}
          savedSchedules={state.savedSchedules}
          currentScheduleId={state.currentScheduleId}
          activeScheduleIndex={state.activeScheduleIndex}
          onLoadScheduleItem={loadScheduleItem}
          onUpdateSchedule={updateSchedule}
          onSaveSchedule={saveSchedule}
          onLoadSchedule={loadSchedule}
          onDeleteSchedule={deleteSchedule}
          onOpenLibrary={() => setIsLibraryOpen(true)}
        />

        {/* Center Column: Live Monitor, Slide Grid & Playback Transport */}
        <LiveConsole
          state={state}
          progress={progress}
          onJumpTo={jumpTo}
          onTogglePlay={togglePlay}
          onRestart={restart}
          onSetWpm={setWpm}
          onSetLines={setLines}
        />

        {/* Right Column: EasyWorship Style & Theme Inspector */}
        <StyleEditor
          theme={state.theme}
          onUpdateTheme={updateTheme}
        />
      </div>

      {/* Song & Scripture Library Drawer / Modal */}
      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        library={state.library}
        onSaveLibraryItem={saveLibraryItem}
        onDeleteLibraryItem={deleteLibraryItem}
        onAddToSchedule={handleAddToSchedule}
        onGoLiveWithItem={handleGoLiveWithLibraryItem}
        onOpenOnlineSearch={() => {
          setIsLibraryOpen(false);
          setIsOnlineSearchOpen(true);
        }}
      />

      {/* Online Lyrics Search & Instant Auto-Save Modal */}
      <OnlineLyricsSearchModal
        isOpen={isOnlineSearchOpen}
        onClose={() => setIsOnlineSearchOpen(false)}
        library={state.library}
        onSaveLibraryItem={saveLibraryItem}
        onAddToSchedule={handleAddToSchedule}
        onGoLiveWithItem={handleGoLiveWithLibraryItem}
      />

      {/* Countdown & Overtime Timer Management Modal */}
      <TimerModal
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        timerState={state.timerState}
        onStartTimer={startTimer}
        onPauseTimer={pauseTimer}
        onResetTimer={resetTimer}
        onAdjustTimer={adjustTimer}
        onSetTimerConfig={setTimerConfig}
        onSetTimerPrompt={setTimerPrompt}
        onAddTimerSlot={addTimerSlot}
        onUpdateTimerSlot={updateTimerSlot}
        onDeleteTimerSlot={deleteTimerSlot}
        onReorderTimerSlots={reorderTimerSlots}
        onJumpToTimerSlot={jumpToTimerSlot}
        onNextTimerSlot={nextTimerSlot}
        onPrevTimerSlot={prevTimerSlot}
        onSetTimerSlots={setTimerSlots}
      />
    </div>
  );
};
export default App;

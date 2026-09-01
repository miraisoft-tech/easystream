export type TextAlignment = 'left' | 'center' | 'right';
export type VerticalAlignment = 'top' | 'center' | 'bottom';
export type BackgroundType = 'solid' | 'gradient' | 'animated-gradient' | 'transparent';
export type DisplayMode = 'fullscreen' | 'lower-third';

export interface PresentationTheme {
  fontFamily: string;
  fontSize: number; // in pt/px base scale (e.g. 42)
  fontWeight: number; // 300, 400, 500, 600, 700, 800, 900
  fontStyle: 'normal' | 'italic';
  textTransform: 'none' | 'uppercase' | 'capitalize';
  textColor: string;
  accentColor: string;
  textAlign: TextAlignment;
  verticalAlign: VerticalAlignment;
  lineHeight: number; // 1.1 to 2.0
  letterSpacing: number; // -1 to 8 px
  
  // Shadow and outline (critical for live video overlays)
  textShadow: boolean;
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
  textOutline: boolean;
  outlineWidth: number;
  outlineColor: string;
  
  // Background configuration
  bgType: BackgroundType;
  bgColor: string;
  bgGradient: string; // CSS gradient string
  bgAnimationSpeed: number; // in seconds, e.g. 15
  bgOverlayOpacity: number; // 0 to 1
  
  // Layout mode
  displayMode: DisplayMode;
  showNextPreview: boolean;
  showProgressBar: boolean;
  showReferenceBadge: boolean;
  maxLinesPerSlide?: number;
}

export interface LibraryItem {
  id: string;
  title: string;
  category: 'scripture' | 'song' | 'hymn' | 'announcement' | 'custom';
  author?: string;
  copyright?: string;
  ccli?: string;
  content: string; // raw content with stanzas separated by blank lines or lines
  lines: string[];
  themeOverride?: Partial<PresentationTheme>;
  createdAt: number;
  updatedAt: number;
}

export interface ScheduleItem {
  id: string;
  libraryItemId?: string;
  title: string;
  category: 'scripture' | 'song' | 'hymn' | 'announcement' | 'custom';
  lines: string[];
  themeOverride?: Partial<PresentationTheme>;
}

export interface Schedule {
  id: string;
  name: string;
  items: ScheduleItem[];
  createdAt: number;
  updatedAt: number;
}

export interface LiveState {
  isBlackout: boolean;
  isClearText: boolean;
  isLogo: boolean;
  isFrozen: boolean;
  quickAlert: string | null;
}

export interface AppState {
  title: string;
  subtitle?: string;
  category: 'scripture' | 'song' | 'hymn' | 'announcement' | 'custom';
  lines: string[];
  cur: number;
  playing: boolean;
  wpm: number;
  lineStartedAt: number | null;
  lineDurationMs: number | null;
  
  // Live control flags
  liveState: LiveState;
  
  // Active theme
  theme: PresentationTheme;
  
  // Active Schedule
  currentScheduleId: string | null;
  activeScheduleIndex: number;
  schedule: ScheduleItem[];
  
  // Saved schedules & library meta
  savedSchedules: Schedule[];
  library: LibraryItem[];
}

export type WebSocketClientMessage =
  | { type: 'setLines'; title: string; subtitle?: string; lines: string[]; category?: 'scripture' | 'song' | 'hymn' | 'announcement' | 'custom' }
  | { type: 'jump'; index: number }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'restart' }
  | { type: 'setWpm'; wpm: number }
  | { type: 'setTheme'; theme: Partial<PresentationTheme> }
  | { type: 'setLiveState'; liveState: Partial<LiveState> }
  | { type: 'setQuickAlert'; text: string | null }
  | { type: 'loadScheduleItem'; index: number }
  | { type: 'updateSchedule'; items: ScheduleItem[] }
  | { type: 'saveSchedule'; schedule: Schedule }
  | { type: 'loadSchedule'; scheduleId: string }
  | { type: 'deleteSchedule'; scheduleId: string }
  | { type: 'saveLibraryItem'; item: LibraryItem }
  | { type: 'deleteLibraryItem'; id: string }
  | { type: 'resetToDefault' };

export type WebSocketServerMessage =
  | { type: 'state'; state: AppState }
  | { type: 'notification'; message: string; variant?: 'info' | 'success' | 'warning' | 'error' };

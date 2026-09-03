import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const DIST_DIR = path.join(__dirname, "dist");
const PUBLIC_DIR = path.join(__dirname, "public");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial defaults
const DEFAULT_THEME = {
  fontFamily: "Montserrat, sans-serif",
  fontSize: 44,
  fontWeight: 700,
  fontStyle: "normal",
  textTransform: "none",
  textColor: "#ffffff",
  accentColor: "#f59e0b",
  textAlign: "center",
  verticalAlign: "center",
  lineHeight: 1.45,
  letterSpacing: 0.5,
  textShadow: true,
  shadowBlur: 14,
  shadowColor: "rgba(0, 0, 0, 0.85)",
  shadowOffsetX: 0,
  shadowOffsetY: 3,
  textOutline: true,
  outlineWidth: 2,
  outlineColor: "rgba(0, 0, 0, 0.95)",
  bgType: "animated-gradient",
  bgColor: "#0f172a",
  bgGradient: "linear-gradient(135deg, #090e17 0%, #1e1b4b 50%, #311042 100%)",
  bgAnimationSpeed: 18,
  bgOverlayOpacity: 0.25,
  displayMode: "fullscreen",
  showNextPreview: true,
  showProgressBar: true,
  showReferenceBadge: true,
};

const DEFAULT_LIBRARY_ITEMS = [
  {
    id: "psalm-23",
    title: "Psalm 23",
    category: "scripture",
    author: "King David",
    content: `The LORD is my shepherd; I shall not want.
He makes me lie down in green pastures.
He leads me beside still waters.
He restores my soul.
He leads me in paths of righteousness for his name's sake.
Even though I walk through the valley of the shadow of death,
I will fear no evil, for you are with me;
your rod and your staff, they comfort me.
You prepare a table before me in the presence of my enemies;
you anoint my head with oil; my cup overflows.
Surely goodness and mercy shall follow me all the days of my life,
and I shall dwell in the house of the LORD forever.`,
    lines: [
      "The LORD is my shepherd; I shall not want.",
      "He makes me lie down in green pastures.",
      "He leads me beside still waters.",
      "He restores my soul.",
      "He leads me in paths of righteousness for his name's sake.",
      "Even though I walk through the valley of the shadow of death,",
      "I will fear no evil, for you are with me;",
      "your rod and your staff, they comfort me.",
      "You prepare a table before me in the presence of my enemies;",
      "you anoint my head with oil; my cup overflows.",
      "Surely goodness and mercy shall follow me all the days of my life,",
      "and I shall dwell in the house of the LORD forever.",
    ],
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
  },
  {
    id: "amazing-grace",
    title: "Amazing Grace",
    category: "hymn",
    author: "John Newton",
    content: `Amazing grace! how sweet the sound
That saved a wretch like me!
I once was lost, but now am found,
Was blind, but now I see.

'Twas grace that taught my heart to fear,
And grace my fears relieved;
How precious did that grace appear
The hour I first believed!

Through many dangers, toils and snares,
I have already come;
'Tis grace hath brought me safe thus far,
And grace will lead me home.

When we've been there ten thousand years,
Bright shining as the sun,
We've no less days to sing God's praise
Than when we'd first begun.`,
    lines: [
      "Amazing grace! how sweet the sound\nThat saved a wretch like me!",
      "I once was lost, but now am found,\nWas blind, but now I see.",
      "'Twas grace that taught my heart to fear,\nAnd grace my fears relieved;",
      "How precious did that grace appear\nThe hour I first believed!",
      "Through many dangers, toils and snares,\nI have already come;",
      "'Tis grace hath brought me safe thus far,\nAnd grace will lead me home.",
      "When we've been there ten thousand years,\nBright shining as the sun,",
      "We've no less days to sing God's praise\nThan when we'd first begun.",
    ],
    createdAt: Date.now() - 90000,
    updatedAt: Date.now() - 90000,
  },
  {
    id: "way-maker",
    title: "Way Maker",
    category: "song",
    author: "Sinach",
    content: `You are here, moving in our midst
I worship You, I worship You
You are here, working in this place
I worship You, I worship You

(Chorus)
Way Maker, Miracle Worker, Promise Keeper
Light in the darkness, my God, that is who You are!

You are here, touching every heart
I worship You, I worship You
You are here, healing every heart
I worship You, I worship You

Even when I don't see it, You're working
Even when I don't feel it, You're working
You never stop, You never stop working!`,
    lines: [
      "You are here, moving in our midst\nI worship You, I worship You",
      "You are here, working in this place\nI worship You, I worship You",
      "Way Maker, Miracle Worker, Promise Keeper\nLight in the darkness, my God, that is who You are!",
      "You are here, touching every heart\nI worship You, I worship You",
      "You are here, healing every heart\nI worship You, I worship You",
      "Even when I don't see it, You're working\nEven when I don't feel it, You're working\nYou never stop, You never stop working!",
    ],
    createdAt: Date.now() - 80000,
    updatedAt: Date.now() - 80000,
  },
  {
    id: "john-3-16",
    title: "John 3:16-17",
    category: "scripture",
    author: "Apostle John",
    content: `For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.

For God sent not his Son into the world to condemn the world; but that the world through him might be saved.`,
    lines: [
      "For God so loved the world, that he gave his only begotten Son,",
      "that whosoever believeth in him should not perish, but have everlasting life.",
      "For God sent not his Son into the world to condemn the world;",
      "but that the world through him might be saved.",
    ],
    createdAt: Date.now() - 70000,
    updatedAt: Date.now() - 70000,
  },
];

const DEFAULT_SCHEDULES = [
  {
    id: "sunday-morning-worship",
    name: "Sunday Morning Service Set",
    items: [
      {
        id: "item-1",
        libraryItemId: "psalm-23",
        title: "Opening Scripture: Psalm 23",
        category: "scripture",
        lines: DEFAULT_LIBRARY_ITEMS[0].lines,
      },
      {
        id: "item-2",
        libraryItemId: "amazing-grace",
        title: "Hymn: Amazing Grace",
        category: "hymn",
        lines: DEFAULT_LIBRARY_ITEMS[1].lines,
      },
      {
        id: "item-3",
        libraryItemId: "way-maker",
        title: "Praise: Way Maker",
        category: "song",
        lines: DEFAULT_LIBRARY_ITEMS[2].lines,
      },
    ],
    createdAt: Date.now() - 200000,
    updatedAt: Date.now() - 200000,
  },
];

const DEFAULT_TIMER_SLOTS = [
  { id: "slot-1", title: "Opening & Welcome", durationSec: 300, speaker: "Host / Worship Leader" },
  { id: "slot-2", title: "Praise & Worship", durationSec: 1200, speaker: "Worship Team" },
  { id: "slot-3", title: "Announcements & Offering", durationSec: 420, speaker: "Pastoral Team" },
  { id: "slot-4", title: "Sermon / Message", durationSec: 2100, speaker: "Lead Pastor" },
  { id: "slot-5", title: "Altar Call & Closing Benediction", durationSec: 360, speaker: "Pastor" },
];

const DEFAULT_TIMER_STATE = {
  status: "idle",
  durationSec: 300, // Matches first slot (5 min)
  remainingSec: 300,
  startedAt: null,
  targetEndTime: null,
  allowOvertime: true,
  warningThresholdSec: 300, // 5 min
  criticalThresholdSec: 60, // 1 min
  title: "Opening & Welcome",
  promptMessage: null,
  promptVisible: false,
  slots: DEFAULT_TIMER_SLOTS,
  activeSlotIndex: 0,
  autoAdvance: false,
  showNextProgramAlert: true,
  fontSizeScale: 100,
};

function loadSavedStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
      return data;
    }
  } catch (err) {
    console.error("Error loading store.json:", err);
  }
  return null;
}

const saved = loadSavedStore();

// Global synchronized state
let state = {
  title: saved?.title || "Psalm 23",
  subtitle: saved?.subtitle || "Scripture Reading",
  category: saved?.category || "scripture",
  lines: saved?.lines || DEFAULT_LIBRARY_ITEMS[0].lines,
  cur: 0,
  playing: false,
  wpm: saved?.wpm || 130,
  lineStartedAt: null,
  lineDurationMs: null,

  liveState: {
    isBlackout: false,
    isClearText: false,
    isLogo: false,
    isFrozen: false,
    quickAlert: null,
  },

  timerState: saved?.timerState
    ? { ...DEFAULT_TIMER_STATE, ...saved.timerState, status: "idle", startedAt: null, targetEndTime: null }
    : { ...DEFAULT_TIMER_STATE },

  theme: saved?.theme
    ? { ...DEFAULT_THEME, ...saved.theme }
    : { ...DEFAULT_THEME },

  currentScheduleId: saved?.currentScheduleId || "sunday-morning-worship",
  activeScheduleIndex: 0,
  schedule: saved?.schedule || DEFAULT_SCHEDULES[0].items,

  savedSchedules: saved?.savedSchedules || DEFAULT_SCHEDULES,
  library: saved?.library || DEFAULT_LIBRARY_ITEMS,
};

let advanceTimer = null;
let saveDebounceTimer = null;

function saveStoreToDisk() {
  clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    try {
      const toSave = {
        title: state.title,
        subtitle: state.subtitle,
        category: state.category,
        lines: state.lines,
        wpm: state.wpm,
        theme: state.theme,
        timerState: {
          ...state.timerState,
          status: "idle",
          startedAt: null,
          targetEndTime: null,
        },
        currentScheduleId: state.currentScheduleId,
        schedule: state.schedule,
        savedSchedules: state.savedSchedules,
        library: state.library,
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(toSave, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save store to disk:", err);
    }
  }, 300);
}

function lineDurationMs(text, wpm) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length || 1;
  return Math.max(2500, Math.round((words / wpm) * 60000) + 700);
}

function clearAdvanceTimer() {
  if (advanceTimer) {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }
}

function scheduleAdvance() {
  clearAdvanceTimer();
  if (!state.playing) return;
  const text = state.lines[state.cur] || "";
  state.lineDurationMs = lineDurationMs(text, state.wpm);
  state.lineStartedAt = Date.now();

  advanceTimer = setTimeout(() => {
    if (state.cur + 1 < state.lines.length) {
      state.cur += 1;
      scheduleAdvance();
    } else {
      state.playing = false;
      state.lineStartedAt = null;
      state.lineDurationMs = null;
    }
    broadcast();
  }, state.lineDurationMs);
}

function setPlaying(p) {
  state.playing = p;
  if (p) {
    scheduleAdvance();
  } else {
    clearAdvanceTimer();
    state.lineStartedAt = null;
    state.lineDurationMs = null;
  }
}

function jumpTo(idx) {
  if (idx < 0 || idx >= state.lines.length) return;
  state.cur = idx;
  if (state.playing) {
    scheduleAdvance();
  } else {
    state.lineStartedAt = null;
    state.lineDurationMs = null;
  }
}

function restart() {
  clearAdvanceTimer();
  state.cur = 0;
  state.playing = false;
  state.lineStartedAt = null;
  state.lineDurationMs = null;
}

function setLines(title, subtitle, lines, category = "custom") {
  clearAdvanceTimer();
  state.title = title && title.trim() ? title.trim() : "Presentation";
  state.subtitle = subtitle || "";
  state.category = category;
  state.lines = (lines || []).filter((l) => l && l.trim().length > 0);
  if (state.lines.length === 0) state.lines = ["(Add content in editor)"];
  state.cur = 0;
  state.playing = false;
  state.lineStartedAt = null;
  state.lineDurationMs = null;
  saveStoreToDisk();
}

function setWpm(wpm) {
  const n = Number(wpm);
  if (!Number.isFinite(n)) return;
  state.wpm = Math.max(40, Math.min(400, Math.round(n)));
  if (state.playing) scheduleAdvance();
  saveStoreToDisk();
}

function setTheme(newTheme) {
  state.theme = { ...state.theme, ...newTheme };
  saveStoreToDisk();
}

function setLiveState(newLiveState) {
  state.liveState = { ...state.liveState, ...newLiveState };
}

function setQuickAlert(text) {
  state.liveState.quickAlert = text && text.trim() ? text.trim() : null;
}

function loadScheduleItem(index) {
  if (index >= 0 && index < state.schedule.length) {
    const item = state.schedule[index];
    state.activeScheduleIndex = index;
    state.title = item.title;
    state.category = item.category || "custom";
    state.lines =
      item.lines && item.lines.length > 0 ? item.lines : ["(Empty item)"];
    if (item.themeOverride) {
      state.theme = { ...state.theme, ...item.themeOverride };
    }
    state.cur = 0;
    state.playing = false;
    state.lineStartedAt = null;
    state.lineDurationMs = null;
    saveStoreToDisk();
  }
}

function saveSchedule(schedule) {
  const existingIdx = state.savedSchedules.findIndex(
    (s) => s.id === schedule.id,
  );
  if (existingIdx >= 0) {
    state.savedSchedules[existingIdx] = schedule;
  } else {
    state.savedSchedules.push(schedule);
  }
  if (state.currentScheduleId === schedule.id) {
    state.schedule = schedule.items;
  }
  saveStoreToDisk();
}

function loadSchedule(scheduleId) {
  const found = state.savedSchedules.find((s) => s.id === scheduleId);
  if (found) {
    state.currentScheduleId = found.id;
    state.schedule = found.items;
    state.activeScheduleIndex = 0;
    if (found.items.length > 0) {
      loadScheduleItem(0);
    }
    saveStoreToDisk();
  }
}

function deleteSchedule(scheduleId) {
  state.savedSchedules = state.savedSchedules.filter(
    (s) => s.id !== scheduleId,
  );
  saveStoreToDisk();
}

function saveLibraryItem(item) {
  const idx = state.library.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    state.library[idx] = item;
  } else {
    state.library.unshift(item);
  }
  saveStoreToDisk();
}

function deleteLibraryItem(id) {
  state.library = state.library.filter((i) => i.id !== id);
  saveStoreToDisk();
}

function startTimer(durationSec, title) {
  if (title && typeof title === "string") {
    state.timerState.title = title.trim();
  }
  if (typeof durationSec === "number" && durationSec > 0) {
    state.timerState.durationSec = Math.round(durationSec);
    state.timerState.remainingSec = Math.round(durationSec);
  } else if (state.timerState.status === "idle" || !state.timerState.remainingSec) {
    state.timerState.remainingSec = state.timerState.durationSec;
  }
  const remaining = state.timerState.remainingSec;
  state.timerState.startedAt = Date.now();
  state.timerState.targetEndTime = Date.now() + remaining * 1000;
  state.timerState.status = "running";
  saveStoreToDisk();
}

function pauseTimer() {
  if (state.timerState.status === "running" && state.timerState.targetEndTime) {
    const diffSec = Math.round((state.timerState.targetEndTime - Date.now()) / 1000);
    state.timerState.remainingSec = diffSec;
    state.timerState.status = "paused";
    state.timerState.targetEndTime = null;
    state.timerState.startedAt = null;
    saveStoreToDisk();
  }
}

function resetTimer() {
  state.timerState.remainingSec = state.timerState.durationSec;
  state.timerState.status = "idle";
  state.timerState.startedAt = null;
  state.timerState.targetEndTime = null;
  saveStoreToDisk();
}

function adjustTimer(deltaSec) {
  const delta = Number(deltaSec);
  if (!Number.isFinite(delta)) return;
  if (state.timerState.status === "running" && state.timerState.targetEndTime) {
    state.timerState.targetEndTime += delta * 1000;
    state.timerState.remainingSec = Math.round((state.timerState.targetEndTime - Date.now()) / 1000);
  } else {
    state.timerState.remainingSec = Math.max(0, (state.timerState.remainingSec || 0) + delta);
    state.timerState.durationSec = Math.max(0, (state.timerState.durationSec || 0) + delta);
  }
  saveStoreToDisk();
}

function setTimerConfig(config) {
  if (!config || typeof config !== "object") return;
  state.timerState = { ...state.timerState, ...config };
  if (config.durationSec && state.timerState.status === "idle") {
    state.timerState.remainingSec = config.durationSec;
  }
  saveStoreToDisk();
}

function setTimerPrompt(message, visible) {
  state.timerState.promptMessage = message && message.trim() ? message.trim() : null;
  state.timerState.promptVisible = Boolean(visible && state.timerState.promptMessage);
  saveStoreToDisk();
}

function addTimerSlot(slot) {
  if (!slot || !slot.title) return;
  const newSlot = {
    id: slot.id || `slot-${Date.now()}`,
    title: slot.title.trim(),
    durationSec: Math.max(10, Number(slot.durationSec) || 300),
    speaker: slot.speaker ? slot.speaker.trim() : undefined,
    notes: slot.notes ? slot.notes.trim() : undefined,
    warningThresholdSec: slot.warningThresholdSec,
  };
  if (!Array.isArray(state.timerState.slots)) {
    state.timerState.slots = [];
  }
  state.timerState.slots.push(newSlot);
  saveStoreToDisk();
}

function updateTimerSlot(id, updates) {
  if (!Array.isArray(state.timerState.slots)) return;
  const index = state.timerState.slots.findIndex((s) => s.id === id);
  if (index === -1) return;

  state.timerState.slots[index] = {
    ...state.timerState.slots[index],
    ...updates,
  };

  // If we updated the currently active slot while idle, also update timer title & duration
  if (index === state.timerState.activeSlotIndex) {
    if (updates.title) state.timerState.title = updates.title;
    if (updates.durationSec && state.timerState.status === "idle") {
      state.timerState.durationSec = updates.durationSec;
      state.timerState.remainingSec = updates.durationSec;
    }
    if (updates.warningThresholdSec !== undefined) {
      state.timerState.warningThresholdSec = updates.warningThresholdSec;
    }
  }
  saveStoreToDisk();
}

function deleteTimerSlot(id) {
  if (!Array.isArray(state.timerState.slots)) return;
  state.timerState.slots = state.timerState.slots.filter((s) => s.id !== id);
  if (state.timerState.activeSlotIndex >= state.timerState.slots.length) {
    state.timerState.activeSlotIndex = Math.max(0, state.timerState.slots.length - 1);
  }
  saveStoreToDisk();
}

function reorderTimerSlots(slots) {
  if (!Array.isArray(slots)) return;
  state.timerState.slots = slots;
  saveStoreToDisk();
}

function jumpToTimerSlot(index, autoStart = false) {
  if (!Array.isArray(state.timerState.slots) || state.timerState.slots.length === 0) return;
  const targetIndex = Math.max(0, Math.min(index, state.timerState.slots.length - 1));
  const slot = state.timerState.slots[targetIndex];
  if (!slot) return;

  state.timerState.activeSlotIndex = targetIndex;
  state.timerState.title = slot.title;
  state.timerState.durationSec = slot.durationSec;
  state.timerState.remainingSec = slot.durationSec;
  state.timerState.warningThresholdSec = slot.warningThresholdSec || state.timerState.warningThresholdSec || 300;

  if (autoStart) {
    state.timerState.startedAt = Date.now();
    state.timerState.targetEndTime = Date.now() + slot.durationSec * 1000;
    state.timerState.status = "running";
  } else {
    state.timerState.status = "idle";
    state.timerState.startedAt = null;
    state.timerState.targetEndTime = null;
  }
  saveStoreToDisk();
}

function nextTimerSlot(autoStart = false) {
  if (!Array.isArray(state.timerState.slots)) return;
  const nextIdx = state.timerState.activeSlotIndex + 1;
  if (nextIdx < state.timerState.slots.length) {
    jumpToTimerSlot(nextIdx, autoStart);
  }
}

function prevTimerSlot(autoStart = false) {
  if (!Array.isArray(state.timerState.slots)) return;
  const prevIdx = state.timerState.activeSlotIndex - 1;
  if (prevIdx >= 0) {
    jumpToTimerSlot(prevIdx, autoStart);
  }
}

function setTimerSlots(slots, activeIndex = 0) {
  if (!Array.isArray(slots)) return;
  state.timerState.slots = slots;
  state.timerState.activeSlotIndex = Math.max(0, Math.min(activeIndex, slots.length - 1));
  const activeSlot = state.timerState.slots[state.timerState.activeSlotIndex];
  if (activeSlot && state.timerState.status === "idle") {
    state.timerState.title = activeSlot.title;
    state.timerState.durationSec = activeSlot.durationSec;
    state.timerState.remainingSec = activeSlot.durationSec;
    if (activeSlot.warningThresholdSec) {
      state.timerState.warningThresholdSec = activeSlot.warningThresholdSec;
    }
  }
  saveStoreToDisk();
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
};

// --- Bible Provider Config & Helpers ---
const BIBLE_VERSIONS = {
  KJV: { id: "kjv", name: "King James Version", provider: "bible-api" },
  NKJV: { id: "NKJV", name: "New King James Version", provider: "bolls" },
  NIV: { id: "NIV", name: "New International Version", provider: "bolls" },
  ESV: { id: "ESV", name: "English Standard Version", provider: "bolls" },
  NLT: { id: "NLT", name: "New Living Translation", provider: "bolls" },
  NASB: { id: "NASB", name: "New American Standard Bible", provider: "bolls" },
  WEB: { id: "web", name: "World English Bible", provider: "bible-api" },
  ASV: { id: "asv", name: "American Standard Version", provider: "bible-api" },
  AMP: { id: "AMP", name: "Amplified Bible", provider: "bolls" },
  RSV: { id: "RSV", name: "Revised Standard Version", provider: "bolls" },
  BBE: { id: "bbe", name: "Bible in Basic English", provider: "bible-api" },
  DARBY: { id: "darby", name: "Darby Bible", provider: "bible-api" },
  DRA: { id: "dra", name: "Douay-Rheims American Edition", provider: "bible-api" },
  YLT: { id: "ylt", name: "Young's Literal Translation", provider: "bible-api" },
  MSG: { id: "MSG", name: "The Message", provider: "bolls" },
};

const BIBLE_BOOKS = [
  { id: 1, name: "Genesis", aliases: ["gen", "ge", "gn"] },
  { id: 2, name: "Exodus", aliases: ["exo", "ex", "exod"] },
  { id: 3, name: "Leviticus", aliases: ["lev", "le", "lv"] },
  { id: 4, name: "Numbers", aliases: ["num", "nu", "nm", "nb"] },
  { id: 5, name: "Deuteronomy", aliases: ["deut", "dt", "de"] },
  { id: 6, name: "Joshua", aliases: ["josh", "jos", "jsh"] },
  { id: 7, name: "Judges", aliases: ["judg", "jdg", "jg", "jdgs"] },
  { id: 8, name: "Ruth", aliases: ["rth", "ru"] },
  { id: 9, name: "1 Samuel", aliases: ["1 samuel", "1samuel", "1 sam", "1sam", "1 s", "1s", "1sa", "1 sm", "first samuel"] },
  { id: 10, name: "2 Samuel", aliases: ["2 samuel", "2samuel", "2 sam", "2sam", "2 s", "2s", "2sa", "2 sm", "second samuel"] },
  { id: 11, name: "1 Kings", aliases: ["1 kings", "1kings", "1 kgs", "1kgs", "1 k", "1k", "1ki", "first kings"] },
  { id: 12, name: "2 Kings", aliases: ["2 kings", "2kings", "2 kgs", "2kgs", "2 k", "2k", "2ki", "second kings"] },
  { id: 13, name: "1 Chronicles", aliases: ["1 chronicles", "1chronicles", "1 chr", "1chr", "1 ch", "1ch", "first chronicles"] },
  { id: 14, name: "2 Chronicles", aliases: ["2 chronicles", "2chronicles", "2 chr", "2chr", "2 ch", "2ch", "second chronicles"] },
  { id: 15, name: "Ezra", aliases: ["ezr"] },
  { id: 16, name: "Nehemiah", aliases: ["neh", "ne"] },
  { id: 17, name: "Esther", aliases: ["est", "esth", "es"] },
  { id: 18, name: "Job", aliases: ["jb"] },
  { id: 19, name: "Psalms", aliases: ["psalm", "psalms", "psa", "pss", "ps"] },
  { id: 20, name: "Proverbs", aliases: ["prov", "pro", "prv", "pr"] },
  { id: 21, name: "Ecclesiastes", aliases: ["eccles", "eccl", "ecc", "ec"] },
  { id: 22, name: "Song of Solomon", aliases: ["song of songs", "song", "sos", "canticle of canticles"] },
  { id: 23, name: "Isaiah", aliases: ["isa", "is"] },
  { id: 24, name: "Jeremiah", aliases: ["jer", "je", "jr"] },
  { id: 25, name: "Lamentations", aliases: ["lam", "la"] },
  { id: 26, name: "Ezekiel", aliases: ["ezek", "eze", "ezk"] },
  { id: 27, name: "Daniel", aliases: ["dan", "da", "dn"] },
  { id: 28, name: "Hosea", aliases: ["hos", "ho"] },
  { id: 29, name: "Joel", aliases: ["jl", "joe"] },
  { id: 30, name: "Amos", aliases: ["am"] },
  { id: 31, name: "Obadiah", aliases: ["obad", "oba", "ob"] },
  { id: 32, name: "Jonah", aliases: ["jon", "jnh"] },
  { id: 33, name: "Micah", aliases: ["mic", "mc"] },
  { id: 34, name: "Nahum", aliases: ["nah", "na"] },
  { id: 35, name: "Habakkuk", aliases: ["hab", "hb"] },
  { id: 36, name: "Zephaniah", aliases: ["zeph", "zep", "zp"] },
  { id: 37, name: "Haggai", aliases: ["hag", "hg"] },
  { id: 38, name: "Zechariah", aliases: ["zech", "zec", "zc"] },
  { id: 39, name: "Malachi", aliases: ["mal", "ml"] },
  { id: 40, name: "Matthew", aliases: ["matt", "mat", "mt"] },
  { id: 41, name: "Mark", aliases: ["mrk", "mar", "mk"] },
  { id: 42, name: "Luke", aliases: ["luk", "lu", "lk"] },
  { id: 43, name: "John", aliases: ["jhn", "jn"] },
  { id: 44, name: "Acts", aliases: ["act", "ac"] },
  { id: 45, name: "Romans", aliases: ["rom", "ro", "rm"] },
  { id: 46, name: "1 Corinthians", aliases: ["1 corinthians", "1corinthians", "1 cor", "1cor", "1 co", "1co", "first corinthians"] },
  { id: 47, name: "2 Corinthians", aliases: ["2 corinthians", "2corinthians", "2 cor", "2cor", "2 co", "2co", "second corinthians"] },
  { id: 48, name: "Galatians", aliases: ["gal", "ga"] },
  { id: 49, name: "Ephesians", aliases: ["eph", "ep"] },
  { id: 50, name: "Philippians", aliases: ["phil", "php", "pp"] },
  { id: 51, name: "Colossians", aliases: ["col", "co"] },
  { id: 52, name: "1 Thessalonians", aliases: ["1 thessalonians", "1thessalonians", "1 thess", "1thess", "1 th", "1th", "first thessalonians"] },
  { id: 53, name: "2 Thessalonians", aliases: ["2 thessalonians", "2thessalonians", "2 thess", "2thess", "2 th", "2th", "second thessalonians"] },
  { id: 54, name: "1 Timothy", aliases: ["1 timothy", "1timothy", "1 tim", "1tim", "1 ti", "1ti", "first timothy"] },
  { id: 55, name: "2 Timothy", aliases: ["2 timothy", "2timothy", "2 tim", "2tim", "2 ti", "2ti", "second timothy"] },
  { id: 56, name: "Titus", aliases: ["tit", "ti"] },
  { id: 57, name: "Philemon", aliases: ["philem", "phm", "pm"] },
  { id: 58, name: "Hebrews", aliases: ["heb", "he"] },
  { id: 59, name: "James", aliases: ["jas", "jm"] },
  { id: 60, name: "1 Peter", aliases: ["1 peter", "1peter", "1 pet", "1pet", "1 pe", "1pe", "1 pt", "1pt", "first peter"] },
  { id: 61, name: "2 Peter", aliases: ["2 peter", "2peter", "2 pet", "2pet", "2 pe", "2pe", "2 pt", "2pt", "second peter"] },
  { id: 62, name: "1 John", aliases: ["1 john", "1john", "1 jhn", "1jhn", "1 jn", "1jn", "first john"] },
  { id: 63, name: "2 John", aliases: ["2 john", "2john", "2 jhn", "2jhn", "2 jn", "2jn", "second john"] },
  { id: 64, name: "3 John", aliases: ["3 john", "3john", "3 jhn", "3jhn", "3 jn", "3jn", "third john"] },
  { id: 65, name: "Jude", aliases: ["jud", "jd"] },
  { id: 66, name: "Revelation", aliases: ["rev", "re", "rv", "apocalypse"] }
];

const BIBLE_BOOK_MAP = {};
for (const b of BIBLE_BOOKS) {
  BIBLE_BOOK_MAP[b.name.toLowerCase()] = b;
  for (const a of b.aliases) {
    BIBLE_BOOK_MAP[a.toLowerCase()] = b;
  }
}

function findBibleBook(str) {
  if (!str) return null;
  const s = str.trim().toLowerCase().replace(/\s+/g, " ");
  return BIBLE_BOOK_MAP[s] || null;
}

function parseRefParts(ref) {
  const m = ref.match(/^([\d]?\s*[a-zA-Z\s]+?)\s*(\d+)(?:[:\s]+(\d+)(?:\s*[-–—]\s*(\d+))?)?$/);
  if (!m) return null;
  const bookStr = m[1].trim().toLowerCase().replace(/\s+/g, " ");
  const chapter = parseInt(m[2], 10);
  const verseStart = m[3] ? parseInt(m[3], 10) : null;
  const verseEnd = m[4] ? parseInt(m[4], 10) : (verseStart !== null ? verseStart : null);
  return { bookStr, chapter, verseStart, verseEnd };
}

async function fetchFromBolls(version, bookInfo, refParts) {
  const { chapter, verseStart, verseEnd } = refParts;
  const versionConfig = BIBLE_VERSIONS[version] || BIBLE_VERSIONS["KJV"];
  const bollsVersion = versionConfig.bollsId || version;
  const url = `https://bolls.life/get-chapter/${bollsVersion}/${bookInfo.id}/${chapter}/`;

  const res = await fetch(url, {
    headers: { "User-Agent": "EasyPresenterStudio/2.0 (https://github.com/EasyPresenter)" }
  });

  if (!res.ok) {
    return {
      error: `Chapter ${chapter} of ${bookInfo.name} was not found in ${version}.`,
      version,
    };
  }

  const list = await res.json();
  if (!Array.isArray(list) || list.length === 0) {
    return {
      error: `No scripture verses found for ${bookInfo.name} ${chapter} in ${version}.`,
      version,
    };
  }

  let filtered = list;
  if (verseStart !== null && verseStart !== undefined) {
    filtered = list.filter((v) => v.verse >= verseStart && (verseEnd === null || v.verse <= verseEnd));
  }

  if (filtered.length === 0) {
    return {
      error: `Verse ${verseStart}${verseEnd && verseEnd !== verseStart ? `-${verseEnd}` : ""} was not found in ${bookInfo.name} ${chapter}. (${bookInfo.name} ${chapter} contains ${list.length} verses in ${version}).`,
      version,
    };
  }

  const verses = filtered.map((v) => {
    let raw = v.text || "";
    if (raw.includes("<br/>")) {
      const parts = raw.split("<br/>");
      raw = parts.slice(1).join(" ");
    }
    const clean = raw
      .replace(/<S>\d+<\/S>/g, "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return {
      verse: v.verse,
      text: clean,
    };
  });

  const refString = `${bookInfo.name} ${chapter}:${verseStart ? (verseEnd && verseEnd !== verseStart ? `${verseStart}-${verseEnd}` : verseStart) : `1-${list.length}`}`;

  return {
    reference: refString,
    version,
    versionName: versionConfig.name,
    verses,
    plainContent: verses.map((v) => `${v.verse} ${v.text}`).join("\n\n"),
    totalVerses: verses.length,
  };
}

// HTTP Static and SPA fallback server
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  // Health check endpoint for Coolify / Docker
  if (pathname === "/health" || pathname === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
    return;
  }

  // REST API Endpoints
  if (pathname === "/api/state") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(state));
    return;
  }

  // Online Lyrics Search Proxy Endpoint
  if (pathname === "/api/lyrics/search") {
    const query = parsedUrl.searchParams.get("q") || "";
    if (!query.trim()) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ results: [] }));
      return;
    }

    // Fetch from LRCLIB open API
    const targetUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query.trim())}`;

    fetch(targetUrl, {
      headers: {
        "User-Agent":
          "EasyPresenterStudio/2.0 (https://github.com/EasyPresenter)",
      },
    })
      .then((r) => r.json())
      .then((data) => {
        const results = (Array.isArray(data) ? data : [])
          .filter((item) => item.plainLyrics || item.syncedLyrics)
          .slice(0, 15)
          .map((item) => {
            const raw =
              item.plainLyrics ||
              (item.syncedLyrics
                ? item.syncedLyrics.replace(/\[\d+:\d+\.\d+\]\s*/g, "")
                : "");
            const snippet = raw
              .split("\n")
              .filter(Boolean)
              .slice(0, 3)
              .join(" • ");
            return {
              id: `online-${item.id || Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              trackName: item.trackName || item.name || query,
              artistName: item.artistName || item.artist || "Unknown Artist",
              albumName: item.albumName || "",
              duration: item.duration || 0,
              snippet: snippet || "",
              plainLyrics: raw.trim(),
            };
          });

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ results }));
      })
      .catch((err) => {
        console.error("Online lyric search error:", err.message);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            results: [],
            error: "Failed to query online lyric provider",
          }),
        );
      });
    return;
  }

  // Supported Bible Versions
  if (pathname === "/api/scripture/versions") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({
      versions: Object.entries(BIBLE_VERSIONS).map(([key, val]) => ({
        id: key,
        name: val.name,
      })),
      default: "KJV",
    }));
    return;
  }

  // Online Scripture Search Proxy Endpoint
  if (pathname === "/api/scripture/search") {
    const rawQuery = (parsedUrl.searchParams.get("q") || "").trim();
    const dropdownVersion = (parsedUrl.searchParams.get("version") || "KJV").trim().toUpperCase();

    if (!rawQuery) {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify({ results: null, error: "Please enter a scripture reference." }));
      return;
    }

    // Step 1: Detect trailing Bible version in the query if user typed e.g. "john 2:30 KJV" or "romans 8:28 NIV"
    const versionKeys = Object.keys(BIBLE_VERSIONS);
    const versionRegex = new RegExp(`[\\s,\\(-]+(${versionKeys.join("|")})[\\)\\s]*$`, "i");

    let version = dropdownVersion;
    let cleanRef = rawQuery;

    const vMatch = cleanRef.match(versionRegex);
    if (vMatch) {
      version = vMatch[1].toUpperCase();
      cleanRef = cleanRef.replace(versionRegex, "").trim();
    }

    if (!BIBLE_VERSIONS[version]) {
      version = "KJV";
    }

    // Normalize stuck chapter numbers (e.g. "john2:30" -> "john 2:30", "1cor13:4" -> "1cor 13:4")
    cleanRef = cleanRef.replace(/([a-zA-Z]+)(\d+)(?=[:\s])/g, "$1 $2").trim();

    const refParts = parseRefParts(cleanRef);

    const sendJson = (status, obj) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify(obj));
    };

    if (!refParts || !refParts.chapter) {
      sendJson(200, {
        error: `Please include a chapter number to search online (e.g. "${cleanRef} 1" or "${cleanRef} 3:16").`,
        reference: cleanRef,
        version,
      });
      return;
    }

    const bookInfo = findBibleBook(refParts.bookStr);
    const versionConfig = BIBLE_VERSIONS[version] || BIBLE_VERSIONS["KJV"];

    // If version is on bible-api.com (KJV, WEB, ASV, BBE, DARBY, DRA, YLT)
    if (versionConfig.provider === "bible-api") {
      const targetUrl = `https://bible-api.com/${encodeURIComponent(cleanRef)}?translation=${versionConfig.id}`;
      fetch(targetUrl, {
        headers: { "User-Agent": "EasyPresenterStudio/2.0 (https://github.com/EasyPresenter)" }
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.error || !data.verses || data.verses.length === 0) {
            // If bible-api couldn't find it, attempt fallback to bolls if bookInfo is known
            if (bookInfo && refParts) {
              return fetchFromBolls(version, bookInfo, refParts).then((bollsResult) => {
                sendJson(200, bollsResult);
              });
            }
            sendJson(200, {
              error: `Scripture reference "${cleanRef}" was not found in ${version}. Please check the book, chapter, and verse range.`,
              reference: cleanRef,
              version,
            });
            return;
          }

          const verses = data.verses.map((v) => ({
            verse: v.verse,
            text: (v.text || "").replace(/\s+/g, " ").trim(),
          }));

          const canonicalRef = data.reference || cleanRef;
          sendJson(200, {
            reference: canonicalRef,
            version: version,
            versionName: data.translation_name || versionConfig.name,
            verses,
            plainContent: verses.map((v) => `${v.verse} ${v.text}`).join("\n\n"),
            totalVerses: verses.length,
          });
        })
        .catch(async (err) => {
          console.error("bible-api fetch error:", err.message);
          if (bookInfo && refParts) {
            try {
              const bollsResult = await fetchFromBolls(version, bookInfo, refParts);
              if (!bollsResult.error) {
                sendJson(200, bollsResult);
                return;
              }
            } catch (e) {}
          }
          sendJson(200, {
            error: `Failed to query scripture provider: ${err.message}`,
            reference: cleanRef,
            version,
          });
        });
      return;
    }

    // Modern translations via bolls.life (NIV, ESV, NKJV, NASB, NLT, AMP, RSV, MSG, etc.)
    if (bookInfo && refParts) {
      fetchFromBolls(version, bookInfo, refParts)
        .then((result) => sendJson(200, result))
        .catch((err) => {
          console.error("bolls.life fetch error:", err.message);
          sendJson(200, {
            error: `Failed to retrieve ${cleanRef} in ${version}: ${err.message}`,
            reference: cleanRef,
            version,
          });
        });
      return;
    }

    sendJson(200, {
      error: `Could not parse scripture reference "${cleanRef}". Examples: "John 3:16", "Romans 8:28-39", "Psalm 23:1-6".`,
      reference: cleanRef,
      version,
    });
    return;
  }

  // Determine root directory to serve from (Vite dist or fallback public)
  const hasDist = fs.existsSync(DIST_DIR);
  const serveDir = hasDist ? DIST_DIR : PUBLIC_DIR;

  // Aliases for backward compatibility
  if (pathname === "/control.html" || pathname === "/control") {
    pathname = "/index.html";
  } else if (pathname === "/display.html" || pathname === "/display") {
    pathname = "/index.html";
  } else if (pathname === "/stage.html" || pathname === "/stage") {
    pathname = "/index.html";
  } else if (pathname === "/timer.html" || pathname === "/timer" || pathname === "/countdown.html" || pathname === "/countdown") {
    pathname = "/index.html";
  } else if (pathname === "/") {
    pathname = "/index.html";
  }

  let filePath = path.join(serveDir, pathname);

  // Check if file exists, or fallback to index.html for SPA client-side routing
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(serveDir, "index.html");
  }

  if (!fs.existsSync(filePath)) {
    // If neither dist nor index exists, check public
    const fallbackPath = path.join(
      PUBLIC_DIR,
      pathname === "/index.html" ? "control.html" : pathname,
    );
    if (fs.existsSync(fallbackPath)) {
      filePath = fallbackPath;
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found. Please run npm run build to create frontend bundle.");
      return;
    }
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Error loading asset");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

// WebSocket Server
const wss = new WebSocketServer({ server, path: "/ws" });

function broadcast() {
  const payload = JSON.stringify({ type: "state", state });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "state", state }));

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case "setLines":
        setLines(msg.title, msg.subtitle, msg.lines, msg.category);
        break;
      case "jump":
        jumpTo(msg.index);
        break;
      case "play":
        setPlaying(true);
        break;
      case "pause":
        setPlaying(false);
        break;
      case "restart":
        restart();
        break;
      case "setWpm":
        setWpm(msg.wpm);
        break;
      case "setTheme":
        setTheme(msg.theme);
        break;
      case "setLiveState":
        setLiveState(msg.liveState);
        break;
      case "setQuickAlert":
        setQuickAlert(msg.text);
        break;
      case "startTimer":
        startTimer(msg.durationSec, msg.title);
        break;
      case "pauseTimer":
        pauseTimer();
        break;
      case "resetTimer":
        resetTimer();
        break;
      case "adjustTimer":
        adjustTimer(msg.deltaSec);
        break;
      case "setTimerConfig":
        setTimerConfig(msg.config);
        break;
      case "setTimerPrompt":
        setTimerPrompt(msg.message, msg.visible);
        break;
      case "addTimerSlot":
        addTimerSlot(msg.slot);
        break;
      case "updateTimerSlot":
        updateTimerSlot(msg.id, msg.slot);
        break;
      case "deleteTimerSlot":
        deleteTimerSlot(msg.id);
        break;
      case "reorderTimerSlots":
        reorderTimerSlots(msg.slots);
        break;
      case "jumpToTimerSlot":
        jumpToTimerSlot(msg.index, msg.autoStart);
        break;
      case "nextTimerSlot":
        nextTimerSlot(msg.autoStart);
        break;
      case "prevTimerSlot":
        prevTimerSlot(msg.autoStart);
        break;
      case "setTimerSlots":
        setTimerSlots(msg.slots, msg.activeIndex);
        break;
      case "loadScheduleItem":
        loadScheduleItem(msg.index);
        break;
      case "updateSchedule":
        state.schedule = msg.items;
        saveStoreToDisk();
        break;
      case "saveSchedule":
        saveSchedule(msg.schedule);
        break;
      case "loadSchedule":
        loadSchedule(msg.scheduleId);
        break;
      case "deleteSchedule":
        deleteSchedule(msg.scheduleId);
        break;
      case "saveLibraryItem":
        saveLibraryItem(msg.item);
        break;
      case "deleteLibraryItem":
        deleteLibraryItem(msg.id);
        break;
      case "resetToDefault":
        state.theme = { ...DEFAULT_THEME };
        state.library = DEFAULT_LIBRARY_ITEMS;
        state.savedSchedules = DEFAULT_SCHEDULES;
        state.schedule = DEFAULT_SCHEDULES[0].items;
        state.currentScheduleId = DEFAULT_SCHEDULES[0].id;
        state.activeScheduleIndex = 0;
        state.timerState = { ...DEFAULT_TIMER_STATE };
        loadScheduleItem(0);
        saveStoreToDisk();
        break;
      default:
        return;
    }
    broadcast();
  });
});

server.listen(PORT, "0.0.0.0", () => {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) ips.push(net.address);
    }
  }
  console.log("----------------------------------------------------");
  console.log("  ✨ EasyPresenter Studio Server is running!");
  console.log("----------------------------------------------------");
  console.log(`  🖥️  Local Control:    http://localhost:${PORT}/`);
  console.log(`  📺 Local Display:    http://localhost:${PORT}/display`);
  console.log(
    `  🎬 Local vMix Ovly:  http://localhost:${PORT}/display?overlay=1`,
  );
  console.log(`  🎙️  Stage Monitor:   http://localhost:${PORT}/stage`);
  console.log(`  ⏱️  Timer Display:   http://localhost:${PORT}/timer`);
  console.log(
    `  ⏱️  vMix Timer Ovly: http://localhost:${PORT}/timer?overlay=1`,
  );
  console.log("");
  if (ips.length > 0) {
    console.log("  🌐 Network LAN URLs (for vMix or remote iPads/PCs):");
    ips.forEach((ip) => {
      console.log(`     • Studio Control: http://${ip}:${PORT}/`);
      console.log(
        `     • vMix Overlay:   http://${ip}:${PORT}/display?overlay=1`,
      );
      console.log(`     • Projector Screen: http://${ip}:${PORT}/display`);
      console.log(`     • Timer Display:  http://${ip}:${PORT}/timer`);
      console.log(
        `     • Timer Overlay:  http://${ip}:${PORT}/timer?overlay=1`,
      );
    });
  }
  console.log("----------------------------------------------------");
});

// Graceful shutdown handling for Docker / Coolify restarts
function flushStoreSync() {
  clearTimeout(saveDebounceTimer);
  try {
    const toSave = {
      title: state.title,
      subtitle: state.subtitle,
      category: state.category,
      lines: state.lines,
      wpm: state.wpm,
      theme: state.theme,
      timerState: {
        ...state.timerState,
        status: "idle",
        startedAt: null,
        targetEndTime: null,
      },
      currentScheduleId: state.currentScheduleId,
      schedule: state.schedule,
      savedSchedules: state.savedSchedules,
      library: state.library,
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(toSave, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to flush store to disk on shutdown:", err);
  }
}

const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  flushStoreSync();
  wss.close(() => {
    server.close(() => {
      console.log("Server and WebSocket connections closed.");
      process.exit(0);
    });
  });
  // Force exit after 5 seconds if connections linger
  setTimeout(() => process.exit(0), 5000).unref();
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

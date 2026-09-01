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

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
};

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
  console.log("");
  if (ips.length > 0) {
    console.log("  🌐 Network LAN URLs (for vMix or remote iPads/PCs):");
    ips.forEach((ip) => {
      console.log(`     • Studio Control: http://${ip}:${PORT}/`);
      console.log(
        `     • vMix Overlay:   http://${ip}:${PORT}/display?overlay=1`,
      );
      console.log(`     • Projector Screen: http://${ip}:${PORT}/display`);
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

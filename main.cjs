const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]
));

// Standalone splash shown instantly while the bundled server boots (portable
// builds self-extract ~100 MB and take up to ~20s) — matches Vuetify's dark
// theme. English only: it renders before the app, and therefore before the
// user's language choice, exists.
function renderSplash({ heading, message, spinner }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  html, body {
    margin: 0;
    height: 100%;
    background: #0e0b08;
    color: #f6eedc;
    font-family: 'Segoe UI', Roboto, system-ui, sans-serif;
    overflow: hidden;
  }
  .wrap {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 28px;
  }
  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(246, 238, 220, 0.15);
    border-top-color: #ffb627;
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }
  .title {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 2px;
  }
  .subtitle {
    font-size: 14px;
    color: rgba(246, 238, 220, 0.55);
    margin-top: -18px;
  }
  .subtitle--pulse {
    animation: pulse 1.6s ease-in-out infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.9; } }
</style>
</head>
<body>
  <div class="wrap">
    ${spinner ? '<div class="spinner"></div>' : ''}
    <div class="title">${escapeHtml(heading)}</div>
    <div class="subtitle${spinner ? ' subtitle--pulse' : ''}">${escapeHtml(message)}</div>
  </div>
</body>
</html>`;
}

function loadHtml(html) {
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

function startServer() {
  // Default to the per-user app data dir; an explicitly set DB_PATH wins so
  // the packaged stack can be driven against a throwaway database.
  process.env.DB_PATH = process.env.DB_PATH ?? path.join(app.getPath('userData'), 'shot_counter.db');
  if (!isDev) {
    process.env.SERVE_STATIC = path.join(__dirname, 'dist');
    process.env.FRONTEND_ORIGIN = `http://localhost:${process.env.PORT ?? 5000}`;
  }
  return require('./server/server.cjs');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Shot-Counter',
    backgroundColor: '#0e0b08',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  Menu.setApplicationMenu(null);

  // The footer links must open in the user's browser, not in a new
  // Electron window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // No application menu means no default F11 accelerator — restore it.
  // F11 drives the same HTML fullscreen the header button uses, so the
  // button's icon state stays in sync no matter which way was toggled.
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      event.preventDefault();
      mainWindow.webContents.executeJavaScript(
        'document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()',
        true,
      ).catch(() => {});
    }
  });

  loadHtml(renderSplash({
    heading: 'SHOT-COUNTER',
    message: 'Starting …',
    spinner: true,
  }));
}

function loadApp(port) {
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `http://localhost:${port}`);
}

function showStartupError(err) {
  const detail = err && err.code === 'EADDRINUSE'
    ? `Port ${process.env.PORT ?? 5000} is already in use — is the app already running?`
    : (err && err.message) || 'Unknown error';
  loadHtml(renderSplash({
    heading: '⚠ Startup failed',
    message: detail,
    spinner: false,
  }));
}

// One running instance owns the fixed server port — a second launch (e.g. an
// impatient double-click during the portable's slow cold start) would otherwise
// hit EADDRINUSE. Focus the existing window instead.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    try {
      const { serverReady } = startServer();
      serverReady.then((port) => loadApp(port)).catch(showStartupError);
    } catch (err) {
      showStartupError(err);
    }
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}

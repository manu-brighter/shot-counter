const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

// Standalone splash shown instantly while the bundled server boots (portable
// builds self-extract ~100 MB and take up to ~20s) — matches Vuetify's dark theme.
const LOADING_HTML = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<style>
  html, body {
    margin: 0;
    height: 100%;
    background: #121212;
    color: rgba(255, 255, 255, 0.87);
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
    border: 4px solid rgba(255, 255, 255, 0.12);
    border-top-color: #2196f3;
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }
  .title {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  .subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: -18px;
    animation: pulse 1.6s ease-in-out infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.9; } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="spinner"></div>
    <div class="title">Shöttli-Counter</div>
    <div class="subtitle">wird gestartet …</div>
  </div>
</body>
</html>`;

function startServer() {
  process.env.DB_PATH = path.join(app.getPath('userData'), 'shot_counter.db');
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
    title: 'Shöttli-Counter',
    backgroundColor: '#121212',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(LOADING_HTML)}`);
}

function loadApp(port) {
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `http://localhost:${port}`);
}

app.whenReady().then(() => {
  createWindow();
  const { serverReady } = startServer();
  serverReady.then((port) => loadApp(port));
});

app.on('window-all-closed', () => {
  app.quit();
});

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function startServer() {
  process.env.DB_PATH = path.join(app.getPath('userData'), 'shot_counter.db');
  if (!isDev) {
    process.env.SERVE_STATIC = path.join(__dirname, 'dist');
    process.env.FRONTEND_ORIGIN = `http://localhost:${process.env.PORT ?? 5000}`;
  }
  return require('./server/server.js');
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Shöttli-Counter',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `http://localhost:${port}`);
}

app.whenReady().then(() => {
  const { serverReady } = startServer();
  serverReady.then((port) => createWindow(port));
});

app.on('window-all-closed', () => {
  app.quit();
});

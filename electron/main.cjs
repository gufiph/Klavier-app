'use strict';

const { app, BrowserWindow, protocol, session } = require('electron');
const path = require('path');
const fs = require('fs');

// Must be called before app.whenReady()
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

const DIST = path.join(__dirname, '..', 'dist');

const MIME = {
  '.html':        'text/html; charset=utf-8',
  '.js':          'application/javascript',
  '.css':         'text/css',
  '.json':        'application/json',
  '.png':         'image/png',
  '.jpg':         'image/jpeg',
  '.svg':         'image/svg+xml',
  '.ico':         'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff2':       'font/woff2',
  '.woff':        'font/woff',
};

function mime(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 1024,
    minWidth: 360,
    minHeight: 600,
    title: 'Klavier-App',
    backgroundColor: '#030712',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setMenuBarVisibility(false);

  // Auto-grant microphone permission (no browser-style popup)
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === 'media');
  });

  win.loadURL('app://klavier/index.html');
}

app.whenReady().then(() => {
  // Serve dist/ files through secure app:// protocol
  session.defaultSession.protocol.handle('app', (request) => {
    let { pathname } = new URL(request.url);
    if (pathname === '/') pathname = '/index.html';

    let filePath = path.join(DIST, pathname);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST, 'index.html'); // SPA fallback
    }

    try {
      const data = fs.readFileSync(filePath);
      return new Response(data, { headers: { 'Content-Type': mime(filePath) } });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

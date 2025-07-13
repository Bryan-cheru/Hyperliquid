import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;

let win: BrowserWindow;

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        resizable: true,
        fullscreenable: true,
        show: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
        },
    });

    Menu.setApplicationMenu(null);

    win.once('ready-to-show', () => {
        win.show();
    });

    if (isDev) {
        win.loadURL('http://localhost:5173');
    } else {
        win.loadFile(path.resolve(app.getAppPath(), 'dist/index.html'));
    }
}

ipcMain.on('minimize-window', () => {
    win?.minimize();
});

ipcMain.on('maximize-window', () => {
    if (win?.isMaximized()) {
        win.unmaximize();
    } else {
        win?.maximize();
    }
});

ipcMain.on('close-window', () => {
    win?.close();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

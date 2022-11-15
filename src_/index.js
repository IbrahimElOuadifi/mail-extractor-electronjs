const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const { readFile } = require('fs/promises')
const { extract } = require('./gmail.js')

const devTools = false

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
      devTools
    },
  })

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  if(devTools) mainWindow.webContents.openDevTools()
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on('seeds-list', async ({ sender }, { seeds }) => extract(sender, seeds))

ipcMain.on('select-seeds', async ({ reply }) => {
  const { filePaths, canceled } = await dialog.showOpenDialog({ filters: [ { name: 'Text File', extensions: [ 'txt' ] } ] })
  if(canceled) console.log('canceled')
  else {
    const seeds = await readFile(filePaths[0], { encoding: 'utf-8' })
    reply('select-seeds-result', { seeds })
  }
})
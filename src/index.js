const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { watchInbox, watchSpam, watchTrash } = require('./gmail.js')

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
  mainWindow.loadFile(path.join(__dirname, 'index.html'))

  // Open the DevTools.
  if(devTools) mainWindow.webContents.openDevTools()
  mainWindow.setMenu(null)
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

ipcMain.on('start-watch', async ({ sender, reply }, { user, password }) => {
  try {
    await watchInbox(sender, { user, password })
    await watchSpam(sender, { user, password })
    await watchTrash(sender, { user, password })
    reply('is-watching')
  } catch (err) {
    console.log(err.message)
  }
})
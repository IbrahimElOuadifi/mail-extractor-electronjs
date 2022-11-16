const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const Store = require('electron-store')
const path = require('path')
const { writeFile } = require('fs/promises')
const { watchEMail } = require('./gmail.js')

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
    await watchEMail(sender, { user, password })
    new Store().set('get-user-and-pass', JSON.stringify({ user, password }))
    reply('is-watching')
  } catch ({ message }) {
    console.log(message)
    reply('log-error')
    dialog.showErrorBox('error', message)
  }
})

ipcMain.on('save-extract-data', async ({ reply }, { extract_data }) => {
  if(!extract_data.length) return dialog.showErrorBox('data is empty', 'can\'not save a empty data!')
  const { response } = await dialog.showMessageBox({ title: 'save as', buttons: ['CANCEL', 'TEXT', 'JSON'], minimizable: true, closable: false})
  if(response === 1) {
    const { filePath, canceled } = await dialog.showSaveDialog({ defaultPath: `${ app.getPath('documents')}\\extraction-result.txt` })
    if(canceled) return console.log('canceled')
    await writeFile(filePath, extract_data.map(({ ip }) => ip).join('\n'), { encoding: 'utf-8' })
    console.log(`saved on ${filePath}`)
  } else if(response === 2){
    const { filePath, canceled } = await dialog.showSaveDialog({ defaultPath: `${ app.getPath('documents')}\\extraction-result.json` })
    if(canceled) return console.log('canceled')
    await writeFile(filePath, JSON.stringify(extract_data), { encoding: 'utf-8' })
    console.log(`saved on ${filePath}`)
  } else {
    console.log('cancel!')
  }
})

ipcMain.once('get-user-and-pass', ({ reply }) => {
  if(new Store().has('get-user-and-pass')) reply('set-user-and-pass', JSON.parse(new Store().get('get-user-and-pass')))
})
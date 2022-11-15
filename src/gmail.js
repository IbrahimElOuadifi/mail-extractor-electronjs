const imaps = require('imap-simple')
const { writeFile, open } = require('fs/promises')
const { app, dialog, ipcMain } = require('electron')

module.exports.watchInbox = (sender, { user, password }) => new Promise(async (resolve, reject) => {
  {

    const READ_MAIL_CONFIG = {
        imap: {
            user,
            password,
            host: 'imap.gmail.com',
            port: 993,
            authTimeout: 10000,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
          }
    }
  
    try {
      let extract_data = []
      const connection = await imaps.connect({ ...READ_MAIL_CONFIG, onmail: async num => {
          connection.search(['ALL'], { bodies: ['HEADER'], markSeen: false }).then(async messages => {
              const extract = messages.map(msg => ({ status: msg.parts[0].body['received-spf'][0].split(' ')[0], ip: /client-ip=[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/.exec(msg.parts[0].body['received-spf'][0])[0].replace('client-ip=', '')}))
              extract_data = { ...extract_data, ...extract }
              const uidsToDelete = messages.map(message => message.attributes.uid)
              console.log('inbox', uidsToDelete)
              sender.send('imap-update', { folder: 'inbox', count: uidsToDelete.length, extract })
              if(uidsToDelete.length > 0) await connection.moveMessage(uidsToDelete, '[Gmail]/Trash', err => console.log(err))
          })
      }})
      await connection.openBox('INBOX')
      sender.send('connection-success', { message: `CONNECTION SUCCESSFUL`, folder: 'inbox' })
      ipcMain.on('stop-extraction', async ({ reply }) => {
        try {
          await connection.end() 
          reply('connection-end', { folder: 'inbox' })
          const { filePath, canceled } = await dialog.showSaveDialog({ defaultPath: `${app.getPath('documents')}\\extraction-result.json` })
          if(canceled) return console.log('canceled')
          await writeFile(filePath, JSON.stringify(extract_data), { encoding: 'utf-8' })
          await open(filePath)
        console.log(`saved on ${filePath}`)
        } catch (err) {
          console.log(err)
        }
      })
      resolve()
    } catch (err) {
      reject(err)
    }
  }
})



module.exports.watchSpam = (sender, { user, password }) => new Promise(async (resolve, reject) => {

  const READ_MAIL_CONFIG = {
      imap: {
          user,
          password,
          host: 'imap.gmail.com',
          port: 993,
          authTimeout: 10000,
          tls: true,
          tlsOptions: { rejectUnauthorized: false },
        }
  }

  try {
    const connection = await imaps.connect({ ...READ_MAIL_CONFIG, onmail: async num => {
        connection.search(['ALL'], { bodies: ['HEADER'], markSeen: false }).then(async messages => {
            const uidsToDelete = messages.map(message => message.attributes.uid)
            sender.send('imap-update', { folder: 'spam', count: uidsToDelete.length })
            if(uidsToDelete.length > 0) await connection.deleteMessage(uidsToDelete, '[Gmail]/Trash', err => console.log(err))
        })
    }})
    sender.send('connection-success', { message: `CONNECTION SUCCESSFUL`, folder: 'spam' })
    connection.openBox('[Gmail]/Spam')
    
    ipcMain.on('stop-extraction', async ({ reply }) => {
      try {
        await connection.end() 
        reply('connection-end', { folder: 'spam' })
      } catch (err) {
        console.log(err)
      }
    })
    resolve()
  } catch (err) {
    reject(err)
  }
})



module.exports.watchTrash = (sender, { user, password }) => new Promise(async (resolve, reject) => {

  const READ_MAIL_CONFIG = {
      imap: {
          user,
          password,
          host: 'imap.gmail.com',
          port: 993,
          authTimeout: 10000,
          tls: true,
          tlsOptions: { rejectUnauthorized: false },
        }
  }

  try {
    const connection = await imaps.connect({ ...READ_MAIL_CONFIG, onmail: async num => {
        connection.search(['ALL'], { bodies: ['HEADER'], markSeen: false }).then(async messages => {
            const uidsToDelete = messages.map(message => message.attributes.uid)
            console.log('trash', uidsToDelete)
            sender.send('imap-update', { folder: 'trash', count: uidsToDelete.length })
            if(uidsToDelete.length > 0) await connection.deleteMessage(uidsToDelete, '[Gmail]/Trash', err => console.log(err))
        })
    }})
    sender.send('connection-success', { message: `CONNECTION SUCCESSFUL`, folder: 'trash' })
    connection.openBox('[Gmail]/Trash')
    ipcMain.on('stop-extraction', async ({ reply }) => {
      try {
        await connection.end() 
        reply('connection-end', { folder: 'trash' })
      } catch (err) {
        console.log(err)
      }
    })
    resolve()
  } catch (err) {
    reject(err)
  }
})
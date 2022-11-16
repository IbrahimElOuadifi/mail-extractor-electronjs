const imaps = require('imap-simple')
const { dialog, ipcMain } = require('electron')

module.exports.watchEMail= (sender, { user, password }) => new Promise(async (resolve, reject) => {
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
      // WATCH FOR INBOX
      let extract_data = []
      const connection_inbox = await imaps.connect({ ...READ_MAIL_CONFIG, onmail: async () => {
          connection_inbox.search(['ALL'], { bodies: ['HEADER'], markSeen: false }).then(async messages => {
              const extract = messages.map(msg => ({ status: msg.parts[0].body['received-spf'][0].split(' ')[0], ip: /client-ip=[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/.exec(msg.parts[0].body['received-spf'][0])[0].replace('client-ip=', '')}))
              extract_data = [ ...extract_data, ...extract ]
              const uidsToDelete = messages.map(message => message.attributes.uid)
              console.log('inbox', uidsToDelete)
              sender.send('imap-update', { folder: 'inbox', count: uidsToDelete.length, extract })
              if(uidsToDelete.length > 0) await connection_inbox.moveMessage(uidsToDelete, '[Gmail]/Trash', err => console.log(err))
          })
      }})
      await connection_inbox.openBox('INBOX')
      sender.send('connection-success', { message: `CONNECTION SUCCESSFUL`, folder: 'inbox' })

      // WATCH FOR SPAM
      const connection_spam = await imaps.connect({ ...READ_MAIL_CONFIG, onmail: async () => {
        connection_spam.search(['ALL'], { bodies: ['HEADER'], markSeen: false }).then(async messages => {
            const uidsToDelete = messages.map(message => message.attributes.uid)
            sender.send('imap-update', { folder: 'spam', count: uidsToDelete.length })
            if(uidsToDelete.length > 0) await connection_spam.deleteMessage(uidsToDelete, '[Gmail]/Trash', err => console.log(err))
        })
      }
    })
    sender.send('connection-success', { message: `CONNECTION SUCCESSFUL`, folder: 'spam' })
    connection_spam.openBox('[Gmail]/Spam')

      // WATCH FOR TRASH
      const connection_trash = await imaps.connect({ ...READ_MAIL_CONFIG, onmail: async () => {
        connection_trash.search(['ALL'], { bodies: ['HEADER'], markSeen: false }).then(async messages => {
          const uidsToDelete = messages.map(message => message.attributes.uid)
          console.log('trash', uidsToDelete)
          sender.send('imap-update', { folder: 'trash', count: uidsToDelete.length })
          if(uidsToDelete.length > 0) await connection_trash.deleteMessage(uidsToDelete, '[Gmail]/Trash', err => console.log(err))
        })
      }
    })
    sender.send('connection-success', { message: `CONNECTION SUCCESSFUL`, folder: 'trash' })
    connection_trash.openBox('[Gmail]/Trash')

    // END CONNECTION HANDLER
    ipcMain.once('stop-extraction', async ({ reply }) => {
      try {
        await connection_inbox.end() 
        reply('connection-end', { folder: 'inbox' })

        await connection_spam.end() 
        reply('connection-end', { folder: 'spam' })

        await connection_trash.end() 
        reply('connection-end', { folder: 'trash' })

        if(extract_data.length) {
          sender.send('set-extract-data', { data: extract_data })
        }
      } catch ({ message }) {
        console.log(message)
        sender.send('log-error')
        dialog.showErrorBox('error', message)
      }
    })
      resolve()
    } catch (err) {
      reject(err)
    }
  }
})
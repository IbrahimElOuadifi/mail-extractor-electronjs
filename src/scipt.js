const imaps = require('imap-simple')
const { writeFile } = require('fs/promises')

const readMail = async (EMAIL, PASSWORD) => new Promise(async (resolve, reject) => {

  const READ_MAIL_CONFIG = {
      imap: {
          user: EMAIL,
          password: PASSWORD,
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
            const extract = messages.map(msg => ({ status: msg.parts[0].body['received-spf'][0].split(' ')[0], ip:  /client-ip=[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/.exec(msg.parts[0].body['received-spf'][0])[0].replace('client-ip=', '')}))
            extract_data = { ...extract_data, ...extract }
            
            await writeFile('extraction.json', JSON.stringify(extract_data))

            const uidsToDelete = messages.map(message => message.attributes.uid)
            console.log('inbox', uidsToDelete)
            if(uidsToDelete.length > 0) await connection.moveMessage(uidsToDelete, '[Gmail]/Trash', err => console.log(err))
        })
    }})
    console.log('CONNECTION SUCCESSFUL', new Date().toString())
    connection.openBox('INBOX')

    const connection_spam = await imaps.connect({ ...READ_MAIL_CONFIG, onmail: async num => {
        connection_spam.search(['ALL'], { bodies: ['HEADER'], markSeen: false }).then(async messages => {
            const uidsToDelete = messages.map(message => message.attributes.uid)
            console.log('spam', uidsToDelete)
            if(uidsToDelete.length > 0) await connection_spam.deleteMessage(uidsToDelete, '[Gmail]/Trash', err => console.log(err))
        })
    }})
    console.log('CONNECTION SUCCESSFUL', new Date().toString())
    connection_spam.openBox('[Gmail]/Spam')

    const connection_trash = await imaps.connect({ ...READ_MAIL_CONFIG, onmail: async num => {
        connection_trash.search(['ALL'], { bodies: ['HEADER'], markSeen: false }).then(async messages => {
            const uidsToDelete = messages.map(message => message.attributes.uid)
            console.log('trash', uidsToDelete)
            if(uidsToDelete.length > 0) await connection_trash.deleteMessage(uidsToDelete, '[Gmail]/Trash', err => console.log(err))
        })
    }})
    console.log('CONNECTION SUCCESSFUL', new Date().toString())
    connection_trash.openBox('[Gmail]/Trash')
    
    await connection.on('on-change', e => console.log(e))
    
    // await connection.end()
    resolve()
  } catch (error) {
    reject(error)
  }
})
// extract('masha.sijtsemam1t@gmail.com:cpekixewisnqyxbp')

readMail('gghost1591@gmail.com', 'petijudwthrllhav')
// readMail('masha.sijtsemam1t@gmail.com', 'cpekixewisnqyxbp')

// client-ip=198.2.140.131

// pass
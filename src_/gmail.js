const imaps = require('imap-simple');
const fs = require('fs/promises');
const { dialog } = require('electron');

const isValid = combo => /^([a-zA-Z0-9\.]{2,50}@gmail.com:[\w]+)$/.test(combo)

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
        },
  }

  try {
    const connection = await imaps.connect(READ_MAIL_CONFIG)
    const boxs = await connection.getBoxes()
    console.log('CONNECTION SUCCESSFUL', new Date().toString())
    const box = await connection.openBox('INBOX')
    const searchCriteria = ['ALL']
    const fetchOptions = {
      bodies: ['HEADER'],
      markSeen: false
    };
    const results = await connection.search(searchCriteria, fetchOptions)

    //  Open a mailbox, and look at the 50 newest messages
    await connection.openBox('INBOX').then(() => connection.search(['ALL'], { bodies: ['HEADER'], markSeen: false }).then(async messages => {
      const uidsToDelete = messages.map(message => message.attributes.uid)
      await fs.writeFile('uidsToDelete1.json', JSON.stringify(uidsToDelete))
      if(uidsToDelete.length > 0) await connection.moveMessage(uidsToDelete, '[Gmail]/Trash', err => console.log(err))
    }))
    await connection.openBox('[Gmail]/Spam').then(() => connection.search(['ALL'], { bodies: ['HEADER'], markSeen: false }).then(async messages => {
      const uidsToDelete = messages.map(message => message.attributes.uid)
      await fs.writeFile('uidsToDelete3.json', JSON.stringify(uidsToDelete))
    if(uidsToDelete.length > 0) await connection.deleteMessage(uidsToDelete, err => console.log(err))
    }))
    await connection.openBox('[Gmail]/Trash').then(() => connection.search(['ALL'], { bodies: ['HEADER'], markSeen: false }).then(async messages => {
      const uidsToDelete = messages.map(message => message.attributes.uid)
      await fs.writeFile('uidsToDelete4.json', JSON.stringify(uidsToDelete))
    if(uidsToDelete.length > 0) await connection.deleteMessage(uidsToDelete, err => console.log(err))
    }))    

    await connection.end()
    resolve(results.map(msg => ({ status: msg.parts[0].body['received-spf'][0].split(' ')[0], ip:  /client-ip=[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/.exec(msg.parts[0].body['received-spf'][0])[0].replace('client-ip=', '')})))
  } catch (error) {
    reject(error)
  }
})

module.exports.extract = async (sender, combos) => {
  const combo_list = combos.split('\n').filter(combo => isValid(combo))
  if(combo_list.length === 0) return dialog.showErrorBox('err', 'Seeds list is empty!')
  let fileData = []
  try {
    for(combo of combo_list) {
      try {
        console.log(`progress - ${combo_list.indexOf(combo)} of ${combo_list.length} -- ${combo.split(':')[0]}`)
        sender.send('extraction-status', { status: `progress - ${combo_list.indexOf(combo)} of ${combo_list.length} -- ${combo.split(':')[0]}` })
        const results = await readMail(combo.split(':')[0], combo.split(':')[1])
        fileData = [ ...fileData, ...results ]
      } catch (err) {
        console.log(err)
        await dialog.showErrorBox('connection err', `${combo} can't connect !`)
      }
    }
    sender.send('extraction-status', { end: true })
    sender.send('select-seeds-result', { seeds: fileData.map(m => m.ip).join('\n') })
    const { filePath, canceled } = await dialog.showSaveDialog({ defaultPath: 'extraction-results.json' })
    if(canceled) console.log('canceled')
    else await fs.writeFile(filePath, JSON.stringify(fileData))
  } catch (err) {
    console.err(err)
    sender.send('extraction-status', { end: true })
  }
}

// extract('masha.sijtsemam1t@gmail.com:cpekixewisnqyxbp')



// client-ip=198.2.140.131

// pass
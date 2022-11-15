const { ipcRenderer } = require('electron')

const formSelector = document.querySelector('form')
const input_email = document.getElementById('email-input')
const input_password = document.getElementById('password-input')
const input_status = document.getElementById('input-status')
const text_status = document.getElementById('text-status')
const watch_button = document.getElementById('watch-btn')
const stop_button = document.getElementById('stop-btn')
const clear_button = document.getElementById('button-cls')
const copy_button = document.getElementById('button-copy')
const save_button = document.getElementById('button-save')

const log = message => input_status.value = message.toString()
const logIp = message => text_status.value = text_status.value + (text_status.value.length ? '\n' : '') + message.toString()

formSelector.addEventListener('submit', e => {
    e.preventDefault()

    ipcRenderer.send('start-watch', { user: input_email.value, password: input_password.value })
})

stop_button.addEventListener('click', () => ipcRenderer.send('stop-extraction'))

clear_button.addEventListener('click', () => text_status.value = '')

copy_button.addEventListener('click', () => {
    navigator.clipboard.writeText(text_status.value)
})

save_button.addEventListener('click', () => console.log('save_button'))

ipcRenderer.on('is-watching', () => {
    log(`connection success`)
    watch_button.classList.add('d-none')
    stop_button.classList.remove('d-none')
})

ipcRenderer.on('connection-success', (_, { message, folder }) => {
    log(`${message} on ${folder}...`)
})

ipcRenderer.on('connection-end', (_, { folder }) => {
    log(`disconnect on ${folder}`)
    stop_button.classList.add('d-none')
    watch_button.classList.remove('d-none')
})

ipcRenderer.on('imap-update', (_, { folder, count, extract }) => {
    log(`${count} ${folder} email deleted`)
    if(extract) extract.forEach(({ ip }) => logIp(ip))
})


input_email.value = 'masha.sijtsemam1t@gmail.com'
input_password.value = 'cpekixewisnqyxbp'
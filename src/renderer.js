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

let extract_data = []

const log = message => input_status.value = message.toString()
const logIp = message => text_status.value = text_status.value + (text_status.value.length ? '\n' : '') + message.toString()

formSelector.addEventListener('submit', e => {
    e.preventDefault()

    ipcRenderer.send('start-watch', { user: input_email.value, password: input_password.value })
    watch_button.disabled = true
})

stop_button.addEventListener('click', () => ipcRenderer.send('stop-extraction'))

clear_button.addEventListener('click', () => {
    extract_data = []
    save_button.disabled = extract_data.length ? false : true
    text_status.value = ''
})

copy_button.addEventListener('click', () => {
    text_status.setSelectionRange(0, 9999)
    navigator.clipboard.writeText(text_status.value)
})

save_button.addEventListener('click', () => ipcRenderer.send('save-extract-data', { extract_data }))

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
    watch_button.disabled = false
})

ipcRenderer.on('imap-update', (_, { folder, count, extract }) => {
    log(`${count} ${folder} email deleted`)
    if(extract) extract.forEach(({ ip }) => logIp(ip))
})

ipcRenderer.on('set-user-and-pass', (_, { user, password }) => {
    input_email.value = user
    input_password.value = password
})

ipcRenderer.on('set-extract-data', (_, { data }) => {
    extract_data = data
    save_button.disabled = extract_data.length ? false : true
})

ipcRenderer.on('log-error', () => {
    stop_button.classList.add('d-none')
    watch_button.classList.remove('d-none')
    watch_button.disabled = false
})

ipcRenderer.send('get-user-and-pass')

save_button.disabled = extract_data.length ? false : true
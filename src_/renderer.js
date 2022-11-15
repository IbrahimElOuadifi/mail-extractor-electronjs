const { ipcRenderer } = require('electron')

const formSelector = document.querySelector('form')
const select_seeds = document.getElementById('select-seeds')
const texteria_seeds = document.getElementById('seeds-list')
const input_status = document.getElementById('input-status')
const btn_start = document.getElementById('start-btn')


formSelector.addEventListener('submit', e => {
    e.preventDefault()

    ipcRenderer.send('seeds-list', { seeds: texteria_seeds.value })
})

select_seeds.addEventListener('click', () => ipcRenderer.send('select-seeds'))


ipcRenderer.on('select-seeds-result', (_, { seeds }) => texteria_seeds.value = seeds)

ipcRenderer.on('extraction-status', (_, { status, end }) => {
    if(end) {
        input_status.value = ''
        btn_start.disabled = false
    }
    else {
        input_status.value = status
        btn_start.disabled = true
    }
    console.log(status, end)
})
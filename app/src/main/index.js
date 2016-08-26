const { app, BrowserWindow, Menu, Tray, ipcMain, clipboard, globalShortcut } = require('electron')
const crypto = require('crypto');
const fs = require('fs')

let win = null
let disableClose = true
let dataFile = app.getPath('userData') + '/history.json'
let last = null

app.on('window-all-closed', () => {
	if (process.platform != 'darwin') {
		app.quit()
	}
})

app.on('ready', () => {
	win = new BrowserWindow({
		width: 400,
		height: 600,
		transparent: true,
		resizable: false,
		show: false,
		skipTaskbar: true
	})

	win.loadURL(`file://${app.getAppPath()}/index.html`)

	win.on('close', (e) => {
		if (disableClose) {
			e.preventDefault()
			win.hide()
		}
	})

	win.on('closed', () => {
		win = null
	})

	win.on('blur', () => {
		win.hide()
	})

	const appIcon = new Tray(`${app.getAppPath()}/assets/icon.png`)

	let contextMenu = Menu.buildFromTemplate([
		{
			label: "show",
			click: () => {
				win.show()
				win.focus()
			}
		},
		{
			label: "exit",
			click: () => {
				disableClose = false
				win.close()
			}
		}
	])

	Menu.setApplicationMenu(null)

	appIcon.setContextMenu(contextMenu)
	appIcon.setToolTip(app.getName())

	appIcon.on('click', () => {
		win.show()
		win.focus();
	})

	ipcMain.on('hide', () => {
		win.hide()
	})

	ipcMain.on('read-histories', (e) => {
		fs.readFile(dataFile, { encoding: 'utf8' }, (err, data) => {
			let histories = []
			if (!err) {
				histories = JSON.parse(data)
			}
			e.sender.send('show-histories', histories)
		})
	})

	let saveClip = (histories) => {
		fs.writeFile(dataFile, JSON.stringify(histories), (err) => {
			if (err) {
				console.log(err)
			}
		})
	}

	let watchClip = () => {
		let text = clipboard.readText()
		let current = crypto.createHash('md5').update(text).digest('hex')
		if (current != last) {
			last = current
			try {
				fs.readFile(dataFile, { encoding: 'utf8' }, (err, data) => {
					if (err) {
						saveClip([text])
						return
					}
					let histories = JSON.parse(data)
					histories.unshift(text)
					saveClip(histories.slice(0, 10))
				})
			} catch (err) {
				saveClip([text])
			}
		}
	}

	fs.readFile(dataFile, { encoding: 'utf8' }, (err, data) => {
		if (err) {
			return
		}
		let histories = JSON.parse(data)
		if (histories.length > 0) {
			last = crypto.createHash('md5').update(histories[0]).digest('hex')
		}
		setInterval(watchClip, 1000)
	})

	const shortcutResult = globalShortcut.register('Control+Shift+H', () => {
		win.show()
		win.focus()
	})

	if (!shortcutResult) {
		shortcutResult.log('registration failed')
	}
})

const { app, BrowserWindow, Menu, Tray, ipcMain, clipboard, globalShortcut } = require('electron')
const crypto = require('crypto')
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
		frame: false,
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
			label: "clear",
			click: () => {
				fs.unlink(dataFile)
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

	ipcMain.on('delete', (e, order) => {
		fs.readFile(dataFile, { encoding: 'utf8' }, (err, data) => {
			let histories = []
			if (err) {
				console.log(err)
				return
			}
			histories = JSON.parse(data)

			let newHistories = []
			let cnt = 0
			for (let history of histories) {
				if (++cnt == order) {
					continue
				}
				newHistories.push(history)
			}

			saveClip(newHistories, () => {
				e.sender.send('show-histories', newHistories)
			})
		})
	})

	let saveClip = (histories, callback) => {
		fs.writeFile(dataFile, JSON.stringify(histories), (err) => {
			if (err) {
				console.log(err)
				return
			}
			if (callback != undefined) { callback() }
		})
	}

	let watchClip = () => {
		let text = clipboard.readText()
		if (text.length == 0) { return }
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
					saveClip(histories.slice(0, 20))
				})
			} catch (err) {
				saveClip([text])
			}
		}
	}

	fs.readFile(dataFile, { encoding: 'utf8' }, (err, data) => {
		if (!err) {
			let histories = JSON.parse(data)
			if (histories.length > 0) {
				last = crypto.createHash('md5').update(histories[0]).digest('hex')
			}
		}
		setInterval(watchClip, 500)
	})

	globalShortcut.register('Ctrl+F12', () => {
		win.show()
		win.focus()
	})

	globalShortcut.register('Ctrl+Alt+X', () => {
		disableClose = false
		win.close()
	})
})

app.on('will-quit', () => {
	globalShortcut.unregisterAll()
})

(() => {
	const { ipcRenderer, clipboard } = require('electron')

	$('#histories').on('click', 'a', (e) => {
		clipboard.writeText($(e.target).text())
		ipcRenderer.send('hide')
	})

	ipcRenderer.on('show-histories', (e, histories) => {
		$('#histories').empty()
		for (let history of histories) {
			let atag = $('<a></a>').addClass('list-group-item').text(history)
			$('#histories').append(atag)
		}
	})
	ipcRenderer.send('read-histories')

	$(window).on('focus', () => {
		ipcRenderer.send('read-histories')
	})
})()

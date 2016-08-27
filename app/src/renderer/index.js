(() => {
	const { ipcRenderer, clipboard } = require('electron')

	$('#histories').on('click', 'a', (e) => {
		clipboard.writeText($(e.target).find('span.cliptext').text())
		ipcRenderer.send('hide')
	})

	$('#histories').on('click', 'a button.close', (e) => {
		ipcRenderer.send('delete', $(e.target).parents('a:first').attr('data-order'))
	})

	ipcRenderer.on('show-histories', (e, histories) => {
		$('#histories').empty()
		let order = 0
		for (let history of histories) {
			let atag = $('div.hide a.list-group-item').clone()
			atag.attr('data-order', ++order).find('span.cliptext').text(history.substr(0, 100))
			$('#histories').append(atag)
		}
	})
	ipcRenderer.send('read-histories')

	$(window).on('focus', () => {
		ipcRenderer.send('read-histories')
	})
})()

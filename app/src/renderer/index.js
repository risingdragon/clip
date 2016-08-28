(() => {
	const { ipcRenderer, clipboard } = require('electron')

	$('#histories').on('click', 'a', (e) => {
		let text = $(e.target).attr('data-text')
		if (text == undefined) {
			text = $(e.target).parents('a[data-text]:first').attr('data-text')
		}
		clipboard.writeText(text)
		ipcRenderer.send('hide')
		return false
	})

	$('#histories').on('click', 'a button.close', (e) => {
		let target = $(e.target).parents('a:first')
		ipcRenderer.send('delete', target.attr('data-order'))
		return false
	})

	ipcRenderer.on('show-histories', (e, histories) => {
		$('#histories').empty()
		let order = 0
		for (let history of histories) {
			let atag = $('div.hide a.list-group-item').clone()
			atag.attr('data-order', ++order)
				.attr('data-text', history)
				.find('span.cliptext').text(history.substr(0, 100))
			$('#histories').append(atag)
		}
	})
	ipcRenderer.send('read-histories')

	$(window).on('focus', () => {
		ipcRenderer.send('read-histories')
	})
})()

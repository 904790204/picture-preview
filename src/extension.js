const vscode = require('vscode');
const fs = require('fs')
const path = require('path')
const editIcon = `<svg t="1636201824117" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2413" width="15" height="15"><path d="M754.688 249.344L443.904 563.2l56.832 56.832L814.08 307.2z m-367.616 427.52h84.992l-84.992-84.992z m85.504 56.832H330.24v-141.824L716.8 209.408a55.808 55.808 0 0 1 78.848 0l59.392 59.392a55.808 55.808 0 0 1 0 79.36z m341.504 142.336H244.736A56.832 56.832 0 0 1 187.904 819.2V250.368a56.832 56.832 0 0 1 56.832-56.832h364.544l-57.344 56.832h-307.2V819.2h568.832v-307.2L870.4 455.168V819.2a56.832 56.832 0 0 1-56.832 56.832z" fill="#999999" p-id="2414"></path></svg>`
const copyIcon = `<svg t="1636202896288" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3396" width="14" height="14"><path d="M720 192h-544A80.096 80.096 0 0 0 96 272v608C96 924.128 131.904 960 176 960h544c44.128 0 80-35.872 80-80v-608C800 227.904 764.128 192 720 192z m16 688c0 8.8-7.2 16-16 16h-544a16 16 0 0 1-16-16v-608a16 16 0 0 1 16-16h544a16 16 0 0 1 16 16v608z" p-id="3397" fill="#999999"></path><path d="M848 64h-544a32 32 0 0 0 0 64h544a16 16 0 0 1 16 16v608a32 32 0 1 0 64 0v-608C928 99.904 892.128 64 848 64z" p-id="3398" fill="#999999"></path><path d="M608 360H288a32 32 0 0 0 0 64h320a32 32 0 1 0 0-64zM608 520H288a32 32 0 1 0 0 64h320a32 32 0 1 0 0-64zM480 678.656H288a32 32 0 1 0 0 64h192a32 32 0 1 0 0-64z" p-id="3399" fill="#999999"></path></svg>`

function activeMenu (context) {
	const panel = vscode.window.createWebviewPanel(
		'testWebview', // viewType
		"图片预览", // 视图标题
		vscode.ViewColumn.One, // 显示在编辑器的哪个部位
		{
				enableScripts: true, // 启用JS，默认禁用
		}
	);
	const imgs = getPreviewContent(context.path)
	let content = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
	content = content.replace('<root></root>', imgs)
	panel.webview.html = content
	panel.webview.onDidReceiveMessage((data, cb) => {
		const { type, content = '', filepath, filename, cbid} = data
		if(type === 'message') {
			vscode.window.showInformationMessage(content);
		}
		if(type === 'edit') {
			const newpath = filepath.slice(0, filepath.lastIndexOf('/') + 1) + filename
			fs.rename(filepath, newpath, (err) => {
				if(err) {
					panel.webview.postMessage({status: 'error', cbid});
					vscode.window.showInformationMessage(err.message);
					return
				}
				console.log('发射');
				panel.webview.postMessage({status: 'success', filepath: newpath, cbid});
				vscode.window.showInformationMessage(content);
			})
		}
	})

}

const getPreviewContent = (src) => {
	const pic = ['.png', '.jpg', '.jpeg']
	const svg = '.svg'
	const arr = fs.readdirSync(src)
	const getOperationContent = (el) => {
		return `<div class="operation" data-path="${path.join(src, el)}">
							<p class="operationTitle">${el}</p>
							<input class="operationInput" type="text" value="${el}" />
							<span class="operationEdit">${editIcon}</span>
							<span class="operationCopy">${copyIcon}</span>
						</div>`
	}
	return arr.map(el => {
		const url = vscode.Uri.file(path.join(src, el)).with({ scheme: 'vscode-resource' }).toString()
		const ext = path.extname(path.join(src, el))
		const content = fs.readFileSync(path.join(src, el), 'utf8')
		if(pic.includes(ext)) {
			return `<div class="item"><div class="pic"><img src="${url}" /></div>${getOperationContent(el)}</div>`
		}
		if(svg === ext) {
			return `<div class="item"><div class="pic">${content}</div>${getOperationContent(el)}</div>`
		}
		return ''
	})
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	context.subscriptions.push(vscode.commands.registerCommand('picturePreview', activeMenu));
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}

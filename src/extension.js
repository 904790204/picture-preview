const vscode = require('vscode');
const fs = require('fs')
const path = require('path')

function activeMenu (context) {
	// fs.readdirSync()
	
	console.log('点击了');
	vscode.window.showInformationMessage('Hello World from picture preview!');
	console.log(123);
	const panel = vscode.window.createWebviewPanel(
		'testWebview', // viewType
		"WebView演示", // 视图标题
		vscode.ViewColumn.One, // 显示在编辑器的哪个部位
		{
				enableScripts: true, // 启用JS，默认禁用
		}
	);
	const imgs = getPreviewContent(context.path)
	let content = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
	content = content.replace('<root></root>', imgs)
	panel.webview.html = content
}

const getPreviewContent = (src) => {
	const pic = ['.png', '.jpg', '.jpeg']
	const svg = '.svg'
	const arr = fs.readdirSync(src)
	return arr.map(el => {
		const url = vscode.Uri.file(path.join(src, el)).with({ scheme: 'vscode-resource' }).toString()
		const ext = path.extname(path.join(src, el))
		const content = fs.readFileSync(path.join(src, el), 'utf8')
		if(pic.includes(ext)) {
			return `<div class="item"><img src="${url}" /><div class="operation"><p>${el}</p></div></div>`
		}
		if(svg === ext) {
			return `<div class="item">${content}<div class="operation"><p>${el}</p></div></div>`
		}
		return ''
	})
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('进来了');
	context.subscriptions.push(vscode.commands.registerCommand('picturePreview', activeMenu));
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}

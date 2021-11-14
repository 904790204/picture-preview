const vscode = require('vscode');
const fs = require('fs')
const path = require('path')
const editIcon = fs.readFileSync(path.join(__dirname, './svg/edit.svg'), 'utf8')
const copyIcon = fs.readFileSync(path.join(__dirname, './svg/copy.svg'), 'utf8')
const emptyIcon = fs.readFileSync(path.join(__dirname, './svg/empty.svg'), 'utf8')

// webview对象
let panel = null
let wvEdit = false

/**
 * 菜单栏添加预览功能
 * @param {*} context 
 */
function activeMenu (context) {
	panel = vscode.window.createWebviewPanel(
		'webview', // viewType
		"图片预览", // 视图标题
		vscode.ViewColumn.One, // 显示在编辑器的哪个部位
		{
				enableScripts: true, // 启用JS，默认禁用
		}
	);
	watchFile(context)
	setWebviewContent(context)
}

/**
 * 设置webview内容
 * @param {*} context 
 */
const setWebviewContent = (context) => {
	const content = getWebviewContent(context)
	panel.webview.html = content
	panel.webview.onDidReceiveMessage(didReceiveMessage)
}

/**
 * 监听文件夹变化
 * @param {*} context 
 * @returns 
 */
const watchFile = (context) => {
	// 加个防抖，可能被触发多次
	fs.watch(context.path, debounce(() => {
		if(!wvEdit) {
			setWebviewContent(context)
		} else {
			wvEdit = false
		}
	}, 100));
}

/**
 * 防抖
 * @param {*} fn 
 * @param {*} wait 
 * @returns 
 */
function debounce(fn,wait){
	var timer = null;
	return function(){
			if(timer !== null){
					clearTimeout(timer);
			}
			timer = setTimeout(fn,wait);
	}
}

/**
 * webview内容
 * @param {*} context 
 * @returns 
 */
const getWebviewContent = (context) => {
	const templatePath = '../template/index.html'
	const resourcePath = path.join(__dirname, templatePath);
	const dirPath = path.dirname(resourcePath);
	let content = fs.readFileSync(path.join(__dirname, templatePath), 'utf8')
	// 加载资源
	content = content.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
		return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
	});
	// 读取当前目录图片文件
	const imgs = getPreviewContent(context.path)
	if(imgs) {
		content = content.replace('<root></root>', imgs)
	} else {
		content = content.replace('<root></root>', `<div class="empty">${emptyIcon}<p>暂无图片</p></div>`)
	}
	return content
}

/**
 * 接收webview发出的消息
 * @param {*} data 
 */
const didReceiveMessage = (data) => {
	const { type, content = '', filepath, filename, cbid } = data
	// 弹窗消息
	if(type === 'message') {
		vscode.window.showInformationMessage(content);
	}
	// 编辑文件名
	if(type === 'edit') {
		const newpath = filepath.slice(0, filepath.lastIndexOf('/') + 1) + filename
		fs.access(newpath, (err) => {
			if (!err) {
				panel.webview.postMessage({status: 'error', cbid});
				vscode.window.showInformationMessage('该目录下存在相同的文件名');
				return
			}
			// 重命名
			fs.rename(filepath, newpath, (err) => {
				if(err) {
					// 通知webview编辑失败
					panel.webview.postMessage({status: 'error', cbid});
					vscode.window.showInformationMessage(err.message);
					return
				}
				wvEdit = true
				// 通知webview编辑成功
				panel.webview.postMessage({status: 'success', filepath: newpath, cbid});
				vscode.window.showInformationMessage(content);
			})
		})
	}
}

/**
 * 获取操作栏内容
 * @param {*} src 
 * @param {*} el 
 * @returns 
 */
const getOperationContent = (src, el) => {
	return `<div class="operation" data-path="${path.join(src, el)}">
						<p class="operationTitle">${el}</p>
						<input class="operationInput" type="text" value="${el}" />
						<span class="operationEdit">${editIcon}</span>
						<span class="operationCopy">${copyIcon}</span>
						<div class="operationBackground">
							<span class="operationBackgroundBlack"></span>
							<span class="operationBackgroundGray"></span>
							<span class="operationBackgroundWhite"></span>
						</div>
					</div>`
}

/**
 * 获取图片预览内容
 * @param {*} src 
 * @returns 
 */
const getPreviewContent = (src) => {
	const pic = ['.png', '.jpg', '.jpeg', '.svg']
	// 读取文件夹下图片数据
	const arr = fs.readdirSync(src)
	return arr.map(el => {
		const stat = fs.statSync(path.join(src, el))
		if(stat.isDirectory()) {
			return ''
		}
		const url = vscode.Uri.file(path.join(src, el)).with({ scheme: 'vscode-resource' }).toString()
		const ext = path.extname(path.join(src, el))
		if(pic.includes(ext)) {
			return `<div class="item"><div class="pic"><img src="${url}" /></div>${getOperationContent(src, el)}</div>`
		}
		return ''
	}).join('')
}

module.exports = activeMenu
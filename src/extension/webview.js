const vscode = require('vscode');
const fs = require('fs')
const path = require('path')

const active = () => {

	// webview对象
	let panel = null
	let wvEdit = false
	let context = {}

	/**
	 * 菜单栏添加预览功能
	 */
	function activeMenu (c) {
		panel = vscode.window.createWebviewPanel(
			'webview', // viewType
			"图片预览", // 视图标题
			vscode.ViewColumn.One, // 显示在编辑器的哪个部位
			{
				enableScripts: true, // 启用JS，默认禁用
				retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
			}
		);
		context = c
		watchFile()
		setWebviewContent()
	}

	/**
	 * 设置webview内容
	 */
	const setWebviewContent = () => {
		const content = getWebviewContent()
		panel.webview.html = content
		panel.webview.onDidReceiveMessage(didReceiveMessage)
		sendData()
	}

	/**
	 * 发送数据到webview
	 */
	const sendData = () => {
		const src = context.path
		const pic = ['.png', '.jpg', '.jpeg', '.svg']
		const result = []
		// 读取文件夹下图片数据
		const arr = fs.readdirSync(src)
		arr.forEach(el => {
			const stat = fs.statSync(path.join(src, el))
			if(!stat.isDirectory()) {
				const filepath = path.join(src, el)
				const url = `https://file.vscode-resource.vscode-webview.net${filepath}`
				const ext = path.extname(path.join(src, el))
				if(pic.includes(ext)) {
					result.push({url, path: filepath ,name: el})
				}
			}
		})
		panel.webview.postMessage({type: 'update', piclist: result});
	}

	/**
	 * 监听文件夹变化
	 * @returns 
	 */
	const watchFile = () => {
		// 加个防抖，可能被触发多次
		fs.watch(context.path, debounce(() => {
			if(!wvEdit) {
				setWebviewContent()
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
	 * @returns 
	 */
	const getWebviewContent = () => {
		const templatePath = '../template/index.html'
		const resourcePath = path.join(__dirname, templatePath);
		const dirPath = path.dirname(resourcePath);
		let content = fs.readFileSync(path.join(__dirname, templatePath), 'utf8')
		// 加载资源
		content = content.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
			return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
		});
		return content
	}

	/**
	 * 接收webview发出的消息
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
					panel.webview.postMessage({type: 'callback', status: 'error', cbid});
					vscode.window.showInformationMessage('该目录下存在相同的文件名');
					return
				}
				// 重命名
				fs.rename(filepath, newpath, (err) => {
					if(err) {
						// 通知webview编辑失败
						panel.webview.postMessage({type: 'callback', status: 'error', cbid});
						vscode.window.showInformationMessage(err.message);
						return
					}
					wvEdit = true
					// 通知webview编辑成功
					panel.webview.postMessage({type: 'callback', status: 'success', filepath: newpath, cbid});
					vscode.window.showInformationMessage(content);
				})
			})
		}
	}
	return activeMenu
}

module.exports = active
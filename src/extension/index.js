const vscode = require('vscode');
const activeMenu = require('./webview.js')

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	context.subscriptions.push(vscode.commands.registerCommand('picturePreview', (d) => activeMenu()(d)));
}

module.exports = {
	activate,
}

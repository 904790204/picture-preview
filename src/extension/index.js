const vscode = require('vscode');
const activeMenu = require('./webview.js')

console.log(activeMenu);
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	context.subscriptions.push(vscode.commands.registerCommand('picturePreview', activeMenu));
}

module.exports = {
	activate
}

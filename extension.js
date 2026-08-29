// This work is marked with CC0 1.0 Universal. 
// To view a copy of this license, visit http://creativecommons.org/publicdomain/zero/1.0/
const vscode = require('vscode');
const path = require('node:path');

const VIEW_ID = 'vscode-picture-panel.pictureView';
const SELECT_COMMAND = 'vscode-picture-panel.selectPicture';
const CLEAR_COMMAND = 'vscode-picture-panel.clearPicture';
const IMAGE_STATE_KEY = 'picture_frame.image_path';
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];

class PictureFrameViewProvider {
	/** @param {vscode.ExtensionContext} context */
	constructor(context) {
		this.context = context;
		this.view = undefined;
	}

	/** @param {vscode.WebviewView} webview_view */
	resolveWebviewView(webview_view) {
		this.view = webview_view;
		this.render();
	}

	/** @param {string} image_path */
	set_image(image_path) {
		this.context.globalState.update(IMAGE_STATE_KEY, image_path);
		this.render();
	}

	clear_image() {
		this.context.globalState.update(IMAGE_STATE_KEY, undefined);
		this.render();
	}

	render() {
		if (!this.view) return;

		const image_path = this.context.globalState.get(IMAGE_STATE_KEY);
		if (!image_path) {
			this.view.webview.options = { enableCommandUris: true };
			this.view.webview.html = render_empty_html();
			return;
		}

		this.view.webview.options = {
			enableCommandUris: true,
			localResourceRoots: [vscode.Uri.file(path.dirname(image_path))],
		};
		const image_uri = this.view.webview.asWebviewUri(vscode.Uri.file(image_path));
		this.view.webview.html = render_image_html(image_uri);
	}
}

function render_empty_html() {
	return `<!DOCTYPE html>
<html>
<body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:var(--vscode-font-family);color:var(--vscode-descriptionForeground);">
	<a href="command:${SELECT_COMMAND}">Select a picture…</a>
</body>
</html>`;
}

/** @param {vscode.Uri} image_uri */
function render_image_html(image_uri) {
	return `<!DOCTYPE html>
<html>
<body style="margin:0;height:100vh;overflow:hidden;">
	<img src="${image_uri}" style="width:100%;height:100%;object-fit:contain;" alt="" />
</body>
</html>`;
}

/** @param {vscode.ExtensionContext} context */
function activate(context) {
	const provider = new PictureFrameViewProvider(context);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(VIEW_ID, provider),
		vscode.commands.registerCommand(SELECT_COMMAND, async () => {
			const picked = await vscode.window.showOpenDialog({
				canSelectMany: false,
				filters: { Images: IMAGE_EXTENSIONS },
				openLabel: 'Set as Picture Frame',
			});
			if (picked && picked[0]) {
				provider.set_image(picked[0].fsPath);
			}
		}),
		vscode.commands.registerCommand(CLEAR_COMMAND, () => provider.clear_image()),
	);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate,
};

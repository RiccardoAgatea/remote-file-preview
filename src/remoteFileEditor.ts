import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { RemoteProxy } from './remoteProxy';

class RemoteFile {
  constructor(public remoteProxy: RemoteProxy) { }

  private lines: Array<string> = [];
}

export class RemoteFileEditorProvider implements vscode.CustomReadonlyEditorProvider<RemoteProxy> {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    vscode.commands.registerCommand('remoteFilePreview.remoteFile.new', () => {
      vscode.commands.executeCommand('explorer.newFile', vscode.Uri.from({ scheme: 'untitled', path: crypto.randomUUID() }), RemoteFileEditorProvider.viewType);
    });

    return vscode.window.registerCustomEditorProvider(
      RemoteFileEditorProvider.viewType,
      new RemoteFileEditorProvider(context)
    );
  }

  private static readonly viewType = 'remoteFilePreview.remoteFile';

  constructor(
    private readonly _context: vscode.ExtensionContext
  ) { }

  async openCustomDocument(
    _uri: vscode.Uri,
    _openContext: { backupId?: string },
    _token: vscode.CancellationToken
  ): Promise<RemoteDirectory> {
    return RemoteDirectory.build();
  }

  async resolveCustomEditor(
    document: RemoteDirectory,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    return document.getFiles()
      .then((files) => {
        webviewPanel.webview.html = `
        <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Remote File</title>
          </head>
          <body>
            <ul class="files">
              ${Array.from(files.entries()).map((entry) => `<button value="${entry[1].path}">${entry[0]}</button>`).join("\n")}
            </div>
          </body>
          </html>`;
      });
  }
}

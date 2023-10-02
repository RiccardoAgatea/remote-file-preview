import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { RemoteProxy } from './remoteProxy';
import { RemoteResource } from './remoteResource';

class Entry {
  constructor(
    public readonly path: string,
    public readonly directory: boolean
  ) { }
}

class RemoteDirectory extends RemoteResource {
  public path = '.';

  constructor(
    public uri: vscode.Uri,
    public readonly uuid: string,
    public remoteProxy: RemoteProxy
  ) {
    super(uri, uuid, remoteProxy)
  }

  static async build(uri: vscode.Uri): Promise<RemoteDirectory> {
    return RemoteResource.build(uri, RemoteDirectory);
  }

  private makeCd() {
    if (this.path === '.') {
      return '';
    }
    else {
      return 'cd ' + this.path + ' && ';
    }
  }

  cd(newPath: string) {
    if (newPath[0] == '/') {
      this.path = newPath;
    }
    else {
      this.path += newPath;
    }
  }

  getFiles(): Thenable<Array<Entry>> {
    return new Promise((resolve, reject) => {
      this
        .remoteProxy
        .sshClient
        // We need Nicolò's help with this... We finally got to the "I need thi s and that command" point...
        // I need a command that lists all files in a directory (like ls), marking in some way the ones that are directories.
        .exec(
          this.makeCd() + 'ls -a --format=single-column',
          (error, channel) => {
            if (error) {
              reject(error);
            }
            else {
              channel.on('data', (data: string) => {
                const entries = data
                  .split("\n")
                  .map((file) => (new Entry(file, true)));

                resolve(entries);
              });
            }
          }
        )
    });
  }
}

export class RemoteDirectoryExplorer implements vscode.CustomReadonlyEditorProvider<RemoteDirectory> {
  public static register(): vscode.Disposable {
    vscode.commands.registerCommand('remoteFilePreview.remoteFile.new', () => {
      const uuid = crypto.randomUUID();
      const uri = vscode.Uri.joinPath(vscode.Uri.from({ scheme: 'untitled', path: '*' }), uuid);
      vscode.commands.executeCommand('vscode.openWith', uri, RemoteDirectoryExplorer.viewType);
    });

    return vscode.window.registerCustomEditorProvider(
      RemoteDirectoryExplorer.viewType,
      new RemoteDirectoryExplorer()
    );
  }

  private static readonly viewType = 'remoteFilePreview.remoteDirectory';

  constructor() { }

  async openCustomDocument(
    uri: vscode.Uri,
    _openContext: { backupId?: string },
    _token: vscode.CancellationToken
  ): Promise<RemoteDirectory> {
    return RemoteDirectory.build(uri);
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

import * as vscode from 'vscode';
import { Client } from 'ssh2';

class AbortRemoteConnection extends Error { }

export class RemoteProxy {
  uri = vscode.Uri.from({ scheme: 'untitled' });
  public readonly sshClient: Client;

  private constructor(
    private sshClientConfig: Object
  ) {
    this.sshClient = new Client();
    this.sshClient.connect(this.sshClientConfig);
  }

  static async build(): Promise<RemoteProxy> {
    return vscode.window.showInputBox({ placeHolder: 'username@example.com' })
      .then((sshString) => {
        if (sshString === undefined) {
          throw new AbortRemoteConnection("No ssh string provided");
        }
        else {
          const sshClientConfig = {};
          return Reflect.construct(this.constructor, [sshClientConfig]);
        }
      });
  }

  async clone(): Promise<RemoteProxy> {
    return Reflect.construct(this.constructor, [this.sshClientConfig]);
  }
}

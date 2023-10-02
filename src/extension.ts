import * as vscode from 'vscode';
import { RemoteDirectoryExplorer } from './remoteDirectoryExplorer';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(RemoteDirectoryExplorer.register());
}

import * as vscode from 'vscode';
import { RemoteProxy } from './remoteProxy';

export class MissingOriginResource extends Error { }

export class RemoteResource extends vscode.Disposable implements vscode.CustomDocument {
  private static openedResources: Record<string, RemoteResource> = {};

  constructor(
    public uri: vscode.Uri,
    public readonly uuid: string,
    public remoteProxy: RemoteProxy
  ) {
    const openedResources = RemoteResource.openedResources;

    super(() => {
      if (uuid in openedResources) {
        delete openedResources[uuid];
      }
    });

    openedResources[uuid] = this;
  }

  static async build<DerivedClass extends RemoteResource>(uri: vscode.Uri, type: new (uri: vscode.Uri, uuid: string, remoteProxy: RemoteProxy) => DerivedClass): Promise<DerivedClass> {
    const [originUuid, destinationUuid] = uri.path.split('/');
    const makeRemoteResource = (remoteProxy: RemoteProxy) => new type(uri, destinationUuid, remoteProxy);

    if (originUuid === '*') {
      return RemoteProxy
        .build()
        .then(makeRemoteResource);
    }
    else {
      const originRemoteDirectory = this.openedResources[originUuid];

      if (originRemoteDirectory === undefined) {
        throw new MissingOriginResource('Requested directory with uuid ' + originUuid);
      }

      return originRemoteDirectory
        .remoteProxy
        .clone()
        .then(makeRemoteResource)
    }
  }
}

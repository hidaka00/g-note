import * as vscode from 'vscode';
import { GlobalFolderManager } from './globalFolderManager';
import { GloboNoteTreeDataProvider } from './treeDataProvider';
import { GloboNoteTreeItem } from './treeItem';
import * as fileOps from './fileOperations';
import { initLogger, log, dispose as disposeLogger } from './utils/logger';

let folderManager: GlobalFolderManager;
let treeDataProvider: GloboNoteTreeDataProvider;

/**
 * Activate the extension
 */
export function activate(context: vscode.ExtensionContext): void {
  // Initialize logger
  const outputChannel = initLogger();
  context.subscriptions.push(outputChannel);

  log('G-Note extension activating...');

  // Initialize folder manager
  folderManager = new GlobalFolderManager(context);
  context.subscriptions.push({ dispose: () => folderManager.dispose() });

  // Initialize tree data provider
  treeDataProvider = new GloboNoteTreeDataProvider(folderManager);
  context.subscriptions.push({ dispose: () => treeDataProvider.dispose() });

  // Register tree view
  const treeView = vscode.window.createTreeView('globoNote.globalFolders', {
    treeDataProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Register commands
  registerCommands(context);

  log('G-Note extension activated');
}

/**
 * Register all commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
  // Add folder command
  context.subscriptions.push(
    vscode.commands.registerCommand('globoNote.addFolder', async () => {
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Add Folder',
      });

      if (uris && uris.length > 0) {
        const added = await folderManager.addFolder(uris[0]);
        if (added) {
          vscode.window.showInformationMessage(`Added folder: ${uris[0].fsPath}`);
        }
      }
    })
  );

  // Remove folder command
  context.subscriptions.push(
    vscode.commands.registerCommand('globoNote.removeFolder', async (item: GloboNoteTreeItem) => {
      if (item && item.nodeType === 'root') {
        const removed = await folderManager.removeFolder(item.resourceUri);
        if (removed) {
          vscode.window.showInformationMessage(`Removed folder from list`);
        }
      }
    })
  );

  // New file command
  context.subscriptions.push(
    vscode.commands.registerCommand('globoNote.newFile', async (item: GloboNoteTreeItem) => {
      if (item) {
        const created = await fileOps.createFile(item.resourceUri);
        if (created) {
          treeDataProvider.refresh(item);
        }
      }
    })
  );

  // New folder command
  context.subscriptions.push(
    vscode.commands.registerCommand('globoNote.newFolder', async (item: GloboNoteTreeItem) => {
      if (item) {
        const created = await fileOps.createFolder(item.resourceUri);
        if (created) {
          treeDataProvider.refresh(item);
        }
      }
    })
  );

  // Rename command
  context.subscriptions.push(
    vscode.commands.registerCommand('globoNote.rename', async (item: GloboNoteTreeItem) => {
      if (item && (item.nodeType === 'directory' || item.nodeType === 'file')) {
        const renamed = await fileOps.rename(item.resourceUri);
        if (renamed) {
          // Refresh parent
          treeDataProvider.refresh();
        }
      }
    })
  );

  // Delete command
  context.subscriptions.push(
    vscode.commands.registerCommand('globoNote.delete', async (item: GloboNoteTreeItem) => {
      if (item && (item.nodeType === 'directory' || item.nodeType === 'file')) {
        const deleted = await fileOps.deleteItem(item.resourceUri);
        if (deleted) {
          treeDataProvider.refresh();
        }
      }
    })
  );

  // Open file command
  context.subscriptions.push(
    vscode.commands.registerCommand('globoNote.openFile', async (item: GloboNoteTreeItem) => {
      if (item && item.nodeType === 'file') {
        await fileOps.openFile(item.resourceUri);
      }
    })
  );

  // Open in OS command
  context.subscriptions.push(
    vscode.commands.registerCommand('globoNote.openInOS', async (item: GloboNoteTreeItem) => {
      if (item) {
        await fileOps.openInOS(item.resourceUri);
      }
    })
  );

  // Refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('globoNote.refresh', (item?: GloboNoteTreeItem) => {
      treeDataProvider.refresh(item);
    })
  );

  log('All commands registered');
}

/**
 * Deactivate the extension
 */
export function deactivate(): void {
  log('G-Note extension deactivating...');
  disposeLogger();
}

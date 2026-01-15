import * as vscode from 'vscode';
import { GlobalFolderManager } from './globalFolderManager';
import { GloboNoteTreeItem } from './treeItem';
import { log, warn, error } from './utils/logger';

/**
 * Tree data provider for the Global Folders view
 */
export class GloboNoteTreeDataProvider implements vscode.TreeDataProvider<GloboNoteTreeItem> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<
    GloboNoteTreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  private readonly folderManager: GlobalFolderManager;

  constructor(folderManager: GlobalFolderManager) {
    this.folderManager = folderManager;

    // Subscribe to folder changes
    folderManager.onDidChangeFolders(() => {
      this.refresh();
    });
  }

  /**
   * Refresh the tree view
   */
  refresh(element?: GloboNoteTreeItem): void {
    log('Refreshing tree view', element ? element.label : 'all');
    this.onDidChangeTreeDataEmitter.fire(element);
  }

  /**
   * Get tree item representation
   */
  getTreeItem(element: GloboNoteTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children for a tree item
   */
  async getChildren(element?: GloboNoteTreeItem): Promise<GloboNoteTreeItem[]> {
    if (!element) {
      // Return root folders
      return this.getRootFolders();
    }

    // Return children of the folder/directory
    return this.getDirectoryContents(element.resourceUri);
  }

  /**
   * Get parent for a tree item
   */
  getParent(element: GloboNoteTreeItem): vscode.ProviderResult<GloboNoteTreeItem> {
    // Not implemented for now - needed for reveal functionality
    return null;
  }

  /**
   * Get all registered root folders
   */
  private getRootFolders(): GloboNoteTreeItem[] {
    const folders = this.folderManager.getFolders();
    return folders.map((folder) => GloboNoteTreeItem.createRoot(folder.label, folder.uri));
  }

  /**
   * Get contents of a directory
   */
  private async getDirectoryContents(uri: vscode.Uri): Promise<GloboNoteTreeItem[]> {
    try {
      const entries = await vscode.workspace.fs.readDirectory(uri);

      // Sort entries: directories first, then files, both alphabetically
      entries.sort((a, b) => {
        const typeA = a[1];
        const typeB = b[1];

        // Directories before files
        if (typeA === vscode.FileType.Directory && typeB !== vscode.FileType.Directory) {
          return -1;
        }
        if (typeA !== vscode.FileType.Directory && typeB === vscode.FileType.Directory) {
          return 1;
        }

        // Alphabetical sort (case-insensitive)
        return a[0].toLowerCase().localeCompare(b[0].toLowerCase());
      });

      const items: GloboNoteTreeItem[] = [];

      for (const [name, type] of entries) {
        const childUri = vscode.Uri.joinPath(uri, name);

        if (type === vscode.FileType.Directory) {
          items.push(GloboNoteTreeItem.createDirectory(name, childUri));
        } else if (type === vscode.FileType.File) {
          items.push(GloboNoteTreeItem.createFile(name, childUri));
        }
        // Skip symbolic links and unknown types for now
      }

      return items;
    } catch (err) {
      if (err instanceof vscode.FileSystemError) {
        if (err.code === 'FileNotFound') {
          warn(`Directory not found: ${uri.fsPath}`);
          vscode.window.showWarningMessage(`Folder not found: ${uri.fsPath}`);
        } else if (err.code === 'NoPermissions') {
          warn(`Permission denied: ${uri.fsPath}`);
          vscode.window.showWarningMessage(`Permission denied: ${uri.fsPath}`);
        }
      } else {
        error(`Failed to read directory: ${uri.fsPath}`, err);
      }
      return [];
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.onDidChangeTreeDataEmitter.dispose();
  }
}

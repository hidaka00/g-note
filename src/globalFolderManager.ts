import * as vscode from 'vscode';
import { FolderEntry, STORAGE_KEYS, CURRENT_SCHEMA_VERSION } from './types';
import { log, warn, error } from './utils/logger';

/**
 * Manages global folder registration and persistence
 */
export class GlobalFolderManager {
  private folders: FolderEntry[] = [];
  private readonly context: vscode.ExtensionContext;
  private readonly onDidChangeFoldersEmitter = new vscode.EventEmitter<void>();

  /**
   * Event fired when the folder list changes
   */
  readonly onDidChangeFolders = this.onDidChangeFoldersEmitter.event;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadFolders();
  }

  /**
   * Load folders from globalState
   */
  private loadFolders(): void {
    try {
      const storedUris = this.context.globalState.get<string[]>(STORAGE_KEYS.FOLDERS, []);
      const schemaVersion = this.context.globalState.get<number>(
        STORAGE_KEYS.SCHEMA_VERSION,
        CURRENT_SCHEMA_VERSION
      );

      log(`Loading folders: ${storedUris.length} entries, schema version: ${schemaVersion}`);

      this.folders = storedUris.map((uriString) => {
        const uri = vscode.Uri.parse(uriString);
        return {
          uri,
          label: this.extractLabel(uri),
        };
      });
    } catch (err) {
      error('Failed to load folders', err);
      this.folders = [];
    }
  }

  /**
   * Save folders to globalState
   */
  private async saveFolders(): Promise<void> {
    try {
      const uriStrings = this.folders.map((f) => f.uri.toString());
      await this.context.globalState.update(STORAGE_KEYS.FOLDERS, uriStrings);
      await this.context.globalState.update(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
      log(`Saved ${uriStrings.length} folders`);
    } catch (err) {
      error('Failed to save folders', err);
      throw err;
    }
  }

  /**
   * Extract folder label from URI
   */
  private extractLabel(uri: vscode.Uri): string {
    const segments = uri.path.split('/');
    return segments[segments.length - 1] || uri.path;
  }

  /**
   * Get all registered folders
   */
  getFolders(): FolderEntry[] {
    return [...this.folders];
  }

  /**
   * Add a folder to the list
   */
  async addFolder(uri: vscode.Uri): Promise<boolean> {
    // Check if folder already exists
    const exists = this.folders.some((f) => f.uri.toString() === uri.toString());
    if (exists) {
      warn(`Folder already registered: ${uri.fsPath}`);
      vscode.window.showInformationMessage('This folder is already registered.');
      return false;
    }

    // Verify the folder exists on disk
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      if (stat.type !== vscode.FileType.Directory) {
        vscode.window.showErrorMessage('Selected path is not a directory.');
        return false;
      }
    } catch (err) {
      error('Folder does not exist or cannot be accessed', err);
      vscode.window.showErrorMessage('Folder does not exist or cannot be accessed.');
      return false;
    }

    const entry: FolderEntry = {
      uri,
      label: this.extractLabel(uri),
    };

    this.folders.push(entry);
    await this.saveFolders();
    this.onDidChangeFoldersEmitter.fire();

    log(`Added folder: ${uri.fsPath}`);
    return true;
  }

  /**
   * Remove a folder from the list
   */
  async removeFolder(uri: vscode.Uri): Promise<boolean> {
    const index = this.folders.findIndex((f) => f.uri.toString() === uri.toString());
    if (index === -1) {
      warn(`Folder not found for removal: ${uri.fsPath}`);
      return false;
    }

    this.folders.splice(index, 1);
    await this.saveFolders();
    this.onDidChangeFoldersEmitter.fire();

    log(`Removed folder: ${uri.fsPath}`);
    return true;
  }

  /**
   * Check if a folder is registered
   */
  hasFolder(uri: vscode.Uri): boolean {
    return this.folders.some((f) => f.uri.toString() === uri.toString());
  }

  /**
   * Find the root folder for a given URI
   */
  findRootFolder(uri: vscode.Uri): FolderEntry | undefined {
    const uriPath = uri.toString();
    return this.folders.find((f) => uriPath.startsWith(f.uri.toString()));
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.onDidChangeFoldersEmitter.dispose();
  }
}

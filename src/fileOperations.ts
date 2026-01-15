import * as vscode from 'vscode';
import { isValidFileName, checkCollision } from './utils/pathValidator';
import { log, warn, error } from './utils/logger';

/**
 * Create a new file in the specified directory
 */
export async function createFile(parentUri: vscode.Uri): Promise<vscode.Uri | undefined> {
  // Prompt for file name
  const name = await vscode.window.showInputBox({
    prompt: 'Enter file name',
    placeHolder: 'filename.txt',
    validateInput: (value) => {
      const result = isValidFileName(value);
      return result.valid ? null : result.message;
    },
  });

  if (!name) {
    return undefined;
  }

  // Check for collision
  const collision = await checkCollision(parentUri, name);
  if (collision.exists) {
    const overwrite = await vscode.window.showWarningMessage(
      `File "${name}" already exists. Overwrite?`,
      { modal: true },
      'Overwrite',
      'Cancel'
    );

    if (overwrite !== 'Overwrite') {
      return undefined;
    }
  }

  try {
    const fileUri = vscode.Uri.joinPath(parentUri, name);
    await vscode.workspace.fs.writeFile(fileUri, new Uint8Array());
    log(`Created file: ${fileUri.fsPath}`);

    // Open the file in editor
    const doc = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(doc);

    return fileUri;
  } catch (err) {
    error('Failed to create file', err);
    vscode.window.showErrorMessage(`Failed to create file: ${err instanceof Error ? err.message : String(err)}`);
    return undefined;
  }
}

/**
 * Create a new folder in the specified directory
 */
export async function createFolder(parentUri: vscode.Uri): Promise<vscode.Uri | undefined> {
  // Prompt for folder name
  const name = await vscode.window.showInputBox({
    prompt: 'Enter folder name',
    placeHolder: 'New Folder',
    validateInput: (value) => {
      const result = isValidFileName(value);
      return result.valid ? null : result.message;
    },
  });

  if (!name) {
    return undefined;
  }

  // Check for collision
  const collision = await checkCollision(parentUri, name);
  if (collision.exists) {
    vscode.window.showErrorMessage(`Folder "${name}" already exists.`);
    return undefined;
  }

  try {
    const folderUri = vscode.Uri.joinPath(parentUri, name);
    await vscode.workspace.fs.createDirectory(folderUri);
    log(`Created folder: ${folderUri.fsPath}`);
    return folderUri;
  } catch (err) {
    error('Failed to create folder', err);
    vscode.window.showErrorMessage(`Failed to create folder: ${err instanceof Error ? err.message : String(err)}`);
    return undefined;
  }
}

/**
 * Rename a file or folder
 */
export async function rename(uri: vscode.Uri): Promise<vscode.Uri | undefined> {
  const oldName = uri.path.split('/').pop() || '';

  // Prompt for new name
  const newName = await vscode.window.showInputBox({
    prompt: 'Enter new name',
    value: oldName,
    valueSelection: [0, oldName.lastIndexOf('.') > 0 ? oldName.lastIndexOf('.') : oldName.length],
    validateInput: (value) => {
      if (value === oldName) {
        return 'Name is unchanged';
      }
      const result = isValidFileName(value);
      return result.valid ? null : result.message;
    },
  });

  if (!newName || newName === oldName) {
    return undefined;
  }

  const parentUri = vscode.Uri.joinPath(uri, '..');

  // Check for collision
  const collision = await checkCollision(parentUri, newName);
  if (collision.exists) {
    vscode.window.showErrorMessage(`"${newName}" already exists.`);
    return undefined;
  }

  try {
    const newUri = vscode.Uri.joinPath(parentUri, newName);
    await vscode.workspace.fs.rename(uri, newUri);
    log(`Renamed: ${uri.fsPath} -> ${newUri.fsPath}`);
    return newUri;
  } catch (err) {
    error('Failed to rename', err);
    vscode.window.showErrorMessage(`Failed to rename: ${err instanceof Error ? err.message : String(err)}`);
    return undefined;
  }
}

/**
 * Delete a file or folder with confirmation
 */
export async function deleteItem(uri: vscode.Uri): Promise<boolean> {
  const name = uri.path.split('/').pop() || '';

  // Check if it's a directory
  let isDirectory = false;
  try {
    const stat = await vscode.workspace.fs.stat(uri);
    isDirectory = stat.type === vscode.FileType.Directory;
  } catch {
    warn(`Could not stat item for deletion: ${uri.fsPath}`);
  }

  const itemType = isDirectory ? 'folder' : 'file';
  const warningMessage = isDirectory
    ? `Are you sure you want to delete the folder "${name}" and all its contents?`
    : `Are you sure you want to delete "${name}"?`;

  // Show confirmation dialog
  const confirm = await vscode.window.showWarningMessage(
    warningMessage,
    { modal: true },
    'Delete',
    'Cancel'
  );

  if (confirm !== 'Delete') {
    return false;
  }

  try {
    await vscode.workspace.fs.delete(uri, { recursive: true, useTrash: true });
    log(`Deleted ${itemType}: ${uri.fsPath}`);
    vscode.window.showInformationMessage(`Deleted "${name}"`);
    return true;
  } catch (err) {
    error(`Failed to delete ${itemType}`, err);
    vscode.window.showErrorMessage(`Failed to delete: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

/**
 * Open a file in the editor
 */
export async function openFile(uri: vscode.Uri): Promise<void> {
  try {
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);
    log(`Opened file: ${uri.fsPath}`);
  } catch (err) {
    error('Failed to open file', err);
    vscode.window.showErrorMessage(`Failed to open file: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Reveal file or folder in OS file explorer
 */
export async function openInOS(uri: vscode.Uri): Promise<void> {
  try {
    // Check if it's a file or directory
    const stat = await vscode.workspace.fs.stat(uri);

    if (stat.type === vscode.FileType.File) {
      // Reveal file in explorer (selects the file)
      await vscode.commands.executeCommand('revealFileInOS', uri);
    } else {
      // Open folder in explorer
      await vscode.env.openExternal(uri);
    }
    log(`Revealed in OS: ${uri.fsPath}`);
  } catch (err) {
    error('Failed to reveal in OS', err);
    vscode.window.showErrorMessage(`Failed to reveal in file explorer: ${err instanceof Error ? err.message : String(err)}`);
  }
}

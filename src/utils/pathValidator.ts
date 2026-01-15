import * as vscode from 'vscode';
import * as path from 'path';
import { error } from './logger';

/**
 * Reserved characters for Windows file names
 */
const WINDOWS_RESERVED_CHARS = /[<>:"/\\|?*]/;

/**
 * Reserved file names for Windows
 */
const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;

/**
 * Validate file/folder name based on OS
 */
export function isValidFileName(name: string): { valid: boolean; message?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Name cannot be empty' };
  }

  const trimmedName = name.trim();

  // Check for leading/trailing dots or spaces (problematic on Windows)
  if (trimmedName.startsWith('.') && trimmedName.length === 1) {
    return { valid: false, message: 'Name cannot be just a dot' };
  }

  if (trimmedName.endsWith(' ') || trimmedName.endsWith('.')) {
    return { valid: false, message: 'Name cannot end with space or dot' };
  }

  // Check for reserved characters (Windows)
  if (process.platform === 'win32') {
    if (WINDOWS_RESERVED_CHARS.test(trimmedName)) {
      return { valid: false, message: 'Name contains invalid characters: < > : " / \\ | ? *' };
    }

    // Check for reserved names
    const baseName = path.parse(trimmedName).name;
    if (WINDOWS_RESERVED_NAMES.test(baseName)) {
      return { valid: false, message: `"${baseName}" is a reserved name on Windows` };
    }
  }

  // Check for forward slash (invalid on all platforms for file names)
  if (trimmedName.includes('/')) {
    return { valid: false, message: 'Name cannot contain /' };
  }

  // Check for null bytes
  if (trimmedName.includes('\0')) {
    return { valid: false, message: 'Name cannot contain null characters' };
  }

  // Check max length (255 is common limit)
  if (trimmedName.length > 255) {
    return { valid: false, message: 'Name is too long (max 255 characters)' };
  }

  return { valid: true };
}

/**
 * Check if a file/folder already exists at the target path
 */
export async function checkCollision(
  parentUri: vscode.Uri,
  name: string
): Promise<{ exists: boolean; uri: vscode.Uri }> {
  const targetUri = vscode.Uri.joinPath(parentUri, name);

  try {
    await vscode.workspace.fs.stat(targetUri);
    return { exists: true, uri: targetUri };
  } catch (err) {
    if (err instanceof vscode.FileSystemError && err.code === 'FileNotFound') {
      return { exists: false, uri: targetUri };
    }
    error('Error checking file existence', err);
    return { exists: false, uri: targetUri };
  }
}

/**
 * Generate a unique name by appending a number suffix
 */
export async function generateUniqueName(
  parentUri: vscode.Uri,
  baseName: string
): Promise<string> {
  const ext = path.extname(baseName);
  const nameWithoutExt = ext ? baseName.slice(0, -ext.length) : baseName;

  let candidate = baseName;
  let counter = 1;

  while ((await checkCollision(parentUri, candidate)).exists) {
    candidate = ext ? `${nameWithoutExt} (${counter})${ext}` : `${nameWithoutExt} (${counter})`;
    counter++;

    // Safety limit to prevent infinite loops
    if (counter > 100) {
      throw new Error('Could not generate unique name after 100 attempts');
    }
  }

  return candidate;
}

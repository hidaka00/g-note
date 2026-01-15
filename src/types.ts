import * as vscode from 'vscode';

/**
 * Node types in the tree view
 */
export type NodeType = 'root' | 'directory' | 'file';

/**
 * Registered folder entry
 */
export interface FolderEntry {
  uri: vscode.Uri;
  label: string;
}

/**
 * Storage keys for globalState
 */
export const STORAGE_KEYS = {
  FOLDERS: 'globoNote.folders',
  SCHEMA_VERSION: 'globoNote.schemaVersion',
} as const;

/**
 * Current schema version for migration support
 */
export const CURRENT_SCHEMA_VERSION = 1;

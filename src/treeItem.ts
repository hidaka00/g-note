import * as vscode from 'vscode';
import * as path from 'path';
import { NodeType } from './types';

/**
 * Tree item representing a folder, directory, or file in the tree view
 */
export class GloboNoteTreeItem extends vscode.TreeItem {
  readonly nodeType: NodeType;
  readonly resourceUri: vscode.Uri;

  constructor(
    label: string,
    resourceUri: vscode.Uri,
    nodeType: NodeType,
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);

    this.nodeType = nodeType;
    this.resourceUri = resourceUri;
    this.contextValue = nodeType;
    this.tooltip = resourceUri.fsPath;

    // Set icon based on node type
    this.iconPath = this.getIcon();

    // Set command for file items
    if (nodeType === 'file') {
      this.command = {
        command: 'globoNote.openFile',
        title: 'Open File',
        arguments: [this],
      };
    }
  }

  /**
   * Get the appropriate icon for this item
   */
  private getIcon(): vscode.ThemeIcon {
    switch (this.nodeType) {
      case 'root':
        return new vscode.ThemeIcon('folder-library');
      case 'directory':
        return vscode.ThemeIcon.Folder;
      case 'file':
        return this.getFileIcon();
      default:
        return vscode.ThemeIcon.File;
    }
  }

  /**
   * Get file-specific icon based on extension
   */
  private getFileIcon(): vscode.ThemeIcon {
    const ext = path.extname(this.label as string).toLowerCase();

    // Map common extensions to icons
    const iconMap: Record<string, string> = {
      '.md': 'markdown',
      '.json': 'json',
      '.js': 'symbol-method',
      '.ts': 'symbol-method',
      '.html': 'symbol-misc',
      '.css': 'symbol-color',
      '.py': 'symbol-method',
      '.txt': 'file-text',
      '.log': 'output',
      '.yml': 'symbol-namespace',
      '.yaml': 'symbol-namespace',
      '.xml': 'symbol-structure',
      '.png': 'file-media',
      '.jpg': 'file-media',
      '.jpeg': 'file-media',
      '.gif': 'file-media',
      '.svg': 'file-media',
      '.pdf': 'file-pdf',
    };

    const iconName = iconMap[ext];
    return iconName ? new vscode.ThemeIcon(iconName) : vscode.ThemeIcon.File;
  }

  /**
   * Create a root folder tree item
   */
  static createRoot(label: string, uri: vscode.Uri): GloboNoteTreeItem {
    return new GloboNoteTreeItem(label, uri, 'root', vscode.TreeItemCollapsibleState.Collapsed);
  }

  /**
   * Create a directory tree item
   */
  static createDirectory(name: string, uri: vscode.Uri): GloboNoteTreeItem {
    return new GloboNoteTreeItem(name, uri, 'directory', vscode.TreeItemCollapsibleState.Collapsed);
  }

  /**
   * Create a file tree item
   */
  static createFile(name: string, uri: vscode.Uri): GloboNoteTreeItem {
    return new GloboNoteTreeItem(name, uri, 'file', vscode.TreeItemCollapsibleState.None);
  }
}

import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel | undefined;

/**
 * Initialize the output channel
 */
export function initLogger(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('G-Note');
  }
  return outputChannel;
}

/**
 * Get timestamp string for logging
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Log info message
 */
export function log(message: string, ...args: unknown[]): void {
  const formatted = args.length > 0 ? `${message} ${JSON.stringify(args)}` : message;
  outputChannel?.appendLine(`[${getTimestamp()}] [INFO] ${formatted}`);
}

/**
 * Log warning message
 */
export function warn(message: string, ...args: unknown[]): void {
  const formatted = args.length > 0 ? `${message} ${JSON.stringify(args)}` : message;
  outputChannel?.appendLine(`[${getTimestamp()}] [WARN] ${formatted}`);
}

/**
 * Log error message
 */
export function error(message: string, err?: unknown): void {
  let errMessage = message;
  if (err instanceof Error) {
    errMessage += `: ${err.message}`;
  } else if (err) {
    errMessage += `: ${String(err)}`;
  }
  outputChannel?.appendLine(`[${getTimestamp()}] [ERROR] ${errMessage}`);
}

/**
 * Show the output channel
 */
export function show(): void {
  outputChannel?.show();
}

/**
 * Dispose the output channel
 */
export function dispose(): void {
  outputChannel?.dispose();
  outputChannel = undefined;
}

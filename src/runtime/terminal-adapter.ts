/**
 * Terminal Node Runtime Adapter
 * 
 * Handles terminal command execution and state management.
 * Integrates with pluresDB for state synchronization.
 */

import type { TerminalNodeProps } from '../core/schema/types.js';

/**
 * Terminal command execution result
 */
export interface TerminalExecutionResult {
  /** Command that was executed */
  command: string;
  /** Output from the command */
  output: string;
  /** Exit code (0 for success) */
  exitCode: number;
  /** Execution timestamp */
  timestamp: number;
  /** Error message if execution failed */
  error?: string;
}

/**
 * Terminal node state
 */
export interface TerminalNodeState extends TerminalNodeProps {
  /** Node identifier */
  nodeId: string;
  /** Current working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Terminal adapter options
 */
export interface TerminalAdapterOptions {
  /** Node identifier */
  nodeId: string;
  /** Initial props */
  props?: Partial<TerminalNodeProps>;
  /** PluresDB path for input binding */
  inputPath?: string;
  /** PluresDB path for output binding */
  outputPath?: string;
}

/**
 * Terminal Runtime Adapter
 * 
 * Manages terminal node execution and state.
 * 
 * Note: PluresDB input/output path bindings will be implemented
 * when pluresDB integration is complete.
 */
export class TerminalAdapter {
  private state: TerminalNodeState;
  private outputPath?: string;

  constructor(options: TerminalAdapterOptions) {
    this.state = {
      nodeId: options.nodeId,
      inputMode: options.props?.inputMode || 'text',
      history: options.props?.history || [],
      lastOutput: options.props?.lastOutput || null,
    };
    // Store paths for future pluresDB integration
    // this._inputPath = options.inputPath;
    this.outputPath = options.outputPath;
  }

  /**
   * Execute a terminal command
   * 
   * @param command - Command to execute
   * @returns Execution result
   */
  async executeCommand(command: string): Promise<TerminalExecutionResult> {
    // Add to history
    this.state.history.push(command);

    // TODO: Integrate with RuneBook execution model
    // For now, return a stubbed response
    const result: TerminalExecutionResult = {
      command,
      output: `[Stub] Command received: ${command}\nIntegration with RuneBook pending.`,
      exitCode: 0,
      timestamp: Date.now(),
    };

    // Update last output
    this.state.lastOutput = result.output;

    // TODO: Sync to pluresDB output path when integration is available
    if (this.outputPath) {
      await this.syncToPluresDB(this.outputPath, result);
    }

    return result;
  }

  /**
   * Get current terminal state
   */
  getState(): Readonly<TerminalNodeState> {
    return { ...this.state };
  }

  /**
   * Update terminal props
   */
  updateProps(props: Partial<TerminalNodeProps>): void {
    this.state = {
      ...this.state,
      ...props,
    };
  }

  /**
   * Clear command history
   */
  clearHistory(): void {
    this.state.history = [];
  }

  /**
   * Get command history
   */
  getHistory(): ReadonlyArray<string> {
    return [...this.state.history];
  }

  /**
   * Sync state to pluresDB (placeholder)
   * 
   * @param path - PluresDB path
   * @param data - Data to sync
   */
  private async syncToPluresDB(path: string, data: unknown): Promise<void> {
    // TODO: Implement pluresDB sync when integration is available
    console.debug(`[TerminalAdapter] Would sync to pluresDB path: ${path}`, data);
  }
}

/**
 * Create a terminal adapter instance
 * 
 * @param options - Terminal adapter options
 * @returns Terminal adapter instance
 */
export function createTerminalAdapter(
  options: TerminalAdapterOptions
): TerminalAdapter {
  return new TerminalAdapter(options);
}

/**
 * Run a terminal command (convenience function)
 * 
 * @param nodeId - Terminal node identifier
 * @param command - Command to execute
 * @returns Execution result
 */
export async function runTerminalCommand(
  nodeId: string,
  command: string
): Promise<TerminalExecutionResult> {
  const adapter = createTerminalAdapter({ nodeId });
  return adapter.executeCommand(command);
}

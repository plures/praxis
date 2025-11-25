/**
 * Praxis File Watcher
 * 
 * Watches PSF schema files and source files for changes,
 * triggering regeneration and sync operations.
 */

import { watch, FSWatcher } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';

/**
 * Watcher options
 */
export interface WatcherOptions {
  /** Root directory to watch */
  rootDir: string;
  /** File patterns to watch */
  patterns?: string[];
  /** Ignore patterns */
  ignore?: string[];
  /** Debounce delay in ms */
  debounce?: number;
  /** Watch recursively */
  recursive?: boolean;
}

/**
 * Watcher event
 */
export interface WatcherEvent {
  /** Event type */
  type: 'change' | 'add' | 'remove';
  /** File path */
  path: string;
  /** File extension */
  extension: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * File Watcher class
 * 
 * Watches for file changes and triggers callbacks.
 */
export class FileWatcher {
  private options: Required<WatcherOptions>;
  private watchers: FSWatcher[] = [];
  private subscribers: Set<(event: WatcherEvent) => void> = new Set();
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(options: WatcherOptions) {
    this.options = {
      patterns: options.patterns || ['**/*.ts', '**/*.json', '**/*.yaml', '**/*.yml'],
      ignore: options.ignore || ['node_modules', 'dist', '.git'],
      debounce: options.debounce ?? 100,
      recursive: options.recursive ?? true,
      rootDir: resolve(options.rootDir),
    };
  }

  /**
   * Start watching
   */
  async start(): Promise<void> {
    try {
      const watcher = watch(
        this.options.rootDir,
        { recursive: this.options.recursive },
        (eventType, filename) => {
          if (filename && this.shouldProcess(filename)) {
            this.handleChange(eventType as 'change' | 'rename', filename);
          }
        }
      );

      this.watchers.push(watcher);
    } catch (error) {
      console.error('Failed to start watcher:', error);
      throw error;
    }
  }

  /**
   * Stop watching
   */
  stop(): void {
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];

    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  /**
   * Subscribe to file changes
   */
  subscribe(callback: (event: WatcherEvent) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Watched file extensions (O(1) lookup)
   */
  private static readonly WATCHED_EXTENSIONS = new Set(['.ts', '.js', '.json', '.yaml', '.yml', '.svelte']);

  /**
   * Check if file should be processed
   */
  private shouldProcess(filename: string): boolean {
    // Check ignore patterns
    for (const ignore of this.options.ignore) {
      if (filename.includes(ignore)) {
        return false;
      }
    }

    // Check file extension
    const ext = extname(filename).toLowerCase();
    return FileWatcher.WATCHED_EXTENSIONS.has(ext);
  }

  /**
   * Handle file change
   */
  private handleChange(eventType: 'change' | 'rename', filename: string): void {
    const fullPath = join(this.options.rootDir, filename);

    // Debounce rapid changes
    const existingTimer = this.debounceTimers.get(fullPath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      this.debounceTimers.delete(fullPath);

      let type: WatcherEvent['type'] = 'change';

      if (eventType === 'rename') {
        // Check if file exists to determine add vs remove
        try {
          await stat(fullPath);
          type = 'add';
        } catch {
          type = 'remove';
        }
      }

      const event: WatcherEvent = {
        type,
        path: fullPath,
        extension: extname(filename).toLowerCase(),
        timestamp: Date.now(),
      };

      this.notify(event);
    }, this.options.debounce);

    this.debounceTimers.set(fullPath, timer);
  }

  /**
   * Notify all subscribers
   */
  private notify(event: WatcherEvent): void {
    for (const callback of this.subscribers) {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in watcher subscriber:', error);
      }
    }
  }
}

/**
 * PSF Schema Watcher
 * 
 * Specialized watcher for PSF schema files.
 */
export class PSFSchemaWatcher extends FileWatcher {
  private schemaCallbacks: Set<(path: string) => void> = new Set();
  private codeCallbacks: Set<(path: string) => void> = new Set();

  constructor(rootDir: string) {
    super({
      rootDir,
      patterns: ['**/*.psf.json', '**/*.psf.yaml', '**/*.schema.json', '**/*.ts'],
      ignore: ['node_modules', 'dist', '.git', 'generated'],
    });

    // Subscribe to general changes and route appropriately
    this.subscribe((event) => {
      if (event.type === 'remove') return;

      if (this.isSchemaFile(event.path)) {
        this.notifySchemaChange(event.path);
      } else if (this.isCodeFile(event.path)) {
        this.notifyCodeChange(event.path);
      }
    });
  }

  /**
   * Subscribe to schema file changes
   */
  onSchemaChange(callback: (path: string) => void): () => void {
    this.schemaCallbacks.add(callback);
    return () => this.schemaCallbacks.delete(callback);
  }

  /**
   * Subscribe to code file changes
   */
  onCodeChange(callback: (path: string) => void): () => void {
    this.codeCallbacks.add(callback);
    return () => this.codeCallbacks.delete(callback);
  }

  private isSchemaFile(path: string): boolean {
    return (
      path.endsWith('.psf.json') ||
      path.endsWith('.psf.yaml') ||
      path.endsWith('.schema.json') ||
      path.endsWith('.schema.yaml')
    );
  }

  private isCodeFile(path: string): boolean {
    return path.endsWith('.ts') || path.endsWith('.js');
  }

  private notifySchemaChange(path: string): void {
    for (const callback of this.schemaCallbacks) {
      try {
        callback(path);
      } catch (error) {
        console.error('Error in schema change callback:', error);
      }
    }
  }

  private notifyCodeChange(path: string): void {
    for (const callback of this.codeCallbacks) {
      try {
        callback(path);
      } catch (error) {
        console.error('Error in code change callback:', error);
      }
    }
  }
}

/**
 * Create a file watcher
 */
export function createFileWatcher(options: WatcherOptions): FileWatcher {
  return new FileWatcher(options);
}

/**
 * Create a PSF schema watcher
 */
export function createPSFSchemaWatcher(rootDir: string): PSFSchemaWatcher {
  return new PSFSchemaWatcher(rootDir);
}

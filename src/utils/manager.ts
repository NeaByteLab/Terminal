import { randomUUID } from 'node:crypto'
import type * as Types from '@interfaces/index.ts'

/**
 * Process lifecycle manager.
 * @description Tracks and controls child processes.
 */
export class Manager {
  /** Active process registry */
  private static readonly processes = new Map<string, Types.ProcessInfo>()

  /**
   * Append output to process buffer.
   * @description Adds stdout or stderr data.
   * @param id - Process identifier
   * @param stdout - Stdout data
   * @param stderr - Stderr data
   */
  static appendOutput(id: string, stdout?: string, stderr?: string): void {
    const info = this.processes.get(id)
    if (!info) {
      return
    }
    if (stdout) {
      info.stdout += stdout
    }
    if (stderr) {
      info.stderr += stderr
    }
  }

  /** Generate unique process identifier */
  static generateProcessId(): string {
    return `term_${randomUUID().replace(/-/g, '')}`
  }

  /** Get all tracked processes */
  static getAllProcesses(): Types.ProcessInfo[] {
    return Array.from(this.processes.values())
  }

  /**
   * Get process by identifier.
   * @description Returns info or undefined.
   * @param id - Process identifier
   * @returns Process info
   */
  static getProcess(id: string): Types.ProcessInfo | undefined {
    return this.processes.get(id)
  }

  /**
   * Get exit code for process.
   * @description Returns code or null.
   * @param id - Process identifier
   * @returns Exit code
   */
  static getProcessExitCode(id: string): number | null {
    const info = this.processes.get(id)
    return info?.exitCode ?? null
  }

  /**
   * Get process list for display.
   * @description Returns public metadata.
   * @returns Process list items
   */
  static getProcessList(): Types.ProcessListItem[] {
    return Array.from(this.processes.values()).map((info) => ({
      id: info.id,
      command: info.command,
      args: info.args,
      pid: info.process.pid,
      startTime: info.startTime,
      background: info.background,
      running: info.exitCode === null && !info.process.killed
    }))
  }

  /**
   * Get captured output for process.
   * @description Returns stdout and stderr.
   * @param id - Process identifier
   * @returns Output streams
   */
  static getProcessOutput(id: string): Types.ProcessOutput {
    const info = this.processes.get(id)
    if (!info) {
      return { stdout: '', stderr: '' }
    }
    return {
      stdout: info.stdout,
      stderr: info.stderr
    }
  }

  /**
   * Check if process is running.
   * @description Returns running state.
   * @param id - Process identifier
   * @returns True if running
   */
  static isProcessRunning(id: string): boolean {
    const info = this.processes.get(id)
    if (!info) {
      return false
    }
    return info.exitCode === null && !info.process.killed
  }

  /** Kill all tracked processes */
  static killAllProcesses(): void {
    for (const id of this.processes.keys()) {
      this.killProcess(id)
    }
  }

  /**
   * Kill specific process.
   * @description Sends termination signals.
   * @param id - Process identifier
   * @param _recursive - Unused flag
   * @returns True if killed
   */
  static killProcess(id: string, _recursive = true): boolean {
    const info = this.processes.get(id)
    if (!info) {
      return false
    }
    const { process: childProcess, abortController } = info
    try {
      abortController.abort()
    } catch (_) {
      void _
    }
    let killed = false
    if (!childProcess.killed && childProcess.pid) {
      try {
        killed = childProcess.kill('SIGTERM')
        setTimeout(() => {
          if (!childProcess.killed) {
            childProcess.kill('SIGKILL')
          }
        }, 2000)
      } catch {
        killed = false
      }
    }
    return killed || childProcess.killed
  }

  /**
   * Register new process in tracking.
   * @description Stores process info.
   * @param info - Process info partial
   * @returns Assigned identifier
   */
  static registerProcess(info: Omit<Types.ProcessInfo, 'id'> & { id?: string }): string {
    const id = info.id || this.generateProcessId()
    const processInfo: Types.ProcessInfo = {
      ...info,
      id
    } as Types.ProcessInfo
    this.processes.set(id, processInfo)
    const { process: childProcess } = processInfo
    childProcess.on('exit', (code, signal) => {
      processInfo.exitCode = code
      processInfo.signal = signal
      if (processInfo.timeoutId) {
        clearTimeout(processInfo.timeoutId)
      }
      setTimeout(() => {
        this.processes.delete(id)
      }, 5000)
    })
    return id
  }

  /**
   * Set timeout for process.
   * @description Schedules automatic kill.
   * @param id - Process identifier
   * @param timeoutMs - Timeout milliseconds
   */
  static setProcessTimeout(id: string, timeoutMs: number): void {
    const info = this.processes.get(id)
    if (!info) {
      return
    }
    if (info.timeoutId) {
      clearTimeout(info.timeoutId)
    }
    info.timeoutId = setTimeout(() => {
      this.killProcess(id)
    }, timeoutMs)
  }
}

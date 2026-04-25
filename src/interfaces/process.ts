import type { ChildProcess } from 'node:child_process'

/**
 * Execution options for command.
 * @description Controls process behavior.
 */
export interface ExecuteOptions {
  /** Run in background */
  background?: boolean
  /** Working directory path */
  cwd?: string
  /** Timeout in milliseconds */
  timeout?: number
  /** Environment variables */
  env?: Record<string, string>
  /** Enable streaming output */
  stream?: boolean
  /** Stdout data callback */
  onStdout?: (data: string) => void
  /** Stderr data callback */
  onStderr?: (data: string) => void
  /** Exit event callback */
  onExit?: (code: number | null, signal: string | null) => void
}

/**
 * Execution result object.
 * @description Contains output and metadata.
 */
export interface ExecuteResult {
  /** Process identifier */
  id: string
  /** Exit code or null */
  exitCode: number | null
  /** Stdout content */
  stdout: string
  /** Stderr content */
  stderr: string
}

/**
 * Internal process tracking info.
 * @description Full process state storage.
 */
export interface ProcessInfo {
  /** Process identifier */
  id: string
  /** Executed command */
  command: string
  /** Command arguments */
  args: string[]
  /** Working directory */
  cwd: string
  /** Start timestamp */
  startTime: Date
  /** Background flag */
  background: boolean
  /** Exit code or null */
  exitCode: number | null
  /** Signal if terminated */
  signal: string | null
  /** Captured stdout */
  stdout: string
  /** Captured stderr */
  stderr: string
  /** Abort controller */
  abortController: AbortController
  /** Child process handle */
  process: ChildProcess
  /** Timeout handle */
  timeoutId?: ReturnType<typeof setTimeout>
}

/**
 * Process list entry.
 * @description Public process metadata.
 */
export interface ProcessListItem {
  /** Process identifier */
  id: string
  /** Executed command */
  command: string
  /** Command arguments */
  args: string[]
  /** Process ID or undefined */
  pid: number | undefined
  /** Start timestamp */
  startTime: Date
  /** Background flag */
  background: boolean
  /** Running state */
  running: boolean
}

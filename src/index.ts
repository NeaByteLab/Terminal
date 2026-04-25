import { spawn, type SpawnOptions } from 'node:child_process'
import type { Buffer } from 'node:buffer'
import type * as Types from '@interfaces/index.ts'
import * as Utils from '@utils/index.ts'

/**
 * Controlled command execution for agents.
 * @description Manages child processes with security validation.
 */
export class Terminal {
  /** Default configuration values for initialization */
  static readonly defaultConfig: Types.TerminalConfig = {
    workspaces: [],
    commands: {
      allow: [],
      deny: [],
      maxArgs: 10,
      strictArgs: true,
      noShell: true
    },
    env: {
      allow: ['NODE_ENV', 'PATH'],
      deny: ['HOME', 'SSH_*']
    },
    timeout: 30000
  }
  /** Runtime configuration state storage */
  private static config: Types.TerminalConfig = Terminal.defaultConfig

  /**
   * Execute command with validation.
   * @description Spawns process after security checks.
   * @param command - Shell command string
   * @param options - Execution options
   * @returns Process result with output
   * @throws Error when validation fails
   */
  static execute(
    command: string,
    options: Types.ExecuteOptions = {}
  ): Promise<Types.ExecuteResult> {
    const { background = false, cwd, timeout, env, stream, onStdout, onStderr, onExit } = options
    const { cmd, args } = this.parseCommand(command)
    if (!Utils.Validator.validateCommand(cmd, this.config.commands)) {
      throw new Error(`Command not allowed: ${cmd}`)
    }
    const argValidation = Utils.Validator.validateArguments(
      args,
      this.config.commands.maxArgs,
      this.config.commands.strictArgs
    )
    if (!argValidation.valid) {
      throw new Error(`Argument validation failed: ${argValidation.error}`)
    }
    const workspaceValidation = Utils.Validator.validateWorkspace(
      cwd || this.config.workspaces[0],
      this.config.workspaces
    )
    if (!workspaceValidation.valid) {
      throw new Error(`Workspace validation failed: ${workspaceValidation.error}`)
    }
    const envVars = env || {}
    const filteredEnv = Utils.Validator.filterEnvironment(
      envVars,
      this.config.env.allow,
      this.config.env.deny
    )
    const abortController = new AbortController()
    const spawnOptions: SpawnOptions = {
      cwd: workspaceValidation.resolvedPath,
      env: filteredEnv,
      shell: !this.config.commands.noShell,
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe']
    }
    const childProcess = spawn(cmd, args, spawnOptions)
    if (spawnOptions.signal) {
      spawnOptions.signal.addEventListener('abort', () => {
        childProcess.kill()
      })
    }
    let stdout = ''
    let stderr = ''
    childProcess.stdout?.on('data', (data: Buffer) => {
      const chunk = data.toString()
      if (stream && onStdout) {
        onStdout(chunk)
      }
      stdout += chunk
    })
    childProcess.stderr?.on('data', (data: Buffer) => {
      const chunk = data.toString()
      if (stream && onStderr) {
        onStderr(chunk)
      }
      stderr += chunk
    })
    const processId = Utils.Manager.registerProcess({
      command: cmd,
      args,
      cwd: workspaceValidation.resolvedPath || '',
      startTime: new Date(),
      background,
      exitCode: null,
      signal: null,
      stdout,
      stderr,
      abortController,
      process: childProcess
    })
    childProcess.stdout?.on('data', (data: Buffer) => {
      Utils.Manager.appendOutput(processId, data.toString(), undefined)
    })
    childProcess.stderr?.on('data', (data: Buffer) => {
      Utils.Manager.appendOutput(processId, undefined, data.toString())
    })
    childProcess.on('exit', (code, signal) => {
      if (onExit) {
        onExit(code, signal)
      }
    })
    const effectiveTimeout = timeout || Terminal.config.timeout
    if (effectiveTimeout > 0) {
      Utils.Manager.setProcessTimeout(processId, effectiveTimeout)
    }
    if (!background) {
      return new Promise((resolve, reject) => {
        childProcess.on('error', (error) => {
          reject(new Error(`Process execution failed: ${error.message}`))
        })
        childProcess.on('close', (code) => {
          const output = Utils.Manager.getProcessOutput(processId)
          resolve({
            id: processId,
            exitCode: code,
            stdout: output.stdout,
            stderr: output.stderr
          })
        })
        abortController.signal.addEventListener('abort', () => {
          reject(new Error('Process was aborted'))
        })
      })
    }
    return Promise.resolve({
      id: processId,
      exitCode: null,
      stdout: '',
      stderr: ''
    })
  }

  /** Get current configuration copy */
  static getConfig(): Types.TerminalConfig {
    return { ...this.config }
  }

  /**
   * Get exit code for process.
   * @description Returns code or null if running.
   * @param id - Process identifier
   * @returns Exit code value
   */
  static getExitCode(id: string): number | null {
    return Utils.Manager.getProcessExitCode(id)
  }

  /** Get all tracked processes list */
  static getList(): Types.ProcessListItem[] {
    return Utils.Manager.getProcessList()
  }

  /**
   * Get stdout and stderr output.
   * @description Returns captured process output.
   * @param id - Process identifier
   * @returns Output strings
   */
  static getOutput(id: string): Types.ProcessOutput {
    return Utils.Manager.getProcessOutput(id)
  }

  /**
   * Initialize with configuration.
   * @description Sets default merged with input.
   * @param config - Partial configuration object
   */
  static initialize(config?: Partial<Types.TerminalConfig>): void {
    this.config = {
      ...Terminal.defaultConfig,
      ...config,
      commands: {
        ...Terminal.defaultConfig.commands,
        ...config?.commands
      },
      env: {
        ...Terminal.defaultConfig.env,
        ...config?.env
      }
    }
  }

  /**
   * Kill running process.
   * @description Sends SIGTERM then SIGKILL.
   * @param id - Process identifier
   * @returns True if killed
   */
  static kill(id: string): boolean {
    return Utils.Manager.killProcess(id, true)
  }

  /**
   * Update configuration values.
   * @description Merges new into existing.
   * @param config - Partial configuration object
   */
  static setConfig(config: Partial<Types.TerminalConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      commands: {
        ...this.config.commands,
        ...config.commands
      },
      env: {
        ...this.config.env,
        ...config.env
      }
    }
  }

  /**
   * Stream output from process.
   * @description Attaches callbacks to stdio.
   * @param id - Process identifier
   * @param onStdout - Stdout callback
   * @param onStderr - Stderr callback
   * @throws Error when process not found
   */
  static stream(
    id: string,
    onStdout: (data: string) => void,
    onStderr: (data: string) => void
  ): void {
    const info = Utils.Manager.getProcess(id)
    if (!info) {
      throw new Error(`Process not found: ${id}`)
    }
    const { process: childProcess } = info
    if (!childProcess.stdout || !childProcess.stderr) {
      throw new Error('Process does not have accessible stdio streams')
    }
    childProcess.stdout.on('data', (data: Buffer) => {
      onStdout(data.toString())
    })
    childProcess.stderr.on('data', (data: Buffer) => {
      onStderr(data.toString())
    })
    if (info.stdout) {
      onStdout(info.stdout)
    }
    if (info.stderr) {
      onStderr(info.stderr)
    }
  }

  /**
   * Parse command into tokens.
   * @description Handles quoted arguments.
   * @param command - Raw command string
   * @returns Command and args
   * @throws Error when empty
   */
  private static parseCommand(command: string): Types.ParsedCommand {
    const tokens: string[] = []
    let current = ''
    let inQuotes = false
    let quoteChar = ''
    for (let i = 0; i < command.length; i++) {
      const char = command[i]!
      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true
        quoteChar = char
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false
        quoteChar = ''
      } else if (!inQuotes && /\s/.test(char)) {
        if (current) {
          tokens.push(current)
          current = ''
        }
      } else {
        current += char
      }
    }
    if (current) {
      tokens.push(current)
    }
    if (tokens.length === 0) {
      throw new Error('Empty command')
    }
    return {
      cmd: tokens[0]!,
      args: tokens.slice(1)
    }
  }
}

/** Terminal class default export */
export { Terminal as default }

/** Type namespace re-export */
export type * as Types from '@interfaces/index.ts'

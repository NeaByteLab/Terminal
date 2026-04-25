import type * as Types from '@interfaces/index.ts'

/**
 * Terminal interface definition.
 * @description Public API contract.
 */
export interface ITerminal {
  /**
   * Execute command.
   * @param command - Command string
   * @param options - Execution options
   * @returns Result promise
   */
  execute(command: string, options?: Types.ExecuteOptions): Promise<Types.ExecuteResult>

  /**
   * Get exit code.
   * @param id - Process identifier
   * @returns Code or null
   */
  getExitCode(id: string): number | null

  /** Get process list */
  getList(): Types.ProcessListItem[]

  /**
   * Get process output.
   * @param id - Process identifier
   * @returns Output streams
   */
  getOutput(id: string): Types.ProcessOutput

  /**
   * Kill process.
   * @param id - Process identifier
   * @returns Success flag
   */
  kill(id: string): boolean

  /**
   * Stream process output.
   * @param id - Process identifier
   * @param onStdout - Stdout handler
   * @param onStderr - Stderr handler
   */
  stream(id: string, onStdout: (data: string) => void, onStderr: (data: string) => void): void
}

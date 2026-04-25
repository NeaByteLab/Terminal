/**
 * Command execution configuration.
 * @description Validation rules for commands.
 */
export interface CommandConfig {
  /** Allowed command patterns */
  allow: string[]
  /** Blocked command patterns */
  deny: string[]
  /** Maximum arguments count */
  maxArgs: number
  /** Strict character validation */
  strictArgs: boolean
  /** Disable shell execution */
  noShell: boolean
}

/**
 * Environment variable configuration.
 * @description Filter rules for env vars.
 */
export interface EnvConfig {
  /** Allowed variable patterns */
  allow: string[]
  /** Blocked variable patterns */
  deny: string[]
}

/**
 * Terminal configuration object.
 * @description Main settings for execution.
 */
export interface TerminalConfig {
  /** Allowed workspace directories */
  workspaces: string[]
  /** Command validation rules */
  commands: CommandConfig
  /** Environment variable rules */
  env: EnvConfig
  /** Default timeout milliseconds */
  timeout: number
}

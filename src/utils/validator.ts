import { resolve } from 'node:path'
import type * as Types from '@interfaces/index.ts'

/**
 * Input validation utilities.
 * @description Security checks for execution.
 */
export class Validator {
  /** Pattern for null byte detection */
  private static readonly nullByteRegex: RegExp = /\x00/
  /** Pattern for path traversal detection */
  private static readonly pathTraversalRegex: RegExp = /\.\.(?:\/|\\)|\.\.$/
  /** Pattern for shell metacharacters */
  private static readonly shellMetacharRegex: RegExp = /[;|&`$(){}[\]\<>]/

  /**
   * Filter environment variables.
   * @description Applies allow and deny lists.
   * @param env - Environment variables
   * @param allowList - Allowed patterns
   * @param denyList - Blocked patterns
   * @returns Filtered variables
   */
  static filterEnvironment(
    env: Record<string, string | undefined>,
    allowList: string[],
    denyList: string[]
  ): Record<string, string> {
    const filtered: Record<string, string> = {}
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) {
        continue
      }
      if (this.matchesPatternList(key, denyList)) {
        continue
      }
      if (allowList.length === 0 || this.matchesPatternList(key, allowList)) {
        filtered[key] = value
      }
    }
    return filtered
  }

  /**
   * Check for path traversal in string.
   * @description Tests against traversal pattern.
   * @param path - Input path string
   * @returns True if traversal detected
   */
  static hasPathTraversal(path: string): boolean {
    return this.pathTraversalRegex.test(path)
  }

  /**
   * Validate command arguments.
   * @description Checks count and characters.
   * @param args - Argument array
   * @param maxArgs - Maximum allowed
   * @param strictArgs - Strict validation flag
   * @returns Validation result
   */
  static validateArguments(
    args: string[],
    maxArgs: number,
    strictArgs: boolean
  ): Types.ValidationResult {
    if (args.length > maxArgs) {
      return {
        valid: false,
        error: `Too many arguments: ${args.length} > max ${maxArgs}`
      }
    }
    if (!strictArgs) {
      return { valid: true }
    }
    for (let i = 0; i < args.length; i++) {
      const currentArg = args[i]!
      if (this.nullByteRegex.test(currentArg)) {
        return {
          valid: false,
          error: `Null bytes detected in argument ${i}`
        }
      }
      if (this.shellMetacharRegex.test(currentArg)) {
        return {
          valid: false,
          error: `Invalid characters in argument ${i}: shell metacharacters detected`
        }
      }
      if (this.pathTraversalRegex.test(currentArg)) {
        return {
          valid: false,
          error: `Path traversal detected in argument ${i}`
        }
      }
    }
    return { valid: true }
  }

  /**
   * Validate command against config.
   * @description Checks allow and deny lists.
   * @param command - Command string
   * @param config - Command config
   * @returns True if allowed
   */
  static validateCommand(command: string, config: Types.CommandConfig): boolean {
    for (const pattern of config.deny) {
      if (this.matchPattern(command, pattern)) {
        return false
      }
    }
    if (config.allow.length === 0) {
      return true
    }
    for (const pattern of config.allow) {
      if (this.matchPattern(command, pattern)) {
        return true
      }
    }
    return false
  }

  /**
   * Validate workspace path.
   * @description Checks against allowed list.
   * @param cwd - Working directory
   * @param allowedWorkspaces - Allowed paths
   * @returns Validation result
   */
  static validateWorkspace(
    cwd: string | undefined,
    allowedWorkspaces: string[]
  ): Types.WorkspaceValidationResult {
    if (allowedWorkspaces.length === 0 && !cwd) {
      return { valid: true, resolvedPath: undefined }
    }
    if (!cwd) {
      return { valid: true, resolvedPath: allowedWorkspaces[0] }
    }
    if (allowedWorkspaces.length === 0) {
      return { valid: true, resolvedPath: cwd }
    }
    const resolvedPath = this.resolvePath(cwd)
    for (const workspace of allowedWorkspaces) {
      const resolvedWorkspace = this.resolvePath(workspace)
      if (resolvedPath === resolvedWorkspace || resolvedPath.startsWith(resolvedWorkspace + '/')) {
        return { valid: true, resolvedPath: cwd }
      }
    }
    return {
      valid: false,
      resolvedPath: undefined,
      error: `Workspace not allowed: ${cwd}. Allowed: ${allowedWorkspaces.join(', ')}`
    }
  }

  /**
   * Match string against pattern.
   * @description Token-based with wildcards.
   * @param inputString - Input to match
   * @param patternValue - Pattern with optional *
   * @returns True if matches
   */
  private static matchPattern(inputString: string, patternValue: string): boolean {
    const strTokens = inputString.split(/\s+/).filter(Boolean)
    const patternTokens = patternValue.split(/\s+/).filter(Boolean)
    if (patternTokens.length === 0) {
      return false
    }
    const lastPatternToken = patternTokens[patternTokens.length - 1]!
    const hasWildcard = lastPatternToken.endsWith('*')
    if (hasWildcard) {
      const cleanPatternTokens = [...patternTokens]
      const cleanLastToken = lastPatternToken.slice(0, -1)
      cleanPatternTokens[patternTokens.length - 1] = cleanLastToken
      if (strTokens.length < cleanPatternTokens.length - 1) {
        return false
      }
      for (let i = 0; i < cleanPatternTokens.length - 1; i++) {
        if (strTokens[i] !== cleanPatternTokens[i]) {
          return false
        }
      }
      const strTokenAtPosition = strTokens[cleanPatternTokens.length - 1]
      if (strTokenAtPosition !== undefined) {
        if (cleanLastToken === '') {
          return true
        }
        return strTokenAtPosition.startsWith(cleanLastToken)
      }
      return cleanLastToken === ''
    }
    if (strTokens.length !== patternTokens.length) {
      return false
    }
    return strTokens.every((token, i) => token === patternTokens[i])
  }

  /**
   * Check if string matches any pattern.
   * @description Iterates pattern list.
   * @param str - Input string
   * @param patterns - Pattern array
   * @returns True if any match
   */
  private static matchesPatternList(str: string, patterns: string[]): boolean {
    for (const pattern of patterns) {
      if (this.matchPattern(str, pattern)) {
        return true
      }
    }
    return false
  }

  /**
   * Resolve path with normalization.
   * @description Uses native path module.
   * @param path - Input path
   * @returns Resolved path
   */
  private static resolvePath(path: string): string {
    return resolve(path)
  }
}

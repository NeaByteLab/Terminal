/**
 * Validation result object.
 * @description Contains status and errors.
 */
export interface ValidationResult {
  /** Pass or fail */
  valid: boolean
  /** Error message */
  error?: string
}

/**
 * Workspace validation result.
 * @description Path check outcome.
 */
export interface WorkspaceValidationResult {
  /** Pass or fail */
  valid: boolean
  /** Resolved path or undefined */
  resolvedPath: string | undefined
  /** Error message */
  error?: string
}

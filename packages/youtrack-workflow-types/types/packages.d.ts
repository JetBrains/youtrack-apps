/**
 * Packages module for accessing workflow packages and utilities.
 * @module @jetbrains/youtrack-scripting-api/packages
 */

/**
 * Global Packages object available in workflow scripts.
 * Provides access to workflow packages and utilities.
 */
declare global {
  const Packages: {
    /**
     * Access to Java packages and classes.
     * This allows scripts to interact with Java classes if needed.
     */
    [packageName: string]: any;
  };
}

export {};

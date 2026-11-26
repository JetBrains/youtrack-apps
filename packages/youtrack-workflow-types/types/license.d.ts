/**
 * License information module for YouTrack workflows.
 * @module @jetbrains/youtrack-scripting-api/license
 * @since 2025.3.109000
 */

/**
 * Information about the current YouTrack license.
 */
export interface LicenseInfo {
  /**
   * The YouTrack version.
   */
  readonly youTrackVersion: string;

  /**
   * The license username associated with this YouTrack instance.
   */
  readonly licenseUsername: string;

  /**
   * True if this YouTrack is a cloud instance.
   */
  readonly isCloud: boolean;

  /**
   * Indicates whether the instance is a free instance.
   */
  readonly isFree: boolean;

  /**
   * True if this YouTrack operates under a trial license.
   */
  readonly isTrial: boolean;

  /**
   * The current number of users in the instance.
   */
  readonly currentUserCount: number;

  /**
   * The maximum number of users that the current license allows for this YouTrack.
   */
  readonly maxUserCount: number;

  /**
   * The current number of agents in this YouTrack.
   */
  readonly currentAgentCount: number;

  /**
   * The maximum number of agents that the current license allows for this YouTrack.
   */
  readonly maxAgentCount: number;

  /**
   * The current amount of disk space (in megabytes) used by this YouTrack.
   */
  readonly currentDiskSpaceMb: number;

  /**
   * The maximum amount of disk space (in megabytes) allowed for this YouTrack.
   */
  readonly maxDiskSpaceMb: number;

  /**
   * The license expiration timestamp in milliseconds since the Unix epoch.
   */
  readonly expirationTimestamp: number;
}

/**
 * Global license information object.
 * @example
 * const { licenseInfo } = require('@jetbrains/youtrack-scripting-api/license');
 * console.log('Current YouTrack version is: ' + licenseInfo.youTrackVersion);
 * console.log('The current user count in this YouTrack is: ' + licenseInfo.currentUserCount);
 */
export const licenseInfo: LicenseInfo;

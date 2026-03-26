/**
 * Utility functions for YouTrack workflow rules.
 * Includes payload creation and data serialization utilities.
 */

/**
 * Creates a base payload with common fields
 * @param {string} eventType - The event type (e.g., 'issueCreated', 'commentAdded')
 * @param {Object} issue - The issue object
 * @param {Object} project - The project object
 * @returns {Object} Base payload object
 */
function createBasePayload(eventType, issue, project) {
    return {
        event: eventType,
        timestamp: new Date().toISOString(),
        id: issue.id,
        summary: issue.summary,
        project: {
            key: project.key,
            name: project.name,
            shortName: project.shortName
        }
    };
}

/**
 * Serializes a user object
 * @param {Object} user - The user object
 * @returns {Object|null} Serialized user or null
 */
function serializeUser(user) {
    if (!user) {
        return null;
    }
    return {
        login: user.login,
        fullName: user.fullName,
        email: user.email
    };
}

exports.createBasePayload = createBasePayload;
exports.serializeUser = serializeUser;


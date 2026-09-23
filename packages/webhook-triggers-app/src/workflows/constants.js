/**
 * @typedef {Object} WebhookEvent
 * @property {string} type - Event type identifier, matches the `event` enum value in a trigger row and the payload's eventType (e.g. 'issueCreated')
 * @property {string} name - Human-readable display name shown in logs
 */

/**
 * The "All events" trigger fires on every event type. Kept as a constant so
 * both the guard and the dispatcher agree on the sentinel enum value.
 * @type {string}
 */
const ALL_EVENTS_TYPE = 'allEvents';

/**
 * Event constants for webhook triggers. `type` is the value stored in a
 * trigger row's `event` field (settings.json enum) and echoed in the payload.
 * @type {Object.<string, WebhookEvent>}
 */
const EVENTS = {
    // Issue events
    ISSUE_CREATED: {
        type: 'issueCreated',
        name: 'Issue Created'
    },
    ISSUE_UPDATED: {
        type: 'issueUpdated',
        name: 'Issue Updated'
    },
    ISSUE_DELETED: {
        type: 'issueDeleted',
        name: 'Issue Deleted'
    },

    // Comment events
    COMMENT_ADDED: {
        type: 'commentAdded',
        name: 'Comment Added'
    },
    COMMENT_UPDATED: {
        type: 'commentUpdated',
        name: 'Comment Updated'
    },
    COMMENT_DELETED: {
        type: 'commentDeleted',
        name: 'Comment Deleted'
    },

    // Work Item events
    WORK_ITEM_ADDED: {
        type: 'workItemAdded',
        name: 'Work Item Added'
    },
    WORK_ITEM_UPDATED: {
        type: 'workItemUpdated',
        name: 'Work Item Updated'
    },
    WORK_ITEM_DELETED: {
        type: 'workItemDeleted',
        name: 'Work Item Deleted'
    },

    // Issue attachment events
    ATTACHMENT_ADDED: {
        type: 'issueAttachmentAdded',
        name: 'Attachment Added'
    },
    ATTACHMENT_DELETED: {
        type: 'issueAttachmentDeleted',
        name: 'Attachment Deleted'
    },

    // All events
    ALL_EVENTS: {
        type: ALL_EVENTS_TYPE,
        name: 'All Events'
    }
};

exports.EVENTS = EVENTS;
exports.ALL_EVENTS_TYPE = ALL_EVENTS_TYPE;
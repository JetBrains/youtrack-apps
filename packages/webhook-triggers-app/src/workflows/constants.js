/**
 * @typedef {Object} WebhookEvent
 * @property {string} key - Storage key for webhook URLs in project settings (e.g. 'webhooksOnIssueCreated')
 * @property {string} type - Event type identifier used in webhook payloads (e.g. 'issueCreated')
 * @property {string} name - Human-readable display name shown in UI and logs
 */

/**
 * Event constants for webhook triggers
 * @type {Object.<string, WebhookEvent>}
 */
const EVENTS = {
    // Issue events
    ISSUE_CREATED: {
        key: 'webhooksOnIssueCreated',
        type: 'issueCreated',
        name: 'Issue Created'
    },
    ISSUE_UPDATED: {
        key: 'webhooksOnIssueUpdated',
        type: 'issueUpdated',
        name: 'Issue Updated'
    },
    ISSUE_DELETED: {
        key: 'webhooksOnIssueDeleted',
        type: 'issueDeleted',
        name: 'Issue Deleted'
    },

    // Comment events
    COMMENT_ADDED: {
        key: 'webhooksOnCommentAdded',
        type: 'commentAdded',
        name: 'Comment Added'
    },
    COMMENT_UPDATED: {
        key: 'webhooksOnCommentUpdated',
        type: 'commentUpdated',
        name: 'Comment Updated'
    },
    COMMENT_DELETED: {
        key: 'webhooksOnCommentDeleted',
        type: 'commentDeleted',
        name: 'Comment Deleted'
    },

    // Work Item events
    WORK_ITEM_ADDED: {
        key: 'webhooksOnWorkItemAdded',
        type: 'workItemAdded',
        name: 'Work Item Added'
    },
    WORK_ITEM_UPDATED: {
        key: 'webhooksOnWorkItemUpdated',
        type: 'workItemUpdated',
        name: 'Work Item Updated'
    },
    WORK_ITEM_DELETED: {
        key: 'webhooksOnWorkItemDeleted',
        type: 'workItemDeleted',
        name: 'Work Item Deleted'
    },

    // Issue attachment events
    ATTACHMENT_ADDED: {
        key: 'webhooksOnAttachmentAdded',
        type: 'issueAttachmentAdded',
        name: 'Attachment Added'
    },
    ATTACHMENT_DELETED: {
        key: 'webhooksOnAttachmentDeleted',
        type: 'issueAttachmentDeleted',
        name: 'Attachment Deleted'
    },

    // All events
    ALL_EVENTS: {
        key: 'webhooksOnAllEvents',
        type: 'allEvents',
        name: 'All Events'
    }
};

exports.EVENTS = EVENTS;

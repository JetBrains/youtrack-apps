/**
 * Core workflow module with shared logic for webhook triggers.
 * This module re-exports all workflow utilities from specialized modules.
 *
 * Module Structure:
 * - workflow-http.js: HTTP and webhook communication
 * - workflow-guards.js: Guard functions and validation checks
 * - workflow-utils.js: Utilities and payload creation
 */

const httpModule = require('./workflow-http');
const guardsModule = require('./workflow-guards');
const utilsModule = require('./workflow-utils');

exports.parseWebhookUrls = httpModule.parseWebhookUrls;
exports.getWebhookUrls = httpModule.getWebhookUrls;
exports.sendWebhook = httpModule.sendWebhook;
exports.sendWebhooks = httpModule.sendWebhooks;

exports.createGuard = guardsModule.createGuard;
exports.shouldSkipIssue = guardsModule.shouldSkipIssue;
exports.isIssueCreation = guardsModule.isIssueCreation;
exports.hasCommentsAdded = guardsModule.hasCommentsAdded;
exports.hasCommentsUpdated = guardsModule.hasCommentsUpdated;
exports.hasCommentsRemoved = guardsModule.hasCommentsRemoved;
exports.hasWorkItemsAdded = guardsModule.hasWorkItemsAdded;
exports.hasWorkItemsUpdated = guardsModule.hasWorkItemsUpdated;
exports.hasWorkItemsRemoved = guardsModule.hasWorkItemsRemoved;
exports.hasAttachmentsAdded = guardsModule.hasAttachmentsAdded;
exports.hasAttachmentsRemoved = guardsModule.hasAttachmentsRemoved;
exports.hasFieldsChanged = guardsModule.hasFieldsChanged;

exports.createBasePayload = utilsModule.createBasePayload;
exports.serializeUser = utilsModule.serializeUser;

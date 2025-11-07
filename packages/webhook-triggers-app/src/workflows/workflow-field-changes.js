/**
 * Utilities for detecting and serializing issue field changes in YouTrack workflows.
 */

/**
 * Serializes a field value for webhook payloads
 * @param {*} value - The field value to serialize
 * @returns {*} Serialized value (string, array, object, or null)
 */
function serializeFieldValue(value) {
  if (!value) {
    return null;
  }

  // Primitives - return as is
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  // Objects - extract presentation or name
  if (value.presentation !== undefined || value.name !== undefined) {
    return {
      name: value.name || null,
      presentation: value.presentation || null
    };
  }

  // Fallback to string
  return String(value);
}

/**
 * Collects all changed fields from an issue using YouTrack API
 * @param {Object} issue - The issue object
 * @returns {Array<Object>} Array of changed fields with name, oldValue, and value
 */
function collectChangedFields(issue) {
  const changedFields = [];

  if (!issue.fields) {
    return changedFields;
  }

  // Get all field names, filtering out methods
  const allKeys = Object.keys(issue.fields);
  const fieldNames = allKeys.filter(function(key) {
    const value = issue.fields[key];
    return typeof value !== 'function' && value !== null && value !== undefined;
  });

  // Check each field for changes using YouTrack API
  for (let i = 0; i < fieldNames.length; i++) {
    const fieldName = fieldNames[i];
    const field = issue.fields[fieldName];

    try {
      // Use YouTrack API: issue.fields.oldValue(fieldName) - pass field name as string
      const oldValue = issue.fields.oldValue(fieldName);

      if (oldValue !== null && oldValue !== undefined) {
        const oldValueStr = serializeFieldValue(oldValue);
        const newValueStr = serializeFieldValue(field);

        // Only include if values actually differ
        if (oldValueStr !== newValueStr) {
          changedFields.push({
            name: fieldName,
            oldValue: oldValueStr,
            value: newValueStr
          });
        }
      }
    } catch {
      // Silently skip fields that don't support change tracking
    }
  }

  return changedFields;
}

exports.serializeFieldValue = serializeFieldValue;
exports.collectChangedFields = collectChangedFields;


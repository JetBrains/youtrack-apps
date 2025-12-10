/**
 * Utilities for detecting and serializing issue field changes in YouTrack workflows.
 */

/**
 * Serializes a field value for webhook payloads
 * @param {*} value - The field value to serialize
 * @returns {*} Serialized value (string, array, object, or null)
 */
function serializeFieldValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  // Primitives - return as is
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  // Strings - return as is
  if (typeof value === 'string') {
    return value;
  }

  // Handle YouTrack entity objects (User, State, Priority, EnumBundleElement, etc.)
  if (typeof value === 'object') {
    // User objects - check for login OR $$type === 'User'
    if (value.login !== undefined || value.$$type === 'User') {
      return {
        login: value.login || null,
        fullName: value.fullName || null,
        email: value.email || null
      };
    }

    // Enum/State/Priority objects have name and/or presentation
    if (value.name !== undefined || value.presentation !== undefined) {
      return {
        name: value.name || null,
        presentation: value.presentation || value.name || null
      };
    }

    // Period/Duration objects (Joda-Time Period)
    if (typeof value.getMinutes === 'function' && typeof value.getHours === 'function') {
      const minutes = value.getMinutes() || 0;
      const hours = value.getHours() || 0;
      const days = typeof value.getDays === 'function' ? (value.getDays() || 0) : 0;
      const weeks = typeof value.getWeeks === 'function' ? (value.getWeeks() || 0) : 0;
      const totalMinutes = minutes + (hours * 60) + (days * 8 * 60) + (weeks * 5 * 8 * 60);
      return {
        minutes: totalMinutes,
        presentation: value.toString ? value.toString() : (totalMinutes + 'm')
      };
    }

    // Period objects with minutes property (fallback)
    if (value.minutes !== undefined) {
      return {
        minutes: value.minutes,
        presentation: value.presentation || null
      };
    }

    // Date fields (check for getTime method)
    if (typeof value.getTime === 'function') {
      return value.getTime();
    }

    // Arrays (multi-value fields like tags, versions)
    if (Array.isArray(value) || typeof value.forEach === 'function') {
      const result = [];
      value.forEach(function(item) {
        result.push(serializeFieldValue(item));
      });
      return result;
    }

    // For any other object, try to extract id and name safely
    try {
      const serialized = {};
      if (value.id !== undefined) {serialized.id = value.id;}
      if (value.name !== undefined) {serialized.name = value.name;}
      if (value.presentation !== undefined) {serialized.presentation = value.presentation;}
      if (Object.keys(serialized).length > 0) {
        return serialized;
      }
    } catch {
      // Ignore errors from accessing properties
    }
  }

  // Final fallback: try presentation, name, or return null
  try {
    if (value.presentation) {return value.presentation;}
    if (value.name) {return value.name;}
    if (value.visibleName) {return value.visibleName;}
  } catch {
    // Ignore
  }

  return null;
}

/**
 * Checks if a built-in property has changed and returns the change details
 * @param {Object} issue - The issue object
 * @param {string} propName - Property name (summary, description)
 * @returns {Object|null} Change details or null if not changed
 */
function checkBuiltInPropertyChange(issue, propName) {
  try {
    // Use issue.isChanged() for built-in properties
    if (issue.isChanged && issue.isChanged(propName)) {
      const oldValue = issue.oldValue(propName);
      const newValue = issue[propName];

      return {
        name: propName,
        oldValue: String(oldValue || ''),
        value: String(newValue || '')
      };
    }
  } catch {
    // Silently skip if not supported
  }
  return null;
}

/**
 * Collects all changed fields from an issue using YouTrack API
 * @param {Object} issue - The issue object
 * @returns {Array<Object>} Array of changed fields with name, oldValue, and value
 */
function collectChangedFields(issue) {
  const changedFields = [];

  // Check built-in properties (summary, description) first
  const builtInProperties = ['summary', 'description'];
  for (let i = 0; i < builtInProperties.length; i++) {
    const propName = builtInProperties[i];
    const change = checkBuiltInPropertyChange(issue, propName);
    if (change) {
      changedFields.push(change);
    }
  }

  // Check custom fields
  if (!issue.fields) {
    return changedFields;
  }

  // Get all field names, filtering out methods
  const allKeys = Object.keys(issue.fields);
  const fieldNames = allKeys.filter(function(key) {
    const value = issue.fields[key];
    return typeof value !== 'function';
  });

  // Check each field for changes using YouTrack API
  for (let i = 0; i < fieldNames.length; i++) {
    const fieldName = fieldNames[i];
    const currentValue = issue.fields[fieldName];

    try {
      // Use YouTrack API: issue.fields.isChanged(fieldName) where fieldName is a STRING
      // This is the correct API - NOT currentValue.isChanged
      let fieldWasChanged = false;

      if (typeof issue.fields.isChanged === 'function') {
        fieldWasChanged = issue.fields.isChanged(fieldName);
      }

      // Skip if field wasn't changed
      if (!fieldWasChanged) {
        continue;
      }

      // Get old value using YouTrack API (returns null if field was previously empty)
      const oldValue = issue.fields.oldValue(fieldName);

      // Serialize values
      const oldValueSerialized = serializeFieldValue(oldValue);
      const currentValueSerialized = serializeFieldValue(currentValue);

      // Include the change
      changedFields.push({
        name: fieldName,
        oldValue: oldValueSerialized,
        value: currentValueSerialized
      });
    } catch {
      // Silently skip fields that don't support change tracking
    }
  }

  return changedFields;
}

exports.serializeFieldValue = serializeFieldValue;
exports.collectChangedFields = collectChangedFields;


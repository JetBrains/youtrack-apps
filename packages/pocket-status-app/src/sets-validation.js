// Shared by the project and user handlers: checks a status sets payload before it is stored
const MAX_SETS_LENGTH = 100000;
const MAX_NAME_LENGTH = 100;
// `#hex` (3/4/6/8 digits) or a plain CSS color name such as `black`
const COLOR_PATTERN = /^(#[0-9a-f]{3,4}|#[0-9a-f]{6}|#[0-9a-f]{8}|[a-z]+)$/i;

const isName = (value) => typeof value === 'string' && value.trim() !== '' && value.length <= MAX_NAME_LENGTH;
const isColor = (value) => typeof value === 'string' && COLOR_PATTERN.test(value);

// `raw` is the JSON string the widget sends: '{"sets":[{"name","values":[{"name","color","textColor"}]}]}'
function isValidSets(raw) {
    if (typeof raw !== 'string' || raw.length > MAX_SETS_LENGTH) {
        return false;
    }
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return false;
    }
    return Boolean(parsed) && Array.isArray(parsed.sets) && parsed.sets.every((set) =>
        Boolean(set) && isName(set.name) && Array.isArray(set.values) && set.values.every((value) =>
            Boolean(value) && isName(value.name) && isColor(value.color) && isColor(value.textColor)
        )
    );
}

exports.isValidSets = isValidSets;

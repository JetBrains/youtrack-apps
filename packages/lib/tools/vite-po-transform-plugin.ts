import fs from 'fs';
import path from 'path';

// Plugin to handle .po files similar to angular-gettext-loader
export const poTransformPlugin = () => {
  const extractMsgPair = (line: string, prefix: string): string => {
    const match = line.match(new RegExp(`^${prefix}\\s+"(.*)"`))
    return match ? match[1] : ''
  }

  const parsePoFile = (content: string): Record<string, string> => {
    const translations: Record<string, string> = {}
    const lines = content.split('\n')
    let currentMsgid = ''

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed.startsWith('msgid "')) {
        currentMsgid = extractMsgPair(trimmed, 'msgid')
      } else if (trimmed.startsWith('msgstr "') && currentMsgid) {
        const msgstr = extractMsgPair(trimmed, 'msgstr')
        if (msgstr) {
          translations[currentMsgid] = msgstr
        }
        currentMsgid = ''
      }
    }

    return translations
  }

  const extractLocaleFromPath = (filePath: string): string | null => {
    // Extract locale from filename (e.g., '/path/to/youtrack-issues-list-widget_ru.po' -> 'ru')
    const match = path.basename(filePath).match(/^([^_]+)_(\w+)\.po$/)
    return match ? match[2] : null
  }

  return {
    name: 'po-transform',
    load(id: string): string | null {
      if (id.endsWith('.po')) {
        const content = fs.readFileSync(id, 'utf-8')
        const translations = parsePoFile(content)
        const locale = extractLocaleFromPath(id)

        // Export both the translations and the extracted locale
        return `export default ${JSON.stringify(translations)};
export const locale = ${JSON.stringify(locale)};`
      }
      return null
    }
  }
}

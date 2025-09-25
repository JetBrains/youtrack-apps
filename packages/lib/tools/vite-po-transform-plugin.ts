import fs from 'fs';

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

  return {
    name: 'po-transform',
    load(id: string): string | null {
      if (id.endsWith('.po')) {
        const content = fs.readFileSync(id, 'utf-8')
        const translations = parsePoFile(content)
        return `export default ${JSON.stringify(translations)};`
      }
      return null
    }
  }
}

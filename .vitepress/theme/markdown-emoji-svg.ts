/**
 * Emoji → SVG markdown-it 插件
 *
 * 在 token 流层面将 Emoji 替换为 SVG <img> 标签。
 * 自动跳过代码块和行内代码。
 *
 * 将 text token 拆分为 text + html_inline token，
 * 以避免 <img> 标签被 markdown-it 转义为纯文本。
 */

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Emoji 映射（与 record-template.md 的「Emoji 渲染映射」一致）
const EMOJI_MAP = [
  { emoji: '✅', svg: 'mark-check', cssClass: 'inline-icon--check' },
  { emoji: '❌', svg: 'mark-cross', cssClass: 'inline-icon--cross' },
  { emoji: '⚠️', svg: 'status-pending', cssClass: 'inline-icon--warning' },
  { emoji: '🟢', svg: 'indicator-green', cssClass: 'inline-icon--green' },
  { emoji: '🟡', svg: 'indicator-yellow', cssClass: 'inline-icon--yellow' },
  { emoji: '🟠', svg: 'indicator-orange', cssClass: 'inline-icon--orange' },
  { emoji: '🔴', svg: 'indicator-red', cssClass: 'inline-icon--red' },
  // ⭐ 由 star-rating 组件处理，不在此替换
].map(m => ({
  emoji: m.emoji,
  replacement: `<img class="inline-icon ${m.cssClass}" src="/icons/${m.svg}.svg" alt="${m.emoji}" />`,
}))

// 合并所有 emoji 为一个正则，用于一次性匹配和拆分
const COMBINED_EMOJI_REGEX = new RegExp(
  EMOJI_MAP.map(m => escapeRegExp(m.emoji)).join('|'),
  'g'
)

// emoji → replacement 查找表
const REPLACEMENT_MAP = new Map(EMOJI_MAP.map(m => [m.emoji, m.replacement]))

/**
 * 将包含 emoji 的 text token 拆分为 text + html_inline token 序列
 */
function splitTextToken(content: string, Token: any) {
  const tokens: any[] = []
  let lastIndex = 0
  COMBINED_EMOJI_REGEX.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = COMBINED_EMOJI_REGEX.exec(content)) !== null) {
    // 匹配前的纯文本
    if (match.index > lastIndex) {
      const t = new Token('text', '', 0)
      t.content = content.slice(lastIndex, match.index)
      tokens.push(t)
    }
    // emoji → html_inline（不会被 escapeHtml 转义）
    const replacement = REPLACEMENT_MAP.get(match[0])
    if (replacement) {
      const t = new Token('html_inline', '', 0)
      t.content = replacement
      tokens.push(t)
    }
    lastIndex = match.index + match[0].length
  }

  // 剩余文本
  if (lastIndex < content.length) {
    const t = new Token('text', '', 0)
    t.content = content.slice(lastIndex)
    tokens.push(t)
  }
  return tokens
}

export default function emojiToSvgPlugin(md: any) {
  md.core.ruler.after('inline', 'emoji-to-svg', (state: any) => {
    for (const token of state.tokens) {
      if (token.type !== 'inline' || !token.children) continue

      const newChildren: any[] = []

      for (const child of token.children) {
        // 跳过非 text token（行内代码、HTML 标签等）
        if (child.type !== 'text') {
          newChildren.push(child)
          continue
        }

        // 检查是否包含 emoji
        COMBINED_EMOJI_REGEX.lastIndex = 0
        if (!COMBINED_EMOJI_REGEX.test(child.content)) {
          newChildren.push(child)
          continue
        }

        // 拆分为 text + html_inline token
        newChildren.push(...splitTextToken(child.content, state.Token))
      }

      token.children = newChildren
    }
  })
}

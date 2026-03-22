/**
 * Emoji → SVG + 泛型转义 markdown-it 插件
 *
 * 在 token 流层面处理两项转换：
 * 1. Emoji → SVG <img> 标签（跳过代码块和行内代码）
 * 2. C# 泛型 <T> → &lt;T&gt;（跳过代码块，防止 Vue 解析错误）
 *
 * 注意：VitePress 的 fence 代码块虽然加了 v-pre，但正文中的泛型
 * （如 "使用 GetFeature<T>()"）仍会被 Vue 解析成 HTML 标签。
 */

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Emoji 映射（与 record-template.md 的「Emoji 渲染映射」一致）
const EMOJI_RULES = [
  { emoji: '✅', svg: 'mark-check', cssClass: 'inline-icon--check' },
  { emoji: '❌', svg: 'mark-cross', cssClass: 'inline-icon--cross' },
  { emoji: '⚠️', svg: 'status-pending', cssClass: 'inline-icon--warning' },
  { emoji: '🟢', svg: 'indicator-green', cssClass: 'inline-icon--green' },
  { emoji: '🟡', svg: 'indicator-yellow', cssClass: 'inline-icon--yellow' },
  { emoji: '🟠', svg: 'indicator-orange', cssClass: 'inline-icon--orange' },
  { emoji: '🔴', svg: 'indicator-red', cssClass: 'inline-icon--red' },
  // ⭐ 由 star-rating 组件处理，不在此替换
].map(m => ({
  regex: new RegExp(escapeRegExp(m.emoji), 'g'),
  replacement: `<img class="inline-icon ${m.cssClass}" src="/icons/${m.svg}.svg" alt="${m.emoji}" />`,
}))

// C# 泛型模式：<单个或多个大写字母/数字/逗号/空格>
// 匹配 <T>, <int>, <PassData>, <T1, T2> 等（* 允许单字母泛型）
const GENERIC_REGEX = /<(?=[A-Za-z][A-Za-z0-9_, ]*>)[A-Za-z0-9_, ]+>/g
const GENERIC_REPLACEMENT = (match) => `&lt;${match.slice(1, -1)}&gt;`

export default function emojiToSvgPlugin(md) {
  md.core.ruler.after('inline', 'emoji-to-svg', (state) => {
    for (const token of state.tokens) {
      if (token.type !== 'inline' || !token.children) continue

      for (const child of token.children) {
        // 跳过行内代码和 HTML 标签
        if (child.type === 'code_inline' || child.type === 'html_inline') {
          continue
        }

        // 只处理纯文本 token
        if (child.type === 'text') {
          // Emoji → SVG（跳过代码块和行内代码）
          for (const rule of EMOJI_RULES) {
            child.content = child.content.replace(rule.regex, rule.replacement)
          }
        }
      }
    }
  })
}

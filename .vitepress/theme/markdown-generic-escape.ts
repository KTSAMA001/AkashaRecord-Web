/**
 * C# 泛型转义 markdown-it 插件
 *
 * markdown-it 将 <T>、<int> 等识别为 html_inline token。
 * 若不处理，Vue 会将其当作组件解析，导致内容消失。
 *
 * 本插件在 token 流层面将「非 HTML 标签」的 html_inline 转为
 * 转义文本（text token），由 markdown-it 自动输出 &lt;T&gt;，
 * 浏览器渲染为 <T>。
 *
 * 代码块和行内代码由 markdown-it 自身处理，不受影响。
 */

// HTML5 标准标签白名单（小写）
const HTML_TAGS = new Set([
  'a','abbr','address','area','article','aside','audio',
  'b','base','bdi','bdo','blockquote','body','br','button',
  'canvas','caption','cite','code','col','colgroup',
  'data','datalist','dd','del','details','dfn','dialog','div','dl','dt',
  'em','embed',
  'fieldset','figcaption','figure','footer','form',
  'h1','h2','h3','h4','h5','h6','head','header','hgroup','hr','html',
  'i','iframe','img','input','ins',
  'kbd',
  'label','legend','li','link',
  'main','map','mark','menu','meta','meter',
  'nav','noscript',
  'object','ol','optgroup','option','output',
  'p','param','picture','pre','progress',
  'q',
  'rp','rt','ruby',
  's','samp','script','section','select','slot','small','source','span','strong','style','sub','summary','sup',
  'table','tbody','td','template','textarea','tfoot','th','thead','time','title','tr','track',
  'u','ul',
  'var','video','wbr',
])

// 匹配 <T>, <int>, <PassData>, <T1, T2> 等纯标签名（无属性）
const BARE_OPEN_TAG = /^<([a-zA-Z][a-zA-Z0-9_, ]*)>$/

export default function genericEscapePlugin(md: any) {
  md.core.ruler.after('inline', 'generic-escape', (state: any) => {
    for (const token of state.tokens) {
      if (token.type !== 'inline' || !token.children) continue

      for (const child of token.children) {
        if (child.type !== 'html_inline') continue

        const m = BARE_OPEN_TAG.exec(child.content)
        if (!m) continue

        const tagName = m[1]
        // 已知 HTML 标签保持不变
        if (HTML_TAGS.has(tagName.toLowerCase())) continue

        // 非 HTML 标签 → 转为 text token，markdown-it 会自动转义尖括号
        child.type = 'text'
        // content 保持原样 <T>，text token 渲染时会被 escapeHtml 处理
        child.content = `<${tagName}>`
      }
    }
  })
}

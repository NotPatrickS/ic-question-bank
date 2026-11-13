/* ====== Verilog 代码编辑器（带实时语法高亮） ======
 * makeEditor(mount, { value, rows, onChange }) -> { get, set, focus }
 * 结构：透明 <textarea> 叠在同样式的高亮 <pre> 上，输入即重新着色。
 * 功能：Tab 缩进两空格、回车自动对齐 begin/end、括号/引号补全。
 * 高亮依赖 app.js 的 highlightSV（makeEditor 只在页面脚本加载后才被调用）。
 */
function makeEditor(mount, { value = "", rows = 14, onChange } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "ceditor-wrap";

  const hl = document.createElement("pre");
  hl.className = "ceditor-hl";

  const ta = document.createElement("textarea");
  ta.className = "ceditor-ta";
  ta.rows = rows;
  ta.spellcheck = false;
  ta.wrap = "off";
  ta.value = value;
  ta.setAttribute("autocapitalize", "off");
  ta.setAttribute("autocomplete", "off");
  ta.setAttribute("autocorrect", "off");

  wrap.appendChild(hl);
  wrap.appendChild(ta);
  mount.appendChild(wrap);

  function paint(src) {
    return (typeof highlightSV === "function") ? highlightSV(src) : src;
  }
  function render() {
    hl.innerHTML = paint(ta.value) + "\n";
    syncScroll();
  }
  function syncScroll() {
    hl.scrollTop = ta.scrollTop;
    hl.scrollLeft = ta.scrollLeft;
  }

  const INDENT = "  ";

  function lineStart(text, pos) {
    const i = text.lastIndexOf("\n", pos - 1);
    return i < 0 ? 0 : i + 1;
  }
  function indentOf(text, lineBegin) {
    let j = lineBegin;
    while (j < text.length && (text[j] === " " || text[j] === "\t")) j++;
    return text.slice(lineBegin, j);
  }

  ta.addEventListener("input", fire);
  ta.addEventListener("scroll", syncScroll);

  ta.addEventListener("keydown", e => {
    const { selectionStart: s, selectionEnd: t, value: v } = ta;

    if (e.key === "Tab") {
      e.preventDefault();
      if (s !== t) {                       // 多行整体缩进
        const ls = lineStart(v, s), le = v.indexOf("\n", t) < 0 ? v.length : v.indexOf("\n", t);
        const block = v.slice(ls, le).split("\n")
          .map(l => e.shiftKey ? l.replace(/^ {1,2}|^\t/, "") : INDENT + l).join("\n");
        ta.value = v.slice(0, ls) + block + v.slice(le);
        ta.selectionStart = ls; ta.selectionEnd = ls + block.length;
      } else {                             // 单点插入
        ta.value = v.slice(0, s) + INDENT + v.slice(t);
        ta.selectionStart = ta.selectionEnd = s + INDENT.length;
      }
      fire(); return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const ls = lineStart(v, s);
      const base = indentOf(v, ls);
      const before = v.slice(ls, s).trim();
      const extra = /(\bbegin|\()\s*$/.test(before) ? INDENT : "";
      const nl = "\n" + base + extra;
      ta.value = v.slice(0, s) + nl + v.slice(t);
      ta.selectionStart = ta.selectionEnd = s + nl.length;
      fire(); return;
    }

    if (e.key === "Backspace" && s === t && s >= INDENT.length) {
      const seg = v.slice(s - INDENT.length, s);
      if (seg === INDENT) {
        e.preventDefault();
        ta.value = v.slice(0, s - INDENT.length) + v.slice(t);
        ta.selectionStart = ta.selectionEnd = s - INDENT.length;
        fire();
      }
      return;
    }

    // 键入闭合符时，若下一个字符正是它，则跳过而不是重复插入。
    // 注意：Verilog 的 ' 出现在 1'bz / 4'b1010 等字面量中间，不能自动配对。
    const CLOSERS = { ")": true, "]": true };
    if (CLOSERS[e.key] && s === t && v[s] === e.key) {
      e.preventDefault();
      ta.selectionStart = ta.selectionEnd = s + 1;
      fire(); return;
    }

    const PAIRS = { "(": ")", "[": "]" };
    if (PAIRS[e.key] && s === t) {
      e.preventDefault();
      ta.value = v.slice(0, s) + e.key + PAIRS[e.key] + v.slice(t);
      ta.selectionStart = ta.selectionEnd = s + 1;
      fire(); return;
    }
  });

  let changeCb = onChange;
  function fire() { render(); if (changeCb) changeCb(ta.value); }

  render();

  return {
    get: () => ta.value,
    set(v) { ta.value = v; render(); },
    focus: () => ta.focus(),
    setOnChange(cb) { changeCb = cb; },
    el: ta
  };
}

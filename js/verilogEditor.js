/* ====== Verilog 代码编辑器 ======
 * makeEditor(mount, { value, rows, onChange }) -> { get, set, focus }
 * 功能：Tab 缩进两空格、回车自动对齐 begin/end、括号/引号补全。
 * 底层是普通 <textarea>，样式交给 .ceditor。
 */
function makeEditor(mount, { value = "", rows = 14, onChange } = {}) {
  const ta = document.createElement("textarea");
  ta.className = "ceditor";
  ta.rows = rows;
  ta.spellcheck = false;
  ta.value = value;
  ta.setAttribute("autocapitalize", "off");
  ta.setAttribute("autocomplete", "off");
  ta.setAttribute("autocorrect", "off");
  mount.appendChild(ta);

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

    const PAIRS = { "(": ")", "[": "]", "'": "'" };
    if (PAIRS[e.key] && s === t) {
      e.preventDefault();
      ta.value = v.slice(0, s) + e.key + PAIRS[e.key] + v.slice(t);
      ta.selectionStart = ta.selectionEnd = s + 1;
      fire(); return;
    }
  });

  let changeCb = onChange;
  function fire() { if (changeCb) changeCb(ta.value); }

  return {
    get: () => ta.value,
    set(v) { ta.value = v; },
    focus: () => ta.focus(),
    setOnChange(cb) { changeCb = cb; },
    el: ta
  };
}

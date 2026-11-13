/* ====== 应用主体：hash 路由 + 渲染 ====== */
const $app = document.getElementById("app");

const BY_ID = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
const TOPICS = [...new Set(QUESTIONS.map(q => q.topic))];
const todayStr = () => new Date().toISOString().slice(0, 10);

/* ---------- 工具 ---------- */
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function shuffle(arr, seed) {
  const a = arr.slice();
  let r = seed >>> 0;
  const rnd = () => (r = (r * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickRandom(n, pool) {
  return shuffle(pool, Date.now() & 0xffffffff).slice(0, n);
}
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 1800);
}

/* ---------- 路由 ---------- */
const routes = {
  "/": renderHome,
  "/topic": renderTopic,       // #/topic?name=xxx
  "/practice": renderPractice, // #/practice?mode=topic|random|review|unknown&name=xxx
  "/q": renderQuestion,        // #/q?id=xxx
  "/daily": renderDaily,
  "/wrong": renderWrong,
  "/stats": renderStats,
  "/search": renderSearch,     // #/search?kw=xxx
  "/roadmap": renderRoadmap
};

function parseHash() {
  const raw = location.hash.slice(1) || "/";
  const [path, qs] = raw.split("?");
  return { path, params: new URLSearchParams(qs || "") };
}
function nav(hash) {
  // 目标 hash 与当前相同时不会触发 hashchange，需手动重渲染
  if (location.hash === hash) router();
  else location.hash = hash;
}

function router() {
  const { path } = parseHash();
  // 高亮导航
  document.querySelectorAll("[data-nav]").forEach(a => {
    const key = a.dataset.nav;
    const active =
      (key === "home" && (path === "/" || path === "/topic" || path === "/practice" || path === "/q")) ||
      (key === "daily" && path === "/daily") ||
      (key === "wrong" && path === "/wrong") ||
      (key === "stats" && path === "/stats") ||
      (key === "roadmap" && path === "/roadmap");
    a.classList.toggle("active", active);
  });
  (routes[path] || renderHome)();
}
window.addEventListener("hashchange", router);

/* ---------- 首页 ---------- */
function renderHome() {
  const total = QUESTIONS.length;
  const doneIds = Object.keys(Store.records).filter(id => BY_ID[id]);
  const cont = Store.latestCurrent();
  const dueIds = QUESTIONS.filter(q => ["review", "unknown"].includes(Store.marks[q.id])).map(q => q.id);
  const pctTotal = Math.round(doneIds.length / total * 100);

  $app.innerHTML = `
    <div class="hero">
      <div class="eyebrow">个人 IC 题库</div>
      <h1>刷题，从此刻开始。</h1>
      <p class="sub">${QUESTIONS.length} 道题 · 3 阶段学习路线 · 断点续刷、错题重做、每日打卡</p>
      <div class="hero-actions">
        ${cont && cont.pos < cont.order.length ? `<a class="btn" href="#/practice?mode=resume&set=${encodeURIComponent(cont.setId)}">继续上次学习</a>` : `<a class="btn" href="#/daily">开始今日打卡</a>`}
        <a class="link-arrow" href="#/roadmap">浏览学习路线 ›</a>
      </div>
    </div>

    <div class="statrow">
      <div class="stat"><div class="stat-num">${doneIds.length}</div><div class="stat-label">已刷题数</div></div>
      <div class="stat"><div class="stat-num">${dueIds.length}</div><div class="stat-label">待复习</div></div>
      <div class="stat"><div class="stat-num">${pctTotal}%</div><div class="stat-label">总进度</div></div>
    </div>

    <h2 class="section-title">按专题刷题</h2>
    <p class="section-sub">每个专题进度独立记录，点击进入练习。</p>
    <div class="tiles" id="topicList"></div>
  `;

  const tl = document.getElementById("topicList");
  TOPICS.forEach(tp => {
    const qs = QUESTIONS.filter(q => q.topic === tp);
    const done = qs.filter(q => Store.records[q.id]).length;
    const pct = qs.length ? Math.round(done / qs.length * 100) : 0;
    const row = document.createElement("div");
    row.className = "tile";
    row.innerHTML = `
      <div class="tile-top"><h3>${esc(tp)}</h3><span class="tile-count">${qs.length} 题</span></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="tile-link link-arrow small">继续练习 ›</div>`;
    row.onclick = () => nav("#/topic?name=" + encodeURIComponent(tp));
    tl.appendChild(row);
  });
}

/* ---------- 专题页 ---------- */
function renderTopic() {
  const { params } = parseHash();
  const name = params.get("name");
  const qs = QUESTIONS.filter(q => q.topic === name);
  if (!qs.length) return renderHome();

  const done = qs.filter(q => Store.records[q.id]).length;
  $app.innerHTML = `
    <div class="page-head">
      <a href="#/" class="link-arrow back">‹ 我的学习</a>
      <h1 style="margin-top:10px">${esc(name)}</h1>
      <p class="sub">${qs.length} 题 · 已完成 ${done}</p>
      <div class="bar"><i style="width:${qs.length ? done / qs.length * 100 : 0}%"></i></div>
      <div class="page-actions">
        <button class="btn" id="startTopic">顺序刷题</button>
        <button class="btn ghost" id="startTopicRnd">随机练习</button>
        <button class="btn ghost" id="onlyWrong">只刷错题</button>
      </div>
    </div>
    <div class="card">
      <h2>题目列表</h2>
      <div id="qlist" style="margin-top:10px"></div>
    </div>`;

  const list = document.getElementById("qlist");
  qs.forEach(q => {
    const st = Store.status(q.id);
    const row = document.createElement("div");
    row.className = "qlist-item";
    row.innerHTML = `
      <div class="qtext">${esc(q.question.split("\n")[0])}</div>
      ${st === "right" ? '<span class="pill ok">已掌握</span>' : st === "wrong" ? '<span class="pill bad">做错过</span>' : ""}
      ${Store.marks[q.id] ? '<span class="pill warn">需复习</span>' : ""}`;
    row.onclick = () => nav("#/q?id=" + q.id);
    list.appendChild(row);
  });

  const orderKey = { mode: "topic", name };
  document.getElementById("startTopic").onclick = () => startPractice({ mode: "topic", name });
  document.getElementById("startTopicRnd").onclick = () => startPractice({ mode: "random-topic", name });
  document.getElementById("onlyWrong").onclick = () => startPractice({ mode: "wrong-topic", name });
}

/* ---------- 开始一次练习会话 ---------- */
function startPractice({ mode, name }) {
  let pool = [];
  if (mode === "topic") pool = QUESTIONS.filter(q => q.topic === name);
  else if (mode === "random-topic") pool = shuffle(QUESTIONS.filter(q => q.topic === name), Date.now() & 0xffffffff);
  else if (mode === "wrong-topic") pool = QUESTIONS.filter(q => q.topic === name && Store.status(q.id) === "wrong");
  else if (mode === "random") pool = shuffle(QUESTIONS, Date.now() & 0xffffffff);
  else if (mode === "review") pool = QUESTIONS.filter(q => Store.marks[q.id] === "review");
  else if (mode === "unknown") pool = QUESTIONS.filter(q => Store.marks[q.id] === "unknown");

  if (!pool.length) { toast("没有可刷的题目"); return; }
  const setId = `${mode}:${name || ""}`;
  Store.saveCurrent(setId, pool.map(q => q.id), 0);
  nav(`#/practice?mode=resume&set=${encodeURIComponent(setId)}`);
}

/* ---------- 练习页 ---------- */
function renderPractice() {
  const { params } = parseHash();
  const mode = params.get("mode");
  if (mode === "resume") return resumePractice(decodeURIComponent(params.get("set") || ""));
  startPractice({ mode, name: params.get("name") || undefined });
}

function resumePractice(setId) {
  const cur = Store.getCurrent(setId);
  if (!cur || cur.pos >= cur.order.length) {
    $app.innerHTML = `<div class="card"><h2>本次练习已完成 🎉</h2>
      <p class="desc">可以回顾题目或再来一轮随机练习。</p>
      <a class="btn" href="#/">返回首页</a></div>`;
    return;
  }
  const id = cur.order[cur.pos];
  renderQuestionBody(id, { setId, order: cur.order, pos: cur.pos });
}

function renderQuestion() {
  const { params } = parseHash();
  renderQuestionBody(params.get("id"), {});
}

/* ---------- 题目主体渲染（练习/单题/打卡共用） ---------- */
function renderQuestionBody(id, ctx) {
  const q = BY_ID[id];
  if (!q) { $app.innerHTML = '<div class="empty">题目不存在</div>'; return; }

  const marked = Store.marks[id];
  const isJudge = q.type === "judge";
  const isCode = q.type === "judge" && q.starter && q.checks;
  const typePill = isCode ? "编程 · 自动检查" : isJudge ? "简答 · 自评" : "单选";

  $app.innerHTML = `
    <div class="card" style="margin-top:32px">
      <div class="qmeta">
        <span class="pill">${esc(q.topic)}</span>
        <span class="pill gray">${typePill}</span>
        ${(q.tags || []).map(t => `<span class="pill gray">#${esc(t)}</span>`).join("")}
        <span style="margin-left:auto"></span>
        <button class="btn small ${marked === "review" ? "warn" : "ghost"}" id="mkReview">需复习</button>
        <button class="btn small ${marked === "unknown" ? "red" : "ghost"}" id="mkUnknown">暂不会</button>
      </div>
      <h2 class="qtitle">${esc(q.question).replace(/\n/g, "<br>")}</h2>
      ${q.code ? codeBlock(q.code) : ""}
      <div id="answerArea"></div>
      ${isCode ? `
      <div class="cw-wrap">
        <div class="cw-head">
          <span class="cw-title">main.sv</span>
          <div class="cw-head-actions">
            <button class="btn small ghost" id="cwReset">重置</button>
          </div>
        </div>
        <div class="cw-editor"><div id="cwMount"></div></div>
        <div class="cw-actions">
          <button class="btn" id="cwRun">▶ 运行自检</button>
          <button class="btn ghost" id="revealRef">查看参考答案</button>
        </div>
        <div class="cw-result chk-list" id="cwResult" style="display:none"></div>
      </div>
      <div id="judgeArea">
        <div id="refBlock" style="display:none">
          ${q.solution ? `<div class="cw-solution"><div class="cw-sol-title">参考实现</div>${codeBlock(q.solution)}</div>` : ""}
          ${q.answer_ref ? `<div class="explain"><b>要点：</b><br>${esc(q.answer_ref).replace(/\n/g, "<br>")}</div>` : ""}
          <div class="judge-btns">
            <button class="btn green" id="jRight">我答对了 ✓</button>
            <button class="btn red" id="jWrong">没答好 ✗ 记入错题</button>
          </div>
        </div>
      </div>` : `
      <div id="judgeArea" ${isJudge ? "" : 'style="display:none"'}>
        <div class="qactions">
          <button class="btn ghost" id="revealRef">查看参考答案</button>
        </div>
        <div id="refBlock" style="display:none">
          <div class="explain"><b>参考答案：</b><br>${esc(q.answer_ref || "").replace(/\n/g, "<br>")}</div>
          <div class="judge-btns">
            <button class="btn green" id="jRight">我答对了 ✓</button>
            <button class="btn red" id="jWrong">没答好 ✗ 记入错题</button>
          </div>
        </div>
      </div>`}
      <div class="qactions" id="qActions">
        <button class="btn" id="btnNext">下一题 →</button>
        <span class="qprogress" id="qProgress"></span>
      </div>
    </div>`;

  const answerArea = document.getElementById("answerArea");
  const judgeArea = document.getElementById("judgeArea");

  if (isCode) {
    // 编程题：编辑器 + 运行自检（通过后仍可对照参考实现自评）
    document.getElementById("btnNext").style.visibility = "hidden";
    const ed = makeEditor(document.getElementById("cwMount"), { value: q.starter, rows: 16 });
    document.getElementById("cwReset").onclick = () => ed.set(q.starter);

    document.getElementById("cwRun").onclick = () => {
      const src = ed.get();
      const box = document.getElementById("cwResult");
      box.style.display = "";
      let pass = 0;
      const rows = q.checks.map(c => {
        let ok = false;
        try { ok = new RegExp(c.re, "m").test(src); } catch { ok = false; }
        if (ok) pass++;
        return `<div class="chk ${ok ? "pass" : "fail"}"><span class="chk-ico">${ok ? "✓" : "✗"}</span>${esc(c.desc)}</div>`;
      }).join("");
      const all = pass === q.checks.length;
      box.innerHTML = `
        <div class="chk-sum ${all ? "pass" : "fail"}">${all ? "✓ 全部检查通过" : `${pass}/${q.checks.length} 项通过`} · 通过后请对照参考实现自评</div>
        <div class="chk-list">${rows}</div>`;
      if (all) {
        document.getElementById("revealRef").style.display = "";
        document.getElementById("revealRef").classList.add("glow");
      }
    };

    document.getElementById("revealRef").onclick = () => {
      document.getElementById("refBlock").style.display = "";
      document.getElementById("revealRef").style.display = "none";
    };
    document.getElementById("jRight").onclick = () => finish(true);
    document.getElementById("jWrong").onclick = () => finish(false);
  } else if (isJudge) {
    // 简答题：先自己想 → 查看参考答案 → 自评
    judgeArea.style.display = "";
    document.getElementById("btnNext").style.visibility = "hidden";
    document.getElementById("revealRef").onclick = () => {
      document.getElementById("refBlock").style.display = "";
      document.getElementById("revealRef").style.display = "none";
    };
    document.getElementById("jRight").onclick = () => finish(true);
    document.getElementById("jWrong").onclick = () => finish(false);
  } else {
    // 单选：点选项即判分
    const keys = ["A", "B", "C", "D", "E", "F"];
    q.options.forEach((opt, i) => {
      const div = document.createElement("div");
      div.className = "opt";
      div.innerHTML = `<span class="key">${keys[i]}</span><span>${esc(opt).replace(/\n/g, "<br>")}</span>`;
      div.onclick = () => {
        if (answerArea.dataset.done) return;
        answerArea.dataset.done = "1";
        const correct = i === q.answer;
        [...answerArea.children].forEach((el, k) => {
          el.classList.add("locked");
          if (k === q.answer) el.classList.add("correct");
          if (k === i && !correct) el.classList.add("wrong");
        });
        showExplain();
        finish(correct);
      };
      answerArea.appendChild(div);
    });
  }

  function showExplain() {
    const ex = document.createElement("div");
    ex.className = "explain";
    ex.innerHTML = `<b>解析：</b>${esc(q.explanation || "").replace(/\n/g, "<br>")}`;
    judgeArea.parentNode.insertBefore(ex, judgeArea);
  }

  function finish(ok) {
    Store.record(id, ok ? "right" : "wrong");
    if (ctx.dailyCtx) {
      Store.dailyDone(ctx.dailyCtx.date, id, ok);
      ctx.dailyCtx.done++;
      document.getElementById("qProgress").textContent =
        `今日打卡进度 ${ctx.dailyCtx.done}/${ctx.dailyCtx.total}`;
      if (ctx.dailyCtx.done >= ctx.dailyCtx.total) {
        setTimeout(() => { toast("今日打卡完成 🎉"); nav("#/daily"); }, 600);
        return;
      }
      document.getElementById("btnNext").onclick = () => renderDailyNext(ctx.dailyCtx);
    }
    if (ctx.setId) {
      Store.saveCurrent(ctx.setId, ctx.order, ctx.pos + 1);
      document.getElementById("btnNext").onclick = () =>
        nav(`#/practice?mode=resume&set=${encodeURIComponent(ctx.setId)}`);
    }
    document.getElementById("btnNext").style.visibility = "";
    if (!ctx.setId && !ctx.dailyCtx) {
      const nxt = neighbors(id);
      document.getElementById("btnNext").onclick = () => nxt && nav("#/q?id=" + nxt.id);
    }
  }

  // 下一题逻辑（进入页面即绑定会话内导航）
  if (ctx.setId) {
    const cur = Store.getCurrent(ctx.setId);
    const pos = cur ? cur.pos : 0;
    document.getElementById("qProgress").textContent = `第 ${pos + 1}/${ctx.order.length} 题`;
    document.getElementById("btnNext").onclick = () =>
      nav(`#/practice?mode=resume&set=${encodeURIComponent(ctx.setId)}`);
  }
  if (ctx.dailyCtx) {
    document.getElementById("qProgress").textContent =
      `今日打卡进度 ${ctx.dailyCtx.done}/${ctx.dailyCtx.total}`;
    document.getElementById("btnNext").onclick = () => renderDailyNext(ctx.dailyCtx);
    document.getElementById("btnNext").style.visibility = "hidden";
  }

  function neighbors(id) {
    const i = QUESTIONS.findIndex(x => x.id === id);
    return QUESTIONS[i + 1] || null;
  }

  // 标记按钮
  document.getElementById("mkReview").onclick = () => {
    Store.mark(id, "review"); toast(Store.marks[id] === "review" ? "已加入复习清单" : "已取消复习标记");
    document.getElementById("mkReview").classList.toggle("ghost", Store.marks[id] !== "review");
  };
  document.getElementById("mkUnknown").onclick = () => {
    Store.mark(id, "unknown"); toast(Store.marks[id] === "unknown" ? "已标记暂不会" : "已取消标记");
    document.getElementById("mkUnknown").classList.toggle("ghost", Store.marks[id] !== "unknown");
  };
}

/* ---------- 每日打卡 ---------- */
function renderDaily() {
  const today = todayStr();
  const d = Store.ensureDaily(today, pickRandom(DAILY_COUNT, QUESTIONS).map(q => q.id), QUESTIONS.map(q => q.id));

  $app.innerHTML = `
    <div class="page-head center">
      <p class="eyebrow">每日打卡</p>
      <h1>今日 ${DAILY_COUNT} 题</h1>
      <p class="sub">${today} · 连续打卡 <b>${Store.streak.count}</b> 天 · 已完成 <b>${d.done}/${d.total}</b></p>
      <div class="bar"><i style="width:${d.done / d.total * 100}%"></i></div>
    </div>
    <div class="card" style="text-align:center">
      ${d.done >= d.total
        ? `<h2 style="justify-content:center">今日已完成 🎉</h2><p class="desc">明天再来，保持手感。</p><a class="btn" href="#/">返回首页</a>`
        : `<button class="btn" id="goDaily">开始今日 ${d.total - d.done} 题</button>
           <p class="desc" style="margin-top:14px;margin-bottom:0">每天自动从全题库抽取 ${DAILY_COUNT} 道题</p>`}
    </div>`;

  const go = document.getElementById("goDaily");
  if (go) go.onclick = () => renderDailyNext({ date: today, done: d.done, total: d.total });
}

/* 打卡内逐题推进：跳过当日已答对的题 */
function renderDailyNext(dctx) {
  const d = Store.daily[dctx.date];
  if (!d) { nav("#/daily"); return; }
  let i = dctx.done;
  while (i < d.ids.length && Store.status(d.ids[i]) === "right") i++;
  if (i >= d.ids.length || d.done >= d.total) { nav("#/daily"); return; }
  dctx.done = i;
  renderQuestionBody(d.ids[i], { dailyCtx: dctx });
}

/* ---------- 错题本 / 复习清单 ---------- */
function renderWrong() {
  const wrongIds = Object.keys(Store.records).filter(id => BY_ID[id] && Store.records[id].status === "wrong");
  const reviewIds = QUESTIONS.filter(q => Store.marks[q.id] === "review").map(q => q.id);
  const unknownIds = QUESTIONS.filter(q => Store.marks[q.id] === "unknown").map(q => q.id);

  $app.innerHTML = `
    <div class="page-head">
      <h1>错题本 · 复习</h1>
      <p class="sub">做错过的题，与标记「需复习 / 暂不会」的题</p>
    </div>

    <div class="card">
      <h2>做错的题 <span class="pill bad">${wrongIds.length}</span></h2>
      <p class="desc">重做一次答对即移出错题本</p>
      <div id="wList"></div>
      ${wrongIds.length ? `<button class="btn" id="redoWrong" style="margin-top:12px">刷错题（${wrongIds.length}）</button>` : ""}
    </div>

    <div class="card">
      <h2>需复习 <span class="pill warn">${reviewIds.length}</span></h2>
      <div id="rList" style="margin-top:8px"></div>
      ${reviewIds.length ? `<button class="btn" id="goReview" style="margin-top:12px">开始复习（${reviewIds.length}）</button>` : ""}
    </div>

    <div class="card">
      <h2>暂不会 <span class="pill gray">${unknownIds.length}</span></h2>
      <div id="uList" style="margin-top:8px"></div>
      ${unknownIds.length ? `<button class="btn" id="goUnknown" style="margin-top:12px">攻克暂不会（${unknownIds.length}）</button>` : ""}
    </div>`;

  const mkList = (ids, mountId) => {
    const m = document.getElementById(mountId);
    if (!ids.length) { m.innerHTML = '<p class="muted">暂无</p>'; return; }
    ids.forEach(id => {
      const q = BY_ID[id];
      const row = document.createElement("div");
      row.className = "qlist-item";
      row.innerHTML = `<div class="qtext">${esc(q.question.split("\n")[0])}</div><span class="qid">${id}</span>`;
      row.onclick = () => nav("#/q?id=" + id);
      m.appendChild(row);
    });
  };
  mkList(wrongIds, "wList");
  mkList(reviewIds, "rList");
  mkList(unknownIds, "uList");

  const bind = (elId, fn) => { const el = document.getElementById(elId); if (el) el.onclick = fn; };
  bind("redoWrong", () => startPracticeList("错题重刷", wrongIds));
  bind("goReview", () => startPracticeList("复习清单", reviewIds));
  bind("goUnknown", () => startPracticeList("暂不会", unknownIds));
}

function startPracticeList(setName, ids) {
  if (!ids.length) return toast("列表为空");
  Store.saveCurrent(setName, ids, 0);
  nav(`#/practice?mode=resume&set=${encodeURIComponent(setName)}`);
}

/* ---------- 统计 ---------- */
function renderStats() {
  const total = QUESTIONS.length;
  const recs = Object.entries(Store.records).filter(([id]) => BY_ID[id]);
  const right = recs.filter(([, r]) => r.status === "right").length;
  const wrong = recs.filter(([, r]) => r.status === "wrong").length;
  const marks = Object.keys(Store.marks).filter(id => BY_ID[id]).length;

  const byTopic = TOPICS.map(tp => {
    const qs = QUESTIONS.filter(q => q.topic === tp);
    const rs = qs.filter(q => Store.records[q.id]?.status === "right").length;
    return { tp, total: qs.length, right: rs, pct: qs.length ? Math.round(rs / qs.length * 100) : 0 };
  });

  const days = Object.keys(Store.daily).sort().reverse().slice(0, 14);

  $app.innerHTML = `
    <div class="page-head">
      <h1>统计</h1>
      <p class="sub">正确率、专题分布与打卡记录</p>
    </div>

    <div class="statrow" style="padding-bottom:40px">
      <div class="stat"><div class="stat-num">${right}</div><div class="stat-label">已掌握</div></div>
      <div class="stat"><div class="stat-num">${wrong}</div><div class="stat-label">做错过</div></div>
      <div class="stat"><div class="stat-num">${marks}</div><div class="stat-label">待复习/暂不会</div></div>
    </div>

    <div class="card">
      <h2>专题正确率</h2>
      <div style="margin-top:16px">
      ${byTopic.map(t => `
        <div class="topic-row">
          <div class="name">${esc(t.tp)}</div>
          <div class="bar"><i style="width:${t.pct}%"></i></div>
          <div class="pct">${t.right}/${t.total} · ${t.pct}%</div>
        </div>`).join("")}
      </div>
    </div>

    <div class="card">
      <h2>打卡记录</h2>
      <table class="stats">
        <tr><th>日期</th><th>进度</th></tr>
        ${days.map(d => `<tr><td>${d}</td><td>${Store.daily[d].done}/${Store.daily[d].total}</td></tr>`).join("") || '<tr><td colspan="2" class="muted">还没有打卡记录</td></tr>'}
      </table>
    </div>

    <div class="card">
      <h2>清空数据</h2>
      <p class="desc">删除本机所有刷题记录，不可恢复。</p>
      <button class="btn ghost" id="resetBtn" style="color:var(--bad)">清空全部记录</button>
    </div>`;

  document.getElementById("resetBtn").onclick = () => {
    if (confirm("确定清空全部刷题记录？")) { Store.reset(); toast("已清空"); renderStats(); }
  };
}

/* ---------- 搜索 ---------- */
function renderSearch() {
  const { params } = parseHash();
  const kw = (params.get("kw") || "").trim().toLowerCase();
  const hit = kw
    ? QUESTIONS.filter(q =>
        q.question.toLowerCase().includes(kw) ||
        q.topic.toLowerCase().includes(kw) ||
        (q.tags || []).some(t => t.toLowerCase().includes(kw)) ||
        (q.explanation || "").toLowerCase().includes(kw))
    : [];

  $app.innerHTML = `
    <div class="page-head">
      <h1>搜索「${esc(kw)}」</h1>
      <p class="sub">${kw ? `找到 ${hit.length} 道题` : "按题干 / 专题 / 标签 / 解析搜索"}</p>
    </div>
    <div class="card">
      <div id="sList"></div>
    </div>`;
  const m = document.getElementById("sList");
  hit.forEach(q => {
    const row = document.createElement("div");
    row.className = "qlist-item";
    row.innerHTML = `<div class="qtext">${esc(q.question.split("\n")[0])}</div><span class="pill gray">${esc(q.topic)}</span>`;
    row.onclick = () => nav("#/q?id=" + q.id);
    m.appendChild(row);
  });
  if (kw && !hit.length) m.innerHTML = '<p class="muted">没有匹配的题目</p>';
}

/* ---------- 路线图 ---------- */
function renderRoadmap() {
  // 展开状态跨重渲染保留（本次页面会话内）
  if (!renderRoadmap.expanded) renderRoadmap.expanded = new Set();
  const expanded = renderRoadmap.expanded;

  $app.innerHTML = `
    <div class="page-head">
      <p class="eyebrow">学习路线</p>
      <h1>从基础到实战。</h1>
      <p class="sub">3 个阶段 15 个模块：组合逻辑 → 时序原语 → 编码六件套。点击阶段卡片展开模块。</p>
    </div>
    <div id="roadCard" style="padding-top:12px"></div>`;
  const card = document.getElementById("roadCard");
  ROADMAP.forEach((step, i) => {
    const qs = QUESTIONS.filter(q => step.topics.includes(q.topic));
    const done = qs.filter(q => Store.records[q.id]).length;
    const pct = qs.length ? Math.round(done / qs.length * 100) : 0;
    const stepEl = document.createElement("div");
    stepEl.className = "road-step" + (expanded.has(i) ? " open" : "");

    // 模块行（展开区）
    const modRows = step.topics.map(tp => {
      const tqs = QUESTIONS.filter(q => q.topic === tp);
      const tdone = tqs.filter(q => Store.records[q.id]).length;
      const tpct = tqs.length ? Math.round(tdone / tqs.length * 100) : 0;
      const tpState = tdone === 0 ? "gray" : tpct >= 100 ? "ok" : "warn";
      return `
        <div class="module-row" data-tp="${esc(tp)}">
          <span class="m-name">${esc(tp)}</span>
          <span class="pill ${tpState}">${tdone}/${tqs.length}</span>
          <span class="m-bar"><div class="bar"><i style="width:${tpct}%"></i></div></span>
          <span class="m-go">开始 ›</span>
        </div>`;
    }).join("");

    stepEl.innerHTML = `
      <div class="road-rail">
        <div class="road-dot ${pct >= 100 ? "done" : ""}">${pct >= 100 ? "✓" : i + 1}</div>
        ${i < ROADMAP.length - 1 ? '<div class="road-line"></div>' : ""}
      </div>
      <div class="road-body">
        <div class="road-head">
          <h3>${esc(step.name)} <span class="pill ${pct >= 100 ? "ok" : "gray"}">${done}/${qs.length}</span>
            <span class="road-toggle">▶</span></h3>
          <p>${esc(step.desc)}</p>
          <div class="bar"><i style="width:${pct}%"></i></div>
        </div>
        <div class="road-modules">${modRows}</div>
      </div>`;
    stepEl.querySelector(".road-head").onclick = () => {
      expanded.has(i) ? expanded.delete(i) : expanded.add(i);
      renderRoadmap();
    };
    stepEl.querySelectorAll(".module-row").forEach(row => {
      row.onclick = () => nav("#/topic?name=" + encodeURIComponent(row.dataset.tp));
    });
    card.appendChild(stepEl);
  });
}

/* ---------- SystemVerilog 轻量语法高亮 ---------- */
function highlightSV(src) {
  const KEYWORDS = new Set(("always always_comb always_ff always_latch and assign automatic begin bit break buf case casex casez cell" +
    " cmos config deassign default defparam design disable edge else end endcase endconfig endfunction endgenerate endinterface" +
    " endmodule endpackage endprimitive endprogram endspecify endtable endtask enum event for force forever fork function generate" +
    " genvar highz0 highz1 if ifnone incdir include initial inout input instance integer interface join join_any join_none large" +
    " liblist library localparam logic longint macromodule medium module nand negedge nmos nor noshowcancelled not notif0 notif1" +
    " or output parameter pmos posedge primitive pull0 pull1 pulldown pullup pulsestyle_onevent pulsestyle_ondetect rcmos real realtime" +
    " reg release repeat rnmos rpmos rtran rtranif0 rtranif1 scalared signed small specify specparam strong0 strong1 supply0 supply1" +
    " table task time tran tranif0 tranif1 tri tri0 tri1 triand trior trireg unsigned use uwire vectored wait wand weak0 weak1 while" +
    " wire wor xnor xor struct typedef unique priority return void").split(" "));
  const out = [];
  let i = 0, n = src.length;
  const push = (txt, cls) => out.push(cls ? `<span class="tok-${cls}">${esc(txt)}</span>` : esc(txt));
  while (i < n) {
    const ch = src[i];
    // comments
    if (ch === "/" && src[i + 1] === "/") {
      let j = src.indexOf("\n", i); if (j < 0) j = n;
      push(src.slice(i, j), "com"); i = j; continue;
    }
    if (ch === "/" && src[i + 1] === "*") {
      let j = src.indexOf("*/", i + 2); j = j < 0 ? n : j + 2;
      push(src.slice(i, j), "com"); i = j; continue;
    }
    // strings
    if (ch === '"') {
      let j = i + 1;
      while (j < n && src[j] !== '"') { if (src[j] === "\\") j++; j++; }
      push(src.slice(i, Math.min(j + 1, n)), "str"); i = j + 1; continue;
    }
    // based numbers: 4'b1010, 8'hFF, 'd10, 1'b1, 'b0
    let m = /^(\d*)'([bodhBODH])([0-9a-fA-FxXzZ_?]+)/.exec(src.slice(i));
    if (m) { push(m[0], "num"); i += m[0].length; continue; }
    // plain decimal numbers
    m = /^\d[\d_]*(\.\d+)?/.exec(src.slice(i));
    if (m) { push(m[0], "num"); i += m[0].length; continue; }
    // identifiers / keywords / system tasks
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const word = src.slice(i, j);
      if (word[0] === "$") push(word, "sys");
      else if (KEYWORDS.has(word.toLowerCase())) push(word, "kw");
      else if (/^[A-Z][A-Z0-9_]*$/.test(word)) push(word, "const");
      else push(word);
      i = j; continue;
    }
    // operators: multi-char first
    const two = src.slice(i, i + 2);
    if (["<=", ">=", "==", "!=", "&&", "||", "<<", ">>", "==="].includes(two) || (ch === "=" && src[i + 1] === "=")) {
      push(two, "op"); i += 2; continue;
    }
    if ("=+-*/%!<>&|^~?:@#.".includes(ch)) { push(ch, "op"); i++; continue; }
    push(ch); i++;
  }
  return out.join("");
}
function codeBlock(src) {
  return `<pre class="code">${highlightSV(src)}</pre>`;
}

document.getElementById("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  const kw = document.getElementById("searchInput").value.trim();
  nav("#/search?kw=" + encodeURIComponent(kw));
});

/* ---------- 启动 ---------- */
if (!location.hash) location.hash = "#/";
router();

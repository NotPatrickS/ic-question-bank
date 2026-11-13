/* ====== localStorage 进度存储 ====== */
const Store = (() => {
  const KEY = "icqb_v1";
  let state = load();

  function defaults() {
    return {
      records: {},     // id -> { status: "right"|"wrong"|"skip", ts, tries }
      marks: {},       // id -> "review" | "unknown"  (需复习 / 暂不会)
      daily: {},       // "YYYY-MM-DD" -> { ids: [...], done: n, total }
      streak: { last: "", count: 0 },
      current: {},     // setId -> { order: [ids], pos, seed } 继续上次学习
      updated_at: ""   // 云同步时间戳：持久化保存，仅在 save() 时刷新
    };
  }

  function load() {
    try {
      return Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || "{}"));
    } catch { return defaults(); }
  }
  function save() {
    state.updated_at = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(state));
    if (typeof Cloud !== "undefined") Cloud.schedulePush();  // 已登录时自动上传
  }

  return {
    get records() { return state.records; },
    get marks() { return state.marks; },
    get daily() { return state.daily; },
    get streak() { return state.streak; },

    status(id) { const r = state.records[id]; return r ? r.status : null; },
    record(id, status) {
      const r = state.records[id] || { tries: 0 };
      state.records[id] = { status, ts: Date.now(), tries: r.tries + 1 };
      save();
    },
    statsOf(id) { return state.records[id] || null; },

    mark(id, kind) {
      if (kind && state.marks[id] === kind) delete state.marks[id];
      else if (kind) state.marks[id] = kind;
      else delete state.marks[id];
      save();
    },

    /* 继续上次学习 */
    saveCurrent(setId, order, pos) {
      state.current[setId] = { order, pos, ts: Date.now() };
      save();
    },
    getCurrent(setId) { return state.current[setId] || null; },
    latestCurrent() {
      let best = null;
      for (const [sid, c] of Object.entries(state.current)) {
        if (!c) continue;
        if (!best || c.ts > best.ts) best = { setId: sid, ...c };
      }
      return best;
    },

    /* 每日打卡 */
    ensureDaily(dateStr, ids) {
      if (!state.daily[dateStr]) {
        state.daily[dateStr] = { ids, done: 0, total: ids.length };
        save();
      }
      return state.daily[dateStr];
    },
    dailyDone(dateStr, id, ok) {
      const d = state.daily[dateStr];
      if (!d) return;
      state.records[id] = { status: ok ? "right" : "wrong", ts: Date.now(), tries: (state.records[id]?.tries || 0) + 1 };
      d.done = Math.min(d.total, d.done + 1);
      // 连续打卡
      const s = state.streak;
      const today = dateStr;
      const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      if (d.done >= d.total) {
        if (s.last === yesterday) { s.count += 1; s.last = today; }
        else if (s.last !== today) { s.count = 1; s.last = today; }
      }
      save();
    },

    /* ====== 云同步支持 ====== */
    snapshot() {
      // updated_at 已是持久化字段，restore 后不会被刷新，除非本机有新操作
      return JSON.parse(JSON.stringify(state));
    },
    /* 云端恢复到本机（进度、标记、打卡、断点全部生效） */
    restore(data) {
      const base = defaults();
      const merged = Object.assign(base, data || {});
      state = merged;
      // 恢复时直接写 localStorage，不刷新 updated_at、不触发上传
      localStorage.setItem(KEY, JSON.stringify(state));
    },

    reset() { state = defaults(); save(); }
  };
})();

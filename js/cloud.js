/* ====== 账号登录 + 云同步 ======
 * 依赖：sb（js/config.js）、Store（js/store.js）、toast()（js/app.js）
 * Supabase 表 progress：user_id uuid PK, data jsonb, updated_at timestamptz
 */
const Cloud = (() => {
  const SYNC_DELAY = 2500; // 静默 2.5s 后上传，避免答题时频繁请求
  let user = null;
  let syncTimer = null;

  const $ = id => document.getElementById(id);

  /* ---------- 顶栏账号按钮 ---------- */
  function renderAccountBtn() {
    const el = $("accountBtn");
    if (!el) return;
    if (user) {
      const name = user.email.split("@")[0];
      el.textContent = name.length > 12 ? name.slice(0, 11) + "…" : name;
      el.title = "点击查看同步状态 / 退出登录";
    } else {
      el.textContent = "登录";
      el.title = "登录以同步进度";
    }
  }

  async function refreshUser() {
    const { data } = await sb.auth.getSession();
    user = data?.session?.user || null;
    renderAccountBtn();
    return user;
  }

  /* ---------- 云端读写 ---------- */
  async function cloudGet() {
    if (!user) return null;
    const { data, error } = await sb.from("progress").select("data,updated_at").eq("user_id", user.id).maybeSingle();
    if (error) { console.warn("cloudGet:", error.message); return null; }
    return data;
  }

  async function cloudPut(data) {
    const { error } = await sb.from("progress").upsert({ user_id: user.id, data, updated_at: new Date().toISOString() });
    if (error) { console.warn("cloudPut:", error.message); return false; }
    return true;
  }

  /* ---------- 同步调度 ---------- */
  function schedulePush() {
    if (!user) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(pushNow, SYNC_DELAY);
  }

  async function pushNow() {
    if (!user) return;
    setSyncStatus("同步中…", "busy");
    const ok = await cloudPut(Store.snapshot());
    setSyncStatus(ok ? "已同步 ✓" : "同步失败", ok ? "ok" : "bad");
  }

  function setSyncStatus(text, kind) {
    const el = $("syncStatus");
    if (!el) return;
    el.textContent = text;
    el.className = "sync-status " + (kind || "");
    clearTimeout(setSyncStatus._t);
    setSyncStatus._t = setTimeout(() => { el.textContent = ""; el.className = "sync-status"; }, 2600);
  }

  /* ---------- 登录 modal ---------- */
  function openAuthModal() {
    if (user) { openSyncPanel(); return; }
    const wrap = document.createElement("div");
    wrap.className = "modal-mask";
    wrap.innerHTML = `
      <div class="modal">
        <button class="modal-x" aria-label="关闭">×</button>
        <p class="modal-title">登录 IC 题库</p>
        <p class="modal-sub">一个账号，电脑手机进度同步。</p>
        <form id="authForm">
          <input class="field" id="authEmail" type="email" placeholder="邮箱" autocomplete="email" required>
          <input class="field" id="authPwd" type="password" placeholder="密码（至少 6 位）" autocomplete="current-password" required minlength="6">
          <p class="auth-err" id="authErr"></p>
          <button class="btn full" id="authGo" type="submit">登录 / 注册</button>
          <p class="auth-hint">新邮箱将自动注册 · 密码至少 6 位</p>
        </form>
      </div>`;
    wrap.querySelector(".modal-x").onclick = () => wrap.remove();
    wrap.onclick = e => { if (e.target === wrap) wrap.remove(); };
    wrap.querySelector("#authForm").onsubmit = async e => {
      e.preventDefault();
      const errEl = $("authErr"), goBtn = $("authGo");
      errEl.textContent = "";
      goBtn.disabled = true; goBtn.textContent = "请稍候…";
      const email = $("authEmail").value.trim();
      const pwd = $("authPwd").value;
      const res = await sb.auth.signInWithPassword({ email, password: pwd });
      if (!res.error) { wrap.remove(); afterLogin(); return; }
      // 登录失败 → 当作新用户尝试注册
      const su = await sb.auth.signUp({ email, password: pwd });
      if (su.error) {
        errEl.textContent = mapErr(su.error.message);
        goBtn.disabled = false; goBtn.textContent = "登录 / 注册";
      } else if (su.data.session) {
        wrap.remove(); afterLogin();
      } else {
        wrap.remove();
        toast("验证邮件已发送，请查收后再登录");
      }
    };
    document.body.appendChild(wrap);
  }

  /* ---------- 启动时拉取（会话恢复场景） ---------- */
  async function pullOnBoot() {
    const local = Store.snapshot();
    const remote = await cloudGet();
    if (!remote || !remote.data) return;
    const remoteData = remote.data;
    if (JSON.stringify(stripMeta(remoteData)) === JSON.stringify(stripMeta(local))) return;
    const remoteNewer = (remote.updated_at || "") > (local.updated_at || "");
    if (!remoteNewer) return;             // 本机更新：等下次 save 自动上传
    const localEmpty = !local.records || Object.keys(local.records).length === 0;
    if (localEmpty) {                     // 新设备静默恢复，无需询问
      Store.restore(stripMeta(remoteData));
      router();
      return;
    }
    Store.restore(stripMeta(remoteData)); // 云端更新：静默覆盖本机
    router();
  }

  /* ---------- 登录后：云端拉取 + 冲突选择 ---------- */
  async function afterLogin() {
    await refreshUser(); // modal 登录成功但模块级 user 还没更新，必须先刷新
    renderAccountBtn();
    setSyncStatus("同步中…", "busy");
    const local = Store.snapshot();
    const remote = await cloudGet();
    if (!remote || !remote.data) {
      await cloudPut(local);
      setSyncStatus("已同步 ✓", "ok");
      toast("登录成功，进度已上传");
      return;
    }
    const remoteData = remote.data;
    const remoteNewer = (remote.updated_at || "") > (local.updated_at || "");
    if (JSON.stringify(stripMeta(remoteData)) === JSON.stringify(stripMeta(local))) {
      setSyncStatus("已同步 ✓", "ok");
      toast("登录成功，进度已同步");
      return;
    }
    askMergeChoice(remoteData, local, remoteNewer);
  }

  function stripMeta(s) {
    if (!s || typeof s !== "object") return s;
    const { updated_at, ...rest } = s;
    return rest;
  }

  function askMergeChoice(remoteData, local, remoteNewer) {
    const wrap = document.createElement("div");
    wrap.className = "modal-mask";
    wrap.innerHTML = `
      <div class="modal">
        <p class="modal-title">云端与本机进度不一致</p>
        <p class="modal-sub">云端最后更新：${fmtTime(remoteData.updated_at)}<br>本机最后更新：${fmtTime(local.updated_at)}</p>
        <button class="btn full" id="mkRemote">使用云端${remoteNewer ? "（较新）" : ""}</button>
        <button class="btn full ghost" id="mkLocal">保留本机，覆盖云端${remoteNewer ? "" : "（较新）"}</button>
      </div>`;
    wrap.querySelector("#mkRemote").onclick = async () => {
      Store.restore(stripMeta(remoteData));
      await cloudPut(Store.snapshot());
      wrap.remove();
      toast("已恢复云端进度");
      router();
    };
    wrap.querySelector("#mkLocal").onclick = async () => {
      await cloudPut(Store.snapshot());
      wrap.remove();
      toast("本机进度已上传");
    };
    document.body.appendChild(wrap);
  }

  function fmtTime(iso) {
    if (!iso) return "未知";
    try { return new Date(iso).toLocaleString("zh-CN", { hour12: false }); } catch { return iso; }
  }

  /* ---------- 已登录：同步面板（点击顶栏账号名时） ---------- */
  function openSyncPanel() {
    const wrap = document.createElement("div");
    wrap.className = "modal-mask";
    wrap.innerHTML = `
      <div class="modal">
        <button class="modal-x" aria-label="关闭">×</button>
        <p class="modal-title">${esc(user.email)}</p>
        <p class="modal-sub">进度自动同步到云端</p>
        <button class="btn full" id="syncNowBtn">立即同步</button>
        <button class="btn full ghost" id="logoutBtn" style="color:var(--bad)">退出登录</button>
        <p class="auth-hint">退出后本机数据保留，可随时重新登录恢复。</p>
      </div>`;
    wrap.querySelector(".modal-x").onclick = () => wrap.remove();
    wrap.onclick = e => { if (e.target === wrap) wrap.remove(); };
    wrap.querySelector("#syncNowBtn").onclick = async () => { wrap.remove(); await pushNow(); };
    wrap.querySelector("#logoutBtn").onclick = async () => {
      await pushNow();          // 退出前确保云端是最新
      await sb.auth.signOut();
      user = null;
      renderAccountBtn();
      wrap.remove();
      toast("已退出登录（本机数据保留）");
    };
    document.body.appendChild(wrap);
  }

  /* ---------- 错误信息中文化 ---------- */
  function mapErr(message) {
    const t = {
      "Invalid login credentials": "邮箱或密码错误",
      "Email not confirmed": "邮箱未验证，请先查收验证邮件",
      "Email rate limit exceeded": "操作太频繁，请稍后再试",
      "Signups not allowed": "该项目暂未开放注册",
      "User already registered": "该邮箱已注册但密码错误",
      "Password should be at least 6 characters": "密码至少 6 位",
      "unable to validate email": "邮箱格式不正确"
    };
    return t[message] || message;
  }

  return {
    init: refreshUser,
    getUser: () => user,
    openAuthModal,
    schedulePush,
    pushNow,
    pullOnBoot
  };
})();

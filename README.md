# IC 刷题 · 个人题库

参考 tongxintongxing.com 的功能做一个纯静态个人刷题站。零依赖、零构建，双击 `index.html` 即可使用。

## 功能

- **我的学习**：总进度、待复习数、继续上次学习
- **专题刷题**：按专题顺序刷 / 随机刷 / 只刷错题
- **每日打卡**：每天自动抽 5 题，记录连续打卡天数
- **错题本**：做错的题自动入本，重做答对自动移出
- **标记系统**：每题可标记「需复习 / 暂不会」，首页聚合待复习数
- **搜索**：按题干 / 专题 / 标签 / 解析搜索
- **统计**：专题正确率、打卡记录、清空数据
- **学习路线图**：6 站路线，按进度点亮

## 使用

```bash
# 方式一：直接双击 index.html
open index.html

# 方式二：本地服务器（推荐）
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

进度保存在浏览器 localStorage，换设备/清浏览器数据会丢失。

## 加题

编辑 [js/data.js](js/data.js)，向 `QUESTIONS` 数组追加：

```js
{
  id: "v-020",              // 唯一 ID
  topic: "状态机设计",        // 专题名（新专题会自动出现在首页）
  type: "choice",           // "choice" 单选 | "judge" 简答自评
  question: "题干…",
  options: ["A…", "B…", "C…", "D…"],  // choice 必填
  answer: 1,                // 正确选项下标（0 起）
  answer_ref: "参考答案…",   // judge 必填
  explanation: "解析…",
  code: "可选：题干下的代码段",
  tags: ["高频", "CDC"]
}
```

专题和路线图分类在 `js/data.js` 顶部的 `QUESTIONS` / `ROADMAP` 中配置，加题不需要改任何其他代码。

## 部署

整个目录是纯静态站，可直接推到 GitHub Pages / Vercel / Netlify：

```bash
cd question-bank
git init && git add . && git commit -m "init question bank"
gh repo create ic-question-bank --public --source=. --push
# GitHub Pages: Settings → Pages → 选 main 分支根目录
```

## 目录结构

```text
question-bank/
├── index.html        # 入口
├── css/style.css     # 样式
├── js/data.js        # 题库 + 路线图（加题改这里）
├── js/store.js       # localStorage 进度存储
└── js/app.js         # 路由与页面渲染
```

/* ============================================================
 * 题库：以「编码能力」为主线的 Verilog 学习路径
 * 阶段0 组合逻辑 M1-M5 → 阶段1 时序原语 M6-M9 → 阶段2 编码六件套
 * 每题：id / topic / type(choice|judge) / question / options / answer
 *      / explanation / answer_ref(judge 手写题参考答案) / code(可选，会高亮)
 * 加题改这里，app.js 不用动。
 * ============================================================ */

const QUESTIONS = [
  /* ================= 阶段0 · M1 基本门与三态 ================= */
  {
    id: "m1-01",
    title: "三态与门",
    topic: "M1 基本门与三态",
    type: "judge",
    question: "手写：模块端口 a、b、sel_in（低有效），实现 y = a 与 b 的与，再经 sel_in 控制的三态输出（sel_in=0 时输出有效）。",
    starter: "// 低有效使能的三态与门\nmodule tri_and(\n  input  wire a, b,\n  input  wire sel_in,   // 低有效\n  output wire y\n);\n  wire and_out = a & b;\n  // TODO: 在下方补全三态输出（提示：sel_in=0 时输出有效，无效时输出 1'bz）\n\nendmodule",
    checks: [
      { desc: "声明了 y 的驱动语句（assign 或 always 块）", re: "assign\\s+y\\s*=|always\\s*@\\s*\\(\\s*\\*\\s*\\)" },
      { desc: "自己写出与运算并驱动 y", re: "assign\\s+y\\s*=.*&|y\\s*(<=|=)\\s*and_out" },
      { desc: "无效时输出高阻 1'bz", re: "1\\s*'{\\s*b\\s*[zZ]|'bz" },
      { desc: "用低有效判断（!sel_in / ~sel_in / sel_in == 1'b0）", re: "!\\s*sel_in|~\\s*sel_in|sel_in\\s*==\\s*1\\s*'b0" }
    ],
    solution: "module tri_and(\n  input  wire a, b,\n  input  wire sel_in,\n  output wire y\n);\n  assign y = (!sel_in) ? (a & b) : 1'bz;\n  // 或 assign y = (!sel_in) ? a & b : 1'bz;\nendmodule",
    explanation: "三态门 = 组合结果 + 使能选择 1'bz。低有效使能判断 !sel_in。",
    tags: ["手写", "三态"]
  },
  {
    id: "m1-02",
    title: "与门 wire 声明",
    topic: "M1 基本门与三态",
    type: "choice",
    question: "用 assign 描述一个与门 y = a & b，y 应该声明为什么类型？",
    options: ["reg", "wire", "logic 且必须过程赋值", "integer"],
    answer: 1,
    explanation: "assign 连续赋值驱动的是线网类型，最典型的是 wire。reg 表示过程赋值目标，不能被 assign 驱动。",
    code: "module and_gate(\n  input  wire a, b,\n  output wire y\n);\n  assign y = a & b;\nendmodule",
    tags: ["组合逻辑", "基础"]
  },
  {
    id: "m1-03",
    title: "三态输出写法",
    topic: "M1 基本门与三态",
    type: "choice",
    question: "下列哪种写法能实现高电平使能的三态输出（使能无效时输出悬空）？",
    options: [
      "assign y = en ? a : 1'b0;",
      "assign y = en ? a : 1'bz;",
      "assign y = en ? a : 1'bx;",
      "assign y = a & en;"
    ],
    answer: 1,
    explanation: "三态的本质是输出高阻态 1'bz。en 无效时 y = 1'bz，总线交由其他驱动器；1'b0/1'bx/与门都会持续驱动总线。",
    code: "assign y = en ? a : 1'bz;   // en=0 时 y 高阻\n// 等价原语：bufif1 b1 (y, a, en);",
    tags: ["组合逻辑", "三态"]
  },
  {
    id: "m1-04",
    title: "多驱动冲突",
    topic: "M1 基本门与三态",
    type: "choice",
    question: "两个 assign 同时驱动同一个 wire（一个输出 1，一个输出 0），仿真和综合分别会怎样？",
    options: [
      "仿真得 x，综合报多驱动错误或生成有损结构",
      "仿真取最后一个 assign 的值，综合无影响",
      "仿真和综合都自动线与",
      "仿真、综合都不会有任何异常"
    ],
    answer: 0,
    explanation: "1 与 0 同时驱动 1 位线网，仿真中解析为未知态 x；综合时这是总线冲突，通常直接报错，或按工艺生成有损/非法结构。三态总线只允许「同时至多一个有效驱动」。",
    tags: ["组合逻辑", "多驱动"]
  },
  {
    id: "m1-05",
    title: "wire 与 reg 区别",
    topic: "M1 基本门与三态",
    type: "choice",
    question: "关于 wire 与 reg，下列说法正确的是？",
    options: [
      "wire 只能组合，reg 一定是触发器",
      "reg 被过程赋值（always/initial）驱动，是否综合成触发器取决于代码是否在时钟沿敏感",
      "组合 always 块里的 reg 会综合成锁存器",
      "wire 可以在 always 块内被赋值"
    ],
    answer: 1,
    explanation: "reg/wire 是仿真语义：reg=过程赋值目标。always @(*) 中的 reg 综合成纯组合逻辑，always @(posedge clk) 中才是触发器；只有分支不完整才会意外生成锁存器。always 块内不能对 wire 过程赋值。",
    tags: ["基础", "wire与reg"]
  },

  /* ================= 阶段0 · M2 多路选择器 ================= */
  {
    id: "m2-01",
    title: "三风格 2 选 1 MUX",
    topic: "M2 多路选择器",
    type: "judge",
    question: "手写：分别用三种风格实现 2 选 1 MUX（a、b、sel → y）：① assign + 条件运算符；② always @(*) + if-else；③ always @(*) + case。",
    starter: "// 2 选 1 MUX：sel=0 选 a，sel=1 选 b\nmodule mux2(\n  input  wire a, b, sel,\n  output wire y\n);\n  // TODO: 用 assign 或 always @(*) 实现选择（可写三种风格）\n\nendmodule",
    checks: [
      { desc: "写出 assign y = ... 的实现", re: "assign\\s+y\\s*=" },
      { desc: "用到了条件选择（?: / if / case）", re: "\\?|if\\s*\\(|case\\s*\\(" },
      { desc: "选择端 sel 参与 y 的决策", re: "sel" }
    ],
    solution: "// ① assign\ndefault clocking; endmodule\nmodule mux2_a(\n  input wire a, b, sel,\n  output wire y\n);\n  assign y = sel ? b : a;\nendmodule\n\n// ② if-else\nmodule mux2_b(\n  input wire a, b, sel,\n  output reg y\n);\n  always @(*)\n    if (sel) y = b;\n    else     y = a;\nendmodule\n\n// ③ case\nmodule mux2_c(\n  input wire a, b, sel,\n  output reg y\n);\n  always @(*) begin\n    case (sel)\n      1'b1:    y = b;\n      default: y = a;\n    endcase\n  end\nendmodule",
    explanation: "MUX 是组合逻辑的三种标准写法训练：assign 表达式、if-else、case。注意 ②③ 中 y 是 reg，但综合出来仍是组合逻辑。",
    tags: ["手写", "MUX"]
  },
  {
    id: "m2-02",
    title: "MUX case 完整性",
    topic: "M2 多路选择器",
    type: "choice",
    question: "4 选 1 MUX 用 case(sel) 实现，若 case 分支只写了 2'b00、2'b01、2'b10 三种，sel=2'b11 时输出？",
    options: [
      "自动输出 0",
      "保持上一次的值（组合 always 中即为锁存器）",
      "编译错误",
      "输出 x"
    ],
    answer: 1,
    explanation: "组合 always 中 case 分支不全且无 default，工具会「保持原值」，综合出锁存器。mux/译码类组合逻辑务必补 default 分支。",
    code: "always @(*) begin\n  case (sel)\n    2'b00: y = a;\n    2'b01: y = b;\n    2'b10: y = c;\n    // 缺 2'b11 → latch!\n  endcase\nend",
    tags: ["组合逻辑", "latch"]
  },
  {
    id: "m2-03",
    title: "MUX 条件等价式",
    topic: "M2 多路选择器",
    type: "choice",
    question: "下列哪个表达式与「sel 为真选 b 否则选 a」不等价？",
    options: [
      "sel ? b : a",
      "(sel & b) | (~sel & a)",
      "(sel == 1'b1) ? b : a",
      "sel | b"
    ],
    answer: 3,
    explanation: "sel | b 是或运算：sel=1 时输出恒 1，与 b 无关，不是选择。位选表达式 (sel&b)|(~sel&a) 才是 1 位 MUX 的门级形式。",
    tags: ["组合逻辑", "运算符"]
  },
  {
    id: "m2-04",
    title: "8 选 1 位选择",
    topic: "M2 多路选择器",
    type: "judge",
    question: "手写：8 选 1 MUX，数据输入 d[7:0]，选择信号 sel[2:0]，要求用变量位选择一行 assign 实现（提示：d[sel]）。",
    starter: "// 8 选 1 MUX：一行 assign\nmodule mux8(\n  input  wire [7:0] d,\n  input  wire [2:0] sel,\n  output wire y\n);\n  // TODO: 用变量位选择实现（提示：d[sel]）\n\nendmodule",
    checks: [
      { desc: "用 assign 驱动 y", re: "assign\\s+y\\s*=" },
      { desc: "用到了变量位选择 d[sel]", re: "d\\s*\\[\\s*sel\\s*\\]" }
    ],
    solution: "assign y = d[sel];",
    explanation: "变量索引 d[sel] 综合为多路选择器；比写 8 个分支的 case 简洁，综合结果相同。",
    tags: ["手写", "MUX"]
  },

  /* ================= 阶段0 · M3 译码器与优先编码器 ================= */
  {
    id: "m3-01",
    title: "3-8 译码器",
    topic: "M3 译码与优先编码",
    type: "judge",
    question: "手写：3-8 译码器，输入 sel[2:0]、使能 en（高有效），输出 onehot[7:0]（en 无效时输出全 0）。",
    starter: "// 3-8 译码器：en 无效输出全 0\nmodule dec3to8(\n  input  wire       en,\n  input  wire [2:0] sel,\n  output reg  [7:0] onehot\n);\n  always @(*) begin\n    // TODO: 先给默认值，再置位 onehot[sel]\n\n  end\nendmodule",
    checks: [
      { desc: "always 块里先给默认值 onehot = 8'b0（防 latch）", re: "onehot\\s*(<=|=)\\s*8\\s*'{\\s*b\\s*0" },
      { desc: "判断了使能 en", re: "if\\s*\\(\\s*en|\\ben\\b" },
      { desc: "用变量索引置位 onehot[sel]", re: "onehot\\s*\\[\\s*sel\\s*\\]\\s*(<=|=)\\s*1\\s*'b1" }
    ],
    solution: "always @(*) begin\n  onehot = 8'b0;            // 默认值\n  if (en) onehot[sel] = 1'b1;\nend",
    explanation: "先给默认值再覆盖，是最稳的组合写法；onehot[sel] 用变量位选，en 无效时保持全 0。",
    tags: ["手写", "译码器"]
  },
  {
    id: "m3-02",
    title: "优先编码器结构",
    topic: "M3 译码与优先编码",
    type: "choice",
    question: "8-3 优先编码器要求「数值最大的请求优先」，输入 req[7:0]（1 有效），应优先使用哪种结构？",
    options: [
      "case (req) 列出 256 种取值",
      "if-else 链从 req[7] 开始向下判断",
      "for 循环从 req[0] 开始向上判断",
      "直接 y = req[7:5]"
    ],
    answer: 1,
    explanation: "优先级 = if-else 的判定顺序。从最高位开始向下判断，先命中者优先；case 表达优先级需要 priority/casez 技巧，256 分支也不现实。",
    tags: ["优先编码器"]
  },
  {
    id: "m3-03",
    title: "casez 通配分支",
    topic: "M3 译码与优先编码",
    type: "choice",
    question: "casez 中，分支写成 4'b1??? 表示？",
    options: [
      "只匹配 4'b1000",
      "高位为 1 的任意取值都匹配（? 是不关心位）",
      "语法错误",
      "匹配所有输入"
    ],
    answer: 1,
    explanation: "casez 把 z 和 ? 视为不关心位，用于按前缀匹配；这是表达优先级结构的常用手法。casex 更激进（x 也匹配），仿真中容易掩盖真实 x，工程上更推荐 casez。",
    code: "casez (req)\n  4'b1???: grant = 4'b1000;\n  4'b01??: grant = 4'b0100;\n  4'b001?: grant = 4'b0010;\n  4'b0001: grant = 4'b0001;\n  default: grant = 4'b0;\nendcase",
    tags: ["casez", "优先编码器"]
  },
  {
    id: "m3-04",
    title: "4-2 优先编码器",
    topic: "M3 译码与优先编码",
    type: "judge",
    question: "手写：4-2 优先编码器，输入 req[3:0]（1 有效，req[3] 优先级最高），输出 code[1:0] 和 valid（无请求时 valid=0）。用 casez 实现。",
    starter: "// 4-2 优先编码器：req[3] 优先级最高\nmodule prio_enc4(\n  input  wire [3:0] req,\n  output reg  [1:0] code,\n  output reg        valid\n);\n  always @(*) begin\n    // TODO: 用 casez 前缀匹配实现优先级\n\n  end\nendmodule",
    checks: [
      { desc: "使用了 casez 做前缀匹配（或 if-else 优先级链）", re: "casez\\s*\\(|if\\s*\\(" },
      { desc: "用 ? 通配低位（如 4'b1???）或明确优先级顺序", re: "\\?|req\\s*\\[\\s*3\\s*\\]" },
      { desc: "无请求时 valid = 0（默认值或分支覆盖）", re: "valid\\s*(<=|=)\\s*1\\s*'{\\s*b\\s*0|default" }
    ],
    solution: "always @(*) begin\n  code  = 2'b00;   // 默认\n  valid = 1'b0;\n  casez (req)\n    4'b1???: begin code = 2'd3; valid = 1'b1; end\n    4'b01??: begin code = 2'd2; valid = 1'b1; end\n    4'b001?: begin code = 2'd1; valid = 1'b1; end\n    4'b0001: begin code = 2'd0; valid = 1'b1; end\n  endcase\nend",
    explanation: "casez 前缀匹配天然表达优先级；default 分支保证组合逻辑无 latch。",
    tags: ["手写", "casez"]
  },

  /* ================= 阶段0 · M4 加法器与比较器 ================= */
  {
    id: "m4-01",
    title: "全加器与行波进位",
    topic: "M4 加法与比较",
    type: "judge",
    question: "手写：全加器 fa(a, b, cin → sum, cout)，再用结构化方式例化两个 fa 组成 2 位行波加法器 add2(x[1:0], y[1:0] → s[1:0], co)。",
    starter: "// 全加器 + 2 位行波加法器\nmodule fa(\n  input  wire a, b, cin,\n  output wire sum, cout\n);\n  // TODO: 写出 sum 与 cout 的表达式\n\nendmodule\n\nmodule add2(\n  input  wire [1:0] x, y,\n  output wire [1:0] s,\n  output wire co\n);\n  wire c1;\n  // TODO: 例化两个 fa，逐级传递进位\n\nendmodule",
    checks: [
      { desc: "sum = a ^ b ^ cin", re: "sum\\s*=|sum\\s*<=" },
      { desc: "cout 含多数表决（(a&b)|(b&cin)|(a&cin) 或位拼接加法）", re: "&\\s*|\\{.*cout|\\+" },
      { desc: "add2 里例化了两个 fa（fa u0 / fa u1 之类）", re: "fa\\s+\\w+\\s*\\(" },
      { desc: "低位 cout 接高位 cin（端口连接含 .cin(c1) 或 .cout(c1)）", re: "\\.cin\\s*\\(\\s*c1\\s*\\)|\\.cout\\s*\\(\\s*c1\\s*\\)" }
    ],
    solution: "module fa(\n  input  wire a, b, cin,\n  output wire sum, cout\n);\n  assign sum  = a ^ b ^ cin;\n  assign cout = (a & b) | (b & cin) | (a & cin);\nendmodule\n\nmodule add2(\n  input  wire [1:0] x, y,\n  output wire [1:0] s,\n  output wire co\n);\n  wire c1;\n  fa u0 (.a(x[0]), .b(y[0]), .cin(1'b0), .sum(s[0]), .cout(c1));\n  fa u1 (.a(x[1]), .b(y[1]), .cin(c1),   .sum(s[1]), .cout(co));\nendmodule",
    explanation: "全加器 sum=a^b^cin，cout=ab+cin(a^b)；行波结构逐级传递进位，进位延迟随位宽线性增长——这是理解超前进位（CLA）的动机。",
    tags: ["手写", "加法器"]
  },
  {
    id: "m4-02",
    title: "加法进位位宽",
    topic: "M4 加法与比较",
    type: "choice",
    question: "两个 8 位无符号数 a+b，为使进位 cout 不丢失，正确写法是？",
    options: [
      "wire [7:0] s = a + b; assign cout = s[8];",
      "wire [8:0] s = {1'b0,a} + {1'b0,b}; assign cout = s[8];",
      "assign cout = a[7] & b[7];",
      "直接把 cout 端口接到和的最高位即可"
    ],
    answer: 1,
    explanation: "表达式位宽由 LHS 决定，s 为 8 位时进位被截断。先扩位到 9 位再相加，进位保存在 s[8]。a[7]&b[7] 漏掉「进位传播」的中间进位情况。",
    code: "wire [8:0] s = {1'b0, a} + {1'b0, b};\nassign sum  = s[7:0];\nassign cout = s[8];",
    tags: ["位宽", "加法器"]
  },
  {
    id: "m4-03",
    title: "4 位比较器",
    topic: "M4 加法与比较",
    type: "judge",
    question: "手写：4 位无符号比较器，输出 gt（a>b）、eq、lt，要求写出直接比较式，并附「减法借位」视角的等价实现思路。",
    starter: "// 4 位无符号比较器\nmodule cmp4(\n  input  wire [3:0] a, b,\n  output wire gt, eq, lt\n);\n  // TODO: gt/eq/lt 三个表达式；可再想想减法借位视角\n\nendmodule",
    checks: [
      { desc: "三个输出都有 assign 驱动", re: "assign\\s+gt|assign\\s+eq|assign\\s+lt" },
      { desc: "eq 用全等比较（a == b）", re: "a\\s*==\\s*b" },
      { desc: "gt/lt 用大小比较（> / <）", re: "a\\s*>\\s*b|a\\s*<\\s*b" }
    ],
    solution: "assign eq = (a == b);\nassign gt = (a > b);\nassign lt = (a < b);  // 也可 lt = ~gt & ~eq",
    explanation: "直接关系运算符即可综合出比较器；减法视角帮助理解借位与 gt/lt 的对应关系。",
    tags: ["手写", "比较器"]
  },
  {
    id: "m4-04",
    title: "行波进位延迟",
    topic: "M4 加法与比较",
    type: "choice",
    question: "行波进位加法器位宽加倍，最坏路径延迟大约？",
    options: ["不变", "翻倍", "翻 4 倍", "与位宽无关"],
    answer: 1,
    explanation: "行波结构中进位逐级传播，最坏延迟 ~ O(N)，位宽加倍则延迟约翻倍。超前进位（CLA）把进位生成/传播并行计算，延迟 ~ O(log N)。",
    tags: ["时序概念", "加法器"]
  },

  /* ================= 阶段0 · M5 组合陷阱：latch ================= */
  {
    id: "m5-01",
    title: "组合块防 latch",
    topic: "M5 组合陷阱",
    type: "choice",
    question: "下列组合 always 块中，哪种写法不会产生锁存器？",
    options: [
      "if (en) y = a;（无 else）",
      "case (s) 2'b00: y=a; 2'b01: y=b; endcase",
      "块首 y = 默认值; 再 if (en) y = a;",
      "if (en) y = a; else if (sel) y = b;"
    ],
    answer: 2,
    explanation: "先赋默认值再条件覆盖，任何路径都有赋值，无 latch。A/D 的分支覆盖不全且无默认值，B 的 case 分支不全，都会生成锁存器。",
    tags: ["latch", "组合逻辑"]
  },
  {
    id: "m5-02",
    title: "敏感列表遗漏",
    topic: "M5 组合陷阱",
    type: "choice",
    question: "always @(*) 中读了信号 tmp，但敏感列表手写成了 always @(a, b) 漏掉 tmp，会怎样？",
    options: [
      "综合结果不变，仿真可能出现「保持旧值」行为",
      "综合报错",
      "仿真、综合行为一致且正确",
      "自动被工具修正"
    ],
    answer: 0,
    explanation: "敏感列表不全时，综合工具按代码意图仍生成组合逻辑，但仿真中 tmp 变化不会重新触发块，输出保持旧值——典型的仿真-综合不一致。所以组合逻辑一律用 @(*)。",
    tags: ["敏感列表", "仿真不一致"]
  },
  {
    id: "m5-03",
    title: "latch 改写练习",
    topic: "M5 组合陷阱",
    type: "judge",
    question: "找错并改正：下面的组合逻辑想实现「en 时 y=b 否则 y=a」，当前会产生 latch，请给出两种不产生 latch 的改法。",
    starter: "// 补全：en 时 y=b，否则 y=a，不能产生 latch\nmodule mux_fix(\n  input  wire en, a, b,\n  output reg  y\n);\n  always @(*) begin\n    // TODO: 两种改法任选（补 else / 默认值）\n\n  end\nendmodule",
    checks: [
      { desc: "if-else 两分支齐全（else 分支存在）", re: "\\belse\\b" },
      { desc: "en 参与 if 判断", re: "if\\s*\\(\\s*[!~]?\\s*en\\s*\\)" }
    ],
    answer_ref: "参考：\n// 写法1 补 else\nalways @(*) begin\n  if (en) y = b;\n  else    y = a;\nend\n\n// 写法2 默认值\nalways @(*) begin\n  y = a;          // 默认\n  if (en) y = b;\nend",
    solution: "always @(*) begin\n  if (en) y = b;\n  else    y = a;\nend\n// 或：先给默认值 y = a; 再 if (en) y = b;",
    explanation: "latch 成因 = 组合块中某条路径无赋值。补全分支或先赋默认值即可。",
    tags: ["手写", "latch"]
  },

  /* ================= 阶段1 · M6 触发器 ================= */
  {
    id: "m6-01",
    title: "异步复位 DFF",
    topic: "M6 触发器",
    type: "choice",
    question: "下列哪种描述会综合成带异步复位的 D 触发器？",
    options: [
      "always @(posedge clk) if(!rst_n) q<=0; else q<=d;",
      "always @(posedge clk or negedge rst_n) if(!rst_n) q<=0; else q<=d;",
      "always @(posedge clk or rst_n) if(rst_n) q<=d;",
      "always @(*) if(!rst_n) q<=0; else q<=d;"
    ],
    answer: 1,
    explanation: "异步复位 = 复位信号出现在敏感列表（posedge/negedge），且复位值判断在块首。选项 C 敏感列表写法非法（复位须指明边沿），D 是组合逻辑。",
    code: "always @(posedge clk or negedge rst_n)\n  if (!rst_n) q <= 1'b0;\n  else        q <= d;",
    tags: ["时序逻辑", "复位"]
  },
  {
    id: "m6-02",
    title: "复位+使能 DFF",
    topic: "M6 触发器",
    type: "judge",
    question: "手写：带低有效异步复位、高有效同步使能 en 的 D 触发器（d → q），en 无效时保持。",
    starter: "// 带异步复位 + 同步使能的 D 触发器\nmodule dff_en(\n  input  wire clk, rst_n, en, d,\n  output reg  q\n);\n  // TODO: 敏感列表写对，en 无效时保持\n\nendmodule",
    checks: [
      { desc: "敏感列表含 posedge clk 和 rst_n（异步复位）", re: "posedge\\s+clk.*rst_n|posedge\\s+rst_n" },
      { desc: "复位用非阻塞赋值 q <= 0", re: "q\\s*<=\\s*1\\s*'{\\s*b\\s*0" },
      { desc: "en 无效时保持（else 分支不赋值 / if(en) 包住赋值）", re: "if\\s*\\(\\s*en\\s*\\)" }
    ],
    solution: "always @(posedge clk or negedge rst_n) begin\n  if (!rst_n) q <= 1'b0;\n  else if (en) q <= d;\n  // en=0 不赋值 → 保持\nend",
    explanation: "使能 = 分支条件不满足时不更新寄存器，综合器自动加反馈 MUX。",
    tags: ["手写", "触发器"]
  },
  {
    id: "m6-03",
    title: "同步异步复位辨析",
    topic: "M6 触发器",
    type: "choice",
    question: "同步复位与异步复位，下列说法错误的是？",
    options: [
      "同步复位对复位脉冲宽度有要求（须至少覆盖一个时钟沿）",
      "异步复位不依赖时钟，但释放时刻要防 recovery/removal 违例",
      "同步复位让复位走数据路径，综合器更易做时序收敛，但会占用数据路径逻辑",
      "异步复位释放无需任何处理，直接撤销即可"
    ],
    answer: 3,
    explanation: "异步复位撤销时刻若靠近时钟沿会违例 recovery/removal，工程上必须做「异步复位、同步释放」（两级 FF 同步释放）。其余三项均为两种复位风格的真实权衡。",
    tags: ["复位设计"]
  },
  {
    id: "m6-04",
    title: "异步复位同步释放",
    topic: "M6 触发器",
    type: "choice",
    question: "关于异步复位、同步释放（async reset, sync release），下列说法正确的是？",
    options: [
      "复位信号直接异步有效、异步撤销，最安全",
      "复位异步拉有效，但撤销时刻经同步器对齐时钟沿，避免 recovery/removal 违例",
      "复位必须完全同步有效和撤销",
      "只适用于 FPGA，ASIC 禁用"
    ],
    answer: 1,
    explanation: "复位有效可以异步立即生效；撤销时刻若靠近时钟沿会造成 recovery/removal 违例，因此用两级触发器同步释放。这是 ASIC/FPGA 通行的复位风格。",
    code: "always @(posedge clk or negedge rst_n)\n  if (!rst_n) rst_n_sync <= 2'b00;\n  else        rst_n_sync <= {rst_n_sync[0], 1'b1};",
    tags: ["复位设计", "高频"]
  },

  /* ================= 阶段1 · M7 边沿检测 ================= */
  {
    id: "m7-01",
    title: "边沿检测写法",
    topic: "M7 边沿检测",
    type: "choice",
    question: "检测 sig 的上升沿，标准两级触发器写法是？",
    options: [
      "assign pos = sig & sig;",
      "打两拍 q1、q2，assign pos = q1 & ~q2",
      "打两拍 q1、q2，assign pos = ~q1 & q2",
      "assign pos = sig ^ q1，一级 FF 即可"
    ],
    answer: 1,
    explanation: "q1 是 sig 的当前同步值，q2 是它上一拍的值：本拍高、上拍低（q1 & ~q2）即为上升沿。~q1&q2 是下降沿。选项 D 与 sig 同拍变化，q1 与 sig 不对齐。",
    code: "always @(posedge clk) begin\n  q1 <= sig;\n  q2 <= q1;\nend\nassign pos = q1 & ~q2;   // 上升沿：本拍1、上拍0\nassign neg = ~q1 & q2;   // 下降沿",
    tags: ["边沿检测"]
  },
  {
    id: "m7-02",
    title: "两级同步+上升沿",
    topic: "M7 边沿检测",
    type: "judge",
    question: "手写：对输入 sig 做两级同步并输出 pos_pulse（sig 上升沿时的单周期脉冲）。",
    starter: "// 两级同步 + 上升沿检测\nmodule edge_det(\n  input  wire clk, rst_n, sig,\n  output wire pos_pulse\n);\n  reg sig_q1, sig_q2;\n  // TODO: 打两拍，输出 pos_pulse = 本拍高 & 上拍低\n\nendmodule",
    checks: [
      { desc: "always @(posedge clk) 里连续打两拍（q1 <= sig; q2 <= q1）", re: "sig_q1\\s*<=" },
      { desc: "第二拍来自第一拍（sig_q2 <= sig_q1）", re: "sig_q2\\s*<=\\s*sig_q1" },
      { desc: "pos_pulse = sig_q2 & ~sig_q1（本拍高上拍低）", re: "sig_q2\\s*&\\s*~\\s*sig_q1|sig_q2\\s*&\\s*!\\s*sig_q1" }
    ],
    solution: "always @(posedge clk or negedge rst_n) begin\n  if (!rst_n) begin\n    sig_q1 <= 1'b0;\n    sig_q2 <= 1'b0;\n  end else begin\n    sig_q1 <= sig;\n    sig_q2 <= sig_q1;\n  end\nend\nassign pos_pulse = sig_q2 & ~sig_q1;",
    explanation: "两级 FF 既完成同步又提供历史值；pos_pulse 只在 sig 由 0→1 后的那一拍为高。",
    tags: ["手写", "边沿检测"]
  },
  {
    id: "m7-03",
    title: "边沿检测原理",
    topic: "M7 边沿检测",
    type: "choice",
    question: "为什么边沿检测要用两级触发器，而不是直接比较 sig 与其「组合延迟版本」？",
    options: [
      "节省寄存器",
      "组合延迟版本会带来毛刺且不可靠；两级 FF 让信号与其历史都时钟对齐，比较输出才是干净的单拍脉冲",
      "两级 FF 更快",
      "单级 FF 无法保持状态"
    ],
    answer: 1,
    explanation: "直接用组合延迟做的「边沿」实际是毛刺脉冲，宽度不可控。打两拍把 sig 与其历史都变成时钟对齐的寄存器信号，比较结果才是可靠的同步脉冲。",
    tags: ["边沿检测", "毛刺"]
  },

  /* ================= 阶段1 · M8 计数器 ================= */
  {
    id: "m8-01",
    title: "计数器 tick 脉冲",
    topic: "M8 计数器",
    type: "judge",
    question: "手写：带异步复位、使能的 8 位向上计数器，计数到 200 时产生单周期脉冲 tick，到 200 后回 0（模 201）。",
    starter: "// 模 201 计数器：0..200 循环，计到 200 出 tick\nmodule cnt200(\n  input  wire clk, rst_n, en,\n  output reg  [7:0] cnt,\n  output wire tick\n);\n  // TODO: 复位、计数、到 200 回 0，tick 用比较生成\n\nendmodule",
    checks: [
      { desc: "复位 cnt <= 0（同步或异步）", re: "cnt\\s*<=\\s*\\{?8|cnt\\s*<=\\s*0" },
      { desc: "计到 200 归零（== 200 或 >= 200）", re: "==\\s*200|>=\\s*200" },
      { desc: "tick 用组合比较生成（assign tick = ...）", re: "assign\\s+tick" }
    ],
    solution: "always @(posedge clk or negedge rst_n) begin\n  if (!rst_n)      cnt <= 8'd0;\n  else if (en)     cnt <= (cnt == 8'd200) ? 8'd0 : cnt + 1'b1;\nend\nassign tick = (cnt == 8'd200);",
    explanation: "模 N 计数器三要素：复位值、终点比较、回绕赋值。tick 用组合比较生成跟随 cnt。",
    tags: ["手写", "计数器"]
  },
  {
    id: "m8-02",
    title: "模 10 计数器",
    topic: "M8 计数器",
    type: "choice",
    question: "想要模 10 计数器（0..9 循环），写成 if (cnt == 4'd9) cnt <= 0; else cnt <= cnt + 1。若删掉对 9 的判断，直接 cnt <= cnt + 1，会发生什么？",
    options: [
      "计数器停在 9",
      "计数器数到 15 后回 0，模从 10 变成 16",
      "溢出报错",
      "产生未知态"
    ],
    answer: 1,
    explanation: "4 位计数器自然回绕点是 15→0。判断「计到 9」是把模从 16 截成 10 的关键；删掉后 9、10、…、15 都会出现，模变成 16。off-by-one 是计数器最高频错误。",
    tags: ["计数器", "模N"]
  },
  {
    id: "m8-03",
    title: "定时脉冲实现",
    topic: "M8 计数器",
    type: "choice",
    question: "实现「每 100 个时钟产生一个单周期脉冲」，以下说法正确的是？",
    options: [
      "计数器计到 100 时置 tick=1",
      "计数 0..99，cnt==99 的下一拍回 0；在 cnt==99 时刻（或回 0 时打一拍）产生 tick",
      "tick 需要 100 个周期宽",
      "必须用状态机实现"
    ],
    answer: 1,
    explanation: "模 100：cnt 取 0..99 共 100 个值，在 cnt==99 产生脉冲。若写成「计到 100」会需要 7 位且边界多算一拍——0..99 vs 1..100 的 off-by-one 是高频错误。",
    tags: ["计数器", "off-by-one"]
  },
  {
    id: "m8-04",
    title: "可预置加减计数器",
    topic: "M8 计数器",
    type: "judge",
    question: "手写：可预置的 4 位加减计数器：up_down=1 加、0 减，load 有效时下一拍载入 d[3:0]，带异步复位。",
    starter: "// 可预置 4 位加减计数器：load > 计数\nmodule cnt_ud(\n  input  wire clk, rst_n, load, up_down,\n  input  wire [3:0] d,\n  output reg  [3:0] q\n);\n  // TODO: 复位 > load > 加减选择\n\nendmodule",
    checks: [
      { desc: "if-else 优先级：先复位、再 load", re: "if\\s*\\(\\s*[!~]?\\s*rst" },
      { desc: "load 分支 q <= d", re: "q\\s*<=\\s*d" },
      { desc: "up_down 选择 +1 / -1（q + 1 / q - 1）", re: "\\+\\s*1|-\\s*1" }
    ],
    solution: "always @(posedge clk or negedge rst_n) begin\n  if (!rst_n)       q <= 4'd0;\n  else if (load)    q <= d;\n  else if (up_down) q <= q + 1'b1;\n  else              q <= q - 1'b1;\nend",
    explanation: "计数器 = 复位 + 置数 + 加减选择的三级优先 if-else；load 优先于计数方向。",
    tags: ["手写", "计数器"]
  },

  /* ================= 阶段1 · M9 分频器 ================= */
  {
    id: "m9-01",
    title: "8 分频 50% 占空比",
    topic: "M9 分频器",
    type: "judge",
    question: "手写：偶数分频——把 clk 8 分频，输出占空比 50% 的 clk_div8（分频输出用寄存器生成，不做门控时钟）。",
    starter: "// 8 分频 50% 占空比\nmodule div8(\n  input  wire clk, rst_n,\n  output reg  clk_div8\n);\n  reg [2:0] cnt;\n  // TODO: 计到 3 翻转输出，周期 = 8 个 clk\n\nendmodule",
    checks: [
      { desc: "复位时计数器与输出清零", re: "cnt\\s*<=\\s*0" },
      { desc: "计到 3 归零并翻转 clk_div8（~clk_div8）", re: "3|cnt\\s*<=\\s*0" },
      { desc: "翻转用非阻塞赋值 clk_div8 <= ~clk_div8", re: "clk_div8\\s*<=\\s*~" }
    ],
    solution: "always @(posedge clk or negedge rst_n) begin\n  if (!rst_n) begin\n    cnt      <= 3'd0;\n    clk_div8 <= 1'b0;\n  end else if (cnt == 3'd3) begin\n    cnt      <= 3'd0;\n    clk_div8 <= ~clk_div8;   // 4 个 clk 翻一次 → 周期 8\n  end else begin\n    cnt <= cnt + 1'b1;\n  end\nend",
    explanation: "偶数 N 分频：计数到 N/2-1 翻转输出。分频输出是普通寄存器信号，下游建议作时钟使能使用。",
    tags: ["手写", "分频"]
  },
  {
    id: "m9-02",
    title: "奇数分频技巧",
    topic: "M9 分频器",
    type: "choice",
    question: "奇数分频（如 3 分频）要输出 50% 占空比，核心技巧是？",
    options: [
      "单计数器在计到 (N-1)/2 时翻转一次",
      "上升沿计数产生一个方波、下降沿计数产生错开半周期的方波，再按位或",
      "用 clk 的下降沿计一次数即可",
      "奇数分频无法得到 50% 占空比"
    ],
    answer: 1,
    explanation: "奇数 N：上升沿计数的方波在 (N-1)/2 处翻转、下降沿计数的方波错开半周期翻转，两者「或」起来得到占空比 50% 的 N 分频。",
    tags: ["分频", "奇偶分频"]
  },
  {
    id: "m9-03",
    title: "分频时钟隐患",
    topic: "M9 分频器",
    type: "choice",
    question: "为什么不推荐「直接把分频寄存器输出当下游模块的时钟」（如 always @(posedge clk_div)）？",
    options: [
      "语法不支持",
      "寄存器衍生时钟有偏斜/毛刺风险，STA 难以约束；工程惯例是全局单时钟 + 时钟使能",
      "会占用更多 LUT",
      "仿真速度变慢"
    ],
    answer: 1,
    explanation: "寄存器产生的分频信号作时钟会引入不可控偏斜，STA 也难以约束。标准做法：系统单一时钟，低速逻辑用 clk_en 使能打拍。",
    tags: ["时钟设计", "分频"]
  },
  {
    id: "m9-04",
    title: "3 分频 50% 占空比",
    topic: "M9 分频器",
    type: "judge",
    question: "手写：3 分频 50% 占空比输出（提示：上升沿计数产生 div_p，下降沿产生错开半周期的 div_n，clk_div3 = div_p | div_n）。",
    starter: "// 3 分频 50% 占空比\nmodule div3(\n  input  wire clk, rst_n,\n  output wire clk_div3\n);\n  reg [1:0] cnt_p;\n  reg div_p, div_n;\n  // TODO: 上升沿计数 div_p，下降沿错开 div_n，取或\n\nendmodule",
    checks: [
      { desc: "上升沿与下降沿各有一个 always 块", re: "posedge|negedge" },
      { desc: "下降沿块用了相同的计数逻辑（cnt_p 或独立计数）", re: "negedge" },
      { desc: "输出取或（div_p | div_n）", re: "div_p\\s*\\|\\s*div_n" }
    ],
    solution: "// 上升沿计数\nalways @(posedge clk or negedge rst_n) begin\n  if (!rst_n) begin\n    cnt_p <= 2'd0;\n    div_p <= 1'b0;\n  end else if (cnt_p == 2'd1) begin\n    cnt_p <= 2'd0;\n    div_p <= ~div_p;\n  end else begin\n    cnt_p <= cnt_p + 1'b1;\n  end\nend\n// 下降沿错开半周期\nalways @(negedge clk or negedge rst_n) begin\n  if (!rst_n)       div_n <= 1'b0;\n  else if (cnt_p == 2'd1) div_n <= ~div_n;\nend\nassign clk_div3 = div_p | div_n;",
    explanation: "上升沿方波占 2/3、下降沿延迟版占 2/3 但错开半周期，取或后高 1.5 拍低 1.5 拍，即 50% 占空比的 3 分频。",
    tags: ["手写", "奇数分频"]
  },

  /* ================= 阶段2 · C1 计数器（六件套①） ================= */
  {
    id: "c1-01",
    title: "FIFO 写指针本质",
    topic: "C1 计数器",
    type: "choice",
    question: "「FIFO 的写指针本质是什么？」——下列说法最准确的是？",
    options: [
      "一个状态机",
      "一个只加不减、按深度回绕的计数器",
      "一个比较器",
      "一个移位寄存器"
    ],
    answer: 1,
    explanation: "FIFO 写/读指针 = 循环计数器：只递增、到深度回绕（深度取 2 的幂时回绕即自然溢出，无需比较）。FIFO = 指针计数器 + 存储阵列 + 空/满比较逻辑。",
    tags: ["计数器", "FIFO"]
  },
  {
    id: "c1-02",
    title: "定时 tick 分频链",
    topic: "C1 计数器",
    type: "judge",
    question: "手写：分频链——50MHz 时钟，输出 dsec_tick（每 0.1 秒一个单周期脉冲）和 sec_tick（每秒一个脉冲）。写出计数链。",
    starter: "// 分频链：50MHz → 0.1s 脉冲 → 1s 脉冲\nmodule tick_gen(\n  input  wire clk, rst_n,\n  output wire dsec_tick,   // 每 0.1s 一个单周期脉冲\n  output wire sec_tick     // 每 1s 一个单周期脉冲\n);\n  reg [25:0] cnt_main;\n  reg [3:0]  cnt_sub;\n  // TODO: 50_000_000-1 主计数，0.1s 内数 10 次\n\nendmodule",
    checks: [
      { desc: "always 块里写出主计数终值比较", re: "cnt_main\\s*(==|>=)\\s*\\d" },
      { desc: "cnt_sub 有非阻塞赋值", re: "cnt_sub\\s*<=" },
      { desc: "dsec_tick / sec_tick 用组合比较生成", re: "assign\\s+dsec_tick|assign\\s+sec_tick" }
    ],
    solution: "always @(posedge clk or negedge rst_n) begin\n  if (!rst_n) cnt_main <= 26'd0;\n  else if (cnt_main == 26'd49_999_999) cnt_main <= 26'd0;\n  else cnt_main <= cnt_main + 1'b1;\nend\n\n// 0.1s 边界：cnt_main 数满 4_999_999\nwire dsec_edge = (cnt_main == 26'd4_999_999);\nalways @(posedge clk or negedge rst_n) begin\n  if (!rst_n)              cnt_sub <= 4'd0;\n  else if (dsec_edge)      cnt_sub <= (cnt_sub == 4'd9) ? 4'd0 : cnt_sub + 1'b1;\nend\n\nassign dsec_tick = dsec_edge;\nassign sec_tick  = dsec_edge & (cnt_sub == 4'd9);",
    explanation: "大分频比拆成计数链：主计数器产生 0.1s 基准脉冲，再数 10 次产生 1s。体现「分频 = 计数 + 脉冲」的复用思想。",
    tags: ["手写", "计数器", "分频链"]
  },

  /* ================= 阶段2 · C2 序列检测与生成 ================= */
  {
    id: "c2-01",
    title: "1011 状态数",
    topic: "C2 序列检测",
    type: "choice",
    question: "实现「检测输入序列 1011（可重叠）」的 Mealy 型检测器，状态数至少为？",
    options: ["3 个", "4 个", "5 个", "8 个"],
    answer: 1,
    explanation: "跟踪最长可复用前缀：S0(空)/S1(1)/S10(10)/S101(101)，检测到 1011 输出 1 并可复用尾部 1 回 S1，共 4 个状态。可重叠意味着命中后部分后缀可作新前缀。",
    tags: ["状态机", "序列检测"]
  },
  {
    id: "c2-02",
    title: "1011 三段式状态机",
    topic: "C2 序列检测",
    type: "judge",
    question: "手写：三段式状态机实现 1011 序列检测（可重叠），输入 din、clk、rst_n，输出 hit（检测到当拍为 1）。",
    starter: "// 三段式状态机：检测 1011（可重叠）\nmodule seq_det(\n  input  wire clk, rst_n, din,\n  output wire hit\n);\n  localparam S0=2'd0, S1=2'd1, S10=2'd2, S101=2'd3;\n  reg [1:0] state, nstate;\n  // 1) 状态寄存器\n  // TODO: always @(posedge clk ...) state <= nstate;\n  // 2) 组合次态\n  // TODO: 默认值 + case\n  // 3) 输出\n  // TODO: assign hit = ...\n\nendmodule",
    checks: [
      { desc: "状态寄存器：always 块内时序赋值 state <= nstate（非注释行）", re: "^[^/]*state\\s*<=\\s*nstate" },
      { desc: "次态逻辑有默认值 + case（防 latch）", re: "nstate\\s*=\\s*S0|default" },
      { desc: "hit 用组合 assign（比较状态）而非时序输出", re: "assign\\s+hit" }
    ],
    solution: "// 1) 状态寄存器\nalways @(posedge clk or negedge rst_n)\n  if (!rst_n) state <= S0;\n  else        state <= nstate;\n\n// 2) 组合次态\nalways @(*) begin\n  nstate = S0;                 // 默认\n  case (state)\n    S0:   nstate = din ? S1   : S0;\n    S1:   nstate = din ? S1   : S10;\n    S10:  nstate = din ? S101 : S0;\n    S101: nstate = din ? S1   : S10;  // 尾部 1 复用 → 可重叠\n  endcase\nend\n\n// 3) 输出\nassign hit = (state == S101) & din;",
    explanation: "三段式 = 时序状态寄存 + 组合次态 + 输出逻辑，分支全覆盖无 latch。S101 收到 1 命中，尾部 1 复用回 S1（可重叠）。",
    tags: ["手写", "状态机"]
  },
  {
    id: "c2-03",
    title: "移位法 vs 状态机",
    topic: "C2 序列检测",
    type: "choice",
    question: "同一序列检测若改用「移位寄存器法」（保存最近 4 拍输入，比较窗口），与状态机法相比？",
    options: [
      "状态机法一定面积更小",
      "移位法代码更短、易改序列值，但寄存器数随序列长度线性增长",
      "移位法无法检测可重叠序列",
      "移位法不能综合"
    ],
    answer: 1,
    explanation: "移位法：shift <= {shift[2:0], din}; hit = (shift == 4'b1011)。定长序列场景代码极简，代价是每拍一位寄存器；序列更长/模式更多时状态机更省资源。",
    tags: ["序列检测", "移位寄存器"]
  },
  {
    id: "c2-04",
    title: "序列生成器",
    topic: "C2 序列检测",
    type: "judge",
    question: "手写：序列生成器——循环输出序列 1,0,1,1（每拍一位，无限循环），用计数器+查找表或循环移位任一实现。",
    starter: "// 序列生成器：循环输出 1,0,1,1\nmodule seq_gen(\n  input  wire clk, rst_n,\n  output wire dout\n);\n  // TODO: 计数器+查找表 或 循环移位，任选\n\nendmodule",
    checks: [
      { desc: "有一个 2 位计数器（或 4 位移位寄存器）", re: "\\[\\s*1\\s*:\\s*0\\s*\\]|\\[\\s*3\\s*:\\s*0\\s*\\]" },
      { desc: "计数到 3 归零（或移位反馈）", re: "==\\s*3|<<|>>|\\{" },
      { desc: "dout 用组合 assign 输出", re: "assign\\s+dout" }
    ],
    solution: "// 计数器 + 查找表\nreg [1:0] cnt;\nalways @(posedge clk or negedge rst_n) begin\n  if (!rst_n)   cnt <= 2'd0;\n  else          cnt <= (cnt == 2'd3) ? 2'd0 : cnt + 1'b1;\nend\nassign dout = (cnt == 2'd0) | (cnt == 2'd2) | (cnt == 2'd3);\n// 即 1,0,1,1 循环",
    explanation: "生成 = 计数器寻址查找表 或 环形移位。与检测互为镜像：检测按输入建状态，生成按状态驱动输出。",
    tags: ["手写", "序列生成"]
  },

  /* ================= 阶段2 · C3 去毛刺 ================= */
  {
    id: "c3-01",
    title: "去毛刺经典做法",
    topic: "C3 去毛刺",
    type: "choice",
    question: "按键/异步信号去毛刺（debounce）的经典数字做法是？",
    options: [
      "一级 FF 直接输出",
      "N 拍一致法：连续 N 个周期采样值相同才更新输出",
      "在 Verilog 里模拟 RC 电路",
      "对信号做 assign 延迟"
    ],
    answer: 1,
    explanation: "N 拍一致：计数器统计采样值保持不变的时间，达到阈值才更新输出并清零计数；任何抖动都会打断计数。N 依据毛刺最长宽度选择。",
    tags: ["去毛刺", "高频"]
  },
  {
    id: "c3-02",
    title: "去毛刺模块实现",
    topic: "C3 去毛刺",
    type: "judge",
    question: "手写：对异步输入 din 去毛刺，先两级 FF 同步，再「连续 4 拍与当前输出不同才翻转」，输出 db_out。",
    starter: "// 去毛刺：两级同步 + 4 拍一致才翻转\nmodule debounce(\n  input  wire clk, rst_n, din,\n  output reg  db_out\n);\n  reg din_q1, din_q2;\n  reg [1:0] cnt;\n  // TODO: 先同步，再 N 拍一致\n\nendmodule",
    checks: [
      { desc: "两级同步打拍（din_q1 <= din; din_q2 <= din_q1）", re: "din_q1\\s*<=\\s*din" },
      { desc: "计数器在电平稳定时累加、变化时清零", re: "cnt\\s*<=\\s*cnt\\s*\\+" },
      { desc: "计满后 db_out 翻转 / 跟随（非阻塞赋值）", re: "db_out\\s*<=" }
    ],
    solution: "always @(posedge clk or negedge rst_n) begin\n  if (!rst_n) begin\n    din_q1 <= 1'b0;\n    din_q2 <= 1'b0;\n    cnt    <= 2'd0;\n    db_out <= 1'b0;\n  end else begin\n    din_q1 <= din;\n    din_q2 <= din_q1;\n    if (din_q2 == db_out) begin\n      cnt <= 2'd0;               // 无变化：计数清零\n    end else if (&cnt) begin     // 连续 4 拍不一致\n      db_out <= din_q2;\n      cnt    <= 2'd0;\n    end else begin\n      cnt <= cnt + 1'b1;\n    end\n  end\nend",
    explanation: "结构 = 两级同步器（防亚稳态）+ N 拍一致（防毛刺）。注意先同步再去毛刺，顺序不能反。",
    tags: ["手写", "去毛刺"]
  },
  {
    id: "c3-03",
    title: "同步去毛刺顺序",
    topic: "C3 去毛刺",
    type: "choice",
    question: "去毛刺模块里「先两级同步、再 N 拍一致」的顺序能否对调？",
    options: [
      "可以，逻辑上等价",
      "不能：计数器直接采异步信号会因亚稳态读到不定值，必须先把信号变成同步域内的干净信号",
      "应该先计数再同步",
      "与顺序无关，只与 N 有关"
    ],
    answer: 1,
    explanation: "亚稳态可能让计数器读到中间态，毛刺直接污染计数逻辑。同步器在前，把亚稳态概率压到极低后，N 拍一致才有意义。",
    tags: ["亚稳态", "去毛刺"]
  },

  /* ================= 阶段2 · C4 跨时钟域 ================= */
  {
    id: "c4-01",
    title: "电平信号跨域",
    topic: "C4 跨时钟域",
    type: "choice",
    question: "单 bit 电平信号从 100MHz 域到 33MHz 域，最合适的处理方式是？",
    options: [
      "直接连线",
      "目的域打两拍同步器",
      "异步 FIFO",
      "握手 + 两拍同步器"
    ],
    answer: 1,
    explanation: "单 bit 电平信号用目的时钟两级触发器同步（打两拍）即可；多 bit 总线或脉冲需用握手/格雷码/异步 FIFO。",
    tags: ["CDC", "高频"]
  },
  {
    id: "c4-02",
    title: "脉冲跨域处理",
    topic: "C4 跨时钟域",
    type: "choice",
    question: "100MHz 域发出一个单周期脉冲给 33MHz 域，直接打两拍会怎样？正确做法是？",
    options: [
      "没问题，脉冲一定能被采到",
      "可能采不到（脉冲宽 < 目的域周期）；源域用电平/toggle 承载事件，目的域同步+边沿检测还原脉冲",
      "用更快的时钟",
      "把脉冲展宽到 3 拍就一定安全"
    ],
    answer: 1,
    explanation: "窄脉冲可能落在目的域两个采样沿之间而丢失。标准方案 toggle/握手：源域翻转发护位或置位电平，目的域同步+边沿检测还原，必要时回传 ack 清除。",
    tags: ["CDC", "脉冲同步"]
  },
  {
    id: "c4-03",
    title: "多 bit 跨域",
    topic: "C4 跨时钟域",
    type: "choice",
    question: "跨时钟域传多个相关的控制 bit（如 {valid, addr[3:0]}），为什么不能各自打两拍？",
    options: [
      "会引入不必要的延迟",
      "各 bit 可能在不同周期被采样到，破坏总线相关性（数据歪斜）",
      "综合工具不支持",
      "打两拍会改变信号电平"
    ],
    answer: 1,
    explanation: "多 bit 信号各 bit 到达时序不同，可能同一拍采到部分新值部分旧值。应使用异步 FIFO、握手，或格雷码（仅限计数类）。",
    tags: ["CDC", "多bit"]
  },
  {
    id: "c4-04",
    title: "toggle 同步器",
    topic: "C4 跨时钟域",
    type: "judge",
    question: "手写：toggle 同步器——源域每收到 pulse_a 把 tgl 翻转一次，目的域两级同步 + 边沿检测还原脉冲 pulse_b。",
    starter: "// toggle 同步器：源域翻转，目的域同步+异或还原脉冲\nmodule toggle_sync(\n  input  wire clk_a, clk_b, rst_n, pulse_a,\n  output wire pulse_b\n);\n  reg tgl;\n  // TODO: 源域翻转 tgl；目的域打两拍后异或还原\n\nendmodule",
    checks: [
      { desc: "源域 posedge clk_a 里 tgl 翻转（tgl <= ~tgl）", re: "tgl\\s*<=\\s*~" },
      { desc: "目的域两级同步（如 tgl_b1 <= tgl; tgl_b2 <= tgl_b1）", re: "tgl_b1\\s*<=" },
      { desc: "pulse_b = 第二拍 ^ 第三拍（异或还原）", re: "\\^" }
    ],
    solution: "// 源域：脉冲转电平翻转\nalways @(posedge clk_a or negedge rst_n)\n  if (!rst_n) tgl <= 1'b0;\n  else if (pulse_a) tgl <= ~tgl;\n\n// 目的域：两级同步 + 异或还原\nreg tgl_b1, tgl_b2, tgl_b3;\nalways @(posedge clk_b or negedge rst_n) begin\n  if (!rst_n) begin\n    tgl_b1 <= 1'b0;\n    tgl_b2 <= 1'b0;\n    tgl_b3 <= 1'b0;\n  end else begin\n    tgl_b1 <= tgl;\n    tgl_b2 <= tgl_b1;\n    tgl_b3 <= tgl_b2;\n  end\nend\nassign pulse_b = tgl_b2 ^ tgl_b3;",
    explanation: "toggle 把「脉冲」转成「电平翻转」，电平同步不丢事件；目的域用异或当前/历史值还原单拍脉冲。适合低频事件同步，占两拍延迟。",
    tags: ["手写", "CDC"]
  },

  /* ================= 阶段2 · C5 同步 FIFO ================= */
  {
    id: "c5-01",
    title: "同步 FIFO 空满判定",
    topic: "C5 同步FIFO",
    type: "choice",
    question: "深度 8 的同步 FIFO，空、满判定的经典计数器法是？",
    options: [
      "空 = (wptr == rptr)，满 = (wptr - rptr == 8)",
      "空 = (count == 0)，满 = (count == 8)，同拍读写时 count 保持不变",
      "空 = (count == 8)，满 = (count == 0)",
      "空满都用 (wptr == rptr) 判断"
    ],
    answer: 1,
    explanation: "计数器法：count 跟踪队列元素数——写不满则 +1、读不空则 -1、同时读写不变。wptr==rptr 只能判空，判满需 count 或扩展一位指针法。",
    tags: ["FIFO", "同步FIFO"]
  },
  {
    id: "c5-02",
    title: "同步 FIFO 实现",
    topic: "C5 同步FIFO",
    type: "judge",
    question: "手写：深度 8、数据宽度 8 的同步 FIFO：端口 clk/rst_n/wen/ren/wdata/rdata/empty/full，用 count 法判空满。",
    starter: "// 深度 8、位宽 8 的同步 FIFO（count 法判空满）\nmodule sync_fifo(\n  input  wire clk, rst_n, wen, ren,\n  input  wire [7:0] wdata,\n  output reg  [7:0] rdata,\n  output wire empty, full\n);\n  // TODO: mem + 双指针 + count 维护（同拍读写 count 不变）\n\nendmodule",
    checks: [
      { desc: "定义了 8x8 存储（reg [7:0] mem [0:7]）", re: "\\[\\s*7\\s*:\\s*0\\s*\\]\\s*mem\\s*\\[\\s*0\\s*:\\s*7\\s*\\]" },
      { desc: "读写指针各 3 位且独立累加", re: "\\[\\s*2\\s*:\\s*0\\s*\\]" },
      { desc: "count 维护：写加、读减、同拍读写不变", re: "count" },
      { desc: "empty/full 用比较生成（count == 0 / count == 8）", re: "assign\\s+empty|assign\\s+full" }
    ],
    solution: "reg [7:0] mem [0:7];\nreg [2:0] wptr, rptr;\nreg [3:0] count;\n\nalways @(posedge clk or negedge rst_n) begin\n  if (!rst_n) begin\n    wptr <= 3'd0; rptr <= 3'd0; count <= 4'd0;\n    rdata <= 8'd0;\n  end else begin\n    if (wen && !full) begin\n      mem[wptr] <= wdata;\n      wptr <= wptr + 1'b1;\n    end\n    if (ren && !empty) begin\n      rdata <= mem[rptr];\n      rptr <= rptr + 1'b1;\n    end\n    case ({wen && !full, ren && !empty})\n      2'b10: count <= count + 1'b1;\n      2'b01: count <= count - 1'b1;\n      default: count <= count;   // 同拍读写不变\n    endcase\n  end\nend\nassign empty = (count == 4'd0);\nassign full  = (count == 4'd8);",
    explanation: "三块拼图：存储阵列（mem+双指针）、空满比较、count 维护。写读同拍 count 不变是计数器法的关键细节。",
    tags: ["手写", "FIFO"]
  },
  {
    id: "c5-03",
    title: "FIFO 同时读写",
    topic: "C5 同步FIFO",
    type: "choice",
    question: "同步 FIFO「同时读写」且 FIFO 不空不满时，count 如何变化？",
    options: ["加 1", "减 1", "不变", "取决于写入数据"],
    answer: 2,
    explanation: "一写一读元素数不变：count + 1 - 1 = 不变。漏掉这个 case 是 FIFO 计数器法的头号 bug 来源（会导致空满误判）。",
    tags: ["FIFO", "细节"]
  },

  /* ================= 阶段2 · C6 异步 FIFO ================= */
  {
    id: "c6-01",
    title: "格雷码适用场景",
    topic: "C6 异步FIFO",
    type: "choice",
    question: "格雷码适合用于以下哪个场景？",
    options: [
      "算术加法运算",
      "异步 FIFO 指针跨时钟域传递",
      "高速串行数据编码",
      "奇偶校验"
    ],
    answer: 1,
    explanation: "格雷码相邻码距为 1，指针跨时钟域采样最多错成相邻值，不会引入非法状态；算术运算反而需要转回二进制。",
    tags: ["CDC", "格雷码", "高频"]
  },
  {
    id: "c6-02",
    title: "异步 FIFO 指针位宽",
    topic: "C6 异步FIFO",
    type: "choice",
    question: "异步 FIFO 指针为什么要比地址位宽多一位？空、满条件分别是什么？",
    options: [
      "为了存格雷码；空 = 指针相等，满 = 指针相等",
      "多出的一位记录「是否绕了一圈」；空 = 全部位相等，满 = 最高位相反、低位相同",
      "多一位用于奇偶校验；空满都靠计数器",
      "为了对齐数据位宽；满 = 高位相同"
    ],
    answer: 1,
    explanation: "N 位地址 + 1 位回绕标志：空时两指针完全相等（同圈同位置）；满时两指针都绕了一圈回到同一位置（最高位取反、低位相同）。仅凭 N 位相等无法区分空与满。",
    tags: ["异步FIFO", "指针", "高频"]
  },
  {
    id: "c6-03",
    title: "二转格雷码",
    topic: "C6 异步FIFO",
    type: "judge",
    question: "手写：二进制转格雷码的 assign 表达式，并用一句话说明为什么格雷码适合指针同步。",
    starter: "// 二进制转格雷码\nmodule bin2gray #(\n  parameter N = 4\n)(\n  input  wire [N-1:0] bin,\n  output wire [N-1:0] gray\n);\n  // TODO: 一行 assign；想想为什么适合指针同步\n\nendmodule",
    checks: [
      { desc: "用异或实现：gray = bin ^ (bin >> 1)", re: "\\^" },
      { desc: "右移一位参与异或（bin >> 1）", re: ">>\\s*1" },
      { desc: "参数化写法（用 N 而非写死 4 位）", re: "N\\s*-\\s*1" }
    ],
    solution: "assign gray = bin ^ (bin >> 1);\n// 相邻二进制数只差 1 位 → 格雷码适合异步指针同步（FIFO）",
    explanation: "g = b ^ (b>>1) 是转换公式；核心性质是相邻码距为 1 → 采样误差受限于相邻值，方向保守安全。",
    tags: ["手写", "格雷码"]
  },
  {
    id: "c6-04",
    title: "FIFO 深度取 2 的幂",
    topic: "C6 异步FIFO",
    type: "choice",
    question: "异步 FIFO 的深度通常取 2 的幂，最主要的原因是？",
    options: [
      "综合工具只支持 2 的幂",
      "指针自然回绕截断即对深度取模，无需额外取模逻辑；格雷码回绕也保持相邻码距为 1",
      "为了省电",
      "内存颗粒按 2 的幂组织"
    ],
    answer: 1,
    explanation: "深度 2^N 时指针位宽 N+1，递增溢出自动回绕 = 免费取模；格雷码在回绕点同样只变 1 位，空满比较逻辑保持正确。非 2 幂深度需要额外回绕处理，容易出错。",
    tags: ["异步FIFO", "深度"]
  }
];

/* 学习路线：阶段 → 模块。topics 与上方题目 topic 严格一致。 */
const ROADMAP = [
  {
    name: "阶段0 · 组合逻辑",
    desc: "M1-M5：门与三态、MUX、译码/优先编码、加法比较、latch 陷阱",
    topics: ["M1 基本门与三态", "M2 多路选择器", "M3 译码与优先编码", "M4 加法与比较", "M5 组合陷阱"]
  },
  {
    name: "阶段1 · 时序原语",
    desc: "M6-M9：触发器与复位、边沿检测、计数器、分频器",
    topics: ["M6 触发器", "M7 边沿检测", "M8 计数器", "M9 分频器"]
  },
  {
    name: "阶段2 · 编码六件套",
    desc: "计数器→序列检测/生成→去毛刺→跨时钟→同步FIFO→异步FIFO（手写面试题套路）",
    topics: ["C1 计数器", "C2 序列检测", "C3 去毛刺", "C4 跨时钟域", "C5 同步FIFO", "C6 异步FIFO"]
  }
];

const DAILY_COUNT = 5;

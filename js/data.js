/* ====== 题库数据（示例种子题，可自行增删） ======
 * 结构说明：
 * { id, topic, question, options:[...], answer:正确下标, explanation, code(可选代码段), tags:[...] }
 * type: "choice" 单选 | "judge" 判断（简答题干+自评）
 * 添加新题：在 QUESTIONS 数组里追加即可，代码无需改动。
 */
const QUESTIONS = [
  {
    id: "v-001",
    topic: "阻塞与非阻塞赋值",
    type: "choice",
    question: "在时序逻辑（always @(posedge clk)）中建模寄存器，应使用哪种赋值？",
    options: ["阻塞赋值 =", "非阻塞赋值 <=", "两者等价，随意使用", "assign 语句"],
    answer: 1,
    explanation: "时序逻辑建模寄存器必须使用非阻塞赋值 <=，保证采样-更新语义与真实触发器一致，避免仿真竞争。",
    code: "always @(posedge clk) begin\n  q <= d;   // 寄存器：非阻塞\nend",
    tags: ["Verilog基础", "高频"]
  },
  {
    id: "v-002",
    topic: "阻塞与非阻塞赋值",
    type: "choice",
    question: "组合逻辑 always 块中推荐使用哪种赋值，且敏感列表应如何写？",
    options: [
      "阻塞赋值，敏感列表写 always @(*)",
      "非阻塞赋值，敏感列表写 always @(*)",
      "阻塞赋值，敏感列表写 always @(posedge clk)",
      "非阻塞赋值，敏感列表写 always @(negedge clk)"
    ],
    answer: 0,
    explanation: "组合逻辑用阻塞赋值 = 并配 always @(*)，避免综合出锁存器；注意 if/case 分支要给所有信号赋默认值。",
    tags: ["Verilog基础", "锁存器"]
  },
  {
    id: "v-003",
    topic: "阻塞与非阻塞赋值",
    type: "choice",
    question: "以下代码在仿真中会得到什么结果？\nalways @(posedge clk) begin\n  b = a;\n  c = b;\nend\nalways @(posedge clk) begin\n  e <= c;\nend",
    options: [
      "c 在同一时刻立即等于 a，e 下一拍等于 a",
      "c 下一拍才等于 a，e 下一拍等于旧 c",
      "综合报错",
      "b、c、e 均下一拍等于 a"
    ],
    answer: 0,
    explanation: "阻塞赋值顺序执行：b、c 在同一时间步立即更新为 a。第二个 always 在同一 clk 沿被触发时读到的是新值，因此 e 下一拍等于 a。这正是阻塞/非阻塞混用容易引起仿真-综合不一致的原因。",
    tags: ["仿真语义", "高频"]
  },
  {
    id: "v-004",
    topic: "状态机设计",
    type: "choice",
    question: "三段式状态机相比一段式的最主要优势是？",
    options: [
      "状态编码更少",
      "时序输出寄存、组合与时序分离，利于时序收敛与维护",
      "不需要状态寄存器",
      "功耗一定更低"
    ],
    answer: 1,
    explanation: "三段式：状态寄存器（时序）/ 次态译码（组合）/ 输出译码（常配时序输出）。结构清晰、输出无毛刺、利于 STA 与维护。",
    code: "// 三段式骨架\nalways @(posedge clk) state <= next_state;\nalways @(*) case (state) S0: next_state = cond ? S1 : S0; ... endcase\nalways @(posedge clk) if (state == S1) out <= 1'b1; else out <= 1'b0;",
    tags: ["状态机", "设计规范"]
  },
  {
    id: "v-005",
    topic: "状态机设计",
    type: "judge",
    question: "简答：为什么状态机要设计「安全状态机」（对未用状态有恢复路径）？至少说一个场景。",
    answer_ref: "参考：独热码/格雷码存在未用编码，若因 SEU、复位释放竞争或 X 传播进入未用状态，无恢复路径会死机；上电 X 态、抗干扰设计都要求次态逻辑对非法状态默认回到 IDLE。",
    explanation: "常见的做法：case 中加 default 次态回 IDLE；综合属性 safe_fsm / full_case parallel_case 的取舍需谨慎。",
    tags: ["状态机", "可靠性"]
  },
  {
    id: "v-006",
    topic: "复位设计",
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
    tags: ["复位", "高频"]
  },
  {
    id: "v-007",
    topic: "CDC跨时钟域",
    type: "choice",
    question: "单 bit 电平信号从 100MHz 域到 33MHz 域，最合适的处理方式是？",
    options: [
      "直接连线",
      "目的域打两拍同步器",
      "异步 FIFO",
      "握手 + 两拍同步器，仅电平信号打两拍即可"
    ],
    answer: 1,
    explanation: "单 bit 电平信号用目的时钟两级触发器同步（打两拍）即可；多 bit 总线或脉冲需用握手/格雷码/异步 FIFO。",
    tags: ["CDC", "高频"]
  },
  {
    id: "v-008",
    topic: "CDC跨时钟域",
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
    tags: ["CDC"]
  },
  {
    id: "v-009",
    topic: "FIFO设计",
    type: "judge",
    question: "简答：异步 FIFO 的空/满标志为什么用格雷码比较？深度为何要求 2 的幂？",
    answer_ref: "参考：格雷码相邻值仅 1 bit 变化，跨时钟域同步时即使采样到跳变瞬间也只可能错成相邻值，不会产生非法读指针导致误判空/满；2 的幂保证格雷码回绕时首尾也只差 1 bit。",
    explanation: "同步后的指针滞后真实指针，判空判满按保守方向处理（空读指针滞后、满写指针滞后），保证不溢出不错读。",
    tags: ["FIFO", "高频"]
  },
  {
    id: "sv-001",
    topic: "SystemVerilog验证",
    type: "choice",
    question: "SystemVerilog 中 logic 与 bit/wire 的本质区别是？",
    options: [
      "logic 是 4 态（0/1/x/z），bit 是 2 态，wire 是网络类型",
      "logic 只能用于组合逻辑",
      "bit 支持 x 传播",
      "wire 是 2 态且不能被过程块赋值"
    ],
    answer: 0,
    explanation: "logic 是 4 态变量类型，可被 assign 或过程块驱动（单驱动源）；bit 是 2 态，仿真更快但会掩盖 x 态问题，验证中要留意。",
    tags: ["SystemVerilog", "高频"]
  },
  {
    id: "sv-002",
    topic: "SystemVerilog验证",
    type: "judge",
    question: "简答：UVM 中 sequence / sequencer / driver 三者的角色与 handshake（seq_item_port）机制。",
    answer_ref: "参考：sequence 生成事务（item）；sequencer 仲裁多个 sequence 的访问；driver 通过 get_next_item/item_done（或 get/put）与 sequencer 握手，把事务 pin 级驱动到接口。",
    explanation: "关键字：uvm_sequence_item、`uvm_do / start_item-finish_item、get_next_item 后必须 item_done，否则 sequence 卡死。",
    tags: ["UVM"]
  },
  {
    id: "sv-003",
    topic: "SystemVerilog验证",
    type: "choice",
    question: "以下约束随机化后 x 的可能取值是？\nrand bit [3:0] x;\nconstraint c { x inside {[2:5], 7}; x != 3; }",
    options: ["2,4,5,7", "2,3,4,5,7", "0,1,6", "2,4,5"]
    , answer: 0,
    explanation: "inside 表示属于集合 {[2:5], 7}，再排除 3，所以是 {2,4,5,7}。约束求解在声明范围内取满足所有约束的值。",
    tags: ["约束随机"]
  },
  {
    id: "sv-004",
    topic: "SystemVerilog验证",
    type: "judge",
    question: "简答：coverage 驱动验证中，功能覆盖率和代码覆盖率的区别与互补关系。",
    answer_ref: "参考：代码覆盖率（行/分支/表达式/翻转/状态机）由工具自动收集，反映「实现了的代码是否被执行」；功能覆盖率（covergroup/coverpoint/cross）反映「验证意图与规格场景是否覆盖」。代码覆盖率高但功能低说明测试没对准需求；功能高代码低说明存在死代码或场景遗漏。",
    explanation: "退出标准通常：两个覆盖率都收敛到目标值，且 bug 发现率趋于 0。",
    tags: ["覆盖率"]
  },
  {
    id: "dc-001",
    topic: "数字基础",
    type: "choice",
    question: "建立时间（setup）与保持时间（hold）违例分别应该在哪里修？",
    options: [
      "setup 修在综合后逻辑/频率，hold 修在后端插 buffer/delay",
      "两者都只能改时钟频率",
      "setup 插延迟单元，hold 减逻辑级数",
      "hold 违例靠降频解决"
    ],
    answer: 0,
    explanation: "setup 与时钟周期相关，可通过优化逻辑、流水线、降频解决；hold 与周期无关，靠后端插延迟（buffer/delay cell）修复，降频无效。",
    tags: ["STA", "高频"]
  },
  {
    id: "dc-002",
    topic: "数字基础",
    type: "choice",
    question: "格雷码适合用于以下哪个场景？",
    options: ["算术加法运算", "异步 FIFO 指针跨时钟域传递", "高速串行数据编码", "奇偶校验"],
    answer: 1,
    explanation: "格雷码相邻码距为 1，指针跨时钟域采样最多错成相邻值，不会引入非法状态；算术运算反而需要转回二进制。",
    tags: ["编码", "CDC"]
  },
  {
    id: "dc-003",
    topic: "数字基础",
    type: "judge",
    question: "手算：将二进制 1011 转格雷码，再转回二进制验证。（写出过程）",
    answer_ref: "参考：二进制 b=1011，格雷 g[3]=b[3]=1，g[2]=b3^b2=1^0=1，g[1]=b2^b1=0^1=1，g[0]=b1^b0=1^1=0 → g=1110。反向：b[3]=g[3]=1，b[2]=b[3]^g[2]=1^1=0，b[1]=b[2]^g[1]=0^1=1，b[0]=b[1]^g[0]=1^0=1 → 1011 ✓",
    explanation: "公式：g = b ^ (b>>1)；还原从最高位起 b[i] = b[i+1] ^ g[i]。",
    tags: ["编码"]
  },
  {
    id: "rtl-001",
    topic: "常见RTL题型",
    type: "choice",
    question: "用 always 块实现「检测输入序列 1011（可重叠）」的 Mealy 型检测器，状态数至少为？",
    options: ["3 个", "4 个", "5 个", "8 个"],
    answer: 1,
    explanation: "跟踪最长可复用前缀：S0(空)/S1(1)/S10(10)/S101(101)，检测到 1011 输出 1 并可复用尾部 1 回 S1，共 4 个状态。可重叠意味着命中后部分后缀可作新前缀。",
    tags: ["序列检测", "状态机"]
  },
  {
    id: "rtl-002",
    topic: "常见RTL题型",
    type: "judge",
    question: "手写：用 Verilog 实现带异步复位、使能的 8 位向上计数器，计数到 200 时产生单周期脉冲 tick。写出关键代码。",
    answer_ref: "参考：\nreg [7:0] cnt; wire tick;\nalways @(posedge clk or negedge rst_n)\n  if (!rst_n) cnt <= 0;\n  else if (en) cnt <= (cnt==8'd200) ? 0 : cnt+1'b1;\nassign tick = (cnt==8'd200);\n注意 200 < 256，8 位够用；tick 用组合比较产生，跟随 cnt 值单拍有效。",
    explanation: "若要求 tick 严格单周期且无毛刺，可将比较结果再打一拍输出。",
    tags: ["计数器", "手写代码"]
  }
];

/* ====== 学习路线（参考站的 6 站路线） ====== */
const ROADMAP = [
  { name: "数字基础", desc: "数制与编码、组合/时序逻辑、STA 入门", topics: ["数字基础"] },
  { name: "Verilog 基础", desc: "阻塞/非阻塞、组合与时序建模、复位设计", topics: ["阻塞与非阻塞赋值", "复位设计"] },
  { name: "RTL 进阶题型", desc: "状态机、序列检测、计数器等手写题", topics: ["状态机设计", "常见RTL题型"] },
  { name: "CDC 与 FIFO", desc: "跨时钟域处理、异步 FIFO、格雷码", topics: ["CDC跨时钟域", "FIFO设计"] },
  { name: "SystemVerilog", desc: "类型系统、约束随机、覆盖率", topics: ["SystemVerilog验证", "约束随机", "覆盖率"] },
  { name: "UVM", desc: "组件角色、sequence/driver 握手、objection（题库补充中）", topics: ["UVM"] }
];

const DAILY_COUNT = 5; // 每日打卡题数

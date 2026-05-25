// HTX Skill Hub — skill catalog

window.HTX_SKILLS = [
  // ===== 现货 =====
  {
    slug: 'spot-market', name: '现货行情', nameEn: 'Spot Market', category: 'spot', icon: '📈', auth: false,
    desc: '查询 HTX 现货实时价格、K 线、订单簿深度和 24 小时行情统计。一句话获取任意币种的实时市场数据。',
    scenarios: ['BTC 现在多少钱？', '看一下 ETH/USDT 的 4 小时 K 线', 'SOL 当前最佳卖一价是多少？', '今天涨幅前 5 名是哪些币？'],
    install: 'npx -y @sheerl/htx-cli skill install spot-market', pkg: '@htx-skills/spot-market',
    tags: ['行情数据', 'K 线', '现货', '免授权'],
  },
  {
    slug: 'spot-account', name: '现货账户', nameEn: 'Spot Account', category: 'spot', icon: '👤', auth: true,
    desc: '查询现货账户余额、持仓和资产估值，支持现货与合约账户之间的资金划转。',
    scenarios: ['我账户里还剩多少 USDT？', '我现货资产折合美元总值是多少？', '划转 500 USDT 到合约账户'],
    install: 'npx -y @sheerl/htx-cli skill install spot-account', pkg: '@htx-skills/spot-account',
    tags: ['账户', '资金划转', '需授权'],
  },
  {
    slug: 'spot-trading', name: '现货交易', nameEn: 'Spot Trading', category: 'spot', icon: '🛒', auth: true,
    desc: '现货市价/限价下单、撤单、改单与订单查询。所有写操作均需人工确认。',
    scenarios: ['用 100 USDT 市价买入 BTC', '挂单以 3500 限价买 1 个 ETH', '撤掉我所有 BTC 的挂单', '查看我今天的成交记录'],
    install: 'npx -y @sheerl/htx-cli skill install spot-trading', pkg: '@htx-skills/spot-trading',
    tags: ['下单', '高风险', '需授权'],
  },

  // ===== 合约 =====
  {
    slug: 'futures-market', name: '合约行情', nameEn: 'Futures Market', category: 'futures', icon: '📊', auth: false,
    desc: '查询 USDT 永续合约实时价格、K 线、订单簿深度、指数价格、合约元信息和系统状态。',
    scenarios: ['BTC 永续相对现货升水多少？', '看一下 ETH 永续的 1 小时 K 线', '一张 BTC 永续合约对应多少 BTC？', '当前系统是否可以下单？'],
    install: 'npx -y @sheerl/htx-cli skill install futures-market', pkg: '@htx-skills/futures-market',
    tags: ['永续', 'K 线', '行情数据'],
  },
  {
    slug: 'funding-rate', name: '资金费率', nameEn: 'Funding Rate', category: 'futures', icon: '💸', auth: false,
    desc: '永续合约实时与历史资金费率,支持全市场扫描,捕捉套利机会与情绪反转。',
    scenarios: ['BTC 下一期资金费率是多少？', 'BTC 资金费率近 30 期走势如何？', '哪些币种资金费率为负（多头收钱）？', '当前资金费率最高的 5 个永续是哪些？'],
    install: 'npx -y @sheerl/htx-cli skill install funding-rate', pkg: '@htx-skills/funding-rate',
    tags: ['资金费率', '永续', '套利'],
  },
  {
    slug: 'oi-tracker', name: '持仓量追踪', nameEn: 'OI Tracker', category: 'futures', icon: '📡', auth: false,
    desc: '追踪永续合约持仓量（OI）快照与历史时间序列，识别趋势变化与暴增暴减。',
    scenarios: ['BTC 永续持仓量过去 24 小时变化多少？', '哪些币种持仓量异常激增？', 'ETH 持仓量比上周高还是低？'],
    install: 'npx -y @sheerl/htx-cli skill install oi-tracker', pkg: '@htx-skills/oi-tracker',
    tags: ['持仓量', 'OI', '趋势'],
  },
  {
    slug: 'elite-positioning', name: '大户持仓', nameEn: 'Elite Positioning', category: 'futures', icon: '🎯', auth: false,
    desc: '顶级交易者多空比，按账户数与持仓量双口径呈现，跟踪聪明钱所在方向。',
    scenarios: ['顶级交易者目前 BTC 偏多还是偏空？', 'ETH 的聪明钱多空比是多少？', '大户多头占比是否发生变化？'],
    install: 'npx -y @sheerl/htx-cli skill install elite-positioning', pkg: '@htx-skills/elite-positioning',
    tags: ['多空比', '聪明钱', '情绪'],
  },
  {
    slug: 'liquidation-stream', name: '爆仓流', nameEn: 'Liquidation Stream', category: 'futures', icon: '⚡', auth: false,
    desc: '监控永续合约强平订单流，捕捉空头/多头逼仓、密集爆仓区与连环爆仓事件。',
    scenarios: ['过去一小时 BTC 爆仓多少（美元）？', '是不是大量空头刚被强平？', '当前哪个币种正在出现连环爆仓？'],
    install: 'npx -y @sheerl/htx-cli skill install liquidation-stream', pkg: '@htx-skills/liquidation-stream',
    tags: ['爆仓', '逼仓', '风险'],
  },
  {
    slug: 'mark-price', name: '标记价格 / 溢价 / 基差', nameEn: 'Mark Price & Premium', category: 'futures', icon: '🎚️', auth: false,
    desc: '永续合约公允定价系列：标记价格、溢价指数、基差 K 线，可用于强平参考与基差套利。',
    scenarios: ['BTC 永续当前基差是多少 bp？', '标记价格距离指数价格有多远？', '溢价指数过去 24 小时走势如何？'],
    install: 'npx -y @sheerl/htx-cli skill install mark-price', pkg: '@htx-skills/mark-price',
    tags: ['标记价格', '基差', '套利'],
  },
  {
    slug: 'settlement', name: '结算与风险保障基金', nameEn: 'Settlement & Insurance Fund', category: 'futures', icon: '🛡️', auth: false,
    desc: '查询预估结算价、历史结算记录与风险保障基金余额，监控平台健康度与尾部风险。',
    scenarios: ['BTC 下次预估结算价是多少？', '风险保障基金最近是否被动用？', '在极端行情下风险保障基金够用吗？'],
    install: 'npx -y @sheerl/htx-cli skill install settlement', pkg: '@htx-skills/settlement',
    tags: ['结算', '风险保障基金', '风险'],
  },
  {
    slug: 'futures-account', name: '合约账户', nameEn: 'Futures Account', category: 'futures', icon: '🗂️', auth: true,
    desc: '查询合约账户余额、仓位、杠杆档位与风控参数，支持统一账户模式切换。',
    scenarios: ['我合约账户的保证金率是多少？', '我 BTC 永续仓位的未实现盈亏是多少？', '我能用的最大杠杆是多少？', '我现在是逐仓还是全仓？'],
    install: 'npx -y @sheerl/htx-cli skill install futures-account', pkg: '@htx-skills/futures-account',
    tags: ['账户', '仓位', '杠杆'],
  },
  {
    slug: 'futures-trading', name: '合约交易', nameEn: 'Futures Trading', category: 'futures', icon: '⚙️', auth: true,
    desc: '合约开仓/平仓、设置止盈止损、批量撤单与触发单。所有写操作均需人工确认。',
    scenarios: ['以 10 倍杠杆开 0.1 BTC 多单', '给我的 ETH 仓位设 4000 止盈、3200 止损', '把我的 SOL 永续仓位全部平掉', 'BTC 60000 挂触发单'],
    install: 'npx -y @sheerl/htx-cli skill install futures-trading', pkg: '@htx-skills/futures-trading',
    tags: ['合约下单', '止盈止损', '高风险'],
  },

  // ===== 分析师 =====
  {
    slug: 'technical-analysis', name: '技术分析引擎', nameEn: 'Technical Analysis Engine', category: 'analyst', icon: '📐', auth: false,
    desc: '基础指标引擎——拉取 K 线后本地计算 51 个指标 + 12 种 K 线形态 + 5 个 BTC 周期指标 + 自动背离识别，返回原始数值供 AI 解读。零 API 消耗。',
    scenarios: ['BTC 4 小时 RSI 是多少？', '帮我计算 ETH 的 MACD 和布林带', '扫描 BTC 1 小时上有哪些形态信号', 'BTC 当前 AHR999 是多少？'],
    install: 'npx -y @sheerl/htx-cli skill install technical-analysis', pkg: '@htx-skills/technical-analysis',
    tags: ['指标引擎', '本地计算', 'AI 分析'],
  },
  {
    slug: 'ta-master', name: '技术分析大师', nameEn: 'TA Master', category: 'analyst', icon: '🎓', auth: false,
    desc: '复合分析应用——编排 6 个底层技能（指标引擎 + 资金费率 + 持仓量 + 爆仓 + 多空比 + 基差），输出 0-100 综合评分与多空判断。',
    scenarios: ['给我打个 BTC 当前的综合分', '现在该不该入场 ETH？', '筛选综合分 > 70 的多头机会', 'BTC 三大支柱评分分别是多少？'],
    install: 'npx -y @sheerl/htx-cli skill install ta-master', pkg: '@htx-skills/ta-master',
    tags: ['综合评分', '三大支柱', 'AI 分析'],
  },
  {
    slug: 'derivatives-analyst', name: '衍生品压力分析师', nameEn: 'Derivatives Analyst', category: 'analyst', icon: '🧪', auth: false,
    desc: '将资金费率、持仓量、爆仓、基差、多空比等 5 个衍生品信号合成 0-100 拥挤度评分与逼仓风险判断。',
    scenarios: ['当前 BTC 衍生品是否过度拥挤？', '哪个永续最可能出现逼仓？', 'ETH 的衍生品压力评分是多少？'],
    install: 'npx -y @sheerl/htx-cli skill install derivatives-analyst', pkg: '@htx-skills/derivatives-analyst',
    tags: ['衍生品', '逼仓', 'AI 分析'],
  },
  {
    slug: 'sentiment-analyst', name: '市场情绪', nameEn: 'Sentiment Analyst', category: 'analyst', icon: '🌡️', auth: false,
    desc: '融合恐惧贪婪指数、大户多空比与 24 小时市场广度，给出市场情绪解读与背离信号。',
    scenarios: ['当前市场处于恐惧还是贪婪？', 'FOMO 严重到什么程度？', '情绪与价格之间是否出现背离？'],
    install: 'npx -y @sheerl/htx-cli skill install sentiment-analyst', pkg: '@htx-skills/sentiment-analyst',
    tags: ['情绪', '恐惧贪婪', 'AI 分析'],
  },
  {
    slug: 'market-overview', name: '市场全景', nameEn: 'Market Overview', category: 'analyst', icon: '🌐', auth: false,
    desc: '全市场扫描：现货 + 合约的涨跌榜、成交量异动、板块轮动线索——一句话掌握全市场动向。',
    scenarios: ['今天市场怎么样，给我个总览', '哪些板块在轮动？', '哪些币种成交量异常？', '今日涨幅前 5 名是哪些？'],
    install: 'npx -y @sheerl/htx-cli skill install market-overview', pkg: '@htx-skills/market-overview',
    tags: ['市场全景', '板块', 'AI 分析'],
  },
];

window.HTX_CATEGORIES = [
  { id: 'all',     label: '全部',   count: () => window.HTX_SKILLS.length },
  { id: 'spot',    label: '现货',   count: () => window.HTX_SKILLS.filter(s => s.category === 'spot').length },
  { id: 'futures', label: '合约',   count: () => window.HTX_SKILLS.filter(s => s.category === 'futures').length },
  { id: 'analyst', label: '分析师', count: () => window.HTX_SKILLS.filter(s => s.category === 'analyst').length },
];

window.GITHUB_BASE = 'https://github.com/sheerl/htx-skills-hub/tree/main/htx-cli/skills/htx';

window.HTX_FAQS = [
  {
    q: '什么是 Skill（技能）？',
    a: 'HTX AI 技能中心是一个开放的 AI 交易技能市场。你可以在这里浏览、搜索并安装模块化技能，为你的 AI 交易助手扩展行情查询、交易执行、衍生品分析与风险监控等能力。HTX 官方与社区开发者会持续贡献新技能，你只需挑选并一行命令安装即可。',
  },
  {
    q: '这些 Skill 安全吗？',
    a: '每个技能上架前都会经过自动化安全扫描，包括恶意代码检测、提示词注入检查与数据泄露扫描，并在详情页展示安全评分。所有上架技能均由 HTX 平台数字签名，安装时校验签名以确保技能未被篡改。',
  },
  {
    q: '如何查找并安装一个 Skill？',
    a: '你可以按分类筛选、按关键字搜索，或直接浏览本页的热门排行。如果你正在使用 AI 助手，它会在合适的时机主动推荐相关技能，确认后即可一行命令安装到本地。',
  },
  {
    q: '安装前怎么判断一个 Skill 是否可靠？',
    a: '每个上架技能在详情页都展示安全扫描评分，并附有安装量与社区反馈，便于你判断成熟度与受欢迎程度。建议优先选择安全评分高、安装量大的技能。',
  },
];

import { notesMetadata } from './notes';

export const pageItems = [
  { key: 'home', cn: '首页', icon: 'home' },
  { key: 'blog', cn: '文章', icon: 'book' },
  { key: 'projects', cn: '项目', icon: 'folder' },
  { key: 'about', cn: '关于', icon: 'user' },
  { key: 'share', cn: '分享', icon: 'spark' },
  { key: 'bloggers', cn: '友链', icon: 'heart' },
  { key: 'article', cn: '详情', icon: 'pen' },
  { key: 'avatar', cn: '角色', icon: 'star' },
] as const;

export const socialLinks = [
  { label: 'GitHub', href: 'github', icon: 'github' },
  { label: 'Bilibili', href: 'https://www.bilibili.com', icon: 'bilibili' },
  { label: '小红书', href: 'https://www.xiaohongshu.com', icon: 'xiaohongshu' },
  { label: 'Email', href: 'email', icon: 'mail' },
] as const;

export const archiveGroups = [
  {
    year: '2026',
    count: 5,
    posts: [
      { date: '07.02', title: '把个人知识库整理成一套粉蓝白 Wiki', tags: ['Wiki', 'Design'] },
      { date: '06.15', title: notesMetadata[0].title.zh, tags: ['React', 'Frontend'] },
      { date: '05.22', title: notesMetadata[1].title.zh, tags: ['Vite', 'Build'] },
      { date: '04.10', title: notesMetadata[2].title.zh, tags: ['CSS', 'Grid'] },
      { date: '03.18', title: '如何为 AI Agent 设计可复用工作流', tags: ['AI', 'Workflow'] },
    ],
  },
  {
    year: '2025',
    count: 4,
    posts: [
      { date: '12.28', title: '从零搭建个人作品集的信息架构', tags: ['Portfolio', 'UX'] },
      { date: '10.09', title: '前端项目复盘：让组件更像文档', tags: ['React', 'Notes'] },
      { date: '08.21', title: '一份更温柔的学习计划模板', tags: ['Learning', 'Life'] },
      { date: '04.30', title: '给旧项目补上漂亮的 README', tags: ['Docs', 'GitHub'] },
    ],
  },
] as const;

export const resources = [
  { title: 'PyTorch Documentation', url: 'pytorch.org/docs', href: 'https://pytorch.org/docs/stable/index.html', category: '深度学习', desc: 'PyTorch 官方文档，适合查张量、自动求导、模型训练、部署和生态库用法。', views: '官方文档', marks: '模型训练', icon: 'code' },
  { title: 'Hugging Face Transformers', url: 'huggingface.co/docs/transformers', href: 'https://huggingface.co/docs/transformers/index', category: 'AI', desc: 'Transformer 模型生态的核心文档，适合学习预训练模型、微调和推理调用。', views: '官方文档', marks: '模型应用', icon: 'spark' },
  { title: 'Papers with Code', url: 'paperswithcode.com', href: 'https://paperswithcode.com/', category: '论文', desc: '把机器学习论文、代码实现、数据集和榜单放在一起，适合追踪研究进展。', views: '研究索引', marks: '论文复现', icon: 'book' },
  { title: 'Google AI Studio', url: 'aistudio.google.com', href: 'https://aistudio.google.com/', category: 'AI 应用', desc: 'Google 的 Gemini 应用实验入口，适合快速测试提示词、原型和多模态能力。', views: '官方工具', marks: '应用原型', icon: 'spark' },
  { title: 'OpenAI Cookbook', url: 'cookbook.openai.com', href: 'https://cookbook.openai.com/', category: 'AI 应用', desc: '面向开发者的 AI 应用实践案例，包含检索增强、结构化输出、评测和工具调用等主题。', views: '官方教程', marks: '工程实践', icon: 'code' },
  { title: 'Vercel AI SDK', url: 'ai-sdk.dev/docs', href: 'https://ai-sdk.dev/docs', category: 'AI 应用', desc: '用于在前端和全栈应用里构建聊天、流式输出和工具调用体验的 SDK 文档。', views: '官方文档', marks: '前端集成', icon: 'folder' },
  { title: 'Deep Learning Book', url: 'deeplearningbook.org', href: 'https://www.deeplearningbook.org/', category: '学习', desc: 'Ian Goodfellow、Yoshua Bengio、Aaron Courville 的深度学习教材，适合补基础理论。', views: '在线教材', marks: '理论基础', icon: 'book' },
  { title: 'Stanford CS231n Notes', url: 'cs231n.github.io', href: 'https://cs231n.github.io/', category: '学习', desc: '斯坦福视觉识别课程笔记，覆盖卷积网络、训练技巧、可视化和实践经验。', views: '课程笔记', marks: '计算机视觉', icon: 'pen' },
  { title: 'The Illustrated Transformer', url: 'jalammar.github.io/illustrated-transformer', href: 'https://jalammar.github.io/illustrated-transformer/', category: '文章', desc: '用大量图解解释 Transformer 结构，非常适合建立注意力机制的直觉。', views: '图解文章', marks: 'Transformer', icon: 'external' },
  { title: 'Distill', url: 'distill.pub', href: 'https://distill.pub/', category: '文章', desc: '高质量机器学习可视化文章合集，适合把抽象模型机制读得更直观。', views: '研究文章', marks: '可视化理解', icon: 'image' },
  { title: 'React Documentation', url: 'react.dev', href: 'https://react.dev/', category: '前端', desc: 'React 官方文档，适合系统学习组件、Hooks、状态管理和现代 React 写法。', views: '官方文档', marks: '前端基础', icon: 'code' },
  { title: 'MDN Web Docs', url: 'developer.mozilla.org', href: 'https://developer.mozilla.org/en-US/', category: '前端', desc: 'Web 标准、JavaScript、CSS、HTML 的权威参考，适合日常查阅和补知识。', views: '权威文档', marks: 'Web 基础', icon: 'list' },
] as const;

export const friendLinks = [
  { name: 'Momo Notes', url: 'momo-notes.dev', desc: '记录前端设计系统、可访问性和组件思考。', tone: 'pink' },
  { name: 'Blueberry Lab', url: 'blueberry-lab.io', desc: '偏工程实践的 AI 工具箱与产品实验日志。', tone: 'blue' },
  { name: 'Soft Archive', url: 'soft-archive.me', desc: '把日常学习整理成温柔可读的长期笔记。', tone: 'pink' },
  { name: 'Pixel Garden', url: 'pixel-garden.net', desc: '像素图标、小组件和个人主页灵感集合。', tone: 'blue' },
  { name: 'Neko Stack', url: 'neko-stack.dev', desc: '后端、部署和自动化脚本的个人备忘录。', tone: 'pink' },
  { name: 'Cloud Memo', url: 'cloud-memo.page', desc: '关于阅读、写作与轻量知识管理的朋友站。', tone: 'blue' },
] as const;

export const filterItems = ['日', '周', '月', '年', '分类'] as const;

export const homeMenuItems = [
  { page: 'blog', label: '近期文章', icon: 'book' },
  { page: 'projects', label: '我的项目', icon: 'folder' },
  { page: 'about', label: '关于我', icon: 'user' },
  { page: 'share', label: '推荐分享', icon: 'spark' },
  { page: 'bloggers', label: '友链', icon: 'heart' },
  { page: 'about', label: '联系我', icon: 'mail' },
] as const;

export const homeRecommendations = [
  '把一个复杂想法写成三张卡片：问题、尝试、下一步。',
  '今天只整理一个知识点，给它补上链接、标签和一个例子。',
  '把最近常用的小工具收进分享页，让未来的自己少找一次。',
] as const;

export const homeGalleryPhotos = [
  { title: 'Memory Board 01', caption: '完整横幅构图', src: '/images/gallery/memory-01-wide.png', alt: '相册图片完整横幅构图' },
  { title: 'Memory Board 02', caption: '左侧明亮人物裁切', src: '/images/gallery/memory-02-left.png', alt: '相册图片左侧人物裁切' },
  { title: 'Memory Board 03', caption: '右侧安静人物裁切', src: '/images/gallery/memory-03-right.png', alt: '相册图片右侧人物裁切' },
  { title: 'Memory Board 04', caption: '双人中心构图', src: '/images/gallery/memory-04-center.png', alt: '相册图片双人中心构图' },
  { title: 'Memory Board 05', caption: '茶具细节裁切', src: '/images/gallery/memory-05-tea.png', alt: '相册图片茶具细节裁切' },
  { title: 'Memory Board 06', caption: '圆点背景细节', src: '/images/gallery/memory-06-dots.png', alt: '相册图片圆点背景细节' },
  { title: 'Memory Board 07', caption: '左侧表情特写', src: '/images/gallery/memory-07-left-face.png', alt: '相册图片左侧表情特写' },
  { title: 'Memory Board 08', caption: '右侧表情特写', src: '/images/gallery/memory-08-right-face.png', alt: '相册图片右侧表情特写' },
  { title: 'Memory Board 09', caption: '发带和背景细节', src: '/images/gallery/memory-09-ribbon.png', alt: '相册图片发带和背景细节' },
  { title: 'Memory Board 10', caption: '蓝色衣袖裁切', src: '/images/gallery/memory-10-blue-sleeve.png', alt: '相册图片蓝色衣袖裁切' },
  { title: 'Memory Board 11', caption: '红色衣装裁切', src: '/images/gallery/memory-11-red-dress.png', alt: '相册图片红色衣装裁切' },
  { title: 'Memory Board 12', caption: '手部动作细节', src: '/images/gallery/memory-12-hands.png', alt: '相册图片手部动作细节' },
  { title: 'Memory Board 13', caption: '上半身横向构图', src: '/images/gallery/memory-13-upper.png', alt: '相册图片上半身横向构图' },
  { title: 'Memory Board 14', caption: '下半部分色块构图', src: '/images/gallery/memory-14-lower.png', alt: '相册图片下半部分色块构图' },
  { title: 'Memory Board 15', caption: '左侧斜向构图', src: '/images/gallery/memory-15-left-diagonal.png', alt: '相册图片左侧斜向构图' },
  { title: 'Memory Board 16', caption: '右侧斜向构图', src: '/images/gallery/memory-16-right-diagonal.png', alt: '相册图片右侧斜向构图' },
  { title: 'Memory Board 17', caption: '背景圆点细节', src: '/images/gallery/memory-17-pastel-bg.png', alt: '相册图片背景圆点细节' },
  { title: 'Memory Board 18', caption: '双人近景构图', src: '/images/gallery/memory-18-pair-close.png', alt: '相册图片双人近景构图' },
] as const;

export const homeTracks = [
  {
    title: '星茶会',
    artist: '灰澈',
    src: '/music/灰澈 - 星茶会.mp3',
    duration: 42,
  },
] as const;

export const homeContent = {
  site: {
    eyebrow: 'Personal Wiki',
    status: '正在整理灵感与作品',
  },
  quickLinks: [
    { page: 'article', label: '文章详情' },
    { page: 'avatar', label: '角色展示' },
  ],
  gallery: {
    eyebrow: 'Soft Memory Board',
    title: '把灵感、笔记和作品收进一张轻盈桌面',
  },
  intro: {
    eyebrow: 'Welcome home',
  },
  social: {
    eyebrow: 'Connect',
    title: '社交入口',
  },
  calendar: {
    eyebrow: 'Calendar',
  },
  articles: {
    eyebrow: 'Latest Notes',
    title: '近期文章',
  },
  projects: {
    eyebrow: 'Projects',
    title: '我的项目',
  },
  recommendation: {
    eyebrow: 'Random Pick',
    title: '今日推荐',
    buttonLabel: '换一条灵感',
  },
  music: {
    eyebrow: 'Now Playing',
  },
} as const;

export const pageHeroes = {
  blog: {
    eyebrow: 'Blog Archive',
    title: '文章列表',
    desc: '按年份收纳学习记录、前端复盘和 AI 工作流笔记，像翻开一叠透明便签。',
    icon: 'book',
  },
  projects: {
    eyebrow: 'Technical Portfolio',
    title: '项目作品',
    desc: '把技术探索、设计系统和 AI Agent 工作流整理成柔软但清晰的作品卡片。',
    icon: 'folder',
  },
  share: {
    eyebrow: 'Share Shelf',
    title: '推荐分享',
    desc: '工具、资源、阅读和学习路径被整理成一组轻盈的玻璃资源卡。',
    icon: 'spark',
  },
  bloggers: {
    eyebrow: 'Friends Wall',
    title: '优秀博客 / 友链',
    desc: '像朋友名片墙一样展示那些值得常常回访的博客、链接和个人站。',
    icon: 'heart',
  },
} as const;

export const aboutContent = {
  eyebrow: 'GitHub Profile',
  title: 'XiyuFeather / xingxiyu520',
  intro: '我对人工智能、深度学习，以及 AI 与真实应用场景的结合很感兴趣。现在会把学习过程、AI 工具实践和前端交互实验整理成个人项目，既记录探索，也让它们逐步变成可以复用的作品。',
  blocks: [
    {
      type: 'section',
      title: '正在构建的方向',
      body: '公开仓库里最核心的方向是 AI 辅助学习、个人工作流和应用型 AI 工具：Obsidian 学习导师把主题学习、资料阅读、主动回忆和间隔复习串起来；个人复盘 Skill 则把日常状态整理成可执行的中文复盘文档。',
    },
    {
      type: 'section',
      title: '项目风格',
      body: '我喜欢把 AI 想法落到具体应用里，而不是只停留在概念层面：一部分项目偏 Python / Codex Skill 和工作流自动化，另一部分项目偏 TypeScript 前端交互练习，比如扫雷训练场。项目规模不一定大，但会尽量让结构清楚、状态可追踪、文档能被未来的自己继续使用。',
    },
    {
      type: 'quote',
      body: '我想理解 AI 的原理，也想把它做进真实可用的应用里。',
    },
    {
      type: 'section',
      title: '技术栈和兴趣',
      body: '近期公开项目覆盖 Python、TypeScript、C#、React、CSS Grid、LLM Prompting 和 AI Workflow。之后会继续补充人工智能基础、深度学习模型、AI Agent、智能应用原型和个人知识库方向的内容。',
    },
    {
      type: 'section',
      title: '开放交流',
      body: '欢迎围绕人工智能学习、深度学习、AI 应用落地、Codex Skill、Obsidian 学习系统、个人复盘、小游戏交互和个人 Wiki 的交流。如果一个想法能被拆成清晰模块、写成文档、反复迭代，我通常会对它很感兴趣。',
    },
  ],
} as const;

export const articleDetailContent = {
  tags: ['Wiki', 'Design'],
  date: '2026-07-02',
  title: '把个人 Wiki 做成一张粉蓝白的柔软桌面',
  lead: '这篇文章记录如何把作品集、学习笔记、资源分享和朋友链接收进同一个轻盈的信息架构里。',
  sections: [
    {
      id: 'layout',
      title: '布局思路',
      paragraphs: [
        'Bento 布局适合个人 Wiki，因为它能同时容纳导航、状态、内容入口和小组件。页面需要保持错落感，但每个信息块都要有明确的阅读顺序。',
      ],
      list: [
        '左侧导航承担知识库索引感。',
        '中央介绍卡建立个人身份和视觉记忆点。',
        '右侧时钟、月历和目录提供桌面小组件气质。',
      ],
    },
    {
      id: 'visual',
      title: '视觉系统',
      paragraphs: [
        '粉蓝白体系可以很甜，但需要用足够克制的透明度、柔和灰蓝文字和大面积留白来保持清爽。阴影只承担分层，不制造沉重边界。',
      ],
      figure: '封面图区域：粉蓝白相册、像素贴纸和轻玻璃描边。',
    },
    {
      id: 'writing',
      title: '内容组织',
      paragraphs: [
        '作品、文章、推荐资源和友链都可以被看作不同类型的卡片。保持一致的标题、标签和数据区域，用户就能自然理解每一页的结构。',
      ],
    },
  ],
  aside: {
    summaryTitle: '文章摘要',
    summary: '用粉蓝白玻璃小组件组织个人知识库，同时保留长文阅读的舒适性。',
    tocTitle: 'TOC',
  },
} as const;

export const avatarContent = {
  eyebrow: 'Avatar / Live2D',
  title: '粉蓝白角色展示舞台',
  description: '一个可以替换为 Live2D、像素角色或软萌插画头像的极简展示页。',
  loading: '加载角色中...',
} as const;

export const uiLabels = {
  siteCanvas: '粉蓝白个人 Wiki 多页面设计稿',
  avatarAria: '原创粉蓝白像素头像',
  profileAvatarAria: 'XiyuFeather 的 GitHub 头像',
  albumAria: '粉蓝白手帐风相册插画',
  stageAria: '粉蓝白原创角色展示',
  openGalleryAria: '打开照片相册',
  galleryModalAria: '照片相册弹窗',
  galleryModalTitle: 'Pictures',
  closeGalleryAria: '关闭相册',
  previousPhotoAria: '上一张照片',
  nextPhotoAria: '下一张照片',
  pageNavAria: '页面导航',
  homeMenuAria: '首页导航',
  galleryAria: '手帐相册插画',
  clockAria: '电子时钟',
  playMusicAria: '播放音乐',
  pauseMusicAria: '暂停音乐',
  previousTrackAria: '上一首',
  nextTrackAria: '下一首',
  seekMusicAria: '调整音乐进度',
  musicUnavailable: '播放被浏览器阻止，请再点一次播放',
  githubAria: 'GitHub',
  githubReposLabel: '公开仓库',
  githubFollowersLabel: 'Followers',
  githubSinceLabel: 'GitHub since',
  copyEmailAria: '复制邮箱',
  emailCopied: '已复制',
  likeAria: '喜欢',
  likeAction: '点赞',
  likedState: '已赞',
  likeSiteAria: '给网站点赞',
  unlikeSiteAria: '取消网站点赞',
  likeArticleAria: '给文章点赞',
  unlikeArticleAria: '取消文章点赞',
  siteLikeLabel: '网站点赞',
  articleLikeLabel: '文章点赞',
  weekDays: ['日', '一', '二', '三', '四', '五', '六'],
  archiveEyebrow: 'Archive',
  postCountSuffix: '篇',
  projectWebsite: 'Website',
  projectGithub: 'GitHub',
  detailAction: '详情',
  projectSummaryTitle: '项目摘要',
  projectOverviewTitle: '项目概览',
  projectStackTitle: '技术标签',
  projectLinksTitle: '相关入口',
  backToProjects: '返回项目列表',
  views: '来源',
  marks: '用途',
  bloggersPrimaryTab: '博客',
  bloggersSecondaryTab: '链接',
  bloggersCountPrefix: '收录',
  bloggersCountSuffix: '个柔软站点',
} as const;

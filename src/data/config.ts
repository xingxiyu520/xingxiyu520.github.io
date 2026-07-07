export const portfolioConfig = {
  profile: {
    name: "XiyuFeather",
    githubLogin: "xingxiyu520",
    avatarUrl: "https://avatars.githubusercontent.com/u/184849289?v=4",
    publicRepos: 8,
    followers: 2,
    following: 3,
    githubCreatedAt: "2024-10-13",
  },

  hero: {
    headingAccent: "辛熙羽",
  },

  projects: [
    {
      name: {
        zh: "Obsidian 学习导师 Agent",
        en: "Smart Obsidian Coach",
      },
      desc: {
        zh: "面向 Codex 架构的 AI 学习导师 Skill，能将零散的主题学习和资料阅读一键转化为 Obsidian 结构化笔记、主动回忆卡片、错题遗漏跟踪及科学的间隔复习计划。",
        en: "An agent-style learning assistant for turning materials into structured Obsidian notes, recall prompts, review plans, and missed-point tracking.",
      },
      tags: ["Python", "Obsidian API", "Agent Skill", "LLMs"],
      icon: "AI",
      website: "https://github.com/xingxiyu520/obsidian-learning-coach-skill",
      github: "https://github.com/xingxiyu520/obsidian-learning-coach-skill",
    },
    {
      name: {
        zh: "个人状态中文复盘 Assistant",
        en: "Retrospective Coach Skill",
      },
      desc: {
        zh: "一款用于个人周期复盘的 Codex 智能助手，通过分析日常琐碎的“今日状态”与“事件记录”，自动化地生成富有启发性且带有理性活气的中文深度复盘改进文档。",
        en: "A personal retrospective assistant that generates Chinese review documents and specific action plans from daily state and activity notes.",
      },
      tags: ["Python", "LLM Prompting", "Workflows"],
      icon: "RV",
      website: "https://github.com/xingxiyu520/retrospective-skill",
      github: "https://github.com/xingxiyu520/retrospective-skill",
    },
    {
      name: {
        zh: "敏捷部门 AI 辅助协同流",
        en: "Agile Department Workflow",
      },
      desc: {
        zh: "轻量化的“产品-开发-测试”全流程协同工作流，将 AI 智能体与真实软件工程场景相结合，指导小微团队在 AI 协助下更快速地推进敏捷迭代与版本交付。",
        en: "A lightweight Product / Engineering / Review workflow for guiding software projects with AI assistance and agent coordination.",
      },
      tags: ["TypeScript", "AI Workflow", "Product Management"],
      icon: "AG",
      website: "https://github.com/xingxiyu520/agile-department-workflow",
      github: "https://github.com/xingxiyu520/agile-department-workflow",
    },
    {
      name: {
        zh: "扫雷训练场",
        en: "Minesweeper Training Ground",
      },
      desc: {
        zh: "一个围绕经典扫雷规则打造的网页小游戏项目，包含格子翻开、插旗标记、计时统计、难度切换和胜负判定，适合作为前端状态管理与交互细节训练场。",
        en: "A web-based Minesweeper game project with tile reveal, flag marking, timer stats, difficulty switching, and win/loss detection for practicing frontend state and interaction design.",
      },
      tags: ["React", "TypeScript", "Game UI", "CSS Grid"],
      icon: "MS",
      website: "https://github.com/xingxiyu520/minesweeper-training-app",
      github: "https://github.com/xingxiyu520/minesweeper-training-app",
    },
    {
      name: {
        zh: "Cream Wiki UI Kit",
        en: "Cream Wiki UI Kit",
      },
      desc: {
        zh: "为个人 Wiki、友链墙、文章详情和资源分享页沉淀的一套粉蓝白玻璃拟态组件草案。",
        en: "A pink-blue-white glassmorphism UI kit draft for personal Wiki pages, friend links, article details, and resource sharing.",
      },
      tags: ["React", "Design System", "CSS"],
      icon: "UI",
      website: "https://example.com/cream-wiki-ui-kit",
      github: "https://github.com/xingxiyu520/cream-wiki-ui-kit",
    },
  ],

  contact: {
    email: "xingxiyu233@gmail.com",
    github: "https://github.com/xingxiyu520",
  },
} as const;

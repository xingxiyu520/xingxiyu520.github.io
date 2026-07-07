export interface NoteMetadata {
  slug: string;
  title: { zh: string; en: string };
  summary: { zh: string; en: string };
  date: string;
  tags: string[];
}

export const notesMetadata: NoteMetadata[] = [
  {
    slug: "react-19-use-action-state",
    title: {
      zh: "React 19 升级指南：上手 useActionState",
      en: "React 19 Upgrade Guide: Mastering useActionState"
    },
    summary: {
      zh: "探索 React 19 最新推出的 Form Actions 机制，以及它如何优雅地简化表单的状态流转与异步提交处理。",
      en: "Explore the new Form Actions mechanism in React 19, and how it elegantly simplifies form state handling and async submissions."
    },
    date: "2026-06-15",
    tags: ["React", "Frontend"]
  },
  {
    slug: "vite-performance-optimization",
    title: {
      zh: "Vite 性能优化实战：大幅提升打包与热更新速度",
      en: "Vite Performance Optimization in Action"
    },
    summary: {
      zh: "从代码分割、按需引入、预构建缓存到高级 Rollup 参数微调，全方位提升 Vite 本地开发与生产构建效率。",
      en: "From code splitting, demand-loading, pre-bundling caches to Rollup configuration tuning to boost developer productivity."
    },
    date: "2026-05-22",
    tags: ["Vite", "Build Tools"]
  },
  {
    slug: "css-grid-modern-layout",
    title: {
      zh: "网格美学：CSS Grid 在现代网页排版中的创意实践",
      en: "Grid Aesthetics: Creative Layouts with CSS Grid"
    },
    summary: {
      zh: "分享如何摆脱传统的 Bootstrap 式多列栅格，利用 CSS Grid 的区域重叠、自适应网格轨道构建前卫个性的视觉界面。",
      en: "Share how to step away from traditional columnar grids, using CSS Grid overlapping areas and tracks to construct creative websites."
    },
    date: "2026-04-10",
    tags: ["CSS", "Web Design"]
  }
];

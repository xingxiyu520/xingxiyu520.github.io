import { portfolioConfig } from '../data/config';

export interface ProjectCardData {
  slug: string;
  title: { zh: string; en: string };
  summary: { zh: string; en: string };
  description: { zh: string; en: string };
  techStack: readonly string[];
  githubUrl?: string;
  liveUrl?: string;
  featured: boolean;
}

const makeSlug = (value: string) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export const legacyProjects: ProjectCardData[] = portfolioConfig.projects.map((project, index) => ({
  slug: makeSlug(project.name.en),
  title: project.name,
  summary: project.desc,
  description: project.desc,
  techStack: project.tags,
  githubUrl: portfolioConfig.contact.github,
  featured: index < 2,
}));

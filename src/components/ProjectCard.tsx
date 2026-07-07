import React from 'react';
import { Link } from 'react-router-dom';
import type { ProjectCardData } from '../utils/projectData';
import { useLanguage } from '../i18n/LanguageContext';

interface ProjectCardProps {
  project: ProjectCardData;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { language, t } = useLanguage();

  return (
    <div className={`project-card ${project.featured ? 'featured-card' : ''}`}>
      <div className="card-header">
        <span className="card-badge">PROJ</span>
        {project.featured && <span className="featured-badge">★</span>}
      </div>
      <h3 className="card-title">{project.title[language]}</h3>
      <p className="card-summary">{project.summary[language]}</p>
      
      <div className="tech-tags">
        {project.techStack.map((tech) => (
          <span key={tech} className="tech-tag">
            {tech}
          </span>
        ))}
      </div>

      <div className="card-actions">
        <Link to={`/projects/${project.slug}`} className="view-details-btn">
          {language === 'zh' ? '查看详情 →' : 'Details →'}
        </Link>
        <div className="card-links">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" title={t('github')}>
              <svg className="button-icon"><use xlinkHref="/icons.svg#github-icon" /></svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

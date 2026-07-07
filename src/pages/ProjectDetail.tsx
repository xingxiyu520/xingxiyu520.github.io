import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { legacyProjects } from '../utils/projectData';

export const ProjectDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();

  const project = legacyProjects.find((p) => p.slug === slug);

  if (!project) {
    return (
      <div className="page-container animate-fade-in text-center">
        <h2>{t('noProject')}</h2>
        <Link to="/projects" className="btn btn-secondary mt-4">
          ← {t('backToList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="project-detail-page page-container animate-fade-in">
      <Link to="/projects" className="back-link">
        ← {t('backToList')}
      </Link>

      <article className="project-detail-content">
        <h1 className="project-detail-title">{project.title[language]}</h1>
        <p className="project-detail-summary">{project.summary[language]}</p>

        <div className="project-meta-grid">
          <div className="meta-box">
            <h3>{t('techStack')}</h3>
            <div className="tech-tags">
              {project.techStack.map((tech) => (
                <span key={tech} className="tech-tag">{tech}</span>
              ))}
            </div>
          </div>
          <div className="meta-box">
            <h3>{t('links')}</h3>
            <div className="project-links">
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="project-link-btn">
                  GitHub
                </a>
              )}
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="project-link-btn primary">
                  Live Demo
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="project-description-section">
          <p>{project.description[language]}</p>
        </div>
      </article>
    </div>
  );
};

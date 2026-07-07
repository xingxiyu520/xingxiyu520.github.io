import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { legacyProjects } from '../utils/projectData';
import { ProjectCard } from '../components/ProjectCard';

export const Projects: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="projects-page page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">{t('navProjects')}</h1>
      </div>
      <div className="projects-grid">
        {legacyProjects.map(project => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  );
};

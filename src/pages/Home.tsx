import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { legacyProjects } from '../utils/projectData';
import { notesMetadata } from '../data/notes';
import { ProjectCard } from '../components/ProjectCard';
import { NoteCard } from '../components/NoteCard';
import heroImage from '../assets/hero.png';

export const Home: React.FC = () => {
  const { t } = useLanguage();

  const featuredProjects = legacyProjects.filter(p => p.featured);
  const latestNotes = notesMetadata.slice(0, 2);

  return (
    <div className="home-page animate-fade-in">
      <section className="hero-section">
        <div className="hero-text-container">
          <h1 className="hero-main-title">{t('heroTitle')}</h1>
          <p className="hero-sub">{t('heroSubtitle')}</p>
          <div className="hero-cta">
            <Link to="/projects" className="btn btn-primary">{t('viewProjects')}</Link>
            <Link to="/notes" className="btn btn-secondary">{t('readNotes')}</Link>
          </div>
        </div>
        <div className="hero-img-container">
          <img src={heroImage} alt="Developer Avatar" className="hero-img-retro" />
        </div>
      </section>

      <section className="section-featured">
        <div className="section-header-row">
          <h2>{t('featuredProjects')}</h2>
          <Link to="/projects" className="more-link">{t('allProjects')} →</Link>
        </div>
        <div className="projects-grid">
          {featuredProjects.map(project => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>

      <section className="section-notes-summary">
        <div className="section-header-row">
          <h2>{t('latestNotes')}</h2>
          <Link to="/notes" className="more-link">{t('allNotes')} →</Link>
        </div>
        <div className="notes-list">
          {latestNotes.map(note => (
            <NoteCard key={note.slug} note={note} />
          ))}
        </div>
      </section>
    </div>
  );
};

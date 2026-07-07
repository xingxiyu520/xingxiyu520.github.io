import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <>
      <header id="navbar">
        <div className="logo-section">
          <Link to="/" className="site-title">
            <span>{language === 'zh' ? '学生开发者' : 'Student Dev'}</span>
          </Link>
        </div>
        <nav className="nav-links">
          <Link to="/" className={isActive('/')}>{t('navHome')}</Link>
          <Link to="/projects" className={isActive('/projects')}>{t('navProjects')}</Link>
          <Link to="/notes" className={isActive('/notes')}>{t('navNotes')}</Link>
          <Link to="/about" className={isActive('/about')}>{t('navAbout')}</Link>
          <Link to="/contact" className={isActive('/contact')}>{t('navContact')}</Link>
        </nav>
        <button className="lang-toggle-btn" onClick={toggleLanguage} aria-label="Toggle Language">
          {language === 'zh' ? 'EN' : '中文'}
        </button>
      </header>

      <main className="main-content">
        {children}
      </main>

      <footer className="footer-section">
        <p>© {new Date().getFullYear()} - {language === 'zh' ? '基于 React & Vite 构建' : 'Built with React & Vite'}</p>
        <div className="footer-links">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="mailto:your.email@example.com">Email</a>
        </div>
      </footer>
    </>
  );
};

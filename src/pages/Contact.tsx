import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export const Contact: React.FC = () => {
  const { language, t } = useLanguage();

  return (
    <div className="contact-page page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">{t('navContact')}</h1>
      </div>

      <div className="contact-grid">
        <div className="contact-info-panel border-box-style">
          <h2>{language === 'zh' ? '开启新的对话' : 'Start a Conversation'}</h2>
          <p className="contact-subtitle">
            {language === 'zh' 
              ? '如果你对我的项目感兴趣，或者有合作、实习机会，欢迎通过以下方式与我取得联系！' 
              : 'If you are interested in my projects, or have job/internship opportunities, feel free to reach out!'}
          </p>

          <div className="contact-methods">
            <a href="mailto:your.email@example.com" className="contact-method-item">
              <div className="method-icon-container">
                📧
              </div>
              <div className="method-text">
                <strong>{t('email')}</strong>
                <span>your.email@example.com</span>
              </div>
            </a>
            
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="contact-method-item">
              <div className="method-icon-container">
                <svg className="button-icon contact-svg"><use xlinkHref="/icons.svg#github-icon" /></svg>
              </div>
              <div className="method-text">
                <strong>{t('github')}</strong>
                <span>github.com/yourusername</span>
              </div>
            </a>
          </div>
        </div>

        <div className="contact-social-panel border-box-style">
          <h2>{t('message')}</h2>
          <p className="contact-subtitle">
            {language === 'zh'
              ? '你也可以在以下社交平台上找到我。'
              : 'You can also find me on these social platforms.'}
          </p>

          <div className="social-links-grid">
            <a href="https://bsky.app" target="_blank" rel="noopener noreferrer" className="social-link-card">
              <svg className="social-svg"><use xlinkHref="/icons.svg#bluesky-icon" /></svg>
              <span>Bluesky</span>
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="social-link-card">
              <svg className="social-svg"><use xlinkHref="/icons.svg#discord-icon" /></svg>
              <span>Discord</span>
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="social-link-card">
              <svg className="social-svg"><use xlinkHref="/icons.svg#x-icon" /></svg>
              <span>X / Twitter</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

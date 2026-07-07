import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marked } from 'marked';
import { useLanguage } from '../i18n/LanguageContext';
import { notesMetadata } from '../data/notes';

// Dynamically fetch and parse MD files from content/notes directory
const noteFiles = import.meta.glob('/src/content/notes/*.md', { query: '?raw', import: 'default' });

export const NoteDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const noteMeta = notesMetadata.find(n => n.slug === slug);

  useEffect(() => {
    const loadNote = async () => {
      setLoading(true);
      const filePath = `/src/content/notes/${slug}.md`;
      if (noteFiles[filePath]) {
        try {
          const rawMarkdown = (await noteFiles[filePath]()) as string;
          // Synchronous parse using imported marked module
          const parsed = await marked.parse(rawMarkdown);
          setHtmlContent(parsed);
        } catch (err) {
          console.error(err);
          setHtmlContent('Error loading note contents.');
        }
      } else {
        setHtmlContent('Note markdown file not found.');
      }
      setLoading(false);
    };

    if (slug) {
      loadNote();
    }
  }, [slug]);

  if (!noteMeta) {
    return (
      <div className="page-container animate-fade-in text-center">
        <h2>{t('noNote')}</h2>
        <Link to="/notes" className="btn btn-secondary mt-4">
          ← {t('backToList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="note-detail-page page-container animate-fade-in">
      <Link to="/notes" className="back-link">
        ← {t('backToList')}
      </Link>

      <article className="note-article">
        <header className="note-header">
          <div className="note-meta-row">
            <span className="note-detail-date">{noteMeta.date}</span>
            <div className="note-detail-tags">
              {noteMeta.tags.map(tag => (
                <span key={tag} className="note-detail-tag">#{tag}</span>
              ))}
            </div>
          </div>
          <h1 className="note-title">{noteMeta.title[language]}</h1>
          <p className="note-summary-box">{noteMeta.summary[language]}</p>
        </header>

        {loading ? (
          <div className="loading-state">{t('loading')}</div>
        ) : (
          <div 
            className="note-body-content markdown-body" 
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
          />
        )}
      </article>
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import type { NoteMetadata } from '../data/notes';
import { useLanguage } from '../i18n/LanguageContext';

interface NoteCardProps {
  note: NoteMetadata;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const { language } = useLanguage();

  return (
    <div className="note-card">
      <div className="note-card-meta">
        <span className="note-date">{note.date}</span>
        <div className="note-tags">
          {note.tags.map(tag => (
            <span key={tag} className="note-tag">#{tag}</span>
          ))}
        </div>
      </div>
      <h3 className="note-card-title">
        <Link to={`/notes/${note.slug}`}>
          {note.title[language]}
        </Link>
      </h3>
      <p className="note-card-summary">{note.summary[language]}</p>
      <Link to={`/notes/${note.slug}`} className="read-more-link">
        {language === 'zh' ? '阅读全文 →' : 'Read More →'}
      </Link>
    </div>
  );
};

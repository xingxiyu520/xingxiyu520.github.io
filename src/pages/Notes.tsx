import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { notesMetadata } from '../data/notes';
import { NoteCard } from '../components/NoteCard';

export const Notes: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="notes-page page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">{t('navNotes')}</h1>
      </div>
      <div className="notes-list">
        {notesMetadata.map(note => (
          <NoteCard key={note.slug} note={note} />
        ))}
      </div>
    </div>
  );
};

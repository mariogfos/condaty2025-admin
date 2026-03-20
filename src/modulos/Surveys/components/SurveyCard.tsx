"use client";
import React from 'react';
import { Card } from '@/mk/components/ui/Card/Card';
import Button from '@/mk/components/forms/Button/Button';
import TagLabel from '@/mk/components/ui/TagLabel/TagLabel';
import { SurveyListItem } from '../types/mySurveys.types';
import styles from './SurveyCard.module.css';

interface SurveyCardProps {
  survey: SurveyListItem;
  onRespond: (survey: SurveyListItem) => void;
  onView: (survey: SurveyListItem) => void;
}

const statusConfig = {
  A: { label: 'Activa', color: 'success' as const },
  C: { label: 'Cerrada', color: 'default' as const },
};

export const SurveyCard: React.FC<SurveyCardProps> = ({ survey, onRespond, onView }) => {
  const isExpired = survey.status === 'C' || (survey.expires_at && new Date(survey.expires_at) < new Date());
  const canRespond = survey.can_respond && !survey.has_responded && !isExpired;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card 
      className={`
        ${styles.card} 
        ${survey.has_responded ? styles.responded : ''} 
        ${isExpired ? styles.expired : ''}
      `}
      onClick={() => onView(survey)}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{survey.title}</h3>
        <TagLabel type={statusConfig[survey.status]?.color || 'default'}>
          {statusConfig[survey.status]?.label}
        </TagLabel>
      </div>
      
      {survey.description && (
        <p className={styles.description}>{survey.description}</p>
      )}
      
      <div className={styles.meta}>
        <span className={styles.metaItem}>
          {survey.questions_count} pregunta{survey.questions_count !== 1 ? 's' : ''}
        </span>
        
        {survey.expires_at && (
          <span className={styles.metaItem}>
            Vence: {formatDate(survey.expires_at)}
          </span>
        )}
        
        {survey.is_mandatory && (
          <TagLabel type="warning">Obligatoria</TagLabel>
        )}
      </div>
      
      {survey.has_responded && (
        <div className={styles.respondedBadge}>
          <TagLabel type="success">✓ Respondida</TagLabel>
        </div>
      )}
      
      <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
        <Button 
          variant="secondary" 
          onClick={() => onView(survey)}
        >
          Ver detalle
        </Button>
        
        {canRespond && (
          <Button onClick={() => onRespond(survey)}>
            Responder
          </Button>
        )}
      </div>
    </Card>
  );
};

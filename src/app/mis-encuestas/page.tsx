"use client";
import React, { useState, useEffect } from 'react';
import { MySurveyList } from '@/modulos/Surveys/components/MySurveyList';
import { Card } from '@/mk/components/ui/Card/Card';

export default function MisEncuestasPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In the admin app, we assume the user is always an ADM (administrator)
    // No need to check for department associations as administrators
    // see surveys based on their role (admin/directive), not department
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <p>Cargando...</p>
      </div>
    );
  }

  // For administrators, we don't filter by department
  // The API will return surveys targeted to the admin's role
  return (
    <div style={{ padding: '16px' }}>
      <MySurveyList dptoId={undefined} />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  MkPageHeader, 
  MkTable, 
  MkBadge, 
  MkButton, 
  MkSearchInput, 
  MkEmptyState 
} from '@/components/mk';
import { useNavigate } from 'react-router-dom';
import { useSurveys } from '@/hooks/useSurveys';
import { SurveyStatusBadge } from './components/SurveyStatusBadge';

export const SurveyListView = () => {
  const navigate = useNavigate();
  const { surveys, isLoading, filters, setFilters, deleteSurvey } = useSurveys();

  const columns = [
    { 
      label: 'Título', 
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900 leading-none">{row.title}</div>
          <div className="text-xs text-slate-500 mt-1 line-clamp-1">{row.description}</div>
        </div>
      ) 
    },
    { 
      label: 'Tipo', 
      render: (row) => (
        <div className="flex flex-col gap-1 items-start">
          <MkBadge 
            variant={row.type === 'assembly' ? 'indigo' : 'default'} 
            label={row.type === 'assembly' ? 'Asamblea' : 'General'} 
          />
          {row.is_weighted && (
            <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded uppercase">
              Ponderado
            </span>
          )}
        </div>
      )
    },
    { 
      label: 'Estado', 
      render: (row) => <SurveyStatusBadge status={row.status} active={row.is_active_now} />
    },
    { 
      label: 'Participación', 
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium">{row.total_voters} / {row.estimated_audience}</div>
          <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500" 
              style={{ width: `${row.participation_percentage}%` }} 
            />
          </div>
        </div>
      )
    },
    { 
       label: 'Creado', 
       render: (row) => (
         <div className="text-xs text-slate-500">
           {row.created_at_fmt}
           <div className="mt-0.5">{row.created_by_info?.name || 'N/A'}</div>
         </div>
       )
    },
    {
      label: 'Acciones',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <MkButton 
            variant="ghost" 
            size="sm" 
            icon="edit" 
            onClick={() => navigate(`/surveys/edit/${row.id}`)} 
          />
          <MkButton 
            variant="ghost" 
            size="sm" 
            icon="eye" 
            onClick={() => navigate(`/surveys/detail/${row.id}`)} 
          />
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <MkPageHeader 
        title="Encuestas"
        description="Gestione las encuestas y sondeos de su comunidad"
        actions={
          <MkButton 
            label="Crear Encuesta" 
            icon="plus" 
            onClick={() => navigate('/surveys/create')} 
          />
        }
      />

      <div className="mt-6 mb-6">
        <MkSearchInput 
          placeholder="Buscar encuestas..." 
          value={filters.search}
          onChange={(val) => setFilters({ ...filters, search: val })}
        />
      </div>

      <MkTable 
        columns={columns} 
        data={surveys} 
        isLoading={isLoading}
        isEmpty={surveys.length === 0}
        emptyState={
          <MkEmptyState 
            title="No hay encuestas" 
            description="Comience creando su primera encuesta para interactuar con los propietarios."
            action={<MkButton label="Crear Encuesta" onClick={() => navigate('/surveys/create')} />}
          />
        }
      />
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';

export interface LegacyWorkspaceCard {
  title: string;
  summary: string;
  path: string;
  cta: string;
  accent?: string;
}

interface LegacyWorkspacePanelProps {
  title: string;
  description: string;
  cards: LegacyWorkspaceCard[];
  helperText?: string;
}

const LegacyWorkspacePanel: React.FC<LegacyWorkspacePanelProps> = ({
  title,
  description,
  cards,
  helperText,
}) => {
  return (
    <div className='flex flex-col gap-6'>
      <div className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h2 className='text-2xl font-bold text-slate-900'>{title}</h2>
        <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-600'>{description}</p>
        {helperText ? (
          <div className='mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500'>
            {helperText}
          </div>
        ) : null}
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3'>
        {cards.map((card) => (
          <Link
            key={`${title}-${card.title}`}
            to={card.path}
            className={`rounded-xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
              card.accent || 'border-slate-200 bg-white'
            }`}
          >
            <div className='text-lg font-semibold text-slate-900'>{card.title}</div>
            <p className='mt-2 text-sm leading-6 text-slate-600'>{card.summary}</p>
            <div className='mt-4 text-sm font-semibold text-slate-900'>{card.cta}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LegacyWorkspacePanel;

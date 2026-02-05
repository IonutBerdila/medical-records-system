import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader title="Admin" description="Panou de administrare (placeholder)." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5" onClick={() => navigate('/admin/users')}>
          <h2 className="text-xl font-semibold text-slate-900">Utilizatori</h2>
          <p className="mt-1 text-sm text-slate-600">Gestionează utilizatorii și rolurile.</p>
          <Button variant="ghost" className="mt-3" onClick={(e) => { e.stopPropagation(); navigate('/admin/users'); }}>
            Deschide
          </Button>
        </Card>
        <Card className="p-5" onClick={() => navigate('/admin/audit')}>
          <h2 className="text-xl font-semibold text-slate-900">Audit</h2>
          <p className="mt-1 text-sm text-slate-600">Jurnal de audit și conformitate.</p>
          <Button variant="ghost" className="mt-3" onClick={(e) => { e.stopPropagation(); navigate('/admin/audit'); }}>
            Deschide
          </Button>
        </Card>
      </div>
    </div>
  );
};

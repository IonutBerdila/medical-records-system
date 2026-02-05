import React from 'react';
import { PageHeader } from '../ui/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { Card } from '../ui/Card';

export const AdminUsersPage: React.FC = () => (
  <div className="space-y-6">
    <PageHeader title="Utilizatori" description="Gestionează utilizatorii (placeholder)." />
    <Card className="p-6">
      <EmptyState
        title="Lista de utilizatori"
        description="Backend nu expune încă endpoint-uri pentru listare/editare utilizatori. Această pagină va fi populată când API-ul va fi disponibil."
      />
    </Card>
  </div>
);

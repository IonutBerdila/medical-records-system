import React from 'react';
import { PageHeader } from '../ui/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { Card } from '../ui/Card';

export const AdminAuditPage: React.FC = () => (
  <div className="space-y-6">
    <PageHeader title="Audit" description="Jurnal de audit (placeholder)." />
    <Card className="p-6">
      <EmptyState
        title="Jurnal audit"
        description="Nu există încă endpoint pentru evenimente de audit. Această pagină va afișa loguri de acces și acțiuni când backend-ul va suporta audit."
      />
    </Card>
  </div>
);

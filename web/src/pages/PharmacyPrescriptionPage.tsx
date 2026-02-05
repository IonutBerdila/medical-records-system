import React from 'react';
import { PageHeader } from '../ui/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { Card } from '../ui/Card';

export const PharmacyPrescriptionPage: React.FC = () => (
  <div className="space-y-6">
    <PageHeader title="Rețetă" description="Vizualizare limitată a rețetei (placeholder)." />
    <Card className="p-6">
      <EmptyState
        title="Vizualizare rețetă"
        description="Această pagină va afișa detaliile unei rețete după scanare/validare token. Backend nu expune încă endpoint pentru acest caz."
      />
    </Card>
  </div>
);

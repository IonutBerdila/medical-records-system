import React from 'react';
import { Card } from '../ui/Card';

export const AdminConfigPage: React.FC = () => (
  <Card className="p-6">
    <h1 className="text-xl font-semibold text-slate-900">Configurare sistem</h1>
    <p className="mt-2 text-sm text-slate-600">
      Setarile de sistem pentru administratori vor fi afisate aici.
    </p>
  </Card>
);


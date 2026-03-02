import React from 'react';
import { Card } from '../ui/Card';

export const AppointmentsPage: React.FC = () => (
  <div className="flex flex-col gap-5">
    <Card className="flex flex-col items-center justify-center p-12 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Programări</h1>
      <p className="mt-3 max-w-sm text-sm text-slate-600">
        Programările vor fi disponibile mai târziu.
      </p>
    </Card>
  </div>
);

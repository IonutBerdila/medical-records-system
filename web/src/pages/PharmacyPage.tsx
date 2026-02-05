import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { IconQr } from '../ui/Icons';

export const PharmacyPage: React.FC = () => {
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) navigate('/pharmacy/prescription');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Portal Farmacie MedRecord</h1>
        <p className="mt-1 text-slate-600">Acces securizat la rețete.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-1 max-w-2xl">
        {/* Scan QR */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900">Scanează codul QR al pacientului</h2>
          <p className="mt-1 text-sm text-slate-600">
            Poziționează codul QR al pacientului în fața camerei.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-teal-200 bg-slate-50/80 py-12 px-6">
            <IconQr className="h-16 w-16 text-teal-400" />
            <p className="mt-4 text-sm text-slate-600 text-center">
              Zona de scanare va apărea după pornirea camerei.
            </p>
            <Button className="mt-6" disabled>
              Pornește camera
            </Button>
          </div>
        </Card>

        <div className="flex items-center gap-4 text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-sm font-medium">SAU</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Enter token */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900">Introdu tokenul de acces</h2>
          <form onSubmit={handleTokenSubmit} className="mt-4 space-y-4">
            <Input
              label="Token pacient"
              placeholder="MR-XXXX-XXXX-XXXX-XXXX"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              helper="Introdu tokenul furnizat de pacient."
            />
            <Button type="submit" disabled={!token.trim()}>
              Accesează rețeta
            </Button>
          </form>
        </Card>
      </div>

      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} MedRecord. Conformitate HIPAA • Conexiune criptată.
      </footer>
    </div>
  );
};

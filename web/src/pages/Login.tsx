import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { IconPulse, IconShield, IconClock, IconShare } from '../ui/Icons';
import { useAuth } from '../app/auth/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      await login({ email, password });
      toast.success('Autentificare reușită');
      const redirectTo = location.state?.from?.pathname ?? '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string; title?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as { response?: { data?: { title?: string } } })?.response?.data?.title ||
        (err as { message?: string })?.message ||
        'Email sau parolă incorecte';
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Stânga: branding teal închis (ca referință) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col bg-teal-800 text-white">
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <IconPulse light className="text-teal-200" />
            <div>
              <span className="text-lg font-bold tracking-tight">MedRecord</span>
              <p className="text-xs text-teal-200/90">Fișă medicală personală digitală</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center px-10 xl:px-14 max-w-md">
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight">
            Gestionare medicală în siguranță
          </h1>
          <p className="mt-4 text-teal-100/95 text-base leading-relaxed">
            Accesează istoricul medical complet oricând, oriunde, cu securitate de nivel enterprise.
          </p>
          <ul className="mt-10 space-y-6">
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal-200">
                <IconShield className="h-5 w-5" />
              </span>
              <div>
                <span className="font-semibold text-white">Conform HIPAA & securizat</span>
                <p className="mt-0.5 text-sm text-teal-100/90">
                  Criptare end-to-end pentru informațiile medicale sensibile.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal-200">
                <IconClock className="h-5 w-5" />
              </span>
              <div>
                <span className="font-semibold text-white">Acces 24/7</span>
                <p className="mt-0.5 text-sm text-teal-100/90">
                  Vizualizează fișa, rețetele și rezultatele oricând.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal-200">
                <IconShare className="h-5 w-5" />
              </span>
              <div>
                <span className="font-semibold text-white">Partajare cu medici</span>
                <p className="mt-0.5 text-sm text-teal-100/90">
                  Partajează în siguranță istoricul cu profesioniștii de sănătate.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Dreapta: formular */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-[400px]">
          <h2 className="text-2xl font-semibold text-slate-900">Bun venit</h2>
          <p className="mt-2 text-slate-600">
            Conectează-te pentru a accesa fișa ta medicală.
          </p>
          {formError && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {formError}
            </div>
          )}
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              placeholder="ex: email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Parolă"
              type="password"
              placeholder="Introdu parola"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
                <span>Ține-mă minte</span>
              </label>
              <button type="button" className="text-primary font-medium hover:underline" disabled>
                Am uitat parola
              </button>
            </div>
            <Button type="submit" loading={loading} className="w-full">
              Conectare
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            Nu ai cont?{' '}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Înregistrare
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

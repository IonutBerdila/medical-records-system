import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { IconPulse, IconShield, IconClock, IconUsers } from '../ui/Icons';
import { useAuth } from '../app/auth/AuthContext';
import { registerUser, loginUser } from '../app/auth/authApi';
import type { UserRole } from '../app/auth/types';

type RoleChoice = Extract<UserRole, 'Patient' | 'Doctor' | 'Pharmacy'>;

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  doctorLicenseNumber?: string;
  pharmacyLicenseNumber?: string;
}

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState<RoleChoice>('Patient');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfBirthInput, setDateOfBirthInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [doctorLicenseNumber, setDoctorLicenseNumber] = useState('');
  const [pharmacyLicenseNumber, setPharmacyLicenseNumber] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const todayIso = new Date().toISOString().slice(0, 10);

  const formatDateInput = (digits: string): string => {
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)}`;
  };

  const parseDateDigitsToIso = (digits: string): string | null => {
    if (digits.length !== 8) return null;

    const day = Number(digits.slice(0, 2));
    const month = Number(digits.slice(2, 4));
    const year = Number(digits.slice(4, 8));

    if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
      return null;
    }

    if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const candidate = new Date(year, month - 1, day);
    const isValidCalendarDate =
      candidate.getFullYear() === year &&
      candidate.getMonth() === month - 1 &&
      candidate.getDate() === day;

    if (!isValidCalendarDate) return null;

    const monthPart = String(month).padStart(2, '0');
    const dayPart = String(day).padStart(2, '0');
    const iso = `${year}-${monthPart}-${dayPart}`;
    return iso <= todayIso ? iso : null;
  };

  const handleDateOfBirthChange = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, 8);
    setDateOfBirthInput(formatDateInput(digits));

    const isoDate = parseDateDigitsToIso(digits);
    setDateOfBirth(isoDate ?? '');
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (!firstName.trim()) next.firstName = 'Prenumele este obligatoriu.';
    if (!lastName.trim()) next.lastName = 'Numele este obligatoriu.';

    if (!dateOfBirth) {
      next.dateOfBirth = 'Data nașterii este obligatorie.';
    } else if (new Date(dateOfBirth) > new Date()) {
      next.dateOfBirth = 'Data nașterii nu poate fi în viitor.';
    }

    if (!email.trim()) {
      next.email = 'Emailul este obligatoriu.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'Introdu un email valid.';
    }

    if (!password) {
      next.password = 'Parola este obligatorie.';
    } else if (password.length < 8) {
      next.password = 'Parola trebuie să aibă cel puțin 8 caractere.';
    }

    if (!confirmPassword) {
      next.confirmPassword = 'Confirmarea parolei este obligatorie.';
    } else if (confirmPassword !== password) {
      next.confirmPassword = 'Parolele nu coincid.';
    }

    if (!termsAccepted) {
      next.terms = 'Trebuie să accepți termenii și politica de confidențialitate.';
    }

    // Rol-specific
    if (role === 'Doctor' && !doctorLicenseNumber.trim()) {
      next.doctorLicenseNumber = 'Numărul de licență este obligatoriu pentru medici.';
    }

    if (role === 'Pharmacy' && !pharmacyLicenseNumber.trim()) {
      next.pharmacyLicenseNumber = 'Numărul de licență este obligatoriu pentru farmacii.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Te rugăm să corectezi câmpurile evidențiate.');
      return;
    }

    setLoading(true);
    try {
      const fullName =
        role === 'Pharmacy'
          ? pharmacyName.trim() || `${firstName} ${lastName}`.trim()
          : `${firstName} ${lastName}`.trim();

      await registerUser({
        email: email.trim(),
        password,
        role,
        fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        doctorLicenseNumber: role === 'Doctor' && doctorLicenseNumber.trim() ? doctorLicenseNumber.trim() : undefined
      });

      if (role === 'Patient') {
        // Auto-login pentru pacient
        await login({ email: email.trim(), password });
        toast.success('Cont creat cu succes. Bine ai venit!');
        navigate('/dashboard', { replace: true });
      } else {
        toast.success('Cont creat. Cererea a fost trimisă pentru aprobare de către admin.');
        navigate('/login', { replace: true });
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        'Înregistrarea a eșuat. Încearcă din nou.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isDoctor = role === 'Doctor';
  const isPharmacy = role === 'Pharmacy';

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen w-full bg-white">
        {/* Stânga: panou turcoaz cu branding și beneficii, la fel ca Login dar cu mesaj de înregistrare */}
        <div className="hidden bg-[#0b85a3] text-white lg:flex lg:w-[41.5%] lg:flex-col">
          <div className="px-8 lg:px-9 pt-9 xl:pt-10 pb-4">
            <div className="flex items-center gap-3">
              <IconPulse light className="text-teal-100" />
              <div>
                <span className="text-lg font-bold tracking-tight">MedRecord</span>
                <p className="text-xs text-teal-100/90">Dosar medical personal digital</p>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-center px-8 lg:px-9 py-10 xl:py-14">
            <div className="max-w-[520px]">
              <h1 className="text-[28px] xl:text-[42px] font-semibold leading-[1.15] tracking-[-0.01em] max-w-[500px]">
                Alătură-te rețelei noastre medicale
              </h1>
              <p className="mt-3 xl:mt-4 text-teal-50 text-[15px] xl:text-[16px] leading-[1.45] max-w-[500px]">
                Creează un cont și începe să-ți gestionezi dosarul medical în siguranță, oriunde te-ai afla.
              </p>
              <ul className="mt-9 xl:mt-12 space-y-5 xl:space-y-7">
                <li className="flex gap-4">
                  <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-teal-100">
                    <IconShield className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-[17px] xl:text-[18px] font-semibold leading-tight text-white">
                      Securitate de nivel bancar
                    </span>
                    <p className="mt-1.5 text-[15px] xl:text-[16px] leading-[1.4] text-teal-100/90">
                      Datele tale sunt criptate și protejate la standarde enterprise.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-teal-100">
                    <IconClock className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-[17px] xl:text-[18px] font-semibold leading-tight text-white">
                      Acces instant
                    </span>
                    <p className="mt-1.5 text-[15px] xl:text-[16px] leading-[1.4] text-teal-100/90">
                      Consultă-ți istoricul medical oricând, de pe orice dispozitiv.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-teal-100">
                    <IconUsers className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-[17px] xl:text-[18px] font-semibold leading-tight text-white">
                      Colaborare fără fricțiuni
                    </span>
                    <p className="mt-1.5 text-[15px] xl:text-[16px] leading-[1.4] text-teal-100/90">
                      Partajează în siguranță informațiile cu medici, farmacii și alți furnizori.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Dreapta: formular de creare cont */}
        <div className="flex flex-1 items-center justify-center bg-white p-6 lg:p-10 xl:p-12">
          <div className="w-full max-w-[440px]">
            <h2 className="text-[24px] font-semibold text-slate-900">Creează cont</h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Începe să-ți gestionezi dosarul medical în siguranță.
            </p>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Prenume"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  error={errors.firstName}
                  showRequiredMark={false}
                  required
                />
                <Input
                  label="Nume"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  error={errors.lastName}
                  showRequiredMark={false}
                  required
                />
              </div>

              <Input
                label="Data nașterii"
                type="text"
                inputMode="numeric"
                autoComplete="bday"
                placeholder="ZZ.LL.AAAA"
                maxLength={10}
                value={dateOfBirthInput}
                onChange={(e) => handleDateOfBirthChange(e.target.value)}
                error={errors.dateOfBirth}
                showRequiredMark={false}
                required
              />

              <Input
                label="Adresă de email"
                type="email"
                placeholder="nume@exemplu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                showRequiredMark={false}
                required
              />

              <Input
                label="Parolă"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helper="Cel puțin 8 caractere. Recomandat: litere mari/mici și cifre."
                error={errors.password}
                showPasswordToggle
                showRequiredMark={false}
                required
              />

              <Input
                label="Confirmă parola"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                showPasswordToggle
                showRequiredMark={false}
                required
              />

              {/* Selector rol: Pacient / Doctor / Farmacie */}
              <div>
                <p className="mb-1 text-sm font-medium text-slate-700">Sunt...</p>
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5 text-sm">
                  {(['Patient', 'Doctor', 'Pharmacy'] as RoleChoice[]).map((r) => {
                    const active = role === r;
                    const label =
                      r === 'Patient' ? 'Pacient' : r === 'Doctor' ? 'Doctor' : 'Farmacie';
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`px-4 py-1.5 rounded-full font-medium transition-colors ${
                          active
                            ? 'bg-[#0b85a3] text-white shadow-sm'
                            : 'bg-transparent text-slate-700 hover:bg-white'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(isDoctor || isPharmacy) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Conturile de <strong>{isDoctor ? 'doctor' : 'farmacie'}</strong> necesită
                  aprobarea unui administrator înainte de a putea folosi aplicația.
                </div>
              )}

              {isDoctor && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Număr licență medic"
                    placeholder="Ex: MD123456"
                    value={doctorLicenseNumber}
                    onChange={(e) => setDoctorLicenseNumber(e.target.value)}
                    error={errors.doctorLicenseNumber}
                    showRequiredMark={false}
                    required
                  />
                  <Input
                    label="Clinică / Spital"
                    placeholder="Ex: City Medical Center"
                  />
                </div>
              )}

              {isPharmacy && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Număr licență farmacie"
                    placeholder="Ex: PH123456"
                    value={pharmacyLicenseNumber}
                    onChange={(e) => setPharmacyLicenseNumber(e.target.value)}
                    error={errors.pharmacyLicenseNumber}
                    showRequiredMark={false}
                    required
                  />
                  <Input
                    label="Nume farmacie"
                    placeholder="Ex: Downtown Pharmacy"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                  />
                </div>
              )}

              <div className="mt-1 flex items-start gap-2 text-sm">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="terms" className="text-slate-600">
                  Sunt de acord cu{' '}
                  <button
                    type="button"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Termenii
                  </button>{' '}
                  și{' '}
                  <button
                    type="button"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Politica de confidențialitate
                  </button>
                  .
                  {errors.terms && (
                    <span className="mt-1 block text-xs text-red-600">{errors.terms}</span>
                  )}
                </label>
              </div>

              <Button type="submit" loading={loading} className="mt-2 w-full">
                Creează cont
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Ai deja un cont?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Autentifică-te
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

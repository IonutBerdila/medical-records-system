import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { IconPulse, IconShield, IconClock, IconUsers } from '../ui/Icons';
import { useAuth } from '../app/auth/AuthContext';
import { registerUser, loginUser } from '../app/auth/authApi';
import { fetchSpecialties, type SpecialtyOption } from '../app/metadata/metadataApi';
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
  pharmacyLicenseNumber?: string;
  professionalLicenseNumber?: string;
  primarySpecialtyId?: string;
  primaryInstitutionName?: string;
  institutionCity?: string;
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
  const [pharmacyLicenseNumber, setPharmacyLicenseNumber] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [professionalLicenseNumber, setProfessionalLicenseNumber] = useState('');
  const [primarySpecialtyId, setPrimarySpecialtyId] = useState('');
  const [primaryInstitutionName, setPrimaryInstitutionName] = useState('');
  const [institutionCity, setInstitutionCity] = useState('');
  const [specialties, setSpecialties] = useState<SpecialtyOption[] | null>(null);
  const [specialtiesLoading, setSpecialtiesLoading] = useState(false);
  const [specialtiesError, setSpecialtiesError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [doctorStep, setDoctorStep] = useState<1 | 2>(1);

  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);

  // Valoarea efectivă din input (vizibilă doar ca poziție de cursor):
  // "3" -> "3", "300" -> "30.0", "3006" -> "30.06", "30061990" -> "30.06.1990"
  const formatDateInput = (digits: string): string => {
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)}`;
  };

  // Masca vizuală "ZZ.LL.AAAA" unde literele dispar progresiv când tastezi:
  const formatDateMask = (digits: string): string => {
    const maskChars = ['Z', 'Z', '.', 'L', 'L', '.', 'A', 'A', 'A', 'A'];
    const positions = [0, 1, 3, 4, 6, 7, 8, 9]; // indecșii pentru cele 8 cifre

    const result = [...maskChars];
    for (let i = 0; i < digits.length && i < positions.length; i++) {
      result[positions[i]] = digits[i];
    }

    return result.join('');
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
    setDateOfBirthInput(digits);

    const isoDate = parseDateDigitsToIso(digits);
    setDateOfBirth(isoDate ?? '');
  };

  const validateStep1 = (): boolean => {
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

    if (role === 'Pharmacy' && !pharmacyLicenseNumber.trim()) {
      next.pharmacyLicenseNumber = 'Numărul de licență este obligatoriu pentru farmacii.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateDoctorStep2 = (): boolean => {
    const next: FieldErrors = {};

    if (!professionalLicenseNumber.trim()) {
      next.professionalLicenseNumber = 'Numărul licenței profesionale este obligatoriu pentru medici.';
    }
    if (!primarySpecialtyId) {
      next.primarySpecialtyId = 'Specialitatea principală este obligatorie.';
    }
    if (!primaryInstitutionName.trim()) {
      next.primaryInstitutionName = 'Instituția medicală principală este obligatorie.';
    }

    setErrors((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === 'Doctor') {
      if (doctorStep === 1) {
        const ok = validateStep1();
        if (!ok) {
          toast.error('Te rugăm să corectezi câmpurile evidențiate.');
          return;
        }
        setDoctorStep(2);
        return;
      }

      const okStep2 = validateDoctorStep2();
      if (!okStep2) {
        toast.error('Te rugăm să completezi datele profesionale obligatorii.');
        return;
      }
    } else {
      const ok = validateStep1();
      if (!ok) {
        toast.error('Te rugăm să corectezi câmpurile evidențiate.');
        return;
      }
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
        professionalLicenseNumber:
          role === 'Doctor' && professionalLicenseNumber.trim() ? professionalLicenseNumber.trim() : undefined,
        primarySpecialtyId: role === 'Doctor' && primarySpecialtyId ? primarySpecialtyId : undefined,
        primaryInstitutionName:
          role === 'Doctor' && primaryInstitutionName.trim() ? primaryInstitutionName.trim() : undefined,
        institutionCity: role === 'Doctor' && institutionCity.trim() ? institutionCity.trim() : undefined
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

  React.useEffect(() => {
    if (!isDoctor) return;
    if (specialties || specialtiesLoading) return;

    const load = async () => {
      setSpecialtiesLoading(true);
      setSpecialtiesError(null);
      try {
        const data = await fetchSpecialties();
        setSpecialties(data);
      } catch (err: any) {
        console.error(err);
        setSpecialtiesError('Nu am putut încărca lista de specialități. Încearcă din nou mai târziu.');
      } finally {
        setSpecialtiesLoading(false);
      }
    };

    void load();
  }, [isDoctor, specialties, specialtiesLoading]);

  React.useEffect(() => {
    if (!isDoctor) {
      setDoctorStep(1);
    }
  }, [isDoctor]);

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
            <h2 className="text-[24px] font-semibold text-slate-900">
              {isDoctor && doctorStep === 2 ? 'Profil profesional' : 'Creează cont'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              {isDoctor
                ? doctorStep === 1
                  ? 'Completează datele de bază pentru acces în platformă.'
                  : 'Aceste informații sunt necesare pentru verificarea și aprobarea contului de doctor.'
                : 'Începe să-ți gestionezi dosarul medical în siguranță.'}
            </p>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
              {isDoctor && (
                <div className="mb-3">
                  <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                          doctorStep === 1
                            ? 'bg-[#0b85a3] text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        1
                      </span>
                      <span
                        className={
                          doctorStep === 1 ? 'text-slate-900' : 'text-slate-500'
                        }
                      >
                        Date de cont
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-slate-200" />
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                          doctorStep === 2
                            ? 'bg-[#0b85a3] text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        2
                      </span>
                      <span
                        className={
                          doctorStep === 2 ? 'text-slate-900' : 'text-slate-500'
                        }
                      >
                        Profil profesional
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PASUL 1 – date de cont (Doctor) sau formular simplu pentru celelalte roluri */}
              {(!isDoctor || doctorStep === 1) && (
                <>
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

                  {/* Data nașterii cu mască vizuală ZZ.LL.AAAA */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">
                      Data nașterii
                    </label>
                    <div className="relative">
                      <input
                        ref={dateInputRef}
                        type="text"
                        inputMode="numeric"
                        autoComplete="bday"
                        maxLength={10}
                        value={formatDateInput(dateOfBirthInput)}
                        onChange={(e) => handleDateOfBirthChange(e.target.value)}
                        onFocus={() => {
                          const el = dateInputRef.current;
                          if (!el) return;
                          const len = el.value.length;
                          // folosim rAF ca să mutăm cursorul după ce browserul procesează focusul
                          requestAnimationFrame(() => {
                            try {
                              el.setSelectionRange(len, len);
                            } catch {
                              // ignore
                            }
                          });
                        }}
                        aria-invalid={!!errors.dateOfBirth}
                        className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-transparent caret-slate-900 outline-none transition-colors focus:ring-2 focus:ring-primary/20 ${
                          errors.dateOfBirth
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-slate-200 focus:border-primary'
                        }`}
                        required
                      />
                      {/* Overlay cu masca ZZ.LL.AAAA */}
                      <div className="pointer-events-none absolute inset-0 flex items-center px-4 text-sm">
                        {formatDateMask(dateOfBirthInput).split('').map((ch, idx) => {
                          const digitsLen = dateOfBirthInput.length;
                          const isDigit = /\d/.test(ch);

                          let isActiveDot = false;
                          if (ch === '.') {
                            if (idx === 2 && digitsLen >= 3) isActiveDot = true;
                            if (idx === 5 && digitsLen >= 5) isActiveDot = true;
                          }

                          const cls = isDigit || isActiveDot ? 'text-slate-900' : 'text-slate-300';
                          return (
                            <span key={idx} className={cls}>
                              {ch}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    {errors.dateOfBirth && (
                      <p className="text-xs text-red-600" role="alert">
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>

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
                </>
              )}

              {/* PASUL 2 – profil profesional doctor */}
              {isDoctor && doctorStep === 2 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#FEE2E2] bg-[#FEE2E2] px-4 py-3 text-sm text-[#EF4444]">
                    Conturile de <strong>doctor</strong> necesită aprobarea unui administrator
                    înainte de a putea folosi aplicația.
                  </div>

                  {/* Rând 1: Instituție medicală / Oraș instituție */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Instituție medicală"
                      placeholder="Ex: Spitalul Clinic Județean"
                      value={primaryInstitutionName}
                      onChange={(e) => setPrimaryInstitutionName(e.target.value)}
                      error={errors.primaryInstitutionName}
                      showRequiredMark
                      required
                    />
                    <Input
                      label="Oraș instituție"
                      placeholder="Ex: Cluj-Napoca"
                      value={institutionCity}
                      onChange={(e) => setInstitutionCity(e.target.value)}
                      error={errors.institutionCity}
                    />
                  </div>

                  {/* Rând 2: Licență profesională / Specialitate */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Licență profesională"
                      placeholder="Ex: 123456"
                      value={professionalLicenseNumber}
                      onChange={(e) => setProfessionalLicenseNumber(e.target.value)}
                      error={errors.professionalLicenseNumber}
                      showRequiredMark
                      required
                    />

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Specialitate principală
                      </label>
                      <select
                        className={`block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none bg-none ${
                          primarySpecialtyId ? 'text-slate-900' : 'text-slate-500'
                        }`}
                        value={primarySpecialtyId}
                        onChange={(e) => setPrimarySpecialtyId(e.target.value)}
                      >
                        <option value="">Selectează</option>
                        {specialtiesLoading && <option value="">Se încarcă...</option>}
                        {!specialtiesLoading &&
                          specialties &&
                          specialties.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                      </select>
                      {errors.primarySpecialtyId && (
                        <p className="mt-1 text-xs text-red-600">{errors.primarySpecialtyId}</p>
                      )}
                      {specialtiesError && (
                        <p className="mt-1 text-xs text-amber-700">{specialtiesError}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    Programul de lucru și disponibilitatea pentru programări se vor configura după
                    aprobarea contului.
                  </p>
                </div>
              )}

              {/* Butoane acțiune */}
              {isDoctor && doctorStep === 2 ? (
                <div className="mt-4 flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-[120px]"
                    onClick={() => setDoctorStep(1)}
                  >
                    Înapoi
                  </Button>
                  <Button type="submit" loading={loading} className="flex-1">
                    Creează cont
                  </Button>
                </div>
              ) : (
                <Button type="submit" loading={loading} className="mt-2 w-full">
                  {isDoctor ? 'Continuă' : 'Creează cont'}
                </Button>
              )}
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

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { IconPulse, IconShield, IconClock, IconUsers } from "../ui/Icons";
import { useAuth } from "../app/auth/AuthContext";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      await login({ email, password });
      toast.success("Autentificare reușită");
      const redirectTo = location.state?.from?.pathname ?? "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      const message =
        (
          err as {
            response?: { data?: { message?: string; title?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (err as { response?: { data?: { title?: string } } })?.response?.data
          ?.title ||
        (err as { message?: string })?.message ||
        "Email sau parolă incorecte";
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen w-full bg-white">
        {/* Stânga: panou turcoaz cu branding și beneficii (după layout-ul din mock) */}
        <div className="hidden bg-[#0b85a3] text-white lg:flex lg:w-[41.5%] lg:flex-col">
          <div className="px-8 lg:px-9 pt-9 xl:pt-10 pb-4">
            <div className="flex items-center gap-3">
              <IconPulse light className="text-teal-100" />
              <div>
                <span className="text-lg font-bold tracking-tight">
                  MedRecord
                </span>
                <p className="text-xs text-teal-100/90">
                  Dosar medical personal digital
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-center px-8 lg:px-9 py-10 xl:py-14">
            <div className="max-w-[520px]">
              <h1 className="text-[28px] xl:text-[42px] font-semibold leading-[1.15] tracking-[-0.01em] max-w-[500px]">
                Administrare medicală securizată
              </h1>
              <p className="mt-3 xl:mt-4 text-teal-50 text-[15px] xl:text-[16px] leading-[1.45] max-w-[500px]">
                Accesează istoricul medical complet oricând, oriunde, cu
                securitate de nivel enterprise.
              </p>
              <ul className="mt-9 xl:mt-12 space-y-5 xl:space-y-7">
                <li className="flex gap-4">
                  <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-teal-100">
                    <IconShield className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-[17px] xl:text-[18px] font-semibold leading-tight text-white">
                      Conform HIPAA &amp; securizat
                    </span>
                    <p className="mt-1.5 text-[15px] xl:text-[16px] leading-[1.4] text-teal-100/90">
                      Criptare end-to-end pentru informațiile tale medicale
                      sensibile.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-teal-100">
                    <IconClock className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-[17px] xl:text-[18px] font-semibold leading-tight text-white">
                      Acces 24/7
                    </span>
                    <p className="mt-1.5 text-[15px] xl:text-[16px] leading-[1.4] text-teal-100/90">
                      Vezi fișa medicală, rețetele și rezultatele ori de câte
                      ori ai nevoie.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-teal-100">
                    <IconUsers className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-[17px] xl:text-[18px] font-semibold leading-tight text-white">
                      Partajare cu furnizorii
                    </span>
                    <p className="mt-1.5 text-[15px] xl:text-[16px] leading-[1.4] text-teal-100/90">
                      Partajează în siguranță istoricul tău medical cu
                      profesioniștii din sănătate.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Dreapta: formular de login, identic ca structură cu mock, tradus în română */}
        <div className="flex flex-1 items-center justify-center bg-white p-6 lg:p-10 xl:p-12">
          <div className="w-full max-w-[380px]">
            <h2 className="text-[22px] font-semibold text-slate-900">
              Bun venit înapoi
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Autentifică-te pentru a accesa dosarul tău medical.
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
                label="Adresă de email"
                type="email"
                placeholder="Nume@exemplu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                showRequiredMark={false}
                required
              />
              <Input
                label="Parolă"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                showPasswordToggle
                showRequiredMark={false}
                required
              />
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span>Ține-mă minte</span>
                </label>
                <button
                  type="button"
                  className="font-medium text-[#0b85a3] hover:underline"
                  disabled
                >
                  Ai uitat parola?
                </button>
              </div>
              <Button
                type="submit"
                loading={loading}
                className="w-full !bg-[#0b85a3] !hover:bg-[#0b85a3] focus:ring-[#0b85a3]/20"
              >
                Autentificare
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-600">
              Nu ai încă un cont?{" "}
              <Link
                to="/signup"
                className="font-medium text-[#0b85a3] hover:underline"
              >
                Înregistrează-te
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

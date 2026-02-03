import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Layout } from '../ui/Layout';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { registerUser } from '../app/auth/authApi';
import type { UserRole } from '../app/auth/types';

const roles: UserRole[] = ['Patient', 'Doctor', 'Pharmacy', 'Admin'];

export const SignupStep1: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Patient');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerUser({ email, password, role, fullName });
      toast.success('Cont creat cu succes');
      navigate('/signup/extra', { replace: true });
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

  return (
    <Layout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-text">Sign Up</h1>
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary/20" />
          </div>
        </div>

        <Card className="p-5">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              placeholder="Enter email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Full name"
              placeholder="Enter full name..."
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <label className="flex flex-col gap-1 text-sm text-mutedText">
              <span>Role</span>
              <select
                className="h-11 rounded-full border border-borderSoft/80 bg-white px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" loading={loading}>
              Continue
            </Button>
          </form>
        </Card>

        <div className="text-center text-xs text-mutedText">
          Ai deja un cont?{' '}
          <Link to="/login" className="text-primary font-medium">
            Log In
          </Link>
        </div>
      </div>
    </Layout>
  );
};


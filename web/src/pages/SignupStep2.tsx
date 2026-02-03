import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Layout } from '../ui/Layout';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { storage, type ProfileDraft } from '../app/storage';

export const SignupStep2: React.FC = () => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ProfileDraft>(() => storage.getProfileDraft() ?? { fullName: '', phone: '' });

  useEffect(() => {
    storage.setProfileDraft(draft);
  }, [draft]);

  const handleCreate = () => {
    toast.success('Profil salvat local. Te poți autentifica acum.');
    navigate('/login', { replace: true });
  };

  return (
    <Layout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-text">Complete Profile</h1>
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
          </div>
        </div>

        <Card className="p-5 flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="h-24 w-full rounded-2xl border border-dashed border-primary/40 flex items-center justify-center text-xs text-primary">
              Choose Photo (placeholder)
            </div>
          </div>

          <Input
            label="Full name"
            placeholder="Enter full name..."
            value={draft.fullName}
            onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
          />
          <Input
            label="Phone number"
            placeholder="Enter phone number..."
            value={draft.phone}
            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
          />

          <Button onClick={handleCreate}>Create user</Button>
        </Card>
      </div>
    </Layout>
  );
};


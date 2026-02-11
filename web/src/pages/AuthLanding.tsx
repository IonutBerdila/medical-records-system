import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../ui/Layout';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const AuthLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-text mb-1">Bun venit în MedRecord</h1>
          <p className="text-sm text-mutedText">
            Creează un cont nou sau autentifică-te pentru a continua.
          </p>
        </div>
        <Card className="p-5 flex flex-col gap-3">
          <Button onClick={() => navigate('/signup')}>Sign Up</Button>
          <Button variant="secondary" onClick={() => navigate('/login')}>
            Log In
          </Button>
        </Card>
      </div>
    </Layout>
  );
};


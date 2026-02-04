import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Layout } from "../ui/Layout";
import { Card } from "../ui/Card";
import { getMyPatients } from "../app/doctor/doctorApi";
import type { DoctorPatientDto } from "../app/doctor/types";

export const DoctorPatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<DoctorPatientDto[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMyPatients()
      .then(setPatients)
      .catch((err: any) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.title ||
          err?.message ||
          "Eroare la încărcare";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-semibold text-text">Pacienții mei</h1>
        {patients.length === 0 ? (
          <Card className="p-6 text-center text-sm text-mutedText">
            Niciun pacient nu ți-a acordat încă acces. Pacienții pot face acest
            lucru din secțiunea „Acordare acces”.
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {patients.map((p) => (
              <Card
                key={p.patientUserId}
                className="cursor-pointer p-4 transition-colors hover:bg-primary/5"
                onClick={() => navigate(`/doctor/patients/${p.patientUserId}`)}
              >
                <div className="font-medium text-text">
                  {p.fullName || p.email || p.patientUserId}
                </div>
                {p.email && (
                  <div className="text-sm text-mutedText">{p.email}</div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

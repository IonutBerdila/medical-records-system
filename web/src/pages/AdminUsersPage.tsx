import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Tabs } from '../ui/Tabs';
import { getAdminUsers, approveUser, rejectUser } from '../app/admin/adminApi';
import type { AdminUserDto } from '../app/admin/types';

const ROLES = [
  { id: 'All', label: 'Toți' },
  { id: 'Patient', label: 'Pacienți' },
  { id: 'Doctor', label: 'Medici' },
  { id: 'Pharmacy', label: 'Farmacii' },
  { id: 'Admin', label: 'Admins' }
];

const PAGE_SIZE = 20;

export const AdminUsersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleParam = searchParams.get('role') ?? 'All';
  const statusParam = searchParams.get('status') ?? '';
  const qParam = searchParams.get('q') ?? '';

  const [role, setRole] = useState(roleParam);
  const [status, setStatus] = useState(statusParam);
  const [search, setSearch] = useState(qParam);
  const [debouncedSearch, setDebouncedSearch] = useState(qParam);
  const [skip, setSkip] = useState(0);
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ user: AdminUserDto; reason: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    getAdminUsers({
      role: role === 'All' ? undefined : role,
      status: status || undefined,
      search: debouncedSearch || undefined,
      skip,
      take: PAGE_SIZE
    })
      .then((res) => {
        setUsers(res.users);
        setTotal(res.total);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message ?? 'Eroare la listarea utilizatorilor.');
      })
      .finally(() => setLoading(false));
  }, [role, status, debouncedSearch, skip]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (role !== 'All') next.set('role', role);
      else next.delete('role');
      if (status) next.set('status', status);
      else next.delete('status');
      if (debouncedSearch) next.set('q', debouncedSearch);
      else next.delete('q');
      return next;
    });
  }, [role, status, debouncedSearch, setSearchParams]);

  const handleApprove = (user: AdminUserDto) => {
    setActionLoading(user.userId);
    approveUser(user.userId)
      .then(() => {
        toast.success('Cont aprobat.');
        fetchUsers();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message ?? 'Eroare la aprobare.');
      })
      .finally(() => setActionLoading(null));
  };

  const handleRejectSubmit = () => {
    if (!rejectModal || !rejectModal.reason.trim()) {
      toast.error('Introduceți motivul respingerii.');
      return;
    }
    setActionLoading(rejectModal.user.userId);
    rejectUser(rejectModal.user.userId, { reason: rejectModal.reason.trim() })
      .then(() => {
        toast.success('Cont respins.');
        setRejectModal(null);
        fetchUsers();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message ?? 'Eroare la respingere.');
      })
      .finally(() => setActionLoading(null));
  };

  const displayName = (u: AdminUserDto) => u.fullName || u.pharmacyName || u.email;
  const approvalStatus = (u: AdminUserDto) => u.approvalStatus;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilizatori"
        description="Lista utilizatori cu filtre și acțiuni de aprobare/respingere."
      />
      <Card className="p-4">
        <Tabs
          tabs={ROLES}
          activeId={role}
          onChange={(id) => { setRole(id); setSkip(0); }}
        />
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Input
            type="text"
            placeholder="Căutare email / nume / licență..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSkip(0); }}
            className="max-w-xs"
          />
          {(role === 'Doctor' || role === 'Pharmacy') && (
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setSkip(0); }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Toate statusurile</option>
              <option value="Pending">În așteptare</option>
              <option value="Approved">Aprobate</option>
              <option value="Rejected">Respinse</option>
            </select>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Se încarcă...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Niciun utilizator găsit.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 font-medium text-slate-700">Email</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Rol</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Nume / Farmacie</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Creat</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId} className="border-b border-slate-100">
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.roles.join(', ')}</td>
                    <td className="px-4 py-3">{displayName(u)}</td>
                    <td className="px-4 py-3">
                      {approvalStatus(u) && (
                        <span
                          className={
                            approvalStatus(u) === 'Approved'
                              ? 'text-teal-600'
                              : approvalStatus(u) === 'Rejected'
                              ? 'text-red-600'
                              : 'text-amber-600'
                          }
                        >
                          {approvalStatus(u)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.createdAtUtc
                        ? new Date(u.createdAtUtc).toLocaleDateString('ro-RO')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {approvalStatus(u) === 'Pending' && (
                        <span className="flex gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={actionLoading !== null}
                            onClick={() => handleApprove(u)}
                          >
                            Aprobă
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading !== null}
                            onClick={() => setRejectModal({ user: u, reason: '' })}
                          >
                            Respinge
                          </Button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <span className="text-sm text-slate-500">
              {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} din {total}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={skip === 0}
                onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
              >
                Înapoi
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={skip + PAGE_SIZE >= total}
                onClick={() => setSkip((s) => s + PAGE_SIZE)}
              >
                Înainte
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="Respinge cont"
      >
        {rejectModal && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Respinge utilizatorul <strong>{rejectModal.user.email}</strong>. Motivul este obligatoriu.
            </p>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={3}
              maxLength={500}
              placeholder="Motivul respingerii..."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRejectModal(null)}>
                Anulare
              </Button>
              <Button
                variant="primary"
                disabled={!rejectModal.reason.trim() || actionLoading !== null}
                onClick={handleRejectSubmit}
              >
                Respinge
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

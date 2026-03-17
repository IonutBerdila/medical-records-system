import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { getAdminApprovals, approveUser, rejectUser } from '../app/admin/adminApi';
import type { AdminApprovalsResponse, AdminUserDto } from '../app/admin/types';

type RoleFilter = 'All' | 'Doctor' | 'Pharmacy';

export const AdminApprovalsPage: React.FC = () => {
  const [data, setData] = useState<AdminApprovalsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<RoleFilter>('All');
  const [status, setStatus] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [skip, setSkip] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approveModalUser, setApproveModalUser] = useState<AdminUserDto | null>(null);
  const [rejectModalUser, setRejectModalUser] = useState<AdminUserDto | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAdminApprovals({
        role: role === 'All' ? undefined : role,
        status,
        skip,
        take: 50
      });
      setData(res);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        'Eroare la încărcarea listelor de aprobare.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [role, status, skip]);

  const handleApprove = async (user: AdminUserDto) => {
    setProcessingId(user.userId);
    try {
      await approveUser(user.userId, {});
      toast.success('Utilizatorul a fost aprobat.');
      void load();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        'A apărut o eroare la aprobarea utilizatorului.';
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (user: AdminUserDto, reason: string) => {
    if (!reason.trim()) {
      toast.error('Te rugăm să introduci motivul respingerii.');
      return;
    }
    setProcessingId(user.userId);
    try {
      await rejectUser(user.userId, { reason: reason.trim() });
      toast.success('Utilizatorul a fost respins.');
      void load();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        'A apărut o eroare la respingerea utilizatorului.';
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">
            Gestionează conturile de doctori și farmacii aflate în așteptare
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Rol</span>
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as RoleFilter);
                setSkip(0);
              }}
            >
              <option value="All">Toate</option>
              <option value="Doctor">Doctori</option>
              <option value="Pharmacy">Farmacii</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Status</span>
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as 'Pending' | 'Approved' | 'Rejected');
                setSkip(0);
              }}
            >
              <option value="Pending">În așteptare</option>
              <option value="Approved">Aprobate</option>
              <option value="Rejected">Respinse</option>
            </select>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setRole('All');
              setStatus('Pending');
              setSkip(0);
            }}
          >
            Resetează
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-sm text-slate-500">Se încarcă aprobările...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            Nu există conturi {status === 'Pending' ? 'în așteptare' : status === 'Approved' ? 'aprobate' : 'respinse'}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 font-medium text-slate-700">Email</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Roluri</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Nume / Denumire</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Licență</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-700 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.userId} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-800">{u.email}</td>
                    <td className="px-4 py-3 text-slate-700">{u.roles.join(', ')}</td>
                    <td className="px-4 py-3 text-slate-800">{u.fullName ?? u.pharmacyName ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{u.licenseNumber ?? '-'}</td>
                    <td className="px-4 py-3">
                      {u.approvalStatus === 'Approved' && (
                        <span className="text-sm font-medium text-emerald-700">Aprobat</span>
                      )}
                      {u.approvalStatus === 'Rejected' && (
                        <span className="text-sm font-medium text-red-600">Respins</span>
                      )}
                      {u.approvalStatus === 'Pending' && (
                        <span className="text-sm font-medium text-blue-600">În așteptare</span>
                      )}
                      {!u.approvalStatus && <span className="text-slate-500">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.approvalStatus === 'Pending' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={processingId === u.userId}
                            onClick={() => {
                              setApproveModalUser(u);
                            }}
                          >
                            Aprobă
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={processingId === u.userId}
                            onClick={() => {
                              setRejectModalUser(u);
                              setRejectReason('');
                            }}
                          >
                            Respinge
                          </Button>
                        </div>
                      )}
                      {u.approvalStatus === 'Approved' && (
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={processingId === u.userId}
                          onClick={() => {
                            setRejectModalUser(u);
                            setRejectReason('');
                          }}
                        >
                          Respinge
                        </Button>
                      )}
                      {u.approvalStatus === 'Rejected' && (
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={processingId === u.userId}
                          onClick={() => {
                            setApproveModalUser(u);
                          }}
                        >
                          Aprobă
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.total > items.length && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <span className="text-sm text-slate-500">
              {skip + 1}–{Math.min(skip + 50, data.total)} din {data.total}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={skip === 0}
                onClick={() => setSkip((s) => Math.max(0, s - 50))}
              >
                Înapoi
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={skip + 50 >= data.total}
                onClick={() => setSkip((s) => s + 50)}
              >
                Înainte
              </Button>
            </div>
          </div>
        )}
      </Card>
      {/* Modal respingere */}
      <Modal
        open={!!rejectModalUser}
        onOpenChange={(open) => {
          if (!open) {
            setRejectModalUser(null);
            setRejectReason('');
          }
        }}
        onClose={() => {
          setRejectModalUser(null);
          setRejectReason('');
        }}
        title="Respinge utilizatorul"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Motivul respingerii pentru{' '}
            <span className="font-semibold text-slate-900">{rejectModalUser?.email}</span>.
          </p>
          <textarea
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder=""
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              onClick={() => {
                setRejectModalUser(null);
                setRejectReason('');
              }}
            >
              Anulează
            </Button>
            <Button
              variant="primary"
              loading={!!processingId && processingId === rejectModalUser?.userId}
              onClick={() => {
                if (rejectModalUser) {
                  void handleReject(rejectModalUser, rejectReason);
                  // închidem după pornirea request-ului; reload-ul va actualiza tabela
                  setRejectModalUser(null);
                  setRejectReason('');
                }
              }}
            >
              Confirmă respingerea
            </Button>
          </div>
        </div>
      </Modal>
      {/* Modal aprobare */}
      <Modal
        open={!!approveModalUser}
        onOpenChange={(open) => {
          if (!open) {
            setApproveModalUser(null);
          }
        }}
        onClose={() => {
          setApproveModalUser(null);
        }}
        title="Aprobă utilizatorul"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Ești sigur că vrei să aprobi contul pentru{' '}
            <span className="font-semibold text-slate-900">{approveModalUser?.email}</span>?
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              onClick={() => {
                setApproveModalUser(null);
              }}
            >
              Anulează
            </Button>
            <Button
              variant="primary"
              loading={!!processingId && processingId === approveModalUser?.userId}
              onClick={() => {
                if (approveModalUser) {
                  void handleApprove(approveModalUser);
                  setApproveModalUser(null);
                }
              }}
            >
              Confirmă aprobarea
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


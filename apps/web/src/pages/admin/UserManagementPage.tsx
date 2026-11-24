import React, { useEffect, useState } from 'react';
import {
  listUsers,
  createPrivilegedUser,
  updateUserRole,
  deleteUser,
  getErrorMessage,
} from '../../api';
import type { PublicUser, UserRole } from '../../api/types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { RoleBadge } from '../../components/common/Badge';
import { Pagination } from '../../components/repository/Pagination';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { useToast } from '../../context/ToastContext';
import {
  validateEmailInput,
  validateNameInput,
  validatePasswordInput,
} from '../../lib/validation';
import { UserPlus, Trash2, Edit3, Users } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { showToast } = useToast();

  const [users, setUsers] = useState<PublicUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const pageSize = 20;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create User Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'FACULTY' | 'ADMIN'>('FACULTY');
  const [newNameError, setNewNameError] = useState<string | undefined>();
  const [newEmailError, setNewEmailError] = useState<string | undefined>();
  const [newPasswordError, setNewPasswordError] = useState<string | undefined>();
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Edit Role Modal
  const [editingUser, setEditingUser] = useState<PublicUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [roleError, setRoleError] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Delete User Confirmation
  const [deletingUser, setDeletingUser] = useState<PublicUser | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    async function load() {
      try {
        const response = await listUsers(page, pageSize);
        if (!active) return;
        setUsers(response.items);
        setTotal(response.total);
      } catch (cause) {
        if (active) setError(getErrorMessage(cause));
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [page, refresh]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const nErr = validateNameInput(newName, 'Full name');
    const eErr = validateEmailInput(newEmail);
    const pErr = validatePasswordInput(newPassword, { minLength: 8 });
    setNewNameError(nErr ?? undefined);
    setNewEmailError(eErr ?? undefined);
    setNewPasswordError(pErr ?? undefined);

    if (nErr || eErr || pErr) return;

    setIsCreating(true);
    try {
      const envelope = await createPrivilegedUser({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
      });

      setPage(1);
      setRefresh((value) => value + 1);
      showToast(`Account for ${envelope.user.name} created.`, 'success');
      setIsCreateOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
    } catch (err: unknown) {
      setCreateError(getErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setRoleError(null);
    setIsUpdatingRole(true);
    try {
      const envelope = await updateUserRole(editingUser.id, { role: selectedRole });
      setRefresh((value) => value + 1);
      showToast(`Updated role for ${envelope.user.name} to ${selectedRole}.`, 'success');
      setEditingUser(null);
    } catch (err: unknown) {
      setRoleError(getErrorMessage(err));
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteUser(deletingUser.id);
      if (users.length === 1 && page > 1) setPage(page - 1);
      setRefresh((value) => value + 1);
      showToast('User account successfully removed.', 'success');
      setDeletingUser(null);
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-dot" /> Access Governance
          </span>
          <h1>User Accounts</h1>
          <p className="page-header-subtitle">
            Manage institutional accounts, provision Faculty and Admin credentials, and administer
            role permissions with referential protection.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setCreateError(null);
            setNewNameError(undefined);
            setNewEmailError(undefined);
            setNewPasswordError(undefined);
            setIsCreateOpen(true);
          }}
        >
          <UserPlus size={15} /> Create Privileged User
        </Button>
      </div>

      {/* Role Filter & Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <div className="segmented-control" role="tablist" aria-label="Filter users by role">
          {(['ALL', 'STUDENT', 'FACULTY', 'ADMIN'] as const).map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={roleFilter === r}
              onClick={() => setRoleFilter(r)}
              className={`segmented-btn ${roleFilter === r ? 'active' : ''}`}
            >
              {r === 'ALL' ? `All (${total})` : r}
            </button>
          ))}
        </div>

        <input
          type="search"
          aria-label="Filter accounts by name or email"
          placeholder="Filter page by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ width: 'min(100%, 260px)', height: '36px' }}
        />
      </div>

      {error && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorAlert message={error} />
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRefresh((v) => v + 1)}>
            Retry
          </button>
        </div>
      )}

      {error ? null : isLoading ? (
        <div className="panel" style={{ padding: '48px 0', textAlign: 'center' }}>
          <Spinner size={28} label="Loading users..." />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<Users size={28} />}
            title="No Accounts Match Filter"
            description="No user accounts on the current page match your filter selection."
            action={
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setRoleFilter('ALL');
                  setSearchTerm('');
                }}
              >
                Clear filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="table-wrapper" tabIndex={0} role="region" aria-label="User accounts table">
          <table className="table-custom">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const dateStr = new Date(u.createdAt).toLocaleDateString();

                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <RoleBadge role={u.role} />
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{dateStr}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(u);
                            setSelectedRole(u.role);
                            setRoleError(null);
                          }}
                          className="btn-ghost"
                          style={{ padding: '6px', borderRadius: '4px', color: 'var(--c-text-secondary)' }}
                          title="Change user role"
                          aria-label={`Change role for ${u.name}`}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingUser(u);
                          }}
                          className="btn-ghost"
                          style={{ padding: '6px', borderRadius: '4px', color: 'var(--c-danger)' }}
                          title="Delete user"
                          aria-label={`Delete ${u.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!error && <Pagination currentPage={page} totalItems={total} pageSize={pageSize} onPageChange={setPage} />}

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Privileged Account"
        description="Provision a verified Faculty member or System Administrator account."
      >
        <form onSubmit={handleCreateUser} noValidate>
          {createError && <ErrorAlert message={createError} />}

          <Input
            id="new-user-name"
            label="Full Name"
            maxLength={120}
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (newNameError) setNewNameError(undefined);
            }}
            placeholder="Dr. S. Kulkarni"
            required
            error={newNameError}
          />

          <Input
            id="new-user-email"
            label="Email Address"
            type="email"
            maxLength={254}
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value);
              if (newEmailError) setNewEmailError(undefined);
            }}
            placeholder="faculty.name@mitaoe.ac.in"
            required
            error={newEmailError}
          />

          <Input
            id="new-user-password"
            label="Password (8–128 characters)"
            type="password"
            maxLength={128}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (newPasswordError) setNewPasswordError(undefined);
            }}
            placeholder="Minimum 8 characters"
            required
            error={newPasswordError}
          />

          <div className="form-group">
            <label htmlFor="new-user-role" className="form-label">
              <span>
                Role Assignment <span style={{ color: 'var(--c-danger)' }}>*</span>
              </span>
            </label>
            <select
              id="new-user-role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'FACULTY' | 'ADMIN')}
              className="form-select"
              required
            >
              <option value="FACULTY">Faculty Member</option>
              <option value="ADMIN">System Administrator</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '18px -22px -16px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreating}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Modify User Role"
        description={`Update role privileges for ${editingUser?.name} (${editingUser?.email}).`}
      >
        <form onSubmit={handleUpdateRole}>
          {roleError && <ErrorAlert message={roleError} />}

          <div className="form-group">
            <label htmlFor="edit-user-role" className="form-label">
              <span>
                Assigned Role <span style={{ color: 'var(--c-danger)' }}>*</span>
              </span>
            </label>
            <select
              id="edit-user-role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="form-select"
              required
            >
              <option value="STUDENT">STUDENT</option>
              <option value="FACULTY">FACULTY</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '18px -22px -16px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingUser(null)}
              disabled={isUpdatingRole}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isUpdatingRole}>
              Update Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete User */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => {
          setDeletingUser(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete User Account"
        message={`Are you sure you want to delete ${deletingUser?.name}? Accounts referenced by existing document uploads or reviews are protected.`}
        confirmLabel="Delete User"
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
};

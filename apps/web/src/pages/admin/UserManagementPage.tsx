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
import { Spinner } from '../../components/common/Spinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { useToast } from '../../context/ToastContext';
import { UserPlus, Trash2, Edit3 } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { showToast } = useToast();

  const [users, setUsers] = useState<PublicUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create User Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'FACULTY' | 'ADMIN'>('FACULTY');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Edit Role Modal
  const [editingUser, setEditingUser] = useState<PublicUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Delete User Confirmation
  const [deletingUser, setDeletingUser] = useState<PublicUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listUsers();
      setUsers(response.items);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newName.trim() || !newEmail.trim() || !newPassword) {
      setCreateError('Please fill in all required fields.');
      return;
    }
    if (newPassword.length < 8) {
      setCreateError('Password must be at least 8 characters.');
      return;
    }

    setIsCreating(true);
    try {
      const envelope = await createPrivilegedUser({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
      });

      setUsers((prev) => [...prev, envelope.user]);
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

    setIsUpdatingRole(true);
    try {
      const envelope = await updateUserRole(editingUser.id, { role: selectedRole });
      setUsers((prev) => prev.map((u) => (u.id === envelope.user.id ? envelope.user : u)));
      showToast(`Updated role for ${envelope.user.name} to ${selectedRole}.`, 'success');
      setEditingUser(null);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await deleteUser(deletingUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      showToast('User account successfully removed.', 'success');
      setDeletingUser(null);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span className="eyebrow light">
            <span className="eyebrow-dot" /> Access Governance
          </span>
          <h1 style={{ color: '#ffffff', marginBottom: '6px' }}>User Accounts</h1>
          <p style={{ color: '#e2e8f0', fontSize: '14px' }}>
            Manage institutional users, provision faculty and admin credentials, and modify role
            privileges.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setCreateError(null);
            setIsCreateOpen(true);
          }}
        >
          <UserPlus size={16} /> Create Privileged User
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Spinner size={36} label="Loading users..." />
        </div>
      ) : (
        <div className="table-wrapper">
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
              {users.map((u) => {
                const dateStr = new Date(u.createdAt).toLocaleDateString();

                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <RoleBadge role={u.role} />
                    </td>
                    <td>{dateStr}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setSelectedRole(u.role);
                          }}
                          className="btn-ghost"
                          style={{ padding: '6px', color: 'var(--c-slate)' }}
                          title="Change user role"
                          aria-label={`Change role for ${u.name}`}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="btn-ghost"
                          style={{ padding: '6px', color: '#dc2626' }}
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

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Privileged Account"
        description="Provision Faculty or Admin user with verified institution email."
      >
        <form onSubmit={handleCreateUser}>
          {createError && <ErrorAlert message={createError} />}

          <Input
            id="new-user-name"
            label="Full Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Dr. S. Kulkarni"
            required
          />

          <Input
            id="new-user-email"
            label="Email Address"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="faculty.name@mitaoe.ac.in"
            required
          />

          <Input
            id="new-user-password"
            label="Password (min 8 characters)"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <div className="form-group">
            <label htmlFor="new-user-role" className="form-label">
              Role Assignment <span style={{ color: '#ef4444' }}>*</span>
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

          <div className="modal-footer">
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
          <div className="form-group">
            <label htmlFor="edit-user-role" className="form-label">
              Assigned Role <span style={{ color: '#ef4444' }}>*</span>
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

          <div className="modal-footer">
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
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmDelete}
        title="Delete User Account"
        message={`Are you sure you want to delete ${deletingUser?.name}? If this user has active document uploads or records, the system will block deletion to protect academic integrity.`}
        confirmLabel="Delete User"
        isLoading={isDeleting}
      />
    </div>
  );
};

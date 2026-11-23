import React, { useEffect, useState } from 'react';
import {
  listDepartments,
  createDepartment,
  deleteDepartment,
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getErrorMessage,
} from '../../api';
import type { DepartmentDto, SubjectDto } from '../../api/types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { Spinner } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import {
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  Building2,
} from 'lucide-react';

export const AcademicHierarchyPage: React.FC = () => {
  const { showToast } = useToast();

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Department creation modal
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [deptNameError, setDeptNameError] = useState('');

  // Subject creation modal
  const [isSubjModalOpen, setIsSubjModalOpen] = useState(false);
  const [newSubjName, setNewSubjName] = useState('');
  const [subjDeptId, setSubjDeptId] = useState('');
  const [subjNameError, setSubjNameError] = useState('');

  // Subject edit modal
  const [isEditSubjOpen, setIsEditSubjOpen] = useState(false);
  const [editingSubj, setEditingSubj] = useState<SubjectDto | null>(null);
  const [editSubjName, setEditSubjName] = useState('');

  // Delete confirmations
  const [deletingDept, setDeletingDept] = useState<DepartmentDto | null>(null);
  const [deletingSubj, setDeletingSubj] = useState<SubjectDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [depts, subs] = await Promise.all([listDepartments(), listSubjects()]);
      setDepartments(depts);
      setSubjects(subs);
      if (depts.length > 0 && depts[0] && !selectedDeptId) {
        setSelectedDeptId(depts[0].id);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Department handlers
  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) {
      setDeptNameError('Department name is required.');
      return;
    }
    try {
      const created = await createDepartment({ name: newDeptName.trim() });
      setDepartments((prev) => [...prev, created]);
      setSelectedDeptId(created.id);
      setNewDeptName('');
      setIsDeptModalOpen(false);
      showToast(`Department "${created.name}" created successfully.`, 'success');
    } catch (err: unknown) {
      setDeptNameError(getErrorMessage(err));
    }
  };

  const handleConfirmDeleteDept = async () => {
    if (!deletingDept) return;
    setIsDeleting(true);
    try {
      await deleteDepartment(deletingDept.id);
      setDepartments((prev) => prev.filter((d) => d.id !== deletingDept.id));
      if (selectedDeptId === deletingDept.id) {
        setSelectedDeptId(departments[0]?.id || '');
      }
      showToast('Department deleted successfully.', 'success');
      setDeletingDept(null);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Subject handlers
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) {
      setSubjNameError('Subject name is required.');
      return;
    }
    const targetDeptId = subjDeptId || selectedDeptId || (departments[0] ? departments[0].id : '');
    if (!targetDeptId) {
      setSubjNameError('Department is required.');
      return;
    }

    try {
      const created = await createSubject({
        name: newSubjName.trim(),
        departmentId: targetDeptId,
      });
      setSubjects((prev) => [...prev, created]);
      setNewSubjName('');
      setIsSubjModalOpen(false);
      showToast(`Subject "${created.name}" created successfully.`, 'success');
    } catch (err: unknown) {
      setSubjNameError(getErrorMessage(err));
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubj || !editSubjName.trim()) return;

    try {
      const updated = await updateSubject(editingSubj.id, { name: editSubjName.trim() });
      setSubjects((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setIsEditSubjOpen(false);
      setEditingSubj(null);
      showToast('Subject renamed successfully.', 'success');
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleConfirmDeleteSubj = async () => {
    if (!deletingSubj) return;
    setIsDeleting(true);
    try {
      await deleteSubject(deletingSubj.id);
      setSubjects((prev) => prev.filter((s) => s.id !== deletingSubj.id));
      showToast('Subject deleted successfully.', 'success');
      setDeletingSubj(null);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const currentDeptSubjects = selectedDeptId
    ? subjects.filter((s) => s.departmentId === selectedDeptId)
    : subjects;

  const currentDept = departments.find((d) => d.id === selectedDeptId);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <span className="eyebrow light">
          <span className="eyebrow-dot" /> Academic Structure
        </span>
        <h1 style={{ color: '#ffffff', marginBottom: '6px' }}>Departments & Subjects</h1>
        <p style={{ color: '#e2e8f0', fontSize: '14px' }}>
          Configure departments and courses. Enforces referential integrity: departments with active
          subjects and subjects with active documents cannot be deleted.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Spinner size={36} label="Loading academic hierarchy..." />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Departments Column */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="var(--c-midnight)" />
                <h2 style={{ fontSize: '18px' }}>Departments ({departments.length})</h2>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDeptNameError('');
                  setIsDeptModalOpen(true);
                }}
              >
                <Plus size={14} /> Add
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {departments.map((dept) => {
                const isSelected = dept.id === selectedDeptId;
                const deptSubjectCount = subjects.filter((s) => s.departmentId === dept.id).length;

                return (
                  <div
                    key={dept.id}
                    onClick={() => setSelectedDeptId(dept.id)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '14px',
                      background: isSelected ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.5)',
                      border: isSelected ? '1px solid rgba(15, 23, 42, 0.3)' : '1px solid var(--c-glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--c-midnight)' }}>
                        {dept.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>
                        {deptSubjectCount} course{deptSubjectCount === 1 ? '' : 's'}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingDept(dept);
                      }}
                      className="btn-ghost"
                      style={{ color: '#dc2626', padding: '6px' }}
                      title="Delete department"
                      aria-label={`Delete ${dept.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subjects for Selected Department */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={18} color="var(--c-midnight)" />
                  <h2 style={{ fontSize: '18px' }}>
                    Courses in {currentDept ? currentDept.name : 'All Departments'}
                  </h2>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--c-text-secondary)', marginTop: '2px' }}>
                  Showing {currentDeptSubjects.length} courses
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSubjDeptId(selectedDeptId || (departments[0] ? departments[0].id : ''));
                  setSubjNameError('');
                  setIsSubjModalOpen(true);
                }}
                disabled={departments.length === 0}
              >
                <Plus size={14} /> Add Course
              </Button>
            </div>

            {currentDeptSubjects.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: '13px' }}>
                No courses configured in this department yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentDeptSubjects.map((subj) => (
                  <div
                    key={subj.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.65)',
                      border: '1px solid var(--c-glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--c-midnight)' }}>
                      {subj.name}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => {
                          setEditingSubj(subj);
                          setEditSubjName(subj.name);
                          setIsEditSubjOpen(true);
                        }}
                        className="btn-ghost"
                        style={{ color: 'var(--c-slate)', padding: '6px' }}
                        title="Rename subject"
                        aria-label={`Rename ${subj.name}`}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeletingSubj(subj)}
                        className="btn-ghost"
                        style={{ color: '#dc2626', padding: '6px' }}
                        title="Delete subject"
                        aria-label={`Delete ${subj.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Department Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Add Department"
        description="Create a new academic department or school."
      >
        <form onSubmit={handleCreateDept}>
          <Input
            id="dept-name"
            label="Department Name"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            placeholder="e.g. School of Chemical Engineering"
            required
            error={deptNameError ? deptNameError : undefined}
          />
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setIsDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Subject Modal */}
      <Modal
        isOpen={isSubjModalOpen}
        onClose={() => setIsSubjModalOpen(false)}
        title="Add Course / Subject"
        description="Create a new course under an academic department."
      >
        <form onSubmit={handleCreateSubject}>
          <div className="form-group">
            <label htmlFor="subj-dept-select" className="form-label">
              Department <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              id="subj-dept-select"
              value={subjDeptId}
              onChange={(e) => setSubjDeptId(e.target.value)}
              className="form-select"
              required
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="subj-name"
            label="Course / Subject Name"
            value={newSubjName}
            onChange={(e) => setNewSubjName(e.target.value)}
            placeholder="e.g. Artificial Intelligence & Expert Systems"
            required
            error={subjNameError ? subjNameError : undefined}
          />

          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setIsSubjModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Course
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rename Subject Modal */}
      <Modal
        isOpen={isEditSubjOpen}
        onClose={() => setIsEditSubjOpen(false)}
        title="Rename Course / Subject"
      >
        <form onSubmit={handleUpdateSubject}>
          <Input
            id="edit-subj-name"
            label="Subject Name"
            value={editSubjName}
            onChange={(e) => setEditSubjName(e.target.value)}
            required
          />
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setIsEditSubjOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Department */}
      <ConfirmDialog
        isOpen={!!deletingDept}
        onClose={() => setDeletingDept(null)}
        onConfirm={handleConfirmDeleteDept}
        title="Delete Department"
        message={`Are you sure you want to delete "${deletingDept?.name}"? A department can only be deleted if it has no courses.`}
        confirmLabel="Delete Department"
        isLoading={isDeleting}
      />

      {/* Confirm Delete Subject */}
      <ConfirmDialog
        isOpen={!!deletingSubj}
        onClose={() => setDeletingSubj(null)}
        onConfirm={handleConfirmDeleteSubj}
        title="Delete Course"
        message={`Are you sure you want to delete "${deletingSubj?.name}"? A course can only be deleted if it has no associated documents.`}
        confirmLabel="Delete Course"
        isLoading={isDeleting}
      />
    </div>
  );
};

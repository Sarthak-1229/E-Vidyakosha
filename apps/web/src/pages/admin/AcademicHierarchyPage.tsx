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
import { validateNameInput } from '../../lib/validation';
import { Plus, Trash2, Edit2, BookOpen, Building2 } from 'lucide-react';

export const AcademicHierarchyPage: React.FC = () => {
  const { showToast } = useToast();

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Department creation modal
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [deptNameError, setDeptNameError] = useState('');
  const [isCreatingDept, setIsCreatingDept] = useState(false);

  // Subject creation modal
  const [isSubjModalOpen, setIsSubjModalOpen] = useState(false);
  const [newSubjName, setNewSubjName] = useState('');
  const [subjDeptId, setSubjDeptId] = useState('');
  const [subjNameError, setSubjNameError] = useState('');
  const [isCreatingSubj, setIsCreatingSubj] = useState(false);

  // Subject edit modal
  const [isEditSubjOpen, setIsEditSubjOpen] = useState(false);
  const [editingSubj, setEditingSubj] = useState<SubjectDto | null>(null);
  const [editSubjName, setEditSubjName] = useState('');
  const [editSubjError, setEditSubjError] = useState('');
  const [isUpdatingSubj, setIsUpdatingSubj] = useState(false);

  // Delete confirmations
  const [deletingDept, setDeletingDept] = useState<DepartmentDto | null>(null);
  const [deletingSubj, setDeletingSubj] = useState<SubjectDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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
    void loadData();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    const errMsg = validateNameInput(newDeptName, 'Department name');
    if (errMsg) {
      setDeptNameError(errMsg);
      return;
    }
    setIsCreatingDept(true);
    setDeptNameError('');
    try {
      const created = await createDepartment({ name: newDeptName.trim() });
      setDepartments((prev) => [...prev, created]);
      setSelectedDeptId(created.id);
      setNewDeptName('');
      setIsDeptModalOpen(false);
      showToast(`Department "${created.name}" created successfully.`, 'success');
    } catch (err: unknown) {
      setDeptNameError(getErrorMessage(err));
    } finally {
      setIsCreatingDept(false);
    }
  };

  const handleConfirmDeleteDept = async () => {
    if (!deletingDept) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const targetId = deletingDept.id;
      await deleteDepartment(targetId);
      const remaining = departments.filter((d) => d.id !== targetId);
      setDepartments(remaining);
      if (selectedDeptId === targetId) {
        setSelectedDeptId(remaining[0]?.id ?? '');
      }
      showToast('Department deleted successfully.', 'success');
      setDeletingDept(null);
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const errMsg = validateNameInput(newSubjName, 'Subject name');
    if (errMsg) {
      setSubjNameError(errMsg);
      return;
    }
    const targetDeptId = subjDeptId || selectedDeptId || departments[0]?.id || '';
    if (!targetDeptId) {
      setSubjNameError('Department is required.');
      return;
    }

    setIsCreatingSubj(true);
    setSubjNameError('');
    try {
      const created = await createSubject({
        name: newSubjName.trim(),
        departmentId: targetDeptId,
      });
      setSubjects((prev) => [...prev, created]);
      setSelectedDeptId(targetDeptId);
      setNewSubjName('');
      setIsSubjModalOpen(false);
      showToast(`Subject "${created.name}" created successfully.`, 'success');
    } catch (err: unknown) {
      setSubjNameError(getErrorMessage(err));
    } finally {
      setIsCreatingSubj(false);
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubj) return;
    const errMsg = validateNameInput(editSubjName, 'Subject name');
    if (errMsg) {
      setEditSubjError(errMsg);
      return;
    }

    setIsUpdatingSubj(true);
    setEditSubjError('');
    try {
      const updated = await updateSubject(editingSubj.id, { name: editSubjName.trim() });
      setSubjects((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setIsEditSubjOpen(false);
      setEditingSubj(null);
      showToast('Subject renamed successfully.', 'success');
    } catch (err: unknown) {
      setEditSubjError(getErrorMessage(err));
    } finally {
      setIsUpdatingSubj(false);
    }
  };

  const handleConfirmDeleteSubj = async () => {
    if (!deletingSubj) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteSubject(deletingSubj.id);
      setSubjects((prev) => prev.filter((s) => s.id !== deletingSubj.id));
      showToast('Subject deleted successfully.', 'success');
      setDeletingSubj(null);
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const currentDeptSubjects = (
    selectedDeptId ? subjects.filter((s) => s.departmentId === selectedDeptId) : subjects
  ).filter((s) =>
    searchFilter.trim() ? s.name.toLowerCase().includes(searchFilter.trim().toLowerCase()) : true,
  );

  const currentDept = departments.find((d) => d.id === selectedDeptId);

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Academic Taxonomy</span>
          <h1>Departments &amp; Subjects</h1>
          <p className="page-header-subtitle">
            Manage departments and subjects. Referential integrity prevents deleting departments
            with assigned subjects or subjects containing uploaded documents.
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {isLoading ? (
        <div className="panel" style={{ padding: '48px 0', textAlign: 'center' }}>
          <Spinner size={28} label="Loading academic hierarchy..." />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          {/* Departments Column */}
          <div className="panel">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--c-divider)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={17} color="var(--c-accent)" />
                <h2 style={{ fontSize: '16px' }}>Departments ({departments.length})</h2>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setNewDeptName('');
                  setDeptNameError('');
                  setIsDeptModalOpen(true);
                }}
              >
                <Plus size={14} /> Add
              </Button>
            </div>

            {departments.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '13px', color: 'var(--c-text-muted)' }}>
                No departments configured yet. Create your first department to organize courses.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {departments.map((dept) => {
                  const isSelected = dept.id === selectedDeptId;
                  const deptSubjectCount = subjects.filter((s) => s.departmentId === dept.id).length;

                  return (
                    <div key={dept.id} className={`hierarchy-row ${isSelected ? 'selected' : ''}`}>
                      <button
                        type="button"
                        onClick={() => setSelectedDeptId(dept.id)}
                        aria-pressed={isSelected}
                        className="department-picker"
                      >
                        <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--c-ink)' }}>
                          {dept.name}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>
                          {deptSubjectCount} course{deptSubjectCount === 1 ? '' : 's'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeletingDept(dept);
                        }}
                        className="btn-ghost"
                        style={{ color: 'var(--c-danger)', padding: '6px', borderRadius: '4px' }}
                        title="Delete department"
                        aria-label={`Delete ${dept.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subjects Column */}
          <div className="panel">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--c-divider)',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={17} color="var(--c-accent)" />
                  <h2 style={{ fontSize: '16px' }}>
                    Courses in {currentDept ? currentDept.name : 'All Departments'}
                  </h2>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--c-text-muted)', marginTop: '2px' }}>
                  Showing {currentDeptSubjects.length} course
                  {currentDeptSubjects.length === 1 ? '' : 's'}
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSubjDeptId(selectedDeptId || (departments[0] ? departments[0].id : ''));
                  setNewSubjName('');
                  setSubjNameError('');
                  setIsSubjModalOpen(true);
                }}
                disabled={departments.length === 0}
              >
                <Plus size={14} /> Add Course
              </Button>
            </div>

            {subjects.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="search"
                  placeholder="Filter courses by name..."
                  aria-label="Filter courses by name"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="form-input"
                  style={{ height: '36px', fontSize: '13px' }}
                />
              </div>
            )}

            {currentDeptSubjects.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--c-text-muted)', fontSize: '13px' }}>
                {searchFilter
                  ? 'No courses match your filter in this department.'
                  : 'No courses configured in this department yet.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentDeptSubjects.map((subj) => (
                  <div key={subj.id} className="hierarchy-row">
                    <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--c-ink)' }}>
                      {subj.name}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSubj(subj);
                          setEditSubjName(subj.name);
                          setEditSubjError('');
                          setIsEditSubjOpen(true);
                        }}
                        className="btn-ghost"
                        style={{ color: 'var(--c-text-secondary)', padding: '6px', borderRadius: '4px' }}
                        title="Rename subject"
                        aria-label={`Rename ${subj.name}`}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeletingSubj(subj);
                        }}
                        className="btn-ghost"
                        style={{ color: 'var(--c-danger)', padding: '6px', borderRadius: '4px' }}
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
        <form onSubmit={handleCreateDept} noValidate>
          <Input
            id="dept-name"
            label="Department Name"
            maxLength={120}
            value={newDeptName}
            onChange={(e) => {
              setNewDeptName(e.target.value);
              if (deptNameError) setDeptNameError('');
            }}
            placeholder="e.g. School of Chemical Engineering"
            required
            error={deptNameError || undefined}
          />
          <div className="modal-footer" style={{ margin: '18px -22px -16px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeptModalOpen(false)}
              disabled={isCreatingDept}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreatingDept}>
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
        <form onSubmit={handleCreateSubject} noValidate>
          <div className="form-group">
            <label htmlFor="subj-dept-select" className="form-label">
              <span>
                Department <span style={{ color: 'var(--c-danger)' }}>*</span>
              </span>
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
            maxLength={120}
            value={newSubjName}
            onChange={(e) => {
              setNewSubjName(e.target.value);
              if (subjNameError) setSubjNameError('');
            }}
            placeholder="e.g. Artificial Intelligence & Expert Systems"
            required
            error={subjNameError || undefined}
          />

          <div className="modal-footer" style={{ margin: '18px -22px -16px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsSubjModalOpen(false)}
              disabled={isCreatingSubj}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreatingSubj}>
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
        <form onSubmit={handleUpdateSubject} noValidate>
          <Input
            id="edit-subj-name"
            label="Subject Name"
            maxLength={120}
            value={editSubjName}
            onChange={(e) => {
              setEditSubjName(e.target.value);
              if (editSubjError) setEditSubjError('');
            }}
            required
            error={editSubjError || undefined}
          />
          <div className="modal-footer" style={{ margin: '18px -22px -16px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditSubjOpen(false)}
              disabled={isUpdatingSubj}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isUpdatingSubj}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Department */}
      <ConfirmDialog
        isOpen={!!deletingDept}
        onClose={() => {
          setDeletingDept(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDeleteDept}
        title="Delete Department"
        message={`Are you sure you want to delete "${deletingDept?.name}"? A department can only be deleted if it has no courses.`}
        confirmLabel="Delete Department"
        isLoading={isDeleting}
        error={deleteError}
      />

      {/* Confirm Delete Subject */}
      <ConfirmDialog
        isOpen={!!deletingSubj}
        onClose={() => {
          setDeletingSubj(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDeleteSubj}
        title="Delete Course"
        message={`Are you sure you want to delete "${deletingSubj?.name}"? A course can only be deleted if it has no associated documents.`}
        confirmLabel="Delete Course"
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
};

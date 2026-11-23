import React from 'react';
import type { DepartmentDto, SubjectDto } from '../../api/types';
import { Filter, RotateCcw } from 'lucide-react';

interface HierarchyFilterProps {
  departments: DepartmentDto[];
  subjects: SubjectDto[];
  selectedDepartmentId: string;
  selectedSubjectId: string;
  selectedType: string;
  onDepartmentChange: (departmentId: string) => void;
  onSubjectChange: (subjectId: string) => void;
  onTypeChange: (type: string) => void;
  onReset: () => void;
}

const DOCUMENT_TYPES_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'LECTURE_NOTES', label: 'Lecture Notes' },
  { value: 'LAB_MANUAL', label: 'Lab Manuals' },
  { value: 'REFERENCE_BOOK', label: 'Reference Books' },
  { value: 'RESEARCH_PAPER', label: 'Research Papers' },
  { value: 'QUESTION_PAPER', label: 'Question Papers' },
  { value: 'EBOOK', label: 'eBooks' },
  { value: 'OTHER', label: 'Other Materials' },
];

export const HierarchyFilter: React.FC<HierarchyFilterProps> = ({
  departments,
  subjects,
  selectedDepartmentId,
  selectedSubjectId,
  selectedType,
  onDepartmentChange,
  onSubjectChange,
  onTypeChange,
  onReset,
}) => {
  const filteredSubjects = selectedDepartmentId
    ? subjects.filter((s) => s.departmentId === selectedDepartmentId)
    : subjects;

  const hasActiveFilters = !!selectedDepartmentId || !!selectedSubjectId || !!selectedType;

  return (
    <div
      className="glass-card-subtle"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--c-midnight)' }}>
          <Filter size={16} /> Filter by Academic Hierarchy
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="btn-ghost"
            style={{ fontSize: '12px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <RotateCcw size={13} /> Reset Filters
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Department Selector */}
        <div>
          <label
            htmlFor="filter-dept"
            style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--c-slate)' }}
          >
            Department
          </label>
          <select
            id="filter-dept"
            value={selectedDepartmentId}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="form-select"
            style={{ height: '42px', fontSize: '13px' }}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Selector */}
        <div>
          <label
            htmlFor="filter-subject"
            style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--c-slate)' }}
          >
            Subject / Course
          </label>
          <select
            id="filter-subject"
            value={selectedSubjectId}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="form-select"
            style={{ height: '42px', fontSize: '13px' }}
          >
            <option value="">All Subjects</option>
            {filteredSubjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Document Type Selector */}
        <div>
          <label
            htmlFor="filter-type"
            style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--c-slate)' }}
          >
            Document Type
          </label>
          <select
            id="filter-type"
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="form-select"
            style={{ height: '42px', fontSize: '13px' }}
          >
            {DOCUMENT_TYPES_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

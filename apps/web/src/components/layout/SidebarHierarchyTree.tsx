import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, FolderTree } from 'lucide-react';
import { listDepartments, listSubjects } from '../../api';
import type { DepartmentDto, SubjectDto } from '../../api/types';

const PAGE_LIMIT_HINT = 1;
void PAGE_LIMIT_HINT;

export const SidebarHierarchyTree: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const activeDeptId = location.pathname === '/library' ? (searchParams.get('dept') || '') : '';
  const activeSubjectId = location.pathname === '/library' ? (searchParams.get('subject') || '') : '';

  useEffect(() => {
    let active = true;
    Promise.all([listDepartments(), listSubjects()])
      .then(([depts, subs]) => {
        if (!active) return;
        setDepartments(depts);
        setSubjects(subs);
      })
      .catch(() => {
        // Tree failure stays quiet here because page views report load errors prominently.
      });
    return () => {
      active = false;
    };
  }, [location.pathname]);

  const navigateFilter = (deptId?: string, subjectId?: string) => {
    const params = new URLSearchParams();
    if (deptId) params.set('dept', deptId);
    if (subjectId) params.set('subject', subjectId);
    const qs = params.toString();
    navigate(`/library${qs ? `?${qs}` : ''}`);
    onNavigate?.();
  };

  if (departments.length === 0) return null;

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-label">Academic Catalog</div>
      <div className="tree-group">
        <button
          type="button"
          className={`tree-dept-row ${location.pathname === '/library' && !activeDeptId && !activeSubjectId ? 'active' : ''}`}
          onClick={() => navigateFilter()}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <FolderTree size={14} color="var(--c-accent)" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              All Catalog Holdings
            </span>
          </span>
        </button>

        {departments.map((dept) => {
          const deptSubjects = subjects.filter((s) => s.departmentId === dept.id);
          const isSelectedDept = activeDeptId === dept.id && !activeSubjectId;
          const isExpanded =
            expandedDepts[dept.id] ?? (activeDeptId === dept.id || deptSubjects.some((s) => s.id === activeSubjectId));

          return (
            <div key={dept.id}>
              <div className={`tree-dept-row ${isSelectedDept ? 'active' : ''}`}>
                <button
                  type="button"
                  onClick={() => {
                    setExpandedDepts((prev) => ({ ...prev, [dept.id]: true }));
                    navigateFilter(dept.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'left',
                  }}
                  title={dept.name}
                >
                  <span className="tree-marker" aria-hidden="true" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dept.name}
                  </span>
                </button>
                {deptSubjects.length > 0 && (
                  <button
                    type="button"
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${dept.name}`}
                    onClick={() => setExpandedDepts((prev) => ({ ...prev, [dept.id]: !isExpanded }))}
                    style={{ color: 'var(--c-text-muted)', padding: '2px', display: 'grid', placeItems: 'center' }}
                  >
                    {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                )}
              </div>

              {isExpanded && deptSubjects.length > 0 && (
                <div className="tree-subjects">
                  {deptSubjects.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      className={`tree-subject-btn ${activeSubjectId === sub.id ? 'active' : ''}`}
                      onClick={() => navigateFilter(dept.id, sub.id)}
                      title={sub.name}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  searchApprovedDocuments,
  listDepartments,
  listSubjects,
  getErrorMessage,
} from '../../api';
import type {
  DocumentDto,
  DepartmentDto,
  SubjectDto,
  DocumentType,
} from '../../api/types';
import { SearchBar } from '../../components/repository/SearchBar';
import { HierarchyFilter } from '../../components/repository/HierarchyFilter';
import { DocumentCard } from '../../components/repository/DocumentCard';
import { Pagination } from '../../components/repository/Pagination';
import { CardSkeleton } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { FolderSearch } from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);

  // Filters state
  const [query, setQuery] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  // Pagination & Loading state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const pageSize = 12;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hierarchyError, setHierarchyError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load department and subject hierarchy
  useEffect(() => {
    async function loadHierarchy() {
      try {
        const [depts, subs] = await Promise.all([listDepartments(), listSubjects()]);
        setDepartments(depts);
        setSubjects(subs);
      } catch (cause) {
        setHierarchyError(getErrorMessage(cause));
      }
    }
    loadHierarchy();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    searchApprovedDocuments({
      q: query, subjectId: selectedSubjectId, type: selectedType ? selectedType as DocumentType : undefined,
      page: currentPage, pageSize,
    }, controller.signal).then(
      response => {
        if (controller.signal.aborted) return;
        setDocuments(response.items);
        setTotalItems(response.total);
      },
      cause => {
        if (!controller.signal.aborted) setError(getErrorMessage(cause));
      },
    ).finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [query, selectedSubjectId, selectedType, currentPage, refresh]);

  // When department changes, clear subject if it doesn't belong to it
  const handleDepartmentChange = (deptId: string) => {
    setSelectedDepartmentId(deptId);
    setSelectedSubjectId('');
    setCurrentPage(1);
  };

  const handleSubjectChange = (subjId: string) => {
    setSelectedSubjectId(subjId);
    setCurrentPage(1);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const handleSearchSubmit = () => {
    setCurrentPage(1);
    setRefresh(value => value + 1);
  };

  const handleResetFilters = () => {
    setQuery('');
    setSelectedDepartmentId('');
    setSelectedSubjectId('');
    setSelectedType('');
    setCurrentPage(1);
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header section */}
      <div style={{ marginBottom: '32px' }}>
        <span className="eyebrow light">
          <span className="eyebrow-dot" /> Approved Institutional Catalog
        </span>
        <h1 style={{ color: '#ffffff', marginBottom: '8px' }}>Academic Library</h1>
        <p style={{ color: '#e2e8f0', fontSize: '15px' }}>
          Explore curated lecture notes, lab manuals, reference materials, and research papers
          verified by department faculty.
        </p>
      </div>

      {/* Search Input Bar */}
      <div style={{ marginBottom: '20px' }}>
        <SearchBar
          value={query}
          onChange={(val) => {
            setQuery(val);
            setCurrentPage(1);
          }}
          onSubmit={handleSearchSubmit}
        />
      </div>

      {/* Academic Hierarchy Cascading Filter */}
      {hierarchyError && <ErrorAlert message={'The academic filters could not load. ' + hierarchyError} />}
      <HierarchyFilter
        departments={departments}
        subjects={subjects}
        selectedDepartmentId={selectedDepartmentId}
        selectedSubjectId={selectedSubjectId}
        selectedType={selectedType}
        onDepartmentChange={handleDepartmentChange}
        onSubjectChange={handleSubjectChange}
        onTypeChange={handleTypeChange}
        onReset={handleResetFilters}
      />

      {/* Results Meta Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          color: 'var(--c-slate)',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        <span role="status">
          Showing <strong>{documents.length}</strong> of <strong>{totalItems}</strong> approved
          resource{totalItems === 1 ? '' : 's'}
        </span>
      </div>

      {error ? (
        <div className="glass-card">
          <ErrorAlert message={error} />
          <button className="btn btn-primary" onClick={() => setRefresh(value => value + 1)}>Retry search</button>
        </div>
      ) : isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))',
            gap: '24px',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : documents.length === 0 ? (
        // FR-10: Explicit no-result state
        <div className="glass-card">
          <EmptyState
            icon={<FolderSearch size={32} />}
            title="No Documents Found"
            description="No approved academic resources match your current search query and filters. Try adjusting your criteria or clearing filters."
            action={
              <button onClick={handleResetFilters} className="btn btn-secondary btn-sm">
                Clear all filters
              </button>
            }
          />
        </div>
      ) : (
        // Results Grid
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))',
            gap: '24px',
          }}
        >
          {documents.map((doc) => {
            const subject = subjects.find((s) => s.id === doc.subjectId);
            return <DocumentCard key={doc.id} document={doc} subject={subject || undefined} />;
          })}
        </div>
      )}

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={(p) => setCurrentPage(p)}
      />
    </div>
  );
};

import type {
  PublicUser,
  DepartmentDto,
  SubjectDto,
  DocumentDto,
  SubmissionDto,
  UserRole,
  ListResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserEnvelope,
  CreatePrivilegedUserRequest,
  CreateDepartmentRequest,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  DocumentFilterParams,
  SubmitPdfParams,
  SubmitPdfResponse,
  UpdateDocumentMetadataRequest,
  DecisionRequest,
} from './types';

// Helper to create a minimal valid PDF binary
function createMinimalPdfBlob(title: string): Blob {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 75 >>
stream
BT
/F1 20 Tf
70 700 Td
(${title.replace(/[()\\]/g, '')}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000227 00000 n 
0000000305 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
429
%%EOF`;
  return new Blob([content], { type: 'application/pdf' });
}

// Initial mock database state
interface MockDb {
  users: (PublicUser & { passwordHash: string })[];
  departments: DepartmentDto[];
  subjects: SubjectDto[];
  documents: (DocumentDto & { status: 'PENDING' | 'APPROVED' | 'REJECTED'; facultyId: string; fileBlob?: Blob | undefined })[];
  submissions: (SubmissionDto & { facultyId: string })[];
}

function getInitialDb(): MockDb {
  const users: (PublicUser & { passwordHash: string })[] = [
    {
      id: '674391a10000000000000001',
      name: 'Aditi Deshmukh',
      email: 'student@mitaoe.ac.in',
      role: 'STUDENT',
      createdAt: '2026-10-15T09:00:00.000Z',
      passwordHash: 'Password123!',
    },
    {
      id: '674391a10000000000000002',
      name: 'Dr. Ramesh Kulkarni',
      email: 'faculty@mitaoe.ac.in',
      role: 'FACULTY',
      createdAt: '2026-09-01T10:30:00.000Z',
      passwordHash: 'Password123!',
    },
    {
      id: '674391a10000000000000003',
      name: 'System Administrator',
      email: 'admin@mitaoe.ac.in',
      role: 'ADMIN',
      createdAt: '2026-08-01T08:00:00.000Z',
      passwordHash: 'Password123!',
    },
  ];

  const departments: DepartmentDto[] = [
    { id: '674391b10000000000000001', name: 'School of Computer Engineering' },
    { id: '674391b10000000000000002', name: 'School of Mechanical Engineering' },
    { id: '674391b10000000000000003', name: 'School of Electronics & Communication' },
    { id: '674391b10000000000000004', name: 'School of Civil Engineering' },
  ];

  const subjects: SubjectDto[] = [
    { id: '674391c10000000000000001', name: 'Data Structures and Algorithms', departmentId: '674391b10000000000000001' },
    { id: '674391c10000000000000002', name: 'Database Management Systems', departmentId: '674391b10000000000000001' },
    { id: '674391c10000000000000003', name: 'Operating Systems & System Software', departmentId: '674391b10000000000000001' },
    { id: '674391c10000000000000004', name: 'Machine Learning & Pattern Recognition', departmentId: '674391b10000000000000001' },
    { id: '674391c10000000000000005', name: 'Thermodynamics & Heat Transfer', departmentId: '674391b10000000000000002' },
    { id: '674391c10000000000000006', name: 'Digital Signal Processing', departmentId: '674391b10000000000000003' },
  ];

  const documents: (DocumentDto & { status: 'PENDING' | 'APPROVED' | 'REJECTED'; facultyId: string; fileBlob?: Blob | undefined })[] = [
    {
      id: '674391d10000000000000001',
      title: 'Advanced Data Structures Lecture Notes: Trees, Heaps & Graphs',
      author: 'Prof. Anjali Sharma',
      type: 'LECTURE_NOTES',
      subjectId: '674391c10000000000000001',
      uploadedAt: '2026-10-20T11:20:00.000Z',
      status: 'APPROVED',
      facultyId: '674391a10000000000000002',
    },
    {
      id: '674391d10000000000000002',
      title: 'Relational Database Design and Normalization Lab Manual',
      author: 'Dr. Ramesh Kulkarni',
      type: 'LAB_MANUAL',
      subjectId: '674391c10000000000000002',
      uploadedAt: '2026-10-25T14:45:00.000Z',
      status: 'APPROVED',
      facultyId: '674391a10000000000000002',
    },
    {
      id: '674391d10000000000000003',
      title: 'Principles of Operating Systems: Concurrency & Virtual Memory',
      author: 'Andrew S. Tanenbaum',
      type: 'REFERENCE_BOOK',
      subjectId: '674391c10000000000000003',
      uploadedAt: '2026-11-02T09:15:00.000Z',
      status: 'APPROVED',
      facultyId: '674391a10000000000000002',
    },
    {
      id: '674391d10000000000000004',
      title: 'Deep Learning Architectures for Academic Document Classification',
      author: 'Kulkarni et al.',
      type: 'RESEARCH_PAPER',
      subjectId: '674391c10000000000000004',
      uploadedAt: '2026-11-08T16:00:00.000Z',
      status: 'APPROVED',
      facultyId: '674391a10000000000000002',
    },
    {
      id: '674391d10000000000000005',
      title: 'End-Semester Examination Question Paper 2025: DBMS',
      author: 'Department Examination Cell',
      type: 'QUESTION_PAPER',
      subjectId: '674391c10000000000000002',
      uploadedAt: '2026-11-12T10:10:00.000Z',
      status: 'APPROVED',
      facultyId: '674391a10000000000000002',
    },
    {
      id: '674391d10000000000000006',
      title: 'Introduction to Applied Thermodynamics Handout',
      author: 'Prof. V. Patil',
      type: 'LECTURE_NOTES',
      subjectId: '674391c10000000000000005',
      uploadedAt: '2026-11-18T13:40:00.000Z',
      status: 'PENDING',
      facultyId: '674391a10000000000000002',
    },
    {
      id: '674391d10000000000000007',
      title: 'Fourier Transform Practice Problem Sets',
      author: 'Prof. S. Joshi',
      type: 'OTHER',
      subjectId: '674391c10000000000000006',
      uploadedAt: '2026-11-10T11:00:00.000Z',
      status: 'REJECTED',
      facultyId: '674391a10000000000000002',
    },
  ];

  const doc0 = documents[0]!;
  const doc1 = documents[1]!;
  const doc5 = documents[5]!;
  const doc6 = documents[6]!;

  const submissions: (SubmissionDto & { facultyId: string })[] = [
    {
      id: '674391e10000000000000001',
      document: {
        id: doc0.id,
        title: doc0.title,
        author: doc0.author,
        type: doc0.type,
        subjectId: doc0.subjectId,
        uploadedAt: doc0.uploadedAt,
      },
      status: 'APPROVED',
      rejectionReason: null,
      submittedAt: '2026-10-20T11:20:00.000Z',
      reviewedAt: '2026-10-21T09:00:00.000Z',
      facultyId: '674391a10000000000000002',
    },
    {
      id: '674391e10000000000000002',
      document: {
        id: doc1.id,
        title: doc1.title,
        author: doc1.author,
        type: doc1.type,
        subjectId: doc1.subjectId,
        uploadedAt: doc1.uploadedAt,
      },
      status: 'APPROVED',
      rejectionReason: null,
      submittedAt: '2026-10-25T14:45:00.000Z',
      reviewedAt: '2026-10-26T10:00:00.000Z',
      facultyId: '674391a10000000000000002',
    },
    {
      id: '674391e10000000000000003',
      document: {
        id: doc5.id,
        title: doc5.title,
        author: doc5.author,
        type: doc5.type,
        subjectId: doc5.subjectId,
        uploadedAt: doc5.uploadedAt,
      },
      status: 'PENDING',
      rejectionReason: null,
      submittedAt: '2026-11-18T13:40:00.000Z',
      reviewedAt: null,
      facultyId: '674391a10000000000000002',
    },
    {
      id: '674391e10000000000000004',
      document: {
        id: doc6.id,
        title: doc6.title,
        author: doc6.author,
        type: doc6.type,
        subjectId: doc6.subjectId,
        uploadedAt: doc6.uploadedAt,
      },
      status: 'REJECTED',
      rejectionReason: 'Scan quality is illegible on pages 4-8. Please provide a clear scan.',
      submittedAt: '2026-11-10T11:00:00.000Z',
      reviewedAt: '2026-11-11T15:30:00.000Z',
      facultyId: '674391a10000000000000002',
    },
  ];

  return { users, departments, subjects, documents, submissions };
}

class MockAdapter {
  private db: MockDb = getInitialDb();
  private currentUser: PublicUser | null = null;

  public reset() {
    this.db = getInitialDb();
    this.currentUser = null;
  }

  public setCurrentUser(user: PublicUser | null) {
    this.currentUser = user;
  }

  public getCurrentUser(): PublicUser | null {
    return this.currentUser;
  }

  private generateId(): string {
    const chars = '0123456789abcdef';
    let id = '';
    for (let i = 0; i < 24; i++) {
      id += chars[Math.floor(Math.random() * chars.length)]!;
    }
    return id;
  }

  // Auth: FR-01 Student Registration
  public registerStudent(data: RegisterRequest): UserEnvelope {
    const email = data.email.trim().toLowerCase();
    if (!email.endsWith('@mitaoe.ac.in')) {
      throw {
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Student email must end with @mitaoe.ac.in',
          details: { email: 'Only @mitaoe.ac.in institutional emails are accepted.' },
        },
      };
    }
    if (!data.name || data.name.trim().length === 0) {
      throw {
        status: 400,
        error: { code: 'VALIDATION_ERROR', message: 'Name is required' },
      };
    }
    if (!data.password || data.password.length < 8) {
      throw {
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 8 characters',
          details: { password: 'Password must be at least 8 characters' },
        },
      };
    }
    if (this.db.users.some((u) => u.email.toLowerCase() === email)) {
      throw {
        status: 409,
        error: { code: 'CONFLICT', message: 'User with this email already exists' },
      };
    }

    const newUser: PublicUser & { passwordHash: string } = {
      id: this.generateId(),
      name: data.name.trim(),
      email,
      role: 'STUDENT',
      createdAt: new Date().toISOString(),
      passwordHash: data.password,
    };
    this.db.users.push(newUser);

    // FR-01: NO JWT returned
    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    };
  }

  // Auth: FR-02 Login
  public login(data: LoginRequest): LoginResponse {
    const email = data.email.trim().toLowerCase();
    const user = this.db.users.find(
      (u) => u.email.toLowerCase() === email && u.passwordHash === data.password
    );
    if (!user) {
      // FR-02: Invalid email and password share generic error
      throw {
        status: 401,
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
      };
    }

    const publicUser: PublicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
    this.currentUser = publicUser;
    const token = `mock-jwt-${user.role.toLowerCase()}-${user.id}`;
    return { token, user: publicUser };
  }

  // Auth: GET /auth/me
  public getMe(): UserEnvelope {
    if (!this.currentUser) {
      throw {
        status: 401,
        error: { code: 'UNAUTHORIZED', message: 'Missing or expired session' },
      };
    }
    return { user: this.currentUser };
  }

  // Users: FR-03 Admin list accounts
  public listUsers(): ListResponse<PublicUser> {
    if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
      throw { status: 403, error: { code: 'FORBIDDEN', message: 'Admin access required' } };
    }
    const items = this.db.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    }));
    return { items, page: 1, pageSize: 50, total: items.length };
  }

  // Users: FR-03 Admin create Faculty or Admin
  public createPrivilegedUser(data: CreatePrivilegedUserRequest): UserEnvelope {
    if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
      throw { status: 403, error: { code: 'FORBIDDEN', message: 'Admin access required' } };
    }
    const email = data.email.trim().toLowerCase();
    if (this.db.users.some((u) => u.email.toLowerCase() === email)) {
      throw { status: 409, error: { code: 'CONFLICT', message: 'User email already exists' } };
    }
    if (!data.password || data.password.length < 8) {
      throw {
        status: 400,
        error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters' },
      };
    }
    if (data.role !== 'FACULTY' && data.role !== 'ADMIN') {
      throw {
        status: 400,
        error: { code: 'VALIDATION_ERROR', message: 'Role must be FACULTY or ADMIN' },
      };
    }

    const newUser: PublicUser & { passwordHash: string } = {
      id: this.generateId(),
      name: data.name.trim(),
      email,
      role: data.role,
      createdAt: new Date().toISOString(),
      passwordHash: data.password,
    };
    this.db.users.push(newUser);

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    };
  }

  // Users: FR-03 Admin update role
  public updateUserRole(id: string, role: UserRole): UserEnvelope {
    if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
      throw { status: 403, error: { code: 'FORBIDDEN', message: 'Admin access required' } };
    }
    const user = this.db.users.find((u) => u.id === id);
    if (!user) {
      throw { status: 404, error: { code: 'NOT_FOUND', message: 'User not found' } };
    }
    user.role = role;
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  // Users: FR-03 Admin delete user
  public deleteUser(id: string): void {
    if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
      throw { status: 403, error: { code: 'FORBIDDEN', message: 'Admin access required' } };
    }
    // Referential check: cannot delete if referenced in documents or submissions
    const hasDocuments = this.db.documents.some((d) => d.facultyId === id);
    if (hasDocuments) {
      throw {
        status: 409,
        error: {
          code: 'CONFLICT',
          message: 'Cannot delete user with referenced document submissions',
        },
      };
    }
    const idx = this.db.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw { status: 404, error: { code: 'NOT_FOUND', message: 'User not found' } };
    }
    this.db.users.splice(idx, 1);
  }

  // Academic: FR-04 Departments
  public listDepartments(): DepartmentDto[] {
    return [...this.db.departments];
  }

  public createDepartment(data: CreateDepartmentRequest): DepartmentDto {
    if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
      throw { status: 403, error: { code: 'FORBIDDEN', message: 'Admin access required' } };
    }
    const name = data.name.trim();
    if (!name) {
      throw { status: 400, error: { code: 'VALIDATION_ERROR', message: 'Name is required' } };
    }
    if (this.db.departments.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      throw {
        status: 409,
        error: { code: 'CONFLICT', message: 'Department with this name already exists' },
      };
    }
    const newDept: DepartmentDto = { id: this.generateId(), name };
    this.db.departments.push(newDept);
    return newDept;
  }

  public deleteDepartment(id: string): void {
    if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
      throw { status: 403, error: { code: 'FORBIDDEN', message: 'Admin access required' } };
    }
    // FR-04: Delete department only without subjects
    const hasSubjects = this.db.subjects.some((s) => s.departmentId === id);
    if (hasSubjects) {
      throw {
        status: 409,
        error: {
          code: 'CONFLICT',
          message: 'Cannot delete department containing active subjects',
        },
      };
    }
    const idx = this.db.departments.findIndex((d) => d.id === id);
    if (idx === -1) {
      throw { status: 404, error: { code: 'NOT_FOUND', message: 'Department not found' } };
    }
    this.db.departments.splice(idx, 1);
  }

  // Academic: FR-04 Subjects
  public listSubjects(departmentId?: string): SubjectDto[] {
    if (departmentId) {
      return this.db.subjects.filter((s) => s.departmentId === departmentId);
    }
    return [...this.db.subjects];
  }

  public createSubject(data: CreateSubjectRequest): SubjectDto {
    if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
      throw { status: 403, error: { code: 'FORBIDDEN', message: 'Admin access required' } };
    }
    const name = data.name.trim();
    if (!name) {
      throw { status: 400, error: { code: 'VALIDATION_ERROR', message: 'Name is required' } };
    }
    const deptExists = this.db.departments.some((d) => d.id === data.departmentId);
    if (!deptExists) {
      throw {
        status: 400,
        error: { code: 'VALIDATION_ERROR', message: 'Referenced Department does not exist' },
      };
    }
    if (
      this.db.subjects.some(
        (s) => s.departmentId === data.departmentId && s.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      throw {
        status: 409,
        error: {
          code: 'CONFLICT',
          message: 'Subject with this name already exists in this Department',
        },
      };
    }
    const newSubject: SubjectDto = {
      id: this.generateId(),
      name,
      departmentId: data.departmentId,
    };
    this.db.subjects.push(newSubject);
    return newSubject;
  }

  public updateSubject(id: string, data: UpdateSubjectRequest): SubjectDto {
    if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
      throw { status: 403, error: { code: 'FORBIDDEN', message: 'Admin access required' } };
    }
    const name = data.name.trim();
    if (!name) {
      throw { status: 400, error: { code: 'VALIDATION_ERROR', message: 'Name is required' } };
    }
    const subject = this.db.subjects.find((s) => s.id === id);
    if (!subject) {
      throw { status: 404, error: { code: 'NOT_FOUND', message: 'Subject not found' } };
    }
    if (
      this.db.subjects.some(
        (s) =>
          s.id !== id &&
          s.departmentId === subject.departmentId &&
          s.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      throw {
        status: 409,
        error: { code: 'CONFLICT', message: 'Subject name already exists in department' },
      };
    }
    subject.name = name;
    return { ...subject };
  }

  public deleteSubject(id: string): void {
    if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
      throw { status: 403, error: { code: 'FORBIDDEN', message: 'Admin access required' } };
    }
    // FR-04: Delete subject only without documents
    const hasDocs = this.db.documents.some((d) => d.subjectId === id);
    if (hasDocs) {
      throw {
        status: 409,
        error: {
          code: 'CONFLICT',
          message: 'Cannot delete subject with associated documents',
        },
      };
    }
    const idx = this.db.subjects.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw { status: 404, error: { code: 'NOT_FOUND', message: 'Subject not found' } };
    }
    this.db.subjects.splice(idx, 1);
  }

  // Documents: FR-09 & FR-10 Approved-only Browse & Search
  public searchApprovedDocuments(params?: DocumentFilterParams): ListResponse<DocumentDto> {
    if (!this.currentUser) {
      throw { status: 401, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } };
    }
    // ONLY APPROVED documents returned
    let list = this.db.documents.filter((d) => d.status === 'APPROVED');

    if (params?.q) {
      const q = params.q.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.author && d.author.toLowerCase().includes(q))
      );
    }
    if (params?.subjectId) {
      list = list.filter((d) => d.subjectId === params.subjectId);
    }
    if (params?.type) {
      list = list.filter((d) => d.type === params.type);
    }

    const page = params?.page && params.page > 0 ? params.page : 1;
    const pageSize = params?.pageSize && params.pageSize > 0 ? params.pageSize : 20;
    const total = list.length;
    const start = (page - 1) * pageSize;
    const items = list.slice(start, start + pageSize).map((d) => ({
      id: d.id,
      title: d.title,
      author: d.author ?? null,
      type: d.type,
      subjectId: d.subjectId,
      uploadedAt: d.uploadedAt,
    }));

    return { items, page, pageSize, total };
  }

  // Documents: GET /documents/{id} (Approved only)
  public getApprovedDocument(id: string): DocumentDto {
    if (!this.currentUser) {
      throw { status: 401, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } };
    }
    const doc = this.db.documents.find((d) => d.id === id && d.status === 'APPROVED');
    if (!doc) {
      // Contract: 404 NotFound. Do not reveal unapproved state
      throw { status: 404, error: { code: 'NOT_FOUND', message: 'Document not found' } };
    }
    return {
      id: doc.id,
      title: doc.title,
      author: doc.author ?? null,
      type: doc.type,
      subjectId: doc.subjectId,
      uploadedAt: doc.uploadedAt,
    };
  }

  // Documents: FR-07 Faculty PDF upload
  public submitPdf(params: SubmitPdfParams): SubmitPdfResponse {
    if (!this.currentUser || this.currentUser.role !== 'FACULTY') {
      throw {
        status: 403,
        error: { code: 'FORBIDDEN', message: 'Only faculty members may submit documents' },
      };
    }
    if (!params.file) {
      throw { status: 400, error: { code: 'VALIDATION_ERROR', message: 'PDF file is required' } };
    }
    if (params.file.size > 50 * 1024 * 1024) {
      throw {
        status: 413,
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'File size exceeds maximum 50 MiB limit' },
      };
    }
    if (!params.file.name.toLowerCase().endsWith('.pdf') && params.file.type !== 'application/pdf') {
      throw {
        status: 400,
        error: { code: 'VALIDATION_ERROR', message: 'File must be an uncorrupted valid PDF' },
      };
    }
    if (!params.title || !params.title.trim()) {
      throw { status: 400, error: { code: 'VALIDATION_ERROR', message: 'Title is required' } };
    }
    const subjectExists = this.db.subjects.some((s) => s.id === params.subjectId);
    if (!subjectExists) {
      throw { status: 400, error: { code: 'VALIDATION_ERROR', message: 'Subject not found' } };
    }

    const docId = this.generateId();
    const submissionId = this.generateId();
    const now = new Date().toISOString();

    const newDoc = {
      id: docId,
      title: params.title.trim(),
      author: params.author?.trim() || null,
      type: params.type,
      subjectId: params.subjectId,
      uploadedAt: now,
      status: 'PENDING' as const,
      facultyId: this.currentUser.id,
      fileBlob: params.file,
    };

    const newSubmission: SubmissionDto & { facultyId: string } = {
      id: submissionId,
      document: {
        id: newDoc.id,
        title: newDoc.title,
        author: newDoc.author,
        type: newDoc.type,
        subjectId: newDoc.subjectId,
        uploadedAt: newDoc.uploadedAt,
      },
      status: 'PENDING',
      rejectionReason: null,
      submittedAt: now,
      reviewedAt: null,
      facultyId: this.currentUser.id,
    };

    this.db.documents.push(newDoc);
    this.db.submissions.push(newSubmission);

    return { submissionId, status: 'PENDING' };
  }

  // Documents: FR-06 Admin update metadata
  public updateDocumentMetadata(id: string, data: UpdateDocumentMetadataRequest): DocumentDto {
    if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
      throw { status: 403, error: { code: 'FORBIDDEN', message: 'Admin access required' } };
    }
    const doc = this.db.documents.find((d) => d.id === id);
    if (!doc) {
      throw { status: 404, error: { code: 'NOT_FOUND', message: 'Document not found' } };
    }
    if (data.title !== undefined) {
      if (!data.title.trim()) {
        throw { status: 400, error: { code: 'VALIDATION_ERROR', message: 'Title cannot be empty' } };
      }
      doc.title = data.title.trim();
    }
    if (data.author !== undefined) {
      doc.author = data.author ? data.author.trim() : null;
    }
    if (data.type !== undefined) {
      doc.type = data.type;
    }
    if (data.subjectId !== undefined) {
      const exists = this.db.subjects.some((s) => s.id === data.subjectId);
      if (!exists) {
        throw { status: 400, error: { code: 'VALIDATION_ERROR', message: 'Invalid subject' } };
      }
      doc.subjectId = data.subjectId;
    }

    // Update in submissions too if present
    const sub = this.db.submissions.find((s) => s.document.id === id);
    if (sub) {
      sub.document = {
        id: doc.id,
        title: doc.title,
        author: doc.author,
        type: doc.type,
        subjectId: doc.subjectId,
        uploadedAt: doc.uploadedAt,
      };
    }

    return {
      id: doc.id,
      title: doc.title,
      author: doc.author,
      type: doc.type,
      subjectId: doc.subjectId,
      uploadedAt: doc.uploadedAt,
    };
  }

  // Documents: FR-06 Admin delete document
  public deleteDocument(id: string): void {
    if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
      throw { status: 403, error: { code: 'FORBIDDEN', message: 'Admin access required' } };
    }
    const docIdx = this.db.documents.findIndex((d) => d.id === id);
    if (docIdx === -1) {
      throw { status: 404, error: { code: 'NOT_FOUND', message: 'Document not found' } };
    }
    this.db.documents.splice(docIdx, 1);
    const subIdx = this.db.submissions.findIndex((s) => s.document.id === id);
    if (subIdx !== -1) {
      this.db.submissions.splice(subIdx, 1);
    }
  }

  // Documents: FR-11 & FR-12 PDF stream & download
  public getPdfBlob(id: string): Blob {
    if (!this.currentUser) {
      throw { status: 401, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } };
    }
    const doc = this.db.documents.find((d) => d.id === id && d.status === 'APPROVED');
    if (!doc) {
      throw { status: 404, error: { code: 'NOT_FOUND', message: 'Approved document not found' } };
    }
    if (doc.fileBlob) {
      return doc.fileBlob;
    }
    return createMinimalPdfBlob(doc.title);
  }

  // Uploads: FR-08 Faculty view own submission statuses
  public listOwnSubmissions(): SubmissionDto[] {
    if (!this.currentUser || this.currentUser.role !== 'FACULTY') {
      throw { status: 403, error: { code: 'FORBIDDEN', message: 'Faculty access required' } };
    }
    return this.db.submissions.filter((s) => s.facultyId === this.currentUser!.id);
  }

  // Approvals: FR-05 Admin list pending submissions
  public listPendingApprovals(): SubmissionDto[] {
    if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
      throw { status: 403, error: { code: 'FORBIDDEN', message: 'Admin access required' } };
    }
    return this.db.submissions.filter((s) => s.status === 'PENDING');
  }

  // Approvals: FR-05 Admin single final decision
  public decideUpload(id: string, data: DecisionRequest): SubmissionDto {
    if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
      throw { status: 403, error: { code: 'FORBIDDEN', message: 'Admin access required' } };
    }
    const submission = this.db.submissions.find((s) => s.id === id);
    if (!submission) {
      throw { status: 404, error: { code: 'NOT_FOUND', message: 'Submission not found' } };
    }
    if (submission.status !== 'PENDING') {
      // FR-05: Final statuses never return to pending; second decision fails
      throw {
        status: 409,
        error: { code: 'CONFLICT', message: 'Submission has already been finalized' },
      };
    }
    if (data.decision === 'REJECTED') {
      if (!data.reason || !data.reason.trim()) {
        throw {
          status: 400,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'A rejection reason is strictly required when rejecting a submission',
          },
        };
      }
    }

    const now = new Date().toISOString();
    submission.status = data.decision;
    submission.reviewedAt = now;
    submission.rejectionReason = data.decision === 'REJECTED' ? data.reason!.trim() : null;

    // Update document status atomically
    const doc = this.db.documents.find((d) => d.id === submission.document.id);
    if (doc) {
      doc.status = data.decision;
    }

    return { ...submission };
  }
}

export const mockAdapter = new MockAdapter();

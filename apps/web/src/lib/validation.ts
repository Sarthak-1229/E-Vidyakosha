import { INSTITUTION_EMAIL_DOMAIN, MAX_PDF_BYTES } from '@evidy/shared';

const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export function validateNameInput(raw: string, fieldLabel = 'Full name'): string | null {
  const value = raw.trim();
  if (!value) return `${fieldLabel} is required.`;
  if (value.length > 120) return `${fieldLabel} must be at most 120 characters.`;
  return null;
}

export function validateEmailInput(
  raw: string,
  options: { requireInstitution?: boolean } = {},
): string | null {
  const value = raw.trim().toLowerCase();
  if (!value) return 'Email address is required.';
  if (value.length > 254) return 'Email address must be at most 254 characters.';
  if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email address.';
  if (options.requireInstitution && !value.endsWith(`@${INSTITUTION_EMAIL_DOMAIN}`)) {
    return `Institutional email must end with @${INSTITUTION_EMAIL_DOMAIN}`;
  }
  return null;
}

export function validatePasswordInput(
  raw: string,
  options: { minLength?: number; requirePolicy?: boolean } = {},
): string | null {
  const minLength = options.minLength ?? 8;
  if (!raw) return 'Password is required.';
  if (raw.length > 128) return 'Password must be at most 128 characters.';
  if (options.requirePolicy !== false && raw.length < minLength) {
    return `Password must be at least ${minLength} characters long.`;
  }
  return null;
}

export function validateTitleInput(raw: string): string | null {
  const value = raw.trim();
  if (!value) return 'Document title is required.';
  if (value.length > 500) return 'Document title must be at most 500 characters.';
  return null;
}

export function validateAuthorInput(raw: string): string | null {
  if (raw.trim().length > 250) return 'Author name must be at most 250 characters.';
  return null;
}

export function validateRejectionReason(raw: string): string | null {
  const value = raw.trim();
  if (!value) return 'A rejection reason is required.';
  if (value.length > 2000) return 'Rejection reason must be at most 2000 characters.';
  return null;
}

export interface PdfPrecheckResult {
  valid: boolean;
  error?: string;
  checks: {
    nonEmpty: boolean;
    format: boolean;
    sizeLimit: boolean;
    signature: boolean | null;
    unencrypted: boolean | null;
  };
}

export function validatePdfFileSync(file: File): PdfPrecheckResult {
  const isPdfName = file.name.toLowerCase().endsWith('.pdf');
  const isPdfMime = file.type === 'application/pdf';
  const formatOk = isPdfName || isPdfMime;
  const nonEmpty = file.size > 0;
  const sizeOk = file.size <= MAX_PDF_BYTES;

  if (!formatOk) {
    return {
      valid: false,
      error: 'Invalid file format. Only PDF documents are accepted.',
      checks: { nonEmpty, format: false, sizeLimit: sizeOk, signature: null, unencrypted: null },
    };
  }
  if (!nonEmpty) {
    return {
      valid: false,
      error: 'Selected PDF file is empty (0 bytes).',
      checks: { nonEmpty: false, format: true, sizeLimit: true, signature: null, unencrypted: null },
    };
  }
  if (!sizeOk) {
    return {
      valid: false,
      error: 'File exceeds maximum allowable size of 50 MiB.',
      checks: { nonEmpty: true, format: true, sizeLimit: false, signature: null, unencrypted: null },
    };
  }

  return {
    valid: true,
    checks: { nonEmpty: true, format: true, sizeLimit: true, signature: null, unencrypted: null },
  };
}

async function readBlobBytes(blob: Blob): Promise<ArrayBuffer | null> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result instanceof ArrayBuffer ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(blob);
    });
  }
  return null;
}

export async function verifyPdfBinaryStructure(file: File): Promise<PdfPrecheckResult> {
  const syncResult = validatePdfFileSync(file);
  if (!syncResult.valid) return syncResult;

  if (typeof file.slice !== 'function') {
    return syncResult;
  }

  try {
    const headerBuffer = await readBlobBytes(file.slice(0, 12));
    if (!headerBuffer || headerBuffer.byteLength === 0) {
      return syncResult;
    }
    const headerText = new TextDecoder('latin1').decode(headerBuffer);

    const signatureValid = /^%PDF-(?:1\.[0-7]|2\.0)[\r\n]/.test(headerText);
    if (!signatureValid) {
      return {
        valid: false,
        error: 'File is not a readable PDF document (missing valid %PDF- header signature).',
        checks: { ...syncResult.checks, signature: false, unencrypted: null },
      };
    }

    const tailStart = Math.max(0, file.size - 8192);
    const tailBuffer = await readBlobBytes(file.slice(tailStart, file.size));
    const tailText = tailBuffer ? new TextDecoder('latin1').decode(tailBuffer) : '';
    const encryptedDetected = /\/Encrypt\s+\d+\s+\d+\s+R\b|\/Encrypt\s*<</.test(tailText);
    if (encryptedDetected) {
      return {
        valid: false,
        error: 'Password-protected or encrypted PDFs are not permitted per institutional policy.',
        checks: { ...syncResult.checks, signature: true, unencrypted: false },
      };
    }

    return {
      valid: true,
      checks: { ...syncResult.checks, signature: true, unencrypted: true },
    };
  } catch {
    return syncResult;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KiB`;
}

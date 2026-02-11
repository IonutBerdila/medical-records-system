import React from 'react';

const iconClass = 'shrink-0';

export const IconDashboard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
  </svg>
);

export const IconDocument: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export const IconPill: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

export const IconShare: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

export const IconUsers: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export const IconShield: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export const IconClock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const IconQr: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </svg>
);

export const IconDocumentEmpty: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-12 w-12 ${iconClass} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

/** Wave/heartbeat for logo */
export const IconPulse: React.FC<{ className?: string; light?: boolean }> = ({ className = '', light }) => (
  <svg className={`h-8 w-8 ${iconClass} ${className}`} viewBox="0 0 32 32" fill="none">
    <path
      d="M4 16h4l4-8 4 16 4-8 4 4h4"
      stroke={light ? 'white' : 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Eye icon for password visibility toggle */
export const IconEye: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    {/* Outer eye */}
    <path
      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Pupil */}
    <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
  </svg>
);

/** Eye-slash icon for password visibility toggle (hidden state) */
export const IconEyeSlash: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    {/* Outer eye */}
    <path
      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Pupil (offset a bit when slashed, optional) */}
    <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
    {/* Slash line */}
    <path
      d="M5 5l14 14"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

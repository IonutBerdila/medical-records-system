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

export const IconPrescription: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <g transform="rotate(-45 12 12)">
      <rect x="4" y="8.5" width="16" height="7" rx="3.5" strokeWidth={2} />
      <line x1="12" y1="8.5" x2="12" y2="15.5" strokeWidth={2} strokeLinecap="round" />
    </g>
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

// Stil doctor (bust cu stetoscop)
export const IconDoctor: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-6 w-6 ${iconClass} ${className}`} viewBox="0 0 32 32" fill="none" stroke="currentColor">
    <circle cx="16" cy="9" r="4" strokeWidth={1.8} />
    <path
      d="M10 18.5c1.5-2 3.5-3 6-3s4.5 1 6 3l2 6.5H8l2-6.5z"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 21.5v3.5m6-3.5v3.5"
      strokeWidth={1.6}
      strokeLinecap="round"
    />
    <path
      d="M11 13c0 2 1 3 2.5 3m7.5-3c0 2-1 3-2.5 3"
      strokeWidth={1.4}
      strokeLinecap="round"
    />
  </svg>
);

// Stil pacient (silueță simplă)
export const IconPatient: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-6 w-6 ${iconClass} ${className}`} viewBox="0 0 32 32" fill="none" stroke="currentColor">
    <circle cx="16" cy="10" r="4" strokeWidth={1.8} />
    <path
      d="M8 23c0-3.3 3.1-6 8-6s8 2.7 8 6v1H8v-1z"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Stil farmacie (farmacist la tejghea)
export const IconPharmacyPerson: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-6 w-6 ${iconClass} ${className}`} viewBox="0 0 40 40" fill="none" stroke="currentColor">
    <circle cx="20" cy="11" r="4" strokeWidth={1.8} />
    <path
      d="M12 26c1.6-3 4.3-4.5 8-4.5s6.4 1.5 8 4.5l1.5 3.5H10.5L12 26z"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9 31.5h22" strokeWidth={2} strokeLinecap="round" />
    <rect x="13" y="18.5" width="4" height="3.5" rx="0.6" strokeWidth={1.4} />
    <rect x="23" y="18.5" width="4" height="3.5" rx="0.6" strokeWidth={1.4} />
  </svg>
);

export const IconShield: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

// Pictogramă „setări” bazată direct pe SVG-ul furnizat (gear clasic)
export const IconSettings: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`h-5 w-5 ${iconClass} ${className}`}
    viewBox="0 0 512 512"
    fill="currentColor"
    stroke="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Gear outline */}
    <path
      d="M179.2 101.0C189.1 96.1 199.0 92.0 209.3 89.4C217.9 87.3 222.2 82.0 223.5 73.5C225.5 60.9 227.8 48.3 229.7 35.6C230.4 31.3 232.3 29.2 236.9 29.2H276.3C280.1 29.2 281.9 30.9 282.5 34.8C284.6 48.1 287.1 61.3 289.2 74.6C290.4 81.8 294.2 86.4 301.2 88.3C316.6 92.4 331.2 98.4 345.0 106.3C351.4 110.0 357.3 109.0 363.1 104.7L394.3 82.2C399.6 78.3 400.8 78.3 405.3 82.8L431.5 109.0C435.0 112.4 435.3 115.3 432.3 119.3L410.0 150.6C405.0 157.3 404.4 163.7 408.7 170.9C416.2 183.6 421.6 197.2 425.5 211.4C427.4 218.4 431.6 222.8 439.2 223.9C452.5 226.0 465.8 228.5 479.1 230.6C483.4 231.3 485.1 233.5 485.1 237.6V276.6C485.2 280.9 483.1 282.8 478.9 283.4C465.4 285.5 452.0 287.9 438.6 290.2C432.0 291.2 427.6 294.7 425.8 301.2C421.6 316.6 415.6 331.1 407.7 344.9C404.3 351.0 405.1 356.6 409.1 362.2L432.3 394.7C435.1 398.5 435.0 401.3 431.5 404.6L404.3 431.8C401.1 435.2 398.5 435.1 394.9 432.4C384.5 424.7 373.7 417.4 363.2 409.7C356.9 405.1 350.7 404.3 343.8 408.3C330.6 415.9 316.6 421.7 301.9 425.6C295.1 427.4 291.3 431.9 290.1 439.0C288.0 452.3 285.5 465.5 283.4 478.8C282.7 483.3 280.7 485.1 276.2 485.1H237.7C233.2 485.1 231.3 483.0 230.6 478.6C228.5 465.1 225.9 451.8 223.8 438.3C222.8 432.1 219.3 427.9 213.4 426.2C198.0 421.7 183.2 415.7 169.1 408.0C163.3 404.8 157.9 406.4 152.8 410.0L119.8 433.4C116.1 436.1 113.6 436.0 110.4 432.7L83.3 405.4C79.9 402.2 79.8 399.6 82.5 395.9L104.9 364.6C109.8 357.9 110.2 351.4 106.1 344.2C99.0 331.5 93.1 318.4 89.4 304.2C87.3 296.5 82.5 292.3 74.3 291.1C61.2 289.2 48.1 286.5 35.0 284.4C31.2 283.8 29.6 282.1 29.6 278.2V238.2C29.5 233.7 31.5 232.2 35.7 231.6C49.1 229.5 62.5 227.0 76.0 224.7C82.1 223.7 86.3 220.2 87.9 214.1C92.2 198.7 98.2 183.9 106.0 169.8C109.0 164.3 108.7 158.7 104.9 153.4L81.5 120.4C78.5 116.3 78.2 113.5 82.1 109.7L108.6 83.2C111.8 79.8 114.5 79.3 118.4 82.3C128.7 89.9 139.4 97.0 149.7 104.7C156.4 109.7 163.0 110.2 170.1 105.9C172.9 104.2 175.9 102.8 179.2 101.0Z"
    />
    {/* inner circle */}
    <circle cx="256" cy="256" r="72" fill="#020617" />
  </svg>
);

export const IconClock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const IconCalendar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const IconAnalytics: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h3l2-6 4 12 3-8 2 2h4" />
  </svg>
);

export const IconSearch: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="11" cy="11" r="5.5" strokeWidth={2} />
    <line x1="16" y1="16" x2="20" y2="20" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

export const IconAlert: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-6 w-6 ${iconClass} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="9" strokeWidth={2} />
    <line x1="12" y1="7" x2="12" y2="13" strokeWidth={2.2} strokeLinecap="round" />
    <circle cx="12" cy="17" r="1.3" fill="currentColor" />
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
    <path
      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
  </svg>
);

/** Eye-slash icon for password visibility toggle (hidden state) */
export const IconEyeSlash: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-5 w-5 ${iconClass} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
    <path d="M5 5l14 14" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

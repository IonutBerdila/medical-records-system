import React from 'react';

export const Divider: React.FC<{ label?: string }> = ({ label }) => {
  return (
    <div className="flex items-center gap-2 text-xs text-mutedText my-4">
      <span className="h-px flex-1 bg-borderSoft" />
      {label && <span>{label}</span>}
      <span className="h-px flex-1 bg-borderSoft" />
    </div>
  );
};


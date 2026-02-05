import React from 'react';

export const Table: React.FC<React.HTMLAttributes<HTMLTableElement> & { children: React.ReactNode }> = ({
  className = '',
  children,
  ...rest
}) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
    <table className={`min-w-full divide-y divide-slate-200 text-sm ${className}`} {...rest}>
      {children}
    </table>
  </div>
);

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <thead className={`bg-slate-50 ${className}`}>
    <tr>{children}</tr>
  </thead>
);

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <th
    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 ${className}`}
    {...rest}
  >
    {children}
  </th>
);

export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="divide-y divide-slate-200 bg-white">{children}</tbody>
);

export const Tr: React.FC<React.HTMLAttributes<HTMLTableRowElement> & { children: React.ReactNode }> = ({
  className = '',
  children,
  ...rest
}) => (
  <tr className={`hover:bg-slate-50/80 transition-colors ${className}`} {...rest}>
    {children}
  </tr>
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <td className={`px-4 py-3 text-slate-700 ${className}`} {...rest}>
    {children}
  </td>
);

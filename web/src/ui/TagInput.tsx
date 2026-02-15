import React, { useCallback, useState, KeyboardEvent } from 'react';

interface TagInputProps {
  label?: string;
  helper?: string;
  error?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  maxLengthPerTag?: number;
}

const normalize = (s: string) => s.trim().toLowerCase();

export const TagInput: React.FC<TagInputProps> = ({
  label,
  helper,
  error,
  value = [],
  onChange,
  placeholder = 'Adaugă...',
  maxTags = 30,
  maxLengthPerTag = 60
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      const tag = trimmed.length > maxLengthPerTag ? trimmed.slice(0, maxLengthPerTag) : trimmed;
      const normalized = normalize(tag);
      const isDuplicate = value.some((t) => normalize(t) === normalized);
      if (isDuplicate || value.length >= maxTags) return;
      onChange([...value, tag]);
      setInputValue('');
    },
    [value, onChange, maxTags, maxLengthPerTag]
  );

  const removeTag = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
      return;
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      e.preventDefault();
      removeTag(value.length - 1);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) addTag(inputValue);
  };

  const inputId = label ? label.replace(/\s+/g, '-').toLowerCase() : undefined;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div
        className={`flex min-h-11 w-full flex-wrap items-center gap-2 rounded-xl border bg-white px-4 py-2 transition-colors focus-within:ring-2 focus-within:ring-primary/20 ${
          error
            ? 'border-red-300 focus-within:border-red-500'
            : 'border-slate-200 focus-within:border-primary'
        }`}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-sm text-slate-800"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="ml-0.5 rounded p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 focus:outline-none"
              aria-label={`Elimină ${tag}`}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        {value.length < maxTags && (
          <input
            id={inputId}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={value.length === 0 ? placeholder : ''}
            className="min-w-[120px] flex-1 border-0 bg-transparent py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            maxLength={maxLengthPerTag}
            aria-invalid={!!error}
          />
        )}
      </div>
      {helper && !error && (
        <p className="text-xs text-slate-500">{helper}</p>
      )}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

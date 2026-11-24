import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search by document title...',
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Search
        size={18}
        color="var(--c-slate)"
        style={{ position: 'absolute', left: '16px', pointerEvents: 'none' }}
      />
      <input
        type="search"
        aria-label="Search by document title"
        maxLength={250}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="form-input"
        style={{
          paddingLeft: '44px',
          paddingRight: value ? '42px' : '16px',
          height: '48px',
          borderRadius: '9999px',
          background: 'rgba(255, 255, 255, 0.85)',
          boxShadow: '0 4px 16px rgba(17, 29, 46, 0.05)',
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="btn-ghost"
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: '12px',
            padding: '6px',
            borderRadius: '50%',
            color: 'var(--c-slate)',
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

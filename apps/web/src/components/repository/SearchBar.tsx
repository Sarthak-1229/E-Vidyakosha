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
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
      <Search
        size={16}
        color="var(--c-text-muted)"
        style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
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
          paddingLeft: '38px',
          paddingRight: value ? '36px' : '12px',
          height: '40px',
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="btn-ghost"
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: '6px',
            padding: '5px',
            borderRadius: '4px',
            color: 'var(--c-text-muted)',
          }}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};

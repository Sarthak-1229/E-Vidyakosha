import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenText } from 'lucide-react';

interface BrandProps {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Brand: React.FC<BrandProps> = ({ to = '/', size = 'md' }) => {
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 26 : 22;

  return (
    <Link className="brand" to={to} aria-label="E-Vidyakosha home">
      <span className="brand-mark">
        <BookOpenText size={iconSize} strokeWidth={2.2} />
      </span>
      <span>E-Vidyakosha</span>
    </Link>
  );
};

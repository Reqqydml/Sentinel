'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyableIDProps {
  value: string;
  label?: string;
  abbreviated?: boolean;
  className?: string;
}

export default function CopyableID({ value, label, abbreviated = true, className = '' }: CopyableIDProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayValue = abbreviated && value.length > 16 ? `${value.slice(0, 16)}...` : value;

  return (
    <button
      onClick={handleCopy}
      className={`monospace flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/50 transition-colors ${className}`}
      title={value}
    >
      <span className="text-sm">{displayValue}</span>
      {copied ? (
        <Check className="w-3 h-3 text-green-400" />
      ) : (
        <Copy className="w-3 h-3 opacity-50 hover:opacity-100" />
      )}
    </button>
  );
}

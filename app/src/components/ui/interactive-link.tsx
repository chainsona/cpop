'use client';

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ReactNode } from "react";

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function InteractiveExternalLink({ href, children, className, ariaLabel }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

interface EditLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function InteractiveEditLink({ href, children, className, ariaLabel }: EditLinkProps) {
  return (
    <Link 
      href={href}
      className={className}
      aria-label={ariaLabel}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Link>
  );
} 
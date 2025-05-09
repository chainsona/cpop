import { ReactNode } from 'react';
import { FilePenLine, BookOpen, Award, AlertTriangle } from 'lucide-react';

interface StatusIconProps {
  iconName: string;
  className?: string;
}

export function StatusIcon({ iconName, className = 'h-3.5 w-3.5' }: StatusIconProps): ReactNode {
  switch (iconName) {
    case 'FilePenLine':
      return <FilePenLine className={`h-4 w-4 ${className}`} />;
    case 'BookOpen':
      return <BookOpen className={`h-4 w-4 ${className}`} />;
    case 'Award':
      return <Award className={`h-4 w-4 ${className}`} />;
    case 'AlertTriangle':
      return <AlertTriangle className={`h-4 w-4 ${className}`} />;
    default:
      return null;
  }
}

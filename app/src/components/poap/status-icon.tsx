import { ReactNode } from 'react';
import { FilePenLine, BookOpen, Award } from 'lucide-react';

interface StatusIconProps {
  iconName: string;
  className?: string;
}

export function StatusIcon({ iconName, className = "h-3.5 w-3.5" }: StatusIconProps): ReactNode {
  switch (iconName) {
    case 'FilePenLine':
      return <FilePenLine className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Award':
      return <Award className={className} />;
    default:
      return null;
  }
} 
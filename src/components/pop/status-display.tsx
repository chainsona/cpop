import { BookOpen, FilePenLine, Award, AlertTriangle, XCircle } from 'lucide-react';

type POPStatus = 'Draft' | 'Published' | 'Distributed' | 'Unclaimable' | 'Disabled';

interface StatusDisplayInfo {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

/**
 * Get status display information for a POP status
 */
export function getStatusDisplay(status: POPStatus): StatusDisplayInfo {
  switch (status) {
    case 'Draft':
      return {
        label: 'Draft',
        color: 'text-neutral-600',
        bgColor: 'bg-neutral-100',
        borderColor: 'border-neutral-200',
        icon: <FilePenLine className="h-3.5 w-3.5" />,
      };
    case 'Published':
      return {
        label: 'Published',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        icon: <BookOpen className="h-3.5 w-3.5" />,
      };
    case 'Distributed':
      return {
        label: 'Distributed',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        icon: <Award className="h-3.5 w-3.5" />,
      };
    case 'Unclaimable':
      return {
        label: 'Unclaimable',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      };
    case 'Disabled':
      return {
        label: 'Disabled',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        icon: <XCircle className="h-3.5 w-3.5" />,
      };
  }
}

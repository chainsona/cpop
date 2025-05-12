import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteMethodDialogProps {
  isOpen: boolean;
  isProcessing: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

export const DeleteMethodDialog = ({
  isOpen,
  isProcessing,
  onOpenChange,
  onDelete,
}: DeleteMethodDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete this distribution method?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will mark the distribution method as deleted and it
            will no longer be available for claims.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={isProcessing}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isProcessing ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

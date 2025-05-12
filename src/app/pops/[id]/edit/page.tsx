import { EditPOP } from '@/components/EditPOP';

interface EditPOPPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPOPPage({ params }: EditPOPPageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit POP</h1>
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <EditPOP id={id} />
        </div>
      </div>
    </div>
  );
}

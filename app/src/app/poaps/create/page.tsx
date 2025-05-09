import { CreatePOAP } from '@/components/CreatePOAP';

export default function CreatePOAPPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create POAP</h1>
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <CreatePOAP />
        </div>
      </div>
    </div>
  );
}

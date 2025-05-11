import { Metadata } from 'next';
import { CreatePOAP } from '@/components/CreatePOAP';
import { CreateExamplePOAP } from '@/components/poap/create-example-poap';
import { generateMetadata as baseGenerateMetadata } from '@/lib/utils/metadata';

export const generateMetadata = (): Metadata => {
  return baseGenerateMetadata('Create POAP', 'Create a new Proof of Attendance Protocol token');
};

export default function CreatePOAPPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Create POAP</h1>
          <CreateExamplePOAP />
        </div>
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <CreatePOAP />
        </div>
      </div>
    </div>
  );
}

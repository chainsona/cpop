import { Zap } from 'lucide-react';
import { calculateAirdropCost } from './utils';

interface AirdropCostAnalysisProps {
  addressCount: number;
}

export const AirdropCostAnalysis = ({ addressCount }: AirdropCostAnalysisProps) => {
  const { compressedCost, regularCost, savings, compressedDetails, regularDetails, txCount } =
    calculateAirdropCost(addressCount);

  return (
    <div className="mt-6 col-span-3">
      <h4 className="text-sm font-semibold uppercase text-neutral-500 mb-3">Cost Analysis</h4>
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-start gap-3 mb-3">
          <Zap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-800">Cost Estimation</h3>
            <p className="text-sm text-blue-700">
              Showing cost savings from ZK Compression technology.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <dl className="space-y-2 bg-white rounded-md p-3 border border-blue-100">
            <div className="flex justify-between py-1">
              <dt className="text-blue-700 font-medium">Cost with ZK Compression:</dt>
              <dd className="font-semibold text-blue-800">{compressedCost} SOL</dd>
            </div>
            <div className="flex justify-between py-1 border-t border-blue-50 pl-3 text-sm">
              <dt className="text-blue-600">→ ZK Compression Fee:</dt>
              <dd className="text-blue-700">{compressedDetails.zkFee} SOL</dd>
            </div>
            <div className="flex justify-between py-1 pl-3 text-sm">
              <dt className="text-blue-600">→ Base Transaction Fee:</dt>
              <dd className="text-blue-700">{compressedDetails.baseFee} SOL</dd>
            </div>
            <div className="flex justify-between py-1 pl-3 text-sm">
              <dt className="text-blue-600">→ Priority Fee (~{txCount} tx):</dt>
              <dd className="text-blue-700">{compressedDetails.priorityFee} SOL</dd>
            </div>

            <div className="flex justify-between py-1 border-t border-blue-100 mt-1">
              <dt className="text-blue-700">Cost without compression:</dt>
              <dd className="font-semibold text-blue-700">{regularCost} SOL</dd>
            </div>
            <div className="flex justify-between py-1 border-t border-blue-50 pl-3 text-sm">
              <dt className="text-blue-600">→ Account Rent:</dt>
              <dd className="text-blue-700">{regularDetails.accountRent} SOL</dd>
            </div>
            <div className="flex justify-between py-1 pl-3 text-sm">
              <dt className="text-blue-600">→ Base Transaction Fee:</dt>
              <dd className="text-blue-700">{regularDetails.baseFee} SOL</dd>
            </div>
            <div className="flex justify-between py-1 pl-3 text-sm">
              <dt className="text-blue-600">→ Priority Fee (~{txCount} tx):</dt>
              <dd className="text-blue-700">{regularDetails.priorityFee} SOL</dd>
            </div>

            <div className="flex justify-between py-1 border-t border-blue-100 mt-1">
              <dt className="text-blue-700">You saved:</dt>
              <dd className="font-semibold text-green-700">{savings}%</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

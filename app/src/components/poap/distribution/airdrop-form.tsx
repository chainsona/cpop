'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { StepIndicator } from './step-indicator';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Coins,
  Loader2,
  AlertTriangle,
  Upload,
  HelpCircle,
  Info,
  Zap,
  DollarSign,
  Microchip,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { POAPMintModal } from '@/components/poap/poap-mint-modal';
import { usePOAPMintModal } from '@/hooks/use-poap-mint-modal';
import { pollForTokenMintStatus } from '@/lib/mint-tokens-utils';

interface AirdropFormProps {
  id: string;
  onSuccess?: () => void;
}

export function AirdropForm({ id, onSuccess }: AirdropFormProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [addresses, setAddresses] = React.useState<string>('');
  const [parsedAddresses, setParsedAddresses] = React.useState<string[]>([]);
  const [maxClaims, setMaxClaims] = React.useState<number | undefined>(undefined);
  const today = new Date();
  const [startDate, setStartDate] = React.useState<Date | undefined>(today);
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingPoap, setIsLoadingPoap] = React.useState(false);
  const [isMinting, setIsMinting] = React.useState(false);
  const [mintProgress, setMintProgress] = React.useState<string>('');
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [isImporting, setIsImporting] = React.useState(false);
  const [budget, setBudget] = React.useState<number | undefined>(undefined);
  const [computeUnitLimit, setComputeUnitLimit] = React.useState<number>(1400000); // Default CU limit
  const [priorityFee, setPriorityFee] = React.useState<number>(1); // Default priority fee in microlamports

  // File input reference
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Add this near the other useState calls
  const { modalState, openMintingModal, setMintSuccess, setMintError, onOpenChange } =
    usePOAPMintModal();

  // Fetch POAP details to get dates
  React.useEffect(() => {
    const fetchPoapDetails = async () => {
      try {
        setIsLoadingPoap(true);
        const response = await fetch(`/api/poaps/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch POAP details');
        }

        const data = await response.json();

        // Auto-populate dates from POAP if available
        if (data.poap) {
          if (data.poap.startDate && !startDate) {
            setStartDate(new Date(data.poap.startDate));
          }

          if (data.poap.endDate && !endDate) {
            setEndDate(new Date(data.poap.endDate));
          }
        }
      } catch (error) {
        console.error('Error fetching POAP details:', error);
      } finally {
        setIsLoadingPoap(false);
      }
    };

    fetchPoapDetails();
  }, [id]);

  // Function to check if token was minted
  const checkTokenMinted = async (): Promise<{ minted: boolean; mintAddress?: string }> => {
    try {
      const response = await fetch(`/api/poaps/${id}`);
      if (!response.ok) {
        throw new Error('Failed to check token status');
      }

      const data = await response.json();
      return {
        minted: !!data.poap.token,
        mintAddress: data.poap.token?.mintAddress,
      };
    } catch (error) {
      console.error('Error checking token status:', error);
      return { minted: false };
    }
  };

  // Handle file import
  const handleFileImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process the imported file
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setValidationErrors([]);

    try {
      const content = await readFileContent(file);
      const importedAddresses = parseFileContent(file.name, content);

      if (importedAddresses.length === 0) {
        setValidationErrors(['No valid addresses found in the file']);
      } else {
        // Append to existing addresses or replace them
        const existingAddressesList = addresses.trim()
          ? addresses.split('\n').filter(a => a.trim() !== '')
          : [];
        const combinedAddresses = [...existingAddressesList, ...importedAddresses];

        // Remove duplicates and join
        const uniqueAddresses = [...new Set(combinedAddresses)];
        setAddresses(uniqueAddresses.join('\n'));

        toast.success(
          `Imported ${importedAddresses.length} addresses${importedAddresses.length !== uniqueAddresses.length - existingAddressesList.length ? ` (${uniqueAddresses.length - existingAddressesList.length} unique)` : ''}`
        );
      }
    } catch (error) {
      console.error('Error importing file:', error);
      setValidationErrors([
        `Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ]);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Read file content as text
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        resolve((e.target?.result as string) || '');
      };
      reader.onerror = e => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  };

  // Parse file content based on file extension
  const parseFileContent = (fileName: string, content: string): string[] => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'json':
        return parseJsonContent(content);
      case 'csv':
        return parseCsvContent(content);
      default:
        throw new Error(`Unsupported file format: ${extension}. Please use .json or .csv files.`);
    }
  };

  // Parse JSON content
  const parseJsonContent = (content: string): string[] => {
    try {
      const data = JSON.parse(content);
      let addresses: string[] = [];

      if (Array.isArray(data)) {
        // Direct array of addresses
        addresses = data.filter(item => typeof item === 'string');
      } else if (typeof data === 'object' && data !== null) {
        // Look for array properties that might contain addresses
        for (const key in data) {
          if (Array.isArray(data[key])) {
            const possibleAddresses = data[key].filter(item => typeof item === 'string');
            if (possibleAddresses.length > 0) {
              addresses = possibleAddresses;
              break;
            }
          }
        }
      }

      // Basic validation of addresses
      return addresses.filter(addr => /^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(addr));
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  };

  // Parse CSV content
  const parseCsvContent = (content: string): string[] => {
    const lines = content.split(/\r?\n/);
    const addresses: string[] = [];

    for (const line of lines) {
      // Split by comma and trim each value
      const values = line.split(',').map(v => v.trim());

      // Check each value in the line for valid Solana addresses
      for (const value of values) {
        if (/^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(value)) {
          addresses.push(value);
        }
      }
    }

    return addresses;
  };

  // Handle parsing and validating the addresses
  const validateAddresses = () => {
    // Clear previous validation errors
    setValidationErrors([]);

    // Parse the addresses
    const lines = addresses.split('\n').filter(line => line.trim() !== '');
    const uniqueAddresses = new Set<string>();
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const address = lines[i].trim();

      // Check address format (basic Solana address validation - should be 44 chars, base58)
      if (!/^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(address)) {
        errors.push(`Line ${i + 1}: "${address}" is not a valid Solana address`);
        continue;
      }

      // Check for duplicates
      if (uniqueAddresses.has(address)) {
        errors.push(`Line ${i + 1}: Duplicate address "${address}"`);
      } else {
        uniqueAddresses.add(address);
      }
    }

    // Set validation errors if any
    if (errors.length > 0) {
      setValidationErrors(errors);
      return false;
    }

    // Set the parsed addresses
    setParsedAddresses(Array.from(uniqueAddresses));
    return true;
  };

  // Submit the form
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/poaps/${id}/distribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'Airdrop',
          addresses: parsedAddresses,
          maxClaims: maxClaims,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create Airdrop distribution');
      }

      const data = await response.json();

      toast.success('Airdrop distribution created successfully');

      // Check for token minting status
      setIsMinting(true);
      setMintProgress('Checking if tokens need to be minted...');

      // Get initial token status
      const initialStatus = await checkTokenMinted();

      if (!initialStatus.minted) {
        // If no token exists, show minting progress indicator
        setMintProgress('Minting POAP tokens...');
        openMintingModal();

        // Start polling for token minting
        pollForTokenMintStatus({
          poapId: id,
          onMinted: () => {
            setIsMinting(false);
            setMintSuccess();
            
            // Show success toast with link to token tab
            toast.success(
              <div className="flex flex-col gap-2">
                <div>POAP tokens minted successfully!</div>
                <Link
                  href={`/poaps/${id}/token`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium underline"
                >
                  <Coins className="h-4 w-4" />
                  View token details
                </Link>
              </div>
            );
          },
          onTimeout: () => {
            setIsMinting(false);
            setMintError('Timeout waiting for token minting');
            console.log('Timeout waiting for token minting');
          }
        });
      } else {
        setIsMinting(false);
      }

      // Refresh the current page instead of redirecting
      router.refresh();

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating Airdrop distribution:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create Airdrop distribution');
      setIsMinting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update the cost calculation function using Helius Airdrop's exact formula
  // Function to calculate estimated cost based on number of recipients
  const calculateCost = (recipientCount: number) => {
    // Constants from Helius Airdrop
    const baseFee = 5000; // 5000 lamports per transaction
    const compressionFee = 10000; // 10000 lamports for ZK compression
    const computeUnitLimit = 1400000; // Default CU limit
    const MICRO_LAMPORTS_PER_LAMPORT = 1000000; // 1 lamport = 1,000,000 microlamports
    const maxAddressesPerTransaction = 22; // Max addresses per tx for airdrop
    const priorityFeeEstimate = priorityFee; // Use the current priority fee setting
    const accountRent = 0.00203928; // Solana rent for token accounts (~0.002 SOL)

    // Calculate number of transactions needed
    const transactionCount = Math.ceil(recipientCount / maxAddressesPerTransaction);

    // Calculate compressed fees (in SOL)
    const compressedBaseFee = (transactionCount * baseFee) / 1e9; // Convert lamports to SOL
    const compressedZkFee = (transactionCount * compressionFee) / 1e9;
    const compressedPriorityFee =
      (transactionCount * computeUnitLimit * priorityFeeEstimate) /
      (MICRO_LAMPORTS_PER_LAMPORT * 1e9);
    const compressedTotal = compressedBaseFee + compressedZkFee + compressedPriorityFee;

    // Calculate normal fees (in SOL)
    const normalBaseFee = (transactionCount * baseFee) / 1e9;
    const normalAccountRent = recipientCount * accountRent;
    const normalPriorityFee =
      (transactionCount * computeUnitLimit * priorityFeeEstimate) /
      (MICRO_LAMPORTS_PER_LAMPORT * 1e9);
    const normalTotal = normalBaseFee + normalAccountRent + normalPriorityFee;

    // Calculate savings
    const savingsAmount = normalTotal - compressedTotal;
    const savingsPercentage = (savingsAmount / normalTotal) * 100;
    const cappedSavingsPercentage = Math.min(savingsPercentage, 99.9);

    return {
      compressedCost: compressedTotal.toFixed(6),
      regularCost: normalTotal.toFixed(6),
      savings: cappedSavingsPercentage.toFixed(2),
      compressedDetails: {
        baseFee: compressedBaseFee.toFixed(6),
        zkFee: compressedZkFee.toFixed(6),
        priorityFee: compressedPriorityFee.toFixed(6),
      },
      regularDetails: {
        baseFee: normalBaseFee.toFixed(6),
        accountRent: normalAccountRent.toFixed(6),
        priorityFee: normalPriorityFee.toFixed(6),
      },
      txCount: transactionCount,
      recipients: recipientCount,
    };
  };

  return (
    <div>
      <div className="mb-6">
        <StepIndicator steps={['Addresses', 'Distribution', 'Review']} currentStep={step} />
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Enter Solana Addresses</h2>
          <p className="text-neutral-600">
            Enter the list of Solana addresses to mint tokens to, or import from a file.
          </p>

          <div className="max-w-md">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="addresses">
                Solana Addresses <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".json,.csv"
                  onChange={handleFileChange}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 mr-1 hover:bg-neutral-100"
                      >
                        <HelpCircle className="h-4 w-4 text-neutral-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="left"
                      className="max-w-sm p-4 bg-white text-neutral-900 shadow-lg border border-neutral-200"
                    >
                      <div className="space-y-3">
                        <h4 className="font-semibold text-neutral-900">Supported File Formats</h4>
                        <div>
                          <p className="text-sm font-medium text-neutral-800 mb-1">JSON:</p>
                          <pre className="bg-neutral-50 p-2 rounded text-xs overflow-x-auto text-neutral-800 border border-neutral-100">
                            {`// Simple array format
[
  "AqiK1wc9AHFXqHpR1zK1BZGS6VYj4CPKsikj9HSsXr8G",
  "HvaPsgpZH4R79nTcjNK71ozvz4XvcDscgse9f7uxB5MJ",
  "..."
]

// Object with addresses array
{
  "addresses": [
    "AqiK1wc9AHFXqHpR1zK1BZGS6VYj4CPKsikj9HSsXr8G",
    "..."
  ]
}`}
                          </pre>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-800 mb-1">CSV:</p>
                          <pre className="bg-neutral-50 p-2 rounded text-xs overflow-x-auto text-neutral-800 border border-neutral-100">
                            {`AqiK1wc9AHFXqHpR1zK1BZGS6VYj4CPKsikj9HSsXr8G
HvaPsgpZH4R79nTcjNK71ozvz4XvcDscgse9f7uxB5MJ
...

// Or with multiple columns
wallet,amount,name
AqiK1wc9AHFXqHpR1zK1BZGS6VYj4CPKsikj9HSsXr8G,1,Alice
...`}
                          </pre>
                          <p className="text-xs text-neutral-700 mt-2">
                            The importer will scan all columns for valid Solana addresses.
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFileImport}
                  disabled={isImporting}
                  className="gap-1.5"
                >
                  {isImporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Import {isImporting ? 'ing...' : ''}
                </Button>
              </div>
            </div>
            <Textarea
              id="addresses"
              placeholder="Enter Solana addresses, one per line"
              value={addresses}
              onChange={e => setAddresses(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-sm text-neutral-600 mt-2">
              Each address will directly receive one token. No claim process is required.
              <span className="block mt-1 text-xs text-neutral-600">
                <span className="inline-flex items-center">
                  <HelpCircle className="inline h-3 w-3 mr-1 text-neutral-600" />
                  Click the help icon above for supported file formats.
                </span>
              </span>
            </p>
          </div>

          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-1">Please fix the following errors:</p>
                <ul className="list-disc pl-5 text-sm">
                  {validationErrors.slice(0, 5).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li>...and {validationErrors.length - 5} more errors</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="pt-4">
            <Button
              onClick={() => {
                if (validateAddresses() && parsedAddresses.length > 0) {
                  setStep(2);
                }
              }}
              disabled={addresses.trim() === '' || isLoadingPoap || isImporting}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Distribution Settings</h2>
          <p className="text-neutral-600">
            Configure when and how tokens will be distributed to recipient wallets.
          </p>

          <div className="space-y-6 max-w-md">
            {/* Airdrop Start Date */}
            <div className="bg-white p-4 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium">Airdrop Start Date</h3>
              </div>
              <div>
                <Label htmlFor="startDate">When to start the distribution</Label>
                <div className="flex gap-3 items-center mt-2">
                  <DatePicker date={startDate} onChange={setStartDate} />
                  <Badge variant="outline" className="ml-1">
                    Default: Now
                  </Badge>
                </div>
                <p className="text-sm text-neutral-600 mt-2">
                  Distribution will begin at this date and time. Choose now for immediate
                  distribution.
                </p>
              </div>
            </div>

            {/* Budget */}
            <div className="bg-white p-4 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">Budget</h3>
              </div>
              <div>
                <Label htmlFor="budget">Maximum SOL to spend</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="budget"
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="SOL amount"
                    value={budget || ''}
                    onChange={e =>
                      setBudget(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                  <Badge variant="outline">SOL</Badge>
                </div>

                {/* Budget warning */}
                {budget !== undefined &&
                  (() => {
                    const { compressedCost } = calculateCost(parsedAddresses.length);
                    const estimatedCost = parseFloat(compressedCost);
                    if (budget < estimatedCost) {
                      return (
                        <Alert variant="destructive" className="mt-3 py-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Your budget ({budget.toFixed(6)} SOL) is lower than the estimated cost (
                            {compressedCost} SOL).
                          </AlertDescription>
                        </Alert>
                      );
                    } else {
                      return (
                        <Alert className="mt-3 py-2 bg-green-50 border-green-200 text-green-800">
                          <Info className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-xs text-green-700">
                            Your budget is sufficient for this distribution.
                          </AlertDescription>
                        </Alert>
                      );
                    }
                  })()}

                <p className="text-sm text-neutral-600 mt-2">
                  Set a maximum amount of SOL you're willing to spend on this distribution.
                </p>
              </div>
            </div>

            {/* Transaction Compute Settings */}
            <div className="bg-white p-4 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-2 mb-3">
                <Microchip className="h-5 w-5 text-purple-600" />
                <h3 className="font-medium">Transaction Compute Settings</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-neutral-400 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent className="w-80 p-3 text-sm">
                      <p className="mb-2">
                        <strong>Compute Unit Limit:</strong> Maximum computation units allowed for
                        each transaction. Higher values allow more complex transactions.
                      </p>
                      <p>
                        <strong>Priority Fee:</strong> Additional fee to prioritize your transaction
                        during network congestion. 1 microlamport = 0.000001 lamports.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="space-y-4">
                {/* Compute Unit Limit */}
                <div>
                  <div className="flex justify-between mb-1">
                    <Label htmlFor="computeUnitLimit">Compute Unit Limit</Label>
                    <span className="text-sm text-neutral-600">
                      {computeUnitLimit.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    id="computeUnitLimit"
                    min={300000}
                    max={1600000}
                    step={100000}
                    value={[computeUnitLimit]}
                    onValueChange={values => setComputeUnitLimit(values[0])}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>300K</span>
                    <span>800K</span>
                    <span>1.2M</span>
                    <span>1.6M</span>
                  </div>
                </div>

                {/* Priority Fee */}
                <div>
                  <div className="flex justify-between mb-1">
                    <Label htmlFor="priorityFee">Priority Fee (μLamports)</Label>
                    <span className="text-sm text-neutral-600">{priorityFee}</span>
                  </div>
                  <Slider
                    id="priorityFee"
                    min={1}
                    max={50000}
                    step={1000}
                    value={[priorityFee]}
                    onValueChange={values => setPriorityFee(values[0])}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>Minimum</span>
                    <span>Medium</span>
                    <span>High</span>
                    <span>Max</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={isSubmitting}>
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Review and Create</h2>

          <div className="space-y-4">
            {/* Recipient Information */}
            <div className="bg-white p-4 rounded-lg border border-neutral-200">
              <h3 className="text-sm uppercase text-neutral-500 mb-3">Recipients</h3>
              <dl className="space-y-2">
                <div className="flex justify-between py-2">
                  <dt className="font-medium">Number of recipients:</dt>
                  <dd>{parsedAddresses.length}</dd>
                </div>
                <div className="flex justify-between py-2 border-t border-neutral-200">
                  <dt className="font-medium">Maximum recipients:</dt>
                  <dd>{maxClaims || parsedAddresses.length}</dd>
                </div>
              </dl>
            </div>

            {/* Distribution Settings */}
            <div className="bg-white p-4 rounded-lg border border-neutral-200">
              <h3 className="text-sm uppercase text-neutral-500 mb-3">Distribution Settings</h3>
              <dl className="space-y-2">
                <div className="flex justify-between py-2">
                  <dt className="font-medium">Start date:</dt>
                  <dd>{startDate ? startDate.toLocaleString() : 'Immediate'}</dd>
                </div>
                {budget !== undefined && (
                  <div className="flex justify-between py-2 border-t border-neutral-200">
                    <dt className="font-medium">Budget:</dt>
                    <dd>{budget.toFixed(6)} SOL</dd>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t border-neutral-200">
                  <dt className="font-medium">Compute unit limit:</dt>
                  <dd>{computeUnitLimit.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between py-2 border-t border-neutral-200">
                  <dt className="font-medium">Priority fee:</dt>
                  <dd>{priorityFee} μLamports</dd>
                </div>
              </dl>
            </div>

            {/* Add cost estimation section */}
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
              <div className="flex items-start gap-3 mb-3">
                <Zap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">Estimated Cost Analysis</h3>
                  <p className="text-sm text-blue-700 mb-1">
                    This distribution uses ZK Compression technology to reduce costs significantly.
                  </p>
                </div>
              </div>

              {/* Cost calculations */}
              {(() => {
                const {
                  compressedCost,
                  regularCost,
                  savings,
                  compressedDetails,
                  regularDetails,
                  txCount,
                } = calculateCost(parsedAddresses.length);

                return (
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
                        <dt className="text-blue-700">You save:</dt>
                        <dd className="font-semibold text-green-700">{savings}%</dd>
                      </div>

                      {/* Budget warning in cost section */}
                      {budget !== undefined && parseFloat(compressedCost) > budget && (
                        <div className="flex justify-between py-1 border-t border-blue-100 bg-red-50 px-2 -mx-2 rounded">
                          <dt className="text-red-700">Your budget:</dt>
                          <dd className="font-semibold text-red-700">
                            {budget.toFixed(6)} SOL (insufficient)
                          </dd>
                        </div>
                      )}
                    </dl>

                    <div className="bg-blue-100 p-3 rounded-md text-sm text-blue-800">
                      <p className="font-semibold mb-1 flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        How it works
                      </p>
                      <p className="mb-2">
                        Traditional airdrops require creating an Associated Token Account (ATA) for
                        each recipient (~0.002 SOL each).
                      </p>
                      <p>
                        Airdrop with ZK Compression avoids these costs by using compressed token
                        accounts while maintaining the same security as regular Solana tokens.
                      </p>
                    </div>

                    <div className="text-xs text-blue-600 mt-1 text-center">
                      <span className="block">
                        Cost estimates based on Helius Airdrop calculator.
                        <a
                          href="https://github.com/helius-labs/airdrop"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 underline ml-1"
                        >
                          View source code
                        </a>
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                disabled={isSubmitting || isMinting}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  isMinting ||
                  (budget !== undefined &&
                    budget < parseFloat(calculateCost(parsedAddresses.length).compressedCost))
                }
              >
                {isSubmitting
                  ? 'Creating...'
                  : budget !== undefined &&
                      budget < parseFloat(calculateCost(parsedAddresses.length).compressedCost)
                    ? 'Insufficient Budget'
                    : 'Create Airdrop Distribution'}
              </Button>
            </div>

            {/* Token minting status indicator */}
            {isMinting && (
              <div className="mt-6 bg-blue-50 p-4 rounded-lg flex items-center gap-3 border border-blue-100 animate-pulse">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <div>
                  <p className="text-blue-700 font-medium">{mintProgress}</p>
                  <p className="text-blue-600 text-sm">
                    The tokens will be minted directly to recipient wallets.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <POAPMintModal
        open={modalState.open}
        onOpenChange={onOpenChange}
        status={modalState.status}
        error={modalState.error}
        poapId={id}
      />
    </div>
  );
}

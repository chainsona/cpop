import { FileText, AlertCircle, Info, Code } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Metadata } from '../types';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface MetadataViewerProps {
  metadata: Metadata | null;
  isMetadataLoading: boolean;
  metadataError: string | null;
}

export const MetadataViewer = ({
  metadata,
  isMetadataLoading,
  metadataError,
}: MetadataViewerProps) => {
  const [showJsonView, setShowJsonView] = useState(false);
  const [isStableLoading, setIsStableLoading] = useState(isMetadataLoading);
  
  // Add refs to prevent excessive re-renders
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevLoadingState = useRef(isMetadataLoading);
  const loadingChangeCount = useRef(0);

  // Use useEffect with cleanup and delay to prevent rapid state changes
  useEffect(() => {
    // Skip if the loading state hasn't actually changed
    if (prevLoadingState.current === isMetadataLoading) {
      return;
    }
    
    // Update the previous loading state
    prevLoadingState.current = isMetadataLoading;
    
    // Track number of changes to prevent excessive re-renders
    loadingChangeCount.current += 1;
    
    // If we've had too many changes, bail out for a while
    if (loadingChangeCount.current > 5) {
      console.log('Too many loading state changes, stabilizing for 5 seconds');
      // Set a timeout to reset the counter after a delay
      setTimeout(() => {
        loadingChangeCount.current = 0;
      }, 5000);
      return;
    }
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (isMetadataLoading) {
      setIsStableLoading(true);
    } else {
      // Use a longer delay to prevent flickering
      timerRef.current = setTimeout(() => {
        setIsStableLoading(false);
        timerRef.current = null;
      }, 400);
    }
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isMetadataLoading]);

  // Memoize content rendering to prevent re-renders
  const renderedContent = useMemo(() => {
    if (isStableLoading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading metadata...</p>
        </div>
      );
    }

    if (metadataError) {
      // Determine alert variant based on error message
      // Use "warning" for messages about metadata still being prepared
      const isPreparingMetadata =
        metadataError.includes('being prepared') ||
        metadataError.includes('not available yet') ||
        metadataError.includes('is being');

      // Check if this is an authorization error
      const isAuthError =
        metadataError.includes('authorized') || metadataError.includes('permission');

      return (
        <Alert variant={isPreparingMetadata ? 'default' : 'destructive'} className="mb-6">
          {isPreparingMetadata ? <Info className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{isPreparingMetadata ? 'Metadata Status' : 'Error'}</AlertTitle>
          <AlertDescription>
            {metadataError}
            {isAuthError && (
              <div className="mt-2 text-sm font-medium">
                Click the <strong>Refresh</strong> button above to resolve authorization issues.
              </div>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    if (!metadata) {
      return (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>No Metadata Available</AlertTitle>
          <AlertDescription>
            No metadata could be found for this POP. This may be because no token has been created
            yet.
          </AlertDescription>
        </Alert>
      );
    }

    if (showJsonView) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Raw JSON Metadata</CardTitle>
            <CardDescription>The complete metadata as stored on-chain</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-neutral-50 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-neutral-500">Name</dt>
                <dd className="mt-1">{metadata.name}</dd>
              </div>
              {metadata.symbol && (
                <div>
                  <dt className="text-sm font-medium text-neutral-500">Symbol</dt>
                  <dd className="mt-1">{metadata.symbol}</dd>
                </div>
              )}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-neutral-500">Description</dt>
                <dd className="mt-1">{metadata.description}</dd>
              </div>
              {metadata.external_url && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-neutral-500">External URL</dt>
                  <dd className="mt-1">
                    <a
                      href={metadata.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {metadata.external_url}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {metadata.image && (
          <Card>
            <CardHeader>
              <CardTitle>Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center p-4 bg-neutral-50 rounded-lg">
                <img
                  src={metadata.image}
                  alt={metadata.name}
                  className="max-w-full max-h-[300px] object-contain rounded-lg shadow-sm"
                />
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                <a
                  href={metadata.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View original image
                </a>
              </p>
            </CardContent>
          </Card>
        )}

        {metadata.attributes && metadata.attributes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {metadata.attributes.map((attr, index) => (
                  <div key={index} className="bg-neutral-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-neutral-500">{attr.trait_type}</div>
                    <div className="mt-1 font-medium">{attr.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {metadata.properties && (
          <Card>
            <CardHeader>
              <CardTitle>Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {metadata.properties.creators && metadata.properties.creators.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Creators</h3>
                  <div className="space-y-2">
                    {metadata.properties.creators.map((creator, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg"
                      >
                        <div className="font-mono text-sm">{creator.address}</div>
                        <div className="text-sm font-medium">{creator.share}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {metadata.properties.files && metadata.properties.files.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Files</h3>
                  <div className="space-y-2">
                    {metadata.properties.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg"
                      >
                        <div className="overflow-hidden text-ellipsis">
                          <a
                            href={file.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {file.uri.split('/').pop()}
                          </a>
                        </div>
                        <div className="text-sm font-medium">{file.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }, [isStableLoading, metadata, metadataError, showJsonView]);

  // Use useCallback for toggle function to prevent unnecessary re-renders
  const toggleJsonView = useCallback(() => {
    setShowJsonView(prev => !prev);
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold">Token Metadata</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600 mr-1">Raw JSON</span>
          <button
            onClick={toggleJsonView}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
              showJsonView ? 'bg-blue-600' : 'bg-neutral-200'
            }`}
            aria-pressed={showJsonView}
            aria-labelledby="json-toggle-label"
            disabled={isStableLoading}
          >
            <span className="sr-only">Use setting</span>
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                showJsonView ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <Code className="h-4 w-4 text-neutral-500" />
        </div>
      </div>
      {renderedContent}
    </>
  );
};

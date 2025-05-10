'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe, User, Building, PlusCircle, Trash, Save, Loader2, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LocationPicker } from '@/components/poap/location-picker';
import { POAPTabNav } from '@/components/poap/poap-tab-nav';
import { toast } from 'sonner';

export default function POAPAttributesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const id = pathname.split('/')[2]; // Extract ID from URL path: /poaps/[id]/attributes

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [poapData, setPoapData] = React.useState<{
    createdAt: Date;
    updatedAt: Date;
    id: string;
  } | null>(null);

  // Event Location state
  const [eventLocation, setEventLocation] = React.useState<'physical' | 'online'>('physical');
  const [platform, setPlatform] = React.useState<string>('');
  const [customPlatform, setCustomPlatform] = React.useState<string>('');
  const [platformUrl, setPlatformUrl] = React.useState<string>('');
  const [selectedLocation, setSelectedLocation] = React.useState<{
    city: string;
    country: string;
  } | null>(null);

  // Artists state
  const [artists, setArtists] = React.useState<Array<{ name: string; url: string }>>([
    { name: '', url: '' },
  ]);

  // Organization state
  const [organization, setOrganization] = React.useState<{ name: string; url: string }>({
    name: '',
    url: '',
  });

  // Fetch existing attributes data
  React.useEffect(() => {
    const fetchAttributes = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // First, fetch the POAP data to get metadata
        const poapResponse = await fetch(`/api/poaps/${id}`);
        if (!poapResponse.ok) {
          throw new Error(`Failed to fetch POAP: ${poapResponse.statusText}`);
        }
        const poapData = await poapResponse.json();
        
        // Correctly parse the dates
        const createdDate = new Date(poapData.poap.createdAt);
        const updatedDate = new Date(poapData.poap.updatedAt);
        
        // Make sure we have valid dates before setting state
        if (!isNaN(createdDate.getTime()) && !isNaN(updatedDate.getTime())) {
          setPoapData({
            createdAt: createdDate,
            updatedAt: updatedDate,
            id: poapData.poap.id
          });
        } else {
          console.error('Invalid dates received:', poapData.poap.createdAt, poapData.poap.updatedAt);
        }

        const response = await fetch(`/api/poaps/${id}/attributes`);

        if (!response.ok) {
          // If 404, it just means no attributes yet, which is fine
          if (response.status !== 404) {
            throw new Error(`Failed to fetch attributes: ${response.statusText}`);
          }
          // Just return without setting any values
          return;
        }

        const data = await response.json();

        if (data.attributes) {
          // Set event location type
          setEventLocation(data.attributes.eventType === 'Online' ? 'online' : 'physical');

          // Set platform for online events
          if (data.attributes.eventType === 'Online' && data.attributes.platform) {
            const platformValue = data.attributes.platform.toLowerCase();
            if (['discord', 'twitter', 'zoom', 'meet'].includes(platformValue)) {
              setPlatform(platformValue);
            } else {
              setPlatform('other');
              setCustomPlatform(data.attributes.platform);
            }

            // Set platform URL if it exists
            if (data.attributes.platformUrl) {
              setPlatformUrl(data.attributes.platformUrl);
            }
          }

          // Set physical location
          if (data.attributes.eventType === 'Physical' && data.attributes.city) {
            setSelectedLocation({
              city: data.attributes.city,
              country: data.attributes.country || '',
            });
          }

          // Set artists
          if (data.attributes.artists && data.attributes.artists.length > 0) {
            setArtists(
              data.attributes.artists.map((artist: any) => ({
                name: artist.name,
                url: artist.url || '',
              }))
            );
          }

          // Set organization
          if (data.attributes.organization) {
            setOrganization({
              name: data.attributes.organization.name,
              url: data.attributes.organization.url || '',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching attributes:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchAttributes();
    }
  }, [id]);

  // Helper function to add artist
  const addArtist = () => {
    setArtists([...artists, { name: '', url: '' }]);
  };

  // Helper function to remove artist
  const removeArtist = (index: number) => {
    const newArtists = [...artists];
    newArtists.splice(index, 1);
    setArtists(newArtists);
  };

  // Helper function to update artist
  const updateArtist = (index: number, field: 'name' | 'url', value: string) => {
    const newArtists = [...artists];
    newArtists[index][field] = value;
    setArtists(newArtists);
  };

  // Handle save
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Validate required fields
      const validArtists = artists.filter(a => a.name.trim() !== '');

      // Prepare the data for the API
      const attributesData = {
        eventType: eventLocation === 'physical' ? 'Physical' : 'Online',
        platform:
          eventLocation === 'online' ? (platform === 'other' ? customPlatform : platform) : null,
        platformUrl:
          eventLocation === 'online' && platformUrl
            ? platformUrl.startsWith('http')
              ? platformUrl
              : `https://${platformUrl}`
            : null,
        city: selectedLocation?.city || null,
        country: selectedLocation?.country || null,
        artists: validArtists.length > 0 ? validArtists : null,
        organization:
          organization.name.trim() !== ''
            ? {
                name: organization.name,
                url: organization.url,
              }
            : null,
      };

      console.log('Preparing to save attributes for POAP ID:', id);
      console.log('Attributes data:', JSON.stringify(attributesData, null, 2));

      // Determine if we're creating or updating
      let method = 'POST'; // Default to creating new attributes

      try {
        console.log('Checking if attributes already exist...');
        const existingResponse = await fetch(`/api/poaps/${id}/attributes`);
        console.log('Existing check response status:', existingResponse.status);

        // Only use PATCH if we successfully retrieved existing attributes
        if (existingResponse.ok && existingResponse.status === 200) {
          const data = await existingResponse.json();
          console.log('Existing attributes data:', data);
          if (data.attributes) {
            method = 'PATCH';
            console.log('Existing attributes found, will use PATCH');
          } else {
            console.log('No existing attributes in the response, will use POST');
          }
        } else {
          console.log('No existing attributes found (status not 200), will use POST');
        }
      } catch (checkError) {
        console.error('Error checking existing attributes:', checkError);
        // If we can't check, default to POST to create new attributes
      }

      console.log(`Using ${method} method to save attributes`);

      // Save to the API
      console.log(`Sending ${method} request to /api/poaps/${id}/attributes`);
      let response;
      try {
        response = await fetch(`/api/poaps/${id}/attributes`, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(attributesData),
        });
        console.log('Save response status:', response.status);
      } catch (fetchError) {
        console.error('Network error during fetch:', fetchError);
        throw new Error(
          `Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to server'}`
        );
      }

      let responseText = '';
      try {
        responseText = await response.text();
        console.log('Raw response text:', responseText);
      } catch (textError) {
        console.error('Error reading response text:', textError);
        throw new Error('Could not read response from server');
      }

      let responseData;
      try {
        // Try to parse as JSON
        responseData = JSON.parse(responseText);
        console.log('Parsed response data:', responseData);
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        console.error('Error response from server:', responseData);

        // If we get a 404 with "Attributes not found" when trying to PATCH,
        // retry with POST method
        if (
          response.status === 404 &&
          method === 'PATCH' &&
          responseData.error === 'Attributes not found'
        ) {
          console.log('Retrying with POST method');

          try {
            const retryResponse = await fetch(`/api/poaps/${id}/attributes`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(attributesData),
            });

            console.log('Retry response status:', retryResponse.status);
            const retryResponseText = await retryResponse.text();
            console.log('Retry raw response:', retryResponseText);

            let retryResponseData;
            try {
              retryResponseData = JSON.parse(retryResponseText);
              console.log('Retry parsed response:', retryResponseData);
            } catch (parseError) {
              console.error('Error parsing retry response:', parseError);
              throw new Error(
                `Server returned invalid JSON on retry: ${retryResponseText.substring(0, 100)}...`
              );
            }

            if (!retryResponse.ok) {
              throw new Error(
                retryResponseData.error ||
                  retryResponseData.message ||
                  retryResponseData.details ||
                  `Failed to save attributes after retry (Status: ${retryResponse.status})`
              );
            }

            // Show success message for the retry
            toast.success('POAP attributes saved successfully');

            // Navigate back to POAP detail page
            router.push(`/poaps/${id}`);
            return;
          } catch (retryError) {
            console.error('Error during retry:', retryError);
            throw retryError;
          }
        }

        throw new Error(
          responseData.error ||
            responseData.message ||
            responseData.details ||
            `Failed to save attributes (Status: ${response.status})`
        );
      }

      // Show success message
      toast.success('POAP attributes saved successfully');

      // Navigate back to POAP detail page
      router.push(`/poaps/${id}`);
    } catch (err) {
      console.error('Error saving attributes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save attributes';
      console.error('Error message:', errorMessage);
      setError(errorMessage);

      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          <p className="text-neutral-500">Loading attributes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/poaps/${id}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to POAP
            </Button>
          </Link>
        </div>

        {/* Use the shared tab navigation */}
        <div className="mb-8">
          <POAPTabNav poapId={id} />
        </div>

        <h2 className="text-2xl font-bold mb-6">POAP Metadata</h2>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
            <p className="font-medium text-red-800 mb-1">Error</p>
            <p className="text-sm">{error}</p>
            <div className="mt-2">
              <p className="text-xs text-red-600 font-medium">Troubleshooting tips:</p>
              <ul className="list-disc list-inside text-xs text-red-600 mt-1">
                <li>Make sure the POAP exists with ID: {id}</li>
                <li>Check that all required fields are filled out</li>
                <li>Try refreshing the page and attempt again</li>
                <li>Check browser console for more details</li>
              </ul>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Combined Event Location & Organization Section */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            {/* Event Location */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Globe className="h-5 w-5 text-indigo-600 mr-2" />
                Event Location
              </h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select
                    value={eventLocation}
                    onValueChange={(value: 'physical' | 'online') => setEventLocation(value)}
                  >
                    <SelectTrigger id="eventType" className="mt-1">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Physical Location</SelectItem>
                      <SelectItem value="online">Online Platform</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {eventLocation === 'physical' ? (
                  <div className="mt-4">
                    <Label>Location</Label>
                    <LocationPicker
                      onSelectLocation={location => setSelectedLocation(location)}
                      className="mt-1"
                      initialLocation={selectedLocation}
                    />
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label htmlFor="platform">Platform</Label>
                      <Select value={platform} onValueChange={setPlatform}>
                        <SelectTrigger id="platform" className="mt-1">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discord">Discord</SelectItem>
                          <SelectItem value="twitter">X / Twitter</SelectItem>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="meet">Google Meet</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {platform === 'other' && (
                      <div>
                        <Label htmlFor="customPlatform">Specify platform</Label>
                        <Input
                          id="customPlatform"
                          value={customPlatform}
                          onChange={e => setCustomPlatform(e.target.value)}
                          placeholder="Enter platform name"
                          className="mt-1"
                        />
                      </div>
                    )}

                    {platform && (
                      <div>
                        <Label htmlFor="platformUrl">Platform URL</Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
                            https://
                          </div>
                          <Input
                            id="platformUrl"
                            value={platformUrl.replace(/^https?:\/\//, '')}
                            onChange={e => {
                              const input = e.target.value;
                              // Remove any protocol prefix the user might type
                              const sanitized = input.replace(/^https?:\/\//, '');
                              // Add https:// prefix for the actual value
                              setPlatformUrl(sanitized ? `https://${sanitized}` : '');
                            }}
                            placeholder="meetingurl.example.com/123"
                            className="pl-[72px] mt-1"
                          />
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Link to the specific meeting or platform space
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Organization Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Building className="h-5 w-5 text-blue-600 mr-2" />
                Organization
              </h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={organization.name}
                    onChange={e => setOrganization({ ...organization, name: e.target.value })}
                    className="mt-1"
                    placeholder="Enter organization name"
                  />
                </div>
                <div>
                  <Label htmlFor="orgUrl">Organization URL</Label>
                  <Input
                    id="orgUrl"
                    value={organization.url}
                    placeholder="https://"
                    onChange={e => setOrganization({ ...organization, url: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Artists Section */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 text-pink-600 mr-2" />
              Artist Details
            </h2>

            <div className="space-y-4">
              {artists.map((artist, index) => (
                <div key={index} className="space-y-3 p-3 bg-neutral-50 rounded-lg">
                  <div className="flex justify-between">
                    {artists.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArtist(index)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`artistName${index}`}>Name</Label>
                    <Input
                      id={`artistName${index}`}
                      value={artist.name}
                      onChange={e => updateArtist(index, 'name', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`artistUrl${index}`}>URL</Label>
                    <Input
                      id={`artistUrl${index}`}
                      value={artist.url}
                      placeholder="https://"
                      onChange={e => updateArtist(index, 'url', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addArtist}
                className="w-full flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                Add Artist
              </Button>
            </div>
          </div>

          {/* POAP Metadata Section */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 md:col-span-2">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Hash className="h-5 w-5 text-gray-600 mr-2" />
              POAP Details
            </h2>

            <div className="space-y-3">
              {poapData && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-500">Created</p>
                      <p className="text-neutral-700">
                        {poapData.createdAt instanceof Date && !isNaN(poapData.createdAt.getTime())
                          ? poapData.createdAt.toLocaleString()
                          : 'Date not available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-500">Last Updated</p>
                      <p className="text-neutral-700">
                        {poapData.updatedAt instanceof Date && !isNaN(poapData.updatedAt.getTime())
                          ? poapData.updatedAt.toLocaleString() 
                          : 'Date not available'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-500">ID</p>
                    <p className="text-neutral-700 font-mono">{poapData.id}</p>
                  </div>
                </>
              )}
              {!poapData && (
                <div className="text-neutral-500">Loading POAP metadata...</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} className="flex items-center gap-2" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Attributes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

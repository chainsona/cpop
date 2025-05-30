'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, ExternalLink, Bell, Save, Loader2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { POPTabNav } from '@/components/pop/pop-tab-nav';
import { ToggleDisabledStatus } from '@/components/pop/toggle-disabled-status';
import { toast } from 'sonner';

export default function POPSettingsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const id = pathname.split('/')[2]; // Extract ID from URL path: /pops/[id]/settings
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Claim Period settings
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined);
  const [includeTime, setIncludeTime] = React.useState<boolean>(false);
  const [datesPrefilled, setDatesPrefilled] = React.useState<boolean>(false);

  // Visibility settings
  const [visibility, setVisibility] = React.useState<string>('public');
  const [allowSearch, setAllowSearch] = React.useState<boolean>(true);

  // Notification settings
  const [notifyOnClaim, setNotifyOnClaim] = React.useState<boolean>(true);

  // Disable POP status
  const [popStatus, setPopStatus] = React.useState<string>('');

  // Fetch existing settings data
  React.useEffect(() => {
    const fetchPopAndSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // First fetch the POP data to get start/end dates
        const popResponse = await fetch(`/api/pops/${id}`);
        
        if (popResponse.ok) {
          const popData = await popResponse.json();
          
          if (popData.pop) {
            // Set POP status
            setPopStatus(popData.pop.status);
            
            // Only set the dates if settings haven't been loaded yet
            if (popData.pop.startDate) {
              setStartDate(new Date(popData.pop.startDate));
              setDatesPrefilled(true);
            }
            
            if (popData.pop.endDate) {
              setEndDate(new Date(popData.pop.endDate));
              setDatesPrefilled(true);
            }
          }
        }
        
        // Then fetch settings (which will override POP dates if settings exist)
        const settingsResponse = await fetch(`/api/pops/${id}/settings`);
        
        if (!settingsResponse.ok) {
          // If 404, it just means no settings yet, which is fine
          if (settingsResponse.status !== 404) {
            throw new Error(`Failed to fetch settings: ${settingsResponse.statusText}`);
          }
          // Just return without setting any values from settings
          return;
        }
        
        const data = await settingsResponse.json();
        
        if (data.settings) {
          // Set dates from settings (these take precedence over POP dates)
          if (data.settings.defaultStartDate) {
            setStartDate(new Date(data.settings.defaultStartDate));
            setDatesPrefilled(false); // No longer considered prefilled from POP
          }
          
          if (data.settings.defaultEndDate) {
            setEndDate(new Date(data.settings.defaultEndDate));
            setDatesPrefilled(false); // No longer considered prefilled from POP
          }
          
          // Set other settings
          setIncludeTime(data.settings.includeTime || false);
          setVisibility(data.settings.visibility.toLowerCase() || 'public');
          setAllowSearch(data.settings.allowSearch);
          setNotifyOnClaim(data.settings.notifyOnClaim);
        }
      } catch (err) {
        console.error('Error fetching POP or settings:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchPopAndSettings();
    }
  }, [id]);

  // Handle save
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Prepare the data for the API
      const settingsData = {
        defaultStartDate: startDate ? startDate.toISOString() : null,
        defaultEndDate: endDate ? endDate.toISOString() : null,
        includeTime,
        visibility: visibility.charAt(0).toUpperCase() + visibility.slice(1),
        allowSearch,
        notifyOnClaim,
      };
      
      // Determine if we're creating or updating
      let method = 'POST'; // Default to creating new settings
      
      try {
        const existingResponse = await fetch(`/api/pops/${id}/settings`);
        // Only use PATCH if we successfully retrieved existing settings
        if (existingResponse.ok && existingResponse.status === 200) {
          const data = await existingResponse.json();
          if (data.settings) {
            method = 'PATCH';
          }
        }
      } catch (checkError) {
        console.error('Error checking existing settings:', checkError);
        // If we can't check, default to POST to create new settings
      }
      
      console.log(`Using ${method} method to save settings`);
      
      // Save to the API
      const response = await fetch(`/api/pops/${id}/settings`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // If we get a 404 with "Settings not found" when trying to PATCH,
        // retry with POST method
        if (response.status === 404 && method === 'PATCH' && 
            errorData.error === 'Settings not found') {
          console.log('Retrying with POST method');
          
          const retryResponse = await fetch(`/api/pops/${id}/settings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(settingsData),
          });
          
          if (!retryResponse.ok) {
            const retryErrorData = await retryResponse.json();
            throw new Error(retryErrorData.error || retryErrorData.message || 'Failed to save settings after retry');
          }
          
          // Show success message for the retry
          toast.success("POP settings saved successfully");
          
          // Navigate back to POP detail page
          router.push(`/pops/${id}`);
          return;
        }
        
        throw new Error(errorData.error || errorData.message || 'Failed to save settings');
      }
      
      // Show success message
      toast.success("POP settings saved successfully");
      
      // Navigate back to POP detail page
      router.push(`/pops/${id}`);
      
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          <p className="text-neutral-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/pops/${id}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to POP
            </Button>
          </Link>
        </div>

        {/* Use the shared tab navigation */}
        <div className="mb-8">
          <POPTabNav popId={id} />
        </div>

        <h2 className="text-2xl font-bold mb-6">POP Settings</h2>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
            <p className="font-medium text-red-800 mb-1">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid gap-6">
          {/* Claim Period Settings */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-emerald-600 mr-2" />
              Claim Period
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-neutral-600">
                Set the time window during which this POP can be claimed. If no dates are set, the
                POP can be claimed at any time.
              </p>

              {datesPrefilled && (
                <div className="bg-blue-50 p-3 rounded-md mb-2 text-sm text-blue-700">
                  These dates are pre-filled from the POP's event dates. You can modify them if needed.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Start Date</Label>
                  <DatePicker
                    date={startDate}
                    onChange={setStartDate}
                    className="mt-1"
                    placeholder="No start date"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Leave blank to make available immediately
                  </p>
                </div>

                <div>
                  <Label>End Date</Label>
                  <DatePicker
                    date={endDate}
                    onChange={setEndDate}
                    className="mt-1"
                    placeholder="No end date"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Leave blank for no expiration</p>
                </div>
              </div>

              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="includeTime"
                  checked={includeTime}
                  onChange={e => setIncludeTime(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="includeTime" className="ml-2 text-sm font-normal cursor-pointer">
                  Set specific times (not just dates)
                </Label>
              </div>

              {includeTime && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input id="startTime" type="time" className="mt-1" disabled={!startDate} />
                  </div>

                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input id="endTime" type="time" className="mt-1" disabled={!endDate} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <ExternalLink className="h-5 w-5 text-blue-600 mr-2" />
              Visibility
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="visibility">Public Visibility</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger id="visibility" className="mt-1">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public (visible to everyone)</SelectItem>
                    <SelectItem value="unlisted">Unlisted (only via direct link)</SelectItem>
                    <SelectItem value="private">Private (only for specific users)</SelectItem>
                  </SelectContent>
                </Select>

                <p className="text-xs text-neutral-500 mt-1">
                  {visibility === 'public' &&
                    'Your POP will be visible to anyone and appear in public listings.'}
                  {visibility === 'unlisted' &&
                    'Your POP will only be visible to people with the direct link.'}
                  {visibility === 'private' &&
                    'Your POP will only be visible to specific users you designate.'}
                </p>
              </div>

              {visibility !== 'private' && (
                <div className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    id="allowSearch"
                    checked={allowSearch}
                    onChange={e => setAllowSearch(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="allowSearch" className="ml-2 text-sm font-normal cursor-pointer">
                    Allow this POP to appear in search results
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Bell className="h-5 w-5 text-purple-600 mr-2" />
              Notifications
            </h2>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifyOnClaim"
                  checked={notifyOnClaim}
                  onChange={e => setNotifyOnClaim(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="notifyOnClaim" className="ml-2 text-sm font-normal cursor-pointer">
                  Notify me when someone claims this POP
                </Label>
              </div>
            </div>
          </div>

          {/* Disable POP Option */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              Disable POP
            </h2>

            <ToggleDisabledStatus 
              popId={id} 
              isDisabled={popStatus === 'Disabled'} 
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSave} 
            className="flex items-center gap-2"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

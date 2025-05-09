'use client';

import * as React from 'react';
import {
  CalendarIcon,
  Clock,
  Link,
  LockKeyhole,
  MapPin,
  User,
  Users,
  Building,
  Globe,
  PlusCircle,
  Trash,
  ExternalLink,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { LocationPicker } from './location-picker';

interface POAPConfigurationProps {
  className?: string;
}

export function POAPConfiguration({ className }: POAPConfigurationProps) {
  // Distribution state
  const [claimLinkAmount, setClaimLinkAmount] = React.useState<number>(0);
  const [secretWord, setSecretWord] = React.useState<string>('');
  const [secretAmount, setSecretAmount] = React.useState<number>(0);
  const [locationAmount, setLocationAmount] = React.useState<number>(0);
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = React.useState<{
    city: string;
    country: string;
  } | null>(null);

  // Attributes state
  const [eventLocation, setEventLocation] = React.useState<'physical' | 'online'>('physical');
  const [platform, setPlatform] = React.useState<string>('');
  const [artists, setArtists] = React.useState<Array<{ name: string; url: string }>>([
    { name: '', url: '' },
  ]);
  const [organization, setOrganization] = React.useState<{ name: string; url: string }>({
    name: '',
    url: '',
  });

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

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-neutral-200 shadow-sm p-6 md:p-8',
        className
      )}
    >
      <h2 className="text-xl font-bold mb-6 text-neutral-900">POAP Configuration</h2>

      <Accordion type="single" collapsible className="w-full">
        {/* Distribution Section */}
        <AccordionItem value="distribution" className="border-none">
          <AccordionTrigger className="py-4 bg-neutral-50 px-4 rounded-lg hover:no-underline hover:bg-neutral-100">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Distribution</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 px-4">
            <div className="space-y-6">
              {/* Claim Link */}
              <div className="p-4 border border-neutral-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <Link className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-medium">Claim Link</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="claimLinkAmount">Number of unique URLs to generate</Label>
                    <Input
                      id="claimLinkAmount"
                      type="number"
                      min="0"
                      value={claimLinkAmount || ''}
                      onChange={e => setClaimLinkAmount(parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Secret */}
              <div className="p-4 border border-neutral-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <LockKeyhole className="h-5 w-5 text-emerald-600 mr-2" />
                  <h3 className="font-medium">Secret Word</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="secretWord">Secret word for claiming</Label>
                    <Input
                      id="secretWord"
                      type="text"
                      value={secretWord}
                      onChange={e => setSecretWord(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="secretAmount">Amount</Label>
                    <Input
                      id="secretAmount"
                      type="number"
                      min="0"
                      value={secretAmount || ''}
                      onChange={e => setSecretAmount(parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <DatePicker date={startDate} onChange={setStartDate} className="mt-1" />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <DatePicker date={endDate} onChange={setEndDate} className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location-based claim */}
              <div className="p-4 border border-neutral-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <MapPin className="h-5 w-5 text-orange-600 mr-2" />
                  <h3 className="font-medium">Location-based Claim</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Select Location</Label>
                    <LocationPicker
                      onSelectLocation={location => setSelectedLocation(location)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="locationAmount">Amount</Label>
                    <Input
                      id="locationAmount"
                      type="number"
                      min="0"
                      value={locationAmount || ''}
                      onChange={e => setLocationAmount(parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <DatePicker date={startDate} onChange={setStartDate} className="mt-1" />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <DatePicker date={endDate} onChange={setEndDate} className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Attributes Section */}
        <AccordionItem value="attributes" className="border-none mt-4">
          <AccordionTrigger className="py-4 bg-neutral-50 px-4 rounded-lg hover:no-underline hover:bg-neutral-100">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              <span>Attributes</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 px-4">
            <div className="space-y-6">
              {/* Event Location/Platform */}
              <div className="p-4 border border-neutral-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <Globe className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="font-medium">Event Location</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="eventType">Event Type</Label>
                    <Select
                      value={eventLocation}
                      onValueChange={(value: 'physical' | 'online') => setEventLocation(value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physical">Physical Location</SelectItem>
                        <SelectItem value="online">Online Platform</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {eventLocation === 'physical' ? (
                    <div>
                      <Label>Location</Label>
                      <LocationPicker
                        onSelectLocation={location => setSelectedLocation(location)}
                        className="mt-1"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="platform">Platform</Label>
                      <Select value={platform} onValueChange={setPlatform}>
                        <SelectTrigger className="mt-1">
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
                      {platform === 'other' && (
                        <Input placeholder="Specify platform" className="mt-2" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Artists */}
              <div className="p-4 border border-neutral-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <User className="h-5 w-5 text-pink-600 mr-2" />
                  <h3 className="font-medium">Artist(s)</h3>
                </div>
                <div className="space-y-4">
                  {artists.map((artist, index) => (
                    <div key={index} className="space-y-3 p-3 bg-neutral-50 rounded-lg">
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium">Artist {index + 1}</h4>
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

              {/* Organization */}
              <div className="p-4 border border-neutral-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <Building className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-medium">Organization</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="orgName">Name</Label>
                    <Input
                      id="orgName"
                      value={organization.name}
                      onChange={e => setOrganization({ ...organization, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgUrl">URL</Label>
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
          </AccordionContent>
        </AccordionItem>

        {/* Settings Section */}
        <AccordionItem value="settings" className="border-none mt-4">
          <AccordionTrigger className="py-4 bg-neutral-50 px-4 rounded-lg hover:no-underline hover:bg-neutral-100">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              <span>Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 px-4">
            <div className="space-y-6">
              {/* Claim Period Settings */}
              <div className="p-4 border border-neutral-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <CalendarIcon className="h-5 w-5 text-emerald-600 mr-2" />
                  <h3 className="font-medium">Claim Period</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Default Start Date</Label>
                      <DatePicker date={startDate} onChange={setStartDate} className="mt-1" />
                    </div>
                    <div>
                      <Label>Default End Date</Label>
                      <DatePicker date={endDate} onChange={setEndDate} className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Visibility Settings */}
              <div className="p-4 border border-neutral-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <ExternalLink className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-medium">Visibility</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="visibility">Public Visibility</Label>
                    <Select defaultValue="public">
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public (visible to everyone)</SelectItem>
                        <SelectItem value="unlisted">Unlisted (only via direct link)</SelectItem>
                        <SelectItem value="private">Private (only for specific users)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end mt-8">
        <Button className="w-full sm:w-auto">Save Configuration</Button>
      </div>
    </div>
  );
}

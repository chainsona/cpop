'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { exportAsCSV, exportAsJSON } from '@/lib/export-utils';

type ExportDataFormat = 'json' | 'csv';

type ExportDataButtonProps = {
  data: Record<string, any>;
  filename?: string;
  defaultFormat?: ExportDataFormat;
};

export function ExportDataButton({
  data,
  filename = 'analytics-data',
  defaultFormat = 'json',
}: ExportDataButtonProps) {
  // Function to handle export based on format
  const handleExport = (format: ExportDataFormat) => {
    // If data is an object with arrays, we need to prepare it for CSV export
    const prepareDataForCSV = () => {
      const result: Record<string, any>[] = [];
      
      // Handle claim methods
      if (data.claimMethods && Array.isArray(data.claimMethods)) {
        data.claimMethods.forEach((method: any) => {
          result.push({
            type: 'claim_method',
            method: method.method,
            count: method.count,
            percentage: Math.round((method.count / data.totalClaims) * 100)
          });
        });
      }
      
      // Handle claims by day
      if (data.claimsByDay && Array.isArray(data.claimsByDay)) {
        data.claimsByDay.forEach((day: any) => {
          result.push({
            type: 'claim_by_day',
            date: day.date,
            count: day.count
          });
        });
      }
      
      // Add summary data
      result.push({
        type: 'summary',
        totalClaims: data.totalClaims,
        availableClaims: data.availableClaims,
        mostActiveDay: data.mostActiveDay?.date || 'None',
        mostActiveDayCount: data.mostActiveDay?.count || 0,
        topClaimMethod: data.topClaimMethod?.method || 'None',
        topClaimMethodCount: data.topClaimMethod?.count || 0,
        topClaimMethodPercentage: data.topClaimMethod?.percentage || 0
      });
      
      return result;
    };
    
    if (format === 'csv') {
      const csvData = prepareDataForCSV();
      exportAsCSV(csvData, filename);
    } else {
      exportAsJSON(data, filename);
    }
  };
  
  return (
    <div className="flex">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 rounded-r-none border-r-0 pl-3 pr-2.5"
        onClick={() => handleExport(defaultFormat)}
      >
        <Download className="h-4 w-4" />
        Export {defaultFormat.toUpperCase()}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-l-none px-2"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            className="gap-2"
            onClick={() => handleExport('json')}
          >
            <FileJson className="h-4 w-4" />
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="gap-2"
            onClick={() => handleExport('csv')}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 
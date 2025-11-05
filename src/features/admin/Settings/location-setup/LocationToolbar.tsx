'use client';

import { Download, Plus, Search, Upload } from 'lucide-react'; // <-- 1. Import new icons

import { Button } from '@/ui/Button';
import { Input } from '@/ui/input';

type Props = {
  onAdd: () => void;
  addLabel: string;
  searchPlaceholder: string;
};

export function LocationToolbar({ onAdd, addLabel, searchPlaceholder }: Props) {
  // --- Placeholder functions for the new buttons ---
  const handleImport = () => {
    console.log('Import clicked');
    // In a real app, this would trigger a file input click
  };

  const handleExport = () => {
    console.log('Export clicked');
    // In a real app, this would call your API to download the file
  };
  // --- End placeholder functions ---

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Left side: Search bar */}
      <div className="relative w-full max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>

      {/* --- THIS IS THE CHANGE --- */}
      {/* Right side: Button group */}
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Upload className="h-4 w-4" />}
          onClick={handleImport}
        >
          Import
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={handleExport}
        >
          Export
        </Button>
        <Button
          variant="solid"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={onAdd}
        >
          {addLabel}
        </Button>
      </div>
      {/* --- END OF CHANGE --- */}
    </div>
  );
}

'use client';

import { useState } from 'react';

import { StateDialog } from './LocationDialogs';
import { LocationPagination } from './LocationPagination';
import { LocationToolbar } from './LocationToolbar';
import { MoreHorizontal } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table';

type State = {
  id: string;
  name: string;
  country: string;
  status: 'active' | 'inactive';
};

// Dummy data for this component
const DUMMY_STATES: State[] = [
  { id: '1', name: 'Beirut', country: 'Lebanon', status: 'active' as const },
  { id: '2', name: 'Dubai', country: 'UAE', status: 'active' as const },
];

export function StatesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<State | null>(null);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: State) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <LocationToolbar
        onAdd={handleOpenAdd}
        addLabel="Add State"
        searchPlaceholder="Search states..."
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>State Name</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DUMMY_STATES.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.country}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    item.status === 'active'
                      ? 'bg-success/10 text-success'
                      : 'bg-muted/60 text-muted-foreground',
                  )}
                >
                  {item.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      justify="center"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenEdit(item)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <LocationPagination />
      <StateDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        item={editingItem}
      />
    </div>
  );
}

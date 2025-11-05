'use client';

import { useState } from 'react';

import { Button } from '@/ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';

type Status = 'active' | 'inactive';
type DialogProps<T> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: T | null;
};

// Reusable form field
function FormField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={id}>{label}</Label>
      <div className="col-span-3">{children}</div>
    </div>
  );
}

// --- Country Dialog ---
export function CountryDialog({
  open,
  onOpenChange,
  item,
}: DialogProps<{ name: string; code: string; status: Status }>) {
  const isEditMode = Boolean(item);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(isEditMode ? 'Editing Country' : 'Adding Country', { name, code, status });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Country' : 'Add Country'}</DialogTitle>
        </DialogHeader>
        <form
          id="country-form"
          onSubmit={handleSubmit}
          className="space-y-4 py-4"
        >
          <FormField
            id="name"
            label="Country Name"
          >
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </FormField>
          <FormField
            id="code"
            label="Country Code"
          >
            <Input
              id="code"
              value={code}
              onChange={e => setCode(e.target.value)}
            />
          </FormField>
          <FormField
            id="status"
            label="Status"
          >
            <Select
              value={status}
              onValueChange={(v: Status) => setStatus(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="country-form"
            variant="solid"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- State Dialog ---
export function StateDialog({
  open,
  onOpenChange,
  item,
}: DialogProps<{ name: string; country: string; status: Status }>) {
  const isEditMode = Boolean(item);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState<Status>('active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(isEditMode ? 'Editing State' : 'Adding State', { name, country, status });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit State' : 'Add State'}</DialogTitle>
        </DialogHeader>
        <form
          id="state-form"
          onSubmit={handleSubmit}
          className="space-y-4 py-4"
        >
          <FormField
            id="name"
            label="State Name"
          >
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </FormField>
          <FormField
            id="country"
            label="Country"
          >
            <Select
              value={country}
              onValueChange={setCountry}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country..." />
              </SelectTrigger>
              <SelectContent>
                {/* DUMMY DATA: Load this from your countries data */}
                <SelectItem value="LB">Lebanon</SelectItem>
                <SelectItem value="UAE">UAE</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            id="status"
            label="Status"
          >
            <Select
              value={status}
              onValueChange={(v: Status) => setStatus(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="state-form"
            variant="solid"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- City Dialog ---
export function CityDialog({
  open,
  onOpenChange,
  item,
}: DialogProps<{ name: string; state: string; status: Status }>) {
  const isEditMode = Boolean(item);
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [status, setStatus] = useState<Status>('active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(isEditMode ? 'Editing City' : 'Adding City', { name, state, status });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit City' : 'Add City'}</DialogTitle>
        </DialogHeader>
        <form
          id="city-form"
          onSubmit={handleSubmit}
          className="space-y-4 py-4"
        >
          <FormField
            id="name"
            label="City Name"
          >
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </FormField>
          <FormField
            id="state"
            label="State"
          >
            <Select
              value={state}
              onValueChange={setState}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state..." />
              </SelectTrigger>
              <SelectContent>
                {/* DUMMY DATA: Load this from your states data */}
                <SelectItem value="Beirut">Beirut (Lebanon)</SelectItem>
                <SelectItem value="Dubai">Dubai (UAE)</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            id="status"
            label="Status"
          >
            <Select
              value={status}
              onValueChange={(v: Status) => setStatus(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="city-form"
            variant="solid"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  City,
  Country,
  CreateCity,
  CreateCityDto,
  CreateCityOutputDto,
  CreateCountry,
  CreateCountryDto,
  CreateCountryOutputDto,
  CreateState,
  CreateStateDto,
  CreateStateOutputDto,
  State,
} from '@milemoto/types';
import { useForm, type FieldValues } from 'react-hook-form';

import {
  useCreateCity,
  useCreateCountry,
  useCreateState,
  useGetAllCountries,
  useGetAllStates,
  useUpdateCity,
  useUpdateCountry,
  useUpdateState,
} from '@/hooks/useLocationQueries';
import { Button } from '@/ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/dialog';
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormField as RHFFormField,
} from '@/ui/form';
import { Input } from '@/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';

type DialogProps<T> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: T | null;
};

// --- Country Dialog (This component is correct) ---
export function CountryDialog({ open, onOpenChange, item }: DialogProps<Country>) {
  const isEditMode = Boolean(item);

  const createMutation = useCreateCountry();
  const updateMutation = useUpdateCountry();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CreateCountryDto, FieldValues, CreateCountryOutputDto>({
    resolver: zodResolver(CreateCountry),
    defaultValues: {
      name: '',
      code: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        code: item.code,
        status: item.status,
      });
    } else {
      form.reset({
        name: '',
        code: '',
        status: 'active',
      });
    }
  }, [item, form]);

  const handleSubmit = (data: CreateCountryOutputDto) => {
    if (isEditMode && item) {
      updateMutation.mutate({ id: item.id, ...data }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
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

        <Form {...form}>
          <form
            id="country-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-4"
          >
            <RHFFormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Country Name</FormLabel>
                  <FormControl className="col-span-3">
                    <Input
                      {...field}
                      placeholder="e.g., Lebanon"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage className="col-span-4" />
                </FormItem>
              )}
            />

            <RHFFormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Country Code</FormLabel>
                  <FormControl className="col-span-3">
                    <Input
                      {...field}
                      placeholder="e.g., LB"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage className="col-span-4" />
                </FormItem>
              )}
            />

            <RHFFormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending}
                  >
                    <FormControl className="col-span-3">
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-span-4" />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="country-form"
            variant="solid"
            isLoading={isPending}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- State Dialog (Refactored) ---
export function StateDialog({ open, onOpenChange, item }: DialogProps<State>) {
  const isEditMode = Boolean(item);
  const createMutation = useCreateState();
  const updateMutation = useUpdateState();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const { data: countriesData, isLoading: isLoadingCountries } = useGetAllCountries();
  const countries = countriesData?.items || [];

  const form = useForm<CreateStateDto, FieldValues, CreateStateOutputDto>({
    resolver: zodResolver(CreateState),
    defaultValues: {
      name: '',
      country_id: undefined,
      status: 'active',
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        country_id: item.country_id,
        status: item.status,
      });
    } else {
      form.reset({
        name: '',
        country_id: undefined,
        status: 'active',
      });
    }
  }, [item, form]);

  const handleSubmit = (data: CreateStateOutputDto) => {
    if (isEditMode && item) {
      updateMutation.mutate({ id: item.id, ...data }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
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

        <Form {...form}>
          <form
            id="state-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-4"
          >
            <RHFFormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">State Name</FormLabel>
                  <FormControl className="col-span-3">
                    <Input
                      {...field}
                      placeholder="e.g., Beirut"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage className="col-span-4" />
                </FormItem>
              )}
            />

            <RHFFormField
              control={form.control}
              name="country_id"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Country</FormLabel>
                  <Select
                    // --- THIS IS FIX #1 ---
                    onValueChange={value => field.onChange(Number(value))}
                    value={String(field.value ?? '')}
                    disabled={isPending || isLoadingCountries}
                  >
                    <FormControl className="col-span-3">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem
                          key={country.id}
                          value={String(country.id)}
                        >
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-span-4" />
                </FormItem>
              )}
            />

            <RHFFormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending}
                  >
                    <FormControl className="col-span-3">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-span-4" />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="state-form"
            variant="solid"
            isLoading={isPending}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- City Dialog (Refactored) ---
export function CityDialog({ open, onOpenChange, item }: DialogProps<City>) {
  const isEditMode = Boolean(item);
  const createMutation = useCreateCity();
  const updateMutation = useUpdateCity();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const { data: statesData, isLoading: isLoadingStates } = useGetAllStates();
  const states = statesData?.items || [];

  const form = useForm<CreateCityDto, FieldValues, CreateCityOutputDto>({
    resolver: zodResolver(CreateCity),
    defaultValues: {
      name: '',
      state_id: undefined,
      status: 'active',
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        state_id: item.state_id,
        status: item.status,
      });
    } else {
      form.reset({
        name: '',
        state_id: undefined,
        status: 'active',
      });
    }
  }, [item, form]);

  const handleSubmit = (data: CreateCityOutputDto) => {
    if (isEditMode && item) {
      updateMutation.mutate({ id: item.id, ...data }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
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
        <Form {...form}>
          <form
            id="city-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-4"
          >
            <RHFFormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">City Name</FormLabel>
                  <FormControl className="col-span-3">
                    <Input
                      {...field}
                      placeholder="e.g., Sin el Fil"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage className="col-span-4" />
                </FormItem>
              )}
            />

            <RHFFormField
              control={form.control}
              name="state_id"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">State</FormLabel>
                  <Select
                    // --- THIS IS FIX #2 ---
                    onValueChange={value => field.onChange(Number(value))}
                    value={String(field.value ?? '')}
                    disabled={isPending || isLoadingStates}
                  >
                    <FormControl className="col-span-3">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a state..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {states.map(state => (
                        <SelectItem
                          key={state.id}
                          value={String(state.id)}
                        >
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-span-4" />
                </FormItem>
              )}
            />

            <RHFFormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending}
                  >
                    <FormControl className="col-span-3">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-span-4" />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="city-form"
            variant="solid"
            isLoading={isPending}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

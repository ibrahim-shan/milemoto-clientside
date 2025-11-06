// src/hooks/useLocationQueries.ts
import type {
  City,
  Country,
  CountryDropdownItem,
  CreateCityOutputDto,
  CreateCountryOutputDto,
  CreateStateOutputDto,
  // ---
  PaginatedResponse,
  State,
  StateDropdownItem,
  UpdateCityDto,
  UpdateCountryDto,
  UpdateStateDto,
} from '@milemoto/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { del, get, post } from '@/lib/api';
import { getAccessToken } from '@/lib/authStorage';
import { useToast } from '@/ui/use-toast';

function authz(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const t = getAccessToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// === Query Keys ===
const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  list: (type: string, params: unknown) => [...locationKeys.lists(), type, params] as const,
  dropdowns: () => [...locationKeys.all, 'dropdown'] as const,
  dropdown: (type: string) => [...locationKeys.dropdowns(), type] as const,
};

// === API Functions ===
const API_BASE = '/admin/locations';

// -- Countries --
const listCountries = (params: { search: string; page: number; limit: number }) => {
  const query = new URLSearchParams({
    search: params.search,
    page: String(params.page),
    limit: String(params.limit),
  });
  return get<PaginatedResponse<Country>>(`${API_BASE}/countries?${query.toString()}`, {
    headers: authz(),
  });
};
const listAllCountries = () =>
  get<{ items: CountryDropdownItem[] }>(`${API_BASE}/countries/all`, {
    headers: authz(),
  });
// --- FIX: Add headers and use correct DTO ---
const createCountry = (data: CreateCountryOutputDto) =>
  post<Country>(`${API_BASE}/countries`, data, { headers: authz() });
const updateCountry = ({ id, ...data }: UpdateCountryDto & { id: number }) =>
  post<Country>(`${API_BASE}/countries/${id}`, data, { headers: authz() });
const deleteCountry = (id: number) =>
  del<void>(`${API_BASE}/countries/${id}`, { headers: authz() });

// -- States --
const listStates = (params: { search: string; page: number; limit: number }) => {
  const query = new URLSearchParams({
    search: params.search,
    page: String(params.page),
    limit: String(params.limit),
  });
  return get<PaginatedResponse<State>>(`${API_BASE}/states?${query.toString()}`, {
    headers: authz(),
  });
};
const listAllStates = () =>
  get<{ items: StateDropdownItem[] }>(`${API_BASE}/states/all`, {
    headers: authz(),
  });
// --- FIX: Add headers and use correct DTO ---
const createState = (data: CreateStateOutputDto) =>
  post<State>(`${API_BASE}/states`, data, { headers: authz() });
const updateState = ({ id, ...data }: UpdateStateDto & { id: number }) =>
  post<State>(`${API_BASE}/states/${id}`, data, { headers: authz() });
const deleteState = (id: number) => del<void>(`${API_BASE}/states/${id}`, { headers: authz() });

// -- Cities --
const listCities = (params: { search: string; page: number; limit: number }) => {
  const query = new URLSearchParams({
    search: params.search,
    page: String(params.page),
    limit: String(params.limit),
  });
  return get<PaginatedResponse<City>>(`${API_BASE}/cities?${query.toString()}`, {
    headers: authz(),
  });
};
// --- FIX: Add headers and use correct DTO ---
const createCity = (data: CreateCityOutputDto) =>
  post<City>(`${API_BASE}/cities`, data, { headers: authz() });
const updateCity = ({ id, ...data }: UpdateCityDto & { id: number }) =>
  post<City>(`${API_BASE}/cities/${id}`, data, { headers: authz() });
const deleteCity = (id: number) => del<void>(`${API_BASE}/cities/${id}`, { headers: authz() });

// === React Query Hooks ===

// --- Countries ---
export const useGetCountries = (params: { search: string; page: number; limit: number }) => {
  return useQuery({
    queryKey: locationKeys.list('countries', params),
    queryFn: () => listCountries(params),
    placeholderData: previousData => previousData,
    retry: false,
  });
};

export const useGetAllCountries = () => {
  return useQuery({
    queryKey: locationKeys.dropdown('countries'),
    queryFn: listAllCountries,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateCountry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    // --- FIX: mutationFn receives OutputDto from form ---
    mutationFn: (data: CreateCountryOutputDto) => createCountry(data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Country created successfully.' });
      return queryClient.invalidateQueries({
        queryKey: locationKeys.lists(),
      });
    },
    onError: err => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });
};

export const useUpdateCountry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    // --- FIX: This function signature matches what we call in the dialog ---
    mutationFn: (data: UpdateCountryDto & { id: number }) => updateCountry(data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Country updated successfully.' });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: locationKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: locationKeys.dropdowns() }),
      ]);
    },
    onError: err => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });
};

export const useDeleteCountry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    // --- FIX: This signature is simple and correct ---
    mutationFn: (id: number) => deleteCountry(id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Country deleted.' });
      return queryClient.invalidateQueries({ queryKey: locationKeys.all });
    },
    onError: (err: Error & { code?: string }) => {
      const description = err.code === 'DeleteFailed' ? err.message : 'An error occurred.';
      toast({ variant: 'destructive', title: 'Error', description });
    },
  });
};

// --- States ---
export const useGetStates = (params: { search: string; page: number; limit: number }) => {
  return useQuery({
    queryKey: locationKeys.list('states', params),
    queryFn: () => listStates(params),
    placeholderData: previousData => previousData,
    retry: false,
  });
};

export const useGetAllStates = () => {
  return useQuery({
    queryKey: locationKeys.dropdown('states'),
    queryFn: listAllStates,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateState = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    // --- FIX: mutationFn receives OutputDto from form ---
    mutationFn: (data: CreateStateOutputDto) => createState(data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'State created successfully.' });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: locationKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: locationKeys.dropdown('states'),
        }),
      ]);
    },
    onError: err => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });
};

export const useUpdateState = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    // --- FIX: This function signature matches what we call in the dialog ---
    mutationFn: (data: UpdateStateDto & { id: number }) => updateState(data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'State updated successfully.' });
      return queryClient.invalidateQueries({ queryKey: locationKeys.all });
    },
    onError: err => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });
};

export const useDeleteState = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: number) => deleteState(id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'State deleted.' });
      return queryClient.invalidateQueries({ queryKey: locationKeys.all });
    },
    onError: (err: Error & { code?: string }) => {
      const description = err.code === 'DeleteFailed' ? err.message : 'An error occurred.';
      toast({ variant: 'destructive', title: 'Error', description });
    },
  });
};

// --- Cities ---
export const useGetCities = (params: { search: string; page: number; limit: number }) => {
  return useQuery({
    queryKey: locationKeys.list('cities', params),
    queryFn: () => listCities(params),
    placeholderData: previousData => previousData,
    retry: false,
  });
};

export const useCreateCity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    // --- FIX: mutationFn receives OutputDto from form ---
    mutationFn: (data: CreateCityOutputDto) => createCity(data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'City created successfully.' });
      return queryClient.invalidateQueries({
        queryKey: locationKeys.lists(),
      });
    },
    onError: err => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });
};

export const useUpdateCity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    // --- FIX: This function signature matches what we call in the dialog ---
    mutationFn: (data: UpdateCityDto & { id: number }) => updateCity(data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'City updated successfully.' });
      return queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
    onError: err => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });
};

export const useDeleteCity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: number) => deleteCity(id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'City deleted.' });
      return queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
    onError: err => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });
};

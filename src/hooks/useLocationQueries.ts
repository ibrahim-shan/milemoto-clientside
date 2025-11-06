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
import { toast } from 'sonner';

import { del, get, post } from '@/lib/api';
import { getAccessToken } from '@/lib/authStorage';

type PaginatedSnapshot<T> = Array<{
  queryKey: readonly unknown[];
  data: PaginatedResponse<T> | undefined;
}>;

type DropdownSnapshot<T> = Array<{
  queryKey: readonly unknown[];
  data: { items: T[] } | undefined;
}>;

type DeleteCountryContext = {
  paginated: PaginatedSnapshot<Country>;
  dropdown: DropdownSnapshot<CountryDropdownItem>;
};

type DeleteStateContext = {
  paginated: PaginatedSnapshot<State>;
  dropdown: DropdownSnapshot<StateDropdownItem>;
};

type DeleteCityContext = {
  paginated: PaginatedSnapshot<City>;
};

function sameId(a: unknown, b: unknown) {
  const numA = Number(a);
  const numB = Number(b);
  return !Number.isNaN(numA) && !Number.isNaN(numB) && numA === numB;
}

function removeFromPaginatedCache<T extends { id: number | string }>(
  queryClient: ReturnType<typeof useQueryClient>,
  prefix: readonly unknown[],
  id: number,
): PaginatedSnapshot<T> {
  const snapshots = queryClient
    .getQueriesData<PaginatedResponse<T>>({ queryKey: prefix })
    .map(([queryKey, data]) => ({ queryKey, data }));

  snapshots.forEach(({ queryKey, data }) => {
    if (!data) return;
    if (!data.items.some((item: T) => sameId(item.id, id))) return;
    queryClient.setQueryData<PaginatedResponse<T>>(queryKey, {
      ...data,
      items: data.items.filter((item: T) => !sameId(item.id, id)),
      totalCount: Math.max(0, data.totalCount - 1),
    });
  });

  return snapshots;
}

function removeFromDropdownCache<T extends { id: number | string }>(
  queryClient: ReturnType<typeof useQueryClient>,
  prefix: readonly unknown[],
  id: number,
): DropdownSnapshot<T> {
  const snapshots = queryClient
    .getQueriesData<{ items: T[] }>({ queryKey: prefix })
    .map(([queryKey, data]) => ({ queryKey, data }));

  snapshots.forEach(({ queryKey, data }) => {
    if (!data) return;
    if (!data.items.some((item: T) => sameId(item.id, id))) return;
    queryClient.setQueryData(queryKey, {
      ...data,
      items: data.items.filter((item: T) => !sameId(item.id, id)),
    });
  });

  return snapshots;
}

function restoreSnapshots<T>(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshots: PaginatedSnapshot<T> | DropdownSnapshot<T> | undefined,
) {
  if (!snapshots) return;
  snapshots.forEach(({ queryKey, data }) => {
    queryClient.setQueryData(queryKey, data);
  });
}

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
const listAllCountries = (includeInactive = false) => {
  const query = includeInactive ? '?includeInactive=1' : '';
  return get<{ items: CountryDropdownItem[] }>(`${API_BASE}/countries/all${query}`, {
    headers: authz(),
  });
};
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

export const useGetAllCountries = (includeInactive = false) => {
  return useQuery({
    queryKey: [...locationKeys.dropdown('countries'), includeInactive ? 'all' : 'active'],
    queryFn: () => listAllCountries(includeInactive),
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateCountry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // --- FIX: mutationFn receives OutputDto from form ---
    mutationFn: async (data: CreateCountryOutputDto) => {
      const promise = createCountry(data);
      toast.promise(promise, {
        loading: 'Creating country...',
        success: 'Country created successfully.',
        error: (err: Error & { code?: string; message?: string }) =>
          err.code === 'DuplicateCountry'
            ? 'Country code already exists.'
            : err.message || 'Failed to create country.',
      });
      return await promise;
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: locationKeys.lists(), type: 'active' }),
        queryClient.invalidateQueries({ queryKey: locationKeys.dropdowns(), exact: false }),
        queryClient.invalidateQueries({
          queryKey: locationKeys.dropdown('countries'),
          exact: false,
        }),
      ]),
  });
};

export const useUpdateCountry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // --- FIX: This function signature matches what we call in the dialog ---
    mutationFn: async (data: UpdateCountryDto & { id: number }) => {
      const promise = updateCountry(data);
      toast.promise(promise, {
        loading: 'Updating country...',
        success: 'Country updated successfully.',
        error: (err: Error & { code?: string; message?: string }) =>
          err.code === 'DuplicateCountry'
            ? 'Country code already exists.'
            : err.message || 'Failed to update country.',
      });
      return await promise;
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: locationKeys.lists(), type: 'active' }),
        queryClient.invalidateQueries({ queryKey: locationKeys.dropdowns(), exact: false }),
        queryClient.invalidateQueries({
          queryKey: locationKeys.dropdown('countries'),
          exact: false,
        }),
      ]),
  });
};

export const useDeleteCountry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // --- FIX: This signature is simple and correct ---
    mutationFn: async (id: number) => {
      const promise = deleteCountry(id);
      toast.promise(promise, {
        loading: 'Deleting country...',
        success: 'Country deleted.',
        error: (err: Error & { code?: string; message?: string }) =>
          err.code === 'DeleteFailed'
            ? err.message || 'Country cannot be deleted.'
            : err.message || 'Failed to delete country.',
      });
      return await promise;
    },
    onMutate: async (id: number): Promise<DeleteCountryContext> => {
      await queryClient.cancelQueries({ queryKey: [...locationKeys.lists(), 'countries'] });
      const paginated = removeFromPaginatedCache<Country>(
        queryClient,
        [...locationKeys.lists(), 'countries'],
        id,
      );
      const dropdown = removeFromDropdownCache<CountryDropdownItem>(
        queryClient,
        locationKeys.dropdown('countries'),
        id,
      );
      return { paginated, dropdown };
    },
    onError: (_err, _id, context) => {
      const ctx = context as DeleteCountryContext | undefined;
      if (!ctx) return;
      restoreSnapshots(queryClient, ctx.paginated);
      restoreSnapshots(queryClient, ctx.dropdown);
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: locationKeys.all, type: 'active' }),
        queryClient.invalidateQueries({ queryKey: locationKeys.dropdowns(), exact: false }),
        queryClient.invalidateQueries({
          queryKey: locationKeys.dropdown('countries'),
          exact: false,
        }),
      ]),
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
  return useMutation({
    // --- FIX: mutationFn receives OutputDto from form ---
    mutationFn: async (data: CreateStateOutputDto) => {
      const promise = createState(data);
      toast.promise(promise, {
        loading: 'Creating state...',
        success: 'State created successfully.',
        error: (err: Error & { code?: string; message?: string }) => {
          if (err.code === 'DuplicateState') {
            return 'A state with this name already exists for the selected country.';
          }
          if (err.code === 'ParentInactive') {
            return err.message || 'Cannot activate a state while its country is inactive.';
          }
          return err.message || 'Failed to create state.';
        },
      });
      return await promise;
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: locationKeys.lists(), type: 'active' }),
        queryClient.invalidateQueries({
          queryKey: locationKeys.dropdown('states'),
          type: 'active',
        }),
      ]),
  });
};

export const useUpdateState = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // --- FIX: This function signature matches what we call in the dialog ---
    mutationFn: async (data: UpdateStateDto & { id: number }) => {
      const promise = updateState(data);
      toast.promise(promise, {
        loading: 'Updating state...',
        success: 'State updated successfully.',
        error: (err: Error & { code?: string; message?: string }) => {
          if (err.code === 'DuplicateState') {
            return 'A state with this name already exists for the selected country.';
          }
          if (err.code === 'ParentInactive') {
            return err.message || 'Cannot activate a state while its country is inactive.';
          }
          return err.message || 'Failed to update state.';
        },
      });
      return await promise;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: locationKeys.all, type: 'active' }),
  });
};

export const useDeleteState = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const promise = deleteState(id);
      toast.promise(promise, {
        loading: 'Deleting state...',
        success: 'State deleted.',
        error: (err: Error & { code?: string; message?: string }) =>
          err.code === 'DeleteFailed'
            ? err.message || 'State cannot be deleted.'
            : err.message || 'Failed to delete state.',
      });
      return await promise;
    },
    onMutate: async (id: number): Promise<DeleteStateContext> => {
      await queryClient.cancelQueries({ queryKey: [...locationKeys.lists(), 'states'] });
      const paginated = removeFromPaginatedCache<State>(
        queryClient,
        [...locationKeys.lists(), 'states'],
        id,
      );
      const dropdown = removeFromDropdownCache<StateDropdownItem>(
        queryClient,
        locationKeys.dropdown('states'),
        id,
      );
      return { paginated, dropdown };
    },
    onError: (_err, _id, context) => {
      const ctx = context as DeleteStateContext | undefined;
      if (!ctx) return;
      restoreSnapshots(queryClient, ctx.paginated);
      restoreSnapshots(queryClient, ctx.dropdown);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: locationKeys.all, type: 'active' }),
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
  return useMutation({
    // --- FIX: mutationFn receives OutputDto from form ---
    mutationFn: async (data: CreateCityOutputDto) => {
      const promise = createCity(data);
      toast.promise(promise, {
        loading: 'Creating city...',
        success: 'City created successfully.',
        error: (err: Error & { code?: string; message?: string }) => {
          if (err.code === 'DuplicateCity') {
            return 'A city with this name already exists for the selected state.';
          }
          if (err.code === 'ParentInactive') {
            return err.message || 'Cannot activate a city while its state or country is inactive.';
          }
          return err.message || 'Failed to create city.';
        },
      });
      return await promise;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: locationKeys.lists(), type: 'active' }),
  });
};

export const useUpdateCity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // --- FIX: This function signature matches what we call in the dialog ---
    mutationFn: async (data: UpdateCityDto & { id: number }) => {
      const promise = updateCity(data);
      toast.promise(promise, {
        loading: 'Updating city...',
        success: 'City updated successfully.',
        error: (err: Error & { code?: string; message?: string }) => {
          if (err.code === 'DuplicateCity') {
            return 'A city with this name already exists for the selected state.';
          }
          if (err.code === 'ParentInactive') {
            return err.message || 'Cannot activate a city while its state or country is inactive.';
          }
          return err.message || 'Failed to update city.';
        },
      });
      return await promise;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: locationKeys.lists(), type: 'active' }),
  });
};

export const useDeleteCity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const promise = deleteCity(id);
      toast.promise(promise, {
        loading: 'Deleting city...',
        success: 'City deleted.',
        error: (err: Error & { code?: string; message?: string }) =>
          err.code === 'DeleteFailed'
            ? err.message || 'City cannot be deleted.'
            : err.message || 'Failed to delete city.',
      });
      return await promise;
    },
    onMutate: async (id: number): Promise<DeleteCityContext> => {
      await queryClient.cancelQueries({ queryKey: [...locationKeys.lists(), 'cities'] });
      const paginated = removeFromPaginatedCache<City>(
        queryClient,
        [...locationKeys.lists(), 'cities'],
        id,
      );
      return { paginated };
    },
    onError: (_err, _id, context) => {
      const ctx = context as DeleteCityContext | undefined;
      if (!ctx) return;
      restoreSnapshots(queryClient, ctx.paginated);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: locationKeys.lists(), type: 'active' }),
  });
};

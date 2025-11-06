import type { CompanyProfileDto, CompanyProfileInputDto } from '@milemoto/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { get, put } from '@/lib/api';
import { getAccessToken } from '@/lib/authStorage';

const COMPANY_API_BASE = '/admin/company';

function authHeaders() {
  if (typeof window === 'undefined') return {};
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const fetchCompanyProfile = () =>
  get<CompanyProfileDto | null>(COMPANY_API_BASE, { headers: authHeaders() });

const updateCompanyProfile = (payload: CompanyProfileInputDto) =>
  put<CompanyProfileDto>(COMPANY_API_BASE, payload, { headers: authHeaders() });

export const useGetCompanyProfile = () =>
  useQuery({
    queryKey: ['companyProfile'],
    queryFn: fetchCompanyProfile,
  });

export const useUpdateCompanyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CompanyProfileInputDto) => {
      const promise = updateCompanyProfile(payload);
      toast.promise(promise, {
        loading: 'Saving company details...',
        success: 'Company details updated.',
        error: (err: Error & { message?: string }) =>
          err.message || 'Failed to update company details.',
      });
      return await promise;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companyProfile'] }),
  });
};

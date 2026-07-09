import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export function useParentalControlServicesCatalog() {
  return useQuery({ queryKey: ['catalog', 'parental-control', 'services'], queryFn: api.getParentalControlServicesCatalog });
}

export function useParentalControlCategoriesCatalog() {
  return useQuery({ queryKey: ['catalog', 'parental-control', 'categories'], queryFn: api.getParentalControlCategoriesCatalog });
}

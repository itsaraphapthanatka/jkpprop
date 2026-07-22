'use client';

import { useSearchParams } from 'next/navigation';
import { Pagination } from '@jkp/ui';
import { useRouter, usePathname } from '@/i18n/navigation';

/**
 * URL-driven pagination. Preserves every other query param and only rewrites
 * `page` (dropped when 1, since that is the canonical default).
 */
export function ListingPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const onPageChange = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete('page');
    else params.set('page', String(next));
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />;
}

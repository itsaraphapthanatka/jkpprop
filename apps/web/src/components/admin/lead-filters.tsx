'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextInput,
} from '@jkp/ui';
import { LEAD_STATUS, SOURCE_CHANNEL } from '@jkp/domain';
import { LEAD_STATUS_LABEL, SOURCE_LABEL } from '@/data/admin/labels';
import type { Agent } from '@/data/admin/leads';

/**
 * Leads index filter bar (URL-driven). Admin is NOT locale-prefixed, so it uses
 * plain next/navigation. Each control writes to the query string; the Server
 * Component re-reads searchParams and re-queries getLeads(). Radix Select cannot
 * use an empty item value, so "ทั้งหมด" is the ALL sentinel that clears the param.
 */
const ALL = 'all';

interface FilterOption {
  value: string;
  label: string;
}

function FilterSelect({
  label,
  value,
  allLabel,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  allLabel: string;
  options: FilterOption[];
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-content-primary">{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function LeadFilters({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = searchParams.get('status') ?? ALL;
  const agentId = searchParams.get('agentId') ?? ALL;
  const source = searchParams.get('source') ?? ALL;

  const [keyword, setKeyword] = useState(searchParams.get('q') ?? '');

  // Keep the keyword field in sync when the URL changes externally (back/forward).
  useEffect(() => {
    setKeyword(searchParams.get('q') ?? '');
  }, [searchParams]);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === ALL) params.delete(key);
      else params.set(key, value);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Debounce keyword writes so typing does not spam the URL / re-query.
  useEffect(() => {
    const current = searchParams.get('q') ?? '';
    if (keyword === current) return;
    const timer = setTimeout(() => setParam('q', keyword), 350);
    return () => clearTimeout(timer);
  }, [keyword, searchParams, setParam]);

  return (
    <div className="grid gap-3 rounded-xl border border-line bg-surface-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <FilterSelect
        label="สถานะ"
        value={status}
        allLabel="ทั้งหมด"
        options={LEAD_STATUS.map((value) => ({ value, label: LEAD_STATUS_LABEL[value] }))}
        onValueChange={(value) => setParam('status', value)}
      />
      <FilterSelect
        label="เจ้าหน้าที่"
        value={agentId}
        allLabel="ทั้งหมด"
        options={agents.map((agent) => ({ value: agent.id, label: agent.name }))}
        onValueChange={(value) => setParam('agentId', value)}
      />
      <FilterSelect
        label="แหล่งที่มา"
        value={source}
        allLabel="ทั้งหมด"
        options={SOURCE_CHANNEL.map((value) => ({ value, label: SOURCE_LABEL[value] }))}
        onValueChange={(value) => setParam('source', value)}
      />
      <TextInput
        label="ค้นหา"
        placeholder="รหัส ชื่อผู้ติดต่อ หรือบริษัท"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        leadingIcon={<Search className="size-4" strokeWidth={1.7} />}
      />
    </div>
  );
}

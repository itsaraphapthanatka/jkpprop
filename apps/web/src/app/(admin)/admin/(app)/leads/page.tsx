import Link from 'next/link';
import type { Metadata } from 'next';
import {
  EmptyState,
  StatusChip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@jkp/ui';
import { formatDate, type LeadStatus, type SourceChannel } from '@jkp/domain';
import { agentName, getAgents, getLeads, type LeadFilters } from '@/data/admin/leads';
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE, SOURCE_LABEL } from '@/data/admin/labels';
import { LeadFilters as LeadFiltersBar } from '@/components/admin/lead-filters';

export const metadata: Metadata = { title: 'Leads' };

/** searchParams values may be arrays; take the first meaningful string. */
function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : undefined;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters: LeadFilters = {
    status: (first(sp.status) as LeadStatus | undefined) ?? null,
    agentId: first(sp.agentId) ?? null,
    source: (first(sp.source) as SourceChannel | undefined) ?? null,
    q: first(sp.q) ?? null,
  };

  const [leads, agents] = await Promise.all([getLeads(filters), getAgents()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-content-primary">Leads</h1>
        <p className="mt-1 text-sm text-content-muted">
          ฝ่ายขายจะเห็นเฉพาะ Lead ที่ได้รับมอบหมายของตน (FR-CRM-04) — ในเดโมนี้แสดงทั้งหมด
        </p>
      </div>

      <LeadFiltersBar agents={agents} />

      {leads.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface-card">
          <EmptyState
            variant="data"
            title="ไม่พบ Lead"
            description="ลองปรับตัวกรองหรือคำค้นหาใหม่"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-surface-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ผู้ติดต่อ</TableHead>
                <TableHead>บริษัท</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>แหล่งที่มา</TableHead>
                <TableHead>เจ้าหน้าที่</TableHead>
                <TableHead>อัปเดตล่าสุด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="font-mono text-sm font-medium text-brand-600 hover:underline"
                    >
                      {lead.code}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">{lead.contactName}</TableCell>
                  <TableCell className="text-content-secondary">{lead.company ?? '—'}</TableCell>
                  <TableCell>
                    <StatusChip tone={LEAD_STATUS_TONE[lead.status]}>
                      {LEAD_STATUS_LABEL[lead.status]}
                    </StatusChip>
                  </TableCell>
                  <TableCell className="text-content-secondary">
                    {SOURCE_LABEL[lead.source]}
                  </TableCell>
                  <TableCell className="text-content-secondary">
                    {agentName(lead.assignedAgentId) ?? '— ยังไม่มอบหมาย'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-content-secondary">
                    {formatDate(lead.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

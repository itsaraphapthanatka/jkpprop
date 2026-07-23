import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronLeft, Mail, Phone } from 'lucide-react';
import {
  AlertBanner,
  Badge,
  DefinitionList,
  type DefinitionListItem,
} from '@jkp/ui';
import { formatArea, formatDate, formatMoney } from '@jkp/domain';
import { getAgents, getLead, type TaskPriority } from '@/data/admin/leads';
import {
  CANCELLED_FIELD_LABEL,
  OPERATION_LABEL,
  REQUIREMENT_STATUS_LABEL,
  SOURCE_LABEL,
} from '@/data/admin/labels';
import { AddNoteBox } from '@/components/admin/add-note-box';
import { AddTaskBox } from '@/components/admin/add-task-box';
import { AssignControl } from '@/components/admin/assign-control';
import { CancelRequirementButton } from '@/components/admin/cancel-requirement-dialog';
import { LeadStatusControl } from '@/components/admin/lead-status-control';

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'ต่ำ',
  medium: 'กลาง',
  high: 'สูง',
};

const PRIORITY_VARIANT: Record<TaskPriority, 'neutral' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lead = await getLead(id);
  return { title: lead ? lead.code : 'Lead' };
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lead, agents] = await Promise.all([getLead(id), getAgents()]);

  if (!lead) notFound();

  const { requirement, companyInfo, contacts, linked } = lead;

  const companyItems: DefinitionListItem[] = companyInfo
    ? [
        { term: 'ชื่อบริษัท', definition: companyInfo.name },
        { term: 'ประเทศ', definition: companyInfo.country ?? null },
        { term: 'ประเภทธุรกิจ', definition: companyInfo.businessType ?? null },
        { term: 'เว็บไซต์', definition: companyInfo.website ?? null },
      ]
    : [];

  let requirementItems: DefinitionListItem[] = [];
  if (requirement) {
    const hasSize = requirement.sizeMin !== null || requirement.sizeMax !== null;
    const sizeText = hasSize
      ? `${formatArea(requirement.sizeMin) ?? '?'} – ${formatArea(requirement.sizeMax) ?? '?'} ตร.ม.`
      : null;

    const hasBudget = requirement.rentMin !== null || requirement.rentMax !== null;
    const budgetText = hasBudget
      ? `${formatMoney(requirement.rentMin) ?? '—'} – ${formatMoney(requirement.rentMax) ?? '—'} /เดือน`
      : null;

    requirementItems = [
      {
        term: 'ประเภทการใช้งาน',
        definition: requirement.operationType ? OPERATION_LABEL[requirement.operationType] : null,
      },
      {
        term: 'ต้องมีใบอนุญาตโรงงาน',
        definition: requirement.needFactoryLicense ? 'ต้องการ' : 'ไม่ต้องการ',
      },
      { term: 'ขนาดพื้นที่', definition: sizeText },
      { term: 'งบประมาณค่าเช่า', definition: budgetText },
      {
        term: 'กำหนดเข้าใช้',
        definition: requirement.moveInDate ? formatDate(requirement.moveInDate) : null,
      },
      {
        term: 'ทำเลที่สนใจ',
        definition: requirement.locations.length > 0 ? requirement.locations.join(', ') : null,
      },
      { term: 'สถานะความต้องการ', definition: REQUIREMENT_STATUS_LABEL[requirement.status] },
    ];
  }

  const timeline = [
    ...lead.notes.map((note) => ({
      id: note.id,
      date: note.createdAt,
      text: note.body,
      author: note.author as string | undefined,
      kind: 'note' as const,
    })),
    ...lead.activities.map((activity) => ({
      id: activity.id,
      date: activity.createdAt,
      text: activity.text,
      author: undefined as string | undefined,
      kind: 'activity' as const,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const canCancelRequirement = requirement !== null && requirement.status !== 'cancelled';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/leads"
          className="inline-flex w-fit items-center gap-1 text-sm text-content-secondary hover:text-content-primary"
        >
          <ChevronLeft className="size-4" strokeWidth={1.7} aria-hidden />
          กลับไปที่ Leads
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-sm text-content-muted">{lead.code}</p>
            <h1 className="mt-1 text-2xl font-bold text-content-primary">{lead.contactName}</h1>
            <p className="mt-1 text-sm text-content-secondary">
              แหล่งที่มา: {SOURCE_LABEL[lead.source]} · สร้างเมื่อ {formatDate(lead.createdAt)}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <LeadStatusControl leadId={lead.id} status={lead.status} />
            <AssignControl
              leadId={lead.id}
              currentAgentId={lead.assignedAgentId}
              agents={agents}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* LEFT — workspace */}
        <div className="flex flex-col gap-6">
          <Section title="ผู้ติดต่อ">
            <ul className="flex flex-col gap-4">
              {contacts.map((contact, index) => (
                <li
                  key={index}
                  className="flex flex-col gap-1 border-b border-line-subtle pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-content-primary">{contact.name}</span>
                    {contact.isPrimary && <Badge variant="brand">ผู้ติดต่อหลัก</Badge>}
                    {contact.position && (
                      <span className="text-sm text-content-muted">· {contact.position}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-content-secondary">
                    {contact.email && (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="size-4 text-content-muted" strokeWidth={1.7} aria-hidden />
                        {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="size-4 text-content-muted" strokeWidth={1.7} aria-hidden />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          {companyInfo && (
            <Section title="บริษัท">
              <DefinitionList items={companyItems} />
            </Section>
          )}

          <Section
            title="ความต้องการ"
            action={canCancelRequirement ? <CancelRequirementButton leadId={lead.id} /> : undefined}
          >
            {requirement ? (
              <div className="flex flex-col gap-4">
                {requirement.status === 'cancelled' && (
                  <AlertBanner variant="danger" title="ความต้องการถูกยกเลิก">
                    {requirement.cancelledReason && <p>เหตุผล: {requirement.cancelledReason}</p>}
                    {requirement.cancelledField && (
                      <p>ด้านที่ไม่ตรงกัน: {CANCELLED_FIELD_LABEL[requirement.cancelledField]}</p>
                    )}
                  </AlertBanner>
                )}
                <DefinitionList items={requirementItems} />
              </div>
            ) : (
              <p className="text-sm text-content-muted">ยังไม่มีข้อมูลความต้องการ</p>
            )}
          </Section>

          <Section title="รายการที่เชื่อมโยง">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-content-secondary">Shortlists</span>
                <span className="ml-2 font-semibold text-content-primary">{linked.shortlists}</span>
              </div>
              <div>
                <span className="text-content-secondary">การเข้าชม</span>
                <span className="ml-2 font-semibold text-content-primary">{linked.visits}</span>
              </div>
              <div>
                <span className="text-content-secondary">ดีล</span>
                <span className="ml-2 font-semibold text-content-primary">{linked.deals}</span>
              </div>
            </div>
          </Section>
        </div>

        {/* RIGHT — timeline & tasks */}
        <div className="flex flex-col gap-6">
          <Section title="ไทม์ไลน์">
            <AddNoteBox leadId={lead.id} />
            {timeline.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-4 border-t border-line-subtle pt-4">
                {timeline.map((entry) => (
                  <li key={`${entry.kind}-${entry.id}`} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-content-primary">
                        {entry.author ?? (entry.kind === 'activity' ? 'ระบบ' : 'โน้ต')}
                      </span>
                      <span className="text-xs text-content-muted">{formatDate(entry.date)}</span>
                    </div>
                    <p className="text-sm text-content-secondary">{entry.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 border-t border-line-subtle pt-4 text-sm text-content-muted">
                ยังไม่มีกิจกรรม
              </p>
            )}
          </Section>

          <Section title="งานที่ต้องทำ">
            {lead.tasks.length > 0 && (
              <ul className="mb-4 flex flex-col gap-2">
                {lead.tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start justify-between gap-2 rounded-md border border-line bg-surface-alt px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm text-content-primary">{task.title}</span>
                      {task.dueAt && (
                        <span className="text-xs text-content-muted">
                          กำหนด {formatDate(task.dueAt)}
                        </span>
                      )}
                    </div>
                    <Badge variant={PRIORITY_VARIANT[task.priority]}>
                      {PRIORITY_LABEL[task.priority]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <AddTaskBox leadId={lead.id} />
          </Section>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusChip,
  toast,
} from '@jkp/ui';
import { nextStatuses, type LeadStatus } from '@jkp/domain';
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from '@/data/admin/labels';

/**
 * Lead status control. The options offered are ONLY the valid transitions from
 * the current status (nextStatuses from the domain state machine) — invalid
 * transitions are never rendered. Changing it is simulated (toast + optimistic
 * local state); the real implementation will PATCH the lead.
 */
export function LeadStatusControl({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const [current, setCurrent] = useState<LeadStatus>(status);
  const [editing, setEditing] = useState(false);

  const options = nextStatuses(current);

  function apply(next: string) {
    const target = next as LeadStatus;
    if (target === current) return;
    setCurrent(target);
    setEditing(false);
    // Real impl: PATCH /admin/leads/{leadId} { status: target }
    void leadId;
    toast.success(`อัปเดตสถานะเป็น “${LEAD_STATUS_LABEL[target]}”`);
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <StatusChip tone={LEAD_STATUS_TONE[current]}>{LEAD_STATUS_LABEL[current]}</StatusChip>
        {options.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            เปลี่ยนสถานะ
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select onValueChange={apply}>
        <SelectTrigger className="w-56" aria-label="เลือกสถานะใหม่">
          <SelectValue placeholder="เลือกสถานะใหม่" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={current} disabled>
            {LEAD_STATUS_LABEL[current]} (ปัจจุบัน)
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {LEAD_STATUS_LABEL[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
        ยกเลิก
      </Button>
    </div>
  );
}

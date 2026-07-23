'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@jkp/ui';
import type { Agent } from '@/data/admin/leads';

/**
 * Assign / reassign the responsible sales agent. Simulated (toast + optimistic
 * local state); the real implementation will PATCH the lead. Radix Select cannot
 * use an empty item value, so "ยังไม่มอบหมาย" uses the UNASSIGNED sentinel.
 */
const UNASSIGNED = 'unassigned';

export function AssignControl({
  leadId,
  currentAgentId,
  agents,
}: {
  leadId: string;
  currentAgentId: string | null;
  agents: Agent[];
}) {
  const [agentId, setAgentId] = useState<string>(currentAgentId ?? UNASSIGNED);

  function apply(value: string) {
    setAgentId(value);
    // Real impl: PATCH /admin/leads/{leadId} { assignedAgentId }
    void leadId;
    if (value === UNASSIGNED) {
      toast.success('ยกเลิกการมอบหมายแล้ว');
      return;
    }
    const name = agents.find((agent) => agent.id === value)?.name ?? value;
    toast.success(`มอบหมายให้ ${name}`);
  }

  return (
    <Select value={agentId} onValueChange={apply}>
      <SelectTrigger className="w-56" aria-label="มอบหมายเจ้าหน้าที่">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED}>ยังไม่มอบหมาย</SelectItem>
        {agents.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            {agent.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

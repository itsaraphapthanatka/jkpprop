'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextInput,
  toast,
} from '@jkp/ui';
import type { TaskPriority } from '@/data/admin/leads';

/**
 * Simple add-task control for the lead tasks panel. Simulated: new tasks are
 * optimistically appended to a local list with a priority badge and a toast
 * fires (the real implementation will POST the task).
 */
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

interface LocalTask {
  id: string;
  title: string;
  priority: TaskPriority;
}

export function AddTaskBox({ leadId }: { leadId: string }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [error, setError] = useState<string | undefined>();
  const [tasks, setTasks] = useState<LocalTask[]>([]);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('กรุณากรอกชื่องาน');
      return;
    }
    setTasks((previous) => [
      { id: `local-${Date.now()}`, title: trimmed, priority },
      ...previous,
    ]);
    setTitle('');
    setPriority('medium');
    setError(undefined);
    // Real impl: POST /admin/leads/{leadId}/tasks { title, priority }
    void leadId;
    toast.success('เพิ่มงานแล้ว');
  }

  return (
    <div className="flex flex-col gap-3">
      {tasks.length > 0 && (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between gap-2 rounded-md border border-line bg-surface-alt px-3 py-2"
            >
              <span className="text-sm text-content-primary">{task.title}</span>
              <Badge variant={PRIORITY_VARIANT[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
            </li>
          ))}
        </ul>
      )}

      <TextInput
        label="เพิ่มงาน"
        placeholder="เช่น โทรติดตามลูกค้า"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          if (error) setError(undefined);
        }}
        error={error}
      />
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-content-primary">ความสำคัญ</span>
          <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
            <SelectTrigger aria-label="ความสำคัญ">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">สูง</SelectItem>
              <SelectItem value="medium">กลาง</SelectItem>
              <SelectItem value="low">ต่ำ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={submit}>
          เพิ่มงาน
        </Button>
      </div>
    </div>
  );
}

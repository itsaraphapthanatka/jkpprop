'use client';

import { useState } from 'react';
import { Button, Textarea, toast } from '@jkp/ui';
import { formatDate } from '@jkp/domain';

/**
 * Add-note box for the lead timeline. Submitting is simulated: the note is
 * optimistically appended to a local list and a toast fires (the real
 * implementation will POST the note and let the server timeline own it).
 */
interface LocalNote {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export function AddNoteBox({ leadId }: { leadId: string }) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [notes, setNotes] = useState<LocalNote[]>([]);

  function submit() {
    const trimmed = body.trim();
    if (!trimmed) {
      setError('กรุณากรอกข้อความโน้ต');
      return;
    }
    const note: LocalNote = {
      id: `local-${Date.now()}`,
      author: 'คุณ',
      body: trimmed,
      createdAt: new Date().toISOString(),
    };
    setNotes((previous) => [note, ...previous]);
    setBody('');
    setError(undefined);
    // Real impl: POST /admin/leads/{leadId}/notes { body }
    void leadId;
    toast.success('เพิ่มโน้ตแล้ว');
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        label="เพิ่มโน้ต"
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          if (error) setError(undefined);
        }}
        error={error}
        placeholder="บันทึกการติดตาม การพูดคุย หรือข้อมูลสำคัญ…"
        rows={3}
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={submit}>
          เพิ่มโน้ต
        </Button>
      </div>

      {notes.length > 0 && (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li key={note.id} className="rounded-md border border-line bg-surface-alt p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-content-primary">{note.author}</span>
                <span className="text-xs text-content-muted">{formatDate(note.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-content-secondary">{note.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

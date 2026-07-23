'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  InlineError,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from '@jkp/ui';
import { CANCELLED_FIELD, type CancelledField } from '@jkp/domain';
import { CANCELLED_FIELD_LABEL } from '@/data/admin/labels';

/**
 * Cancel-requirement flow (FR-CRM-07). The confirm button only enables once BOTH
 * a reason AND a cancelled_field are provided; inline errors appear when a
 * required field is touched and left empty. Confirming is simulated (toast) — the
 * real implementation sets the requirement to `cancelled` (recording the reason
 * and field) and auto-closes any related shortlist.
 */
export function CancelRequirementButton({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [field, setField] = useState<CancelledField | ''>('');
  const [reasonTouched, setReasonTouched] = useState(false);
  const [fieldTouched, setFieldTouched] = useState(false);

  const reasonMissing = reason.trim().length === 0;
  const fieldMissing = field === '';
  const canConfirm = !reasonMissing && !fieldMissing;

  function reset() {
    setReason('');
    setField('');
    setReasonTouched(false);
    setFieldTouched(false);
  }

  function confirm() {
    if (!canConfirm) {
      setReasonTouched(true);
      setFieldTouched(true);
      return;
    }
    // Real impl: PATCH requirement → cancelled { reason, cancelledField }, then
    // auto-close any related shortlist.
    void leadId;
    toast.success('ยกเลิกความต้องการแล้ว');
    setOpen(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Button variant="danger" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <AlertTriangle className="size-4" strokeWidth={1.7} aria-hidden />
        ยกเลิกความต้องการ
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>ยกเลิกความต้องการ</DialogTitle>
          <DialogDescription>
            ระบุเหตุผลและด้านที่ไม่ตรงกัน เมื่อยืนยันแล้วระบบจะปิด shortlist ที่เกี่ยวข้องโดยอัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Textarea
              label="เหตุผล *"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              onBlur={() => setReasonTouched(true)}
              placeholder="อธิบายเหตุผลในการยกเลิก…"
              aria-invalid={reasonTouched && reasonMissing ? true : undefined}
              rows={3}
            />
            {reasonTouched && reasonMissing && <InlineError>กรุณากรอกเหตุผล</InlineError>}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-content-primary">ด้านที่ไม่ตรงกัน *</span>
            <Select
              value={field || undefined}
              onValueChange={(value) => setField(value as CancelledField)}
              onOpenChange={(isOpen) => {
                if (!isOpen) setFieldTouched(true);
              }}
            >
              <SelectTrigger
                aria-label="ด้านที่ไม่ตรงกัน"
                aria-invalid={fieldTouched && fieldMissing ? true : undefined}
              >
                <SelectValue placeholder="เลือกด้านที่ไม่ตรงกัน" />
              </SelectTrigger>
              <SelectContent>
                {CANCELLED_FIELD.map((value) => (
                  <SelectItem key={value} value={value}>
                    {CANCELLED_FIELD_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldTouched && fieldMissing && <InlineError>กรุณาเลือกด้านที่ไม่ตรงกัน</InlineError>}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">ยกเลิก</Button>
          </DialogClose>
          <Button variant="danger" onClick={confirm} disabled={!canConfirm}>
            ยืนยันการยกเลิก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

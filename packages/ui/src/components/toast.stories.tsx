'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Toaster, toast } from './toast';
import { Button } from './button';

const meta = {
  title: 'Primitives/Toast',
  component: Toaster,
} satisfies Meta<typeof Toaster>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="primary"
        onClick={() => toast.success('บันทึกโครงการเรียบร้อยแล้ว')}
      >
        Success
      </Button>
      <Button
        variant="danger"
        onClick={() => toast.error('ไม่สามารถบันทึกได้ กรุณาลองใหม่')}
      >
        Error
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.info('มีโครงการใหม่ตรงกับเงื่อนไขที่คุณบันทึกไว้')
        }
      >
        Info
      </Button>
      <Toaster />
    </div>
  ),
};

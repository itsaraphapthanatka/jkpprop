import type { Meta, StoryObj } from '@storybook/react';
import { StatusChip } from './status-chip';

const meta = {
  title: 'Primitives/StatusChip',
  component: StatusChip,
  args: { tone: 'success', children: 'เผยแพร่แล้ว' },
} satisfies Meta<typeof StatusChip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <StatusChip tone="neutral">ร่าง</StatusChip>
      <StatusChip tone="brand">กำลังดำเนินการ</StatusChip>
      <StatusChip tone="info">รอตรวจสอบ</StatusChip>
      <StatusChip tone="success">เผยแพร่แล้ว</StatusChip>
      <StatusChip tone="warning">รอการอนุมัติ</StatusChip>
      <StatusChip tone="danger">ถูกปฏิเสธ</StatusChip>
    </div>
  ),
};

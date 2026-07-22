import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

const meta = {
  title: 'Primitives/Badge',
  component: Badge,
  args: { children: 'ป้ายกำกับ' },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="neutral">ทั่วไป</Badge>
      <Badge variant="brand">แนะนำ</Badge>
      <Badge variant="accent">ใหม่</Badge>
      <Badge variant="gold">โปรโมชัน</Badge>
      <Badge variant="success">ว่าง</Badge>
      <Badge variant="warning">ใกล้เต็ม</Badge>
      <Badge variant="danger">เต็มแล้ว</Badge>
      <Badge variant="info">ข้อมูล</Badge>
      <Badge variant="zone">สุขุมวิท</Badge>
    </div>
  ),
};

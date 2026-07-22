import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './label';

const meta = {
  title: 'Primitives/Label',
  component: Label,
} satisfies Meta<typeof Label>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'ชื่อโครงการ', htmlFor: 'demo' },
};

export const WithField: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="email">อีเมล</Label>
      <input
        id="email"
        type="email"
        placeholder="you@example.com"
        className="h-10 w-64 rounded-md border border-line bg-surface-card px-4 text-base text-content-primary placeholder:text-content-muted focus-visible:border-brand-600 focus-visible:shadow-focus focus-visible:outline-none"
      />
    </div>
  ),
};

export const PeerDisabled: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <input
        id="disabled-field"
        disabled
        placeholder="disabled"
        className="peer order-2 h-10 w-64 rounded-md border border-line bg-surface-muted px-4 text-base disabled:cursor-not-allowed disabled:text-content-muted"
      />
      <Label htmlFor="disabled-field" className="order-1">
        ฟิลด์ที่ปิดใช้งาน
      </Label>
    </div>
  ),
};

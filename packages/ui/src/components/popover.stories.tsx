import type { Meta, StoryObj } from '@storybook/react';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';

const meta = {
  title: 'Primitives/Popover',
  component: Popover,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Popover>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">เปิด popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <p className="text-sm font-semibold text-content-primary">ตัวกรองด่วน</p>
        <p className="mt-1 text-sm text-content-secondary">
          เนื้อหาลอยอยู่บนการ์ดพื้นผิว มีเส้นขอบและเงาตามชุดโทเคน
        </p>
      </PopoverContent>
    </Popover>
  ),
};

/** Content aligned to the start edge with a wider offset. */
export const AlignStart: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">จัดชิดซ้าย</Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={10} className="w-64">
        <p className="text-sm text-content-secondary">align=&quot;start&quot;, sideOffset=10</p>
      </PopoverContent>
    </Popover>
  ),
};

/** PopoverAnchor decouples the positioning reference from the trigger. */
export const WithAnchor: Story = {
  render: () => (
    <Popover>
      <PopoverAnchor className="rounded-md border border-dashed border-line px-6 py-3 text-sm text-content-muted">
        anchor
      </PopoverAnchor>
      <div className="mt-3">
        <PopoverTrigger asChild>
          <Button variant="ghost">เปิดจาก trigger คนละที่</Button>
        </PopoverTrigger>
      </div>
      <PopoverContent align="start" className="w-56">
        <p className="text-sm text-content-secondary">วางตำแหน่งจาก anchor ด้านบน</p>
      </PopoverContent>
    </Popover>
  ),
};

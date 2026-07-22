import type { Meta, StoryObj } from '@storybook/react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { Button } from './button';

/**
 * Accessibility note — tooltips are ENHANCEMENT ONLY.
 * - Never place essential or action-only information in a tooltip: it does not
 *   appear on touch devices (no hover) and is easy to miss.
 * - The trigger must be meaningful on its own (real button/label + aria-label).
 * - Radix shows the tooltip on hover AND keyboard focus, so it stays reachable
 *   for keyboard users; delayDuration is 300ms.
 */
const meta = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">วางเมาส์หรือโฟกัส</Button>
      </TooltipTrigger>
      <TooltipContent>รหัสทรัพย์ generate อัตโนมัติจากจังหวัด</TooltipContent>
    </Tooltip>
  ),
};

/** Icon trigger — the icon-only control still needs an accessible label. */
export const OnIcon: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="ข้อมูลเพิ่มเติมเรื่องพิกัด"
          className="inline-flex size-8 items-center justify-center rounded-full text-content-muted outline-none hover:bg-surface-muted focus-visible:shadow-focus"
        >
          <Info className="size-5" strokeWidth={1.7} aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent>พิกัดจริงถูกซ่อนเมื่อ map_visibility ไม่ใช่ exact</TooltipContent>
    </Tooltip>
  ),
};

/** Positioned on the right. */
export const SideRight: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost">side=right</Button>
      </TooltipTrigger>
      <TooltipContent side="right">คำอธิบายเสริม (enhancement only)</TooltipContent>
    </Tooltip>
  ),
};

import type { Meta, StoryObj } from '@storybook/react';
import { Heart, Share2, X } from 'lucide-react';
import { IconButton } from './icon-button';

const meta = {
  title: 'Primitives/IconButton',
  component: IconButton,
  args: { 'aria-label': 'บันทึกรายการโปรด', children: <Heart strokeWidth={1.7} /> },
} satisfies Meta<typeof IconButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <IconButton {...args} variant="ghost" />
      <IconButton {...args} variant="outline" />
      <IconButton {...args} variant="solid" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <IconButton {...args} size="sm" variant="outline" />
      <IconButton {...args} size="md" variant="outline" />
      <IconButton {...args} size="lg" variant="outline" />
    </div>
  ),
};

export const CommonActions: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton aria-label="แชร์โครงการ" variant="ghost">
        <Share2 strokeWidth={1.7} />
      </IconButton>
      <IconButton aria-label="ปิด" variant="ghost">
        <X strokeWidth={1.7} />
      </IconButton>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, variant: 'solid' },
};

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  args: { children: 'ดูรายละเอียด' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Outline: Story = { args: { variant: 'outline' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Danger: Story = { args: { variant: 'danger', children: 'ลบทรัพย์' } };
export const LinkVariant: Story = { args: { variant: 'link', children: 'อ่านเพิ่มเติม' } };
export const Disabled: Story = { args: { disabled: true } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} size="sm">
        เล็ก
      </Button>
      <Button {...args} size="md">
        กลาง
      </Button>
      <Button {...args} size="lg">
        ใหญ่
      </Button>
    </div>
  ),
};

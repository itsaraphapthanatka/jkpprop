import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';
import { Label } from './label';

const meta = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { defaultChecked: true },
};

export const Unchecked: Story = {
  args: {},
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="agree" defaultChecked />
      <Label htmlFor="agree">ยอมรับเงื่อนไขการใช้งาน</Label>
    </div>
  ),
};

export const Indeterminate: Story = {
  render: () => {
    const [checked, setChecked] = React.useState<boolean | 'indeterminate'>(
      'indeterminate',
    );
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id="all"
          checked={checked}
          onCheckedChange={(v) => setChecked(v)}
        />
        <Label htmlFor="all">เลือกทั้งหมด</Label>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Checkbox disabled />
      <Checkbox disabled defaultChecked />
    </div>
  ),
};

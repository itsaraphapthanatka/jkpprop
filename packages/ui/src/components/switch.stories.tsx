import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';
import { Label } from './label';

const meta = {
  title: 'Primitives/Switch',
  component: Switch,
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { defaultChecked: true },
};

export const Off: Story = {
  args: {},
};

export const WithLabel: Story = {
  render: () => {
    const [on, setOn] = React.useState(true);
    return (
      <div className="flex items-center gap-3">
        <Switch id="featured" checked={on} onCheckedChange={setOn} />
        <Label htmlFor="featured">ทรัพย์แนะนำ (Featured)</Label>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Switch disabled />
      <Switch disabled defaultChecked />
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Label } from './label';

const meta = {
  title: 'Primitives/RadioGroup',
  component: RadioGroup,
} satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="sale">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="sale" id="r-sale" />
        <Label htmlFor="r-sale">ขาย</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="rent" id="r-rent" />
        <Label htmlFor="r-rent">เช่า</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="both" id="r-both" />
        <Label htmlFor="r-both">ขายและเช่า</Label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="a">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="a" id="d-a" disabled />
        <Label htmlFor="d-a">ตัวเลือกที่ปิดใช้งาน (เลือกอยู่)</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="b" id="d-b" disabled />
        <Label htmlFor="d-b">ตัวเลือกที่ปิดใช้งาน</Label>
      </div>
    </RadioGroup>
  ),
};

import type { Meta, StoryObj } from '@storybook/react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';

const meta = {
  title: 'Primitives/Select',
  component: Select,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Select>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="เลือกประเภททรัพย์" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="factory">โรงงาน</SelectItem>
        <SelectItem value="warehouse">โกดัง</SelectItem>
        <SelectItem value="land">ที่ดิน</SelectItem>
        <SelectItem value="office">สำนักงาน</SelectItem>
      </SelectContent>
    </Select>
  ),
};

/** With a pre-selected value — the chosen row shows Check + text-brand-600. */
export const WithValue: Story = {
  render: () => (
    <Select defaultValue="warehouse">
      <SelectTrigger className="w-64">
        <SelectValue placeholder="เลือกประเภททรัพย์" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="factory">โรงงาน</SelectItem>
        <SelectItem value="warehouse">โกดัง</SelectItem>
        <SelectItem value="land">ที่ดิน</SelectItem>
      </SelectContent>
    </Select>
  ),
};

/** Grouped options with labels, a separator and a disabled item. */
export const Grouped: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="เลือกทำเล" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>สนามบิน</SelectLabel>
          <SelectItem value="donmuang">ดอนเมือง</SelectItem>
          <SelectItem value="suvarnabhumi">สุวรรณภูมิ</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>ท่าเรือ</SelectLabel>
          <SelectItem value="mahachai">มหาชัย</SelectItem>
          <SelectItem value="laemchabang">แหลมฉบัง</SelectItem>
          <SelectItem value="maptaphut" disabled>
            มาบตาพุด (เร็วๆ นี้)
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

/** Disabled trigger. */
export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="เลือกประเภททรัพย์" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="factory">โรงงาน</SelectItem>
      </SelectContent>
    </Select>
  ),
};

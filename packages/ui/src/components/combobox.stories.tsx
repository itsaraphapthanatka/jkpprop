import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Combobox, type ComboboxOption } from './combobox';

const meta = {
  title: 'Primitives/Combobox',
  component: Combobox,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Combobox>;
export default meta;

type Story = StoryObj;

const provinces: ComboboxOption[] = [
  { label: 'สมุทรปราการ', value: 'samut-prakan' },
  { label: 'ชลบุรี', value: 'chonburi' },
  { label: 'ระยอง', value: 'rayong' },
  { label: 'ปทุมธานี', value: 'pathum-thani' },
  { label: 'พระนครศรีอยุธยา', value: 'ayutthaya' },
  { label: 'สมุทรสาคร', value: 'samut-sakhon' },
];

function ComboboxDemo(props: Partial<React.ComponentProps<typeof Combobox>>) {
  const [value, setValue] = React.useState<string | undefined>(props.value);
  return (
    <div className="w-72">
      <Combobox
        {...props}
        options={provinces}
        value={value}
        onValueChange={setValue}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <ComboboxDemo placeholder="เลือกจังหวัด" searchPlaceholder="ค้นหาจังหวัด…" />,
};

/** Pre-selected value shows Check + text-brand-600 on the matching row. */
export const WithValue: Story = {
  render: () => <ComboboxDemo value="chonburi" placeholder="เลือกจังหวัด" />,
};

/** Empty state: typing text that matches nothing shows emptyText. */
export const EmptyState: Story = {
  render: () => (
    <ComboboxDemo
      placeholder="เลือกจังหวัด"
      searchPlaceholder="ลองพิมพ์ xyz"
      emptyText="ไม่พบจังหวัดที่ค้นหา"
    />
  ),
};

export const Disabled: Story = {
  render: () => <ComboboxDemo placeholder="เลือกจังหวัด" disabled />,
};

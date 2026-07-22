import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DateInput, DateRangeInput, type DateRangeValue } from './date-input';

const meta = {
  title: 'Primitives/DateInput',
  component: DateInput,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof DateInput>;
export default meta;

type Story = StoryObj;

function DateInputDemo(props: Partial<React.ComponentProps<typeof DateInput>>) {
  const [value, setValue] = React.useState<Date | undefined>(props.value);
  return (
    <div className="w-72">
      <DateInput {...props} value={value} onChange={setValue} />
    </div>
  );
}

function DateRangeDemo(props: Partial<React.ComponentProps<typeof DateRangeInput>>) {
  const [value, setValue] = React.useState<DateRangeValue | undefined>(props.value);
  return (
    <div className="w-80">
      <DateRangeInput {...props} value={value} onChange={setValue} />
    </div>
  );
}

export const Default: Story = {
  render: () => <DateInputDemo placeholder="เลือกวันเข้าชม" />,
};

/** Pre-filled single date, formatted as DD MMM YYYY. */
export const WithValue: Story = {
  render: () => <DateInputDemo value={new Date(2026, 6, 22)} />,
};

/** Past dates disabled via the `disabled` matcher. */
export const FutureOnly: Story = {
  render: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return <DateInputDemo placeholder="เลือกวันในอนาคต" disabled={(date) => date < today} />;
  },
};

/** Range picker — mode="range", stays open while both ends are chosen. */
export const Range: StoryObj<typeof DateRangeInput> = {
  render: () => <DateRangeDemo placeholder="เลือกช่วงวันที่" />,
};

export const RangeWithValue: StoryObj<typeof DateRangeInput> = {
  render: () => (
    <DateRangeDemo value={{ from: new Date(2026, 6, 22), to: new Date(2026, 6, 28) }} />
  ),
};

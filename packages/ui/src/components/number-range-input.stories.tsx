import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NumberRangeInput } from './number-range-input';

const meta = {
  title: 'Primitives/NumberRangeInput',
  component: NumberRangeInput,
} satisfies Meta<typeof NumberRangeInput>;
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    const [range, setRange] = React.useState<{
      min: number | null;
      max: number | null;
    }>({ min: null, max: null });
    return (
      <div className="w-80">
        <NumberRangeInput
          label="ช่วงราคา"
          unit="บาท"
          minValue={range.min}
          maxValue={range.max}
          onChange={setRange}
          placeholderMin="ต่ำสุด"
          placeholderMax="สูงสุด"
        />
      </div>
    );
  },
};

export const Prefilled: Story = {
  render: () => {
    const [range, setRange] = React.useState<{
      min: number | null;
      max: number | null;
    }>({ min: 2000000, max: 5000000 });
    return (
      <div className="w-80">
        <NumberRangeInput
          label="ช่วงราคา"
          unit="บาท"
          minValue={range.min}
          maxValue={range.max}
          onChange={setRange}
        />
      </div>
    );
  },
};

export const InvalidRange: Story = {
  render: () => {
    const [range, setRange] = React.useState<{
      min: number | null;
      max: number | null;
    }>({ min: 8000000, max: 3000000 });
    return (
      <div className="w-80">
        <NumberRangeInput
          label="ช่วงราคา"
          unit="บาท"
          minValue={range.min}
          maxValue={range.max}
          onChange={setRange}
        />
      </div>
    );
  },
};

export const AreaRange: Story = {
  render: () => {
    const [range, setRange] = React.useState<{
      min: number | null;
      max: number | null;
    }>({ min: null, max: null });
    return (
      <div className="w-80">
        <NumberRangeInput
          label="พื้นที่ใช้สอย"
          unit="ตร.ม."
          minValue={range.min}
          maxValue={range.max}
          onChange={setRange}
        />
      </div>
    );
  },
};

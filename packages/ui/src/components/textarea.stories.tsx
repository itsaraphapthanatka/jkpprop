import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './textarea';

const meta = {
  title: 'Primitives/Textarea',
  component: Textarea,
  args: { placeholder: 'เขียนรายละเอียด…' },
} satisfies Meta<typeof Textarea>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'รายละเอียดทรัพย์' },
};

export const WithHint: Story = {
  args: { label: 'หมายเหตุ', hint: 'ไม่บังคับ' },
};

export const WithCounter: Story = {
  args: { label: 'คำอธิบายสั้น', maxLength: 120, defaultValue: 'บ้านเดี่ยว 2 ชั้น' },
};

export const NearLimit: Story = {
  args: {
    label: 'คำอธิบายสั้น',
    maxLength: 40,
    defaultValue: 'บ้านเดี่ยว 2 ชั้น ใกล้รถไฟฟ้า พร้อมอยู่',
  },
};

export const Error: Story = {
  args: { label: 'รายละเอียด', error: 'กรุณากรอกรายละเอียด', maxLength: 200 },
};

export const Disabled: Story = {
  args: { label: 'ปิดใช้งาน', defaultValue: 'อ่านอย่างเดียว', disabled: true },
};

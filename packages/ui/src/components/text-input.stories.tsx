import type { Meta, StoryObj } from '@storybook/react';
import { Search, Mail } from 'lucide-react';
import { TextInput } from './text-input';

const meta = {
  title: 'Primitives/TextInput',
  component: TextInput,
  args: { placeholder: 'พิมพ์ที่นี่…' },
} satisfies Meta<typeof TextInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'ชื่อโครงการ' },
};

export const WithHint: Story = {
  args: {
    label: 'อีเมล',
    hint: 'เราจะไม่เปิดเผยอีเมลของคุณ',
    placeholder: 'you@example.com',
    type: 'email',
  },
};

export const Error: Story = {
  args: {
    label: 'อีเมล',
    defaultValue: 'not-an-email',
    error: 'รูปแบบอีเมลไม่ถูกต้อง',
  },
};

export const LeadingIcon: Story = {
  args: {
    label: 'ค้นหา',
    placeholder: 'ค้นหาทรัพย์…',
    leadingIcon: <Search className="size-5" strokeWidth={1.7} />,
  },
};

export const TrailingIcon: Story = {
  args: {
    label: 'อีเมล',
    placeholder: 'you@example.com',
    trailingIcon: <Mail className="size-5" strokeWidth={1.7} />,
  },
};

export const Disabled: Story = {
  args: { label: 'ปิดใช้งาน', defaultValue: 'อ่านอย่างเดียว', disabled: true },
};

import type { Meta, StoryObj } from '@storybook/react';
import { InlineError } from './inline-error';

const meta = {
  title: 'Primitives/InlineError',
  component: InlineError,
  args: { children: 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง' },
} satisfies Meta<typeof InlineError>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const UnderAField: Story = {
  render: () => (
    <div className="max-w-narrow">
      <label htmlFor="phone" className="text-sm font-medium text-content-primary">
        เบอร์โทรศัพท์
      </label>
      <input
        id="phone"
        aria-invalid="true"
        aria-describedby="phone-error"
        defaultValue="08"
        className="mt-1 h-10 w-full rounded-md border border-danger bg-surface-card px-4 shadow-focus-error outline-none"
      />
      <InlineError id="phone-error">กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก</InlineError>
    </div>
  ),
};

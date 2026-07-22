import type { Meta, StoryObj } from '@storybook/react';
import { AlertBanner } from './alert-banner';

const meta = {
  title: 'Primitives/AlertBanner',
  component: AlertBanner,
  args: {
    variant: 'info',
    title: 'บันทึกร่างแล้ว',
    children: 'ระบบบันทึกการเปลี่ยนแปลงของคุณโดยอัตโนมัติเมื่อสักครู่',
  },
} satisfies Meta<typeof AlertBanner>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div className="flex max-w-content flex-col gap-3">
      <AlertBanner variant="info" title="ข้อมูล">
        มีโครงการใหม่ 3 รายการตรงกับเงื่อนไขที่คุณบันทึกไว้
      </AlertBanner>
      <AlertBanner variant="success" title="ส่งข้อมูลสำเร็จ">
        ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง
      </AlertBanner>
      <AlertBanner variant="warning" title="ใกล้ครบกำหนด">
        โปรโมชันนี้จะสิ้นสุดในอีก 2 วัน
      </AlertBanner>
      <AlertBanner variant="danger" title="บันทึกไม่สำเร็จ">
        กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง
      </AlertBanner>
    </div>
  ),
};

export const Dismissible: Story = {
  args: { variant: 'warning', title: 'ยังไม่ได้เผยแพร่', dismissible: true },
};

export const TitleOnly: Story = {
  args: { variant: 'success', title: 'คัดลอกลิงก์แล้ว', children: undefined },
};

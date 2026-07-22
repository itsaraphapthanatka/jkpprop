import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './empty-state';
import { Button } from './button';

const meta = {
  title: 'Primitives/EmptyState',
  component: EmptyState,
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const NoSearchResults: Story = {
  args: {
    variant: 'search',
    title: 'ไม่พบโครงการที่ตรงกับเงื่อนไข',
    description:
      'ลองปรับตัวกรองให้กว้างขึ้น หรือส่งความต้องการของคุณให้ทีมงานช่วยค้นหา',
    actions: (
      <>
        <Button variant="outline">ล้างตัวกรอง</Button>
        <Button variant="primary">ส่งความต้องการ</Button>
      </>
    ),
  },
};

export const NoData: Story = {
  args: {
    variant: 'data',
    title: 'ยังไม่มีรายการที่บันทึกไว้',
    description: 'โครงการที่คุณบันทึกจะปรากฏที่นี่',
    actions: <Button variant="primary">เริ่มค้นหาโครงการ</Button>,
  },
};

export const ErrorState: Story = {
  args: {
    variant: 'error',
    title: 'โหลดข้อมูลไม่สำเร็จ',
    description: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง',
    actions: <Button variant="outline">ลองใหม่</Button>,
  },
};

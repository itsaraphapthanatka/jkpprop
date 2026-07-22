import type { Meta, StoryObj } from '@storybook/react';
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog';
import { Button } from './button';

const meta = {
  title: 'Primitives/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Dialog>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Centered modal with header/body/footer split, scrim, focus trap (Radix). */
export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>ขอข้อมูลทรัพย์</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ขอข้อมูลเพิ่มเติม</DialogTitle>
          <DialogDescription>
            ทีมงานจะติดต่อกลับภายใน 1 วันทำการ พร้อมรายละเอียดทรัพย์รหัส JKP-SPK0042
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-content-secondary">
          กรอกชื่อและเบอร์โทรในขั้นตอนถัดไป หรือทักผ่าน Line / WeChat / WhatsApp ได้ทันที
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">ยกเลิก</Button>
          </DialogClose>
          <Button>ยืนยัน</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

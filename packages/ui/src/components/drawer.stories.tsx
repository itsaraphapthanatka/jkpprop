import type { Meta, StoryObj } from '@storybook/react';
import {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
} from './drawer';
import { Button } from './button';

const meta = {
  title: 'Primitives/Drawer',
  component: Drawer,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Drawer>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Desktop pattern: panel slides in from the right. */
export const Right: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">ตัวกรอง</Button>
      </DrawerTrigger>
      <DrawerContent side="right">
        <DrawerHeader>
          <DrawerTitle>ตัวกรองทรัพย์</DrawerTitle>
        </DrawerHeader>
        <p className="text-sm text-content-secondary">
          เลือกโซน · ประเภท · ขนาด · ช่วงราคา แล้วกดปรับผลการค้นหา
        </p>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="ghost">ล้างค่า</Button>
          </DrawerClose>
          <Button>ดูผลลัพธ์</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

/** Mobile pattern: panel slides up from the bottom. */
export const Bottom: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">ตัวกรอง (มือถือ)</Button>
      </DrawerTrigger>
      <DrawerContent side="bottom">
        <DrawerHeader>
          <DrawerTitle>เรียงตาม</DrawerTitle>
        </DrawerHeader>
        <p className="text-sm text-content-secondary">ราคาต่ำ-สูง · ราคาสูง-ต่ำ · ใหม่ล่าสุด · แนะนำ</p>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>เสร็จสิ้น</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

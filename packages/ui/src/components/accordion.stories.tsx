import type { Meta, StoryObj } from '@storybook/react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';

const meta = {
  title: 'Primitives/Accordion',
  component: Accordion,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Accordion>;
export default meta;

type Story = StoryObj;

/** Single-open FAQ list; chevron rotates 180° on the open item. */
export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="q1" className="w-full max-w-xl">
      <AccordionItem value="q1">
        <AccordionTrigger>ค่านายหน้าคิดอย่างไร?</AccordionTrigger>
        <AccordionContent>
          ค่านายหน้ามาตรฐานตามประเภทดีล ทีมงานจะแจ้งรายละเอียดก่อนเข้าชมทรัพย์ทุกครั้ง
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="q2">
        <AccordionTrigger>ต้องนัดล่วงหน้ากี่วัน?</AccordionTrigger>
        <AccordionContent>โดยทั่วไป 1-3 วันทำการ ขึ้นอยู่กับความพร้อมของเจ้าของทรัพย์</AccordionContent>
      </AccordionItem>
      <AccordionItem value="q3">
        <AccordionTrigger>รองรับลูกค้าต่างชาติไหม?</AccordionTrigger>
        <AccordionContent>รองรับ 3 ภาษา (ไทย/อังกฤษ/จีน) พร้อมทีมประสานงานเฉพาะทาง</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/** Multiple items can be open at once. */
export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={['a', 'b']} className="w-full max-w-xl">
      <AccordionItem value="a">
        <AccordionTrigger>โรงงาน</AccordionTrigger>
        <AccordionContent>โรงงานให้เช่าและขาย ทุกขนาดในเขตอุตสาหกรรมหลัก</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>โกดัง / คลังสินค้า</AccordionTrigger>
        <AccordionContent>โกดังพร้อมใช้ ทำเลใกล้ท่าเรือและสนามบิน</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

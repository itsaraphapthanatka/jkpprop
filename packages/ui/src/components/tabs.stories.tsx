import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

const meta = {
  title: 'Primitives/Tabs',
  component: Tabs,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Tabs>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Underline variant: active trigger shows a 2px brand underline + brand text. */
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-2xl">
      <TabsList>
        <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
        <TabsTrigger value="specs">สเปก</TabsTrigger>
        <TabsTrigger value="location">ทำเล</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        โรงงานพร้อมสำนักงาน ทำเลนิคมอุตสาหกรรม เหมาะสำหรับการผลิตและจัดเก็บ
      </TabsContent>
      <TabsContent value="specs">พื้นที่ใช้สอย 2,400 ตร.ม. · เสาสูง 8 เมตร · ไฟ 3 เฟส</TabsContent>
      <TabsContent value="location">ห่างจากท่าเรือแหลมฉบัง 12 กม. · เข้าออกมอเตอร์เวย์สะดวก</TabsContent>
    </Tabs>
  ),
};

/** A disabled trigger stays skippable via keyboard (Radix roving focus). */
export const WithDisabled: Story = {
  render: () => (
    <Tabs defaultValue="a" className="w-full max-w-2xl">
      <TabsList>
        <TabsTrigger value="a">ให้เช่า</TabsTrigger>
        <TabsTrigger value="b" disabled>
          ขาย (ไม่ว่าง)
        </TabsTrigger>
        <TabsTrigger value="c">เช่าซื้อ</TabsTrigger>
      </TabsList>
      <TabsContent value="a">รายการทรัพย์ให้เช่า</TabsContent>
      <TabsContent value="c">รายการทรัพย์เช่าซื้อ</TabsContent>
    </Tabs>
  ),
};

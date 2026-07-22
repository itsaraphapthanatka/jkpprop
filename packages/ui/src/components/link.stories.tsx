import type { Meta, StoryObj } from '@storybook/react';
import { TextLink, LinkButton } from './link';

const meta = {
  title: 'Primitives/Link',
  component: TextLink,
} satisfies Meta<typeof TextLink>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { href: '#', children: 'ดูรายละเอียดโครงการ' },
};

export const External: Story = {
  args: { href: 'https://example.com', external: true, children: 'เปิดแผนที่ Google' },
};

export const InlineWithinText: Story = {
  render: () => (
    <p className="max-w-narrow text-base text-content-primary">
      โครงการนี้อยู่ใกล้รถไฟฟ้า อ่าน{' '}
      <TextLink href="#">เงื่อนไขการเข้าชม</TextLink> หรือ{' '}
      <TextLink href="https://example.com" external>
        แผนที่เดินทาง
      </TextLink>{' '}
      เพิ่มเติมได้เลย
    </p>
  ),
};

export const AsButton: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <LinkButton href="#" variant="primary">
        นัดชมโครงการ
      </LinkButton>
      <LinkButton href="#" variant="outline">
        ดาวน์โหลดโบรชัวร์
      </LinkButton>
      <LinkButton href="#" variant="secondary" size="sm">
        ติดต่อเรา
      </LinkButton>
    </div>
  ),
};

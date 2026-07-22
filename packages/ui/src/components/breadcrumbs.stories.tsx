import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs } from './breadcrumbs';

const meta = {
  title: 'Primitives/Breadcrumbs',
  component: Breadcrumbs,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Breadcrumbs>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Canonical route trail; last item is the current page (aria-current). */
export const Default: Story = {
  args: {
    items: [
      { label: 'หน้าแรก', href: '/' },
      { label: 'โรงงานให้เช่า', href: '/factory/rent' },
      { label: 'สมุทรปราการ', href: '/factory/rent/samut-prakan' },
      { label: 'JKP-SPK0042' },
    ],
  },
};

/** Two-level trail. */
export const Short: Story = {
  args: {
    items: [
      { label: 'หน้าแรก', href: '/' },
      { label: 'ติดต่อเรา' },
    ],
  },
};

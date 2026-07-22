import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, SkeletonText } from './skeleton';

const meta = {
  title: 'Primitives/Skeleton',
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { className: 'h-4 w-48' },
};

export const Text: Story = {
  render: () => (
    <div className="max-w-narrow">
      <SkeletonText lines={4} />
    </div>
  ),
};

export const PropertyCard: Story = {
  render: () => (
    <div className="w-72 rounded-lg border border-line bg-surface-card p-3">
      <Skeleton className="h-40 w-full rounded-sm" />
      <div className="mt-3 flex flex-col gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <SkeletonText lines={2} className="mt-2" />
      </div>
    </div>
  ),
};

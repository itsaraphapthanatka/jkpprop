import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from './pagination';

const meta = {
  title: 'Primitives/Pagination',
  component: Pagination,
  args: {
    page: 1,
    totalPages: 10,
    siblingCount: 1,
    onPageChange: () => {},
  },
} satisfies Meta<typeof Pagination>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Interactive — click Prev/Next or a page pill to move the current page. */
export const Interactive: Story = {
  render: (args) => {
    const [page, setPage] = React.useState(args.page);
    return (
      <Pagination {...args} page={page} onPageChange={setPage} />
    );
  },
};

/** Start of range — Prev is disabled. */
export const FirstPage: Story = {
  args: { page: 1, totalPages: 10 },
};

/** Middle of a long range — ellipsis on both sides. */
export const MiddleWithEllipsis: Story = {
  args: { page: 6, totalPages: 20 },
};

/** End of range — Next is disabled. */
export const LastPage: Story = {
  args: { page: 20, totalPages: 20 },
};

/** Few pages — every page shown, no ellipsis. */
export const FewPages: Story = {
  args: { page: 2, totalPages: 4 },
};

/** Wider sibling window. */
export const MoreSiblings: Story = {
  args: { page: 10, totalPages: 20, siblingCount: 2 },
};

import type { Meta, StoryObj } from '@storybook/react';
import { ArrowUp } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from './table';

const meta = {
  title: 'Primitives/Table',
  component: Table,
} satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;

const rows = [
  { code: 'JKP-1024', project: 'Sukhumvit Grande', type: 'Condo', price: '฿8.9M' },
  { code: 'JKP-1088', project: 'Rama IX Residences', type: 'Condo', price: '฿12.4M' },
  { code: 'JKP-2031', project: 'Thonglor Townhome', type: 'Townhouse', price: '฿21.0M' },
  { code: 'JKP-3007', project: 'Bang Na House', type: 'House', price: '฿15.5M' },
];

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>Active listings, updated daily.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.code}>
            <TableCell className="font-medium">{r.code}</TableCell>
            <TableCell>{r.project}</TableCell>
            <TableCell>{r.type}</TableCell>
            <TableCell className="text-right">{r.price}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">4 listings</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

/** Header cell communicates sort state via `aria-sort` (not colour alone). */
export const SortableHeader: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Project</TableHead>
          <TableHead aria-sort="ascending" className="text-right">
            <span className="inline-flex items-center gap-1">
              Price
              <ArrowUp className="size-4" strokeWidth={1.7} aria-hidden />
            </span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...rows]
          .sort((a, b) => a.price.localeCompare(b.price))
          .map((r) => (
            <TableRow key={r.code}>
              <TableCell className="font-medium">{r.code}</TableCell>
              <TableCell>{r.project}</TableCell>
              <TableCell className="text-right">{r.price}</TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  ),
};

/** Many columns — the table scrolls inside its own overflow container. */
export const WideScrolls: Story = {
  render: () => (
    <div className="max-w-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>District</TableHead>
            <TableHead>Bedrooms</TableHead>
            <TableHead>Area</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.code}>
              <TableCell className="font-medium">{r.code}</TableCell>
              <TableCell>{r.project}</TableCell>
              <TableCell>{r.type}</TableCell>
              <TableCell>Watthana</TableCell>
              <TableCell>3</TableCell>
              <TableCell>120 sqm</TableCell>
              <TableCell className="text-right">{r.price}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

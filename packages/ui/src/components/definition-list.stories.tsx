import type { Meta, StoryObj } from '@storybook/react';
import { DefinitionList, KeyValueGrid } from './definition-list';

const meta = {
  title: 'Primitives/DefinitionList',
  component: DefinitionList,
} satisfies Meta<typeof DefinitionList>;
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="max-w-md">
      <DefinitionList
        items={[
          { term: 'Listing code', definition: 'JKP-1024' },
          { term: 'Property type', definition: 'Condominium' },
          { term: 'Ownership', definition: 'Freehold' },
          { term: 'Furnishing', definition: 'Fully furnished' },
          { term: 'Price', definition: '฿8,900,000' },
        ]}
      />
    </div>
  ),
};

/** Empty values (null / undefined / '') are omitted — no "-" placeholders. */
export const OmitsEmptyValues: Story = {
  render: () => (
    <div className="max-w-md">
      <DefinitionList
        items={[
          { term: 'Listing code', definition: 'JKP-2031' },
          { term: 'Ownership', definition: null },
          { term: 'Floor', definition: '' },
          { term: 'Year built', definition: undefined },
          { term: 'Area', definition: '120 sqm' },
        ]}
      />
    </div>
  ),
};

export const QuickSpecsGrid: StoryObj<typeof KeyValueGrid> = {
  render: () => (
    <KeyValueGrid
      items={[
        { label: 'Bedrooms', value: 3 },
        { label: 'Bathrooms', value: 2 },
        { label: 'Area', value: '120 sqm' },
        { label: 'Parking', value: '2 cars' },
      ]}
    />
  ),
};

/** KeyValueGrid also drops empty cells. */
export const QuickSpecsWithGaps: StoryObj<typeof KeyValueGrid> = {
  render: () => (
    <KeyValueGrid
      items={[
        { label: 'Bedrooms', value: 3 },
        { label: 'Bathrooms', value: null },
        { label: 'Area', value: '120 sqm' },
        { label: 'Parking', value: '' },
        { label: 'Floor', value: 12 },
      ]}
    />
  ),
};

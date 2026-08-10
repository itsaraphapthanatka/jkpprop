import type { Metadata } from 'next';
import { ListingShell } from '@/components/listing/ListingShell';

export const metadata: Metadata = { title: 'ทรัพย์ใกล้ท่าเรือแหลมฉบัง | JKP Property' };

export default function PortLaemChabangPage() {
  return <ListingShell preset={{ province: 'ชลบุรี', breadcrumb: 'ท่าเรือแหลมฉบัง' }} />;
}

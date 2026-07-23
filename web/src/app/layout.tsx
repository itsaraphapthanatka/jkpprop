import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JKP Property — นายหน้าโรงงานและโกดังอุตสาหกรรม',
  description:
    'รวมรายการโรงงานและโกดังให้เช่า–ขายทั่วประเทศ ที่ผ่านการตรวจสอบและคัดกรองโดยทีมงานมืออาชีพ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

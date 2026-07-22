const STAT_CARDS = [
  { label: 'Lead ใหม่ (7 วัน)', value: '—' },
  { label: 'Requirement รอตรวจ', value: '—' },
  { label: 'Shortlist รอส่ง', value: '—' },
  { label: 'การเข้าชมสัปดาห์นี้', value: '—' },
  { label: 'ดีลที่เปิดอยู่', value: '—' },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-content-primary">แดชบอร์ด</h1>
      <p className="mt-1 text-sm text-content-secondary">
        ภาพรวมงานขาย (stat cards + funnel + activities จะต่อ API ใน Phase FE-4)
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-line-subtle bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="text-2xl font-bold text-content-primary">{card.value}</div>
            <div className="mt-1 text-sm text-content-secondary">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

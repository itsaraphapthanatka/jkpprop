import type { Social, SocialKey } from '@/lib/server/company';

/* One row of contact icons, used by the contact page and both footers.
 *
 * All three rendered `href="#"` before — eighteen dead links across the site,
 * each looking like a way to reach the company. A channel with no link in
 * /admin/company now renders no icon at all. */

const PATHS: Record<SocialKey, string> = {
  line: 'M21 11.5a8.4 8.4 0 01-9 8.4c-1.5 0-2.9-.4-4.1-1L3 20l1.2-4.3A8.2 8.2 0 013 11.5C3 6.8 7 3 12 3s9 3.8 9 8.5z',
  facebook: 'M15 3h-2.5A4.5 4.5 0 008 7.5V10H5.5v3.5H8V21h3.5v-7.5H14l.5-3.5h-3V7.5c0-.6.4-1 1-1H15z',
  whatsapp: 'M3 21l1.9-5.7A9 9 0 1112 21a9 9 0 01-4.6-1.3z',
  instagram: 'M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4z',
};
const LABEL: Record<SocialKey, string> = {
  line: 'LINE', facebook: 'Facebook', whatsapp: 'WhatsApp', instagram: 'Instagram',
};

export function SocialLinks({
  socials, style, iconStyle, stroke = 'currentColor',
}: {
  socials: Social[];
  style?: React.CSSProperties;
  iconStyle?: React.CSSProperties;
  stroke?: string;
}) {
  if (!socials.length) return null;
  return (
    <div style={{ display: 'flex', gap: 10, ...style }}>
      {socials.map((s) => (
        <a
          key={s.key}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={LABEL[s.key]}
          title={LABEL[s.key]}
          style={iconStyle}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8">
            {s.key === 'instagram' && <circle cx="17" cy="7" r="1" />}
            {s.key === 'instagram' && <circle cx="12" cy="12" r="3.5" />}
            <path d={PATHS[s.key]} />
          </svg>
        </a>
      ))}
    </div>
  );
}

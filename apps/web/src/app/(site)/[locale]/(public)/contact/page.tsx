import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { buttonVariants, cn } from '@jkp/ui';
import type { Locale } from '@jkp/domain';
import { alternates } from '@/lib/seo';
import { ContactForm } from '@/components/contact/contact-form';

/**
 * Contact route (FR-PUB-04): /[locale]/contact.
 * Two-column trust page — the intake form (client) on the left, a static
 * channels panel (phones, email, messaging apps, hours, office, map) rendered
 * server-side on the right. A trust page, so it stays indexable (no noindex).
 */

type PageParams = { locale: string };

// Placeholder contact points until real numbers/office are wired in.
const SALES_PHONE = '+66 2 000 0000';
const GENERAL_PHONE = '+66 2 000 0001';
const EMAIL = 'hello@jkpproperty.example';

const telHref = (n: string) => `tel:${n.replace(/\s+/g, '')}`;

// Messaging apps are brand proper-nouns (exempt from i18n).
const CHANNELS = [
  { key: 'line', label: 'LINE', href: 'https://line.me' },
  { key: 'wechat', label: 'WeChat', href: 'weixin://' },
  { key: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me/' },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as Locale;
  const t = await getTranslations({ locale: l, namespace: 'contact' });
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: alternates(l, '/contact'),
  };
}

export default async function ContactPage({ params }: { params: Promise<PageParams> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = await getTranslations({ locale: l, namespace: 'contact' });

  return (
    <section className="mx-auto max-w-content px-4 py-16">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold text-content-primary">{t('title')}</h1>
        <p className="mt-3 text-content-secondary">{t('subtitle')}</p>
      </header>

      <div className="mt-10 lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">
        {/* LEFT — intake form */}
        <div className="rounded-lg border border-line bg-surface-card p-6 shadow-sm">
          <ContactForm locale={l} />
        </div>

        {/* RIGHT — channels panel */}
        <aside className="mt-8 space-y-6 lg:mt-0">
          <div className="rounded-lg border border-line bg-surface-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-content-primary">{t('channelsTitle')}</h2>

            <div className="mt-4 space-y-4 text-sm">
              {/* Phones */}
              <div className="flex items-start gap-3">
                <Phone
                  className="mt-0.5 size-5 shrink-0 text-brand-600"
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-content-muted">{t('salesTeam')}</p>
                  <a
                    href={telHref(SALES_PHONE)}
                    className="font-medium text-content-primary transition-colors hover:text-brand-700"
                  >
                    {SALES_PHONE}
                  </a>
                  <p className="mt-2 text-content-muted">{t('generalLine')}</p>
                  <a
                    href={telHref(GENERAL_PHONE)}
                    className="font-medium text-content-primary transition-colors hover:text-brand-700"
                  >
                    {GENERAL_PHONE}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3 border-t border-line-subtle pt-4">
                <Mail
                  className="mt-0.5 size-5 shrink-0 text-brand-600"
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-content-muted">{t('emailLabel')}</p>
                  <a
                    href={`mailto:${EMAIL}`}
                    className="break-all font-medium text-content-primary transition-colors hover:text-brand-700"
                  >
                    {EMAIL}
                  </a>
                </div>
              </div>

              {/* Messaging apps */}
              <div className="border-t border-line-subtle pt-4">
                <p className="text-content-muted">{t('viaTitle')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CHANNELS.map((c) => (
                    <a
                      key={c.key}
                      href={c.href}
                      aria-label={c.label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      <MessageCircle className="size-4" strokeWidth={1.7} aria-hidden="true" />
                      {c.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Business hours */}
              <div className="flex items-start gap-3 border-t border-line-subtle pt-4">
                <Clock
                  className="mt-0.5 size-5 shrink-0 text-brand-600"
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-content-muted">{t('hoursTitle')}</p>
                  <p className="font-medium text-content-primary">{t('hours')}</p>
                </div>
              </div>

              {/* Office */}
              <div className="flex items-start gap-3 border-t border-line-subtle pt-4">
                <MapPin
                  className="mt-0.5 size-5 shrink-0 text-brand-600"
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-content-muted">{t('addressTitle')}</p>
                  <p className="font-medium text-content-primary">{t('address')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map placeholder (no live embed yet) */}
          <div className="rounded-lg border border-line bg-surface-card p-6 shadow-sm">
            <p className="text-sm text-content-muted">{t('mapTitle')}</p>
            <div className="mt-2 flex aspect-video items-center justify-center rounded-md border border-line-subtle bg-surface-muted">
              <MapPin
                className="size-8 text-content-muted"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span className="sr-only">{t('mapTitle')}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

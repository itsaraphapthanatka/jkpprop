import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ClipboardList,
  Factory,
  Handshake,
  ListChecks,
  Route,
  ShieldCheck,
} from 'lucide-react';
import { cn, buttonVariants } from '@jkp/ui';
import type { Locale } from '@jkp/domain';
import { Link } from '@/i18n/navigation';
import { getFeaturedListings, getTaxonomy } from '@/data/listings';
import { ListingCard } from '@/components/listing/listing-card';
import { QuickSearch } from '@/components/home/quick-search';
import { JsonLd, organizationJsonLd, webSiteJsonLd, alternates } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return {
    title: t('eyebrow'),
    description: t('subtitle'),
    alternates: alternates(locale as Locale, '/'),
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('home');

  const featured = await getFeaturedListings(6);
  const taxonomy = getTaxonomy();

  const steps = [
    { icon: ClipboardList, title: t('step1Title'), desc: t('step1Desc') },
    { icon: ListChecks, title: t('step2Title'), desc: t('step2Desc') },
    { icon: CalendarCheck, title: t('step3Title'), desc: t('step3Desc') },
    { icon: Handshake, title: t('step4Title'), desc: t('step4Desc') },
  ];

  const reasons = [
    { icon: Factory, title: t('why1Title'), desc: t('why1Desc') },
    { icon: ShieldCheck, title: t('why2Title'), desc: t('why2Desc') },
    { icon: Route, title: t('why3Title'), desc: t('why3Desc') },
  ];

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={webSiteJsonLd()} />

      {/* Hero */}
      <section className="border-b border-line-subtle bg-surface-alt">
        <div className="mx-auto max-w-wide px-4 py-16 md:py-24">
          <p className="text-xs font-bold uppercase tracking-eyebrow text-accent">{t('eyebrow')}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-content-primary md:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-content-secondary">{t('subtitle')}</p>

          <div className="mt-8">
            <QuickSearch taxonomy={taxonomy} locale={locale} />
          </div>

          <div className="mt-6">
            <Link
              href="/requirement"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
            >
              {t('ctaRequirement')}
            </Link>
          </div>
        </div>
      </section>

      {/* Featured rail */}
      <section className="mx-auto max-w-wide px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-content-primary">{t('featuredTitle')}</h2>
            <p className="mt-2 text-content-secondary">{t('featuredSubtitle')}</p>
          </div>
          <Link
            href="/listing"
            className={cn(buttonVariants({ variant: 'outline', size: 'md' }))}
          >
            {t('viewAll')}
            <ArrowRight className="size-4" strokeWidth={1.7} aria-hidden />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface-alt">
        <div className="mx-auto max-w-wide px-4 py-16">
          <h2 className="text-3xl font-bold text-content-primary">{t('howTitle')}</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="flex flex-col gap-3 rounded-md border border-line-subtle bg-surface-card p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-full bg-brand-50 text-brand-600">
                      <Icon className="size-6" strokeWidth={1.7} aria-hidden />
                    </span>
                    <span className="font-mono text-2xl font-bold text-content-muted">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-content-primary">{step.title}</h3>
                  <p className="text-sm text-content-secondary">{step.desc}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Why JKP */}
      <section className="mx-auto max-w-wide px-4 py-16">
        <h2 className="text-3xl font-bold text-content-primary">{t('whyTitle')}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {reasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <div
                key={reason.title}
                className="flex flex-col gap-3 rounded-md border border-line-subtle bg-surface-card p-6 shadow-sm"
              >
                <span className="grid size-12 place-items-center rounded-full bg-surface-tint text-accent">
                  <Icon className="size-6" strokeWidth={1.7} aria-hidden />
                </span>
                <h3 className="text-xl font-semibold text-content-primary">{reason.title}</h3>
                <p className="text-content-secondary">{reason.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-surface-alt">
        <div className="mx-auto max-w-wide px-4 py-14">
          <p className="text-center text-xs font-bold uppercase tracking-eyebrow text-content-muted">
            {t('trustTitle')}
          </p>
          <ul
            className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6"
            aria-hidden
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="grid h-16 w-32 place-items-center rounded-md border border-line-subtle bg-surface-muted"
              >
                <BadgeCheck className="size-7 text-content-muted3" strokeWidth={1.4} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-wide px-4 py-16">
        <div className="flex flex-col items-start gap-6 rounded-xl bg-gradient-emerald p-8 text-white md:flex-row md:items-center md:justify-between md:p-12">
          <div>
            <h2 className="text-3xl font-bold">{t('ctaBandTitle')}</h2>
            <p className="mt-3 max-w-xl text-white/85">{t('ctaBandText')}</p>
          </div>
          <Link
            href="/requirement"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-6 font-semibold text-brand-700 shadow-sm transition-all duration-fast ease-standard hover:-translate-y-0.5 hover:shadow-glow focus-visible:shadow-focus-contrast focus-visible:outline-none"
          >
            {t('ctaRequirement')}
            <ArrowRight className="size-5" strokeWidth={1.7} aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadCmsPage, listCmsPages } from '@/lib/server/cmsPages';
import { loadCompany } from '@/lib/server/company';
import { isLocale, DEFAULT_LOCALE } from '@/i18n/config';
import { ContentHeader } from '@/components/site/ContentHeader';
import { ContentFooter } from '@/components/site/ContentFooter';
import { CONTENT_CSS } from '@/components/site/contentCss';
import { loadNavOrder } from '@/lib/server/navOrder';

/* Renders a CMS "pages" document — privacy policy, terms, anything else the
   team publishes. The body is sanitised in the loader before it gets here. */

type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const doc = await loadCmsPage(slug, locale).catch(() => null);
  if (!doc) return {};
  return { title: `${doc.title} | JKP Property`, description: doc.excerpt };
}

export default async function CmsDocPage({ params }: Params) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  const [doc, company, pages] = await Promise.all([
    loadCmsPage(slug, locale).catch(() => null),
    loadCompany(locale),
    listCmsPages(locale).catch(() => []),
  ]);
  if (!doc) notFound();

  /* ลำดับเมนูที่ทีมจัดไว้ในหลังบ้าน (สไลด์ 5) */

  const navOrder = await loadNavOrder();


  return (
    <div style={{ width: '100%', background: 'var(--bg)', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: CONTENT_CSS }} />
      <ContentHeader navOrder={navOrder} />
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.01em' }}>{doc.title}</h1>
        <div
          style={{ marginTop: 24, fontSize: 15, color: 'var(--muted)', lineHeight: 1.9 }}
          dangerouslySetInnerHTML={{ __html: doc.html }}
        />
      </main>
      <ContentFooter
        email={company.generalEmail}
        phone={company.phones[0]?.number}
        location={company.shortLocation}
        socials={company.socials}
        pages={pages}
      />
    </div>
  );
}

'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import {
  AlertBanner,
  Button,
  InlineError,
  TextInput,
  Textarea,
  buttonVariants,
  cn,
} from '@jkp/ui';
import { ApiRequestError, fetchApi } from '@jkp/api-client';

/**
 * InquiryForm (FE-2 detail sidebar). Prefilled with the property code for
 * context. Submits a listing-bound inquiry to POST /public/inquiries
 * (FR-INQ-01/03) using the shared `contactInquirySchema` on the server. Still
 * requires at least one reachable channel (email OR phone) client-side, but the
 * server now enforces it too; on failure the entered values are preserved and
 * `ApiRequestError.fieldErrors()` maps back onto the inline fields. Field labels
 * come from the `detail` namespace, error copy from `errors`; the messaging
 * channels are brand proper-nouns (exempt from i18n).
 */
interface InquiryFormProps {
  publicCode: string;
  listingId: string;
  title: string;
}

type FieldValues = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export function InquiryForm({ publicCode, listingId, title }: InquiryFormProps) {
  const t = useTranslations('detail');
  const tError = useTranslations('errors');
  const locale = useLocale();
  const [values, setValues] = useState<FieldValues>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FieldValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const update =
    (key: keyof FieldValues) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  /** Translate a stable error CODE, falling back to the generic message. */
  const translateError = (code: string | undefined): string =>
    code && tError.has(code) ? tError(code) : tError('generic');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    // At least one reachable channel is required (server enforces this too).
    if (!values.email.trim() && !values.phone.trim()) {
      setFieldErrors({ email: 'contact_required' });
      setSuccess(false);
      return;
    }

    setSubmitting(true);
    try {
      await fetchApi('/public/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone,
          message: values.message,
          listingId,
          publicCode,
          locale,
          sourceChannel: 'listing_inquiry',
          hp: '',
        }),
      });
      setSuccess(true);
    } catch (err) {
      setSuccess(false);
      if (err instanceof ApiRequestError) {
        const mapped: Partial<Record<keyof FieldValues, string>> = {};
        for (const [field, code] of Object.entries(err.fieldErrors())) {
          if (field === 'name' || field === 'email' || field === 'phone' || field === 'message') {
            mapped[field] = code;
          }
        }
        setFieldErrors(mapped);
        const fieldless = err.errors.find((x) => !x.field);
        if (fieldless) {
          setFormError(translateError(fieldless.message));
        } else if (Object.keys(mapped).length === 0) {
          setFormError(tError('generic'));
        }
      } else {
        setFormError(tError('generic'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const encoded = encodeURIComponent(`${publicCode} — ${title}`);
  const channels = [
    { key: 'line', label: 'LINE', href: `https://line.me/R/msg/text/?${encoded}` },
    { key: 'wechat', label: 'WeChat', href: 'weixin://' },
    { key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${encoded}` },
  ] as const;

  return (
    <div className="rounded-lg border border-line bg-surface-card p-5 shadow-sm">
      <h2 className="text-lg font-bold text-content-primary">{t('inquiryTitle')}</h2>
      <p className="mt-1 text-sm text-content-muted">
        {t('code')}: <span className="font-mono text-content-secondary">{publicCode}</span>
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
        <input type="hidden" name="listingId" value={listingId} />
        <input type="hidden" name="publicCode" value={publicCode} />

        {formError ? <AlertBanner variant="danger">{formError}</AlertBanner> : null}

        <div>
          <TextInput
            name="name"
            label={t('inquiryName')}
            autoComplete="name"
            value={values.name}
            onChange={update('name')}
          />
          {fieldErrors.name ? (
            <InlineError>{translateError(fieldErrors.name)}</InlineError>
          ) : null}
        </div>
        <div>
          <TextInput
            name="email"
            type="email"
            label={t('inquiryEmail')}
            autoComplete="email"
            value={values.email}
            onChange={update('email')}
          />
          {fieldErrors.email ? (
            <InlineError>{translateError(fieldErrors.email)}</InlineError>
          ) : null}
        </div>
        <div>
          <TextInput
            name="phone"
            type="tel"
            label={t('inquiryPhone')}
            autoComplete="tel"
            value={values.phone}
            onChange={update('phone')}
          />
          {fieldErrors.phone ? (
            <InlineError>{translateError(fieldErrors.phone)}</InlineError>
          ) : null}
        </div>
        <div>
          <Textarea
            name="message"
            label={t('inquiryMessage')}
            rows={4}
            value={values.message}
            onChange={update('message')}
          />
          {fieldErrors.message ? (
            <InlineError>{translateError(fieldErrors.message)}</InlineError>
          ) : null}
        </div>

        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {t('inquirySubmit')}
        </Button>

        {success ? (
          <p
            role="status"
            className="rounded-md bg-success-subtle px-3 py-2 text-sm font-medium text-success-text"
          >
            {t('inquirySuccess')}
          </p>
        ) : null}
      </form>

      <div className="mt-5 border-t border-line-subtle pt-4">
        <p className="text-sm text-content-muted">{t('inquiryVia')}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {channels.map((c) => (
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
    </div>
  );
}

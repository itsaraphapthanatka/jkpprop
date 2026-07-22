'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { AlertBanner, Button, InlineError, TextInput, Textarea } from '@jkp/ui';
import { ApiRequestError, fetchApi } from '@jkp/api-client';
import type { Locale } from '@jkp/domain';
import { contactInquirySchema, type ContactInquiryInput } from '@/data/intake';

/**
 * ContactForm (FR-PUB-04, FR-INQ-01/03) — the contact-page intake form.
 *
 * Shares ONE zod schema (`contactInquirySchema`) with the server route, so
 * client and server validation can never drift. Field error `message`s are
 * stable CODES (from zod or the API envelope) that render through the `errors`
 * i18n namespace — never hardcoded prose. Submits to POST /public/inquiries and
 * maps `ApiRequestError.fieldErrors()` back onto the form.
 */
interface ContactFormProps {
  locale: Locale;
}

// Fields that can carry a server-mapped inline error.
type ContactField = keyof ContactInquiryInput;

export function ContactForm({ locale }: ContactFormProps) {
  const t = useTranslations('contact');
  const tError = useTranslations('errors');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInquiryInput>({
    resolver: zodResolver(contactInquirySchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      publicCode: '',
      locale,
      sourceChannel: 'contact_page',
      hp: '',
    },
  });

  /** Translate a stable error CODE, falling back to the generic message. */
  const translateError = (code: string | undefined): string =>
    code && tError.has(code) ? tError(code) : tError('generic');

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await fetchApi('/public/inquiries', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const fieldErrors = err.fieldErrors();
        let mappedAny = false;
        for (const [field, code] of Object.entries(fieldErrors)) {
          // Store the raw CODE in `message`; it is translated at render time.
          setError(field as ContactField, { message: code });
          mappedAny = true;
        }
        const fieldless = err.errors.find((e) => !e.field);
        if (fieldless) {
          setFormError(translateError(fieldless.message));
        } else if (!mappedAny) {
          setFormError(tError('generic'));
        }
      } else {
        setFormError(tError('generic'));
      }
    }
  });

  if (submitted) {
    return (
      <div className="space-y-4">
        <AlertBanner variant="success">{t('success')}</AlertBanner>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset();
            setSubmitted(false);
            setFormError(null);
          }}
        >
          {t('sendAnother')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError ? <AlertBanner variant="danger">{formError}</AlertBanner> : null}

      {/* Honeypot — hidden from users, tempting to bots. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        {...register('hp')}
      />

      <div>
        <TextInput label={t('name')} autoComplete="name" {...register('name')} />
        {errors.name ? (
          <InlineError>{translateError(errors.name.message)}</InlineError>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <TextInput
            type="email"
            label={t('email')}
            autoComplete="email"
            {...register('email')}
          />
          {errors.email ? (
            <InlineError>{translateError(errors.email.message)}</InlineError>
          ) : null}
        </div>
        <div>
          <TextInput
            type="tel"
            label={t('phone')}
            autoComplete="tel"
            {...register('phone')}
          />
          {errors.phone ? (
            <InlineError>{translateError(errors.phone.message)}</InlineError>
          ) : null}
        </div>
      </div>

      <div>
        <TextInput label={t('subject')} {...register('subject')} />
        {errors.subject ? (
          <InlineError>{translateError(errors.subject.message)}</InlineError>
        ) : null}
      </div>

      <div>
        <TextInput label={t('listingOfInterest')} {...register('publicCode')} />
        {errors.publicCode ? (
          <InlineError>{translateError(errors.publicCode.message)}</InlineError>
        ) : null}
      </div>

      <div>
        <Textarea label={t('message')} rows={5} maxLength={2000} {...register('message')} />
        {errors.message ? (
          <InlineError>{translateError(errors.message.message)}</InlineError>
        ) : null}
      </div>

      <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}

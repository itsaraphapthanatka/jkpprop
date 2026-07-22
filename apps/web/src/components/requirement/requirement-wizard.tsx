'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  Controller,
  useFieldArray,
  useForm,
  type FieldError,
  type FieldPath,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Check, Plus, Trash2 } from 'lucide-react';
import type { Locale, PropertyType, ZoneType } from '@jkp/domain';
import { ApiRequestError, fetchApi } from '@jkp/api-client';
import {
  AlertBanner,
  Badge,
  Button,
  DateInput,
  InlineError,
  Label,
  NumberRangeInput,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  TextInput,
  Textarea,
  buttonVariants,
  cn,
} from '@jkp/ui';
import { requirementSchema, type RequirementInput } from '@/data/intake';
import { localize, type Taxonomy } from '@/data/types';
import { Link } from '@/i18n/navigation';

/**
 * RequirementWizard (FR-INQ-02/03/04) — a 3-step intake form built on the shared
 * `requirementSchema` (react-hook-form + zodResolver), so client and server
 * validation can never drift. Field names match the schema keys exactly, which
 * means the API's `errors[].field` maps straight back onto each control.
 *
 * Error handling is uniform: every field error is stored as a stable CODE (the
 * zod `message` IS the code) and translated at render via the `errors` namespace
 * — including server field errors, which we store as codes rather than
 * pre-translated strings so a single render path covers both sources.
 */

export interface RequirementPrefill {
  propertyType: PropertyType | null;
  transactionType: 'rent' | 'sale' | null;
  province: string | null;
  zoneType: ZoneType | null;
  sizeMin: number | null;
  sizeMax: number | null;
}

interface RequirementWizardProps {
  taxonomy: Taxonomy;
  locale: string;
  prefill: RequirementPrefill;
}

/** Radix Select forbids an empty item value, so "no preference" uses a sentinel. */
const ANY = '__any__';
const TOTAL_STEPS = 3;

/** Which schema fields are validated before advancing past each step. */
const STEP_FIELDS: FieldPath<RequirementInput>[][] = [
  [
    'operationType',
    'propertyType',
    'transactionType',
    'needFactoryLicense',
    'sizeMin',
    'sizeMax',
    'rentMin',
    'rentMax',
    'saleMin',
    'saleMax',
    'moveInDate',
    'nearPort',
    'nearAirport',
    'nearBangkok',
    'locations',
    'notes',
  ],
  ['companyName', 'registrationCountry', 'website', 'businessType'],
  ['contactName', 'email', 'phone'],
];

const OPERATION_OPTIONS = ['manufacturing', 'assembly', 'storage', 'logistics'] as const;

function toISODate(d: Date | undefined): string | null {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromISODate(s: string | null | undefined): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

const reviewDateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

interface WizardSelectProps {
  id: string;
  label: string;
  placeholder: string;
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}

/** Shared label + Radix Select + inline error, with aria wired to the trigger. */
function WizardSelect({
  id,
  label,
  placeholder,
  value,
  onValueChange,
  options,
  error,
}: WizardSelectProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <InlineError id={errorId}>{error}</InlineError> : null}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: ReactNode }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-line-subtle py-2 last:border-b-0 sm:flex-row sm:gap-4">
      <dt className="w-48 shrink-0 text-sm text-content-muted">{label}</dt>
      <dd className="min-w-0 text-sm text-content-primary">{value}</dd>
    </div>
  );
}

export function RequirementWizard({ taxonomy, locale, prefill }: RequirementWizardProps) {
  const loc = locale as Locale;
  const t = useTranslations('requirement');
  const te = useTranslations('errors');
  const tf = useTranslations('filters');
  const tn = useTranslations('nav');

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [formErrorCode, setFormErrorCode] = useState<string | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const defaultValues: RequirementInput = {
    operationType: null,
    propertyType: prefill.propertyType ?? null,
    transactionType: prefill.transactionType ?? null,
    needFactoryLicense: false,
    sizeMin: prefill.sizeMin ?? null,
    sizeMax: prefill.sizeMax ?? null,
    rentMin: null,
    rentMax: null,
    saleMin: null,
    saleMax: null,
    moveInDate: null,
    nearPort: false,
    nearAirport: false,
    nearBangkok: false,
    locations: [{ province: prefill.province ?? '', priority: 1 }],
    notes: '',
    companyName: '',
    registrationCountry: '',
    website: '',
    businessType: '',
    contactName: '',
    email: '',
    phone: '',
    locale: loc,
    sourceChannel: 'requirement_form',
    hp: '',
  };

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RequirementInput>({
    resolver: zodResolver(requirementSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'locations' });
  const values = watch();

  // ---- i18n error helpers: the zod `message` is a stable code. ----
  const errMsg = (code?: string): string | undefined => {
    if (!code) return undefined;
    if (te.has(code)) return te(code);
    const lower = code.toLowerCase();
    if (te.has(lower)) return te(lower);
    return te('generic');
  };
  const errText = (code: string | null): string => errMsg(code ?? undefined) ?? te('generic');
  const fieldError = (name: keyof RequirementInput): string | undefined => {
    const e = errors[name] as FieldError | undefined;
    return e?.message ? errMsg(e.message) : undefined;
  };

  // ---- Option lists (taxonomy labels localized). ----
  const propertyTypeOptions = [
    { value: ANY, label: t('anyOption') },
    ...taxonomy.propertyTypes.map((o) => ({ value: o.value, label: localize(o.label, loc) })),
  ];
  const transactionOptions = [
    { value: ANY, label: t('anyOption') },
    { value: 'rent', label: tf('rent') },
    { value: 'sale', label: tf('sale') },
  ];
  const provinceOptions = taxonomy.provinces.map((o) => ({
    value: o.value,
    label: localize(o.label, loc),
  }));
  const provinceLabel = useMemo(
    () => new Map(provinceOptions.map((o) => [o.value, o.label])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale],
  );
  const propertyTypeLabel = useMemo(
    () => new Map(taxonomy.propertyTypes.map((o) => [o.value, localize(o.label, loc)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale],
  );

  // ---- Step navigation ----
  const goNext = async () => {
    const ok = await trigger(STEP_FIELDS[step]);
    if (ok) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const stepOfField = (field: string): number => {
    const base = field.split('.')[0];
    const idx = STEP_FIELDS.findIndex((group) => group.includes(base as FieldPath<RequirementInput>));
    return idx === -1 ? TOTAL_STEPS - 1 : idx;
  };

  // ---- Submit ----
  const onSubmit = async (raw: RequirementInput) => {
    if (step !== TOTAL_STEPS - 1) return; // guard stray Enter submits on earlier steps
    setFormErrorCode(null);

    const payload: RequirementInput = {
      ...raw,
      // Priority always mirrors the row order (add/remove keeps it consistent).
      locations: raw.locations.map((l, i) => ({ province: l.province, priority: i + 1 })),
    };

    try {
      await fetchApi('/public/requirements', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        let earliestStep = TOTAL_STEPS - 1;
        let hadFieldError = false;
        for (const e of err.errors) {
          if (e.field) {
            hadFieldError = true;
            // Store the CODE; it is translated uniformly at render time.
            setError(e.field as FieldPath<RequirementInput>, { message: e.code });
            earliestStep = Math.min(earliestStep, stepOfField(e.field));
          }
        }
        const formLevel = err.errors.find((e) => !e.field);
        if (formLevel) setFormErrorCode(formLevel.code);
        else if (!hadFieldError) setFormErrorCode('generic');
        if (hadFieldError) setStep(earliestStep);
      } else {
        setFormErrorCode('generic');
      }
    }
  };

  // ---- Success panel ----
  if (submitted) {
    return (
      <div className="rounded-lg border border-line bg-surface-card p-6 shadow-sm">
        <AlertBanner variant="success" title={t('successTitle')}>
          {t('successText')}
        </AlertBanner>
        <div className="mt-6">
          <Link href="/" className={cn(buttonVariants({ variant: 'primary' }))}>
            {tn('home')}
          </Link>
        </div>
      </div>
    );
  }

  const stepLabels = [t('stepNeeds'), t('stepCompany'), t('stepContact')];

  // ---- Derived review values ----
  const rangeText = (min?: number | null, max?: number | null): string | undefined => {
    if (min == null && max == null) return undefined;
    return `${min ?? '…'} – ${max ?? '…'}`;
  };
  const proximityChips = [
    values.nearPort ? t('nearPort') : null,
    values.nearAirport ? t('nearAirport') : null,
    values.nearBangkok ? t('nearBangkok') : null,
  ].filter((x): x is string => Boolean(x));
  const txnReviewLabel =
    values.transactionType === 'rent'
      ? tf('rent')
      : values.transactionType === 'sale'
        ? tf('sale')
        : values.transactionType === 'both'
          ? t('anyOption')
          : undefined;
  const moveInReview = (() => {
    const d = fromISODate(values.moveInDate);
    return d ? reviewDateFmt.format(d) : undefined;
  })();

  const locationsRootError =
    (errors.locations as unknown as FieldError | undefined)?.message ??
    (errors.locations as { root?: FieldError } | undefined)?.root?.message;
  const locProvError = (index: number): string | undefined => {
    const rowErrors = errors.locations as
      | Array<{ province?: FieldError } | undefined>
      | undefined;
    return rowErrors?.[index]?.province ? errMsg('required') : undefined;
  };

  const sectionHeading = 'text-base font-semibold text-content-primary';

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="relative rounded-lg border border-line bg-surface-card p-6 shadow-sm sm:p-8"
    >
      {/* Honeypot — hidden from users and assistive tech; bots that fill it are rejected server-side. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] top-0 h-px w-px overflow-hidden opacity-0"
      >
        <label>
          Leave this field empty
          <input type="text" tabIndex={-1} autoComplete="off" {...register('hp')} />
        </label>
      </div>

      {/* Progress header + stepper */}
      <div className="mb-8">
        <p className="text-sm font-medium text-content-muted">
          {t('progress', { step: step + 1, total: TOTAL_STEPS })}
        </p>
        <ol className="mt-3 flex items-center gap-2">
          {stepLabels.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  i <= step ? 'bg-brand-600 text-white' : 'bg-surface-muted text-content-muted',
                )}
              >
                {i < step ? <Check className="size-4" strokeWidth={2} aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  'truncate text-sm',
                  i === step ? 'font-semibold text-content-primary' : 'text-content-muted',
                )}
              >
                {label}
              </span>
              {i < TOTAL_STEPS - 1 ? (
                <span className="hidden h-px flex-1 bg-line sm:block" aria-hidden />
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      {/* Live region announcing the active step to assistive tech. */}
      <div aria-live="polite" className="sr-only">
        {t('progress', { step: step + 1, total: TOTAL_STEPS })}
      </div>

      {formErrorCode ? (
        <div className="mb-6">
          <AlertBanner variant="danger">{errText(formErrorCode)}</AlertBanner>
        </div>
      ) : null}

      {/* ---------------- Step 1: needs ---------------- */}
      {step === 0 ? (
        <fieldset className="space-y-6">
          <legend className="sr-only">{t('stepNeeds')}</legend>

          {/* Operation type */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('operationType')}</Label>
            <Controller
              control={control}
              name="operationType"
              render={({ field }) => (
                <RadioGroup
                  value={field.value ?? ''}
                  onValueChange={(v) => field.onChange(v || null)}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                >
                  {OPERATION_OPTIONS.map((op) => (
                    <label
                      key={op}
                      htmlFor={`op-${op}`}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-content-primary transition-colors duration-fast hover:bg-surface-muted"
                    >
                      <RadioGroupItem id={`op-${op}`} value={op} />
                      <span>{t(`op_${op}`)}</span>
                    </label>
                  ))}
                </RadioGroup>
              )}
            />
            {fieldError('operationType') ? (
              <InlineError>{fieldError('operationType')}</InlineError>
            ) : null}
          </div>

          {/* Property type + transaction type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="propertyType"
              render={({ field }) => (
                <WizardSelect
                  id="propertyType"
                  label={t('propertyType')}
                  placeholder={t('anyOption')}
                  value={field.value ?? ANY}
                  onValueChange={(v) => field.onChange(v === ANY ? null : (v as PropertyType))}
                  options={propertyTypeOptions}
                  error={fieldError('propertyType')}
                />
              )}
            />
            <Controller
              control={control}
              name="transactionType"
              render={({ field }) => (
                <WizardSelect
                  id="transactionType"
                  label={t('transactionType')}
                  placeholder={t('anyOption')}
                  value={field.value ?? ANY}
                  onValueChange={(v) =>
                    field.onChange(v === ANY ? null : (v as 'rent' | 'sale'))
                  }
                  options={transactionOptions}
                  error={fieldError('transactionType')}
                />
              )}
            />
          </div>

          {/* Factory license */}
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="needFactoryLicense">{t('needLicense')}</Label>
            <Controller
              control={control}
              name="needFactoryLicense"
              render={({ field }) => (
                <Switch
                  id="needFactoryLicense"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Size + budgets */}
          <div className="flex flex-col gap-1.5">
            <NumberRangeInput
              label={t('size')}
              minValue={values.sizeMin ?? null}
              maxValue={values.sizeMax ?? null}
              placeholderMin={tf('min')}
              placeholderMax={tf('max')}
              onChange={({ min, max }) => {
                setValue('sizeMin', min, { shouldValidate: true });
                setValue('sizeMax', max, { shouldValidate: true });
              }}
            />
            {fieldError('sizeMax') ? <InlineError>{fieldError('sizeMax')}</InlineError> : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <NumberRangeInput
                label={t('rentBudget')}
                minValue={values.rentMin ?? null}
                maxValue={values.rentMax ?? null}
                placeholderMin={tf('min')}
                placeholderMax={tf('max')}
                onChange={({ min, max }) => {
                  setValue('rentMin', min, { shouldValidate: true });
                  setValue('rentMax', max, { shouldValidate: true });
                }}
              />
              {fieldError('rentMax') ? <InlineError>{fieldError('rentMax')}</InlineError> : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <NumberRangeInput
                label={t('saleBudget')}
                minValue={values.saleMin ?? null}
                maxValue={values.saleMax ?? null}
                placeholderMin={tf('min')}
                placeholderMax={tf('max')}
                onChange={({ min, max }) => {
                  setValue('saleMin', min, { shouldValidate: true });
                  setValue('saleMax', max, { shouldValidate: true });
                }}
              />
              {fieldError('saleMax') ? <InlineError>{fieldError('saleMax')}</InlineError> : null}
            </div>
          </div>

          {/* Move-in date */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('moveIn')}</Label>
            <Controller
              control={control}
              name="moveInDate"
              render={({ field }) => (
                <DateInput
                  value={fromISODate(field.value)}
                  onChange={(d) => field.onChange(toISODate(d))}
                  disabled={(date) => date < today}
                />
              )}
            />
            {fieldError('moveInDate') ? (
              <InlineError>{fieldError('moveInDate')}</InlineError>
            ) : null}
          </div>

          {/* Proximity toggles */}
          <fieldset className="space-y-3">
            <legend className={sectionHeading}>{t('proximityTitle')}</legend>
            {(
              [
                ['nearPort', t('nearPort')],
                ['nearAirport', t('nearAirport')],
                ['nearBangkok', t('nearBangkok')],
              ] as const
            ).map(([name, label]) => (
              <div key={name} className="flex items-center justify-between gap-3">
                <Label htmlFor={name}>{label}</Label>
                <Controller
                  control={control}
                  name={name}
                  render={({ field }) => (
                    <Switch id={name} checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            ))}
          </fieldset>

          {/* Locations (priority-ordered, 1..5) */}
          <fieldset className="space-y-3">
            <legend className={sectionHeading}>{t('locationsTitle')}</legend>
            <div className="space-y-3">
              {fields.map((f, index) => (
                <div key={f.id} className="flex items-end gap-2">
                  <div className="flex w-16 shrink-0 flex-col gap-1.5">
                    <Label>{t('priority')}</Label>
                    <div className="flex h-10 items-center justify-center rounded-md border border-line bg-surface-muted text-sm font-semibold text-content-secondary">
                      {index + 1}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Controller
                      control={control}
                      name={`locations.${index}.province`}
                      render={({ field }) => (
                        <WizardSelect
                          id={`location-${index}`}
                          label={tf('province')}
                          placeholder={tf('province')}
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                          options={provinceOptions}
                          error={locProvError(index)}
                        />
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                    aria-label={t('removeLocation')}
                  >
                    <Trash2 className="size-4" strokeWidth={1.7} aria-hidden />
                  </Button>
                </div>
              ))}
            </div>
            {locationsRootError ? (
              <InlineError>{errMsg(locationsRootError)}</InlineError>
            ) : null}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ province: '', priority: fields.length + 1 })}
                disabled={fields.length >= 5}
              >
                <Plus className="size-4" strokeWidth={1.7} aria-hidden />
                {t('addLocation')}
              </Button>
              <span className="text-sm text-content-muted">{t('locationsHint')}</span>
            </div>
          </fieldset>

          {/* Notes */}
          <Textarea
            label={t('notes')}
            hint={t('optional')}
            maxLength={2000}
            rows={4}
            {...register('notes')}
          />
        </fieldset>
      ) : null}

      {/* ---------------- Step 2: company ---------------- */}
      {step === 1 ? (
        <fieldset className="space-y-6">
          <legend className="sr-only">{t('stepCompany')}</legend>
          <TextInput
            label={t('companyName')}
            autoComplete="organization"
            error={fieldError('companyName')}
            {...register('companyName')}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput
              label={t('registrationCountry')}
              hint={t('optional')}
              autoComplete="country-name"
              error={fieldError('registrationCountry')}
              {...register('registrationCountry')}
            />
            <TextInput
              label={t('businessType')}
              hint={t('optional')}
              error={fieldError('businessType')}
              {...register('businessType')}
            />
          </div>
          <TextInput
            label={t('website')}
            hint={t('optional')}
            type="url"
            inputMode="url"
            autoComplete="url"
            error={fieldError('website')}
            {...register('website')}
          />
        </fieldset>
      ) : null}

      {/* ---------------- Step 3: contact + review ---------------- */}
      {step === 2 ? (
        <fieldset className="space-y-6">
          <legend className="sr-only">{t('stepContact')}</legend>
          <TextInput
            label={t('contactName')}
            autoComplete="name"
            error={fieldError('contactName')}
            {...register('contactName')}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput
              label={t('email')}
              type="email"
              inputMode="email"
              autoComplete="email"
              error={fieldError('email')}
              {...register('email')}
            />
            <TextInput
              label={t('phone')}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              error={fieldError('phone')}
              {...register('phone')}
            />
          </div>

          {/* Review summary */}
          <div className="rounded-md border border-line-subtle bg-surface-alt p-4">
            <h2 className={cn(sectionHeading, 'mb-2')}>{t('reviewTitle')}</h2>
            <dl>
              <ReviewRow
                label={t('operationType')}
                value={values.operationType ? t(`op_${values.operationType}`) : undefined}
              />
              <ReviewRow
                label={t('propertyType')}
                value={
                  values.propertyType ? propertyTypeLabel.get(values.propertyType) : undefined
                }
              />
              <ReviewRow label={t('transactionType')} value={txnReviewLabel} />
              <ReviewRow
                label={t('needLicense')}
                value={values.needFactoryLicense ? tf('license') : undefined}
              />
              <ReviewRow label={t('size')} value={rangeText(values.sizeMin, values.sizeMax)} />
              <ReviewRow
                label={t('rentBudget')}
                value={rangeText(values.rentMin, values.rentMax)}
              />
              <ReviewRow
                label={t('saleBudget')}
                value={rangeText(values.saleMin, values.saleMax)}
              />
              <ReviewRow label={t('moveIn')} value={moveInReview} />
              <ReviewRow
                label={t('proximityTitle')}
                value={
                  proximityChips.length ? (
                    <span className="flex flex-wrap gap-1.5">
                      {proximityChips.map((c) => (
                        <Badge key={c} variant="brand">
                          {c}
                        </Badge>
                      ))}
                    </span>
                  ) : undefined
                }
              />
              <ReviewRow
                label={t('locationsTitle')}
                value={
                  <span className="flex flex-wrap gap-1.5">
                    {values.locations
                      .filter((l) => l.province)
                      .map((l, i) => (
                        <Badge key={`${l.province}-${i}`} variant="neutral">
                          {i + 1}. {provinceLabel.get(l.province) ?? l.province}
                        </Badge>
                      ))}
                  </span>
                }
              />
              <ReviewRow label={t('notes')} value={values.notes || undefined} />
              <ReviewRow label={t('companyName')} value={values.companyName || undefined} />
              <ReviewRow
                label={t('registrationCountry')}
                value={values.registrationCountry || undefined}
              />
              <ReviewRow label={t('businessType')} value={values.businessType || undefined} />
              <ReviewRow label={t('website')} value={values.website || undefined} />
              <ReviewRow label={t('contactName')} value={values.contactName || undefined} />
              <ReviewRow label={t('email')} value={values.email || undefined} />
              <ReviewRow label={t('phone')} value={values.phone || undefined} />
            </dl>
          </div>
        </fieldset>
      ) : null}

      {/* ---------------- Navigation ---------------- */}
      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={goBack}>
            {t('back')}
          </Button>
        ) : (
          <span />
        )}

        {step < TOTAL_STEPS - 1 ? (
          <Button type="button" variant="primary" onClick={goNext}>
            {t('next')}
          </Button>
        ) : (
          <Button type="submit" variant="primary" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? t('submitting') : t('submit')}
          </Button>
        )}
      </div>
    </form>
  );
}

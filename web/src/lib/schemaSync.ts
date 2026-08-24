'use client';

/* ============================================================
   Schema sync — pulls field-schema overrides + type config from the API
   into the same localStorage keys the sync helpers in propertySchema.ts
   already read (jkp.fieldSchema.v1 / jkp.typeConfig.v1).

   This keeps every existing call site (loadOverride / enabledPropertyTypes /
   resolveFields) working unchanged; localStorage is now a cache of the
   server, not the source of truth. Components re-read when the returned
   version number bumps.

   Hydration-safe by construction: first render always uses defaults,
   the fetch lands in an effect (FRONTEND_API_SPEC §2.1).
   ============================================================ */
import { useEffect, useState } from 'react';
import { apiGet } from './apiClient';
import { saveOverride, saveTypeConfig, type SchemaOverride, type TypeConfig } from './propertySchema';

const EVT = 'jkp:schema-synced';
let version = 0;
let adminSynced = false;
let publicSynced = false;

async function syncNow(publicOnly: boolean) {
  try {
    const cfg = await apiGet<TypeConfig>('/api/property-types/config');
    saveTypeConfig({ disabled: Array.isArray(cfg?.disabled) ? cfg.disabled : [] });
    if (!publicOnly) {
      const all = await apiGet<Record<string, SchemaOverride>>('/api/field-schema');
      for (const [typeKey, ov] of Object.entries(all || {})) {
        saveOverride(typeKey, {
          disabled: Array.isArray(ov?.disabled) ? ov.disabled : [],
          order: Array.isArray(ov?.order) ? ov.order : [],
          extra: Array.isArray(ov?.extra) ? ov.extra : [],
          /* ข้อ 10 · ป้าย "บังคับ" ที่ทีมตั้งทับไว้ ต้องตามมาถึงเครื่องด้วย
             ไม่งั้นเปิดหน้าใหม่แล้วกลับไปใช้ค่าตั้งต้นในโค้ดทุกครั้ง */
          required: ov?.required && typeof ov.required === 'object' ? ov.required : {},
          edits: ov?.edits && typeof ov.edits === 'object' ? ov.edits : {},
        });
      }
    }
    version += 1;
    window.dispatchEvent(new Event(EVT));
  } catch {
    // offline / not logged in — keep whatever the cache has (§2.2: never break the form)
  }
}

/**
 * Subscribe a component to schema state. Returns a number that bumps once
 * fresh data has been pulled — put it in the deps of the effect that reads
 * loadOverride()/enabledPropertyTypes() so the form refreshes.
 * `publicOnly` skips the authed /api/field-schema call (use on public pages).
 */
export function useSchemaSync(opts?: { publicOnly?: boolean }): number {
  const publicOnly = !!opts?.publicOnly;
  const [v, setV] = useState(0);
  useEffect(() => {
    const onSync = () => setV(version);
    window.addEventListener(EVT, onSync);
    const already = publicOnly ? publicSynced || adminSynced : adminSynced;
    if (!already) {
      if (publicOnly) publicSynced = true; else adminSynced = true;
      void syncNow(publicOnly);
    } else {
      setV(version);
    }
    return () => window.removeEventListener(EVT, onSync);
  }, [publicOnly]);
  return v;
}

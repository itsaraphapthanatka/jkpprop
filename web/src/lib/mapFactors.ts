/* Which provinces each factor on the home page is actually about, and which
   factor each pin belongs to.
 *
 * These live apart from the map component because the map imports Leaflet's
 * stylesheet, and the test that checks every pin stands inside the province it
 * names has no business loading a CSS file to do it.
 */
export type Factor = 'air' | 'port' | 'bkk' | 'eec';

/** The EEC three are the statutory corridor; the rest follow the pins. */
export const FACTOR_PROVINCES: Record<Factor, string[]> = {
  // the two the panel names: Don Mueang is in Bangkok, Suvarnabhumi in Samut Prakan
  air: ['bangkok', 'samut_prakan'],
  // กรุงเทพฯ อยู่ในหมวดท่าเรือด้วย เพราะท่าเรือคลองเตยอยู่ในกรุงเทพฯ
  port: ['bangkok', 'samut_sakhon', 'chonburi', 'rayong'],
  bkk: ['bangkok', 'nonthaburi', 'samut_prakan', 'pathum_thani'],
  eec: ['chonburi', 'rayong', 'chachoengsao'],
};

export const PIN_FACTORS: Record<string, Factor[]> = {
  'ดอนเมือง': ['air'],
  'สุวรรณภูมิ': ['air'],
  'CBD กรุงเทพฯ': ['bkk'],
  'ท่าเรือคลองเตย': ['port'],
  'ท่าเรือมหาชัย': ['port'],
  'ท่าเรือแหลมฉบัง': ['port', 'eec'],
  'ท่าเรือมาบตาพุด': ['port', 'eec'],
};

-- AlterTable
ALTER TABLE "Branding" ADD COLUMN     "wmX" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "wmY" INTEGER NOT NULL DEFAULT 100,
ALTER COLUMN "wmAnchor" SET DEFAULT 'free';

-- ย้ายค่าเดิมที่เก็บตำแหน่งเป็นชื่อมุมทั้ง 9 มาเป็น x/y
-- ทำที่นี่ด้วย ทั้งที่ normalizeWatermark() แปลงให้ตอนอ่านอยู่แล้ว เพื่อให้
-- ข้อมูลในตารางตรงกับสิ่งที่ระบบใช้จริง ไม่ต้องพึ่งเส้นทางแปลงค่าไปตลอด
UPDATE "Branding" SET
  "wmX" = CASE
    WHEN "wmAnchor" LIKE '%-left'   THEN 0
    WHEN "wmAnchor" LIKE '%-right'  THEN 100
    WHEN "wmAnchor" = 'middle-left' THEN 0
    ELSE 50
  END,
  "wmY" = CASE
    WHEN "wmAnchor" LIKE 'top-%'    THEN 0
    WHEN "wmAnchor" LIKE 'bottom-%' THEN 100
    ELSE 50
  END,
  "wmAnchor" = 'free'
WHERE "wmAnchor" NOT IN ('free', 'tiled');

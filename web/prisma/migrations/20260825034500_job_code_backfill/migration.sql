-- ประทับรหัสใบงานให้แผนเข้าชมและดีลที่มีอยู่ก่อนแล้ว
--
-- กติกา: ประทับเฉพาะกรณีที่ชี้ได้แน่ ๆ ว่าเป็นใบไหน · กรณีกำกวมปล่อยว่าง
-- ไว้ดีกว่าเดา เพราะรหัสนี้ลูกค้าเอาไปใช้ตรวจว่างานจบเป็นชุดหรือยัง
-- รหัสที่ผิดจึงแย่กว่าไม่มีรหัส

-- 1) ลูกค้ารายนั้นมีใบงานใบเดียว — ไม่มีอะไรให้กำกวม
UPDATE "Visit" v
SET "requirementId" = r.id
FROM "Requirement" r
WHERE v."requirementId" IS NULL
  AND v."leadId" IS NOT NULL
  AND r."leadId" = v."leadId"
  AND r."orgId" = v."orgId"
  AND (SELECT count(*) FROM "Requirement" r2 WHERE r2."leadId" = v."leadId") = 1;

UPDATE "Deal" d
SET "requirementId" = r.id
FROM "Requirement" r
WHERE d."requirementId" IS NULL
  AND d."leadId" IS NOT NULL
  AND r."leadId" = d."leadId"
  AND r."orgId" = d."orgId"
  AND (SELECT count(*) FROM "Requirement" r2 WHERE r2."leadId" = d."leadId") = 1;

-- 2) มีหลายใบ — ดูว่าทรัพย์ที่พาไปดูอยู่ใน shortlist ของใบไหน
--    ถ้าเข้าได้ใบเดียวก็คือใบนั้น ถ้าเข้าได้หลายใบถือว่ายังกำกวม ข้ามไป
UPDATE "Visit" v
SET "requirementId" = m.rid
FROM (
  SELECT vv.id AS vid, min(r.id) AS rid
  FROM "Visit" vv
  JOIN "Requirement" r  ON r."leadId" = vv."leadId" AND r."orgId" = vv."orgId"
  JOIN "Shortlist"   s  ON s."requirementId" = r.id
  JOIN "ShortlistItem" si ON si."shortlistId" = s.id
  JOIN "VisitStop"   vs ON vs."visitId" = vv.id AND vs."propertyId" = si."propertyId"
  WHERE vv."requirementId" IS NULL AND vv."leadId" IS NOT NULL
  GROUP BY vv.id
  HAVING count(DISTINCT r.id) = 1
) m
WHERE v.id = m.vid;

-- 3) ดีลที่เปิดจากทรัพย์หลังหนึ่ง — ทรัพย์หลังนั้นอยู่ใน shortlist ของใบไหน
UPDATE "Deal" d
SET "requirementId" = m.rid
FROM (
  SELECT dd.id AS did, min(r.id) AS rid
  FROM "Deal" dd
  JOIN "Requirement" r  ON r."leadId" = dd."leadId" AND r."orgId" = dd."orgId"
  JOIN "Shortlist"   s  ON s."requirementId" = r.id
  JOIN "ShortlistItem" si ON si."shortlistId" = s.id AND si."propertyId" = dd."propertyId"
  WHERE dd."requirementId" IS NULL AND dd."leadId" IS NOT NULL AND dd."propertyId" IS NOT NULL
  GROUP BY dd.id
  HAVING count(DISTINCT r.id) = 1
) m
WHERE d.id = m.did;

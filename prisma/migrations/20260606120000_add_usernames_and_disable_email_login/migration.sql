ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

WITH normalized AS (
  SELECT
    id,
    CASE
      WHEN COALESCE(NULLIF(trim(split_part(COALESCE(email, ''), '@', 1)), ''), '') <> '' THEN
        lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9]+', '-', 'g'))
      WHEN COALESCE(NULLIF(trim(fullName), ''), '') <> '' THEN
        lower(regexp_replace(fullName, '[^a-zA-Z0-9]+', '-', 'g'))
      ELSE
        'user'
    END AS base_username
  FROM "User"
),
ranked AS (
  SELECT
    id,
    base_username,
    ROW_NUMBER() OVER (PARTITION BY base_username ORDER BY id) AS duplicate_index
  FROM normalized
)
UPDATE "User" AS u
SET "username" = CASE
  WHEN r.duplicate_index = 1 THEN r.base_username
  ELSE CONCAT(r.base_username, '-', r.duplicate_index)
END
FROM ranked AS r
WHERE u.id = r.id;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

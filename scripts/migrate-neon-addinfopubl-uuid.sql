-- ═══════════════════════════════════════════════════════════════════════════
-- Neon / PostgreSQL: idpublicador como UUID (igual que publicador.id)
--
-- Error típico:
--   invalid input syntax for type integer: "775b4736-4f65-487f-b610-2c56939addd4"
--
-- El backend ya NO envía `id` en el INSERT (usa SERIAL o DEFAULT en BD).
-- Si idpublicador sigue siendo INTEGER, ejecuta este script UNA VEZ.
--
-- TRUNCATE borra todas las filas de addinfopubl. Copia datos antes si aplica.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

TRUNCATE TABLE addinfopubl CASCADE;

ALTER TABLE addinfopubl DROP CONSTRAINT IF EXISTS addinfopubl_idpublicador_fkey;

ALTER TABLE addinfopubl DROP COLUMN IF EXISTS idpublicador;

ALTER TABLE addinfopubl
	ADD COLUMN idpublicador UUID NOT NULL REFERENCES publicador (id)
		ON UPDATE CASCADE
		ON DELETE CASCADE;

COMMIT;

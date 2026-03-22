-- Neon / PostgreSQL: columna pastoreo (boolean, default false)
-- Ejecutar una vez en la base existente. Si la columna ya existe, omitir o ignorar el error.

ALTER TABLE addinfopubl
	ADD COLUMN pastoreo BOOLEAN NOT NULL DEFAULT FALSE;

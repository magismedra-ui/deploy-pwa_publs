-- Migración: agregar nroGrupo a tabla grupo
-- Ejecutar si la tabla grupo ya existe sin este campo

USE tjpubls;

ALTER TABLE grupo
ADD COLUMN nroGrupo INT NULL AFTER nombre;

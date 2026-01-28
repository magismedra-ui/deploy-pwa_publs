-- Script de migración para agregar campos comunes a todas las tablas
-- Ejecutar este script si las tablas ya existen

USE tjpubls;

-- Agregar campos a grupo
ALTER TABLE grupo 
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS syncStatus ENUM('pending', 'synced', 'conflict') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Agregar campos a role
ALTER TABLE role 
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS syncStatus ENUM('pending', 'synced', 'conflict') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Agregar campos a publicador
ALTER TABLE publicador 
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS syncStatus ENUM('pending', 'synced', 'conflict') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Agregar campos a usuario
ALTER TABLE usuario 
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS syncStatus ENUM('pending', 'synced', 'conflict') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Agregar campos a asistencia
ALTER TABLE asistencia 
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS syncStatus ENUM('pending', 'synced', 'conflict') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Agregar campos a registro
ALTER TABLE registro 
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS syncStatus ENUM('pending', 'synced', 'conflict') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Agregar campos a addinfopubl
ALTER TABLE addinfopubl 
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS syncStatus ENUM('pending', 'synced', 'conflict') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

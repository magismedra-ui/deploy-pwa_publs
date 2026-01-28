CREATE DATABASE IF NOT EXISTS tjpubls
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE tjpubls;

-- =========================
-- GRUPO
-- =========================
CREATE TABLE grupo (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nombre TEXT NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  syncStatus ENUM('pending', 'synced', 'conflict') DEFAULT 'pending',
  deleted BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- ROLE
-- =========================
CREATE TABLE role (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  role TEXT NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  syncStatus ENUM('pending', 'synced', 'conflict') DEFAULT 'pending',
  deleted BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- PUBLICADOR
-- =========================
CREATE TABLE publicador (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nombre TEXT NOT NULL,
  correo TEXT,
  sexo TEXT,
  esperanza TEXT,
  privilegio TEXT,
  precursor TEXT,
  fecha_nacimiento DATE,
  fecha_bautismo DATE,
  direccion TEXT,
  telefono_familiar BIGINT,
  grupo CHAR(36),
  observaciones TEXT,
  estado TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  capitan BOOLEAN DEFAULT FALSE,
  auxiliar BOOLEAN DEFAULT FALSE,
  telefono BIGINT,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  syncStatus ENUM('pending', 'synced', 'conflict') DEFAULT 'pending',
  deleted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (grupo) REFERENCES grupo(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- USUARIO
-- =========================
CREATE TABLE usuario (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  idpublicador CHAR(36),
  idrole CHAR(36) NOT NULL,
  password TEXT NOT NULL,
  email VARCHAR(80),
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  syncStatus ENUM('pending', 'synced', 'conflict') DEFAULT 'pending',
  deleted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (idpublicador) REFERENCES publicador(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (idrole) REFERENCES role(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- ASISTENCIA
-- =========================
CREATE TABLE asistencia (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  fecha DATE,
  presencial INT,
  zoom INT,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  syncStatus ENUM('pending', 'synced', 'conflict') DEFAULT 'pending',
  deleted BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- REGISTRO
-- =========================
CREATE TABLE registro (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  anno_servicio INT,
  mes VARCHAR(255),
  predico BOOLEAN DEFAULT FALSE,
  cursos INT,
  precursor TEXT,
  horas INT,
  notas VARCHAR(255),
  idpublicador CHAR(36) NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  syncStatus ENUM('pending', 'synced', 'conflict') DEFAULT 'pending',
  deleted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (idpublicador) REFERENCES publicador(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- ADD INFO PUBLICADOR
-- =========================
CREATE TABLE addinfopubl (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  fecha DATE,
  observaciones VARCHAR(255),
  idpublicador CHAR(36) NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  syncStatus ENUM('pending', 'synced', 'conflict') DEFAULT 'pending',
  deleted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (idpublicador) REFERENCES publicador(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- DATA INICIAL
-- =========================
INSERT IGNORE INTO role (id, role)
SELECT UUID(), 'admin'
WHERE NOT EXISTS (SELECT 1 FROM role WHERE role = 'admin');

const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./carburantes.db", (error) => {
  if (error) {
    console.error("Error al conectar con SQLite:", error.message);
  } else {
    console.log("Base de datos SQLite conectada correctamente.");
  }
});

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  db.run(`
    CREATE TABLE IF NOT EXISTS empresa (
      id_empresa INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      nit TEXT NOT NULL UNIQUE,
      direccion TEXT NOT NULL,
      ciudad TEXT NOT NULL,
      contacto TEXT,
      factor_holgura REAL NOT NULL DEFAULT 10.0,
      cupo_base_cliente_nuevo REAL NOT NULL DEFAULT 20.0,
      semanas_evaluacion INTEGER NOT NULL DEFAULT 4,
      CHECK (factor_holgura >= 0),
      CHECK (cupo_base_cliente_nuevo > 0),
      CHECK (semanas_evaluacion > 0)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tanque (
      id_tanque INTEGER PRIMARY KEY AUTOINCREMENT,
      id_empresa INTEGER NOT NULL,
      identificador TEXT NOT NULL UNIQUE,
      tipo_carburante TEXT NOT NULL,
      capacidad_maxima REAL NOT NULL,
      stock_minimo REAL NOT NULL,
      FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
      CHECK (tipo_carburante IN ('GASOLINA', 'DIESEL')),
      CHECK (capacidad_maxima > 0),
      CHECK (stock_minimo >= 0),
      CHECK (stock_minimo <= capacidad_maxima)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cliente (
      id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
      documento TEXT NOT NULL UNIQUE,
      nombre_razon_social TEXT NOT NULL,
      placa_vehiculo TEXT NOT NULL UNIQUE,
      tipo_cliente TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'ACTIVO',
      fecha_registro TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (tipo_cliente IN ('PARTICULAR', 'TRANSPORTE_PUBLICO', 'EMPRESA')),
      CHECK (estado IN ('ACTIVO', 'SUSPENDIDO'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ingreso (
      id_ingreso INTEGER PRIMARY KEY AUTOINCREMENT,
      id_tanque INTEGER NOT NULL,
      cantidad_litros REAL NOT NULL,
      numero_factura TEXT NOT NULL,
      fecha_hora TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_tanque) REFERENCES tanque(id_tanque)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
      CHECK (cantidad_litros > 0)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS venta (
      id_venta INTEGER PRIMARY KEY AUTOINCREMENT,
      id_cliente INTEGER NOT NULL,
      id_tanque INTEGER NOT NULL,
      cantidad_solicitada REAL NOT NULL,
      cantidad_autorizada REAL NOT NULL,
      promedio_semanal REAL NOT NULL DEFAULT 0,
      cupo_permitido REAL NOT NULL DEFAULT 0,
      estado TEXT NOT NULL,
      observacion TEXT,
      fecha_hora TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
      FOREIGN KEY (id_tanque) REFERENCES tanque(id_tanque)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
      CHECK (cantidad_solicitada > 0),
      CHECK (cantidad_autorizada >= 0),
      CHECK (cantidad_autorizada <= cantidad_solicitada),
      CHECK (estado IN ('AUTORIZADA', 'AJUSTADA', 'BLOQUEADA'))
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO empresa (
      id_empresa,
      nombre,
      nit,
      direccion,
      ciudad,
      contacto,
      factor_holgura,
      cupo_base_cliente_nuevo,
      semanas_evaluacion
    ) VALUES (
      1,
      'ElChuCho Petrol',
      '123456789',
      'Av. Principal Nro. 100',
      'Sucre',
      '73400000',
      10.0,
      20.0,
      4
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO tanque (
      id_tanque,
      id_empresa,
      identificador,
      tipo_carburante,
      capacidad_maxima,
      stock_minimo
    ) VALUES
      (1, 1, 'T-01', 'GASOLINA', 10000, 1000),
      (2, 1, 'T-02', 'DIESEL', 15000, 1500)
  `);

  db.run(`
    INSERT OR IGNORE INTO cliente (
      id_cliente,
      documento,
      nombre_razon_social,
      placa_vehiculo,
      tipo_cliente,
      estado
    ) VALUES
      (1, '1234567', 'Juan Pérez', 'ABC-123', 'PARTICULAR', 'ACTIVO'),
      (2, '7654321', 'Transporte San José', 'TRS-456', 'TRANSPORTE_PUBLICO', 'ACTIVO')
  `);

  db.run(`
    INSERT OR IGNORE INTO ingreso (
      id_ingreso,
      id_tanque,
      cantidad_litros,
      numero_factura
    ) VALUES
      (1, 1, 5000, 'FAC-001'),
      (2, 2, 8000, 'FAC-002')
  `);
});

module.exports = db;
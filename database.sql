PRAGMA foreign_keys = ON;

CREATE TABLE empresa (
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
);

CREATE TABLE tanque (
    id_tanque INTEGER PRIMARY KEY AUTOINCREMENT,
    id_empresa INTEGER NOT NULL,
    identificador TEXT NOT NULL UNIQUE,
    tipo_carburante TEXT NOT NULL,
    capacidad_maxima REAL NOT NULL,
    stock_minimo REAL NOT NULL,

    FOREIGN KEY (id_empresa)
        REFERENCES empresa(id_empresa)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CHECK (tipo_carburante IN ('GASOLINA', 'DIESEL')),
    CHECK (capacidad_maxima > 0),
    CHECK (stock_minimo >= 0),
    CHECK (stock_minimo <= capacidad_maxima)
);

CREATE TABLE cliente (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    documento TEXT NOT NULL UNIQUE,
    nombre_razon_social TEXT NOT NULL,
    placa_vehiculo TEXT NOT NULL UNIQUE,
    tipo_cliente TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'ACTIVO',
    fecha_registro TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (tipo_cliente IN ('PARTICULAR', 'TRANSPORTE_PUBLICO', 'EMPRESA')),
    CHECK (estado IN ('ACTIVO', 'SUSPENDIDO'))
);

CREATE TABLE ingreso (
    id_ingreso INTEGER PRIMARY KEY AUTOINCREMENT,
    id_tanque INTEGER NOT NULL,
    cantidad_litros REAL NOT NULL,
    numero_factura TEXT NOT NULL,
    fecha_hora TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_tanque)
        REFERENCES tanque(id_tanque)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CHECK (cantidad_litros > 0)
);

CREATE TABLE venta (
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

    FOREIGN KEY (id_cliente)
        REFERENCES cliente(id_cliente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    FOREIGN KEY (id_tanque)
        REFERENCES tanque(id_tanque)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CHECK (cantidad_solicitada > 0),
    CHECK (cantidad_autorizada >= 0),
    CHECK (cantidad_autorizada <= cantidad_solicitada),
    CHECK (estado IN ('AUTORIZADA', 'AJUSTADA', 'BLOQUEADA'))
);

CREATE VIEW vista_stock_tanque AS
SELECT
    t.id_tanque,
    t.identificador,
    t.tipo_carburante,
    t.capacidad_maxima,
    t.stock_minimo,

    IFNULL((
        SELECT SUM(i.cantidad_litros)
        FROM ingreso i
        WHERE i.id_tanque = t.id_tanque
    ), 0)
    -
    IFNULL((
        SELECT SUM(v.cantidad_autorizada)
        FROM venta v
        WHERE v.id_tanque = t.id_tanque
          AND v.estado IN ('AUTORIZADA', 'AJUSTADA')
    ), 0) AS stock_actual

FROM tanque t;
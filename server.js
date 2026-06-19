const express = require("express");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function calcularStockTanque(idTanque) {
  return new Promise((resolve, reject) => {
    const sql = `
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
      FROM tanque t
      WHERE t.id_tanque = ?
    `;

    db.get(sql, [idTanque], (error, fila) => {
      if (error) reject(error);
      else resolve(fila);
    });
  });
}

function calcularCupoCliente(idCliente) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        c.id_cliente,
        c.nombre_razon_social,
        c.estado,
        e.factor_holgura,
        e.cupo_base_cliente_nuevo,
        e.semanas_evaluacion,
        IFNULL(SUM(v.cantidad_autorizada), 0) AS total_ultimos_28_dias
      FROM cliente c
      CROSS JOIN empresa e
      LEFT JOIN venta v
        ON c.id_cliente = v.id_cliente
        AND v.fecha_hora >= datetime('now', '-28 days')
        AND v.estado IN ('AUTORIZADA', 'AJUSTADA')
      WHERE c.id_cliente = ?
      GROUP BY c.id_cliente
    `;

    db.get(sql, [idCliente], (error, fila) => {
      if (error) {
        reject(error);
        return;
      }

      if (!fila) {
        reject(new Error("Cliente no encontrado"));
        return;
      }

      const total = fila.total_ultimos_28_dias || 0;
      let promedioSemanal = 0;
      let cupoPermitido = fila.cupo_base_cliente_nuevo;

      if (total > 0) {
        promedioSemanal = total / fila.semanas_evaluacion;
        cupoPermitido =
          promedioSemanal + (promedioSemanal * fila.factor_holgura) / 100;
      }

      resolve({
        cliente: fila,
        promedioSemanal,
        cupoPermitido
      });
    });
  });
}

app.get("/api/empresa", (req, res) => {
  db.get("SELECT * FROM empresa LIMIT 1", [], (error, fila) => {
    if (error) return res.status(500).json({ mensaje: error.message });
    res.json(fila);
  });
});

app.get("/api/tanques", (req, res) => {
  const sql = `
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
    FROM tanque t
    ORDER BY t.id_tanque
  `;

  db.all(sql, [], (error, filas) => {
    if (error) return res.status(500).json({ mensaje: error.message });
    res.json(filas);
  });
});

app.get("/api/clientes", (req, res) => {
  db.all("SELECT * FROM cliente ORDER BY id_cliente DESC", [], (error, filas) => {
    if (error) return res.status(500).json({ mensaje: error.message });
    res.json(filas);
  });
});

app.post("/api/clientes", (req, res) => {
  const {
    documento,
    nombre_razon_social,
    placa_vehiculo,
    tipo_cliente
  } = req.body;

  if (!documento || !nombre_razon_social || !placa_vehiculo || !tipo_cliente) {
    return res.status(400).json({ mensaje: "Todos los campos son obligatorios." });
  }

  const sql = `
    INSERT INTO cliente (
      documento,
      nombre_razon_social,
      placa_vehiculo,
      tipo_cliente,
      estado
    ) VALUES (?, ?, ?, ?, 'ACTIVO')
  `;

  db.run(
    sql,
    [documento, nombre_razon_social, placa_vehiculo, tipo_cliente],
    function (error) {
      if (error) return res.status(500).json({ mensaje: error.message });

      res.status(201).json({
        id_cliente: this.lastID,
        mensaje: "Cliente registrado correctamente."
      });
    }
  );
});

app.get("/api/cliente/buscar/:valor", (req, res) => {
  const valor = req.params.valor;

  const sql = `
    SELECT *
    FROM cliente
    WHERE documento = ? OR placa_vehiculo = ?
    LIMIT 1
  `;

  db.get(sql, [valor, valor], async (error, cliente) => {
    if (error) return res.status(500).json({ mensaje: error.message });

    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no registrado." });
    }

    try {
      const cupo = await calcularCupoCliente(cliente.id_cliente);
      res.json({
        cliente,
        promedio_semanal: cupo.promedioSemanal,
        cupo_permitido: cupo.cupoPermitido
      });
    } catch (e) {
      res.status(500).json({ mensaje: e.message });
    }
  });
});

app.post("/api/ingresos", (req, res) => {
  const { id_tanque, cantidad_litros, numero_factura } = req.body;

  if (!id_tanque || !cantidad_litros || !numero_factura) {
    return res.status(400).json({ mensaje: "Todos los campos son obligatorios." });
  }

  const sql = `
    INSERT INTO ingreso (
      id_tanque,
      cantidad_litros,
      numero_factura
    ) VALUES (?, ?, ?)
  `;

  db.run(sql, [id_tanque, cantidad_litros, numero_factura], function (error) {
    if (error) return res.status(500).json({ mensaje: error.message });

    res.status(201).json({
      id_ingreso: this.lastID,
      mensaje: "Ingreso registrado correctamente."
    });
  });
});

app.post("/api/ventas", async (req, res) => {
  try {
    const { id_cliente, id_tanque, cantidad_solicitada } = req.body;

    if (!id_cliente || !id_tanque || !cantidad_solicitada) {
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios." });
    }

    const cupo = await calcularCupoCliente(id_cliente);
    const stock = await calcularStockTanque(id_tanque);

    if (cupo.cliente.estado !== "ACTIVO") {
      return res.status(400).json({ mensaje: "El cliente está suspendido." });
    }

    if (!stock) {
      return res.status(404).json({ mensaje: "Tanque no encontrado." });
    }

    const solicitado = Number(cantidad_solicitada);
    let autorizado = solicitado;
    let estado = "AUTORIZADA";
    let observacion = "Venta dentro del cupo permitido.";

    if (solicitado > cupo.cupoPermitido) {
      autorizado = cupo.cupoPermitido;
      estado = "AJUSTADA";
      observacion = "La cantidad solicitada supera el cupo. Se autoriza solo el límite permitido.";
    }

    if (autorizado > stock.stock_actual) {
      return res.status(400).json({
        mensaje: "Stock insuficiente en el tanque seleccionado."
      });
    }

    const sql = `
      INSERT INTO venta (
        id_cliente,
        id_tanque,
        cantidad_solicitada,
        cantidad_autorizada,
        promedio_semanal,
        cupo_permitido,
        estado,
        observacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      sql,
      [
        id_cliente,
        id_tanque,
        solicitado,
        autorizado,
        cupo.promedioSemanal,
        cupo.cupoPermitido,
        estado,
        observacion
      ],
      function (error) {
        if (error) return res.status(500).json({ mensaje: error.message });

        res.status(201).json({
          id_venta: this.lastID,
          cantidad_solicitada: solicitado,
          cantidad_autorizada: autorizado,
          promedio_semanal: cupo.promedioSemanal,
          cupo_permitido: cupo.cupoPermitido,
          estado,
          observacion
        });
      }
    );
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

app.get("/api/ventas", (req, res) => {
  const sql = `
    SELECT
      v.id_venta,
      c.nombre_razon_social,
      c.placa_vehiculo,
      t.identificador AS tanque,
      t.tipo_carburante,
      v.cantidad_solicitada,
      v.cantidad_autorizada,
      v.promedio_semanal,
      v.cupo_permitido,
      v.estado,
      v.observacion,
      v.fecha_hora
    FROM venta v
    INNER JOIN cliente c ON v.id_cliente = c.id_cliente
    INNER JOIN tanque t ON v.id_tanque = t.id_tanque
    ORDER BY v.id_venta DESC
  `;

  db.all(sql, [], (error, filas) => {
    if (error) return res.status(500).json({ mensaje: error.message });
    res.json(filas);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
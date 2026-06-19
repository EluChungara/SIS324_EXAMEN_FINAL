const tanquesDiv = document.getElementById("tanques");
const ventasDiv = document.getElementById("ventas");

const formCliente = document.getElementById("formCliente");
const formIngreso = document.getElementById("formIngreso");
const formVenta = document.getElementById("formVenta");

const tanqueIngreso = document.getElementById("tanqueIngreso");
const tanqueVenta = document.getElementById("tanqueVenta");
const clienteVenta = document.getElementById("clienteVenta");

const btnBuscar = document.getElementById("btnBuscar");
const buscarCliente = document.getElementById("buscarCliente");
const infoCliente = document.getElementById("infoCliente");
const resultadoVenta = document.getElementById("resultadoVenta");

async function cargarEmpresa() {
  const res = await fetch("/api/empresa");
  const empresa = await res.json();
  document.getElementById("nombreEmpresa").textContent = empresa.nombre;
}

async function cargarTanques() {
  const res = await fetch("/api/tanques");
  const tanques = await res.json();

  tanquesDiv.innerHTML = "";
  tanqueIngreso.innerHTML = "";
  tanqueVenta.innerHTML = "";

  tanques.forEach((tanque) => {
    const alerta = tanque.stock_actual <= tanque.stock_minimo;

    tanquesDiv.innerHTML += `
      <div class="tanque">
        <h3>${tanque.identificador} - ${tanque.tipo_carburante}</h3>
        <p>Capacidad máxima: ${tanque.capacidad_maxima} litros</p>
        <p>Stock mínimo: ${tanque.stock_minimo} litros</p>
        <p class="${alerta ? "alerta" : "ok"}">
          Stock actual: ${tanque.stock_actual} litros
        </p>
      </div>
    `;

    tanqueIngreso.innerHTML += `
      <option value="${tanque.id_tanque}">
        ${tanque.identificador} - ${tanque.tipo_carburante}
      </option>
    `;

    tanqueVenta.innerHTML += `
      <option value="${tanque.id_tanque}">
        ${tanque.identificador} - ${tanque.tipo_carburante}
      </option>
    `;
  });
}

async function cargarClientes() {
  const res = await fetch("/api/clientes");
  const clientes = await res.json();

  clienteVenta.innerHTML = "";

  clientes.forEach((cliente) => {
    clienteVenta.innerHTML += `
      <option value="${cliente.id_cliente}">
        ${cliente.nombre_razon_social} - ${cliente.placa_vehiculo}
      </option>
    `;
  });
}

async function cargarVentas() {
  const res = await fetch("/api/ventas");
  const ventas = await res.json();

  ventasDiv.innerHTML = "";

  if (ventas.length === 0) {
    ventasDiv.innerHTML = "<p>No existen ventas registradas.</p>";
    return;
  }

  ventas.forEach((venta) => {
    ventasDiv.innerHTML += `
      <div class="venta">
        <strong>${venta.nombre_razon_social}</strong> - ${venta.placa_vehiculo}
        <p>Tanque: ${venta.tanque} (${venta.tipo_carburante})</p>
        <p>Solicitado: ${venta.cantidad_solicitada} litros</p>
        <p>Autorizado: ${venta.cantidad_autorizada} litros</p>
        <p>Promedio semanal: ${Number(venta.promedio_semanal).toFixed(2)} litros</p>
        <p>Cupo permitido: ${Number(venta.cupo_permitido).toFixed(2)} litros</p>
        <p>Estado: <strong>${venta.estado}</strong></p>
        <p>${venta.observacion}</p>
      </div>
    `;
  });
}

formCliente.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    documento: document.getElementById("documento").value,
    nombre_razon_social: document.getElementById("nombreCliente").value,
    placa_vehiculo: document.getElementById("placa").value,
    tipo_cliente: document.getElementById("tipoCliente").value
  };

  const res = await fetch("/api/clientes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const respuesta = await res.json();
  alert(respuesta.mensaje);

  formCliente.reset();
  cargarClientes();
});

formIngreso.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    id_tanque: tanqueIngreso.value,
    cantidad_litros: Number(document.getElementById("litrosIngreso").value),
    numero_factura: document.getElementById("facturaIngreso").value
  };

  const res = await fetch("/api/ingresos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const respuesta = await res.json();
  alert(respuesta.mensaje);

  formIngreso.reset();
  cargarTanques();
});

btnBuscar.addEventListener("click", async () => {
  const valor = buscarCliente.value.trim();

  if (!valor) {
    alert("Ingrese placa o documento.");
    return;
  }

  const res = await fetch(`/api/cliente/buscar/${valor}`);
  const data = await res.json();

  if (!res.ok) {
    infoCliente.innerHTML = `<p class="alerta">${data.mensaje}</p>`;
    return;
  }

  infoCliente.innerHTML = `
    <p><strong>Cliente:</strong> ${data.cliente.nombre_razon_social}</p>
    <p><strong>Estado:</strong> ${data.cliente.estado}</p>
    <p><strong>Promedio semanal:</strong> ${Number(data.promedio_semanal).toFixed(2)} litros</p>
    <p><strong>Cupo permitido:</strong> ${Number(data.cupo_permitido).toFixed(2)} litros</p>
  `;

  clienteVenta.value = data.cliente.id_cliente;
});

formVenta.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    id_cliente: clienteVenta.value,
    id_tanque: tanqueVenta.value,
    cantidad_solicitada: Number(document.getElementById("litrosVenta").value)
  };

  const res = await fetch("/api/ventas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const respuesta = await res.json();

  if (!res.ok) {
    resultadoVenta.innerHTML = `<p class="alerta">${respuesta.mensaje}</p>`;
    return;
  }

  resultadoVenta.innerHTML = `
    <p class="ok">Venta procesada.</p>
    <p>Solicitado: ${respuesta.cantidad_solicitada} litros</p>
    <p>Autorizado: ${respuesta.cantidad_autorizada} litros</p>
    <p>Estado: ${respuesta.estado}</p>
    <p>${respuesta.observacion}</p>
  `;

  formVenta.reset();
  cargarTanques();
  cargarVentas();
});

cargarEmpresa();
cargarTanques();
cargarClientes();
cargarVentas();
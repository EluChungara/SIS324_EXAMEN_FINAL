Sistema de Inventario y Venta Controlada de Carburantes - SIS324
Datos del proyecto

Materia: SIS324 - Ingeniería de Software
Estudiante: Elizabeth Chungara Choque
Proyecto: Sistema de inventario y venta controlada de carburantes
Estación de servicio: ElChuCho Petrol
Despliegue en Render: https://sis324-examen-final-elizabeth-chungara.onrender.com

1. Descripción general del sistema

El sistema es una plataforma web centralizada para la gestión de inventario y venta controlada de carburantes en una estación de servicio. Permite administrar tanques de depósito, registrar clientes, controlar ingresos de combustible y procesar ventas de gasolina o diésel aplicando una regla de negocio basada en cupos dinámicos.

El objetivo principal es optimizar el control de existencias en los tanques de almacenamiento y reducir el riesgo de sobreabastecimiento o especulación mediante el análisis del historial de compra de cada cliente.

2. Módulos principales
Módulo de empresa

Permite manejar la información institucional de la estación de servicio.

Datos considerados:

Nombre de la estación de servicio.
NIT o identificación tributaria.
Dirección.
Ciudad.
Contacto.
Factor de holgura.
Cupo base para cliente nuevo.
Número de semanas de evaluación.
Módulo de tanques

Permite representar los tanques físicos de almacenamiento de carburante.

Datos considerados:

Identificador del tanque.
Tipo de carburante: gasolina o diésel.
Capacidad máxima.
Stock mínimo.
Stock actual calculado.

El stock actual se calcula de la siguiente forma:

Stock actual = Total de ingresos - Total de ventas autorizadas
Módulo de clientes

Permite registrar los clientes habilitados para comprar carburante.

Datos considerados:

Documento o NIT.
Nombre completo o razón social.
Placa del vehículo.
Tipo de cliente.
Estado del cliente.
Módulo de ingresos

Permite registrar el abastecimiento de combustible a los tanques.

Datos considerados:

Tanque de destino.
Cantidad de litros ingresados.
Número de factura o remisión.
Fecha y hora del ingreso.
Módulo de ventas

Permite realizar ventas controladas de carburante.

El sistema calcula el cupo permitido del cliente según su historial de compras. Si el cliente solicita una cantidad superior al cupo permitido, la venta se ajusta al límite permitido.

3. Regla de negocio

El sistema calcula el promedio semanal del cliente usando las ventas de los últimos 28 días.

Promedio semanal = Total de litros comprados en los últimos 28 días / 4

Luego se aplica el factor de holgura configurado por la empresa.

Cupo permitido = Promedio semanal + (Promedio semanal * Factor de holgura / 100)

Si el cliente no tiene historial de compras, el sistema utiliza un cupo base inicial.

Cupo permitido = Cupo base para cliente nuevo

Estados posibles de una venta:

AUTORIZADA: La cantidad solicitada está dentro del cupo permitido.
AJUSTADA: La cantidad solicitada supera el cupo y se autoriza solo el límite permitido.
BLOQUEADA: La venta no puede realizarse por falta de stock o por cliente suspendido.
4. Modelo de datos

El modelo de datos está compuesto por las siguientes tablas:

empresa
tanque
cliente
ingreso
venta
Relaciones principales
empresa 1 --- * tanque
tanque 1 --- * ingreso
tanque 1 --- * venta
cliente 1 --- * venta
Descripción de tablas
Tabla empresa

Guarda la información institucional de la estación de servicio y los parámetros globales de control.

Tabla tanque

Representa cada tanque físico de almacenamiento. Se relaciona con la empresa y con las transacciones de ingreso y venta.

Tabla cliente

Guarda los datos del comprador y la placa del vehículo asociada.

Tabla ingreso

Registra el abastecimiento de combustible a los tanques.

Tabla venta

Registra las salidas de combustible y almacena los datos usados para la validación del cupo.

5. Diagrama de clases
classDiagram
    class Empresa {
        +int id_empresa
        +string nombre
        +string nit
        +string direccion
        +string ciudad
        +string contacto
        +real factor_holgura
        +real cupo_base_cliente_nuevo
        +int semanas_evaluacion
    }

    class Tanque {
        +int id_tanque
        +int id_empresa
        +string identificador
        +string tipo_carburante
        +real capacidad_maxima
        +real stock_minimo
    }

    class Cliente {
        +int id_cliente
        +string documento
        +string nombre_razon_social
        +string placa_vehiculo
        +string tipo_cliente
        +string estado
        +datetime fecha_registro
    }

    class Ingreso {
        +int id_ingreso
        +int id_tanque
        +real cantidad_litros
        +string numero_factura
        +datetime fecha_hora
    }

    class Venta {
        +int id_venta
        +int id_cliente
        +int id_tanque
        +real cantidad_solicitada
        +real cantidad_autorizada
        +real promedio_semanal
        +real cupo_permitido
        +string estado
        +datetime fecha_hora
    }

    Empresa "1" --> "*" Tanque
    Tanque "1" --> "*" Ingreso
    Tanque "1" --> "*" Venta
    Cliente "1" --> "*" Venta
6. Arquitectura de la aplicación

La aplicación utiliza una arquitectura web de tres capas.

Usuario / Operador
        |
        v
Frontend: HTML, CSS, JavaScript
        |
        v
Backend: Node.js + Express
        |
        v
Base de datos: SQLite
Capa de presentación

Contiene la interfaz visual del sistema. Está desarrollada con HTML, CSS y JavaScript.

Archivos:

public/index.html
public/style.css
public/script.js
Capa de lógica de negocio

Contiene las rutas del servidor y la lógica para calcular cupos, registrar clientes, ingresos y ventas.

Archivos:

server.js
Capa de datos

Contiene la conexión y creación de la base de datos SQLite.

Archivos:

database.js
database.sql
carburantes.db
7. Tecnologías utilizadas
Node.js
Express
SQLite
HTML
CSS
JavaScript
GitHub
Render
8. Instalación y ejecución local

Para ejecutar el proyecto localmente:

npm install
npm start

Luego abrir en el navegador:

http://localhost:3000
9. Despliegue

El sistema fue desplegado en Render como un Web Service conectado al repositorio de GitHub.

Configuración usada en Render:

Runtime: Node
Build Command: npm install
Start Command: node server.js
Branch: main

URL de despliegue:

https://sis324-examen-final-elizabeth-chungara.onrender.com
10. Conclusión

El sistema cumple con los requerimientos principales del problema porque permite gestionar la estación de servicio, controlar tanques de gasolina y diésel, registrar clientes, administrar ingresos de carburante y procesar ventas controladas aplicando un algoritmo de cupos dinámicos. Además, la aplicación fue desplegada correctamente en Render y utiliza SQLite como base de datos, según lo solicitado.
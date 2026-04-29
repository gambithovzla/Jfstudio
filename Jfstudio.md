# Sistema de gestión integral para salón de belleza

## Requisitos funcionales y flujos de usuario

- **Agenda y reservas:** El sistema debe permitir que las clientas reserven citas en línea según tu disponibilidad, bloqueando automáticamente las franjas horarias necesarias para cada servicio【35†L42-L47】【12†L86-L94】. Cada estilista podrá ver su agenda en todo momento, conocer tipos de cita y cambios realizados【12†L86-L94】. Esto evita solapamientos y gestiona los intervalos según la duración del servicio.  
- **Clientes e historial:** Al agendar una cita, se almacena automáticamente la información del cliente (nombre, teléfono, correo, servicios solicitados, etc.). El sistema debe mantener un historial completo de visitas de cada clienta, indicando qué servicio recibió y cuánto se cobró la última vez【12†L86-L94】. De este modo, al consultar el perfil de una clienta se puede ver fácilmente su historial de servicios y precios anteriores.  
- **Inventario y productos:** El sistema lleva un registro en tiempo real del stock de productos. Al completar un servicio, las cantidades correspondientes de productos se descuentan automáticamente del inventario【29†L165-L167】. Para productos de uso variable (por ejemplo, tintes), el estilista puede indicar en el momento del cobro la cantidad exacta usada, y el stock se ajusta al instante【29†L66-L68】【29†L165-L167】. Además, se deben emitir alertas cuando un producto alcanza un umbral bajo, facilitando la reposición a tiempo【29†L58-L60】.  
- **Control de caja:** Cada cobro de servicio genera una transacción en el sistema, registrando el monto, el método de pago y quién lo cobró【32†L169-L174】. El sistema debe poder generar reportes diarios automáticos que sumen todas las ventas del día (cierre de caja)【32†L167-L174】. Esto permite saber en cualquier momento cuánto se ha ingresado en el día y auditar cada transacción.  
- **Centralización de la gestión:** Todo (agenda, clientes, inventario, caja) se integra en una misma plataforma, evitando usar herramientas dispersas como WhatsApp o hojas de cálculo【35†L39-L44】. En una sola aplicación se combinan múltiples funciones administrativas, como recomienda la industria【35†L39-L47】.

## Herramientas y librerías para calendario y bloqueo de horarios

Para la interfaz de calendario y la lógica de disponibilidad se pueden usar librerías especializadas. Por ejemplo, **FullCalendar** es un componente JavaScript de código abierto que ofrece vistas de día/semana/mes muy familiares. Con sus plugins comerciales permite añadir “vistas de recursos” (por ej. calendarios tipo timeline) para modelar la disponibilidad de cada estilista【19†L37-L45】. Otra opción es **DHTMLX Scheduler**, que incluye vistas tipo *Timeline* y *Units* para asignar citas por recurso y facilita la gestión de horarios: su API ofrece métodos para evitar reservas duplicadas en un mismo intervalo【18†L55-L64】. En entornos React existen alternativas gratuitas como **react-big-calendar** (vistas día/semana/mes, arrastre de eventos) o paquetes comerciales (Syncfusion, Kendo UI, etc.) que gestionan bloqueos de tiempo. En cualquier caso, estas bibliotecas permiten mostrar las franjas libres y bloquear el resto según la duración del servicio seleccionado.

## Modelo de datos

La base de datos debe incluir, al menos, estas entidades clave:

- **Cliente:** `id`, nombre, teléfono, correo, etc. (datos de contacto).  
- **Servicio:** `id`, nombre, duración (en minutos), precio base y lista de productos asociados (cada uno con la cantidad usada por ese servicio).  
- **Estilista/Usuario:** `id`, nombre, rol (estilista, recepcionista, administrador), horario laboral habitual.  
- **Cita (Appointment):** `id`, `cliente_id`, `servicio_id`, `estilista_id`, `fechaHoraInicio`, `fechaHoraFin`, estado (confirmada, cancelada, completada, etc.). Al crearla, se calculan automáticamente `fechaHoraFin = fechaHoraInicio + duración`.  
- **Producto:** `id`, nombre, `cantidadActual`, unidad (ml, g, uds), umbral de alerta (stock mínimo para aviso).  
- **MovimientoInventario:** `id`, `producto_id`, cantidad (positiva o negativa), tipo (venta, compra, ajuste), fecha, comentario. Cada vez que se factura un servicio, se registra un movimiento de tipo *venta* para descontar las unidades usadas.  
- **Transacción (Cobro):** `id`, `cita_id`, montoTotal, fecha/hora, métodoPago (efectivo, tarjeta, etc.), `empleado_id` (quien cobró). Así se enlaza cada pago con la cita correspondiente.

Con este modelo se puede relacionar cada cita con su cliente y servicio, descontar inventario y calcular los ingresos generados.

## Endpoints y lógica del sistema

A continuación se propone un esquema REST para los principales flujos:

- **Ver disponibilidad:** `GET /api/availability?servicio={id}&fecha=YYYY-MM-DD` – Calcula los huecos libres en esa fecha para el servicio indicado. Implementación: se consulta el horario laboral de los estilistas, se resta el tiempo de las citas ya agendadas y se devuelven las franjas libres (considerando la duración del servicio).  
- **Crear reserva (cita):** `POST /api/appointments` con cuerpo `{ cliente, servicioId, estilistaId, fechaHoraInicio, metodoPago }`. La lógica realiza varios pasos:
  1. **Verificar disponibilidad:** Comprueba que el intervalo solicitado está libre (sin solapamiento)【18†L61-L64】. Si no, devuelve error.  
  2. **Registrar/actualizar cliente:** Si el cliente es nuevo, lo agrega; si ya existe, actualiza sus datos.  
  3. **Crear la cita:** Guarda la nueva cita con estado "confirmada" y bloquea ese rango en el calendario.  
  4. **Actualizar inventario:** Resta del stock las cantidades definidas de productos para ese servicio【29†L165-L167】. Para productos variables (tintes), se puede pedir en este momento la cantidad exacta usada.  
  5. **Registrar transacción:** Crea un registro en caja con el monto del servicio, fecha/hora y método de pago.  
  6. **Respuesta:** Devuelve la cita creada y/o confirmación.  

- **Historial de cliente:** `GET /api/clients/{id}/history` – Devuelve todas las citas pasadas del cliente con detalles (servicio, fecha, precio cobrado). Esto permite mostrar el historial completo de servicios y cobros del cliente.  

- **Inventario:**  
  - `GET /api/products` – Lista todos los productos con su stock actual.  
  - `GET /api/low-stock` – Lista productos cuyo stock está por debajo del umbral de alerta.  
  - *Integración con reservas:* Al facturar una cita (ver punto anterior), se deduce automáticamente del stock. Si después de la venta un producto baja del umbral, el sistema lo señala para reponerlo.  

- **Control de caja y reportes:**  
  - `GET /api/transactions?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD` – Devuelve las transacciones (ventas) realizadas en el rango indicado. A partir de esto se pueden calcular ingresos diarios, generando un cierre de caja automático【32†L167-L174】. Cada transacción incluye información de quién cobró, método de pago y servicio asociado【32†L169-L174】.  
  - Con esto se facilitan reportes como “total cobrado hoy”, ventas por método de pago, por estilista, etc.

## Especificación técnica y ejemplos de código

Como ejemplo de implementación con Node.js/Express y MongoDB, el siguiente fragmento muestra el flujo de creación de una cita (reserva):

```js
app.post('/api/appointments', async (req, res) => {
  const { cliente, servicioId, estilistaId, fechaHoraInicio, metodoPago } = req.body;
  // 1. Verificar disponibilidad
  const disponible = await checkAvailability(servicioId, estilistaId, fechaHoraInicio);
  if (!disponible) {
    return res.status(409).json({ error: 'Horario no disponible' });
  }
  // 2. Registrar o actualizar cliente
  let clienteObj = await Cliente.findOneAndUpdate(
    { telefono: cliente.telefono },
    cliente,
    { upsert: true, new: true }
  );
  // 3. Crear la cita
  const servicio = await Servicio.findById(servicioId);
  let cita = new Cita({
    clienteId: clienteObj._id,
    servicioId,
    estilistaId,
    fechaHoraInicio: new Date(fechaHoraInicio),
    fechaHoraFin: new Date(new Date(fechaHoraInicio).getTime() + servicio.duracion * 60000),
    estado: 'confirmada'
  });
  cita = await cita.save();
  // 4. Actualizar inventario (auto-descuento de productos)
  servicio.productos.forEach(async p => {
    await Producto.findByIdAndUpdate(p.id, { $inc: { cantidadActual: -p.cantidad } });
  });
  // 5. Registrar transacción en caja
  const transaccion = new Transaccion({
    citaId: cita._id,
    montoTotal: servicio.precio,
    fecha: new Date(),
    metodoPago,
    empleadoId: estilistaId
  });
  await transaccion.save();
  // 6. Responder con la cita creada
  res.status(201).json(cita);
});
```

En este código se muestran los pasos clave: chequeo de disponibilidad, creación del cliente y cita, deducción de inventario y registro del cobro. De manera similar se definirían los demás endpoints (por ejemplo, uno para consultar el historial del cliente o para obtener el reporte diario de caja).

En resumen, la especificación técnica incluye endpoints REST para clientes, servicios, citas, inventario y caja, con la lógica anteriormente descrita. Estos detalles servirán como texto guía para Codex al generar el código completo del sistema. 

**Fuentes:** requisitos y funcionalidades clave extraídos de la documentación del sector【35†L39-L47】【12†L86-L94】【29†L165-L167】【32†L167-L174】, así como ejemplos de manejo de inventario【29†L165-L167】 y caja【32†L167-L174】.
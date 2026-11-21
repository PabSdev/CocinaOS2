# CocinaOS

## Acceso por equipos

El registro público crea cuentas de cliente y las incorpora automáticamente al equipo `clientes` de Appwrite. Las cuentas existentes sin equipo se incorporan al iniciar sesión. El área de clientes muestra la carta de platos y productos con disponibilidad y precios de venta. El carrito permite preparar una selección provisional en memoria, sin reservar existencias ni enviar pedidos. La cabecera permite cerrar sesión.

El área operativa exige una membresía confirmada en el equipo `Cocina`: sus miembros son cocineros y quienes tengan el rol `admin` son administradores. Cocina prevalece si la cuenta pertenece a ambos equipos. Las invitaciones pendientes no conceden acceso operativo.

Los administradores se asignan en Appwrite. El alta de cocineros es restringida; la interfaz de invitaciones queda pendiente. No existe selección pública de roles.

## Historial de pedidos

Los administradores pueden consultar el historial de pedidos en modo de solo lectura. El carrito todavía no registra pedidos.

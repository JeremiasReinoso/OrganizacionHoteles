# HotelManager

Sistema local de administración hotelera para recepción, construido con HTML,
CSS, JavaScript ES Modules e IndexedDB. No requiere servidor ni servicios
externos y conserva los datos al recargar o cerrar el navegador.

## Características

- Dashboard operativo con ingresos reales y pendiente de cobro.
- Habitaciones, tipos, huéspedes y reservas.
- Check-in con resumen de estadía y cobro completo, parcial o cero.
- Check-out con cobro de saldo y envío automático a limpieza.
- Centro Pagos con historial, origen CHECK_IN, CHECK_OUT o MANUAL.
- Limpieza, mantenimiento, reportes y backup JSON.

## Arquitectura

UI -> Services -> Repositories -> IndexedDB.

La UI no contiene reglas financieras. Los services validan y coordinan casos
de uso; repositories encapsulan stores; IndexedDB es la única persistencia V1.
Las operaciones críticas usan transacciones atómicas.

## Modelo de datos

RoomType define capacidad y precio. Room pertenece a un tipo. Guest tiene
Reservations. Reservation relaciona huésped, habitación y fechas, y posee
Payments, CheckIn y CheckOut. Housekeeping y Maintenance acompañan el estado
de Room. Settings guarda la configuración del hotel.

Payment contiene id, reservationId, guestId, amount, method, date, status,
origin y notes. Estados financieros: PENDING, PARTIAL y PAID.

## Estados

Reservation: pending, confirmed, checkin, finished, cancelled, no-show.
Room: available, reserved, occupied, cleaning, maintenance.
Housekeeping: pending, in-progress, ready.

## Instalación y ejecución local

Abrir index.html si el navegador permite módulos locales. Recomendado:

    python3 -m http.server 8080

Luego abrir http://localhost:8080.

## GitHub Pages

Publicar la carpeta raíz desde la rama principal. Los recursos son relativos y
funcionan bajo el subdirectorio del repositorio.

## Persistencia y backup

La base es hotel-manager-db, IndexedDB versión 2. El módulo Copias de seguridad
exporta todos los stores a JSON y permite restaurarlos. Mantener backups fuera
del repositorio.

## Flujos principales

Reserva: Huésped -> Disponibilidad -> Habitación -> Reserva.

Check-in: Reserva -> Verificación -> Cobro -> Check-in -> Habitación ocupada.

Check-out: Ocupada -> Cobro de saldo -> Reserva finalizada -> Limpieza.

Limpieza: Pendiente -> En limpieza -> Lista -> Disponible.

## Reglas de negocio

Las reglas de fechas, disponibilidad, pagos, exceso de cobro, estados y
duplicados están centralizadas en hotelService y explicadas en
docs/business-rules.md.

## Tests

Abrir tests/critical-flows.html desde el servidor local. Cubre pago completo,
parcial, pago posterior, check-in sin pago, checkout con saldo, doble click y
exceso de pago. También se verifican sintaxis con node --check y errores de
consola con el navegador.

## Guía para desarrolladores

Consultar docs/development.md para agregar entidades, repositories, services,
pantallas, reglas, estados y métodos de pago. docs/ contiene arquitectura,
base de datos, reglas y flujos sin duplicar detalles del README.

## Roadmap

V1 local con IndexedDB. Próximos pasos: usuarios y roles, API sincronizada,
PostgreSQL, multi-dispositivo y reservas online.

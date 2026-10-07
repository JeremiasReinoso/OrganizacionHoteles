# Base de datos

Nombre: hotel-manager-db. Versión actual: 2.

Stores: roomTypes, rooms, guests, reservations, payments, checkIns, checkOuts,
housekeeping, maintenance y settings. Todos usan id como clave primaria y
createdAt como índice. Payments agrega reservationId.

Relaciones lógicas: Guest -> Reservation -> Room; Reservation -> Payments,
CheckIn y CheckOut; Room -> Housekeeping y Maintenance.

La migración de v2 conserva datos y agrega el índice financiero. Toda futura
migración debe incrementar DB_VERSION y ser idempotente.

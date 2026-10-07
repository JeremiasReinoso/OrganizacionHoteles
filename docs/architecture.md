# Arquitectura

HotelManager V1 es una SPA local y offline-first.

UI -> Services -> Repositories -> IndexedDB

- UI: renderiza pantallas y recoge eventos.
- Services: implementan reglas de negocio y casos de uso.
- Repositories: encapsulan el CRUD de cada store.
- IndexedDB: única fuente persistente de la V1.

Check-in y check-out usan una única transacción para reservar, habitación,
registro operativo y pago. Esto evita estados parciales.

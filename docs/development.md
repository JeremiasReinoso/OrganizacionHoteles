# Guía para desarrolladores

Para agregar una entidad, añade su store, migración, repository, service,
pantalla y pruebas. Los repositories sólo persisten; los services validan y
aplican reglas. Las operaciones que cambian varias entidades deben usar
atomicWrite.

Para agregar una pantalla, crea su render, regístralo en pages y conecta
eventos data-action. No pongas cálculos financieros en la UI.

Para agregar una regla, documenta business-rules.md, centralízala en el
service y añade una prueba. Para cambiar IndexedDB incrementa DB_VERSION y
mantén una migración idempotente. Para un método de pago agrega el valor a
PAYMENT_METHODS y a la documentación.

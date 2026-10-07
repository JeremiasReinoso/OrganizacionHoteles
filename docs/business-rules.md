# Reglas de negocio

- La salida debe ser posterior a la entrada; salida igual a la siguiente entrada no solapa.
- pending, confirmed y checkin bloquean fechas; cancelled, finished y no-show no.
- Mantenimiento, limpieza y ocupación excluyen una habitación de disponibilidad.
- Saldo = max(0, total - pagos válidos).
- 0 pagado = PENDING; parcial = PARTIAL; total = PAID.
- El check-in admite saldo pendiente y también puede realizarse sin pago.
- Se rechazan pagos negativos, cero, no numéricos, método inválido y exceso de saldo.
- El botón se bloquea y el service usa lock por reserva para evitar doble click.
- Check-in cambia reserva a checkin y habitación a occupied.
- Check-out cambia reserva a finished, habitación a cleaning y crea housekeeping.
- Si falla una operación atómica, IndexedDB aborta todo el conjunto.

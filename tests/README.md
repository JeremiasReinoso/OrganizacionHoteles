# Verificación manual de reglas críticas

La V1 no incorpora un runner Node para preservar el requisito de aplicación estática. Verificá en el navegador:

1. Crear dos reservas sobre la misma habitación con fechas superpuestas: la segunda debe rechazarse.
2. Crear reservas consecutivas donde la salida de una coincide con la entrada de otra: deben permitirse.
3. Registrar varios pagos y comprobar saldo pendiente en Check-out.
4. Ejecutar check-in y comprobar habitación `Ocupada`.
5. Ejecutar check-out, comprobar `Limpieza` y marcarla como `Lista` para volver a `Disponible`.
6. Recargar y cerrar/reabrir el navegador: los datos deben permanecer en IndexedDB.

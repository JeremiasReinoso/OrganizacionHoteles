# HotelManager

Aplicación web de administración hotelera local, funcional y preparada para crecer. La V1 usa HTML5, CSS3, JavaScript ES Modules e IndexedDB; no requiere servidor ni servicios externos.

## Funcionalidades

- Configuración inicial del hotel, dashboard operativo y estados de habitaciones.
- CRUD de tipos, habitaciones y huéspedes.
- Reservas con validación de solapamiento y fechas de salida no inclusivas.
- Check-in, check-out, pagos parciales, limpieza y mantenimiento.
- Reportes, exportación CSV y backup/restauración JSON.
- Diseño responsive y persistencia local incluso después de cerrar el navegador.

## Uso local

Abrí `index.html` directamente si el navegador permite módulos locales. Para un servidor local sencillo, desde esta carpeta ejecutá cualquier servidor estático, por ejemplo `python3 -m http.server 8080`, y visitá `http://localhost:8080`.

## GitHub Pages

Subí el contenido de esta carpeta a un repositorio y configurá GitHub Pages para publicar desde la rama principal y la carpeta raíz. Todos los recursos usan rutas relativas (`./`), por lo que también funcionan bajo `/HotelManager/`.

## Arquitectura

La interfaz está en `js/app.js` y componentes, los casos de uso están en `js/services/`, y el acceso a IndexedDB queda encapsulado en `js/database/`. Para una futura API REST solo hay que reemplazar los repositorios/adaptadores, manteniendo los servicios y la interfaz.

## Datos y seguridad

La instalación inicia vacía. La carga demo es opcional y explícita. Los backups no se generan automáticamente ni se incluyen en el repositorio. Los datos ingresados se escapan al renderizar y no se utiliza `eval`.

## Roadmap

V1 local con IndexedDB · V2 usuarios y roles · V3 API · V4 PostgreSQL · V5 sincronización multi-dispositivo · V6 reservas online · V7 panel remoto.

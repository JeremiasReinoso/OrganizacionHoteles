/**
 * constants.js
 *
 * Contrato común de HotelManager: nombres de IndexedDB, estados y navegación.
 * Los estados viven aquí para que servicios, componentes y reportes utilicen
 * exactamente los mismos valores persistidos.
 */

export const DB_NAME = 'hotel-manager-db';
export const DB_VERSION = 2;
export const STORES = ['roomTypes', 'rooms', 'guests', 'reservations', 'payments', 'checkIns', 'checkOuts', 'housekeeping', 'maintenance', 'settings'];
export const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Débito', 'Crédito', 'Otro'];
export const PAYMENT_ORIGINS = { CHECK_IN: 'CHECK_IN', CHECK_OUT: 'CHECK_OUT', MANUAL: 'MANUAL' };
export const PAYMENT_STATUS = { PENDING: 'PENDING', PARTIAL: 'PARTIAL', PAID: 'PAID' };
export const STATUS = {
  room: { AVAILABLE: 'available', RESERVED: 'reserved', OCCUPIED: 'occupied', CLEANING: 'cleaning', MAINTENANCE: 'maintenance' },
  reservation: { PENDING: 'pending', CONFIRMED: 'confirmed', CHECKIN: 'checkin', FINISHED: 'finished', CANCELLED: 'cancelled', NOSHOW: 'no-show' },
  housekeeping: { PENDING: 'pending', IN_PROGRESS: 'in-progress', READY: 'ready' }
};
export const LABELS = {
  available: 'Disponible', reserved: 'Reservada', occupied: 'Ocupada', cleaning: 'Limpieza', maintenance: 'Mantenimiento',
  pending: 'Pendiente', confirmed: 'Confirmada', checkin: 'Check-in', finished: 'Finalizada', cancelled: 'Cancelada',
  'no-show': 'No-show', 'in-progress': 'En limpieza', ready: 'Lista', PENDING: 'Pendiente', PARTIAL: 'Pago parcial', PAID: 'Pagado'
};
export const NAV = [
  ['dashboard', 'Dashboard', '▦'], ['rooms', 'Habitaciones', '▤'], ['roomTypes', 'Tipos de habitación', '◈'], ['guests', 'Huéspedes', '♙'],
  ['reservations', 'Reservas', '▣'], ['checkin', 'Check-in', '→'], ['checkout', 'Check-out', '←'], ['payments', 'Pagos', '$'],
  ['housekeeping', 'Limpieza', '✦'], ['maintenance', 'Mantenimiento', '⚒'], ['reports', 'Reportes', '▥'], ['settings', 'Configuración', '⚙'], ['backup', 'Copias de seguridad', '↥']
];

/**
 * hotelService.js
 *
 * Casos de uso de operación hotelera. Este módulo valida reservas, disponibilidad,
 * pagos y transiciones de habitación; la UI sólo presenta datos y delega aquí.
 * Check-in y check-out usan atomicWrite para que reserva, habitación, pago y
 * registro operativo se confirmen juntos o no se confirme ninguno.
 */
import { roomTypesRepo, roomsRepo, guestsRepo, reservationsRepo, paymentsRepo, checkInsRepo, checkOutsRepo, housekeepingRepo, maintenanceRepo, settingsRepo } from '../database/repositories/index.js';
import { all, atomicWrite } from '../database/db.js';
import { STATUS, PAYMENT_METHODS, PAYMENT_ORIGINS, PAYMENT_STATUS } from '../core/constants.js';
import { overlaps, nights, today } from '../utils/dates.js';
import { required, validDates, positive, strictlyPositive } from '../utils/validators.js';
import { uid } from '../utils/ids.js';

export const repos = { roomTypesRepo, roomsRepo, guestsRepo, reservationsRepo, paymentsRepo, checkInsRepo, checkOutsRepo, housekeepingRepo, maintenanceRepo, settingsRepo };
const activeReservationStatuses = [STATUS.reservation.PENDING, STATUS.reservation.CONFIRMED, STATUS.reservation.CHECKIN];
const inFlight = new Set();

/** @param {string} reservationId @returns {Promise<number>} Total acumulado sin pagos inválidos. */
export async function paidForReservation(reservationId) {
  const payments = await paymentsRepo.list();
  return payments.filter((payment) => payment.reservationId === reservationId && payment.status !== 'VOID').reduce((sum, payment) => sum + Number(payment.amount), 0);
}

/** @param {number} total @param {number} paid @returns {number} Saldo nunca negativo. */
export function pendingBalance(total, paid) { return Math.max(0, Number(total || 0) - Number(paid || 0)); }

/** @param {number} total @param {number} paid @returns {string} Estado financiero centralizado. */
export function paymentStatus(total, paid) {
  const value = Number(paid || 0);
  if (value === 0) return PAYMENT_STATUS.PENDING;
  if (value >= Number(total || 0)) return PAYMENT_STATUS.PAID;
  return PAYMENT_STATUS.PARTIAL;
}

/** Valida la forma mínima de un pago antes de tocar IndexedDB. */
export function validatePayment(data) {
  required(data.reservationId, 'La reserva');
  required(data.guestId, 'El huésped');
  if (!PAYMENT_METHODS.includes(data.method)) throw new Error('El método de pago no es válido.');
  strictlyPositive(data.amount, 'El monto');
  if (!Number.isFinite(Number(data.amount))) throw new Error('El monto debe ser numérico.');
}

/** @param {string} from @param {string} to @param {number} capacity @param {string} typeId @returns {Promise<object[]>} Habitaciones elegibles. */
export async function availability(from, to, capacity, typeId) {
  validDates(from, to);
  const [rooms, reservations] = await Promise.all([roomsRepo.list(), reservationsRepo.list()]);
  return rooms.filter((room) => room.capacity >= Number(capacity || 0) && (!typeId || room.typeId === typeId) && ![STATUS.room.MAINTENANCE, STATUS.room.CLEANING, STATUS.room.OCCUPIED].includes(room.status) && !reservations.some((reservation) => reservation.roomId === room.id && activeReservationStatuses.includes(reservation.status) && overlaps(from, to, reservation.checkIn, reservation.checkOut)));
}

/** Crea reserva, rechazando solapamientos; salida igual a entrada es válida. */
export async function createReservation(data) {
  required(data.guestId, 'El huésped'); required(data.roomId, 'La habitación'); validDates(data.checkIn, data.checkOut); positive(data.discount || 0, 'El descuento');
  if (!(await guestsRepo.get(data.guestId))) throw new Error('El huésped no existe.');
  const room = await roomsRepo.get(data.roomId); if (!room || room.status === STATUS.room.MAINTENANCE) throw new Error('La habitación no está disponible.');
  const current = await reservationsRepo.list();
  if (current.some((item) => item.roomId === data.roomId && activeReservationStatuses.includes(item.status) && overlaps(data.checkIn, data.checkOut, item.checkIn, item.checkOut))) throw new Error('La habitación ya está reservada en esas fechas.');
  const total = Math.max(0, nights(data.checkIn, data.checkOut) * Number(data.pricePerNight) - Number(data.discount || 0));
  const reservation = await reservationsRepo.save({ ...data, code: data.code || `HM-${Date.now().toString().slice(-6)}`, total, status: data.status || STATUS.reservation.CONFIRMED });
  if (reservation.status === STATUS.reservation.CONFIRMED) await roomsRepo.save({ ...room, status: STATUS.room.RESERVED });
  return reservation;
}

/** Registra pago manual con validación de saldo y origen explícito. */
export async function recordPayment(data) {
  validatePayment(data);
  const [reservation, guest, paid] = await Promise.all([reservationsRepo.get(data.reservationId), guestsRepo.get(data.guestId), paidForReservation(data.reservationId)]);
  if (!reservation) throw new Error('La reserva no existe.'); if (!guest) throw new Error('El huésped no existe.');
  if (paid + Number(data.amount) > Number(reservation.total)) throw new Error('El pago supera el saldo pendiente. Verifica el monto antes de registrar.');
  return paymentsRepo.save({ ...data, date: data.date || new Date().toISOString(), status: paymentStatus(reservation.total, paid + Number(data.amount)), origin: data.origin || PAYMENT_ORIGINS.MANUAL, notes: data.notes || data.note || '' });
}

/** Datos que Check-in muestra como resumen y que ambos flujos reutilizan. */
export async function staySummary(reservationId) {
  const reservation = await reservationsRepo.get(reservationId); if (!reservation) throw new Error('La reserva no existe.');
  const [guest, room, roomTypes, paid] = await Promise.all([guestsRepo.get(reservation.guestId), roomsRepo.get(reservation.roomId), roomTypesRepo.list(), paidForReservation(reservationId)]);
  if (!guest || !room) throw new Error('La reserva tiene huésped o habitación inválidos.');
  return { reservation, guest, room, roomType: roomTypes.find((type) => type.id === room.typeId), nights: nights(reservation.checkIn, reservation.checkOut), paid, pending: pendingBalance(reservation.total, paid), paymentStatus: paymentStatus(reservation.total, paid) };
}

function paymentRecord(reservation, amount, method, origin, notes, accumulatedPaid = amount) {
  const now = new Date().toISOString();
  return { id: uid(), reservationId: reservation.id, guestId: reservation.guestId, amount: Number(amount), method, date: now, status: paymentStatus(reservation.total, accumulatedPaid), origin, notes: notes || '', createdAt: now, updatedAt: now };
}

/**
 * Confirma check-in y, opcionalmente, cobra en una sola transacción.
 * El lock en memoria evita doble click y la transacción protege la persistencia.
 * El saldo pendiente no bloquea el check-in: la V1 admite pagos parciales o cero.
 * @param {string} reservationId @param {{amount?: number, method?: string, registerPayment?: boolean, notes?: string}} options
 * @returns {Promise<object>} Resumen confirmado del check-in.
 */
export async function doCheckin(reservationId, options = {}) {
  if (inFlight.has(`checkin:${reservationId}`)) throw new Error('La operación ya está en proceso.');
  inFlight.add(`checkin:${reservationId}`);
  try {
    const summary = await staySummary(reservationId);
    if (![STATUS.reservation.PENDING, STATUS.reservation.CONFIRMED].includes(summary.reservation.status)) throw new Error('La reserva no puede realizar check-in.');
    if (summary.reservation.checkOut <= today()) throw new Error('La reserva ya terminó.');
    if (![STATUS.room.AVAILABLE, STATUS.room.RESERVED].includes(summary.room.status)) throw new Error('La habitación no está disponible para ocupar.');
    const amount = Number(options.amount || 0);
    const shouldPay = Boolean(options.registerPayment) && amount > 0;
    if (shouldPay) { validatePayment({ reservationId, guestId: summary.guest.id, amount, method: options.method }); if (amount > summary.pending) throw new Error('El monto supera el saldo pendiente. Corrige el importe o confirma sin cobrar.'); }
    const checkIn = { id: uid(), reservationId, date: new Date().toISOString(), notes: options.notes || '', createdAt: new Date().toISOString() };
    await atomicWrite(['reservations', 'rooms', 'checkIns', 'payments'], (stores) => {
      const now = new Date().toISOString();
      stores.reservations.put({ ...summary.reservation, status: STATUS.reservation.CHECKIN, updatedAt: now });
      stores.rooms.put({ ...summary.room, status: STATUS.room.OCCUPIED, updatedAt: now });
      stores.checkIns.put(checkIn);
      if (shouldPay) stores.payments.put(paymentRecord(summary.reservation, amount, options.method, PAYMENT_ORIGINS.CHECK_IN, options.notes, summary.paid + amount));
    });
    return { ...summary, paid: summary.paid + (shouldPay ? amount : 0), pending: pendingBalance(summary.reservation.total, summary.paid + (shouldPay ? amount : 0)) };
  } finally { inFlight.delete(`checkin:${reservationId}`); }
}

/** Cobra saldo opcional y finaliza una estadía atómicamente; deja la habitación en limpieza. */
export async function doCheckout(reservationId, options = {}) {
  if (inFlight.has(`checkout:${reservationId}`)) throw new Error('La operación ya está en proceso.');
  inFlight.add(`checkout:${reservationId}`);
  try {
    const summary = await staySummary(reservationId);
    if (summary.reservation.status !== STATUS.reservation.CHECKIN) throw new Error('Sólo una reserva en check-in puede finalizarse.');
    const amount = Number(options.amount || 0);
    if (amount > summary.pending) throw new Error('El monto supera el saldo pendiente.');
    const shouldPay = amount > 0;
    if (shouldPay) validatePayment({ reservationId, guestId: summary.guest.id, amount, method: options.method });
    const now = new Date().toISOString();
    await atomicWrite(['reservations', 'rooms', 'checkOuts', 'housekeeping', 'payments'], (stores) => {
      stores.reservations.put({ ...summary.reservation, status: STATUS.reservation.FINISHED, updatedAt: now });
      stores.rooms.put({ ...summary.room, status: STATUS.room.CLEANING, updatedAt: now });
      stores.checkOuts.put({ id: uid(), reservationId, date: now, notes: options.notes || '', createdAt: now });
      stores.housekeeping.put({ id: uid(), roomId: summary.room.id, reservationId, status: STATUS.housekeeping.PENDING, at: now, createdAt: now });
      if (shouldPay) stores.payments.put(paymentRecord(summary.reservation, amount, options.method, PAYMENT_ORIGINS.CHECK_OUT, options.notes, summary.paid + amount));
    });
    return { ...summary, paid: summary.paid + (shouldPay ? amount : 0), pending: pendingBalance(summary.reservation.total, summary.paid + (shouldPay ? amount : 0)) };
  } finally { inFlight.delete(`checkout:${reservationId}`); }
}

/** Envía habitación a mantenimiento y la excluye de disponibilidad. */
export async function setMaintenance(roomId, motive) { const room = await roomsRepo.get(roomId); if (!room) throw new Error('Habitación inexistente.'); required(motive, 'El motivo'); await roomsRepo.save({ ...room, status: STATUS.room.MAINTENANCE }); return maintenanceRepo.save({ roomId, motive, status: 'active', date: today() }); }
/** Marca habitación limpia y completa la tarea de housekeeping. */
export async function markReady(roomId) { const room = await roomsRepo.get(roomId); if (!room) throw new Error('Habitación inexistente.'); await roomsRepo.save({ ...room, status: STATUS.room.AVAILABLE }); const tasks = await housekeepingRepo.list(); const task = tasks.find((item) => item.roomId === roomId && item.status !== STATUS.housekeeping.READY); if (task) await housekeepingRepo.save({ ...task, status: STATUS.housekeeping.READY, completedAt: new Date().toISOString() }); }

/**
 * critical-flows.js
 *
 * Smoke tests ejecutables en navegador para los flujos financieros V1. Usa
 * IndexedDB real, por lo que valida persistencia, transacciones y reglas
 * igual que la aplicación, sin una segunda fuente de datos.
 */
import { clearStore, all } from '../js/database/db.js';
import { repos, createReservation, doCheckin, doCheckout, recordPayment, paidForReservation } from '../js/services/hotelService.js';
import { STORES } from '../js/core/constants.js';

const output = document.querySelector('#output');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function fixture() {
  for (const store of STORES) await clearStore(store);
  const type = await repos.roomTypesRepo.save({ name: 'Test', capacity: 2 });
  const room = await repos.roomsRepo.save({ number: 'T1', typeId: type.id, capacity: 2, status: 'available' });
  const guest = await repos.guestsRepo.save({ firstName: 'Test', lastName: 'Guest', document: '1' });
  const reservation = await createReservation({ guestId: guest.id, roomId: room.id, checkIn: new Date().toISOString().slice(0, 10), checkOut: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), pricePerNight: 75000, discount: 0 });
  return { room, guest, reservation };
}
async function run() {
  const results = [];
  let f = await fixture(); let checkin = await doCheckin(f.reservation.id, { amount: 150000, method: 'Efectivo', registerPayment: true }); assert(checkin.pending === 0, 'Caso 1: saldo cero'); results.push('Caso 1 OK');
  f = await fixture(); checkin = await doCheckin(f.reservation.id, { amount: 80000, method: 'Transferencia', registerPayment: true }); assert(checkin.pending === 70000, 'Caso 2: saldo parcial'); results.push('Caso 2 OK');
  await recordPayment({ reservationId: f.reservation.id, guestId: f.guest.id, amount: 70000, method: 'Débito' }); assert(await paidForReservation(f.reservation.id) === 150000, 'Caso 3: pago posterior'); results.push('Caso 3 OK');
  f = await fixture(); checkin = await doCheckin(f.reservation.id, { amount: 0, registerPayment: false, method: 'Efectivo' }); assert(checkin.paid === 0 && checkin.pending === 150000, 'Caso 4: check-in sin pago'); results.push('Caso 4 OK');
  const checkout = await doCheckout(f.reservation.id, { amount: 150000, method: 'Crédito' }); const roomAfter = await repos.roomsRepo.get(f.room.id); const reservationAfter = await repos.reservationsRepo.get(f.reservation.id); assert(checkout.pending === 0 && roomAfter.status === 'cleaning' && reservationAfter.status === 'finished', 'Caso 5: checkout'); results.push('Caso 5 OK');
  f = await fixture(); const clicks = await Promise.allSettled([doCheckin(f.reservation.id, { amount: 80000, method: 'Efectivo', registerPayment: true }), doCheckin(f.reservation.id, { amount: 80000, method: 'Efectivo', registerPayment: true })]); assert((await all('payments')).length === 1 && clicks.filter((x) => x.status === 'fulfilled').length === 1, 'Caso 6: doble click'); results.push('Caso 6 OK');
  f = await fixture(); let rejected = false; try { await doCheckin(f.reservation.id, { amount: 150001, method: 'Efectivo', registerPayment: true }); } catch (error) { rejected = /supera/.test(error.message); } assert(rejected && (await all('payments')).length === 0, 'Caso 7: exceso'); results.push('Caso 7 OK');
  output.textContent = results.join('\n') + '\n\nTODAS LAS PRUEBAS PASARON';
}
run().catch((error) => { output.textContent = 'FALLÓ: ' + error.message; console.error(error); });

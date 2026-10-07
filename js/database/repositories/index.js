/**
 * index.js
 *
 * Composition root de repositories. Cada export administra una entidad y su
 * store; los services consumen estos contratos sin depender de IndexedDB.
 */
import {repository} from './baseRepository.js'; export const roomTypesRepo=repository('roomTypes'); export const roomsRepo=repository('rooms'); export const guestsRepo=repository('guests'); export const reservationsRepo=repository('reservations'); export const paymentsRepo=repository('payments'); export const checkInsRepo=repository('checkIns'); export const checkOutsRepo=repository('checkOuts'); export const housekeepingRepo=repository('housekeeping'); export const maintenanceRepo=repository('maintenance'); export const settingsRepo=repository('settings');

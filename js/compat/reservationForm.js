/**
 * reservationForm.js
 *
 * Compatibilidad del formulario de reserva existente. Mantiene la creación
 * desde la pantalla Reservas y delega cálculo, solapamientos y persistencia al
 * mismo createReservation usado por los demás flujos.
 */
import { repos, createReservation } from '../services/hotelService.js';
import { all } from '../database/db.js';
import { modal } from '../components/ui.js';
import { today } from '../utils/dates.js';
import { esc } from '../utils/formatters.js';

document.addEventListener('click', async (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action !== 'new-reservation') return;
  document.querySelector('#modal')?.remove();
  const [guests, rooms] = await Promise.all([all('guests'), all('rooms')]);
  const body = '<form id="reservation-compat-form" class="stack"><div class="field"><label>Huésped *</label><select class="select" name="guestId" required>' + guests.map((g) => '<option value="' + g.id + '">' + esc(g.firstName + ' ' + g.lastName) + '</option>').join('') + '</select></div><div class="form-grid"><div class="field"><label>Entrada *</label><input class="input" type="date" name="checkIn" value="' + today() + '" required></div><div class="field"><label>Salida *</label><input class="input" type="date" name="checkOut" required></div><div class="field"><label>Habitación *</label><select class="select" name="roomId" required>' + rooms.map((r) => '<option value="' + r.id + '">' + esc(r.number) + '</option>').join('') + '</select></div><div class="field"><label>Precio por noche</label><input class="input" type="number" name="pricePerNight" min="0" required></div><div class="field"><label>Descuento</label><input class="input" type="number" name="discount" min="0" value="0"></div></div><div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-action="close-modal">Cancelar</button><button class="btn btn-primary">Guardar reserva</button></div></form>';
  document.body.insertAdjacentHTML('beforeend', modal('Nueva reserva', body));
});
document.addEventListener('submit', async (event) => {
  if (event.target.id !== 'reservation-compat-form') return;
  event.preventDefault(); event.stopImmediatePropagation();
  try { await createReservation(Object.fromEntries(new FormData(event.target))); document.querySelector('#modal')?.remove(); location.reload(); } catch (error) { alert(error.message); }
}, true);

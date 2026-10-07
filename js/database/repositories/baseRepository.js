/**
 * baseRepository.js
 *
 * Fábrica CRUD para una entidad de IndexedDB. El repository sólo traduce
 * list/get/save/remove; validaciones y reglas de negocio pertenecen a services.
 */
import {all,get,put,remove} from '../db.js'; import {uid} from '../../utils/ids.js';
/** @param {string} store - Store administrado por el repository. */
export const repository=store=>({list:()=>all(store),get:id=>get(store,id),save:async value=>{const now=new Date().toISOString();return put(store,{...value,id:value.id||uid(),createdAt:value.createdAt||now,updatedAt:now})},remove:id=>remove(store,id)});

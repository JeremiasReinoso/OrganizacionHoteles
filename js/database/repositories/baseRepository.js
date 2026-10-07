import {all,get,put,remove} from '../db.js'; import {uid} from '../../utils/ids.js';
export const repository=store=>({list:()=>all(store),get:id=>get(store,id),save:async value=>{const now=new Date().toISOString();return put(store,{...value,id:value.id||uid(),createdAt:value.createdAt||now,updatedAt:now})},remove:id=>remove(store,id)});

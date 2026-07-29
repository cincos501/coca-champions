// src/services/futbol.service.ts
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query
} from 'firebase/firestore';
import type { Equipo, Jugador, Partido, EdicionConfig, DiaDisponibilidad } from '../types/futbol.types';

const COLECCION_EQUIPOS = 'equipos';
const COLECCION_JUGADORES = 'jugadores';
const COLECCION_PARTIDOS = 'partidos';
const COLECCION_EDICIONES = 'ediciones';

// Helper para limpiar valores undefined antes de enviar a Firestore
function limpiarDatos<T extends object>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// ==========================================
// 1. SERVICIO PRINCIPAL DEL TORNEO (FutbolService)
// ==========================================
export class FutbolService {

  // LISTENERS EN TIEMPO REAL CON MANEJO DE ERRORES
  static escucharEquipos(callback: (equipos: Equipo[]) => void, onError?: (err: Error) => void) {
    const q = query(collection(db, COLECCION_EQUIPOS));
    return onSnapshot(q, (snapshot) => {
      const equipos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Equipo[];
      callback(equipos);
    }, (error) => {
      console.error("Error al escuchar equipos:", error);
      if (onError) onError(error);
      callback([]);
    });
  }

  static escucharJugadores(callback: (jugadores: Jugador[]) => void, onError?: (err: Error) => void) {
    const q = query(collection(db, COLECCION_JUGADORES));
    return onSnapshot(q, (snapshot) => {
      const jugadores = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Jugador[];
      callback(jugadores);
    }, (error) => {
      console.error("Error al escuchar jugadores:", error);
      if (onError) onError(error);
      callback([]);
    });
  }

  static escucharPartidos(callback: (partidos: Partido[]) => void, onError?: (err: Error) => void) {
    const q = query(collection(db, COLECCION_PARTIDOS));
    return onSnapshot(q, (snapshot) => {
      const partidos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Partido[];
      callback(partidos);
    }, (error) => {
      console.error("Error al escuchar partidos:", error);
      if (onError) onError(error);
      callback([]);
    });
  }

  // GESTIÓN DE JUGADORES
  static async registrarJugador(jugador: Omit<Jugador, 'id'>) {
    const payload = limpiarDatos({
      ...jugador,
      disponibilidad: jugador.disponibilidad ?? 'Ambos',
      id_equipo: jugador.id_equipo ?? ''
    });
    return await addDoc(collection(db, COLECCION_JUGADORES), payload);
  }

  static async actualizarJugador(id: string, datos: Partial<Jugador>) {
    const docRef = doc(db, COLECCION_JUGADORES, id);
    return await updateDoc(docRef, limpiarDatos(datos));
  }

  static async eliminarJugador(id: string) {
    const docRef = doc(db, COLECCION_JUGADORES, id);
    return await deleteDoc(docRef);
  }

  static async importarJugadorAEdicionActual(
    jugadorOrigen: Jugador, 
    nuevaDisponibilidad: DiaDisponibilidad, 
    edicionDestinoId: string
  ) {
    return await this.registrarJugador({
      nombre: jugadorOrigen.nombre,
      id_equipo: '', // Ingresa libre a la bolsa de sorteo
      disponibilidad: nuevaDisponibilidad,
      edicion_id: edicionDestinoId
    });
  }

  // GESTIÓN DE EQUIPOS / SELECCIONES
  static async crearEquipo(equipo: Omit<Equipo, 'id'>) {
    const payload = limpiarDatos({
      ...equipo,
      puntos: 0,
      partidos_jugados: 0,
      partidos_ganados: 0,
      partidos_empatados: 0,
      partidos_perdidos: 0,
      goles_favor: 0,
      goles_contra: 0,
      diferencia_goles: 0
    });
    return await addDoc(collection(db, COLECCION_EQUIPOS), payload);
  }

  static async actualizarEquipo(id: string, datos: Partial<Equipo>) {
    const docRef = doc(db, COLECCION_EQUIPOS, id);
    return await updateDoc(docRef, limpiarDatos(datos));
  }

  static async eliminarEquipo(id: string) {
    const docRef = doc(db, COLECCION_EQUIPOS, id);
    return await deleteDoc(docRef);
  }

  // GESTIÓN DE PARTIDOS Y FIXTURE
  static async crearPartido(partido: Omit<Partido, 'id'>) {
    const payload = limpiarDatos({
      ...partido,
      goles_local: partido.goles_local ?? 0,
      goles_visitante: partido.goles_visitante ?? 0,
      estado: partido.estado ?? 'programado',
      fecha_creacion: new Date().toISOString()
    });
    return await addDoc(collection(db, COLECCION_PARTIDOS), payload);
  }

  static async actualizarPartido(id: string, datos: Partial<Partido>) {
    const docRef = doc(db, COLECCION_PARTIDOS, id);
    return await updateDoc(docRef, limpiarDatos(datos));
  }

  static async eliminarPartido(id: string) {
    const docRef = doc(db, COLECCION_PARTIDOS, id);
    return await deleteDoc(docRef);
  }
}

// ==========================================
// 2. SERVICIO DE EDICIONES (EdicionesService)
// ==========================================
export class EdicionesService {
  
  static escucharEdiciones(callback: (ediciones: EdicionConfig[]) => void, onError?: (err: Error) => void) {
    const q = query(collection(db, COLECCION_EDICIONES));
    return onSnapshot(q, (snapshot) => {
      const ediciones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EdicionConfig[];
      callback(ediciones);
    }, (error) => {
      console.error("Error al escuchar ediciones:", error);
      if (onError) onError(error);
      callback([]);
    });
  }

  static async crearEdicion(edicion: Omit<EdicionConfig, 'id'>) {
    const payload = limpiarDatos(edicion);
    return await addDoc(collection(db, COLECCION_EDICIONES), payload);
  }

  static async actualizarEdicion(id: string, datos: Partial<EdicionConfig>) {
    const docRef = doc(db, COLECCION_EDICIONES, id);
    return await updateDoc(docRef, limpiarDatos(datos));
  }

  static async eliminarEdicion(id: string) {
    const docRef = doc(db, COLECCION_EDICIONES, id);
    return await deleteDoc(docRef);
  }

  static async activarEdicion(idEdicionActivar: string, todasLasEdiciones: EdicionConfig[]) {
    for (const ed of todasLasEdiciones) {
      if (ed.id) {
        const docRef = doc(db, COLECCION_EDICIONES, ed.id);
        await updateDoc(docRef, { activa: ed.id === idEdicionActivar });
      }
    }
  }
}
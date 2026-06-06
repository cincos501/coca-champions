// src/services/futbol.service.ts
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  writeBatch, 
  doc, 
  deleteDoc, 
  updateDoc, 
  setDoc, // 👈 Obligatorio para fusionar datos de documentos existentes de forma segura
  onSnapshot,
  increment 
} from 'firebase/firestore';
import type { Jugador, Equipo, Partido, Grupo } from '../types/futbol.types';

const equiposRef = collection(db, 'equipos');
const jugadoresRef = collection(db, 'jugadores');
const partidosRef = collection(db, 'partidos');

export const FutbolService = {
  /* ==========================================================================
     MÓDULO DE EQUIPOS E HINCHADA
     ========================================================================== */

  async crearEquipo(equipo: Equipo): Promise<string> {
    // Inicializamos el contador de hinchada en 0 al crear el equipo
    const docRef = await addDoc(equiposRef, { ...equipo, votos_hinchada: 0 });
    return docRef.id;
  },

  async obtenerEquipos(): Promise<Equipo[]> {
    const snapshot = await getDocs(equiposRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipo));
  },

  escucharEquipos(callback: (equipos: Equipo[]) => void) {
    return onSnapshot(equiposRef, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipo));
      callback(lista);
    });
  },

  async eliminarEquipo(idEquipo: string): Promise<void> {
    const equipoDoc = doc(db, 'equipos', idEquipo);
    await deleteDoc(equipoDoc);

    const jugadoresSnap = await getDocs(query(jugadoresRef, where('id_equipo', '==', idEquipo)));
    const batch = writeBatch(db);
    jugadoresSnap.forEach((doc) => { batch.delete(doc.ref); });
    await batch.commit();
  },

  async votarPorHinchada(idEquipo: string): Promise<void> {
    if (!idEquipo) throw new Error("ID de equipo no suministrado.");
    const equipoDoc = doc(db, 'equipos', idEquipo);
    // setDoc con merge previene errores si el campo votos_hinchada no existía
    await setDoc(equipoDoc, {
      votos_hinchada: increment(1)
    }, { merge: true });
  },

  /* ==========================================================================
     MÓDULO DE JUGADORES
     ========================================================================== */

  async registrarJugador(jugador: Jugador): Promise<{ exito: boolean; mensaje: string }> {
    const q = query(jugadoresRef, where('id_equipo', '==', jugador.id_equipo));
    const snapshot = await getDocs(q);

    if (snapshot.size >= 6) {
      return { exito: false, mensaje: 'El equipo ya cuenta con el máximo de 6 jugadores.' };
    }

    await addDoc(jugadoresRef, jugador);
    return { exito: true, mensaje: 'Jugador registrado exitosamente.' };
  },

  async obtenerJugadores(): Promise<Jugador[]> {
    const snapshot = await getDocs(jugadoresRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Jugador));
  },

  escucharJugadores(callback: (jugadores: Jugador[]) => void) {
    return onSnapshot(jugadoresRef, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Jugador));
      callback(lista);
    });
  },

  async eliminarJugador(idJugador: string): Promise<void> {
    const jugadorDoc = doc(db, 'jugadores', idJugador);
    await deleteDoc(jugadorDoc);
  },

  /* ==========================================================================
     MÓDULO: GESTIÓN DE GRUPOS, FIXTURE Y QUINIELA
     ========================================================================== */

  async asignarGrupoAEquipo(idEquipo: string, grupo: Grupo | null): Promise<void> {
    const equipoDoc = doc(db, 'equipos', idEquipo);
    await updateDoc(equipoDoc, { grupo });
  },

  async programarPartido(partido: Omit<Partido, 'id'>): Promise<string> {
    const docRef = await addDoc(partidosRef, {
      ...partido,
      votos_local: 0,
      votos_empate: 0,
      votos_visitante: 0
    });
    return docRef.id;
  },

  async votarEnQuiniela(idPartido: string, opcion: 'local' | 'empate' | 'visitante'): Promise<void> {
    if (!idPartido) throw new Error("ID de partido no suministrado.");
    const partidoDoc = doc(db, 'partidos', idPartido);
    const campo = opcion === 'local' ? 'votos_local' : opcion === 'empate' ? 'votos_empate' : 'votos_visitante';
    
    await setDoc(partidoDoc, {
      [campo]: increment(1)
    }, { merge: true });
  },

  // 🔄 NUEVO MÉTODO: Permite restar el error anterior y sumar a la nueva opción en un paso atómico
  async cambiarPronosticoPartido(
    idPartido: string, 
    opcionVieja: 'local' | 'empate' | 'visitante', 
    opcionNueva: 'local' | 'empate' | 'visitante'
  ): Promise<void> {
    if (!idPartido) throw new Error("ID de partido no suministrado.");
    const partidoDoc = doc(db, 'partidos', idPartido);
    
    const campoRestar = opcionVieja === 'local' ? 'votos_local' : opcionVieja === 'empate' ? 'votos_empate' : 'votos_visitante';
    const campoSumar = opcionNueva === 'local' ? 'votos_local' : opcionNueva === 'empate' ? 'votos_empate' : 'votos_visitante';
    
    await setDoc(partidoDoc, {
      [campoRestar]: increment(-1),
      [campoSumar]: increment(1)
    }, { merge: true });
  },

  async actualizarResultadoPartido(idPartido: string, golesLocal: number, golesVisitante: number): Promise<void> {
    const partidoDoc = doc(db, 'partidos', idPartido);
    await updateDoc(partidoDoc, {
      goles_local: golesLocal,
      goles_visitante: golesVisitante,
      estado: 'jugado'
    });
  },

  async eliminarPartido(idPartido: string): Promise<void> {
    const partidoDoc = doc(db, 'partidos', idPartido);
    await deleteDoc(partidoDoc);
  },

  escucharPartidos(callback: (partidos: Partido[]) => void) {
    return onSnapshot(partidosRef, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Partido));
      callback(lista);
    });
  },

  /* ==========================================================================
     ENLACES DIRECTOS PARA COMPONENTES (RESOLUCIÓN DE ERRORES EN CONSOLA)
     ========================================================================== */
  async registrarPronosticoPartido(idPartido: string, opcion: 'local' | 'empate' | 'visitante'): Promise<void> {
    return this.votarEnQuiniela(idPartido, opcion);
  },

  async votarHinchadaEquipo(idEquipo: string): Promise<void> {
    return this.votarPorHinchada(idEquipo);
  }
};
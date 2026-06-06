// src/types/futbol.types.ts

// 👈 NUEVO: Declaración explícita para evitar el error de importación en AdminPanel
export type DiaJuego = 'Sábado' | 'Domingo';

export type Grupo = 'A' | 'B';

// 👈 NUEVO: Molde oficial de Jugador que TypeScript estaba buscando y no encontraba
export interface Jugador {
  id?: string;
  nombre: string;
  id_equipo: string; // Relación o llave foránea con el Equipo
}

export interface Equipo {
  id?: string;
  nombre: string;
  dia_juego: DiaJuego; // Usamos el tipo estricto que acabamos de declarar arriba
  grupo?: Grupo | null;
  votos_hinchada?: number; // Contador de apoyo de la tribuna (Hinchada masiva)
}

export interface Partido {
  id?: string;
  dia_juego: DiaJuego;
  grupo: Grupo;
  vuelta: '1RA VUELTA' | '2DA VUELTA' | '3RA VUELTA';
  id_local: string;
  nombre_local: string;
  id_visitante: string;
  nombre_visitante: string;
  goles_local?: number;
  goles_visitante?: number;
  estado: 'programado' | 'jugado';
  // Campos de la Quiniela interactiva en tiempo real
  votos_local?: number;
  votos_empate?: number;
  votos_visitante?: number;
}
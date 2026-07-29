// src/types/futbol.types.ts

export type DiaJuego = 'Sábado' | 'Domingo';
export type DiaDisponibilidad = 'Sábado' | 'Domingo' | 'Ambos';
export type Grupo = 'A' | 'B' | 'C' | 'D';
export type EstadoPartido = 'programado' | 'en_juego' | 'jugado';

export interface EdicionConfig {
  id?: string;
  numero: number;              // Ej: 7, 8, 9
  nombre: string;              // Ej: "VII Edición"
  activa: boolean;             // Si es la edición activa en curso
  fecha_sorteo: string;        // Ej: "Viernes 31 de Julio"
  fecha_sabado: string;        // Ej: "Sábado 1 de Agosto"
  fecha_domingo: string;       // Ej: "Domingo 2 de Agosto"
  ubicacion: string;           // Ej: "Cancha Villa Busch"
  costo_inscripcion: number;   // Ej: 3
  reglas_oro: string[];        // Array de reglas configurables
  premios: {
    primer_lugar: string;
    segundo_lugar: string;
  };
  cuadro_honor?: {
    campeon?: string;
    subcampeon?: string;
    goleador?: string;
  };
}

export interface Equipo {
  id?: string;
  nombre: string;
  dia_juego: DiaJuego;
  grupo?: Grupo;
  edicion_id: string;          // OBLIGATORIO: ID de la edición a la que pertenece
  puntos?: number;
  partidos_jugados?: number;
  partidos_ganados?: number;
  partidos_empatados?: number;
  partidos_perdidos?: number;
  goles_favor?: number;
  goles_contra?: number;
  diferencia_goles?: number;
}

export interface Jugador {
  id?: string;
  nombre: string;
  id_equipo?: string;          // Vacío o undefined si está en la bolsa de sorteo
  disponibilidad?: DiaDisponibilidad;
  edicion_id: string;          // OBLIGATORIO: FK a Edición
}

export interface Partido {
  id?: string;
  id_equipo_local: string;
  id_equipo_visitante: string;
  nombre_local: string;
  nombre_visitante: string;
  goles_local: number;
  goles_visitante: number;
  dia_juego: DiaJuego;
  estado: EstadoPartido;
  fase: string;                // Ej: 'Grupo A', 'Semifinal', 'Final'
  edicion_id: string;          // OBLIGATORIO: FK a Edición
  fecha_creacion?: string | Date;
}
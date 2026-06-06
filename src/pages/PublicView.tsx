// src/pages/PublicView.tsx
import { useEffect, useState } from 'react';
import { FutbolService } from '../services/futbol.service';
import type { Equipo, Jugador, Partido, DiaJuego } from '../types/futbol.types';
import { Trophy, Award, Target, ShieldAlert, Star } from 'lucide-react';

// Importación de Componentes Modulares
import HeroBanner from '../components/public/HeroBanner';
import InfoButtons from '../components/public/InfoButtons';
import InfoModal from '../components/public/InfoModal';
import PublicTeamCard from '../components/public/PublicTeamCard';
import MatchesTimeline from '../components/public/MatchesTimeline';

type ModalTipo = 'reglamento' | 'premios' | 'formato' | null;

export default function PublicView() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]); 
  const [loading, setLoading] = useState<boolean>(true);
  const [modalAbierto, setModalAbierto] = useState<ModalTipo>(null);
  
  // 👈 FILTRADOR MAESTRO PARA EVITAR CONFUSIÓN DE JORNADAS
  const [diaFiltro, setDiaFiltro] = useState<DiaJuego>('Sábado');

  // CONEXIÓN SINGLE PAGE APPLICATION (SPA) MULTI-STREAM EN TIEMPO REAL
  useEffect(() => {
    const desuscribirEquipos = FutbolService.escucharEquipos((listaEquipos) => {
      setEquipos(listaEquipos);
    });

    const desuscribirJugadores = FutbolService.escucharJugadores((listaJugadores) => {
      setJugadores(listaJugadores);
    });

    const desuscribirPartidos = FutbolService.escucharPartidos((listaPartidos) => {
      setPartidos(listaPartidos);
      setLoading(false);
    });

    return () => {
      desuscribirEquipos();
      desuscribirJugadores();
      desuscribirPartidos();
    };
  }, []);

  // Filtrado de equipos e itinerario según la jornada seleccionada en el menú reactivo
  const equiposFiltrados = equipos.filter(eq => eq.dia_juego === diaFiltro);
  const partidosFiltrados = partidos.filter(p => p.dia_juego === diaFiltro);

  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-sans antialiased">
      
      {/* 🔴 Encabezado de Marca Oficial */}
      <HeroBanner />

      {/* 📋 Accesos a Reglas, Premios y Formatos */}
      <InfoButtons onOpenModal={setModalAbierto} />

      {/* 📊 Bloque de Datos Dinámicos */}
      <div className="max-w-7xl mx-auto px-4 mt-12 space-y-12">
        
        {loading ? (
          <div className="py-16 text-center text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">
            Sincronizando Tableros de la Coca Champions...
          </div>
        ) : (
          <>
            {/* 🌟 APARTADO DE GANADORES Y CUADRO DE HONOR (Marcador de Posición para el Cierre de la Edición) */}
            <div className="bg-linear-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Trophy className="w-36 h-36 text-amber-500 transform rotate-12" />
              </div>

              <div className="flex items-center gap-2 border-b border-amber-200/60 pb-3 mb-4">
                <Award className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-sm uppercase text-amber-900 tracking-tight">Cuadro de Honor — VI Edición 2026</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Campeón Absoluto */}
                <div className="bg-white/80 p-4 border border-amber-100 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl"><Trophy className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Campeón Absoluto</p>
                    <p className="text-xs font-black text-gray-800 uppercase mt-0.5 tracking-tight italic">🏆 Por Definirse</p>
                  </div>
                </div>

                {/* Subcampeón */}
                <div className="bg-white/80 p-4 border border-amber-100 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-gray-100 text-gray-500 rounded-xl"><Award className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Subcampeón</p>
                    <p className="text-xs font-bold text-gray-500 uppercase mt-0.5">Por Definirse</p>
                  </div>
                </div>

                {/* Máximo Goleador */}
                <div className="bg-white/80 p-4 border border-amber-100 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><Target className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Máximo Goleador</p>
                    <p className="text-xs font-bold text-gray-500 uppercase mt-0.5">Por Definirse</p>
                  </div>
                </div>

                {/* Valla Menos Vencida */}
                <div className="bg-white/80 p-4 border border-amber-100 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Star className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Mejor Arquero</p>
                    <p className="text-xs font-bold text-gray-500 uppercase mt-0.5">Por Definirse</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 🗓️ INTERFAZ DE CONTROL JORNADA SELECCIONADA */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase text-white ${
                    diaFiltro === 'Sábado' ? 'bg-[#F40009]' : 'bg-black'
                  }`}>
                    {diaFiltro === 'Sábado' ? 'Jornada 1' : 'Jornada 2'}
                  </span>
                  <h3 className="font-black text-base uppercase text-gray-900 tracking-tight">
  {diaFiltro === 'Sábado' 
    ? 'Clasificatoria Sábado 6 de Junio — Inicio 2:30 P.M.' 
    : 'Fase Final Domingo 7 de Junio — Inicio 8:30 A.M.'}
</h3>
                </div>

                {/* Selector Reactivo Táctil */}
                <div className="flex bg-gray-200/70 p-1 rounded-xl border border-gray-200 shrink-0 w-full sm:w-auto">
                  <button 
                    onClick={() => setDiaFiltro('Sábado')} 
                    className={`flex-1 sm:flex-none text-center px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      diaFiltro === 'Sábado' ? 'bg-white text-gray-950 shadow-xs' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Ver Sábado
                  </button>
                  <button 
                    onClick={() => setDiaFiltro('Domingo')} 
                    className={`flex-1 sm:flex-none text-center px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      diaFiltro === 'Domingo' ? 'bg-white text-gray-950 shadow-xs' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Ver Domingo
                  </button>
                </div>
              </div>

              {/* 🏆 Cronograma de Partidos por Vueltas (Solo se dibuja si el Admin programó juegos para este día) */}
              {partidosFiltrados.length > 0 ? (
                <MatchesTimeline partidos={partidosFiltrados} />
              ) : diaFiltro === 'Domingo' ? (
                <div className="bg-white border border-gray-100 p-4 rounded-2xl text-xs text-gray-400 font-medium flex items-center gap-2 max-w-md">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Los cruces eliminatorios del domingo se generarán automáticamente al concluir la jornada del sábado.</span>
                </div>
              ) : null}

              {/* Cuadrícula de Equipos e Integrantes */}
              {equiposFiltrados.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-8 text-center text-gray-400 text-xs py-10 w-full">
                  No hay equipos listos registrados para la jornada del {diaFiltro} todavía.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full animate-in fade-in duration-150">
                  {equiposFiltrados.map((eq, index) => (
                    <PublicTeamCard
                      key={eq.id}
                      equipo={eq}
                      integrantes={jugadores.filter(j => j.id_equipo === eq.id)}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 🚨 Ventana Emergente con el Reglamento de la Competición */}
      <InfoModal tipo={modalAbierto} onClose={() => setModalAbierto(null)} />

    </div>
  );
}
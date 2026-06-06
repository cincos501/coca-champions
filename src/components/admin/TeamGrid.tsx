import { useState } from 'react';
import { Search } from 'lucide-react';
import TeamCard from './TeamCard';
import type { Equipo, Jugador, DiaJuego } from '../../types/futbol.types';

interface TeamGridProps {
  equipos: Equipo[];
  jugadores: Jugador[];
  onSelectEquipo: (equipo: Equipo) => void;
}

export default function TeamGrid({ equipos, jugadores, onSelectEquipo }: TeamGridProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroDia, setFiltroDia] = useState<'Todos' | DiaJuego>('Todos');

  const equiposFiltrados = equipos.filter(eq => filtroDia === 'Todos' || eq.dia_juego === filtroDia);

  return (
    <div className="lg:col-span-7 bg-white rounded-3xl shadow-xl border border-gray-100 p-5 space-y-4">
      <div className="flex flex-col gap-2 border-b border-gray-100 pb-3">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-sm uppercase tracking-tight text-gray-900">Monitor de Plantillas</h3>
          <span className="text-[9px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-md uppercase">👉 Toca para Editar</span>
        </div>
        <div className="relative mt-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search className="w-3.5 h-3.5" /></span>
          <input type="text" placeholder="Buscar si un jugador ya está inscrito..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <div className="flex gap-1.5 mt-1">
          {(['Todos', 'Sábado', 'Domingo'] as const).map((d) => (
            <button key={d} type="button" onClick={() => setFiltroDia(d)} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border tracking-wider transition-all cursor-pointer ${filtroDia === d ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200'}`}>{d}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-137.5 overflow-y-auto pr-1">
        {equiposFiltrados.length === 0 ? (
          <p className="text-center text-xs text-gray-400 italic py-2 col-span-full">No hay equipos registrados.</p>
        ) : (
          equiposFiltrados.map((eq) => (
            <TeamCard
              key={eq.id}
              equipo={eq}
              jugadoresDeEsteEquipo={jugadores.filter(j => j.id_equipo === eq.id)}
              jugadoresTotales={jugadores}
              busqueda={busqueda}
              onSelect={onSelectEquipo}
            />
          ))
        )}
      </div>
    </div>
  );
}
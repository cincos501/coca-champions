import { Trophy, Users } from 'lucide-react';
import type { Equipo, Jugador } from '../../types/futbol.types';

interface StatsCardsProps {
  equipos: Equipo[];
  jugadores: Jugador[];
}

export default function StatsCards({ equipos, jugadores }: StatsCardsProps) {
  const cuposLibres = equipos.length * 6 - jugadores.length;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6 text-center select-none max-w-3xl mx-auto lg:max-w-none">
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs">
        <Trophy className="w-5 h-5 mx-auto text-[#F40009] mb-1" />
        <div className="text-2xl font-black text-gray-950">{equipos.length}</div>
        <div className="text-[10px] font-bold uppercase text-gray-400">Equipos</div>
      </div>
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs">
        <Users className="w-5 h-5 mx-auto text-black mb-1" />
        <div className="text-2xl font-black text-gray-950">{jugadores.length}</div>
        <div className="text-[10px] font-bold uppercase text-gray-400">Inscritos</div>
      </div>
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs">
        <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto mb-2 animate-ping" />
        <div className="text-2xl font-black text-emerald-600">{cuposLibres}</div>
        <div className="text-[10px] font-bold uppercase text-gray-400">Cupos Libres</div>
      </div>
    </div>
  );
}
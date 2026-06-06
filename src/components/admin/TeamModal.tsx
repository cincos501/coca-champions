import { X, Trash2 } from 'lucide-react';
import type { Equipo, Jugador } from '../../types/futbol.types';

interface TeamModalProps {
  equipo: Equipo;
  jugadores: Jugador[];
  borrando: boolean;
  onClose: () => void;
  onEliminarJugador: (id: string, nombre: string) => void;
  onEliminarEquipo: (id: string, nombre: string) => void;
}

export default function TeamModal({
  equipo,
  jugadores,
  borrando,
  onClose,
  onEliminarJugador,
  onEliminarEquipo,
}: TeamModalProps) {
  const integrantes = jugadores.filter(j => j.id_equipo === equipo.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]">
        <div className="bg-neutral-950 p-4 text-white flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-[#F40009] uppercase tracking-wider">{equipo.dia_juego}</span>
            <h3 className="font-black text-sm uppercase tracking-tight truncate max-w-50">{equipo.nombre}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4 grow">
          <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2">Integrantes de la Plantilla</h4>
          {integrantes.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-3 text-center border rounded-2xl bg-gray-50">Sin jugadores asignados.</p>
          ) : (
            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/30">
              {integrantes.map((jugador, idx) => (
                <li key={jugador.id} className="p-3 flex justify-between items-center text-xs font-semibold text-gray-800 hover:bg-gray-50">
                  <span className="truncate">{idx + 1}. {jugador.nombre}</span>
                  <button type="button" onClick={() => onEliminarJugador(jugador.id || '', jugador.nombre)} className="text-gray-400 hover:text-[#F40009] cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0 space-y-2">
          <button type="button" disabled={borrando} onClick={() => onEliminarEquipo(equipo.id || '', equipo.nombre)} className="w-full bg-red-50 hover:bg-[#F40009] text-[#F40009] hover:text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border border-red-200 hover:border-transparent">
            <Trash2 className="w-3.5 h-3.5" />
            <span>{borrando ? 'Borrando...' : 'Dar de Baja Equipo Completo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
import type { Equipo, Jugador } from '../../types/futbol.types';

interface TeamCardProps {
  equipo: Equipo;
  jugadoresDeEsteEquipo: Jugador[];
  jugadoresTotales: Jugador[];
  busqueda: string;
  onSelect: (equipo: Equipo) => void;
}

export default function TeamCard({ equipo, jugadoresDeEsteEquipo, jugadoresTotales, busqueda, onSelect }: TeamCardProps) {
  const total = jugadoresDeEsteEquipo.length;
  
  let colorBarra = 'bg-emerald-500';
  if (total >= 6) colorBarra = 'bg-[#F40009]';
  else if (total >= 4) colorBarra = 'bg-amber-500';

  return (
    <div onClick={() => onSelect(equipo)} className="border border-gray-100 rounded-2xl p-3 bg-gray-50/50 hover:bg-red-50/20 hover:border-red-100 transition-all cursor-pointer group active:scale-[0.99] flex flex-col justify-between h-fit">
      <div>
        <div className="flex justify-between items-start mb-1.5">
          <div className="truncate pr-1">
            <h4 className="font-black text-xs text-gray-950 uppercase group-hover:text-[#F40009] transition-colors truncate">{equipo.nombre}</h4>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{equipo.dia_juego}</span>
          </div>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${total >= 6 ? 'bg-red-50 text-[#F40009]' : 'bg-gray-100 text-gray-600'}`}>{total}/6 J</span>
        </div>
        <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden mb-2">
          <div className={`h-full ${colorBarra} transition-all duration-500`} style={{ width: `${(total / 6) * 100}%` }} />
        </div>
        <ul className="text-[11px] space-y-1 pl-0.5">
          {jugadoresDeEsteEquipo.map((j) => {
            const coincideBusqueda = busqueda.trim() !== '' && j.nombre.toLowerCase().includes(busqueda.toLowerCase());
            const repeticionesTotales = jugadoresTotales.filter(jug => jug.nombre.toLowerCase() === j.nombre.toLowerCase()).length;
            return (
              <li key={j.id} className={`flex justify-between items-center py-0.5 rounded px-1 ${coincideBusqueda ? 'bg-yellow-100 font-bold text-gray-900' : 'text-gray-600'}`}>
                <span className="truncate">{j.nombre}</span>
                {repeticionesTotales > 1 && <span className="text-[7px] bg-amber-50 text-amber-700 border border-amber-200 px-1 rounded font-black shrink-0">MULTI</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
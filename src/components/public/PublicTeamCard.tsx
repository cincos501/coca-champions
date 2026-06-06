// src/components/public/PublicTeamCard.tsx
import { useState, useEffect } from 'react';
import { Clock, Megaphone } from 'lucide-react';
import { FutbolService } from '../../services/futbol.service';
import type { Equipo, Jugador } from '../../types/futbol.types';

interface PublicTeamCardProps {
  equipo: Equipo;
  integrantes: Jugador[];
  index: number;
}

export default function PublicTeamCard({ equipo, integrantes}: PublicTeamCardProps) {
  const estaCompleto = integrantes.length >= 6;
  const [cargandoVoto, setCargandoVoto] = useState(false);
  const [yaAlento, setYaAlento] = useState(false);

  // Verificar en LocalStorage si este celular ya apoyó a este equipo en los últimos minutos
  useEffect(() => {
    const registro = localStorage.getItem(`alento_${equipo.id}`);
    if (registro) {
      const tiempoGuardado = parseInt(registro, 10);
      const ahora = Date.now();
      // El bloqueo dura 1 minuto completo para enfriar los clics masivos
      if (ahora - tiempoGuardado < 60000) {
        setYaAlento(true);
      } else {
        localStorage.removeItem(`alento_${equipo.id}`);
      }
    }
  }, [equipo.id]);

  const handleAlentar = async () => {
    if (yaAlento || cargandoVoto) return;

    setCargandoVoto(true);
    try {
      await FutbolService.votarHinchadaEquipo(equipo.id!);
      localStorage.setItem(`alento_${equipo.id}`, Date.now().toString());
      setYaAlento(true);
    } catch (error) {
      console.error("Error en Firebase Hinchada:", error);
    } finally {
      setCargandoVoto(false);
    }
  };

  // 👈 CORRECCIÓN CLAVE: Mapeamos votos_hinchada asegurando que si es undefined pinte 0
  const totalApoyos = equipo.votos_hinchada || 0;

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden flex flex-col justify-between transform transition-all hover:shadow-md">
      <div>
        {/* Cabecera Tarjeta */}
        <div className="bg-neutral-950 p-3.5 px-4 text-white flex justify-between items-center">
          <div className="truncate pr-2">
            <h4 className="font-black text-xs uppercase tracking-tight truncate">{equipo.nombre}</h4>
            <span className="inline-flex items-center gap-1 mt-0.5">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Equipo Oficial</p>
              {equipo.grupo && <span className="text-[8px] bg-[#F40009] text-white px-1 rounded font-black">GRUPO {equipo.grupo}</span>}
            </span>
          </div>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md shrink-0 ${
            estaCompleto ? 'bg-red-950 text-red-400 border border-red-900/30' : 'bg-gray-800 text-gray-300'
          }`}>
            {integrantes.length}/6 Cupos
          </span>
        </div>

        {/* Lista de Jugadores */}
        <div className="p-4 space-y-2">
          {integrantes.length === 0 ? (
            <p className="text-[11px] text-gray-400 italic text-center py-4">Buscando integrantes...</p>
          ) : (
            <ul className="space-y-1.5">
              {integrantes.map((j, idx) => (
                <li key={j.id} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-800">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-4 h-4 rounded-md bg-white border border-gray-200 text-gray-400 font-bold flex items-center justify-center text-[9px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{j.nombre}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 📣 SECCIÓN DE CONTROL DE HINCHADA CORREGIDA */}
      <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
          <Clock className="w-3.5 h-3.5 text-[#F40009]" />
          <span>{estaCompleto ? 'Listo para el Rol' : 'Esperando cupos'}</span>
        </div>

        <button
          onClick={handleAlentar}
          disabled={yaAlento || cargandoVoto}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer select-none ${
            yaAlento 
              ? 'bg-amber-100 text-amber-700 border border-amber-200' 
              : 'bg-black hover:bg-neutral-900 text-white shadow-xs'
          }`}
        >
          <Megaphone className="w-3 h-3" />
          <span>{yaAlento ? `📣 ¡Alentado! (${totalApoyos})` : `Alentar (${totalApoyos})`}</span>
        </button>
      </div>
    </div>
  );
}
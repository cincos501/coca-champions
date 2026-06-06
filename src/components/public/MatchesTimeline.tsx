// src/components/public/MatchesTimeline.tsx
import { useState, useEffect } from 'react';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { FutbolService } from '../../services/futbol.service';
import type { Partido } from '../../types/futbol.types';

interface MatchesTimelineProps {
  partidos: Partido[];
}

type VotoQuiniela = 'local' | 'empate' | 'visitante';

export default function MatchesTimeline({ partidos }: MatchesTimelineProps) {
  const [misVotos, setMisVotos] = useState<{ [key: string]: VotoQuiniela }>({});

  // Cargar las votaciones previas guardadas en este dispositivo al entrar
  useEffect(() => {
    const votosCargados: { [key: string]: VotoQuiniela } = {};
    partidos.forEach(p => {
      const v = localStorage.getItem(`quiniela_${p.id}`) as VotoQuiniela | null;
      if (v) votosCargados[p.id!] = v;
    });
    setMisVotos(votosCargados);
  }, [partidos]);

  const handleVotarQuiniela = async (idPartido: string, seleccion: VotoQuiniela) => {
    const votoAnterior = misVotos[idPartido];

    // Si vuelve a presionar el mismo botón que ya votó, no hacemos nada
    if (votoAnterior === seleccion) return;

    try {
      if (votoAnterior) {
        // 👈 CAMBIO DE OPINIÓN: Resta el viejo y suma el nuevo en un solo paso seguro
        await FutbolService.cambiarPronosticoPartido(idPartido, votoAnterior, seleccion);
      } else {
        // Voto limpio por primera vez
        await FutbolService.registrarPronosticoPartido(idPartido, seleccion);
      }

      // Guardar nueva selección localmente
      localStorage.setItem(`quiniela_${idPartido}`, seleccion);
      setMisVotos(prev => ({ ...prev, [idPartido]: seleccion }));
    } catch (error) {
      console.error("Error al procesar el pronóstico:", error);
    }
  };

  if (partidos.length === 0) return null;

  return (
    <div className="space-y-6 pt-4 border-t border-gray-200">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-[#F40009]" />
        <h3 className="font-black text-base uppercase text-gray-900 tracking-tight">La Quiniela de la Hinchada (Sábado)</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['1RA VUELTA', '2DA VUELTA', '3RA VUELTA'] as const).map((vuel) => {
          const partidosDeVuelta = partidos.filter(p => p.vuelta === vuel);

          return (
            <div key={vuel} className="space-y-3 bg-white border border-gray-100 p-4 rounded-3xl shadow-xs">
              <h4 className="text-[10px] font-black bg-neutral-950 text-white px-2.5 py-1 rounded-md w-fit uppercase tracking-wider">{vuel}</h4>
              
              {partidosDeVuelta.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic py-4 text-center">Partidos no programados aún.</p>
              ) : (
                <div className="space-y-2.5">
                  {partidosDeVuelta.map((partido) => {
                    const totalVotos = (partido.votos_local || 0) + (partido.votos_empate || 0) + (partido.votos_visitante || 0);
                    const miVotoEstePartido = misVotos[partido.id!];

                    // Función interna para calcular porcentajes de la Quiniela
                    const calcularPct = (votos: number = 0) => {
                      if (totalVotos === 0) return 0;
                      return Math.round((votos / totalVotos) * 100);
                    };

                    return (
                      <div key={partido.id} className="bg-gray-50 border border-gray-100 p-3 rounded-2xl flex flex-col gap-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black bg-red-50 text-[#F40009] border border-red-200 px-1.5 py-0.5 rounded">GRUPO {partido.grupo}</span>
                          {partido.estado === 'jugado' ? (
                            <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" /> FINAL</span>
                          ) : (
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">🗳️ {totalVotos} Votos totales</span>
                          )}
                        </div>

                        {/* Cabecera de Marcadores / VS */}
                        <div className="flex justify-between items-center font-black text-gray-950 uppercase my-1">
                          <span className="truncate max-w-[42%] text-left">{partido.nombre_local}</span>
                          {partido.estado === 'jugado' ? (
                            <span className="bg-white border px-2 py-0.5 rounded-lg text-sm tracking-widest font-mono text-center shrink-0 min-w-10">
                              {partido.goles_local}:{partido.goles_visitante}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-bold text-[10px] px-1 shrink-0">VS</span>
                          )}
                          <span className="truncate max-w-[42%] text-right">{partido.nombre_visitante}</span>
                        </div>

                        {/* 🗳️ BOTONES INTERACTIVOS DE VOTACIÓN SINO HA JUGADO */}
                        {partido.estado === 'programado' && (
                          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-gray-200/50">
                            <button
                              onClick={() => handleVotarQuiniela(partido.id!, 'local')}
                              className={`py-1.5 rounded-xl font-black text-[9px] uppercase border transition-all cursor-pointer ${
                                miVotoEstePartido === 'local' 
                                  ? 'bg-[#F40009] text-white border-transparent scale-[1.02]' 
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              Local ({calcularPct(partido.votos_local)}%)
                            </button>
                            <button
                              onClick={() => handleVotarQuiniela(partido.id!, 'empate')}
                              className={`py-1.5 rounded-xl font-black text-[9px] uppercase border transition-all cursor-pointer ${
                                miVotoEstePartido === 'empate' 
                                  ? 'bg-neutral-900 text-white border-transparent scale-[1.02]' 
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              Empate ({calcularPct(partido.votos_empate)}%)
                            </button>
                            <button
                              onClick={() => handleVotarQuiniela(partido.id!, 'visitante')}
                              className={`py-1.5 rounded-xl font-black text-[9px] uppercase border transition-all cursor-pointer ${
                                miVotoEstePartido === 'visitante' 
                                  ? 'bg-[#F40009] text-white border-transparent scale-[1.02]' 
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              Visita ({calcularPct(partido.votos_visitante)}%)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
// src/components/admin/FixtureManager.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, Users, Trophy, Trash2, CheckCircle2 } from 'lucide-react';
import { FutbolService } from '../../services/futbol.service';
import type { Equipo, Partido, Grupo } from '../../types/futbol.types';

interface FixtureManagerProps {
  equipos: Equipo[];
  mostrarFeedback: (tipo: 'exito' | 'error', texto: string) => void;
}

export default function FixtureManager({ equipos, mostrarFeedback }: FixtureManagerProps) {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<Grupo>('A');
  const [vueltaSeleccionada, setVueltaSeleccionada] = useState<'1RA VUELTA' | '2DA VUELTA' | '3RA VUELTA'>('1RA VUELTA');
  const [idLocal, setIdLocal] = useState('');
  const [idVisitante, setIdVisitante] = useState('');
  
  const [golesData, setGolesData] = useState<{ [key: string]: { local: string; visitante: string } }>({});
  const [guardando, setGuardando] = useState(false);

  // Escuchar partidos en tiempo real (SPA)
  useEffect(() => {
    const desuscribir = FutbolService.escucharPartidos((listaPartidos) => {
      setPartidos(listaPartidos);
    });
    return () => desuscribir();
  }, []);

  // Filtrar equipos del Sábado para los selectores del formulario y del monitor
  const equiposSabado = equipos.filter(e => e.dia_juego === 'Sábado');
  const equiposDelGrupoFormulario = equiposSabado.filter(e => e.grupo === grupoSeleccionado);

  const handleAsignarGrupo = async (idEquipo: string, grupo: Grupo | 'NUEVO') => {
    try {
      // Si seleccionan la opción vacía, removemos el grupo en Firebase pasándole null
      const grupoFinal = grupo === 'NUEVO' ? null : grupo;
      await FutbolService.asignarGrupoAEquipo(idEquipo, grupoFinal);
      mostrarFeedback('exito', 'Grupo actualizado en tiempo real.');
    } catch {
      mostrarFeedback('error', 'Error al actualizar el grupo en la base de datos.');
    }
  };

  const handleProgramarPartido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idLocal || !idVisitante) return;
    if (idLocal === idVisitante) {
      mostrarFeedback('error', 'Un equipo no puede jugar contra sí mismo.');
      return;
    }

    setGuardando(true);
    try {
      const nombreLocal = equipos.find(e => e.id === idLocal)?.nombre || '';
      const nombreVisitante = equipos.find(e => e.id === idVisitante)?.nombre || '';

      await FutbolService.programarPartido({
        dia_juego: 'Sábado',
        grupo: grupoSeleccionado,
        vuelta: vueltaSeleccionada,
        id_local: idLocal,
        nombre_local: nombreLocal,
        id_visitante: idVisitante,
        nombre_visitante: nombreVisitante,
        estado: 'programado'
      });

      mostrarFeedback('exito', 'Partido programado exitosamente.');
      setIdLocal('');
      setIdVisitante('');
    } catch {
      mostrarFeedback('error', 'No se pudo agendar el encuentro.');
    } finally {
      setGuardando(false);
    }
  };

  const handleCargarResultado = async (idPartido: string) => {
    const goles = golesData[idPartido];
    if (!goles || goles.local === '' || goles.visitante === '') {
      mostrarFeedback('error', 'Por favor ingresa ambos marcadores.');
      return;
    }

    try {
      await FutbolService.actualizarResultadoPartido(
        idPartido, 
        parseInt(goles.local, 10), 
        parseInt(goles.visitante, 10)
      );
      mostrarFeedback('exito', 'Resultado actualizado en tiempo real.');
    } catch {
      mostrarFeedback('error', 'Error al guardar los goles.');
    }
  };

  const handleEliminarPartido = async (idPartido: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este partido programado?')) return;
    try {
      await FutbolService.eliminarPartido(idPartido);
      mostrarFeedback('exito', 'Partido removido.');
    } catch {
      mostrarFeedback('error', 'No se pudo eliminar.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
      
      {/* COLUMNA IZQUIERDA: CONFIGURADOR DE GRUPOS Y FIXTURE (Ocupa 5/12) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Bloque 1: Clasificación e Intercambio de Grupos Abierto */}
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100">
          <h3 className="font-black text-xs uppercase tracking-tight text-gray-900 mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#F40009]" /> Distribución de Grupos (Sábado)
          </h3>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-3">Cambia los grupos en cualquier momento desde aquí</p>
          
          {equiposSabado.length === 0 ? (
            <p className="text-[11px] text-gray-400 italic py-2 text-center">No hay equipos registrados para el Sábado.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {equiposSabado.map(eq => (
                <div key={eq.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs font-semibold text-gray-800">
                  <span className="truncate max-w-[55%]">{eq.nombre}</span>
                  
                  {/* Selector Dinámico Permanente */}
                  <select 
                    value={eq.grupo || 'NUEVO'} 
                    onChange={(e) => handleAsignarGrupo(eq.id!, e.target.value as any)}
                    className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border appearance-none cursor-pointer text-center outline-none transition-colors ${
                      eq.grupo === 'A' ? 'bg-red-50 text-[#F40009] border-red-200' :
                      eq.grupo === 'B' ? 'bg-neutral-900 text-white border-neutral-900' :
                      'bg-white text-gray-400 border-gray-200'
                    }`}
                  >
                    <option value="NUEVO">Sin Grupo</option>
                    <option value="A">Grupo A</option>
                    <option value="B">Grupo B</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bloque 2: Programador de Partidos */}
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100">
          <h3 className="font-black text-xs uppercase tracking-tight text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#F40009]" /> Programador de Encuentros
          </h3>

          <form onSubmit={handleProgramarPartido} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block px-0.5 mb-1">Grupo objetivo</label>
                <select value={grupoSeleccionado} onChange={(e) => { setGrupoSeleccionado(e.target.value as Grupo); setIdLocal(''); setIdVisitante(''); }} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F40009]">
                  <option value="A">Grupo A</option>
                  <option value="B">Grupo B</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block px-0.5 mb-1">Fase / Vuelta</label>
                <select value={vueltaSeleccionada} onChange={(e) => setVueltaSeleccionada(e.target.value as any)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F40009]">
                  <option value="1RA VUELTA">1ra Vuelta</option>
                  <option value="2DA VUELTA">2da Vuelta</option>
                  <option value="3RA VUELTA">3ra Vuelta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block px-0.5 mb-1">Equipo Local</label>
              <select value={idLocal} onChange={(e) => setIdLocal(e.target.value)} required className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F40009]">
                <option value="">-- Seleccionar Local --</option>
                {equiposDelGrupoFormulario.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block px-0.5 mb-1">Equipo Visitante</label>
              <select value={idVisitante} onChange={(e) => setIdVisitante(e.target.value)} required className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F40009]">
                <option value="">-- Seleccionar Visitante --</option>
                {equiposDelGrupoFormulario.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={guardando || equiposDelGrupoFormulario.length < 2} className="w-full bg-[#F40009] hover:bg-red-700 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40">
              Agendar Partido
            </button>
          </form>
        </div>
      </div>

      {/* COLUMNA DERECHA: FIXTURE GENERAL / CONTROL DE MARCADORES (Ocupa 7/12) */}
      <div className="lg:col-span-7 bg-white rounded-3xl shadow-xl border border-gray-100 p-5">
        <h3 className="font-black text-sm uppercase tracking-tight text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-black" /> Calendario y Control de Resultados
        </h3>

        <div className="space-y-6 max-h-132 overflow-y-auto pr-1 mt-4">
          {(['1RA VUELTA', '2DA VUELTA', '3RA VUELTA'] as const).map(vuel => {
            const partidosDeVuelta = partidos.filter(p => p.vuelta === vuel);

            return (
              <div key={vuel} className="space-y-2">
                <h4 className="text-[10px] font-black bg-gray-100 text-gray-700 px-3 py-1 rounded-md w-fit uppercase tracking-wider">{vuel}</h4>
                
                {partidosDeVuelta.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic pl-1">No hay partidos programados en esta vuelta.</p>
                ) : (
                  partidosDeVuelta.map(partido => (
                    <div key={partido.id} className="border border-gray-100 bg-gray-50/50 p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <div className="flex items-center gap-1.5 justify-center sm:justify-start mb-1">
                          <span className="text-[8px] font-black bg-neutral-900 text-white px-1.5 py-0.5 rounded">GRP {partido.grupo}</span>
                          {partido.estado === 'jugado' && <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded flex items-center gap-0.5"><CheckCircle2 className="w-2 h-2" /> FINALIZADO</span>}
                        </div>
                        <p className="font-black text-gray-950 uppercase truncate">{partido.nombre_local} <span className="text-gray-400 font-normal">vs</span> {partido.nombre_visitante}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {partido.estado === 'programado' ? (
                          <>
                            <input type="number" min="0" placeholder="L" value={golesData[partido.id!]?.local || ''} onChange={(e) => setGolesData({ ...golesData, [partido.id!]: { ...golesData[partido.id!], local: e.target.value } })} className="w-10 text-center p-1.5 bg-white border border-gray-200 rounded-lg font-bold text-xs" />
                            <span className="text-gray-400 font-bold">:</span>
                            <input type="number" min="0" placeholder="V" value={golesData[partido.id!]?.visitante || ''} onChange={(e) => setGolesData({ ...golesData, [partido.id!]: { ...golesData[partido.id!], visitante: e.target.value } })} className="w-10 text-center p-1.5 bg-white border border-gray-200 rounded-lg font-bold text-xs" />
                            <button onClick={() => handleCargarResultado(partido.id!)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl font-black text-[10px] uppercase cursor-pointer transition-all">Guardar</button>
                          </>
                        ) : (
                          <div className="bg-white border border-gray-100 px-3 py-1.5 rounded-xl font-black text-gray-900 text-sm shadow-xs flex gap-2">
                            <span>{partido.goles_local}</span>
                            <span className="text-gray-300">:</span>
                            <span>{partido.goles_visitante}</span>
                          </div>
                        )}
                        <button onClick={() => handleEliminarPartido(partido.id!)} className="p-1.5 text-gray-400 hover:text-[#F40009] cursor-pointer rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>

                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
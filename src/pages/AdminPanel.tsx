// src/pages/AdminPanel.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { FutbolService, EdicionesService } from '../services/futbol.service';
import type { Equipo, DiaJuego, Jugador, Partido, DiaDisponibilidad, Grupo, EdicionConfig } from '../types/futbol.types';
import { 
  Users, Calendar, Download, UserPlus, Shuffle, ShieldPlus, Trash2, 
  AlertCircle, CheckCircle2, Import, Search, Edit2, Check, X,
  PlusCircle, Trophy, Settings2, Shield
} from 'lucide-react';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type SeccionPanel = 'ediciones' | 'registro' | 'importar' | 'padron' | 'sorteo' | 'fixture';

export default function AdminPanel() {
  // === ESTADOS FIREBASE Y NAVEGACIÓN ===
  const [ediciones, setEdiciones] = useState<EdicionConfig[]>([]);
  const [edicionSeleccionada, setEdicionSeleccionada] = useState<EdicionConfig | null>(null);
  const [seccion, setSeccion] = useState<SeccionPanel>('ediciones');

  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Mensajes de Feedback
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // === FORMULARIO CREAR / EDITAR EDICIÓN ===
  const [mostrarFormEdicion, setMostrarFormEdicion] = useState(false);
  const [idEdicionEditando, setIdEdicionEditando] = useState<string | null>(null);
  const [numEd, setNumEd] = useState<number>(8);
  const [nomEd, setNomEd] = useState<string>('COCACHAMPIONS OCTAVA EDICIÓN');
  const [fSorteo, setFSorteo] = useState<string>('Viernes 18 de Septiembre (08:30 PM)');
  const [fSabado, setFSabado] = useState<string>('Sábado 19 de Septiembre (02:30 PM)');
  const [fDomingo, setFDomingo] = useState<string>('Domingo 20 de Septiembre (08:30 AM)');
  const [ubicCancha, setUbicCancha] = useState<string>('Cancha de Villa Busch');
  const [costoInsc, setCostoInsc] = useState<number>(4);
  const [reglasTexto, setReglasTexto] = useState<string>(
    'Inscripción: 4 Bs por persona (pago QR). Límite: Viernes 18 Sept 07:00 PM\n' +
    'Contacto WhatsApp inscripción: +591 63787755\n' +
    'Modalidad: Equipos 100% aleatorios (máximo 6 jugadores por equipo) sin preferencias\n' +
    'Sorteo: Viernes 18 Sept 08:30 PM en vivo por TikTok @SALE FULBO (para el sábado/ambos días)\n' +
    'Sorteo del Domingo: Sábado 19 Sept 08:30 PM\n' +
    'Repechaje/Reinscripción: Los eliminados del sábado podrán reinscribirse para el domingo\n' +
    'Arbitraje 100% gratuito (sin costo adicional)\n' +
    'Indumentaria: Ponchillos provistos por la organización\n' +
    'Transmisión en vivo por TikTok @SALE FULBO y resultados en tiempo real por la web COCACHAMPIONS'
  );
  const [premio1, setPremio1] = useState<string>('1 Coca-Cola de 3 Litros, medallas para cada ganador y certificado oficial de campeón');
  const [premio2, setPremio2] = useState<string>('1 Coca-Cola de 300 ml para cada jugador');

  // === FORMULARIO REGISTRO JUGADOR / EQUIPO ===
  const [nuevoNombreJugador, setNuevoNombreJugador] = useState('');
  const [disponibilidadJugador, setDisponibilidadJugador] = useState<DiaDisponibilidad>('Ambos');

  const [nuevoNombreEquipo, setNuevoNombreEquipo] = useState('');
  const [diaEquipo, setDiaEquipo] = useState<DiaJuego>('Sábado');
  const [grupoEquipo, setGrupoEquipo] = useState<Grupo>('A');

  // === DRAFT / SORTEO RÁPIDO ===
  const [busquedaBolsaDraft, setBusquedaBolsaDraft] = useState('');

  // === PADRÓN OFICIAL BÚSQUEDA Y EDICIÓN ===
  const [busquedaPadron, setBusquedaPadron] = useState('');
  const [idJugadorEditando, setIdJugadorEditando] = useState<string | null>(null);
  const [nombreEditando, setNombreEditando] = useState('');
  const [dispEditando, setDispEditando] = useState<DiaDisponibilidad>('Ambos');

  // === IMPORTADOR HISTÓRICO ===
  const [busquedaImportar, setBusquedaImportar] = useState('');
  const [dispImportar, setDispImportar] = useState<Record<string, DiaDisponibilidad>>({});

  // === CREACIÓN / EDICIÓN DE PARTIDOS ===
  const [idLocalPartido, setIdLocalPartido] = useState('');
  const [idVisitantePartido, setIdVisitantePartido] = useState('');
  const [diaPartido, setDiaPartido] = useState<DiaJuego>('Sábado');
  const [fasePartido, setFasePartido] = useState('Fase de Grupos');

  // Marcadores en vivo
  const [golesLocalEdit, setGolesLocalEdit] = useState<Record<string, number>>({});
  const [golesVisitanteEdit, setGolesVisitanteEdit] = useState<Record<string, number>>({});

  const [errorPermisos, setErrorPermisos] = useState<boolean>(false);

  // === SUSCRIPCIÓN EN TIEMPO REAL ===
  useEffect(() => {
    const handleErr = (err: Error & { code?: string }) => {
      console.error("Error en Firestore (Admin):", err);
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        setErrorPermisos(true);
      }
      setCargando(false);
    };

    const desuscribirEdiciones = EdicionesService.escucharEdiciones((listaEd) => {
      setEdiciones(listaEd || []);
    }, handleErr);

    const desuscribirEquipos = FutbolService.escucharEquipos((lista) => setEquipos(lista || []), handleErr);
    const desuscribirJugadores = FutbolService.escucharJugadores((lista) => setJugadores(lista || []), handleErr);
    const desuscribirPartidos = FutbolService.escucharPartidos((lista) => {
      setPartidos(lista || []);
      setCargando(false);
    }, handleErr);

    return () => {
      desuscribirEdiciones();
      desuscribirEquipos();
      desuscribirJugadores();
      desuscribirPartidos();
    };
  }, []);

  const mostrarFeedback = (tipo: 'exito' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3500);
  };

  // ID Y NUMERO DE LA EDICIÓN DE TRABAJO ACTUAL EN EL ADMIN
  const edicionTrabajo = edicionSeleccionada || ediciones.find(e => e.activa) || ediciones[0] || null;
  const idEdicionTrabajo = edicionTrabajo?.id || '';

  // FILTRADOS POR LA EDICIÓN DE TRABAJO
  const equiposEdicion = useMemo(() => {
    if (!idEdicionTrabajo) return [];
    return equipos.filter(e => e.edicion_id === idEdicionTrabajo);
  }, [equipos, idEdicionTrabajo]);

  const jugadoresEdicion = useMemo(() => {
    if (!idEdicionTrabajo) return [];
    return jugadores.filter(j => j.edicion_id === idEdicionTrabajo);
  }, [jugadores, idEdicionTrabajo]);

  const partidosEdicion = useMemo(() => {
    if (!idEdicionTrabajo) return [];
    return partidos.filter(p => p.edicion_id === idEdicionTrabajo);
  }, [partidos, idEdicionTrabajo]);

  // JUGADORES DE EDICIONES HISTÓRICAS (No pertenecientes a la edición de trabajo)
  const jugadoresHistoricos = useMemo(() => {
    if (!idEdicionTrabajo) return jugadores;
    return jugadores.filter(j => j.edicion_id !== idEdicionTrabajo);
  }, [jugadores, idEdicionTrabajo]);

  // Jugadores en la bolsa de sorteo de la edición de trabajo (id_equipo vacío o sin definir)
  const bolsaSorteo = useMemo(() => {
    return jugadoresEdicion.filter(j => !j.id_equipo || j.id_equipo.trim() === '');
  }, [jugadoresEdicion]);

  const bolsaSorteoFiltrada = useMemo(() => {
    if (!busquedaBolsaDraft.trim()) return bolsaSorteo;
    return bolsaSorteo.filter(j => j.nombre.toLowerCase().includes(busquedaBolsaDraft.toLowerCase()));
  }, [bolsaSorteo, busquedaBolsaDraft]);

  // Calcula automáticamente la selección con menos integrantes para agilizar la ronda del sorteo en vivo
  const proximoEquipoSorteo = useMemo(() => {
    if (!equiposEdicion || equiposEdicion.length === 0) return null;
    let minCant = Infinity;
    let targetEq: Equipo = equiposEdicion[0];

    equiposEdicion.forEach(eq => {
      const cant = jugadoresEdicion.filter(j => j.id_equipo === eq.id).length;
      if (cant < minCant) {
        minCant = cant;
        targetEq = eq;
      }
    });
    return { equipo: targetEq, cantidad: minCant };
  }, [equiposEdicion, jugadoresEdicion]);

  // 1️⃣ HANDLERS DE EDICIONES
  const handleCrearOActualizarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const datosEdicion: Omit<EdicionConfig, 'id'> = {
        numero: Number(numEd),
        nombre: nomEd.trim(),
        activa: idEdicionEditando ? (ediciones.find(e => e.id === idEdicionEditando)?.activa ?? false) : (ediciones.length === 0),
        fecha_sorteo: fSorteo.trim(),
        fecha_sabado: fSabado.trim(),
        fecha_domingo: fDomingo.trim(),
        ubicacion: ubicCancha.trim(),
        costo_inscripcion: Number(costoInsc),
        reglas_oro: reglasTexto.split('\n').map(r => r.trim()).filter(r => r !== ''),
        premios: {
          primer_lugar: premio1.trim(),
          segundo_lugar: premio2.trim()
        }
      };

      if (idEdicionEditando) {
        await EdicionesService.actualizarEdicion(idEdicionEditando, datosEdicion);
        mostrarFeedback('exito', `Edición "${nomEd}" actualizada.`);
      } else {
        const docRef = await EdicionesService.crearEdicion(datosEdicion);
        mostrarFeedback('exito', `¡${nomEd} creada correctamente!`);
        // Si es la única, seleccionarla
        setEdicionSeleccionada({ id: docRef.id, ...datosEdicion });
      }

      setMostrarFormEdicion(false);
      setIdEdicionEditando(null);
    } catch (err: unknown) {
      console.error("Error al guardar edición:", err);
      const eObj = err as { message?: string; code?: string };
      const msg = eObj?.message || eObj?.code || 'Error desconocido';
      mostrarFeedback('error', `Error al guardar: ${msg}`);
    }
  };

  const handleActivarEdicion = async (id: string) => {
    try {
      await EdicionesService.activarEdicion(id, ediciones);
      const edActiva = ediciones.find(e => e.id === id) || null;
      if (edActiva) setEdicionSeleccionada(edActiva);
      mostrarFeedback('exito', 'Edición marcada como ACTIVA.');
    } catch {
      mostrarFeedback('error', 'Error al activar la edición.');
    }
  };

  const handleCargarFormEdicionEdit = (ed: EdicionConfig) => {
    if (!ed.id) return;
    setIdEdicionEditando(ed.id);
    setNumEd(ed.numero || 7);
    setNomEd(ed.nombre || '');
    setFSorteo(ed.fecha_sorteo || '');
    setFSabado(ed.fecha_sabado || '');
    setFDomingo(ed.fecha_domingo || '');
    setUbicCancha(ed.ubicacion || '');
    setCostoInsc(ed.costo_inscripcion || 3);
    setReglasTexto((ed.reglas_oro || []).join('\n'));
    setPremio1(ed.premios?.primer_lugar || '');
    setPremio2(ed.premios?.segundo_lugar || '');
    setMostrarFormEdicion(true);
  };

  // 2️⃣ HANDLERS DE REGISTRO
  const handleRegistrarJugador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreJugador.trim() || !idEdicionTrabajo) {
      mostrarFeedback('error', 'Selecciona una edición y escribe un nombre.');
      return;
    }

    try {
      await FutbolService.registrarJugador({
        nombre: nuevoNombreJugador.trim(),
        id_equipo: '',
        disponibilidad: disponibilidadJugador,
        edicion_id: idEdicionTrabajo
      });
      mostrarFeedback('exito', `Jugador "${nuevoNombreJugador}" inscripto a la bolsa.`);
      setNuevoNombreJugador('');
    } catch {
      mostrarFeedback('error', 'Error al inscribir jugador.');
    }
  };

  const handleCrearEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreEquipo.trim() || !idEdicionTrabajo) return;

    try {
      await FutbolService.crearEquipo({
        nombre: nuevoNombreEquipo.trim(),
        dia_juego: diaEquipo,
        grupo: grupoEquipo,
        edicion_id: idEdicionTrabajo
      });
      mostrarFeedback('exito', `Selección "${nuevoNombreEquipo}" creada.`);
      setNuevoNombreEquipo('');
    } catch {
      mostrarFeedback('error', 'Error al crear la selección.');
    }
  };

  // 3️⃣ HANDLER DE IMPORTACIÓN HISTÓRICA
  const handleImportarJugador = async (jHist: Jugador) => {
    if (!idEdicionTrabajo) return;
    try {
      const disp = dispImportar[jHist.id || ''] || jHist.disponibilidad || 'Ambos';
      await FutbolService.importarJugadorAEdicionActual(jHist, disp, idEdicionTrabajo);
      mostrarFeedback('exito', `¡${jHist.nombre} promovido a ${edicionTrabajo?.nombre}!`);
    } catch {
      mostrarFeedback('error', 'Error al importar jugador.');
    }
  };

  // 4️⃣ HANDLERS DE EDICIÓN Y ELIMINACIÓN DE JUGADOR EN PADRÓN
  const handleGuardarEdicionJugador = async (id: string) => {
    try {
      await FutbolService.actualizarJugador(id, {
        nombre: nombreEditando.trim(),
        disponibilidad: dispEditando
      });
      setIdJugadorEditando(null);
      mostrarFeedback('exito', 'Jugador actualizado.');
    } catch {
      mostrarFeedback('error', 'Error al actualizar jugador.');
    }
  };

  const handleEliminarJugador = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar a "${nombre}"?`)) return;
    try {
      await FutbolService.eliminarJugador(id);
      mostrarFeedback('exito', `Jugador "${nombre}" eliminado.`);
    } catch {
      mostrarFeedback('error', 'Error al eliminar jugador.');
    }
  };

  // 5️⃣ HANDLERS DE SORTEO / DRAFT
  const handleAsignarJugador = async (idJugador: string, idEquipo: string) => {
    try {
      await FutbolService.actualizarJugador(idJugador, { id_equipo: idEquipo });
      mostrarFeedback('exito', 'Jugador asignado al equipo.');
    } catch {
      mostrarFeedback('error', 'Error al asignar jugador.');
    }
  };

  const handleDevolverABolsa = async (idJugador: string) => {
    try {
      await FutbolService.actualizarJugador(idJugador, { id_equipo: '' });
      mostrarFeedback('exito', 'Jugador devuelto a la bolsa.');
    } catch {
      mostrarFeedback('error', 'Error al mover jugador.');
    }
  };

  const handleEliminarEquipo = async (idEquipo: string, nombre: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la selección "${nombre}"?`)) return;
    try {
      const asignados = jugadoresEdicion.filter(j => j.id_equipo === idEquipo);
      for (const j of asignados) {
        if (j.id) await FutbolService.actualizarJugador(j.id, { id_equipo: '' });
      }
      await FutbolService.eliminarEquipo(idEquipo);
      mostrarFeedback('exito', `Selección "${nombre}" eliminada.`);
    } catch {
      mostrarFeedback('error', 'Error al eliminar equipo.');
    }
  };

  // 6️⃣ HANDLERS DE PARTIDOS / FIXTURE
  const handleCrearPartido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idLocalPartido || !idVisitantePartido || idLocalPartido === idVisitantePartido) {
      mostrarFeedback('error', 'Selecciona dos equipos distintos.');
      return;
    }

    const eqLocal = equiposEdicion.find(e => e.id === idLocalPartido);
    const eqVisitante = equiposEdicion.find(e => e.id === idVisitantePartido);

    if (!eqLocal || !eqVisitante) return;

    try {
      await FutbolService.crearPartido({
        id_equipo_local: idLocalPartido,
        id_equipo_visitante: idVisitantePartido,
        nombre_local: eqLocal.nombre,
        nombre_visitante: eqVisitante.nombre,
        goles_local: 0,
        goles_visitante: 0,
        dia_juego: diaPartido,
        estado: 'programado',
        fase: fasePartido,
        edicion_id: idEdicionTrabajo
      });
      mostrarFeedback('exito', 'Partido programado con éxito.');
      setIdLocalPartido('');
      setIdVisitantePartido('');
    } catch {
      mostrarFeedback('error', 'Error al programar el partido.');
    }
  };

  const handleGuardarResultadoPartido = async (p: Partido) => {
    if (!p.id) return;
    const gL = golesLocalEdit[p.id] ?? p.goles_local;
    const gV = golesVisitanteEdit[p.id] ?? p.goles_visitante;

    try {
      await FutbolService.actualizarPartido(p.id, {
        goles_local: Number(gL),
        goles_visitante: Number(gV),
        estado: 'jugado'
      });
      mostrarFeedback('exito', 'Resultado del partido guardado.');
    } catch {
      mostrarFeedback('error', 'Error al guardar resultado.');
    }
  };

  const handleEliminarPartido = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este partido?')) return;
    try {
      await FutbolService.eliminarPartido(id);
      mostrarFeedback('exito', 'Partido eliminado.');
    } catch {
      mostrarFeedback('error', 'Error al eliminar el partido.');
    }
  };

  // 7️⃣ GENERADOR DE REPORTES PDF
  const handleDescargarPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    // Encabezado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(244, 0, 9); // Rojo CocaChampions
    doc.text(`COCACHAMPIONS - ${edicionTrabajo?.nombre || 'TORNEO OFICIAL'}`, 14, 16);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`PLANILLA OFICIAL DE COMPETENCIA, SELECCIONES Y DRAFT`, 14, 22);

    const filas = equiposEdicion.map(eq => {
      const plantilla = jugadoresEdicion
        .filter(j => j.id_equipo === eq.id)
        .map(j => j.nombre.toUpperCase())
        .join(', ');

      return [
        eq.nombre.toUpperCase(),
        `GRUPO ${eq.grupo || 'A'}`,
        eq.dia_juego.toUpperCase(),
        plantilla || 'SIN JUGADORES ASIGNADOS'
      ];
    });

    autoTable(doc, {
      startY: 28,
      head: [['EQUIPO / SELECCIÓN', 'GRUPO', 'DÍA DE JUEGO', 'PLANTEL CONFIRMADO']],
      body: filas,
      headStyles: { fillColor: [244, 0, 9], fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8.5, font: 'helvetica', cellPadding: 3 }
    });

    doc.save(`Planilla_Oficial_${edicionTrabajo?.nombre.replace(/\s+/g, '_') || 'CocaChampions'}.pdf`);
  };

  // Filtrado de Padrón
  const padronFiltrado = useMemo(() => {
    if (!busquedaPadron.trim()) return jugadoresEdicion;
    return jugadoresEdicion.filter(j => 
      j.nombre.toLowerCase().includes(busquedaPadron.toLowerCase())
    );
  }, [jugadoresEdicion, busquedaPadron]);

  // Filtrado de Históricos
  const historicosFiltrados = useMemo(() => {
    if (!busquedaImportar.trim()) return jugadoresHistoricos;
    return jugadoresHistoricos.filter(j => 
      j.nombre.toLowerCase().includes(busquedaImportar.toLowerCase())
    );
  }, [jugadoresHistoricos, busquedaImportar]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans pb-12">
      
      {/* 🔴 BARRA DE CONTROL SUPERIOR */}
      <header className="bg-slate-950 text-white shadow-xl sticky top-0 z-40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-xl">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg uppercase italic tracking-wider">
                  Mesa de Control <span className="text-red-500">CocaChampions</span>
                </h1>
                {edicionTrabajo?.activa && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                    Activa
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Edición de Trabajo: <strong className="text-white">{edicionTrabajo?.nombre || 'Ninguna'}</strong> | Ubicación: <span className="text-red-400">{edicionTrabajo?.ubicacion || 'Villa Busch'}</span>
              </p>
            </div>
          </div>

          {/* SELECTOR RÁPIDO DE EDICIÓN & ACCIONES */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <select
              value={edicionTrabajo?.id || ''}
              onChange={(e) => {
                const en = ediciones.find(ed => ed.id === e.target.value);
                if (en) setEdicionSeleccionada(en);
              }}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold uppercase text-white cursor-pointer"
            >
              {ediciones.map(ed => (
                <option key={ed.id} value={ed.id}>
                  {ed.nombre} {ed.activa ? '★ (ACTIVA)' : ''}
                </option>
              ))}
            </select>

            <button
              onClick={handleDescargarPDF}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Planilla PDF</span>
            </button>
          </div>

        </div>

        {/* NAVEGACIÓN PESTAÑAS DEL ADMIN */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 border-t border-slate-900">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
            {[
              { id: 'ediciones', label: 'Gestión Ediciones', icon: Settings2 },
              { id: 'registro', label: 'Alta & Registro', icon: UserPlus },
              { id: 'importar', label: 'Importador Histórico', icon: Import },
              { id: 'padron', label: `Padrón Oficial (${jugadoresEdicion.length})`, icon: Users },
              { id: 'sorteo', label: `Módulo Sorteo / Draft (${bolsaSorteo.length})`, icon: Shuffle },
              { id: 'fixture', label: `Partidos & Marcadores (${partidosEdicion.length})`, icon: Calendar }
            ].map(tab => {
              const IconComp = tab.icon;
              const activo = seccion === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSeccion(tab.id as SeccionPanel)}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
                    activo 
                      ? 'bg-red-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* FEEDBACK MENSAJE FLOATING */}
      {mensaje && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl text-xs font-black uppercase flex items-center gap-2 text-white animate-bounce ${
          mensaje.tipo === 'exito' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* 🚀 CONTENIDO DE SECCIONES ADMIN */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {errorPermisos && (
          <div className="bg-red-950 text-white border border-red-800 p-5 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-red-400 font-black text-sm uppercase">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span>Acceso Bloqueado por Reglas de Firestore (Missing or insufficient permissions)</span>
            </div>
            <p className="text-xs text-red-200">
              Firebase está rechazando las peticiones de lectura y escritura. Necesitas actualizar las <strong>Reglas de Seguridad de Firestore</strong> en la consola de Firebase.
            </p>
            <div className="bg-black/50 p-3 rounded-2xl border border-red-900/50 font-mono text-[11px] text-emerald-400">
              <p className="text-[10px] font-bold text-gray-400 mb-1">// Ve a Firebase Console &gt; Firestore Database &gt; Reglas y pega:</p>
              <code>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}</code>
            </div>
          </div>
        )}

        {/* 1️⃣ SECCIÓN: GESTIÓN DE EDICIONES (CRUD + ACTIVAR) */}
        {seccion === 'ediciones' && (
          <div className="space-y-6">
            
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-black uppercase text-gray-900">Gestión de Ediciones del Torneo</h2>
                <p className="text-xs text-gray-500">Crea nuevas ediciones, cambia cuál es la Edición Activa en tiempo real o edita la configuración.</p>
              </div>

              <button
                onClick={() => {
                  setIdEdicionEditando(null);
                  setNumEd(ediciones.length + 1);
                  setNomEd(`Edición #${ediciones.length + 1}`);
                  setMostrarFormEdicion(!mostrarFormEdicion);
                }}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase flex items-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nueva Edición</span>
              </button>
            </div>

            {/* FORMULARIO CREAR / EDITAR EDICIÓN */}
            {mostrarFormEdicion && (
              <form onSubmit={handleCrearOActualizarEdicion} className="bg-white p-6 rounded-3xl border border-red-200 shadow-lg space-y-4 text-xs">
                <h3 className="font-black uppercase text-red-600 text-sm border-b pb-2">
                  {idEdicionEditando ? 'Editar Edición Existente' : 'Configurar Nueva Edición CocaChampions'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-gray-700">Número de Edición</label>
                    <input type="number" value={numEd} onChange={e => setNumEd(Number(e.target.value))} className="w-full mt-1 p-2.5 bg-gray-50 border rounded-xl font-bold" required />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">Nombre Oficial</label>
                    <input type="text" value={nomEd} onChange={e => setNomEd(e.target.value)} className="w-full mt-1 p-2.5 bg-gray-50 border rounded-xl font-bold" required />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">Costo Inscripción ($ USD)</label>
                    <input type="number" value={costoInsc} onChange={e => setCostoInsc(Number(e.target.value))} className="w-full mt-1 p-2.5 bg-gray-50 border rounded-xl font-bold" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-gray-700">Fecha Sorteo</label>
                    <input type="text" value={fSorteo} onChange={e => setFSorteo(e.target.value)} className="w-full mt-1 p-2.5 bg-gray-50 border rounded-xl font-bold" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">Fecha Sábado</label>
                    <input type="text" value={fSabado} onChange={e => setFSabado(e.target.value)} className="w-full mt-1 p-2.5 bg-gray-50 border rounded-xl font-bold" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">Fecha Domingo</label>
                    <input type="text" value={fDomingo} onChange={e => setFDomingo(e.target.value)} className="w-full mt-1 p-2.5 bg-gray-50 border rounded-xl font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-gray-700">Ubicación / Sede</label>
                    <input type="text" value={ubicCancha} onChange={e => setUbicCancha(e.target.value)} className="w-full mt-1 p-2.5 bg-gray-50 border rounded-xl font-bold" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">Premio 1er Lugar</label>
                    <input type="text" value={premio1} onChange={e => setPremio1(e.target.value)} className="w-full mt-1 p-2.5 bg-gray-50 border rounded-xl font-bold" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">Premio 2do Lugar</label>
                    <input type="text" value={premio2} onChange={e => setPremio2(e.target.value)} className="w-full mt-1 p-2.5 bg-gray-50 border rounded-xl font-bold" />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700">Reglas de Oro (Una por línea)</label>
                  <textarea value={reglasTexto} onChange={e => setReglasTexto(e.target.value)} rows={3} className="w-full mt-1 p-2.5 bg-gray-50 border rounded-xl font-bold" />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setMostrarFormEdicion(false)} className="px-4 py-2 bg-gray-200 font-bold rounded-xl text-gray-700">Cancelar</button>
                  <button type="submit" className="px-5 py-2 bg-black text-white font-bold rounded-xl">Guardar Edición</button>
                </div>
              </form>
            )}

            {/* LISTADO DE EDICIONES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ediciones.map(ed => (
                <div 
                  key={ed.id} 
                  className={`bg-white rounded-3xl p-5 border shadow-sm flex flex-col justify-between space-y-4 relative ${
                    ed.activa ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200'
                  }`}
                >
                  {ed.activa && (
                    <span className="absolute top-4 right-4 px-2.5 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg">
                      Edición Activa
                    </span>
                  )}

                  <div>
                    <h3 className="font-black text-base text-gray-900 uppercase">{ed.nombre}</h3>
                    <p className="text-xs text-gray-500 mt-1">Ubicación: {ed.ubicacion}</p>

                    <div className="mt-3 space-y-1 text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl">
                      <p>🗓️ Sorteo: <strong>{ed.fecha_sorteo}</strong></p>
                      <p>⚽ Sábado: <strong>{ed.fecha_sabado}</strong></p>
                      <p>⚽ Domingo: <strong>{ed.fecha_domingo}</strong></p>
                      <p>💵 Costo: <strong>${ed.costo_inscripcion} USD</strong></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    {!ed.activa && ed.id && (
                      <button
                        onClick={() => handleActivarEdicion(ed.id!)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase transition-all"
                      >
                        Activar Edición
                      </button>
                    )}
                    <button
                      onClick={() => handleCargarFormEdicionEdit(ed)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* 2️⃣ SECCIÓN: ALTA Y REGISTRO */}
        {seccion === 'registro' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* INSCRIBIR JUGADORES */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-red-600" />
                <h3 className="font-black uppercase text-sm text-gray-900">Inscribir Jugador a la Bolsa</h3>
              </div>
              <p className="text-xs text-gray-500">
                Se registrará en la bolsa de sorteo de <strong>{edicionTrabajo?.nombre}</strong>.
              </p>

              <form onSubmit={handleRegistrarJugador} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700">Nombre Completo del Jugador</label>
                  <input
                    type="text"
                    value={nuevoNombreJugador}
                    onChange={e => setNuevoNombreJugador(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full mt-1 p-3 bg-gray-50 border rounded-xl font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700">Disponibilidad</label>
                  <select
                    value={disponibilidadJugador}
                    onChange={e => setDisponibilidadJugador(e.target.value as DiaDisponibilidad)}
                    className="w-full mt-1 p-3 bg-gray-50 border rounded-xl font-bold"
                  >
                    <option value="Ambos">Ambos Días (Sábado y Domingo)</option>
                    <option value="Sábado">Sólo Sábado</option>
                    <option value="Domingo">Sólo Domingo</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase transition-all shadow-md"
                >
                  Registrar Jugador
                </button>
              </form>
            </div>

            {/* CREAR SELECCIONES */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ShieldPlus className="w-5 h-5 text-black" />
                <h3 className="font-black uppercase text-sm text-gray-900">Crear Selección / Equipo</h3>
              </div>
              <p className="text-xs text-gray-500">
                Equipos para la edición <strong>{edicionTrabajo?.nombre}</strong>.
              </p>

              <form onSubmit={handleCrearEquipo} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700">Nombre del Equipo</label>
                  <input
                    type="text"
                    value={nuevoNombreEquipo}
                    onChange={e => setNuevoNombreEquipo(e.target.value)}
                    placeholder="Ej. Los Reyes del Balón"
                    className="w-full mt-1 p-3 bg-gray-50 border rounded-xl font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700">Día de Juego</label>
                    <select
                      value={diaEquipo}
                      onChange={e => setDiaEquipo(e.target.value as DiaJuego)}
                      className="w-full mt-1 p-3 bg-gray-50 border rounded-xl font-bold"
                    >
                      <option value="Sábado">Sábado</option>
                      <option value="Domingo">Domingo</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700">Grupo</label>
                    <select
                      value={grupoEquipo}
                      onChange={e => setGrupoEquipo(e.target.value as Grupo)}
                      className="w-full mt-1 p-3 bg-gray-50 border rounded-xl font-bold"
                    >
                      <option value="A">Grupo A</option>
                      <option value="B">Grupo B</option>
                      <option value="C">Grupo C</option>
                      <option value="D">Grupo D</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-black hover:bg-gray-900 text-white rounded-xl font-black uppercase transition-all shadow-md"
                >
                  Crear Selección
                </button>
              </form>
            </div>

          </div>
        )}

        {/* 3️⃣ SECCIÓN: IMPORTADOR HISTÓRICO */}
        {seccion === 'importar' && (
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-black uppercase text-gray-900">Importador de Jugadores Históricos</h2>
                <p className="text-xs text-gray-500">
                  Busca jugadores inscritos en ediciones anteriores y promuévelos libre a la bolsa de <strong>{edicionTrabajo?.nombre}</strong>.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar jugador..."
                  value={busquedaImportar}
                  onChange={e => setBusquedaImportar(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {historicosFiltrados.length > 0 ? (
                historicosFiltrados.map(j => (
                  <div key={j.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-gray-900">{j.nombre}</h4>
                      <p className="text-[10px] text-gray-500">Disp. Anterior: {j.disponibilidad || 'Ambos'}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={dispImportar[j.id || ''] || j.disponibilidad || 'Ambos'}
                        onChange={e => setDispImportar({ ...dispImportar, [j.id || '']: e.target.value as DiaDisponibilidad })}
                        className="p-1.5 bg-white border rounded-lg text-[10px] font-bold"
                      >
                        <option value="Ambos">Ambos</option>
                        <option value="Sábado">Sábado</option>
                        <option value="Domingo">Domingo</option>
                      </select>

                      <button
                        onClick={() => handleImportarJugador(j)}
                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-black uppercase text-[10px] transition-all cursor-pointer"
                      >
                        Promover
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic col-span-full py-8 text-center">
                  No se encontraron jugadores en ediciones pasadas.
                </p>
              )}
            </div>
          </div>
        )}

        {/* 4️⃣ SECCIÓN: PADRÓN OFICIAL */}
        {seccion === 'padron' && (
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-black uppercase text-gray-900">Padrón Oficial de Jugadores ({jugadoresEdicion.length})</h2>
                <p className="text-xs text-gray-500">Lista completa registrada en la edición <strong>{edicionTrabajo?.nombre}</strong>.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar en el padrón..."
                  value={busquedaPadron}
                  onChange={e => setBusquedaPadron(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b">
                  <tr>
                    <th className="py-3 px-4">Jugador</th>
                    <th className="py-3 px-4">Disponibilidad</th>
                    <th className="py-3 px-4">Equipo Asignado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {padronFiltrado.length > 0 ? (
                    padronFiltrado.map(j => {
                      const esEditando = idJugadorEditando === j.id;
                      const eqAsignado = equiposEdicion.find(eq => eq.id === j.id_equipo);

                      return (
                        <tr key={j.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-bold text-gray-900">
                            {esEditando ? (
                              <input
                                type="text"
                                value={nombreEditando}
                                onChange={e => setNombreEditando(e.target.value)}
                                className="p-1.5 bg-white border rounded-lg text-xs font-bold w-full"
                              />
                            ) : (
                              j.nombre
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {esEditando ? (
                              <select
                                value={dispEditando}
                                onChange={e => setDispEditando(e.target.value as DiaDisponibilidad)}
                                className="p-1.5 bg-white border rounded-lg text-xs font-bold"
                              >
                                <option value="Ambos">Ambos</option>
                                <option value="Sábado">Sábado</option>
                                <option value="Domingo">Domingo</option>
                              </select>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                                {j.disponibilidad || 'Ambos'}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-xs font-bold">
                            {eqAsignado ? (
                              <span className="text-emerald-600 flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5" />
                                {eqAsignado.nombre}
                              </span>
                            ) : (
                              <span className="text-amber-600 italic">En Bolsa</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {esEditando ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => j.id && handleGuardarEdicionJugador(j.id)}
                                  className="p-1.5 bg-emerald-600 text-white rounded-lg"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setIdJugadorEditando(null)}
                                  className="p-1.5 bg-gray-200 text-gray-700 rounded-lg"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    if (j.id) {
                                      setIdJugadorEditando(j.id);
                                      setNombreEditando(j.nombre);
                                      setDispEditando(j.disponibilidad || 'Ambos');
                                    }
                                  }}
                                  className="p-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => j.id && handleEliminarJugador(j.id, j.nombre)}
                                  className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                        No hay jugadores registrados en el padrón.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5️⃣ SECCIÓN: MÓDULO DE DRAFT / SORTEO */}
        {seccion === 'sorteo' && (
          <div className="space-y-6">
            
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-black uppercase text-gray-900">Módulo de Draft / Sorteo en Vivo</h2>
                <p className="text-xs text-gray-500">Asigna jugadores de la Bolsa a sus Selecciones. La vista pública se actualiza automáticamente en tiempo real.</p>
              </div>

              <div className="flex items-center gap-2">
                {proximoEquipoSorteo && proximoEquipoSorteo.equipo && (
                  <div className="px-3 py-1.5 bg-red-50 rounded-xl border border-red-200 text-red-700 text-xs font-bold flex items-center gap-1.5">
                    <Shuffle className="w-3.5 h-3.5 text-red-600 animate-spin" />
                    <span>Próximo en Ronda: <strong>{proximoEquipoSorteo.equipo.nombre}</strong> ({proximoEquipoSorteo.cantidad}/6)</span>
                  </div>
                )}
                <div className="px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs font-bold">
                  Bolsa: {bolsaSorteo.length} Jugadores
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* BOLSA DE JUGADORES CON BÚSQUEDA Y ASIGNACIÓN RÁPIDA DE 1 CLIC */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-3 md:col-span-1">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-black text-xs uppercase text-red-600">Bolsa de Sorteo</h3>
                  <span className="text-[10px] text-gray-400 font-bold">{bolsaSorteoFiltrada.length} de {bolsaSorteo.length}</span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={busquedaBolsaDraft}
                    onChange={e => setBusquedaBolsaDraft(e.target.value)}
                    placeholder="Buscar jugador drafteado..."
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border rounded-xl text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                </div>
                
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {bolsaSorteoFiltrada.length > 0 ? (
                    bolsaSorteoFiltrada.map(j => (
                      <div key={j.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 hover:border-red-300 transition-all">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-900">{j.nombre}</span>
                          <span className="text-[10px] text-gray-500 font-semibold">{j.disponibilidad || 'Ambos'}</span>
                        </div>

                        {/* BOTÓN RÁPIDO DE 1 CLIC AL PRÓXIMO EQUIPO */}
                        {proximoEquipoSorteo && proximoEquipoSorteo.equipo && j.id && (
                          <button
                            type="button"
                            onClick={() => handleAsignarJugador(j.id!, proximoEquipoSorteo.equipo.id!)}
                            className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>⚡ Asignar a {proximoEquipoSorteo.equipo.nombre}</span>
                          </button>
                        )}

                        <select
                          onChange={(e) => {
                            if (e.target.value && j.id) {
                              handleAsignarJugador(j.id, e.target.value);
                            }
                          }}
                          defaultValue=""
                          className="w-full p-1.5 bg-white border rounded-xl text-[10px] font-bold text-gray-600"
                        >
                          <option value="" disabled>O elegir otro equipo manualmente...</option>
                          {equiposEdicion.map(eq => (
                            <option key={eq.id} value={eq.id}>
                              {eq.nombre} ({eq.dia_juego})
                            </option>
                          ))}
                        </select>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic py-6 text-center">
                      {busquedaBolsaDraft ? 'Sin resultados para el filtro' : '¡Bolsa vacía! Todos asignados.'}
                    </p>
                  )}
                </div>
              </div>

              {/* SELECCIONES Y SUS PLANTELES */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {equiposEdicion.map(eq => {
                  const integrantes = jugadoresEdicion.filter(j => j.id_equipo === eq.id);
                  return (
                    <div key={eq.id} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div>
                          <h4 className="font-black text-sm text-gray-900 uppercase flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-red-600" />
                            {eq.nombre}
                          </h4>
                          <span className="text-[10px] text-gray-500 font-bold">
                            {eq.dia_juego} | Grupo {eq.grupo || 'A'}
                          </span>
                        </div>

                        <button
                          onClick={() => eq.id && handleEliminarEquipo(eq.id, eq.nombre)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1.5 min-h-[100px]">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Plantel ({integrantes.length})</span>
                        {integrantes.length > 0 ? (
                          integrantes.map(j => (
                            <div key={j.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-xl text-xs font-bold text-gray-800">
                              <span>{j.nombre}</span>
                              <button
                                onClick={() => j.id && handleDevolverABolsa(j.id)}
                                className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase cursor-pointer"
                              >
                                Liberar
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 italic py-4">Sin jugadores asignados.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        )}

        {/* 6️⃣ SECCIÓN: PARTIDOS & MARCADORES */}
        {seccion === 'fixture' && (
          <div className="space-y-6">
            
            {/* PROGRAMAR PARTIDO */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-base font-black uppercase text-gray-900">Programar Partido ({edicionTrabajo?.nombre})</h2>
              
              <form onSubmit={handleCrearPartido} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700">Equipo Local</label>
                  <select
                    value={idLocalPartido}
                    onChange={e => setIdLocalPartido(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-gray-50 border rounded-xl font-bold"
                    required
                  >
                    <option value="">Seleccionar Local...</option>
                    {equiposEdicion.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700">Equipo Visitante</label>
                  <select
                    value={idVisitantePartido}
                    onChange={e => setIdVisitantePartido(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-gray-50 border rounded-xl font-bold"
                    required
                  >
                    <option value="">Seleccionar Visitante...</option>
                    {equiposEdicion.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700">Día y Fase</label>
                  <div className="flex gap-1 mt-1">
                    <select
                      value={diaPartido}
                      onChange={e => setDiaPartido(e.target.value as DiaJuego)}
                      className="p-2.5 bg-gray-50 border rounded-xl font-bold flex-1"
                    >
                      <option value="Sábado">Sábado</option>
                      <option value="Domingo">Domingo</option>
                    </select>
                    <input
                      type="text"
                      value={fasePartido}
                      onChange={e => setFasePartido(e.target.value)}
                      placeholder="Ej. Grupo A"
                      className="p-2.5 bg-gray-50 border rounded-xl font-bold flex-1"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase transition-all shadow-md"
                  >
                    Crear Partido
                  </button>
                </div>
              </form>
            </div>

            {/* LISTA DE PARTIDOS Y CARGA DE MARCADORES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {partidosEdicion.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center text-xs border-b pb-2">
                    <span className="font-black text-red-600 uppercase">{p.fase || 'Fase de Grupos'}</span>
                    <span className="font-bold text-gray-500">{p.dia_juego} | Status: {p.estado}</span>
                  </div>

                  <div className="grid grid-cols-7 items-center text-center">
                    <span className="col-span-2 font-black text-xs text-gray-900 truncate">{p.nombre_local}</span>

                    <div className="col-span-3 flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min="0"
                        defaultValue={p.goles_local}
                        onChange={e => p.id && setGolesLocalEdit({ ...golesLocalEdit, [p.id]: Number(e.target.value) })}
                        className="w-12 text-center p-2 bg-gray-50 border rounded-xl font-black text-sm"
                      />
                      <span className="font-black text-gray-400 text-xs">-</span>
                      <input
                        type="number"
                        min="0"
                        defaultValue={p.goles_visitante}
                        onChange={e => p.id && setGolesVisitanteEdit({ ...golesVisitanteEdit, [p.id]: Number(e.target.value) })}
                        className="w-12 text-center p-2 bg-gray-50 border rounded-xl font-black text-sm"
                      />
                    </div>

                    <span className="col-span-2 font-black text-xs text-gray-900 truncate">{p.nombre_visitante}</span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleGuardarResultadoPartido(p)}
                      className="px-3 py-1.5 bg-black hover:bg-gray-900 text-white rounded-xl text-xs font-black uppercase transition-all"
                    >
                      Guardar Marcador
                    </button>
                    {p.id && (
                      <button
                        onClick={() => handleEliminarPartido(p.id!)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </main>

    </div>
  );
}
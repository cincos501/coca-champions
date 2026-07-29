// src/pages/PublicView.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { FutbolService, EdicionesService } from '../services/futbol.service';
import type { Equipo, Jugador, Partido, EdicionConfig } from '../types/futbol.types';
import {
  Trophy, Calendar, MapPin, DollarSign, Award, Shield,
  ChevronLeft, ChevronRight, CheckCircle2, Clock,
  Users, Map as MapIcon, Sparkles, Search
} from 'lucide-react';

type SeccionPublica = 'resumen' | 'inscritos' | 'fixture' | 'galeria' | 'sede';

export default function PublicView() {
  // === ESTADOS FIREBASE Y EDICIÓN ===
  const [ediciones, setEdiciones] = useState<EdicionConfig[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Filtros de navegación pública
  const [diaFiltroFixture, setDiaFiltroFixture] = useState<'Todos' | 'Sábado' | 'Domingo'>('Todos');
  const [tabActiva, setTabActiva] = useState<SeccionPublica>('resumen');

  // Filtros de Búsqueda de Inscritos
  const [busquedaInscrito, setBusquedaInscrito] = useState<string>('');
  const [filtroDiaInscrito, setFiltroDiaInscrito] = useState<'Todos' | 'Sábado' | 'Domingo' | 'Ambos'>('Todos');

  // Ref para hacer scroll suave al cambiar pestañas
  const seccionContenidoRef = useRef<HTMLDivElement>(null);

  // Estado para el carrusel de fotos
  const [indiceFoto, setIndiceFoto] = useState(0);

  // Imágenes Oficiales CocaChampions (usando las imágenes de /public)
  const fotosGaleria = [
    {
      url: '/banner-vii.jpeg',
      titulo: 'Banner Oficial VII Edición CocaChampions',
      desc: 'El torneo de fútbol de mayor nivel'
    },
    {
      url: '/logo-medallas.jpeg',
      titulo: 'Premiación y Medallas Oficiales',
      desc: 'Reconocimiento y trofeos para los campeones'
    },
    {
      url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200',
      titulo: 'Pasión en la Cancha',
      desc: 'Emoción y fair play en cada jornada'
    },
    {
      url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200',
      titulo: 'Sorteo y Armado de Grupos',
      desc: 'Mesa de Control y Draft Oficial'
    }
  ];

  const [errorPermisos, setErrorPermisos] = useState<boolean>(false);

  // === SUSCRIPCIÓN EN TIEMPO REAL ===
  useEffect(() => {
    const handleErr = (err: Error & { code?: string }) => {
      console.error("Error en Firestore:", err);
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        setErrorPermisos(true);
      }
      setCargando(false);
    };

    const desuscribirEdiciones = EdicionesService.escucharEdiciones((listaEd) => {
      setEdiciones(listaEd || []);
    }, handleErr);

    const desuscribirEquipos = FutbolService.escucharEquipos((listaEq) => setEquipos(listaEq || []), handleErr);
    const desuscribirJugadores = FutbolService.escucharJugadores((listaJug) => setJugadores(listaJug || []), handleErr);
    const desuscribirPartidos = FutbolService.escucharPartidos((listaPar) => {
      setPartidos(listaPar || []);
      setCargando(false);
    }, handleErr);

    return () => {
      desuscribirEdiciones();
      desuscribirEquipos();
      desuscribirJugadores();
      desuscribirPartidos();
    };
  }, []);

  // EDICIÓN ACTIVA DESDE FIRESTORE
  const edicionActiva = useMemo(() => {
    if (!ediciones || ediciones.length === 0) return null;
    return ediciones.find(e => e.activa) || ediciones[0];
  }, [ediciones]);

  const edicionId = edicionActiva?.id || '';

  // FILTRADO EXCLUSIVO POR EDICIÓN ACTIVA
  const equiposEdicion = useMemo(() => {
    if (!edicionId) return [];
    return equipos.filter(e => e.edicion_id === edicionId);
  }, [equipos, edicionId]);

  const jugadoresEdicion = useMemo(() => {
    if (!edicionId) return [];
    return jugadores.filter(j => j.edicion_id === edicionId);
  }, [jugadores, edicionId]);

  const partidosEdicion = useMemo(() => {
    if (!edicionId) return [];
    return partidos.filter(p => p.edicion_id === edicionId);
  }, [partidos, edicionId]);

  // FILTRADO DE JUGADORES INSCRITOS PARA VERIFICACIÓN DE PARTICIPANTES
  const jugadoresInscritosFiltrados = useMemo(() => {
    return jugadoresEdicion.filter(j => {
      const coincideNombre = !busquedaInscrito.trim() || j.nombre.toLowerCase().includes(busquedaInscrito.toLowerCase());
      const coincideDia = filtroDiaInscrito === 'Todos' || j.disponibilidad === filtroDiaInscrito;
      return coincideNombre && coincideDia;
    });
  }, [jugadoresEdicion, busquedaInscrito, filtroDiaInscrito]);

  // FILTRADO DEL FIXTURE
  const fixtureFiltrado = useMemo(() => {
    if (diaFiltroFixture === 'Todos') return partidosEdicion;
    return partidosEdicion.filter(p => p.dia_juego === diaFiltroFixture);
  }, [partidosEdicion, diaFiltroFixture]);

  // Controles Carrusel
  const fotoSiguiente = () => setIndiceFoto((prev) => (prev + 1) % fotosGaleria.length);
  const fotoAnterior = () => setIndiceFoto((prev) => (prev - 1 + fotosGaleria.length) % fotosGaleria.length);

  // Cambio de Pestañas
  const cambiarTab = (nuevaTab: SeccionPublica) => {
    setTabActiva(nuevaTab);
    if (seccionContenidoRef.current) {
      seccionContenidoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-white p-6">
        <div className="w-14 h-14 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-sm tracking-widest uppercase animate-pulse">Cargando CocaChampions...</p>
      </div>
    );
  }

  if (errorPermisos) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-600/20 text-red-500 rounded-full mb-4 border border-red-500/30">
          <Trophy className="w-12 h-12 text-red-500 animate-pulse" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Permisos Insuficientes en Firestore</h1>
        <p className="text-slate-400 max-w-lg text-xs leading-relaxed mb-6">
          Las <strong className="text-red-400">Reglas de Seguridad</strong> de tu base de datos en Firebase Console están bloqueando la lectura pública de la información del torneo.
        </p>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-left max-w-md w-full space-y-2 text-xs font-mono text-slate-300">
          <p className="text-[11px] font-bold text-amber-400">Reglas sugeridas para Firebase Console &gt; Firestore &gt; Reglas:</p>
          <pre className="p-3 bg-slate-950 rounded-xl overflow-x-auto text-[11px] text-emerald-400">
            {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
          </pre>
        </div>
      </div>
    );
  }

  if (!edicionActiva) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <Trophy className="w-20 h-20 text-yellow-500 mb-4 animate-bounce" />
        <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-2">No Hay Edición Activa</h1>
        <p className="text-slate-400 max-w-md text-sm">
          Actualmente no hay ninguna edición cargada o marcada como activa en la base de datos. Por favor, abre el Panel Admin para activar o crear una edición.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">

      {/* 🏆 HERO BANNER DINÁMICO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-950 via-slate-950 to-slate-950 border-b border-slate-800">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f40009_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 relative z-10">
          <div className="flex flex-col items-center text-center space-y-4">

            {/* Badge Edición */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-red-400 animate-spin" />
              <span>{edicionActiva.nombre || 'Edición Activa'} (Edición #{edicionActiva.numero})</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-extratight uppercase text-white italic">
              Coca<span className="text-red-500 drop-shadow-[0_0_25px_rgba(244,0,9,0.6)]">Champions</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-medium">
              El torneo oficial de mayor nivel. Consulta la lista de inscritos, la agenda, el fixture y las reglas de oro en tiempo real.
            </p>

            {/* IMAGEN DE BANNER OFICIAL */}
            <div className="w-full max-w-4xl rounded-3xl overflow-hidden border border-slate-800 shadow-2xl my-4 aspect-[21/9] relative">
              <img
                src="/banner-vii.jpeg"
                alt="Banner VII Edición CocaChampions"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
            </div>

            {/* BARRA DE DATOS CLAVE DINÁMICOS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-4xl pt-2">
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center">
                <Calendar className="w-5 h-5 text-red-500 mb-1" />
                <span className="text-[10px] uppercase font-bold text-slate-400">Sorteo</span>
                <span className="text-xs font-black text-white mt-0.5">{edicionActiva.fecha_sorteo || 'Por definir'}</span>
              </div>

              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500 mb-1" />
                <span className="text-[10px] uppercase font-bold text-slate-400">Fechas de Juego</span>
                <span className="text-xs font-black text-white mt-0.5">{edicionActiva.fecha_sabado} / {edicionActiva.fecha_domingo}</span>
              </div>

              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-500 mb-1" />
                <span className="text-[10px] uppercase font-bold text-slate-400">Sede Oficial</span>
                <span className="text-xs font-black text-white mt-0.5 truncate max-w-[150px]">{edicionActiva.ubicacion || 'Cancha Principal'}</span>
              </div>

              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-500 mb-1" />
                <span className="text-[10px] uppercase font-bold text-slate-400">Inscripción</span>
                <span className="text-xs font-black text-white mt-0.5">{edicionActiva.costo_inscripcion || 0} Bs</span>
              </div>
            </div>

          </div>
        </div>

        {/* NAVEGACIÓN PESTAÑAS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-20 pointer-events-auto">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 scrollbar-none">
            {(
              [
                { id: 'resumen', label: 'Información & Reglas', icon: Shield },
                { id: 'inscritos', label: 'Jugadores Inscritos', icon: Users },
                { id: 'fixture', label: 'Fixture & Resultados', icon: Calendar },
                { id: 'galeria', label: 'Galería de Fotos', icon: Sparkles },
                { id: 'sede', label: 'Ubicación & Sede', icon: MapIcon }
              ] as const
            ).map(tab => {
              const IconComp = tab.icon;
              const activo = tabActiva === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    cambiarTab(tab.id);
                  }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase whitespace-nowrap transition-all cursor-pointer relative z-30 pointer-events-auto active:scale-95 ${activo
                      ? 'bg-red-600 text-white shadow-xl shadow-red-600/40 ring-2 ring-red-400'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 🚀 CONTENIDO DE SECCIONES */}
      <main ref={seccionContenidoRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* 1️⃣ SECCIÓN: INFORMACIÓN GENERAL Y REGLAS DE ORO */}
        {tabActiva === 'resumen' && (
          <div className="space-y-8">

            {/* GRID PREMIOS Y CUADRO HONOR */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* TARJETA DE PREMIOS DINÁMICOS CON FOTO */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between space-y-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-red-600/20 text-red-500 rounded-2xl">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-black text-lg text-white uppercase tracking-tight">Premios Oficiales</h2>
                      <p className="text-xs text-slate-400">Recompensas de la {edicionActiva.nombre}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 flex items-start gap-3">
                      <Trophy className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">1er Lugar (Campeón)</span>
                        <p className="text-sm font-bold text-white mt-0.5">{edicionActiva.premios?.primer_lugar || 'Por definir'}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-400/10 to-transparent border border-slate-400/20 flex items-start gap-3">
                      <Trophy className="w-6 h-6 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">2do Lugar (Subcampeón)</span>
                        <p className="text-sm font-bold text-white mt-0.5">{edicionActiva.premios?.segundo_lugar || 'Por definir'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-800 aspect-video">
                  <img src="/logo-medallas.jpeg" alt="Medallas Oficiales" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* REGLAS DE ORO DINÁMICAS DESDE FIRESTORE */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-amber-500/20 text-amber-500 rounded-2xl">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-black text-lg text-white uppercase tracking-tight">Reglas de Oro del Torneo</h2>
                      <p className="text-xs text-slate-400">Normativa disciplinaria y deportiva</p>
                    </div>
                  </div>

                  {edicionActiva.reglas_oro && edicionActiva.reglas_oro.length > 0 ? (
                    <ul className="space-y-3">
                      {edicionActiva.reglas_oro.map((regla, index) => (
                        <li key={index} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200 bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80">
                          <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <span>{regla}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No hay reglas registradas aún para esta edición.</p>
                  )}
                </div>
              </div>

            </div>

            {/* CUADRO DE HONOR (SI EXISTE) */}
            {edicionActiva.cuadro_honor && (
              <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-900/40 rounded-3xl p-6">
                <h3 className="text-xs font-black uppercase text-red-400 tracking-wider mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <span>Cuadro de Honor</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {edicionActiva.cuadro_honor.campeon && (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-amber-400 font-bold uppercase">Campeón</span>
                      <p className="text-sm font-black text-white">{edicionActiva.cuadro_honor.campeon}</p>
                    </div>
                  )}
                  {edicionActiva.cuadro_honor.subcampeon && (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Subcampeón</span>
                      <p className="text-sm font-black text-white">{edicionActiva.cuadro_honor.subcampeon}</p>
                    </div>
                  )}
                  {edicionActiva.cuadro_honor.goleador && (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-red-400 font-bold uppercase">Máximo Goleador</span>
                      <p className="text-sm font-black text-white">{edicionActiva.cuadro_honor.goleador}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* 2️⃣ SECCIÓN: JUGADORES INSCRITOS */}
        {tabActiva === 'inscritos' && (
          <div className="space-y-6">

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
              <div>
                <h2 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-500" />
                  <span>Padrón de Jugadores Inscritos</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Edición: <strong className="text-white">{edicionActiva.nombre}</strong> | Total Registrados: <strong className="text-red-400">{jugadoresEdicion.length} Jugadores</strong>
                </p>
              </div>

              {/* BÚSQUEDA Y FILTRO */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={busquedaInscrito}
                    onChange={e => setBusquedaInscrito(e.target.value)}
                    placeholder="Buscar tu nombre..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full sm:w-auto justify-center">
                  {(['Todos', 'Sábado', 'Domingo', 'Ambos'] as const).map(dia => (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => setFiltroDiaInscrito(dia)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${filtroDiaInscrito === dia ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      {dia}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* LISTADO DE JUGADORES */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-4 w-12 text-center">#</th>
                      <th className="py-4 px-4">Jugador Registrado</th>
                      <th className="py-4 px-4 text-center">Día / Disponibilidad</th>
                      <th className="py-4 px-4 text-center">Selección Asignada</th>
                      <th className="py-4 px-4 text-right">Estado de Inscripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {jugadoresInscritosFiltrados.length > 0 ? (
                      jugadoresInscritosFiltrados.map((j, idx) => {
                        const eqAsignado = equiposEdicion.find(eq => eq.id === j.id_equipo);
                        return (
                          <tr key={j.id || idx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 text-center font-black text-slate-500">{idx + 1}</td>
                            <td className="py-3.5 px-4 font-black text-white flex items-center gap-2">
                              <Users className="w-4 h-4 text-red-500" />
                              <span>{j.nombre}</span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${j.disponibilidad === 'Sábado'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : j.disponibilidad === 'Domingo'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                <Clock className="w-3 h-3" />
                                {j.disponibilidad || 'Ambos Días'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {eqAsignado ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-white font-bold text-xs border border-slate-800">
                                  <Shield className="w-3.5 h-3.5 text-red-500" />
                                  {eqAsignado.nombre} ({eqAsignado.dia_juego})
                                </span>
                              ) : (
                                <span className="text-amber-400 text-xs font-bold italic bg-amber-950/30 px-3 py-1 rounded-full border border-amber-900/40">
                                  Bolsa de Sorteo / Draft
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Confirmado
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                          <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                          <p className="font-bold text-white uppercase mb-1">
                            {busquedaInscrito ? 'Sin resultados para la búsqueda' : `No hay jugadores registrados en la ${edicionActiva.nombre}`}
                          </p>
                          <p className="text-slate-500">
                            {busquedaInscrito ? 'Intenta buscar con otro nombre.' : 'Los jugadores inscritos por la administración aparecerán aquí en tiempo real.'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 3️⃣ SECCIÓN: FIXTURE Y RESULTADOS */}
        {tabActiva === 'fixture' && (
          <div className="space-y-6">

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <div>
                <h2 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-500" />
                  <span>Fixture Exclusivo ({edicionActiva.nombre})</span>
                </h2>
                <p className="text-xs text-slate-400">Enfrentamientos y resultados en vivo</p>
              </div>

              {/* FILTRO POR DÍA */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                {(['Todos', 'Sábado', 'Domingo'] as const).map(dia => (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => setDiaFiltroFixture(dia)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase cursor-pointer transition-all ${diaFiltroFixture === dia
                        ? 'bg-red-600 text-white'
                        : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    {dia}
                  </button>
                ))}
              </div>
            </div>

            {/* LISTA DE PARTIDOS */}
            {fixtureFiltrado.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fixtureFiltrado.map(p => (
                  <div
                    key={p.id}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-900/30">
                        {p.fase || 'Fase de Grupos'}
                      </span>
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {p.dia_juego}
                      </span>
                    </div>

                    {/* ENFRENTAMIENTO */}
                    <div className="grid grid-cols-7 items-center text-center">
                      <div className="col-span-3 text-right font-black text-sm text-white truncate pr-2">
                        {p.nombre_local}
                      </div>

                      <div className="col-span-1 flex flex-col items-center justify-center">
                        {p.estado === 'jugado' ? (
                          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-sm font-black text-red-500">
                            {p.goles_local} - {p.goles_visitante}
                          </div>
                        ) : p.estado === 'en_juego' ? (
                          <div className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md animate-pulse">
                            EN JUEGO
                          </div>
                        ) : (
                          <span className="text-xs font-black text-slate-500">VS</span>
                        )}
                      </div>

                      <div className="col-span-3 text-left font-black text-sm text-white truncate pl-2">
                        {p.nombre_visitante}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/50">
                      <span>Estado: <strong className="uppercase text-slate-400">{p.estado}</strong></span>
                      <span>Sede: {edicionActiva.ubicacion || 'Villa Busch'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <h3 className="text-base font-black text-white uppercase">Sin partidos programados</h3>
                <p className="text-xs text-slate-500 mt-1">El fixture aún no ha sido cargado en la mesa de control para esta edición.</p>
              </div>
            )}

          </div>
        )}

        {/* 4️⃣ SECCIÓN: GALERÍA DE FOTOS Y CARRUSEL */}
        {tabActiva === 'galeria' && (
          <div className="space-y-6">

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <h2 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-500" />
                <span>Galería Oficial CocaChampions</span>
              </h2>
              <p className="text-xs text-slate-400">Imágenes destacadas de la competición y reconocimientos</p>
            </div>

            {/* CARRUSEL INTERACTIVO */}
            <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl group">
              <div className="aspect-video w-full relative">
                <img
                  src={fotosGaleria[indiceFoto].url}
                  alt={fotosGaleria[indiceFoto].titulo}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />

                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-2xl font-black text-white uppercase">{fotosGaleria[indiceFoto].titulo}</h3>
                  <p className="text-xs text-slate-300 font-medium">{fotosGaleria[indiceFoto].desc}</p>
                </div>
              </div>

              {/* Botones de navegación */}
              <button
                type="button"
                onClick={fotoAnterior}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-950/80 text-white border border-slate-800 hover:bg-red-600 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={fotoSiguiente}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-950/80 text-white border border-slate-800 hover:bg-red-600 transition-all cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* GRID DE MINIATURAS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {fotosGaleria.map((foto, idx) => (
                <div
                  key={idx}
                  onClick={() => setIndiceFoto(idx)}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all aspect-video ${indiceFoto === idx ? 'border-red-500 scale-105 shadow-lg shadow-red-500/20' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                >
                  <img src={foto.url} alt={foto.titulo} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

          </div>
        )}

        {/* 5️⃣ SECCIÓN: UBICACIÓN Y MAPA */}
        {tabActiva === 'sede' && (
          <div className="space-y-6">

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <h2 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <span>Sede Oficial del Torneo</span>
              </h2>
              <p className="text-xs text-slate-400">Ubicación configurada: <strong className="text-white">{edicionActiva.ubicacion || 'Cancha Villa Busch'}</strong></p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* TARJETA INFORMATIVA */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="font-black text-sm uppercase text-red-400">Detalles de la Cancha</h3>
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span><strong>Lugar:</strong> {edicionActiva.ubicacion || 'Cancha Villa Busch'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span><strong>Modalidad:</strong> Césped Sintético / Natural</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span><strong>Jornadas:</strong> Sábados y Domingos</span>
                  </div>
                </div>

                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(edicionActiva.ubicacion || 'Cancha Villa Busch')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase transition-all shadow-lg shadow-emerald-600/20"
                >
                  <MapIcon className="w-4 h-4" />
                  <span>Abrir en Google Maps</span>
                </a>
              </div>

              {/* MAPA VISUAL EMBEBIDO */}
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden h-80 relative shadow-xl">
                <iframe
                  title="Mapa de la Sede"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.548480392095!2d-66.15!3d-17.38!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDIyJzQ4LjAiUyA2NsKwMDknMDAuMCJX!5e0!3m2!1ses!2sbo!4v1620000000000!5m2!1ses!2sbo"
                  className="w-full h-full border-0 filter grayscale invert contrast-125 opacity-80"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur px-3 py-2 rounded-xl border border-slate-800 text-xs font-black text-white">
                  📍 {edicionActiva.ubicacion || 'Sede Principal'}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}
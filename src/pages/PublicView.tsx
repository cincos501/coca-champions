// src/pages/PublicView.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { FutbolService, EdicionesService } from '../services/futbol.service';
import type { Equipo, Jugador, Partido, EdicionConfig } from '../types/futbol.types';
import { GOLEADORES_HISTORICOS } from '../data/goleadoresHistoricos';
import {
  Trophy, Calendar, MapPin, DollarSign, Award, Shield,
  ChevronLeft, ChevronRight, CheckCircle2, Clock,
  Users, Map as MapIcon, Sparkles, Search, Shuffle
} from 'lucide-react';

type SeccionPublica = 'resumen' | 'sorteo' | 'inscritos' | 'fixture' | 'galeria' | 'sede' | 'goleadores';

const EDICION_OCTAVA_DEFAULT: EdicionConfig = {
  id: 'edicion-8-default',
  numero: 8,
  nombre: '🏆 COCACHAMPIONS OCTAVA EDICIÓN 🏆',
  activa: true,
  fecha_sorteo: 'Viernes 18 de Septiembre (08:30 PM)',
  fecha_sabado: 'Sábado 19 de Septiembre (02:30 PM)',
  fecha_domingo: 'Domingo 20 de Septiembre (08:30 AM)',
  ubicacion: 'Cancha de Villa Busch',
  costo_inscripcion: 4,
  reglas_oro: [
    'Inscripciones individuales: Costo 4 Bs por persona (pago exclusivo mediante código QR adjunto). Fecha límite: Viernes 18 de Septiembre 07:00 PM.',
    'Contacto de inscripción: Envía comprobante, nombre completo, disponibilidad y posición al WhatsApp +591 63787755.',
    'Formato: Equipos 100% aleatorios (máximo 6 jugadores por equipo) sin preferencias para garantizar total paridad.',
    'Sorteo Sábado / Ambos días: Viernes 18 de Septiembre 08:30 PM en vivo por TikTok SALE FULBO.',
    'Sorteo Domingo: Sábado 19 de Septiembre a las 08:30 PM.',
    'Dinámica del Sábado: Si un equipo pierde el sábado, sus integrantes podrán reinscribirse para el domingo en un nuevo sorteo.',
    'Beneficios: Arbitraje 100% gratuito (sin costo adicional) e indumentaria (ponchillos) provista por los organizadores.',
    'Transmisión en vivo por TikTok SALE FULBO y resultados en tiempo real por la página web COCACHAMPIONS.'
  ],
  premios: {
    primer_lugar: '1 Coca-Cola de 3 Litros, medallas para cada ganador y certificado oficial de campeón',
    segundo_lugar: '1 Coca-Cola de 300 ml para cada jugador'
  }
};

export default function PublicView() {
  // === ESTADOS FIREBASE Y EDICIÓN ===
  const [ediciones, setEdiciones] = useState<EdicionConfig[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Filtros de navegación pública
  const [diaFiltroFixture, setDiaFiltroFixture] = useState<'Todos' | 'Sábado' | 'Domingo'>('Todos');
  const [tabActiva, setTabActiva] = useState<SeccionPublica>('goleadores'); // Por defecto destacamos los goleadores e info de la VIII edición

  // Filtros de Búsqueda de Inscritos y Goleadores
  const [busquedaInscrito, setBusquedaInscrito] = useState<string>('');
  const [busquedaGoleador, setBusquedaGoleador] = useState<string>('');
  const [filtroDiaInscrito, setFiltroDiaInscrito] = useState<'Todos' | 'Sábado' | 'Domingo' | 'Ambos'>('Todos');

  // Ref para hacer scroll suave al cambiar pestañas
  const seccionContenidoRef = useRef<HTMLDivElement>(null);

  // Carrusel Hero Banner Principal (Afiche Octava Edición vs QR de Pago)
  const [slideHeroIndex, setSlideHeroIndex] = useState(0);

  const heroSlides = useMemo(() => [
    {
      id: 'afiche',
      label: 'Poster VIII Edición',
      src: '/banner-viii.jpeg',
      fallback: '/banner-vii.jpeg',
      alt: 'Afiche Oficial VIII Edición CocaChampions',
      tag: '🏆 VIII EDICIÓN'
    },
    {
      id: 'qr',
      label: 'QR de Pago (4 Bs)',
      src: '/Qrdepago.jpeg',
      fallback: '/logo-medallas.jpeg',
      alt: 'Código QR de Pago para la Inscripción CocaChampions',
      tag: '📲 PAGO QR (4 BS)'
    }
  ], []);

  // Auto-play para alternar cada 6 segundos entre el Afiche y el QR de Pago
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideHeroIndex(prev => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Estado para el carrusel de fotos secundario
  const [indiceFoto, setIndiceFoto] = useState(0);

  // Imágenes Oficiales CocaChampions (usando las imágenes de /public)
  const fotosGaleria = [
    {
      url: '/banner-viii.jpeg',
      titulo: 'Banner Oficial VIII Edición CocaChampions',
      desc: 'Afiche y detalles oficiales de la Octava Edición'
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

  // EDICIÓN ACTIVA DESDE FIRESTORE (O FALLBACK OCTAVA EDICIÓN)
  const edicionActiva = useMemo(() => {
    if (!ediciones || ediciones.length === 0) return EDICION_OCTAVA_DEFAULT;
    return ediciones.find(e => e.activa) || ediciones[0] || EDICION_OCTAVA_DEFAULT;
  }, [ediciones]);

  const edicionId = edicionActiva?.id || '';

  // FILTRADO DE GOLEADORES HISTÓRICOS
  const goleadoresHistoricosFiltrados = useMemo(() => {
    if (!busquedaGoleador.trim()) return GOLEADORES_HISTORICOS;
    return GOLEADORES_HISTORICOS.filter(g =>
      g.nombre.toLowerCase().includes(busquedaGoleador.toLowerCase())
    );
  }, [busquedaGoleador]);

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

  // CÁLCULOS DEL SORTEO EN TIEMPO REAL
  const bolsaSorteoPublica = useMemo(() => {
    return jugadoresEdicion.filter(j => !j.id_equipo);
  }, [jugadoresEdicion]);

  const jugadoresAsignadosCount = useMemo(() => {
    return jugadoresEdicion.filter(j => !!j.id_equipo).length;
  }, [jugadoresEdicion]);

  const porcentajeDraft = useMemo(() => {
    if (jugadoresEdicion.length === 0) return 0;
    return Math.round((jugadoresAsignadosCount / jugadoresEdicion.length) * 100);
  }, [jugadoresAsignadosCount, jugadoresEdicion]);

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

            {/* Badge Edición & Sorteo Live */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span>{edicionActiva.nombre || 'Edición Activa'} (Edición #{edicionActiva.numero})</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-extratight uppercase text-white italic">
              Coca<span className="text-red-500 drop-shadow-[0_0_25px_rgba(244,0,9,0.6)]">Champions</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-medium">
              Sigue el sorteo en tiempo real, consulta la lista de inscritos, el fixture y las reglas del torneo.
            </p>

            {/* CARRUSEL INTERACTIVO HERO (POSTER EDICIÓN + QR DE PAGO) */}
            <div className="w-full max-w-4xl rounded-3xl overflow-hidden border border-slate-800 shadow-2xl my-4 bg-slate-900 flex flex-col justify-center items-center relative group">
              
              {/* SLIDE DE PESTAÑAS RÁPIDAS SUPERIORES */}
              <div className="w-full bg-slate-950/80 backdrop-blur border-b border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2 px-4 z-20">
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {heroSlides[slideHeroIndex].tag}
                </span>

                <div className="flex items-center gap-1.5">
                  {heroSlides.map((slide, idx) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setSlideHeroIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase transition-all cursor-pointer ${
                        slideHeroIndex === idx
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {slide.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CONTENEDOR IMAGEN SLIDE */}
              <div className="w-full flex justify-center items-center relative min-h-[350px] p-2 bg-slate-950/40">
                <img 
                  key={heroSlides[slideHeroIndex].src}
                  src={heroSlides[slideHeroIndex].src} 
                  alt={heroSlides[slideHeroIndex].alt} 
                  className="w-full h-auto max-h-[750px] object-contain rounded-2xl transition-all duration-500 group-hover:scale-[1.005]"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.dataset.triedFallback) {
                      target.dataset.triedFallback = 'true';
                      target.src = heroSlides[slideHeroIndex].fallback;
                    }
                  }}
                />

                {/* BOTONES ANTERIOR / SIGUIENTE */}
                <button
                  type="button"
                  onClick={() => setSlideHeroIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/80 text-white border border-slate-800 hover:bg-red-600 transition-all cursor-pointer shadow-lg opacity-80 group-hover:opacity-100"
                  title="Anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setSlideHeroIndex((prev) => (prev + 1) % heroSlides.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/80 text-white border border-slate-800 hover:bg-red-600 transition-all cursor-pointer shadow-lg opacity-80 group-hover:opacity-100"
                  title="Siguiente"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* INDICADORES DE PUNTOS EN LA PARTE INFERIOR */}
              <div className="w-full py-2.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-center gap-2">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSlideHeroIndex(idx)}
                    className={`h-2.5 rounded-full transition-all cursor-pointer ${
                      slideHeroIndex === idx ? 'bg-red-500 w-7' : 'bg-slate-700 hover:bg-slate-500 w-2.5'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* BARRA DE DATOS CLAVE DINÁMICOS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-4xl pt-2">
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center">
                <Calendar className="w-5 h-5 text-red-500 mb-1" />
                <span className="text-[10px] uppercase font-bold text-slate-400">Sorteo</span>
                <span className="text-xs font-black text-white mt-0.5">{edicionActiva.fecha_sorteo || 'HOY EN VIVO'}</span>
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

              <div 
                onClick={() => setSlideHeroIndex(1)}
                className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-red-500/50 transition-all group"
                title="Haz clic para ver el QR de pago"
              >
                <DollarSign className="w-5 h-5 text-blue-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] uppercase font-bold text-slate-400">Inscripción</span>
                <span className="text-xs font-black text-white mt-0.5 flex flex-wrap items-center justify-center gap-1">
                  {edicionActiva.costo_inscripcion || 4} Bs 
                  <span className="text-[10px] bg-red-600 hover:bg-red-500 text-white px-1.5 py-0.5 rounded-md font-black shadow-sm">Ver QR 📲</span>
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* NAVEGACIÓN PESTAÑAS (CORREGIDO PARA EVITAR RECORTES EN PANTALLAS PEQUEÑAS) */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-20 pointer-events-auto overflow-hidden">
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 pt-1 px-2 scrollbar-none w-full">
            {(
              [
                { id: 'goleadores', label: 'Goleadores ⚽', icon: Trophy },
                { id: 'sorteo', label: 'Sorteo en Vivo 🎲', icon: Shuffle },
                { id: 'inscritos', label: 'Jugadores Inscritos', icon: Users },
                { id: 'resumen', label: 'Información & Reglas', icon: Shield },
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
                  className={`flex items-center gap-2 px-4 sm:px-5 py-3 rounded-2xl text-xs font-black uppercase whitespace-nowrap transition-all cursor-pointer relative z-30 pointer-events-auto active:scale-95 shrink-0 ${
                    activo
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

        {/* 🏆 SECCIÓN: TABLA HISTÓRICA DE GOLEADORES */}
        {tabActiva === 'goleadores' && (
          <div className="space-y-6">

            {/* HEADER GOLEADORES */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 p-6 rounded-3xl border border-amber-900/50 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Histórico Acumulado CocaChampions</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <span>Tabla de Goleadores</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Ranking oficial de máximos artilleros sumando los goles de todas las ediciones del torneo.
                </p>
              </div>

              {/* BÚSQUEDA GOLEADORES */}
              <div className="relative w-full md:w-72 z-10">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busquedaGoleador}
                  onChange={e => setBusquedaGoleador(e.target.value)}
                  placeholder="Buscar goleador por nombre..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* TOP 3 PODIO DESTACADO */}
            {!busquedaGoleador && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* #2 PLATA */}
                <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/60 rounded-3xl p-5 text-center relative overflow-hidden flex flex-col items-center justify-between order-2 md:order-1 shadow-lg">
                  <div className="w-12 h-12 rounded-full bg-slate-300/10 border border-slate-400/40 flex items-center justify-center text-slate-300 font-black text-xl mb-2 shadow-lg">
                    🥈
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Subgoleador Histórico</span>
                  <h3 className="text-lg font-black text-white mt-1">{GOLEADORES_HISTORICOS[1]?.nombre}</h3>
                  <div className="mt-3 px-4 py-1.5 rounded-full bg-slate-800 text-slate-200 text-xs font-black border border-slate-700 inline-block">
                    ⚽ {GOLEADORES_HISTORICOS[1]?.goles} Goles
                  </div>
                </div>

                {/* #1 ORO */}
                <div className="bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-6 text-center relative overflow-hidden flex flex-col items-center justify-between shadow-2xl shadow-amber-500/10 order-1 md:order-2 scale-105 z-10">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-black text-2xl mb-2 shadow-xl shadow-amber-500/20">
                    👑
                  </div>
                  <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1 justify-center">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    Máximo Artillero Leyenda
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">{GOLEADORES_HISTORICOS[0]?.nombre}</h3>
                  <div className="mt-3 px-5 py-2 rounded-full bg-amber-500 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/30 inline-block">
                    ⚽ {GOLEADORES_HISTORICOS[0]?.goles} Goles Acumulados
                  </div>
                </div>

                {/* #3 BRONCE */}
                <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-900/40 rounded-3xl p-5 text-center relative overflow-hidden flex flex-col items-center justify-between order-3 shadow-lg">
                  <div className="w-12 h-12 rounded-full bg-amber-900/20 border border-amber-700/40 flex items-center justify-center text-amber-600 font-black text-xl mb-2 shadow-lg">
                    🥉
                  </div>
                  <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Tercer Lugar Histórico</span>
                  <h3 className="text-lg font-black text-white mt-1">{GOLEADORES_HISTORICOS[2]?.nombre}</h3>
                  <div className="mt-3 px-4 py-1.5 rounded-full bg-slate-800 text-amber-400 text-xs font-black border border-amber-900/50 inline-block">
                    ⚽ {GOLEADORES_HISTORICOS[2]?.goles} Goles
                  </div>
                </div>
              </div>
            )}

            {/* TABLA COMPLETA DE GOLEADORES */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Mostrando {goleadoresHistoricosFiltrados.length} Artilleros Registrados
                </span>
                <span className="text-[11px] text-amber-400 font-bold bg-amber-950/40 px-3 py-1 rounded-full border border-amber-900/40">
                  Multiedición Acumulada
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-4 w-16 text-center">Pos</th>
                      <th className="py-4 px-4">Jugador</th>
                      <th className="py-4 px-4 text-center">Goles Totales</th>
                      <th className="py-4 px-4 text-right">Rango / Categoría</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {goleadoresHistoricosFiltrados.length > 0 ? (
                      goleadoresHistoricosFiltrados.map((g, idx) => {
                        const realIndex = GOLEADORES_HISTORICOS.findIndex(item => item.nombre === g.nombre && item.goles === g.goles);
                        const pos = realIndex >= 0 ? realIndex + 1 : idx + 1;

                        const isTop1 = pos === 1;
                        const isTop2 = pos === 2;
                        const isTop3 = pos === 3;

                        return (
                          <tr key={`${g.nombre}-${idx}`} className={`hover:bg-slate-800/40 transition-colors ${
                            isTop1 ? 'bg-amber-950/20 font-bold' : isTop2 ? 'bg-slate-800/20' : isTop3 ? 'bg-amber-900/10' : ''
                          }`}>
                            <td className="py-3.5 px-4 text-center">
                              {isTop1 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow-md">
                                  1
                                </span>
                              ) : isTop2 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black text-xs shadow-md">
                                  2
                                </span>
                              ) : isTop3 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs shadow-md">
                                  3
                                </span>
                              ) : (
                                <span className="font-black text-slate-500">#{pos}</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-black text-white flex items-center gap-2">
                              <span className={isTop1 ? 'text-amber-400' : 'text-slate-200'}>{g.nombre}</span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                                isTop1
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : g.goles >= 10
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : g.goles >= 5
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                ⚽ {g.goles} {g.goles === 1 ? 'gol' : 'goles'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="text-[11px] font-bold text-slate-400">
                                {g.goles >= 20 ? '🔥 Super Artillero' : g.goles >= 10 ? '⭐ Goleador Destacado' : g.goles >= 5 ? '⚡ Goleador' : '⚽ Anotador'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400 text-xs">
                          <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                          <p className="font-bold text-white uppercase mb-1">Sin resultados para la búsqueda</p>
                          <p className="text-slate-500">No se encontró ningún jugador con ese nombre en la tabla histórica.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 🎲 SECCIÓN: SORTEO EN VIVO EN TIEMPO REAL */}
        {tabActiva === 'sorteo' && (
          <div className="space-y-6">

            {/* HEADER EN VIVO */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 p-6 rounded-3xl border border-red-900/50 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-wider mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>Sorteo & Draft en Tiempo Real</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight flex items-center gap-2.5">
                  <Shuffle className="w-7 h-7 text-red-500 animate-pulse" />
                  <span>Armado de Selecciones</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Transmisión oficial de asignaciones para la <strong className="text-white">{edicionActiva.nombre}</strong>. Los jugadores se asignan ronda por ronda a cada equipo.
                </p>
              </div>

              {/* STATS DEL SORTEO */}
              <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
                <div className="bg-slate-950/80 backdrop-blur border border-slate-800 p-3.5 rounded-2xl text-center flex-1 md:flex-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Asignados</span>
                  <span className="text-lg font-black text-emerald-400">{jugadoresAsignadosCount} / {jugadoresEdicion.length}</span>
                </div>

                <div className="bg-slate-950/80 backdrop-blur border border-slate-800 p-3.5 rounded-2xl text-center flex-1 md:flex-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">En Bolsa</span>
                  <span className="text-lg font-black text-amber-400">{bolsaSorteoPublica.length}</span>
                </div>
              </div>
            </div>

            {/* BARRA DE PROGRESO GLOBAL DEL DRAFT */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-lg">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400 uppercase">Avance del Sorteo</span>
                <span className="text-red-400 font-black">{porcentajeDraft}% Completado</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${porcentajeDraft}%` }}
                />
              </div>
            </div>

            {/* TARJETAS DE EQUIPOS CON SUS 6 CUPOS EN TIEMPO REAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {equiposEdicion.map(eq => {
                const integrantes = jugadoresEdicion.filter(j => j.id_equipo === eq.id);
                const MAX_CUPOS = 6;
                const cupos = Array.from({ length: MAX_CUPOS }, (_, i) => integrantes[i] || null);

                return (
                  <div key={eq.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-black text-base text-white uppercase flex items-center gap-2">
                          <Shield className="w-5 h-5 text-red-500" />
                          <span>{eq.nombre}</span>
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400">
                          {eq.dia_juego} | Grupo {eq.grupo || 'A'}
                        </span>
                      </div>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                        integrantes.length === 6 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {integrantes.length} / 6 Jugadores
                      </span>
                    </div>

                    {/* LISTA DE 6 SLOTS / CUPOS */}
                    <div className="space-y-2">
                      {cupos.map((jugador, idx) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                            jugador 
                              ? 'bg-slate-950 border-slate-700/80 text-white font-bold shadow-sm' 
                              : 'bg-slate-950/40 border-dashed border-slate-800 text-slate-600 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                              jugador ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-500'
                            }`}>
                              #{idx + 1}
                            </span>
                            {jugador ? (
                              <span className="truncate text-white font-bold">{jugador.nombre}</span>
                            ) : (
                              <span className="italic text-slate-500">Esperando sorteo...</span>
                            )}
                          </div>

                          {jugador && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 shrink-0">
                              {jugador.disponibilidad || 'Ambos'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* JUGADORES EN BOLSA RESTANTES */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-black text-base uppercase text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-500" />
                    <span>Jugadores Pendientes en Bolsa ({bolsaSorteoPublica.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400">Jugadores inscritos listos para ser asignados en los siguientes giros del sorteo</p>
                </div>
              </div>

              {bolsaSorteoPublica.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {bolsaSorteoPublica.map(j => (
                    <div key={j.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-200">
                      <span className="truncate mr-1">{j.nombre}</span>
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md shrink-0 border border-amber-500/20">
                        {j.disponibilidad || 'Ambos'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-white uppercase">¡Sorteo completado con éxito!</p>
                  <p className="text-slate-500">Todos los jugadores han sido asignados a sus respectivas selecciones.</p>
                </div>
              )}
            </div>

          </div>
        )}

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
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                        filtroDiaInscrito === dia ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
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
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                j.disponibilidad === 'Sábado' 
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase cursor-pointer transition-all ${
                      diaFiltroFixture === dia
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
                  className={`relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all aspect-video ${
                    indiceFoto === idx ? 'border-red-500 scale-105 shadow-lg shadow-red-500/20' : 'border-slate-800 opacity-60 hover:opacity-100'
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
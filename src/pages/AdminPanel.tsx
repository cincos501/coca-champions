// src/pages/AdminPanel.tsx
import { useState, useEffect } from 'react';
import { FutbolService } from '../services/futbol.service';
import type { Equipo, DiaJuego, Jugador, Partido } from '../types/futbol.types';
import { Users, Calendar, Download } from 'lucide-react';

// Importación de librerías para generación y descarga automática de PDF
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Importamos la arquitectura modular
import StatsCards from '../components/admin/StatsCards';
import AdminForms from '../components/admin/AdminForms';
import TeamGrid from '../components/admin/TeamGrid';
import TeamModal from '../components/admin/TeamModal';
import FixtureManager from '../components/admin/FixtureManager';

type SeccionPanel = 'inscripciones' | 'fixture';

export default function AdminPanel() {
  const [seccion, setSeccion] = useState<SeccionPanel>('inscripciones');
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [idEquipoSeleccionado, setIdEquipoSeleccionado] = useState('');
  const [equipoGestionado, setEquipoGestionado] = useState<Equipo | null>(null);

  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    const desuscribirEquipos = FutbolService.escucharEquipos((listaEquipos) => {
      setEquipos(listaEquipos);
      if (listaEquipos.length > 0 && !idEquipoSeleccionado) {
        setIdEquipoSeleccionado(listaEquipos[0].id || '');
      }
    });

    const desuscribirJugadores = FutbolService.escucharJugadores((listaJugadores) => {
      setJugadores(listaJugadores);
    });

    const desuscribirPartidos = FutbolService.escucharPartidos((listaPartidos) => {
      setPartidos(listaPartidos);
      setLoading(false);
    });

    return () => {
      desuscribirEquipos();
      desuscribirJugadores();
      desuscribirPartidos();
    };
  }, [idEquipoSeleccionado]);

  const mostrarFeedback = (tipo: 'exito' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  };

  const handleCrearEquipo = async (nombre: string, dia: DiaJuego) => {
    setGuardando(true);
    try {
      await FutbolService.crearEquipo({ nombre, dia_juego: dia });
      mostrarFeedback('exito', `¡Equipo "${nombre}" creado con éxito!`);
    } catch (error) {
      mostrarFeedback('error', 'Error al guardar el equipo en Firebase.');
    } finally {
      setGuardando(false);
    }
  };

  const handleRegistrarJugador = async (nombre: string, idEquipo: string) => {
    const yaExisteEnEquipo = jugadores.some(
      j => j.nombre.toLowerCase() === nombre.toLowerCase() && j.id_equipo === idEquipo
    );

    if (yaExisteEnEquipo) {
      mostrarFeedback('error', `¡${nombre} ya está inscrito en este equipo!`);
      return;
    }

    setGuardando(true);
    try {
      const resultado = await FutbolService.registrarJugador({ nombre, id_equipo: idEquipo });
      if (resultado.exito) {
        mostrarFeedback('exito', `¡${nombre} inscrito con éxito!`);
      } else {
        mostrarFeedback('error', resultado.mensaje);
      }
    } catch (error) {
      mostrarFeedback('error', 'Error de red al inscribir jugador.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarJugador = async (idJugador: string, textJ: string) => {
    if (!window.confirm(`¿Retirar a ${textJ} del equipo?`)) return;
    try {
      await FutbolService.eliminarJugador(idJugador);
      mostrarFeedback('exito', `Se retiró a ${textJ}.`);
    } catch (error) {
      mostrarFeedback('error', 'No se pudo eliminar.');
    }
  };

  const handleEliminarEquipoCompleto = async (idEquipo: string, nombreE: string) => {
    if (!window.confirm(`🚨 ¿Borrar el equipo "${nombreE}" junto con sus jugadores?`)) return;
    setBorrando(true);
    try {
      await FutbolService.eliminarEquipo(idEquipo);
      mostrarFeedback('exito', `Equipo "${nombreE}" removido.`);
      setEquipoGestionado(null);
    } catch (error) {
      mostrarFeedback('error', 'Error al eliminar el equipo.');
    } finally {
      setBorrando(false);
    }
  };

  // Helper interno para limpiar tildes y eñes antes de inyectar texto al PDF
  const sanitizarTextoParaPDF = (texto: string): string => {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remueve tildes de forma matemática
      .replace(/ñ/g, "n")
      .replace(/Ñ/g, "N")
      .toUpperCase(); // Forzamos mayúsculas para look deportivo uniforme
  };

 // 🚀 GENERADOR DE PDF SANITIZADO (ACTUALIZADO: MULTI-PÁGINA SÁBADO Y DOMINGO)
  const handleDescargarReportePDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Definimos el ciclo para que procese ambas jornadas de forma secuencial
    const jornadas: DiaJuego[] = ['Sábado', 'Domingo'];

    jornadas.forEach((dia, index) => {
      // 🔄 Si ya procesó el Sábado (index 0), salta a una página nueva limpia para el Domingo
      if (index > 0) {
        doc.addPage();
      }

      // Configuración inicial de fuente segura y limpia
      doc.setFont("helvetica", "bold");
      
      // Encabezado Estético Principal de la Página
      doc.setFontSize(22);
      doc.setTextColor(244, 0, 9); // Rojo Coca-Cola Oficial
      doc.text("COCA-COLA CHAMPIONS - VI EDICION", 14, 16);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80); // Gris Oscuro Elegante
      // ⚡ El título ahora se adapta automáticamente al día actual de la página
      doc.text(`CALENDARIO OFICIAL DE COMPETENCIA Y DISTRIBUCION DE EQUIPOS (${sanitizarTextoParaPDF(dia)})`, 14, 22);

      // Separador visual gris sutil
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 25, 283, 25);

      // --- TABLA 1: CONFORMACIÓN DE GRUPOS DEL DÍA ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`CONFORMACION DE GRUPOS (${sanitizarTextoParaPDF(dia)})`, 14, 33);

      // ⚡ Filtramos los equipos dinámicamente según el día de la página actual
      const equiposGrupoA = equipos.filter(e => e.dia_juego === dia && e.grupo === 'A');
      const equiposGrupoB = equipos.filter(e => e.dia_juego === dia && e.grupo === 'B');
      
      const maxFilasGrupos = Math.max(equiposGrupoA.length, equiposGrupoB.length, 1);
      const filasGrupos = [];

      for (let i = 0; i < maxFilasGrupos; i++) {
        const eqA = equiposGrupoA[i];
        const eqB = equiposGrupoB[i];

        const miembrosA = eqA ? jugadores.filter(j => j.id_equipo === eqA.id).map(j => j.nombre).join(', ') : '';
        const miembrosB = eqB ? jugadores.filter(j => j.id_equipo === eqB.id).map(j => j.nombre).join(', ') : '';

        filasGrupos.push([
          eqA ? sanitizarTextoParaPDF(eqA.nombre) : '-',
          miembrosA ? sanitizarTextoParaPDF(miembrosA) : (eqA ? 'SIN JUGADORES' : '-'),
          eqB ? sanitizarTextoParaPDF(eqB.nombre) : '-',
          miembrosB ? sanitizarTextoParaPDF(miembrosB) : (eqB ? 'SIN JUGADORES' : '-')
        ]);
      }

      autoTable(doc, {
        startY: 37,
        head: [['EQUIPO (GRUPO A)', 'INTEGRANTES DE PLANTILLA', 'EQUIPO (GRUPO B)', 'INTEGRANTES DE PLANTILLA']],
        body: filasGrupos,
        headStyles: { fillColor: [244, 0, 9], fontSize: 9, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 8.5, font: 'helvetica', cellPadding: 3.5 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 45 },
          1: { textColor: [60, 60, 60] },
          2: { fontStyle: 'bold', cellWidth: 45 },
          3: { textColor: [60, 60, 60] }
        },
        theme: 'grid'
      });

      // --- TABLA 2: FIXTURE Y CRUCES DE LAS 3 VUELTAS DEL DÍA ---
      const ySiguiente = (doc as any).lastAutoTable.finalY + 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`FIXTURE Y CRONOGRAMA DE ENCUENTROS (${sanitizarTextoParaPDF(dia)})`, 14, ySiguiente);

      const filasPartidos: any[] = [];
      const vueltas = ['1RA VUELTA', '2DA VUELTA', '3RA VUELTA'] as const;

      vueltas.forEach((vuel) => {
        // ⚡ Filtramos los partidos dinámicamente evaluando el día de la página actual
        const partidosDeVuelta = partidos.filter(p => p.dia_juego === dia && p.vuelta === vuel);
        partidosDeVuelta.forEach((p, idx) => {
          filasPartidos.push([
            vuel,
            `GRUPO ${p.grupo}`,
            sanitizarTextoParaPDF(p.nombre_local),
            p.estado === 'jugado' ? `${p.goles_local} : ${p.goles_visitante}` : '   :   ', // Vacío si falta jugar
            sanitizarTextoParaPDF(p.nombre_visitante),
            `PARTIDO ${idx + 1}`
          ]);
        });
      });

      autoTable(doc, {
        startY: ySiguiente + 4,
        head: [['JORNADA / FASE', 'GRUPO', 'EQUIPO LOCAL', 'MARCADOR', 'EQUIPO VISITANTE', 'ORDEN']],
        body: filasPartidos.length > 0 ? filasPartidos : [['-', '-', `NO HAY ENCUENTROS AGENDADOS PARA EL ${sanitizarTextoParaPDF(dia)}`, '-', '-', '-']],
        headStyles: { fillColor: [20, 20, 20], fontSize: 9, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 8.5, font: 'helvetica', halign: 'center', cellPadding: 3.5 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [250, 250, 250] },
          1: { fontStyle: 'bold' },
          2: { halign: 'right', fontStyle: 'bold', cellWidth: 60 },
          3: { fontStyle: 'bold', fillColor: [240, 240, 240], fontSize: 10 }, 
          4: { halign: 'left', fontStyle: 'bold', cellWidth: 60 }   
        },
        theme: 'grid'
      });
    });

    // Descarga instantánea y automática del documento unificado
    doc.save("Fixture_Oficial_Coca_Champions.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 font-sans antialiased max-w-7xl mx-auto space-y-6">
      
      {/* 🔝 MESA DE CONTROL / BARRA SUPERIOR DE ACCIONES */}
      <div className="bg-neutral-950 p-4 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <h1 className="font-black tracking-tight text-base uppercase text-center sm:text-left">Mesa de Control y Operaciones</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center sm:text-left">Torneo Interno Coca-Cola Champions</p>
        </div>
        
        <div className="flex flex-wrap bg-neutral-900 p-1 rounded-2xl border border-neutral-800 w-full sm:w-auto justify-center gap-1 sm:gap-0">
          <button type="button" onClick={() => setSeccion('inscripciones')} className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${seccion === 'inscripciones' ? 'bg-[#F40009] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            <Users className="w-3.5 h-3.5" /> Inscripciones
          </button>
          <button type="button" onClick={() => setSeccion('fixture')} className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${seccion === 'fixture' ? 'bg-[#F40009] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            <Calendar className="w-3.5 h-3.5" /> Fixture y Grupos
          </button>
          <button type="button" onClick={handleDescargarReportePDF} className="flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all">
            <Download className="w-3.5 h-3.5 text-red-500 animate-bounce" /> Descargar Fixture PDF
          </button>
        </div>
      </div>

      {/* BANNER DE FEEDBACK GLOBAL */}
      {mensaje && (
        <div className="p-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-center border animate-pulse bg-emerald-50 text-emerald-700 border-emerald-200">
          {mensaje.texto}
        </div>
      )}

      {/* METRICAS DEL TORNEO */}
      <div>
        <StatsCards equipos={equipos} jugadores={jugadores} />
      </div>

      {/* VISTAS OPERATIVAS INTERACTIVAS */}
      <div>
        {seccion === 'inscripciones' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <AdminForms 
              equipos={equipos} 
              jugadores={jugadores}
              loading={loading}
              guardando={guardando}
              mensaje={null}
              idEquipoSeleccionado={idEquipoSeleccionado}
              setIdEquipoSeleccionado={setIdEquipoSeleccionado}
              onCrearEquipo={handleCrearEquipo}
              onRegistrarJugador={handleRegistrarJugador}
            />

            <TeamGrid 
              equipos={equipos} 
              jugadores={jugadores} 
              onSelectEquipo={setEquipoGestionado} 
            />
          </div>
        ) : (
          <FixtureManager equipos={equipos} mostrarFeedback={mostrarFeedback} />
        )}
      </div>

      {/* MODAL DE EDICIÓN DE MIEMBROS */}
      <div>
        {equipoGestionado && (
          <TeamModal 
            equipo={equipoGestionado}
            jugadores={jugadores}
            borrando={borrando}
            onClose={() => setEquipoGestionado(null)}
            onEliminarJugador={handleEliminarJugador}
            onEliminarEquipo={handleEliminarEquipoCompleto}
          />
        )}
      </div>

    </div>
  );
}
// src/components/admin/AdminForms.tsx
import { useState } from 'react';
import { ShieldCheck, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf'; // Exportador Nativo Automático
import type { Equipo, Jugador, DiaJuego } from '../../types/futbol.types';

interface AdminFormsProps {
  equipos: Equipo[];
  jugadores: Jugador[];
  loading: boolean;
  guardando: boolean;
  mensaje: { tipo: 'exito' | 'error'; texto: string } | null;
  idEquipoSeleccionado: string;
  setIdEquipoSeleccionado: (id: string) => void;
  onCrearEquipo: (nombre: string, dia: DiaJuego) => Promise<void>;
  onRegistrarJugador: (nombre: string, idEquipo: string) => Promise<void>;
}

type TabActual = 'equipos' | 'jugadores';

export default function AdminForms({
  equipos, jugadores, loading, guardando, mensaje,
  idEquipoSeleccionado, setIdEquipoSeleccionado, onCrearEquipo, onRegistrarJugador
}: AdminFormsProps) {
  const [tab, setTab] = useState<TabActual>('equipos');
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [diaJuego, setDiaJuego] = useState<DiaJuego>('Sábado');
  const [nombreJugador, setNombreJugador] = useState('');

  // 🧼 HELPER SANITIZADOR: Remueve tildes, eñes y caracteres raros para evitar los errores de Edge/WhatsApp
  const limpiarTextoCelulares = (texto: string): string => {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Borra los acentos matemáticamente
      .replace(/ñ/g, "n")
      .replace(/Ñ/g, "N")
      .toUpperCase(); // Forzamos mayúsculas para look deportivo estándar
  };

  // 📝 ALGORITMO GENERADOR DE REPORTES PDF BLINDADO CONTRA SÍMBOLOS RAROS
  const exportarPlanillasPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Encabezado Corporativo Limpio
    doc.setFillColor(244, 0, 9); // Rojo Coca-Cola
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("COCA-COLA CHAMPIONS 2026", 14, 14);
    doc.setFontSize(10);
    doc.text("PLANILLAS OFICIALES E INSCRIPCIONES DEL TORNEO", 14, 22);

    let y = 45;
    const dias: DiaJuego[] = ['Sábado', 'Domingo'];

    dias.forEach(dia => {
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      
      // Sanitizamos el nombre del día ("SABADO")
      doc.text(`JORNADA OFICIAL DEL ${limpiarTextoCelulares(dia)}`, 14, y);
      y += 8;

      const equiposDelDia = equipos.filter(e => e.dia_juego === dia);
      
      if (equiposDelDia.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text("SIN EQUIPOS REGISTRADOS PARA ESTE DIA.", 18, y);
        y += 10;
      } else {
        equiposDelDia.forEach(eq => {
          // Si nos estamos quedando sin espacio abajo en la hoja A4, creamos una nueva página limpia
          if (y > 260) { 
            doc.addPage(); 
            y = 20; 
          }
          
          // Fondo Gris de Tarjeta de Equipo para separar visualmente
          doc.setFillColor(245, 245, 245);
          doc.rect(14, y - 5, 182, 7.5, 'F');
          
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          
          const grupoTxt = eq.grupo ? ` - GRUPO ${eq.grupo}` : '';
          const nombreEquipoLimpio = limpiarTextoCelulares(eq.nombre);
          
          // Pintamos el título del equipo libre de errores encoding
          doc.text(`EQUIPO: ${nombreEquipoLimpio}${grupoTxt}`, 17, y);
          y += 8;

          const integrantes = jugadores.filter(j => j.id_equipo === eq.id);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(50, 50, 50);

          if (integrantes.length === 0) {
            doc.text("   (NO HAY JUGADORES INSCRITOS EN ESTE EQUIPO)", 18, y);
            y += 6;
          } else {
            integrantes.forEach((j, index) => {
              const nombreJugadorLimpio = limpiarTextoCelulares(j.nombre);
              doc.text(`   ${index + 1}. ${nombreJugadorLimpio}`, 18, y);
              y += 6;
            });
          }
          y += 5; // Separación de colchón entre equipos
        });
      }
      y += 8;
    });

    // Descarga directa e instantánea sin abrir alertas del sistema
    doc.save('Planillas_Oficiales_Inscritos.pdf');
  };

  return (
    <div className="lg:col-span-5 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform transition-all">
      {/* Cabecera */}
      <div className="bg-neutral-950 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#F40009]" />
          <span className="font-black tracking-tight text-sm uppercase">Inscripciones</span>
        </div>
        <button 
          type="button"
          onClick={exportarPlanillasPDF}
          className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-red-600/20"
        >
          <FileDown className="w-3.5 h-3.5" /> Descargar Lista PDF
        </button>
      </div>

      {mensaje && (
        <div className={`p-4 flex items-center gap-2 border-b text-xs font-bold uppercase tracking-wide ${
          mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
        }`}>
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Pestañas */}
      <div className="flex bg-gray-100/60 p-1.5 m-4 rounded-2xl border border-gray-200/40">
        <button type="button" onClick={() => setTab('equipos')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${tab === 'equipos' ? 'bg-white text-gray-950 shadow-xs' : 'text-gray-400'}`}>Equipos</button>
        <button type="button" onClick={() => setTab('jugadores')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${tab === 'jugadores' ? 'bg-white text-gray-950 shadow-xs' : 'text-gray-400'}`}>Jugadores</button>
      </div>

      <div className="px-5 pb-5">
        {loading ? (
          <div className="py-6 text-center text-xs font-bold text-gray-400 animate-pulse">CARGANDO...</div>
        ) : tab === 'equipos' ? (
          <form onSubmit={(e) => { e.preventDefault(); if (nombreEquipo.trim()) onCrearEquipo(nombreEquipo.trim(), diaJuego); setNombreEquipo(''); }} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 block px-0.5">Nombre del Equipo</label>
              <input type="text" required disabled={guardando} placeholder="Ej. Los Galácticos FC" value={nombreEquipo} onChange={(e) => setNombreEquipo(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#F40009] focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 block px-0.5">Rol de Juego</label>
              <select value={diaJuego} onChange={(e) => setDiaJuego(e.target.value as DiaJuego)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 cursor-pointer focus:ring-2 focus:ring-[#F40009] focus:outline-none">
                <option value="Sábado">Sábado</option>
                <option value="Domingo">Domingo</option>
              </select>
            </div>
            <button type="submit" disabled={guardando} className="w-full bg-[#F40009] hover:bg-red-700 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50">Crear Equipo</button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (nombreJugador.trim() && idEquipoSeleccionado) onRegistrarJugador(nombreJugador.trim(), idEquipoSeleccionado); setNombreJugador(''); }} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 block px-0.5">Nombre del Jugador</label>
              <input type="text" required disabled={guardando} placeholder="Ej. Juan Gómez" value={nombreJugador} onChange={(e) => setNombreJugador(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#F40009] focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 block px-0.5">Asignar a Equipo</label>
              <select value={idEquipoSeleccionado} onChange={(e) => setIdEquipoSeleccionado(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 cursor-pointer focus:ring-2 focus:ring-[#F40009] focus:outline-none">
                {equipos.map((eq) => {
                  const count = jugadores.filter(j => j.id_equipo === eq.id).length;
                  return <option key={eq.id} value={eq.id} disabled={count >= 6}>{eq.nombre} ({eq.dia_juego}) — {count}/6 cupos</option>;
                })}
              </select>
            </div>
            <button type="submit" disabled={guardando} className="w-full bg-black hover:bg-neutral-900 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50">Fichar e Inscribir</button>
          </form>
        )}
      </div>
    </div>
  );
}
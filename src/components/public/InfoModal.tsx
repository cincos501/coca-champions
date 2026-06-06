import { X } from 'lucide-react';

type ModalTipo = 'reglamento' | 'premios' | 'formato' | null;

interface InfoModalProps {
  tipo: ModalTipo;
  onClose: () => void;
}

export default function InfoModal({ tipo, onClose }: InfoModalProps) {
  if (!tipo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150">
        <div className="bg-[#F40009] text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="font-black text-xs uppercase tracking-wider">{tipo} Oficial</h3>
          <button onClick={onClose} className="p-1 text-red-200 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 overflow-y-auto text-xs text-gray-600 font-medium space-y-3 leading-relaxed">
          {tipo === 'formato' && (
            <>
              <p className="font-bold text-gray-800">⚽ SÁBADO: Clasificatoria 1</p>
              <p>Los 2 mejores equipos sellan su boleto directo a Semifinales. Los eliminados pueden volver a inscribirse para el domingo.</p>
              <p className="font-bold text-gray-800 mt-2">⚽ DOMINGO: Clasificatoria 2 + Fase Final</p>
              <p>Se definen los otros 2 mejores del día y se juega el Cruce de Titanes por la copa absoluta. 🔥</p>
            </>
          )}
          {tipo === 'premios' && (
            <>
              <p>🥇 <strong>Campeones:</strong> Coca-Cola de 3L + una de 500ml para cada jugador.</p>
              <p>🥈 <strong>Subcampeones:</strong> Coca-Cola de 300ml para cada integrante.</p>
              <p>⭐ <strong>Menciones:</strong> Mejor Jugador, Goleador, Subgoleador y Mejor Arquero.</p>
            </>
          )}
          {tipo === 'reglamento' && (
            <>
              <p>1. <strong>Inclusión:</strong> Todos los integrantes inscritos deben jugar como mínimo un partido completo.</p>
              <p className="text-red-600 font-bold">Está prohibido cambiar de equipo una vez iniciado el campeonato. Descalificación inmediata sin excepciones.</p>
              <p>2. <strong>Ponchillos:</strong> Se define por volado de moneda antes del encuentro.</p>
              <p>3. <strong>Empates:</strong> Tanda inicial de 3 penales directos, seguido de muerte súbita.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
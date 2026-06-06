import { Calendar, Gift, ScrollText } from 'lucide-react';

type ModalTipo = 'reglamento' | 'premios' | 'formato' | null;

interface InfoButtonsProps {
  onOpenModal: (tipo: ModalTipo) => void;
}

export default function InfoButtons({ onOpenModal }: InfoButtonsProps) {
  return (
    <div className="max-w-xl mx-auto px-4 -mt-6 relative z-20 grid grid-cols-3 gap-3">
      <button onClick={() => onOpenModal('formato')} className="bg-white p-3.5 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center justify-center gap-1 text-center active:scale-95 cursor-pointer">
        <Calendar className="w-5 h-5 text-[#F40009]" /><span className="text-[10px] font-black uppercase text-gray-800">Formato</span>
      </button>
      <button onClick={() => onOpenModal('premios')} className="bg-white p-3.5 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center justify-center gap-1 text-center active:scale-95 cursor-pointer">
        <Gift className="w-5 h-5 text-amber-500" /><span className="text-[10px] font-black uppercase text-gray-800">Premios</span>
      </button>
      <button onClick={() => onOpenModal('reglamento')} className="bg-white p-3.5 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center justify-center gap-1 text-center active:scale-95 cursor-pointer">
        <ScrollText className="w-5 h-5 text-black" /><span className="text-[10px] font-black uppercase text-gray-800">Reglamento</span>
      </button>
    </div>
  );
}
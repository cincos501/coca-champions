
export default function HeroBanner() {
  return (
    <div className="bg-[#F40009] relative overflow-hidden text-white pt-12 pb-16 px-4 text-center select-none shadow-xl">
      <div className="absolute inset-0 bg-wave pointer-events-none opacity-25"></div>
      <div className="relative z-10 max-w-xl mx-auto space-y-3">
        <span className="inline-block bg-black text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 animate-pulse">
          VI Edición — Torneo Relámpago 2026
        </span>
        <h1 className="text-white text-6xl font-coca leading-none drop-shadow-md">Coca</h1>
        <h2 className="text-black font-black text-3xl tracking-tighter uppercase italic bg-white inline-block px-4 py-0.5 rounded-lg transform -rotate-1">CHAMPIONS</h2>
        <p className="text-red-100 text-xs font-semibold max-w-sm mx-auto pt-1">¡El azar define tu equipo! Consulta tu equipo y fixture en tiempo real sin recargar.</p>
      </div>
    </div>
  );
}
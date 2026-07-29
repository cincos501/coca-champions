// src/components/admin/EdicionManager.tsx

interface Props {
  ediciones?: EdicionConfig[]; // '?' por si llega a ser undefined momentáneamente
  edicionSeleccionada: EdicionConfig | null;
  onSeleccionarEdicion: (edicion: EdicionConfig) => void;
}

export default function EdicionManager({ 
  ediciones = [], // 👈 Valor por defecto como array vacío
  edicionSeleccionada, 
  onSeleccionarEdicion 
}: Props) {
  
  // ... resto de tu lógica ...

  return (
    // ...
    <select
      value={edicionSeleccionada?.id || ''}
      onChange={(e) => {
        const encontrada = ediciones.find(ed => ed.id === e.target.value);
        if (encontrada) onSeleccionarEdicion(encontrada);
      }}
      className="p-2.5 bg-gray-50 border rounded-xl text-xs font-black uppercase flex-1 sm:w-48"
    >
      {/* 👈 Uso de encadenamiento opcional por seguridad extra */}
      {ediciones?.map(ed => (
        <option key={ed.id} value={ed.id}>
          {ed.nombre} {ed.activa ? '(ACTIVA)' : ''}
        </option>
      ))}
    </select>
    // ...
  );
}
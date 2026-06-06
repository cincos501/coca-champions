// src/App.tsx
import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import Login from './pages/Login';
import PublicView from './pages/PublicView';
import AdminPanel from './pages/AdminPanel';
import { Trophy, ShieldAlert, LogOut, Eye } from 'lucide-react';

type VistaActual = 'publica' | 'login' | 'admin';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [vista, setVista] = useState<VistaActual>('publica');
  const [cargandoAuth, setCargandoAuth] = useState<boolean>(true);

  // Escuchar si el administrador cambia de estado (Inicia o cierra sesión)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuarioFirebase) => {
      setUser(usuarioFirebase);
      if (usuarioFirebase) {
        setVista('admin'); // Si está logueado, lo mandamos directo al panel
      } else if (vista === 'admin') {
        setVista('publica'); // Si desloguea estando en admin, vuelve al inicio
      }
      setCargandoAuth(false);
    });

    return () => unsubscribe();
  }, [vista]);

  // Función rápida para cerrar sesión
  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  if (cargandoAuth) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-[#F40009] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col justify-between">
      
      {/* Barra de navegación superior fija (Optimizada para móviles) */}
      <nav className="bg-black text-white px-4 py-3 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <div 
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => setVista('publica')}
        >
          <Trophy className="w-5 h-5 text-[#F40009] animate-pulse" />
          <span className="font-black text-sm tracking-wider uppercase italic">
            Coca <span className="text-[#F40009]">Champions</span>
          </span>
        </div>

        {/* Menú de acciones rápidas */}
        <div className="flex items-center gap-2">
          {vista !== 'publica' && (
            <button
              onClick={() => setVista('publica')}
              className="flex items-center gap-1 text-xs font-bold uppercase bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-all"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Ver Torneo</span>
            </button>
          )}

          {user ? (
            // Acciones si está logueado como Admin
            <div className="flex items-center gap-2">
              {vista !== 'admin' && (
                <button
                  onClick={() => setVista('admin')}
                  className="text-xs font-bold uppercase bg-[#F40009] px-3 py-1.5 rounded-lg text-white"
                >
                  Panel
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs font-bold uppercase bg-red-900/40 hover:bg-red-700 text-red-200 hover:text-white px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            // Botón para ir al login si es visitante
            vista !== 'login' && (
              <button
                onClick={() => setVista('login')}
                className="flex items-center gap-1 text-xs font-bold uppercase border border-gray-700 hover:border-white text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Admin</span>
              </button>
            )
          )}
        </div>
      </nav>

      {/* Renderizado Condicional de Páginas */}
      <main className="grow">
        {vista === 'publica' && <PublicView />}
        {vista === 'login' && <Login onLoginSuccess={() => setVista('admin')} />}
        {vista === 'admin' && user && <AdminPanel />}
      </main>

    </div>
  );
}

export default App;
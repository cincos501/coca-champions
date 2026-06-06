// src/pages/Login.tsx
import React, { useState } from 'react';
import { AuthService } from '../services/auth.service';
import { LogIn, Lock, Mail, AlertTriangle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await AuthService.login(email, password);
      onLoginSuccess();
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError('Acceso denegación: Credenciales incorrectas.');
      } else {
        setError('Error de conexión con los servidores de Coca-Cola.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // Contenedor externo para PC: Evita que se desarme a los lados dando un fondo oscuro de estadio
    <div className="min-h-screen bg-neutral-950 sm:bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] sm:from-neutral-900 sm:to-black flex justify-center items-center font-sans antialiased">
      
      {/* Contenedor "Mobile" - En PC parecerá un teléfono elegante, en celular ocupará todo */}
      <div className="relative w-full max-w-md min-h-screen sm:min-h-212.5 sm:max-h-225 sm:rounded-[40px] sm:border-8 sm:border-neutral-800 sm:shadow-2xl bg-[#F40009] flex flex-col justify-between overflow-hidden shadow-red-600/10">
        
        {/* Ola dinámica de fondo (Efecto Coca-Cola) */}
        <div className="absolute inset-0 bg-wave pointer-events-none opacity-40"></div>

        {/* Bloque Superior: Branding */}
        <div className="relative z-10 px-8 pt-16 text-center">
          <div className="inline-block bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 border border-white/10">
            Torneo Oficial
          </div>
          
          {/* Título usando la tipografía Loki Cola */}
          <h1 className="text-white text-6xl font-coca tracking-normal leading-none drop-shadow-md select-none">
            Coca Champions
          </h1>
          
          <p className="text-red-100 text-xs font-bold tracking-widest uppercase mt-4 opacity-80">
            Control de Jugadores y Equipos
          </p>
        </div>

        {/* Bloque Central: Formulario Líquido (Sin tarjetas blancas genéricas) */}
        <div className="relative z-10 px-8 w-full">
          
          {error && (
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-red-500/30 text-red-200 p-3.5 rounded-2xl text-xs font-bold mb-4 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-[#F40009] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input Email */}
            <div className="space-y-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/50">
                  <Mail className="w-4 h-4" />
                </span>
                <input 
                  type="email"
                  required
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3.5 bg-black/20 hover:bg-black/30 text-white placeholder-white/50 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all text-base backdrop-blur-xs font-medium"
                  placeholder="Usuario administrador"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Input Contraseña */}
            <div className="space-y-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-white/50">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  type="password"
                  required
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3.5 bg-black/20 hover:bg-black/30 text-white placeholder-white/50 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all text-base backdrop-blur-xs font-medium"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Botón de acción sólido, redondo e imponente */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-neutral-100 text-[#F40009] font-black py-4 rounded-2xl transition-all uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 text-sm cursor-pointer active:scale-[0.97]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#F40009] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4 stroke-3" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Bloque Inferior: Footer integrado */}
        <div className="relative z-10 p-6 text-center text-[10px] text-red-200/60 font-bold tracking-wider uppercase">
          Reconéctate con el Juego &copy; 2026
        </div>

      </div>
    </div>
  );
}
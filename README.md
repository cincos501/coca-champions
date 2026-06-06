# 🏆 Coca-Cola Champions — Sistema de Gestión en Tiempo Real (Jornada Doble)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

Plataforma web automatizada **Mobile-First** diseñada para la gestión, control y consulta del torneo relámpago de fútbol interno corporativo de Coca-Cola. El sistema implementa una arquitectura moderna de software orientada a servicios, optimizada para un flujo masivo de consultas desde dispositivos móviles (WhatsApp).

🚀 **Link del Proyecto en Vivo:** [coca-champions.vercel.app](https://your-link.vercel.app)

---

## 📸 Vista Previa del Sistema

<div align="center">
  <img src="./screenshots/login.png" width="30%" alt="Login Corporativo" />
  <img src="./screenshots/admin.png" width="30%" alt="Mesa de Control" />
  <img src="./screenshots/public.png" width="30%" alt="Vista Pública Jugadores" />
</div>

---

## 💡 Desafío de Negocio y Lógica del Torneo

El torneo corporativo opera bajo un formato dinámico de **Doble Jornada (Sábado y Domingo)** con un sistema de emparejamiento aleatorio por sorteo:
1. **Inscripción Individual e Imparcial:** Los colaboradores se registran de forma individual y el azar define los equpos (máximo 6 integrantes por equipo).
2. **Revancha de Doble Oportunidad:** Los jugadores eliminados en la jornada del Sábado tienen permitido reincorporarse a nuevos equipos creadas para el Domingo, requiriendo un sistema capaz de manejar **historiales multi-equipo** en paralelo sin corromper las bases de datos de la clasificatoria previa.

---

## 🏗️ Arquitectura de Software e Infraestructura

Para garantizar un sistema escalable, mantenible y robusto, el frontend se desacopló por completo de la base de datos mediante una arquitectura estructurada en capas:

```text
src/
├── types/       # Contratos e Interfaces estrictas de TypeScript (Moldes de Datos)
├── services/    # Capa de Abstracción de Datos (Aislación completa de Firebase)
├── pages/       # Vistas de Usuario unificadas (Evitando la sobre-componentización)
└── firebase.ts  # Inicialización segura de módulos de Google Cloud
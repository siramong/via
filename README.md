# via

**Via** es una aplicación móvil privada para buscar, visualizar y contribuir información sobre estaciones de servicio (precios, fotos y detalles). Este repositorio contiene la app (React Native + TypeScript) y los servicios asociados. No es open source, así que no hay pasos de replicación públicos.

## Estado
- Privado — no compartir ni clonar sin autorización.

## Tecnologías
- Expo / React Native
- TypeScript
- Supabase (backend / autenticación)
- Servicios: OCR, geolocalización, pricing

## Características principales
- Búsqueda y mapa de estaciones cercanas
- Visualización de precios por combustible
- Contribuciones de usuarios: fotos, precios y detalles
- OCR para leer tickets/imágenes (módulo `ocr.ts`)

## Estructura del proyecto (resumen)
- `App.tsx`, `index.ts` — entrada de la app
- `src/components/` — componentes UI (mapa, tarjetas, sheets)
- `src/screens/` — pantallas principales
- `src/services/` — integraciones (supabase, OCR, pricing)
- `assets/` — iconos y gráficos usados en la app

## Assets incluidos
Se detectaron los siguientes assets en `assets/` y se pueden usar para previsualización:

- `assets/icon.png`
- `assets/splash-icon.png`

Preview:

![App icon](assets/icon.png)

![Splash icon](assets/splash-icon.png)

## Notas rápidas para mantenedores
- Este repositorio está pensado para uso privado y desarrollo interno.
- Si necesitas ejecutar o probar localmente, pide acceso a quienes administran el proyecto para instrucciones privadas.

## Contacto
Para dudas o permiso de acceso, contacta al equipo interno responsable del proyecto.

---

Archivo generado automáticamente: README enfocado en presentación y referencia rápida.

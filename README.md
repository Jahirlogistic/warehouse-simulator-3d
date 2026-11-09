# WAREHOUSE SIMULATOR 3D — Fase 1 (prototipo de fundación)

Prototipo inicial de un centro de distribución multiproducto para formación logística. Incluye escenario 3D procedural, montacargas visual, conducción básica, cámaras, elevación de horquillas, interacción de recogida/deposito de pallets, telemetría y controles táctiles.

> Alcance honesto: esta entrega es una base jugable de Fase 1. Todavía NO implementa un WMS real, persistencia, inventario transaccional, rutas optimizadas, evaluación académica ni física industrial validada. El movimiento usa límites y comprobaciones simplificadas; Rapier está declarado como dependencia para la siguiente iteración de física, pero aún no está conectado al ciclo de simulación.

## Requisitos
- Node.js 20.19+ o 22.12+
- npm 10+

## Ejecutar
```bash
npm install
npm run dev
```
Abrir la URL local que indique Vite (normalmente `http://localhost:5173`).

## Compilar y verificar tipos
```bash
npm run typecheck
npm run build
```

## Controles PC
- W / S: avanzar y retroceder
- A / D: girar
- Espacio: frenar
- R / F: subir y bajar horquillas
- Q / Z: inclinar mástil
- E: recoger o depositar pallet cercano
- C: cambiar cámara

En móvil aparecen controles táctiles sobre el escenario.

## Arquitectura prevista
- `src/game`: escena, entidades y simulación 3D.
- `src/store`: estado compartido de telemetría y sesión.
- `src/components`: controles reutilizables.
- `src/styles.css`: interfaz responsive.

## Siguiente hito (Fase 2)
1. Conectar Rapier 3D para cuerpos, colliders, detección de contactos y límites de carga.
2. Implementar mástil telescópico y carro portahorquillas con restricciones.
3. Definir geometría de pallet y puntos de acoplamiento robustos.
4. Añadir pruebas automatizadas de interacción, colisiones y regresión.
5. No integrar procesos WMS hasta estabilizar las interacciones físicas.

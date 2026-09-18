# Validación técnica — Versión 4

Fecha: 18/09/2026

## Controles ejecutados

- sintaxis de `app.js`, `model.js`, `api.js` y `server.mjs`;
- arranque lógico de la SPA mediante DOM de prueba;
- 70 centros de costo;
- 33 nodos organizacionales DGA–OPP;
- 124+ perfiles funcionales dentro del alcance GdR;
- perfiles Administrador, Director, OPP, unidad, área, subárea y servidor;
- jerarquía y permisos por ámbito;
- asistencia diaria y resumen mensual;
- mesa individual de trabajo;
- plantillas documentales por naturaleza del puesto;
- centro documental y flujo de revisión/firma/derivación;
- presupuesto institucional;
- modelo detallado por centro de costo;
- clasificadores/líneas económicas de trabajo;
- recomendación de fuentes de financiamiento;
- escenario origen–destino antes/después;
- inversiones físico-financieras;
- búsqueda global;
- asistente contextual y dashboard desde consulta;
- centro de reportes;
- contrato OpenAPI v4.

## Pruebas

```bash
npm run check
npm test
```

Resultado:

```text
Smoke tests v4: OK
```

## Límite de integración

La versión mantiene datos de trabajo y adaptadores locales. Una puesta en producción debe validar credenciales, permisos, frecuencia y mecanismo de interoperabilidad con cada sistema institucional/oficial antes de sustituir las fuentes locales.

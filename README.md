# Sistema Integrado de Gestión DGA–OPP UNT — Versión 4

Aplicación web institucional orientada a integrar operación, personas, procesos, documentos, planeamiento, presupuesto, inversiones y analítica de la Dirección General de Administración y la Oficina de Planeamiento y Presupuesto de la Universidad Nacional de Trujillo.

## Experiencia de navegación

La plataforma se organiza como una estructura navegable e interrelacionada:

```text
DGA / OPP
→ unidad
→ área
→ subárea
→ responsable
→ servidor
→ meta/producto
→ tarea
→ documento/expediente/evidencia
```

Y, desde la perspectiva presupuestaria:

```text
centro de costo
→ fuente/rubro
→ clasificación económica
→ PIA/PIM
→ certificación
→ compromiso
→ devengado
→ pago
→ proyección
→ actividad POI
→ unidad / inversión / contratación / tarea
```

Los indicadores, gráficos, tablas y tarjetas principales permiten profundizar, abrir el objeto relacionado o maximizar el panel.

## Jerarquía y permisos

- **Administrador General:** lectura integral DGA–OPP.
- **Director DGA:** conducción integral y navegación ejecutiva.
- **Jefe OPP:** OPP y sus unidades, planeamiento y presupuesto.
- **Jefatura de unidad:** unidad y dependencias bajo su cargo.
- **Responsable de área o subárea:** equipo y operación de su ámbito.
- **Servidor:** mesa de trabajo personal con tareas, metas, asistencia, documentos, agenda y reportes.

La futura puesta en producción debe aplicar RBAC/ABAC institucional, mínimo privilegio y controles adicionales para información especialmente protegida.

## Organización y GdR

La estructura funcional DGA–OPP, responsables, puestos, metas, productos, evidencias y plazos se construyó a partir de los formatos de Gestión del Rendimiento DGA–OPP UNT 2026 proporcionados para el proyecto.

La relación funcional usada por la aplicación contiene:

- 33 nodos organizacionales DGA–OPP;
- 124 servidores evaluados en los archivos de alcance;
- responsables/jefaturas derivados de la relación de evaluación;
- metas, productos, evidencias y plazos utilizados para construir la mesa de trabajo individual;
- más de 5 000 registros diarios de asistencia de trabajo para permitir navegación mensual y diaria.

No se incorporan DNI, teléfonos personales, cuentas bancarias, diagnósticos de salud ni contenido reservado de PAD.

## Mesa de trabajo del servidor

Cada servidor puede navegar o accionar:

- resumen de responsabilidades y metas;
- tareas y productos GdR;
- calendario de asistencia día por día;
- agenda y vencimientos;
- documentos relacionados;
- elaboración de documentos desde plantillas según la naturaleza del puesto;
- edición en línea;
- guardado local;
- descarga compatible con Word;
- impresión / PDF;
- envío a revisión;
- solicitud de firma;
- firma como acción de flujo para perfiles autorizados;
- preparación de registro/derivación SGDUNT;
- generación de reportes.

Las acciones de firma y SGDUNT representan el flujo funcional. En producción deben conectarse con los mecanismos institucionales/autorizados y no inventan registros oficiales.

## Presupuesto y centros de costo

La vista institucional incorpora los 70 centros de costo de la relación POI–PIA utilizada para el proyecto.

Cada centro puede abrirse y mostrar:

- PIA y PIM;
- certificación;
- compromiso;
- devengado;
- pago;
- proyección de cierre;
- saldo aparente;
- obligaciones proyectadas;
- margen potencialmente evaluable;
- fuente/rubro de trabajo;
- clasificadores económicos;
- desglose económico de trabajo;
- actividades POI vinculadas;
- riesgo;
- alternativas de financiamiento.

La plataforma mantiene separadas las nociones de **unidad orgánica**, **centro de costo POI/CEPLAN** y **codificación de otros sistemas como SIGA**.

## Laboratorio financiero

Permite responder preguntas del tipo:

- ¿Qué pasa si priorizo esta inversión?
- ¿Dónde existe margen potencial para financiar una necesidad?
- ¿Qué se afectaría si retiro recursos de este centro?
- ¿Qué alternativa tiene menor impacto operativo?
- ¿Qué línea económica del origen concentra el margen evaluable?
- ¿Qué actividades POI del origen requieren protección?

El motor calcula escenarios antes/después, ranking de fuentes, compatibilidad, riesgo, impacto POI y procedimiento.

Principio:

```text
SIMULAR ≠ APROBAR ≠ REGISTRAR EN SIAF-SP
```

El centro de costo se usa como una vista gerencial de análisis. Una modificación formal debe validarse sobre la estructura presupuestaria, fuente/rubro, clasificadores, metas y nivel de modificación que correspondan.

## Normativa presupuestaria modelada

El motor de reglas toma como referencias principales:

- Decreto Legislativo N.° 1440;
- Directiva N.° 0001-2024-EF/50.01 y su modificación por R.D. N.° 0004-2026-EF/50.01;
- R.D. N.° 0007-2026-EF/50.01 para modificaciones vinculadas con inversiones y programas durante 2026;
- R.D. N.° 0021-2025-EF/50.01, que aprueba los clasificadores presupuestarios del Año Fiscal 2026;
- normativa de Invierte.pe;
- marco vigente de contratación pública;
- normativa de Gobierno Digital y protección de datos;
- Norma Técnica N.° 002-2025-PCM/SGP para Gestión por Procesos;
- normativa del Subsistema de Gestión del Rendimiento.

Las reglas se diseñan para ser versionables por ejercicio fiscal. La implementación institucional debe sincronizar la versión normativa y los clasificadores oficiales vigentes.

## Inversiones

La cartera integra:

- CUI;
- PIM;
- avance físico;
- avance financiero;
- avance temporal;
- avance contractual;
- brecha;
- hitos;
- riesgo;
- fuentes potenciales de financiamiento;
- navegación al Laboratorio financiero.

## Asistente Institucional

El asistente trabaja con el ámbito del usuario y el módulo abierto. Puede:

- responder sobre personas, áreas, centros de costo, inversión, contratación, documento o expediente;
- calcular escenarios;
- explicar por qué el procedimiento se modela de determinada manera;
- mostrar fecha de corte de las fuentes utilizadas;
- recomendar revisiones y acciones;
- abrir el módulo relacionado;
- responder a “llévame a ello” conservando contexto;
- generar un dashboard contextual con KPI, gráfico, tabla, explicación y recomendaciones.

La IA se ubica sobre datos, cálculos y reglas. No reemplaza la validación de la autoridad competente ni el registro en sistemas oficiales.

## Reportes

Incluye centro de reportes para:

- reporte ejecutivo DGA–OPP;
- presupuesto por centro de costo;
- asistencia;
- GdR;
- inversiones;
- contrataciones;
- documentos y expedientes.

Los reportes pueden imprimirse / guardarse como PDF y exportarse a CSV cuando corresponda.

## Identidad UNT

La interfaz utiliza la paleta institucional definida para el proyecto:

- Azul `#12377B`
- Dorado `#E6AD09`
- Amarillo `#FDF107`
- Rojo `#D8261A`
- Verde `#0C8F3D`
- Gris `#373435`
- Blanco `#FEFEFE`
- Negro `#1E1A17`

## GitHub Pages

La SPA no requiere compilación.

1. Reemplace el contenido visible del repositorio por el contenido de esta carpeta.
2. Conserve la carpeta oculta `.git` cuando actualice un repositorio existente.
3. En GitHub Desktop revise los cambios.
4. Commit a `main`.
5. `Push origin`.
6. Si se crea un repositorio nuevo: **Settings → Pages → Deploy from a branch → main → /(root)**.

## API local opcional

```bash
npm run api
```

Servicio:

`http://localhost:8787/api/v1`

Contrato:

`api/openapi.yaml`

## Validación

```bash
npm run check
npm test
```

Resultado esperado:

```text
Smoke tests v4: OK
```

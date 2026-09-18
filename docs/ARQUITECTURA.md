# Arquitectura funcional — Sistema Integrado de Gestión DGA–OPP UNT v4

## Propósito

La plataforma se plantea como una capa integrada de operación, seguimiento, control, analítica y decisión. No reemplaza por defecto los sistemas oficiales; transforma sus datos y productos en gestión institucional.

```text
SIAF-SP / Operaciones en Línea
SIGA
SGDUNT
Invierte.pe / SSI
CEPLAN
SEACE / Pladicop
AIRHSP y fuentes autorizadas de RR. HH.
Fuentes institucionales UNT
            ↓
 integración / sincronización / carga controlada
            ↓
 modelo institucional unificado
            ↓
 reglas determinísticas + workflow + permisos + auditoría
            ↓
 cálculo + proyección + simulación + optimización
            ↓
 dashboards + alertas + reportes
            ↓
 asistente institucional contextual
            ↓
 Dirección / OPP / jefaturas / responsables / servidores
```

## Capas

1. Organización, roles y permisos.
2. Procesos y productos.
3. Operación, tareas, Gantt y eventos.
4. Personas, asistencia y GdR.
5. Documentos, expedientes, evidencias y firma.
6. Planeamiento, POI y presupuesto.
7. Abastecimiento, contratos, patrimonio, tesorería y contabilidad.
8. Inversiones físico-financieras.
9. Riesgos, controles, calidad e indicadores.
10. Analítica, simulación y asistente IA.

## Interactividad

Todo objeto relevante tiene identidad y relación con otros objetos. La navegación objetivo es bidireccional:

```text
indicador → centro → actividad → responsable → tarea → documento
```

y también:

```text
servidor → tarea → producto → proceso → POI → presupuesto → resultado
```

Los paneles principales pueden maximizarse, imprimirse o abrir un detalle relacionado.

## Presupuesto

El centro de costo es una vista gerencial. El motor no presupone que mover recursos entre dos centros equivale por sí mismo a una nota modificatoria válida.

Cada escenario debe evaluar:

- estructura presupuestaria;
- fuente y rubro;
- clasificación económica;
- certificaciones;
- compromisos;
- obligaciones futuras;
- contratos;
- planillas;
- POI;
- inversiones;
- nivel y tipo de modificación;
- restricción/competencia aplicable.

La simulación es separada de la aprobación y del registro formal.

## Documentos

La mesa documental modela:

```text
elaboración → revisión → observación/conformidad → aprobación → firma → registro/derivación → seguimiento → evidencia
```

La firma real debe utilizar infraestructura y mecanismos autorizados. El registro/derivación real debe conectarse con SGDUNT o el procedimiento institucional que se defina.

## Inteligencia artificial

```text
dato autorizado
→ cálculo determinístico
→ regla
→ impacto
→ explicación/recomendación IA
→ decisión humana
```

El asistente recibe contexto de:

- usuario y rol;
- ámbito jerárquico;
- módulo abierto;
- objeto seleccionado;
- fecha de actualización por fuente;
- consulta previa cuando el usuario pide “llévame a ello”.

## Privacidad

El modelo separa visibilidad de gestión y acceso al contenido. Las vistas ejecutivas pueden mostrar estado, cantidad, riesgo o plazo sin exponer contenido reservado de PAD, salud, legajos, planillas individuales u otros datos protegidos.

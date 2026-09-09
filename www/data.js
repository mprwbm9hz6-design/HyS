// ============================================================
// ESTRUCTURA DEL CHECKLIST — misma información que GeneradorInformeHyS.gs
// ============================================================

const ESTADOS = ['CONFORME', 'NO CONFORME', 'OBSERVACIÓN / MEJORA', 'NO APLICA', 'NO SE PUDO VERIFICAR'];
const ESTADOS_QUE_GENERAN_CITA = ['NO CONFORME', 'OBSERVACIÓN / MEJORA', 'NO SE PUDO VERIFICAR'];
const CANTIDAD_HALLAZGOS = 15;

const ESTRUCTURA = [
  {
    id: 'sec2', seccion: '2. DOCUMENTACIÓN DE HIGIENE Y SEGURIDAD',
    normaDefault: 'Ley 19.587, art. 5 y 9 - Decreto 1338/96 - Res. SRT 905/15',
    items: [
      'Servicio de Higiene y Seguridad',
      'Identificación de peligros / evaluación de riesgos',
      'Medidas preventivas documentadas',
      'Programa de capacitación',
      'Registros de capacitación',
      'Inspecciones periódicas documentadas',
      'Registros de entrega de EPP',
      'Documentación de emergencias',
      'Documentación de instalaciones / mantenimiento'
    ],
    condicional: false
  },
  {
    id: 'sec3', seccion: '3. PROTECCIÓN CONTRA INCENDIOS',
    normaDefault: 'Decreto 351/79 - Anexo VII (Protección contra incendios)',
    items: [
      'Extintores correctamente ubicados',
      'Extintores correctamente señalizados',
      'Extintores accesibles y sin obstrucciones',
      'Extintores con carga / mantenimiento vigente',
      'Tipo de extintor adecuado al riesgo',
      'Cantidad de extintores aparentemente suficiente',
      'Luces de emergencia',
      'Señalización de salidas',
      'Plan de emergencia / evacuación',
      'Vías de evacuación despejadas',
      'Puertas y salidas de emergencia operativas'
    ],
    condicional: false
  },
  {
    id: 'sec4', seccion: '4. INSTALACIÓN ELÉCTRICA',
    normaDefault: 'Decreto 351/79 - Anexo VI (Instalaciones eléctricas) - Reglamentación AEA',
    items: [
      'Tableros eléctricos correctamente protegidos',
      'Tableros identificados',
      'Tableros con acceso libre',
      'Existencia de tapas y protecciones',
      'Tomacorrientes en buen estado',
      'Cables y conductores sin daños visibles',
      'Ausencia de conexiones precarias',
      'Prolongadores / zapatillas en condiciones',
      'Puesta a tierra / protección correspondiente',
      'Equipos eléctricos correctamente conectados'
    ],
    condicional: false
  },
  {
    id: 'sec5', seccion: '5. GAS Y FUENTES DE CALOR',
    normaDefault: 'Decreto 351/79 - Anexo I - Reglamentación de instalaciones de gas (Ente regulador / NAG-200)',
    items: [
      'Instalación de gas aparentemente en condiciones',
      'Llaves de paso accesibles e identificadas',
      'Ausencia de pérdidas / olor a gas',
      'Mangueras y conexiones en condiciones',
      'Ventilación adecuada',
      'Artefactos correctamente instalados',
      'Quemadores en condiciones',
      'Hornos en condiciones',
      'Elementos combustibles alejados de fuentes de calor'
    ],
    condicional: false
  },
  {
    id: 'sec6', seccion: '6. COCINA Y EQUIPAMIENTO',
    normaDefault: 'Decreto 351/79 - Anexo I, Título III (Aparatos, máquinas y herramientas)',
    items: [
      'Equipos y máquinas en buen estado',
      'Protecciones de máquinas presentes',
      'Partes móviles protegidas',
      'Equipos correctamente ubicados',
      'Ausencia de riesgos de atrapamiento',
      'Cuchillos y elementos cortantes correctamente almacenados',
      'Equipos calientes señalizados / protegidos',
      'Mantenimiento de equipos'
    ],
    condicional: false
  },
  {
    id: 'sec7', seccion: '7. CAMPANAS, EXTRACCIÓN Y VENTILACIÓN',
    normaDefault: 'Decreto 351/79 - Anexo I (Ventilación de los ambientes de trabajo)',
    items: [
      'Campana de extracción en condiciones',
      'Sistema de extracción operativo',
      'Filtros en condiciones',
      'Filtros con mantenimiento / limpieza adecuada',
      'Conductos aparentemente en condiciones',
      'Ventilación general suficiente',
      'Ausencia de acumulación excesiva de grasa'
    ],
    condicional: false
  },
  {
    id: 'sec8', seccion: '8. PRODUCTOS QUÍMICOS',
    normaDefault: 'Res. SRT 295/03 - Anexo III (Contaminación ambiental / sustancias químicas)',
    items: [
      'Productos químicos correctamente identificados',
      'Envases originales o correctamente rotulados',
      'Productos químicos almacenados correctamente',
      'Productos incompatibles separados',
      'Ausencia de productos químicos junto a alimentos',
      'Hojas de seguridad disponibles cuando corresponda',
      'Elementos de protección adecuados para manipulación',
      'Ausencia de envases reutilizados para productos químicos'
    ],
    condicional: false
  },
  {
    id: 'sec9', seccion: '9. ORDEN Y LIMPIEZA',
    normaDefault: 'Decreto 351/79 - Anexo I (Disposiciones generales - orden y limpieza)',
    items: [
      'Pisos limpios y en condiciones',
      'Pisos sin obstáculos',
      'Pasillos despejados',
      'Sectores de trabajo ordenados',
      'Depósitos ordenados',
      'Materiales correctamente almacenados',
      'Ausencia de acumulación innecesaria de materiales',
      'Residuos correctamente almacenados',
      'Contenedores adecuados'
    ],
    condicional: false
  },
  {
    id: 'sec10', seccion: '10. PUESTOS DE TRABAJO',
    normaDefault: 'Decreto 351/79 - Anexo I - Res. SRT 295/03 Anexo I (Ergonomía)',
    items: [
      'Espacio de trabajo suficiente',
      'Superficies de trabajo adecuadas',
      'Circulación segura',
      'Iluminación adecuada',
      'Ventilación adecuada',
      'Temperatura ambiental aceptable',
      'Ausencia de riesgos evidentes para los trabajadores',
      'Herramientas adecuadas para las tareas'
    ],
    condicional: false
  },
  {
    id: 'sec11', seccion: '11. ELEMENTOS DE PROTECCIÓN PERSONAL',
    normaDefault: 'Ley 19.587, art. 9 inc. b) - Decreto 351/79',
    items: [
      'Se identificaron los EPP necesarios',
      'Los trabajadores disponen de EPP',
      'Los EPP se encuentran en buen estado',
      'Los EPP son adecuados para el riesgo',
      'Se realiza entrega documentada',
      'Se capacita sobre su utilización',
      'Se controla su uso'
    ],
    condicional: false
  },
  {
    id: 'sec12a', seccion: '12A. RELEVAMIENTO ERGONÓMICO',
    normaDefault: 'Res. SRT 295/03 - Anexo I (Ergonomía)',
    items: [
      'Alturas de trabajo adecuadas',
      'Posturas de trabajo aceptables',
      'Se minimizan movimientos repetitivos',
      'Manipulación manual de cargas controlada',
      'Carros / medios auxiliares disponibles cuando corresponde',
      'Organización del trabajo adecuada'
    ],
    condicional: true,
    preguntaCorresponde: '¿Corresponde realizar el relevamiento de ergonomía en esta visita?'
  },
  {
    id: 'sec13a', seccion: '13A. RELEVAMIENTO DE MANIPULACIÓN E HIGIENE DE ALIMENTOS',
    normaDefault: 'Código Alimentario Argentino (CAA) - Cap. II (Condiciones generales de establecimientos)',
    items: [
      'Manipuladores mantienen adecuada higiene personal',
      'Lavado de manos disponible y adecuado',
      'Superficies en contacto con alimentos en condiciones higiénicas',
      'Separación adecuada entre alimentos crudos y cocidos',
      'Alimentos almacenados correctamente',
      'Equipos de refrigeración en condiciones',
      'Control de temperaturas cuando corresponde',
      'Productos correctamente identificados / rotulados cuando corresponde',
      'Elementos de limpieza separados de alimentos',
      'Residuos gestionados adecuadamente',
      'Se observan prácticas adecuadas de manipulación'
    ],
    condicional: true,
    preguntaCorresponde: '¿Corresponde realizar el relevamiento de manipulación e higiene de alimentos en esta visita?'
  }
];

const CAMPOS_GENERALES = [
  { id: 'razonSocial', label: 'Nombre / Razón social', tipo: 'text', requerido: true },
  { id: 'nombreComercial', label: 'Nombre comercial', tipo: 'text' },
  { id: 'cuit', label: 'CUIT', tipo: 'text' },
  { id: 'domicilio', label: 'Domicilio', tipo: 'text' },
  { id: 'localidad', label: 'Localidad', tipo: 'text' },
  { id: 'fechaInspeccion', label: 'Fecha de inspección', tipo: 'date', requerido: true },
  { id: 'profesionalActuante', label: 'Profesional actuante', tipo: 'text' },
  { id: 'responsablePresente', label: 'Responsable presente durante la visita', tipo: 'text' },
  { id: 'cantidadTrabajadores', label: 'Cantidad aproximada de trabajadores', tipo: 'text' },
  { id: 'actividadPrincipal', label: 'Actividad principal', tipo: 'text' }
];

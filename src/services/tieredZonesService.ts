export interface Macrozona {
  id: string;
  name: string;
  shortLabel: string;
}

export interface CityConfig {
  id: string;
  name: string;
  hasMacrozones: boolean;
  department?: string;
  macroZones?: Macrozona[];
}

export interface RegionalNode {
  id: string;
  name: string;
  shortLabel: string;
  citiesIncluded: string;
}

export const REGIONAL_NODES: RegionalNode[] = [
  { id: 'BOG_METRO', name: 'Bogotá & Sabana', shortLabel: 'Bogotá & Sabana', citiesIncluded: 'Bogotá, Chía, Sopó, Anapoima, Girardot' },
  { id: 'MED_METRO', name: 'Medellín & Aburrá', shortLabel: 'Medellín & Aburrá', citiesIncluded: 'Medellín, Envigado, Rionegro, Guatapé' },
  { id: 'BOY_CENTRO', name: 'Boyacá Central', shortLabel: 'Boyacá Central', citiesIncluded: 'Tunja, Duitama, Sogamoso, Paipa, Villa de Leyva' },
  { id: 'CARIBE_GOLD', name: 'Costa Caribe', shortLabel: 'Costa Caribe', citiesIncluded: 'Cartagena, Barranquilla, Santa Marta, San Andrés' },
  { id: 'EJE_CAFETERO', name: 'Eje Cafetero', shortLabel: 'Eje Cafetero', citiesIncluded: 'Pereira, Manizales, Armenia' },
  { id: 'PACIFICO_CALI', name: 'Pacífico & Cali', shortLabel: 'Pacífico & Cali', citiesIncluded: 'Cali, Roldanillo, Lago Calima' },
  { id: 'ORIENTE_SANTANDER', name: 'Santanderes & Llanos', shortLabel: 'Santanderes & Llanos', citiesIncluded: 'Bucaramanga, Cúcuta, Villavicencio, Montería' }
];

export const COLOMBIA_BASE_CITIES: CityConfig[] = [
  {
    id: 'bogota',
    name: 'Bogotá D.C.',
    hasMacrozones: true,
    department: 'Cundinamarca',
    macroZones: [
      { id: 'bog_all', name: 'Toda Bogotá', shortLabel: 'Toda Bogotá' },
      { id: 'bog_norte', name: 'Zona Norte (Chicó, Usaquén, Rosales)', shortLabel: 'Zona Norte' },
      { id: 'bog_occidente', name: 'Zona Occidente / Salitre', shortLabel: 'Zona Occidente' },
      { id: 'bog_centro', name: 'Zona Centro / Chapinero', shortLabel: 'Zona Centro' },
      { id: 'bog_sur', name: 'Zona Sur / Soacha', shortLabel: 'Zona Sur' }
    ]
  },
  {
    id: 'medellin',
    name: 'Medellín / Aburrá',
    hasMacrozones: true,
    department: 'Antioquia',
    macroZones: [
      { id: 'med_all', name: 'Toda Medellín', shortLabel: 'Toda Medellín' },
      { id: 'med_sur', name: 'Zona Sur (El Poblado, Envigado)', shortLabel: 'Zona Sur (Poblado)' },
      { id: 'med_occidente', name: 'Zona Occidente (Laureles)', shortLabel: 'Zona Occidente' },
      { id: 'med_oriente', name: 'Oriente / Llanogrande / Rionegro', shortLabel: 'Llanogrande / Rionegro' }
    ]
  },
  {
    id: 'cali',
    name: 'Cali / Valle',
    hasMacrozones: true,
    department: 'Valle del Cauca',
    macroZones: [
      { id: 'cal_all', name: 'Toda Cali', shortLabel: 'Toda Cali' },
      { id: 'cal_sur', name: 'Zona Sur (Ciudad Jardín, Pance)', shortLabel: 'Zona Sur' },
      { id: 'cal_norte', name: 'Zona Norte / Granada', shortLabel: 'Zona Norte' },
      { id: 'cal_yumbo', name: 'Dapa / Jamundí / Rozo', shortLabel: 'Corredor Campestre' }
    ]
  },
  {
    id: 'barranquilla',
    name: 'Barranquilla',
    hasMacrozones: true,
    department: 'Atlántico',
    macroZones: [
      { id: 'baq_all', name: 'Toda Barranquilla', shortLabel: 'Toda Barranquilla' },
      { id: 'baq_norte', name: 'Zona Norte (Alto Prado)', shortLabel: 'Zona Norte' }
    ]
  },
  {
    id: 'bucaramanga',
    name: 'Bucaramanga',
    hasMacrozones: true,
    department: 'Santander',
    macroZones: [
      { id: 'bga_all', name: 'Toda Bucaramanga', shortLabel: 'Toda Bucaramanga' },
      { id: 'bga_cabecera', name: 'Cabecera / Cañaveral / Floridablanca', shortLabel: 'Cabecera / Cañaveral' }
    ]
  },
  {
    id: 'eje_cafetero',
    name: 'Eje Cafetero (Pereira / Manizales / Armenia)',
    hasMacrozones: false,
    department: 'Risaralda / Caldas / Quindío'
  },
  // Small cities & municipalities (NO macrozones)
  { id: 'anapoima', name: 'Anapoima', hasMacrozones: false, department: 'Cundinamarca' },
  { id: 'girardot', name: 'Girardot', hasMacrozones: false, department: 'Cundinamarca' },
  { id: 'melgar', name: 'Melgar', hasMacrozones: false, department: 'Tolima' },
  { id: 'villa_leyva', name: 'Villa de Leyva', hasMacrozones: false, department: 'Boyacá' },
  { id: 'sopo', name: 'Sopó', hasMacrozones: false, department: 'Cundinamarca' },
  { id: 'chia', name: 'Chía', hasMacrozones: false, department: 'Cundinamarca' },
  { id: 'lago_calima', name: 'Lago Calima / Darién', hasMacrozones: false, department: 'Valle del Cauca' },
  { id: 'guatape', name: 'Guatapé', hasMacrozones: false, department: 'Antioquia' },
  { id: 'cartagena', name: 'Cartagena', hasMacrozones: false, department: 'Bolívar' },
  { id: 'santa_marta', name: 'Santa Marta', hasMacrozones: false, department: 'Magdalena' },
  { id: 'san_andres', name: 'San Andrés Islas', hasMacrozones: false, department: 'San Andrés' },
  { id: 'villavicencio', name: 'Villavicencio', hasMacrozones: false, department: 'Meta' },
  { id: 'ibague', name: 'Ibagué', hasMacrozones: false, department: 'Tolima' },
  { id: 'cucuta', name: 'Cúcuta', hasMacrozones: false, department: 'Norte de Santander' },
  { id: 'monteria', name: 'Montería', hasMacrozones: false, department: 'Córdoba' },
  { id: 'roldanillo', name: 'Roldanillo', hasMacrozones: false, department: 'Valle del Cauca' }
];

export function getZoneNameById(id: string): string {
  if (id === 'all_colombia') return 'Toda Colombia';
  if (id.startsWith('custom_')) {
    const rawName = id.replace('custom_', '').replace(/_/g, ' ');
    return rawName.charAt(0).toUpperCase() + rawName.slice(1);
  }
  for (const city of COLOMBIA_BASE_CITIES) {
    if (city.id === id) return city.name;
    if (city.macroZones) {
      for (const mz of city.macroZones) {
        if (mz.id === id) return `${city.name} • ${mz.shortLabel}`;
      }
    }
  }
  return id;
}

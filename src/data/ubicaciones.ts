export interface Departamento {
  nombre: string
  ciudades: Ciudad[]
}

export interface Ciudad {
  nombre: string
  barrios: string[]
}

export interface Pais {
  nombre: string
  departamentos: Departamento[]
}

export const PAISES: Pais[] = [
  {
    nombre: 'Nicaragua',
    departamentos: [
      {
        nombre: 'Managua',
        ciudades: [
          {
            nombre: 'Managua',
            barrios: ['Los Robles', 'Altamira', 'Las Colinas', 'Bello Horizonte', 'Bolonia', 'Monserrat', 'Santo Domingo', 'Ciudad Jardín', 'Las Palmas', 'Linda Vista', 'San Judas', 'El Recreo', 'Villa Fontana', 'Residencial El Dorado', 'Lomas de Guadalupe', 'Centro Histórico', 'Barrio Martha Quezada', 'Barrio San Miguel', 'Barrio Miralagos', 'Barrio La Luz'],
          },
          {
            nombre: 'Mateare',
            barrios: ['Barrio El Centro', 'Barrio Nuevo', 'Barrio San José', 'La Sabana', 'Los Laureles', 'Villa Soñadora'],
          },
          {
            nombre: 'Tipitapa',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Miguel', 'Los Ángeles', 'La Fuente', 'Villa Los Cipreses'],
          },
          {
            nombre: 'Ciudad Sandino',
            barrios: ['Barrio 14 de Julio', 'Barrio Hugo Chávez', 'Barrio Leonel Rugama', 'Villa El Carmen', 'Los Brasiles'],
          },
        ],
      },
      {
        nombre: 'León',
        ciudades: [
          {
            nombre: 'León',
            barrios: ['Barrio El Laborío', 'Barrio San Juan', 'Barrio San Felipe', 'Barrio El Coyolar', 'Barrio Sutiava', 'Barrio Zaragoza', 'Barrio La Sabaneta', 'Barrio El Callejón', 'Colonia 10 de Junio', 'Colonia San José', 'Residencial Las Colinas', 'Residencial La Fuente', 'Villa Nueva', 'Los Laureles', 'Barrio El Sagrario'],
          },
          {
            nombre: 'Nagarote',
            barrios: ['Barrio El Centro', 'Barrio San Antonio', 'Barrio El Calvario', 'Los Laureles', 'Colonia Nueva', 'Las Palmeras'],
          },
          {
            nombre: 'La Paz Centro',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio El Carmen', 'Colonia 20 de Julio', 'Los Mangos'],
          },
          {
            nombre: 'Telica',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Ángeles'],
          },
        ],
      },
      {
        nombre: 'Masaya',
        ciudades: [
          {
            nombre: 'Masaya',
            barrios: ['Barrio Monimbó', 'Barrio San Miguel', 'Barrio San Jerónimo', 'Barrio El Calvario', 'Barrio La Cruz', 'Barrio San Juan', 'Barrio El Coyolar', 'Barrio Santa Lucía', 'Colonia Villa Bosco', 'Colonia Los Ángeles', 'Residencial Las Colinas', 'Los Laureles', 'Villa Chagüitillo'],
          },
          {
            nombre: 'Nindirí',
            barrios: ['Barrio El Centro', 'Barrio San Antonio', 'Barrio El Calvario', 'Los Ángeles', 'Colonia Nueva'],
          },
          {
            nombre: 'Nandasmo',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Las Flores'],
          },
          {
            nombre: 'Masatepe',
            barrios: ['Barrio El Centro', 'Barrio San Antonio', 'Barrio San Miguel', 'Los Ángeles', 'El Cerrito'],
          },
        ],
      },
      {
        nombre: 'Granada',
        ciudades: [
          {
            nombre: 'Granada',
            barrios: ['Barrio El Laborío', 'Barrio La Ermita', 'Barrio La Merced', 'Barrio Santa Rosa', 'Barrio Guadalupe', 'Barrio San Juan', 'Barrio San Francisco', 'Barrio La Plazuela', 'Colonia Villa Real', 'Colonia Los Ángeles', 'Residencial El Valle', 'Residencial Las Colinas', 'Los Robles', 'Altos de Granada', 'Villa Nueva'],
          },
          {
            nombre: 'Nandaime',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio El Calvario', 'Los Laureles', 'Colonia Nueva'],
          },
          {
            nombre: 'Diriomo',
            barrios: ['Barrio El Centro', 'Barrio San Miguel', 'Barrio El Calvario', 'Los Ángeles'],
          },
          {
            nombre: 'Diriá',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz'],
          },
        ],
      },
      {
        nombre: 'Chinandega',
        ciudades: [
          {
            nombre: 'Chinandega',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Antonio', 'Barrio El Calvario', 'Barrio La Cruz', 'Barrio Santa Ana', 'Barrio El Rosario', 'Colonia 14 de Febrero', 'Colonia Los Laureles', 'Colonia Nueva', 'Residencial Las Colinas', 'Villa Bosco', 'Los Ángeles', 'Linda Vista', 'El Recreo'],
          },
          {
            nombre: 'El Viejo',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Francisco', 'Los Laureles', 'Colonia Nueva', 'El Tamarindo'],
          },
          {
            nombre: 'Chichigalpa',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio El Calvario', 'Los Ángeles', 'Colonia 20 de Julio'],
          },
          {
            nombre: 'Corinto',
            barrios: ['Barrio El Centro', 'Barrio El Puerto', 'Barrio San José', 'Los Laureles', 'Villa del Mar'],
          },
          {
            nombre: 'Puerto Morazán',
            barrios: ['Barrio El Centro', 'Barrio San Antonio', 'Barrio La Cruz', 'Los Mangos'],
          },
        ],
      },
      {
        nombre: 'Matagalpa',
        ciudades: [
          {
            nombre: 'Matagalpa',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Antonio', 'Barrio El Calvario', 'Barrio La Cruz', 'Barrio Santa Lucía', 'Barrio La Fuente', 'Colonia Los Laureles', 'Colonia Nueva', 'Residencial El Valle', 'Residencial Las Colinas', 'Villa Bosco', 'Los Ángeles', 'Linda Vista', 'Cerro Grande'],
          },
          {
            nombre: 'Jinotega',
            ciudades: [], // moved below
          },
          {
            nombre: 'Esquipulas',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Laureles'],
          },
          {
            nombre: 'Muy Muy',
            barrios: ['Barrio El Centro', 'Barrio San Antonio', 'Barrio El Calvario', 'Los Ángeles'],
          },
          {
            nombre: 'San Ramón',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Las Flores'],
          },
        ],
      },
      {
        nombre: 'Jinotega',
        ciudades: [
          {
            nombre: 'Jinotega',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Antonio', 'Barrio El Calvario', 'Barrio La Cruz', 'Barrio Santa Lucía', 'Colonia Los Laureles', 'Colonia Nueva', 'Residencial Las Colinas', 'Villa Bosco', 'Los Ángeles', 'Linda Vista', 'El Recreo'],
          },
          {
            nombre: 'La Concordia',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Laureles'],
          },
          {
            nombre: 'San Rafael del Norte',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio El Calvario', 'Los Ángeles', 'Villa Hermosa'],
          },
          {
            nombre: 'Wiwilí',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Laureles', 'El Porvenir'],
          },
        ],
      },
      {
        nombre: 'Estelí',
        ciudades: [
          {
            nombre: 'Estelí',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Antonio', 'Barrio El Calvario', 'Barrio La Cruz', 'Barrio Santa Lucía', 'Barrio La Fuente', 'Colonia Los Laureles', 'Colonia 14 de Julio', 'Residencial El Valle', 'Residencial Las Colinas', 'Villa Bosco', 'Los Ángeles', 'Linda Vista', 'El Recreo', 'Colonia 1 de Mayo'],
          },
          {
            nombre: 'Pueblo Nuevo',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Laureles', 'Las Flores'],
          },
          {
            nombre: 'Condega',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio El Calvario', 'Los Ángeles', 'Colonia Nueva'],
          },
          {
            nombre: 'La Trinidad',
            barrios: ['Barrio El Centro', 'Barrio San Antonio', 'Barrio La Cruz', 'Los Laureles'],
          },
        ],
      },
      {
        nombre: 'Carazo',
        ciudades: [
          {
            nombre: 'Jinotepe',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Antonio', 'Barrio El Calvario', 'Barrio La Cruz', 'Colonia Los Laureles', 'Colonia Nueva', 'Residencial Las Colinas', 'Los Ángeles', 'Villa Bosco'],
          },
          {
            nombre: 'Diriamba',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Miguel', 'Barrio El Calvario', 'Barrio La Cruz', 'Colonia Los Laureles', 'Los Ángeles', 'Villa Nueva'],
          },
          {
            nombre: 'San Marcos',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Antonio', 'Barrio El Calvario', 'Los Laureles', 'Las Flores'],
          },
          {
            nombre: 'Santa Teresa',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Ángeles'],
          },
        ],
      },
      {
        nombre: 'Rivas',
        ciudades: [
          {
            nombre: 'Rivas',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Antonio', 'Barrio El Calvario', 'Barrio La Cruz', 'Colonia Los Laureles', 'Colonia Nueva', 'Residencial Las Colinas', 'Los Ángeles', 'Villa Bosco'],
          },
          {
            nombre: 'San Jorge',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Laureles', 'El Puerto'],
          },
          {
            nombre: 'San Juan del Sur',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Laureles', 'Villa del Mar', 'El Coco', 'Maderas'],
          },
          {
            nombre: 'Tola',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Ángeles', 'El Porvenir'],
          },
        ],
      },
      {
        nombre: 'Boaco',
        ciudades: [
          {
            nombre: 'Boaco',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Antonio', 'Barrio El Calvario', 'Barrio La Cruz', 'Colonia Los Laureles', 'Los Ángeles', 'Villa Bosco'],
          },
          {
            nombre: 'Camoapa',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Antonio', 'Barrio El Calvario', 'Los Laureles', 'Las Flores'],
          },
          {
            nombre: 'San Lorenzo',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Ángeles'],
          },
          {
            nombre: 'Santa Lucía',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Laureles'],
          },
        ],
      },
      {
        nombre: 'Chontales',
        ciudades: [
          {
            nombre: 'Juigalpa',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Antonio', 'Barrio El Calvario', 'Barrio La Cruz', 'Colonia Los Laureles', 'Colonia Nueva', 'Residencial Las Colinas', 'Los Ángeles', 'Villa Bosco', 'Linda Vista'],
          },
          {
            nombre: 'Acoyapa',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Antonio', 'Barrio La Cruz', 'Los Laureles'],
          },
          {
            nombre: 'Santo Tomás',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Ángeles'],
          },
          {
            nombre: 'Villa Sandino',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Laureles'],
          },
          {
            nombre: 'El Rama',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Ángeles', 'El Porvenir'],
          },
        ],
      },
      {
        nombre: 'Nueva Segovia',
        ciudades: [
          {
            nombre: 'Ocotal',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Antonio', 'Barrio El Calvario', 'Barrio La Cruz', 'Colonia Los Laureles', 'Colonia Nueva', 'Los Ángeles', 'Villa Bosco'],
          },
          {
            nombre: 'Jalapa',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Antonio', 'Barrio La Cruz', 'Los Laureles', 'Las Flores'],
          },
          {
            nombre: 'Ciudad Antigua',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Ángeles'],
          },
          {
            nombre: 'Santa María',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Laureles'],
          },
          {
            nombre: 'Macuelizo',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Ángeles'],
          },
        ],
      },
      {
        nombre: 'Madriz',
        ciudades: [
          {
            nombre: 'Somoto',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Antonio', 'Barrio El Calvario', 'Barrio La Cruz', 'Colonia Los Laureles', 'Los Ángeles', 'Villa Bosco', 'Las Flores'],
          },
          {
            nombre: 'Las Sabanas',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Laureles'],
          },
          {
            nombre: 'San Juan del Río Coco',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Ángeles', 'El Porvenir'],
          },
          {
            nombre: 'Palacagüina',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Laureles'],
          },
          {
            nombre: 'Yalagüina',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Ángeles'],
          },
        ],
      },
      {
        nombre: 'Río San Juan',
        ciudades: [
          {
            nombre: 'San Carlos',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio San Antonio', 'Barrio El Calvario', 'Barrio La Cruz', 'Colonia Los Laureles', 'Los Ángeles', 'Villa Bosco', 'El Puerto'],
          },
          {
            nombre: 'El Castillo',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Laureles'],
          },
          {
            nombre: 'San Miguelito',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Ángeles'],
          },
        ],
      },
      {
        nombre: 'Costa Caribe Norte',
        ciudades: [
          {
            nombre: 'Puerto Cabezas',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Laureles', 'Colonia Nueva', 'Villa del Mar', 'El Muelle', 'Los Ángeles', 'Las Palmeras'],
          },
          {
            nombre: 'Waspán',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Laureles'],
          },
          {
            nombre: 'Bonanza',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Ángeles', 'La Mina'],
          },
          {
            nombre: 'Siuna',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Laureles', 'Colonia Nueva'],
          },
          {
            nombre: 'Rosita',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Ángeles'],
          },
        ],
      },
      {
        nombre: 'Costa Caribe Sur',
        ciudades: [
          {
            nombre: 'Bluefields',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Barrio Punta Fría', 'Barrio 19 de Julio', 'Barrio San Mateo', 'Colonia Nueva', 'Los Laureles', 'Villa del Mar', 'El Muelle', 'Los Ángeles', 'Las Palmeras'],
          },
          {
            nombre: 'Corn Island',
            barrios: ['Brig Bay', 'South End', 'North End', 'La Loma', 'Long Bay', 'Punta Blanca'],
          },
          {
            nombre: 'El Rama',
            ciudades: [], // already in Chontales
          },
          {
            nombre: 'Laguna de Perlas',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Laureles', 'El Bluff'],
          },
          {
            nombre: 'El Tortuguero',
            barrios: ['Barrio El Centro', 'Barrio San José', 'Barrio La Cruz', 'Los Ángeles'],
          },
        ],
      },
    ],
  },
]

export function getDepartamentos(pais: string): string[] {
  const p = PAISES.find((p) => p.nombre === pais)
  return p ? p.departamentos.map((d) => d.nombre) : []
}

export function getCiudades(pais: string, departamento: string): string[] {
  const p = PAISES.find((p) => p.nombre === pais)
  const d = p?.departamentos.find((d) => d.nombre === departamento)
  return d ? d.ciudades.map((c) => c.nombre) : []
}

export function getBarrios(pais: string, departamento: string, ciudad: string): string[] {
  const p = PAISES.find((p) => p.nombre === pais)
  const d = p?.departamentos.find((d) => d.nombre === departamento)
  const c = d?.ciudades.find((c) => c.nombre === ciudad)
  return c ? c.barrios : []
}

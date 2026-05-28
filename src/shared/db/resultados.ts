export type ResultadosType = {
    id: string
    clave: string
    variante: string
    descripcion: string
    informacion: string
    disponible: string
    marca: string
    categoria: string
    existencias: number | null
    precioant: string
    precio: string
    destacado: boolean
    createdat: string
}

export const resultados: ResultadosType[] = [
  {
    id: '1769',
    clave: '22627',
    variante: 'JZ4',
    descripcion: 'Pinza de punta y corte 8" mango de PVC, | 22627',
    informacion: '\n' +
      'Fabricada en acero al carbono\n' +
      '\n' +
      'Mango cubierto de PVC antiderrapante\n' +
      '\n' +
      'Cuchillas afiladas para cortes rápidos y precisos',
    disponible: '1 día',
    marca: 'Truper',
    categoria: 'Herramientas',
    existencias: null,
    precioant: '',
    precio: '$88.00',
    destacado: false,
    createdat: "2026-05-27T20:27:44.216Z"
  }
];

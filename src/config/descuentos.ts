export type ReglaDescuento = {
  tipo: 'marca' | 'categoria';
  valor: string; // valor tal como aparece en la columna productos_.marca / .categoria
  porcentaje: number; // se ignora si <= 0 o >= 100
  activo: boolean;
};

export const reglasDescuento: ReglaDescuento[] = [
  { tipo: 'marca', valor: 'Cempanel', porcentaje: 5, activo: true },
];

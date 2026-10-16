export interface TemplateCategory {
  name: string;
  position: number;
  items: { name: string; priceFcfa: number; position: number }[];
}

export const TEMPLATE_MENU: TemplateCategory[] = [
  {
    name: 'Boissons',
    position: 0,
    items: [
      { name: 'Eau minerale 1.5L', priceFcfa: 500, position: 0 },
      { name: 'Coca-Cola 33cl', priceFcfa: 600, position: 1 },
      { name: 'Biere Flag 65cl', priceFcfa: 1000, position: 2 },
      { name: 'Jus de bissap', priceFcfa: 500, position: 3 },
    ],
  },
  {
    name: 'Repas',
    position: 1,
    items: [
      { name: 'Poulet braise + attieke', priceFcfa: 3500, position: 0 },
      { name: 'Riz sauce graine', priceFcfa: 2500, position: 1 },
      { name: 'Alloco poisson', priceFcfa: 2000, position: 2 },
    ],
  },
  {
    name: 'Services',
    position: 2,
    items: [
      { name: 'Linge supplementaire', priceFcfa: 1000, position: 0 },
    ],
  },
];

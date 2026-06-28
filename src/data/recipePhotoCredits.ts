// CAPA 1 · Datos — Creditos de las fotos de recetas. Todas son fotografias
// reales con licencia libre (Wikimedia Commons). Se atribuyen autor, licencia
// y fuente como exigen las licencias CC BY / CC BY-SA. Generado al integrarlas.
export interface PhotoCredit {
  author: string;
  license: string;
  source: string;
}

export const RECIPE_PHOTO_CREDITS: Record<string, PhotoCredit> = {
  'avena-proteica': { author: 'Shisma', license: 'CC BY 4.0', source: 'https://commons.wikimedia.org/wiki/File%3ABanana%20oatmeal%202.jpg' },
  'crema-calabacin': { author: 'Krista', license: 'CC BY 2.0', source: 'https://commons.wikimedia.org/wiki/File%3ACrema%20de%20calabac%C3%ADn%20-%20Krista.jpg' },
  'ensalada-pasta-atun': { author: 'FotoosVanRobin from Netherlands', license: 'CC BY-SA 2.0', source: 'https://commons.wikimedia.org/wiki/File%3ATuna%20pasta%20salad.jpg' },
  'garbanzos-espinacas': { author: 'Toniher', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File%3APotaje%20de%20vigilia.jpg' },
  'gazpacho-andaluz': { author: 'Bocadorada', license: 'CC BY-SA 2.0', source: 'https://commons.wikimedia.org/wiki/File%3AGazpacho%20Cazuela%20Barro.jpg' },
  'hummus-crudites': { author: 'TechnoKittyCat', license: 'CC BY 4.0', source: 'https://commons.wikimedia.org/wiki/File%3AHummus%20with%20Olive%20Oil.jpg' },
  'lentejas-verduras': { author: 'Charles Haynes', license: 'CC BY-SA 2.0', source: 'https://commons.wikimedia.org/wiki/File%3ADal%20Makhani.jpg' },
  'pollo-arroz-brocoli': { author: 'HaJunkiyada', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File%3ALiat%20Portal%20for%20Foodie%20Disorder%20-%20Roasted%20chicken%20with%20cauliflower%20broccoli%20potatoes%20rice%20and%20salad.jpg' },
  'pollo-curry': { author: 'Ruth Hartnup from Vancouver, Canada', license: 'CC BY 2.0', source: 'https://commons.wikimedia.org/wiki/File%3AChicken%20curry%20bowl%20and%20berry%20ice%20tea%20at%20Shishinori%20%2815700024614%29.jpg' },
  'salmon-patata-esparragos': { author: 'Shark2025', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File%3AHerb%20baked%20salmon.jpg' },
  'tortilla-claras-espinacas': { author: 'Dedda 71', license: 'CC BY 3.0', source: 'https://commons.wikimedia.org/wiki/File%3AFrittata%20slice.jpg' },
  'tortilla-espanola': { author: 'Juan Emilio Prades Bel', license: 'CC BY 4.0', source: 'https://commons.wikimedia.org/wiki/File%3ATortilla%20espa%C3%B1ola%20con%20patatas%20y%20cebolla.jpg' },
  'tortitas-avena': { author: 'Anna31415', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File%3APancakes%20with%20Walnuts.png' },
  'tostada-aguacate-huevo': { author: 'Asramsey', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File%3AFresh%20Avocado%20Toast%20with%20Egg.jpg' },
  'wrap-pavo': { author: 'SharonDawn', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File%3ABeef%20and%20vegetable%20tortilla%20wrap%202.jpg' },
  'yogur-frutos-rojos': { author: 'USDAgov', license: 'Public domain', source: 'https://commons.wikimedia.org/wiki/File%3AChild%20Care%20Recipes%20%28Team%20Nutiriton%29%20%2820211231-FNS-UNC-0031%29.jpg' },
};

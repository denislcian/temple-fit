// CAPA 1 · Datos — Referencias científicas de las fórmulas de la app. La idea es
// no usar cajas negras: cada cálculo cita un estándar público y verificable, de
// modo que el usuario tenga un referente real (no una cifra "porque sí").
export interface FormulaReference {
  id: string;
  /** Qué calcula, en una línea. */
  what: string;
  title: string;
  authors: string;
  year: number;
  source: string;
  url: string;
}

export const FORMULA_REFERENCES: Record<string, FormulaReference> = {
  mifflin: {
    id: 'mifflin',
    what: 'Metabolismo basal y gasto calórico (Mifflin-St Jeor)',
    title: 'A new predictive equation for resting energy expenditure in healthy individuals',
    authors: 'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO',
    year: 1990,
    source: 'American Journal of Clinical Nutrition, 51(2):241-247',
    url: 'https://doi.org/10.1093/ajcn/51.2.241',
  },
  'issn-protein': {
    id: 'issn-protein',
    what: 'Proteína diaria (1,4-2,0 g/kg; más en déficit)',
    title: 'International Society of Sports Nutrition Position Stand: protein and exercise',
    authors: 'Jäger R, Kerksick CM, Campbell BI, et al.',
    year: 2017,
    source: 'Journal of the International Society of Sports Nutrition, 14:20',
    url: 'https://doi.org/10.1186/s12970-017-0177-8',
  },
  'efsa-water': {
    id: 'efsa-water',
    what: 'Agua diaria (ingesta adecuada: 2,0 L mujeres / 2,5 L hombres)',
    title: 'Scientific Opinion on Dietary Reference Values for water',
    authors: 'EFSA Panel on Dietetic Products, Nutrition and Allergies (NDA)',
    year: 2010,
    source: 'EFSA Journal, 8(3):1459',
    url: 'https://doi.org/10.2903/j.efsa.2010.1459',
  },
  'navy-bodyfat': {
    id: 'navy-bodyfat',
    what: '% de grasa corporal por circunferencias (Marina de EE. UU.)',
    title: 'Prediction of percent body fat for U.S. Navy men from body circumferences and height',
    authors: 'Hodgdon JA, Beckett MB',
    year: 1984,
    source: 'Naval Health Research Center, Reporte 84-11',
    url: 'https://apps.dtic.mil/sti/citations/ADA143890',
  },
  'who-bmi': {
    id: 'who-bmi',
    what: 'Índice de masa corporal y categorías',
    title: 'Obesity: preventing and managing the global epidemic (clasificación del IMC)',
    authors: 'Organización Mundial de la Salud (OMS)',
    year: 2000,
    source: 'WHO Technical Report Series 894',
    url: 'https://www.who.int/europe/news-room/fact-sheets/item/a-healthy-lifestyle---who-recommendations',
  },
  'ace-bodyfat': {
    id: 'ace-bodyfat',
    what: 'Rangos saludables de % de grasa por sexo',
    title: 'Percent body fat norms (categorías de composición corporal)',
    authors: 'American Council on Exercise (ACE)',
    year: 2009,
    source: 'ACE Lifestyle & Weight Management Consultant Manual',
    url: 'https://www.acefitness.org/resources/everyone/tools-calculators/percent-body-fat-calculator/',
  },
  // Fórmulas que la app ya usaba en otras pantallas (1RM, balance energético):
  'epley-brzycki': {
    id: 'epley-brzycki',
    what: 'Repetición máxima estimada (1RM)',
    title: 'Fórmulas de 1RM de Epley (1985) y Brzycki (1993)',
    authors: 'Epley B; Brzycki M',
    year: 1993,
    source: 'Boyd Epley Workout (1985); JOPERD 64(1):88-90 (1993)',
    url: 'https://en.wikipedia.org/wiki/One-repetition_maximum',
  },
  wishnofsky: {
    id: 'wishnofsky',
    what: 'Equivalencia energía-grasa (~7700 kcal/kg)',
    title: 'Caloric equivalents of gained or lost weight',
    authors: 'Wishnofsky M',
    year: 1958,
    source: 'American Journal of Clinical Nutrition, 6(5):542-546',
    url: 'https://doi.org/10.1093/ajcn/6.5.542',
  },
};

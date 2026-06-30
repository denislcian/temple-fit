# Procedencia del catálogo de alimentos

Los valores por 100 g de [`foodCatalog.ts`](./foodCatalog.ts) provienen de **USDA
FoodData Central**, base **SR Legacy** (publicación 2018-04). Es **dominio
público** (obra del gobierno de EE. UU.), por lo que puede redistribuirse sin
restricción ni atribución obligatoria; aun así la citamos por transparencia.

- Portal: <https://fdc.nal.usda.gov>
- Cada alimento se puede verificar en `https://fdc.nal.usda.gov/food-details/<id>/nutrients`

Tres alimentos no tienen un equivalente genérico en SR Legacy y llevan una
**estimación** (a partir de tablas de composición de referencia), marcada como
tal en el catálogo: **jamón serrano**, **seitán** y **bebida de avena**.

| id | Fuente | Descripción USDA |
|---|---|---|
| pechuga-pollo | USDA 171534 | Chicken, broiler or fryers, breast, skinless, boneless, meat only, cooked, grilled |
| pavo-pechuga | USDA 171496 | Turkey, whole, breast, meat only, cooked, roasted |
| ternera-magra | USDA 174721 | Beef, eye round, separable lean only, cooked, slow roasted |
| lomo-cerdo | USDA 168233 | Pork, fresh, loin, whole, separable lean only, cooked, roasted |
| huevo | USDA 171287 | Egg, whole, raw, fresh |
| clara-huevo | USDA 172183 | Egg, white, raw, fresh |
| atun-natural | USDA 171986 | Fish, tuna, light, canned in water, drained solids |
| atun-aceite | USDA 173708 | Fish, tuna, light, canned in oil, drained solids |
| salmon | USDA 175167 | Fish, salmon, Atlantic, farmed, raw |
| merluza | USDA 173713 | Fish, whiting, mixed species, raw (equivalente a merluza) |
| bacalao | USDA 171955 | Fish, cod, Atlantic, raw |
| sardinas-lata | USDA 175139 | Fish, sardine, Atlantic, canned in oil, drained solids with bone |
| gambas | USDA 175179 | Crustaceans, shrimp, raw |
| jamon-serrano | ESTIMADO | — sin equivalente en SR Legacy |
| jamon-cocido | USDA 173863 | Ham, sliced, pre-packaged, deli meat (96% fat free) |
| tofu | USDA 172476 | Tofu, raw, regular, prepared with calcium sulfate |
| seitan | ESTIMADO | — sin equivalente en SR Legacy |
| leche-entera | USDA 171265 | Milk, whole, 3.25% milkfat, with added vitamin D |
| leche-desnatada | USDA 169868 | Milk, fluid, nonfat (fat free or skim) |
| leche-avena | ESTIMADO | — sin equivalente en SR Legacy |
| yogur-natural | USDA 171284 | Yogurt, plain, whole milk |
| yogur-proteico | USDA 171312 | Yogurt, Greek, nonfat, plain |
| kefir | USDA 170904 | Kefir, lowfat, plain |
| queso-fresco-batido | USDA 172181 | Cheese, cottage, nonfat, uncreamed |
| requeson | USDA 171248 | Cheese, ricotta, part skim milk |
| queso-curado | USDA 170899 | Cheese, cheddar, sharp |
| mozzarella | USDA 170845 | Cheese, mozzarella, whole milk |
| whey | USDA 173177 | Whey protein powder isolate |
| lentejas | USDA 175254 | Lentils, mature seeds, cooked, boiled |
| garbanzos | USDA 173799 | Chickpeas, mature seeds, cooked, boiled |
| alubias | USDA 175249 | Beans, white, mature seeds, cooked, boiled |
| arroz-blanco | USDA 168878 | Rice, white, long-grain, enriched, cooked |
| arroz-integral | USDA 169704 | Rice, brown, long-grain, cooked |
| pasta | USDA 169737 | Pasta, cooked, enriched, without added salt |
| quinoa | USDA 168917 | Quinoa, cooked |
| cuscus | USDA 169700 | Couscous, cooked |
| patata | USDA 170114 | Potatoes, boiled, cooked in skin, flesh |
| boniato | USDA 168483 | Sweet potato, cooked, baked in skin, flesh |
| avena | USDA 173904 | Cereals, oats, regular and quick, not fortified, dry |
| pan-blanco | USDA 172818 | Bread, white, commercially prepared |
| pan-integral | USDA 172688 | Bread, whole-wheat, commercially prepared |
| tortitas-arroz | USDA 168855 | Snacks, rice cakes, brown rice |
| wrap-trigo | USDA 167535 | Tortillas, ready-to-bake or -fry, flour |
| maiz | USDA 168525 | Corn, sweet, yellow, cooked, boiled, drained |
| aceite-oliva | USDA 171413 | Oil, olive, salad or cooking |
| mantequilla | USDA 173430 | Butter, without salt |
| aguacate | USDA 171705 | Avocados, raw, all commercial varieties |
| almendras | USDA 170567 | Nuts, almonds |
| nueces | USDA 170187 | Nuts, walnuts, english |
| crema-cacahuete | USDA 172470 | Peanut butter, smooth style, without salt |
| chocolate-negro | USDA 170273 | Chocolate, dark, 70-85% cacao solids |
| platano | USDA 173944 | Bananas, raw |
| manzana | USDA 171688 | Apples, raw, with skin |
| naranja | USDA 169097 | Oranges, raw, all commercial varieties |
| fresas | USDA 167762 | Strawberries, raw |
| uvas | USDA 174683 | Grapes, red or green (European type), raw |
| kiwi | USDA 168153 | Kiwifruit, green, raw |
| datiles | USDA 171726 | Dates, deglet noor |
| pasas | USDA 168165 | Raisins, dark, seedless |
| brocoli | USDA 170379 | Broccoli, raw |
| espinacas | USDA 168462 | Spinach, raw |
| tomate | USDA 170457 | Tomatoes, red, ripe, raw, year round average |
| lechuga | USDA 169247 | Lettuce, cos or romaine, raw |
| pimiento | USDA 170108 | Peppers, sweet, red, raw |
| cebolla | USDA 170000 | Onions, raw |
| zanahoria | USDA 170393 | Carrots, raw |
| calabacin | USDA 169291 | Squash, summer, zucchini, includes skin, raw |
| champinones | USDA 169251 | Mushrooms, white, raw |
| hummus | USDA 174289 | Hummus, commercial |
| salsa-tomate | USDA 169074 | Tomato sauce, canned, no salt added |
| miel | USDA 169640 | Honey |
| azucar | USDA 169655 | Sugars, granulated |

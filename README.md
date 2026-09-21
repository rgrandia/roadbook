# Rally Roadbook

Una eina de producció ràpida per crear, editar i exportar roadbooks de ral·li
professionals: etapes, sectors, instruccions amb icones de direcció,
quilometratge automàtic, elements especials (STOP, REAGRUPAMENT, CONTROL...)
i exportació a PDF A4 llest per imprimir.

L'objectiu no és un CRUD genèric: l'entrada de dades està pensada per anar
molt ràpid (seleccionar → escriure → `Tab` → escriure → `Enter` → següent
instrucció), amb el quilometratge total i parcial calculant-se sol.

## Funcionalitats

- **Dashboard de projectes**: crear, obrir, duplicar, eliminar, exportar/importar JSON.
- **Editor visual**: etapes i sectors en un arbre lateral, amb reordenació per arrossegament.
- **Entrada ràpida d'instruccions**: barra d'accions amb icones grans per direccions
  i elements especials (STOP, REAGRUPAMENT, CONTROL, SORTIDA, META, PERILL, pas
  per població, informació, nota).
- **Diagrames de direcció ("tulips")**: ~45 pictogrames que dibuixen la geometria
  real de la cruïlla (gir, cruïlla en T, encreuament, rotonda amb la sortida 1a-6a,
  desviament, autopista/autovia, revolt en S), no fletxes girades — igual que un
  roadbook imprès.
- **Icones personalitzades**: un editor paramètric ("Les meves icones", des del
  tauler o des del mateix selector de direcció) per dissenyar nous pictogrames
  amb el mateix estil, cobrint totes les famílies de forma del conjunt fix
  (gir/cruïlla amb sortides no preses, rotonda, desviament, autopista —
  mantenir carril / sortida / bifurcació —, revolt en S), amb un botó de
  "Mirall" per generar la parella esquerra/dreta sense tornar a introduir
  l'angle. Es guarden en aquest navegador i estan disponibles a tots els
  roadbooks, i viatgen amb el fitxer JSON quan exportes un roadbook que les
  faci servir (es fusionen a la llibreria local en importar-lo, sense
  duplicar-les si ja hi eren).
- **Cercador d'icones**: el selector de direcció (45 icones fixes + les
  personalitzades) es pot filtrar escrivint, perquè trobar-ne una no depengui
  de fer scroll per totes les categories.
- **Càlcul automàtic de quilometratge**: "km total", "km parcial" (es reinicia
  després de STOP/REAGRUPAMENT/CONTROL/SORTIDA) i "km regressiu" (compte enrere
  fins al final del sector) es calculen sols a partir de la distància introduïda
  a cada fila; permet edició manual del km total (retro-calcula la distància) i
  "fixar quilometratge" per evitar que una fila es recalculi.
- **Reordenar / duplicar / inserir**: arrossegar files, duplicar sector, inserir
  una instrucció abans o després de qualsevol fila sense renumerar a mà.
- **Camps addicionals per fila**: coordenades GPS, traducció/segon idioma i avís
  de perill ("!!"), accessibles des del menú de la fila sense ocupar espai a la
  taula principal — la introducció ràpida de dades no se'n ressent.
- **Destinacions en diverses línies**: el camp de destinació és multilínia (una
  senyal apilada per línia al PDF, com un rètol real de carretera).
- **Seccions d'enllaç**: un sector de tipus "Enllaç" amb població inici/final
  mostra una barra de transició destacada (p. ex. "SERVICE OUT » ZONA DE
  CALIBRACIÓ"), com als roadbooks professionals.
- **Autocompletat**: carreteres i informació suggereixen valors ja utilitzats al
  mateix roadbook (`<datalist>` natiu, sense dependències extra).
- **Validacions no bloquejants**: avisa de quilometratge que baixa, sectors
  buits, direccions que falten, etc., sense impedir mai guardar o exportar.
- **Keyboard-first**: `Enter` crea la instrucció següent, `Ctrl/Cmd+Z` /
  `Ctrl/Cmd+Shift+Z` desfà/refà, `Ctrl/Cmd+S` guarda, `Ctrl/Cmd+D` duplica la
  fila activa, `Ctrl/Cmd+⌫` l'elimina (amb undo).
- **Autosave real**: cada canvi es guarda a IndexedDB (local-first, res surt del
  navegador); tancar o refrescar la pestanya no perd res.
- **Previsualització = PDF real**: la pestanya "Previsualització" renderitza el
  mateix document `@react-pdf/renderer` que genera el PDF final, així que no és
  una aproximació, és el PDF.
- **Exportació a PDF en blanc i negre**: A4 vertical/horitzontal, capçalera amb
  taula de metadades (Etapa/Secció/Sector/Dist/Temps/Mitjana/Pàgina), capçalera
  de columnes repetida a cada pàgina, senyal STOP com a octògon real (no un
  color), files que no es parteixen entre pàgines, i cada sector comença en
  pàgina nova. Cap element depèn del color per ser llegible.

## Stack tècnic

| Àrea | Tria |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript estricte |
| UI | Tailwind CSS v4 + primitives pròpies sobre Radix UI + Lucide Icons |
| Estat | Zustand + Immer, amb undo/redo via `zundo` |
| Persistència | Dexie (IndexedDB), local-first |
| Drag & drop | `@dnd-kit` |
| PDF | `@react-pdf/renderer` (mateix document per a previsualització i export) |
| Tests | Vitest + Testing Library |

No s'ha afegit cap dependència de gestió d'estat de servidor / backend perquè
el MVP és 100% local-first; vegeu [Arquitectura](#arquitectura-i-decisions) per
com incorporar un backend cloud més endavant sense reescriure res.

## Executar en local

Requisits: Node.js 20+ i npm.

```bash
npm install
npm run dev
```

Obre [http://localhost:3000](http://localhost:3000).

### Altres comandes

```bash
npm run build        # build de producció
npm run start         # serveix el build de producció
npm run lint           # ESLint
npm run test            # tests (Vitest, un sol cop)
npm run test:watch       # tests en mode watch
npm run format             # Prettier --write
npm run format:check        # Prettier --check
```

Verificació completa abans de publicar canvis:

```bash
npm run lint && npx tsc --noEmit && npm run test && npm run build
```

## Desplegament

L'aplicació és 100% estàtica/client-side per a les dades (IndexedDB al
navegador), així que es desplega com qualsevol app Next.js:

**Vercel (recomanat)**

1. Puja el repositori a GitHub.
2. Importa'l a [vercel.com/new](https://vercel.com/new).
3. Vercel detecta Next.js automàticament; `npm run build` és el build command
   per defecte. No calen variables d'entorn per al MVP.

**Manualment / altres plataformes**

```bash
npm run build
npm run start   # o `next start`, o serveix .next amb un adaptador Node
```

Com que totes les dades viuen a IndexedDB del navegador de cada usuari, no cal
cap base de dades ni backend per fer servir l'aplicació en producció.

## Arquitectura i decisions

```
src/
  app/                     Rutes Next.js (dashboard, editor /r/[id])
  components/
    ui/                    Primitives (Button, Input, Dialog, Popover...) sobre Radix
    roadbook/               Components de domini (pickers, targetes, onboarding)
      editor/                Editor: top bar, sidebar, taula d'instruccions, PDF preview
  lib/
    roadbook/
      types.ts               Model de dades (Roadbook → Stage → Sector → Instruction)
      calc.ts                 Motor de càlcul de quilometratge (pur, testejat)
      factory.ts               Constructors per defecte
      library.ts                Categories, tipus de via, autocompletat
      direction-icons.ts         Dades SVG compartides (web + PDF)
      validation.ts               Avisos no bloquejants
    pdf/
      roadbook-document.tsx        Document @react-pdf/renderer (font de veritat del PDF)
      direction-icon-pdf.tsx        Icones de direcció en PDF (mateixes dades que la UI)
      export.tsx                     Descàrrega del PDF
    db.ts                            Dexie (IndexedDB)
    projects.ts                       CRUD de projectes (crear/duplicar/importar/exportar)
  store/
    roadbook-store.ts                  Zustand + Immer + zundo (estat + undo/redo)
    use-autosave.ts                     Autosave amb debounce cap a Dexie
```

### Model de dades

`Roadbook -> Stage[] -> Sector[] -> Instruction[]`, guardat com un sol document
JSON per roadbook (una fila a la taula `roadbooks` de Dexie). Aquest disseny és
deliberat: guardar-ho tot com un document denormalitzat fa que el MVP local
sigui trivial i es correspon 1:1 amb un futur endpoint cloud del tipus
`PUT /roadbooks/{id}` amb el mateix `id` i la mateixa forma, sense migració de
dades. Cada `Instruction` porta `distance`, `totalKm`, `partialKm`, `lockedKm`,
`direction`, `category`, `danger`, `road`, `destination` (multilínia),
`information`/`informationSecondary`, `gpsLat`/`gpsLng`, etc. Vegeu
`src/lib/roadbook/types.ts` per al model complet i els comentaris de disseny.

### Motor de càlcul de quilometratge

Tota la lògica de quilometratge viu en funcions pures a `src/lib/roadbook/calc.ts`
(`recalcSector` és la funció central: cap acció d'edició, inserció, esborrat,
duplicat o reordenació escriu `totalKm`/`partialKm` directament — totes passen
per aquí). Regles:

- `totalKm` s'acumula (`anterior + distance`), tret que la fila estigui
  **fixada** (`lockedKm`), en què es respecta el valor introduït i la cadena
  continua a partir d'aquest.
- `partialKm` es reinicia a zero després de qualsevol fila STOP / REAGRUPAMENT
  / CONTROL / SORTIDA (les categories que en un roadbook imprès marquen un punt
  de control), imitant la convenció real dels roadbooks de ral·li.
- Editar el "km total" a mà retro-calcula la `distance` de la fila perquè la
  cadena reprodueixi aquest valor (secció "ajust de roadbook").

Aquesta lògica té cobertura de tests exhaustiva a `calc.test.ts` (encadenament,
punts de reinici, fixació de km, inserció/esborrat/reordenació/duplicat).

### Icones de direcció ("tulips") compartides entre web i PDF

`@react-pdf/renderer` no pot renderitzar components SVG de React/DOM arbitraris
(com els de `lucide-react`) — només les seves pròpies primitives (`Svg`,
`Path`...). Per garantir que la icona que es veu a l'editor és exactament la
mateixa que surt al PDF, `direction-icons.ts` defineix les dades del camí SVG
un sol cop; `direction-icon.tsx` (web) i `direction-icon-pdf.tsx` (PDF)
simplement pinten aquestes dades amb primitives diferents.

Cada pictograma és un diagrama esquemàtic (línia gruixuda pel camí seguit,
línies primes per les altres sortides d'una cruïlla, cercle per a les
rotondes), no una fletxa girada — seguint la convenció real dels roadbooks
impresos. El fitxer construeix el conjunt fix de ~45 icones amb petites
funcions geomètriques (`polar`, `arrowHead`, `mirrorGlyph`...) en lloc de
coordenades escrites a mà una per una.

Aquestes mateixes funcions (`turn`/`junction`, `roundabout`, `fork`,
`motorwayKeep`/`motorwayExit`/`motorwayFork`, `sBend`) alimenten
`buildCustomGlyph`, que l'editor "Icones personalitzades"
(`icon-designer-dialog.tsx`) fa servir per generar icones d'usuari — per
això una icona creada a l'editor és visualment indistingible de les del
conjunt fix. Cada icona d'usuari (`CustomDirectionIcon`) guarda un
`CustomIconTemplate`: una unió discriminada per `kind` (`turn` amb angle +
fins a 3 sortides no preses, `roundabout`/`fork`/`motorway-*` amb un sol
angle, `s-bend` amb el sentit del primer revolt), així que l'editor pot
mostrar només els controls que pertoquen a cada forma. Direction és un enum
tancat (`DirectionType`); les icones d'usuari hi entren com un únic valor
especial `"custom"` combinat amb `Instruction.customIconId`, que es resol
contra la llibreria guardada a `db.ts` (`resolveDirectionGlyph`) tant a
l'editor com al PDF. Encara queden fora del paramètric els casos hand-tuned
d'un sol ús (ganxo de tancada, incorporació d'autopista, mitja volta), que
segueixen sent exclusius del conjunt fix.

### Previsualització = PDF, no una aproximació

La pestanya "Previsualització" utilitza `<PDFViewer>` de `@react-pdf/renderer`
amb el mateix component `<RoadbookPdfDocument>` que fa servir el botó
"Exportar PDF". No hi ha dues maquetacions a mantenir sincronitzades.

### Per què local-first amb Dexie/IndexedDB

El MVP no necessita compte d'usuari ni sincronització, i guardar-ho tot al
navegador elimina tota la complexitat de backend, auth i xarxa per a la primera
versió, mantenint l'autosave instantani. `src/lib/db.ts` exposa una API petita
(`saveRoadbook`, `loadRoadbookById`, `listRoadbooks`, `deleteRoadbookById`) que
seria l'única capa a substituir per crides HTTP si més endavant s'afegeix un
backend cloud — la resta de l'aplicació (store, UI) no sap ni li importa on
viuen les dades.

### Limitacions conegudes / següents passos

- El PDF és 100% blanc i negre (cap fila depèn del color per ser llegible:
  STOP és un octògon dibuixat, no una banda de color), però no replica
  exactament les formes de senyals de trànsit reals (escuts d'autopista,
  banners de direcció ovalats) ni patrons de carril/gual pintat — es va
  prioritzar una taula neta i llegible sobre la rèplica gràfica exacta.
- El temps per instrucció es pot introduir manualment; el càlcul automàtic
  `distància / velocitat = temps` només està implementat a nivell de sector
  (l'arquitectura ja ho suporta a nivell d'instrucció si cal ampliar-ho).
- La importació de CSV/Excel/GPX/KML no està implementada al MVP, però el
  model de dades (`src/lib/roadbook/types.ts`) està pensat perquè afegir-ho
  només calgui escriure un parser cap a `Instruction[]`.
- L'editor d'icones personalitzades cobreix totes les famílies paramètriques
  (gir/cruïlla, rotonda, desviament, autopista, revolt en S) però no els
  ganxos fets a mà d'un sol ús (tancada, incorporació, mitja volta) ni dibuix
  lliure de corbes arbitràries.
- La llibreria d'icones personalitzades és local a aquest navegador (mateix
  model "local-first" que la resta de l'app): no hi ha sincronització
  automàtica entre dispositius. Ara sí que **viatgen amb l'exportació JSON**
  d'un roadbook que les faci servir (es fusionen a la llibreria local en
  importar, sense sobreescriure una icona local amb el mateix id) — però si
  vols la llibreria sencera en un altre navegador sense passar per un
  roadbook que ja la faci servir, encara l'has d'exportar/importar tram per
  tram; no hi ha un "exporta tota la llibreria" independent.

## Tests

```bash
npm run test
```

- `src/lib/roadbook/calc.test.ts` — motor de càlcul de quilometratge, incloent
  el km regressiu (19 tests).
- `src/lib/roadbook/validation.test.ts` — avisos de validació (6 tests).
- `src/lib/roadbook/direction-icons.test.ts` — geometria paramètrica de totes
  les famílies de forma de les icones personalitzades (`buildCustomGlyph`:
  gir/cruïlla, rotonda, desviament, autopista, revolt en S) i la resolució
  direcció/icona personalitzada (`resolveDirectionGlyph`), incloent el cas
  d'una icona esborrada (12 tests).
- `src/lib/db.test.ts` — persistència a IndexedDB amb `fake-indexeddb` (4 tests).
- `src/lib/projects.test.ts` — l'exportació JSON només empaqueta les icones
  personalitzades que el roadbook fa servir de debò, i la importació les
  fusiona a la llibreria local sense sobreescriure-les ni duplicar-les,
  mantenint compatibilitat amb fitxers antics sense aquest embolcall (5 tests).
- `src/lib/pdf/roadbook-document.test.tsx` — el document PDF es genera sense
  errors amb totes les categories, els ~45 pictogrames de direcció, una icona
  personalitzada (incloent una referència trencada), la paginació a 4 passos
  per pàgina, seccions d'enllaç, amb i sense etapes, en vertical i horitzontal
  (9 tests).
- `src/components/roadbook/*.test.tsx` — tests de component (Vitest +
  Testing Library) per `ProjectCard`, `Onboarding`, `DirectionPicker`
  (incloent el cercador nou) i `IconDesignerDialog` (incloent el teclat del
  compàs i el botó de mirall) (14 tests).

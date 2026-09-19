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
- **Diagrames de direcció ("tulips")**: ~27 pictogrames que dibuixen la geometria
  real de la cruïlla (gir, cruïlla en T, encreuament, rotonda amb la sortida 1a-5a,
  desviament, autopista/autovia), no fletxes girades — igual que un roadbook imprès.
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
impresos. El fitxer construeix aquest conjunt fix de ~27 icones amb petites
funcions geomètriques (`polar`, `arrowHead`, `mirrorGlyph`...) en lloc de
coordenades escrites a mà una per una, però el resultat exportat és una taula
estàtica: no hi ha cap editor de geometria a mans de l'usuari (es va descartar
deliberadament per mantenir l'abast del MVP raonable).

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
- Els diagrames de direcció són un conjunt fix de ~27 pictogrames (no un editor
  de geometria de cruïlles): cobreixen els casos habituals però no permeten
  dibuixar una cruïlla arbitrària instrucció per instrucció.

## Tests

```bash
npm run test
```

- `src/lib/roadbook/calc.test.ts` — motor de càlcul de quilometratge, incloent
  el km regressiu (19 tests).
- `src/lib/roadbook/validation.test.ts` — avisos de validació (6 tests).
- `src/lib/db.test.ts` — persistència a IndexedDB amb `fake-indexeddb` (4 tests).
- `src/lib/pdf/roadbook-document.test.tsx` — el document PDF es genera sense
  errors amb totes les categories, els ~27 pictogrames de direcció, seccions
  d'enllaç, amb i sense etapes, en vertical i horitzontal (5 tests).

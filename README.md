# Portafolio — Daniel Franco

Sitio personal de [Daniel Felipe Franco Rincón](https://github.com/df1903): presentación, experiencia, proyectos, tecnologías, habilidades, estudios, certificaciones y contacto, con un asistente que responde preguntas sobre el perfil.

Sitio estático generado con **Astro 6 + TypeScript + Tailwind CSS 4**, sin frameworks de cliente, desplegado en **Cloudflare Workers** (assets estáticos + un Worker mínimo para el chat).

## Comandos

| Comando             | Qué hace                                            |
| :------------------ | :-------------------------------------------------- |
| `pnpm install`      | Instala dependencias                                |
| `pnpm dev`          | Servidor de desarrollo en `localhost:4321`          |
| `pnpm build`        | Genera el sitio en `dist/`                          |
| `pnpm preview`      | Sirve `dist/` localmente                            |
| `pnpm lint`         | ESLint                                              |
| `pnpm format`       | Prettier (escribe)                                  |
| `pnpm test`         | Tests unitarios (Vitest) con cobertura              |
| `pnpm test:e2e`     | Tests de humo (Playwright, escritorio y móvil)      |
| `pnpm worker:dev`   | Sitio + Worker del chat en local (`localhost:8787`) |

## Cómo agregar contenido

Todo el contenido vive en `src/content/` y se valida en el build con los esquemas de `src/content.config.ts`: un dato mal escrito rompe el build en vez de llegar a producción. Para publicar basta con hacer `git push` a la rama de despliegue.

### Un certificado

1. Copia la imagen (`.webp`, `.png` o `.jpg`) a `src/assets/certificates/`.
2. Opcional, recomendado: agrega sus datos en `src/content/certifications/certifications.yaml`. El `id` es el nombre del archivo sin extensión.

   ```yaml
   - id: diploma-docker
     title: Curso de Docker
     issuer: Platzi
     date: 2026-11-20
     hours: 12
     category: tools # ai | web | programming | fundamentals | tools | soft-skills
   ```

3. `git push`.

Si omites el paso 2 el certificado aparece igual, con el título deducido del nombre del archivo y en la categoría «Otros».

### Un proyecto

Crea `src/content/projects/<nombre>.yaml` (copia cualquiera de los existentes). La imagen es opcional: sin ella se genera una portada con el icono `coverIcon`. Las tecnologías se referencian por su `id` de `technologies.yaml`.

### Una tecnología, habilidad, experiencia o estudio

| Qué          | Dónde                                           |
| :----------- | :---------------------------------------------- |
| Tecnología   | bloque nuevo en `src/content/technologies/technologies.yaml` |
| Habilidad    | bloque nuevo en `src/content/skills/skills.yaml` |
| Experiencia  | archivo nuevo en `src/content/experience/`      |
| Estudio      | archivo nuevo en `src/content/studies/`         |
| Sobre mí     | `src/content/about/about.md`                    |

Los iconos son de [Iconify](https://icon-sets.iconify.design) (colecciones `simple-icons` y `mdi`).

### Datos de contacto y del sitio

`src/data/site.ts`: nombre, correo, WhatsApp, LinkedIn, GitHub, ruta del CV y URL pública. Un canal sin dato no se muestra.

## Arquitectura

```
src/
├─ content/            Contenido tipado (una colección por sección)
├─ content.config.ts   Esquemas Zod de las colecciones
├─ data/               Config del sitio y carga de colecciones → modelos de vista (portfolio.ts)
├─ lib/                Funciones puras con tests (fechas, enlaces, certificados, chat)
├─ components/
│  ├─ ui/              Piezas reutilizables
│  ├─ layout/          Cabecera, pie y widget del chat
│  └─ sections/        Una sección del portafolio por archivo
├─ scripts/            Interactividad en TypeScript (filtros, visor, diálogo, chat…)
├─ layouts/  pages/  styles/
worker/                Worker de Cloudflare: POST /api/chat
tests/                 unit (Vitest) · e2e (Playwright)
```

Flujo de datos: `content/` → `data/portfolio.ts` (único punto que consulta colecciones) → props → componentes. Cada sección es independiente: agregar o quitar una no afecta a las demás.

### El asistente

- En el build se genera `/knowledge.json` con todo el perfil, a partir de las mismas colecciones que la página. Al agregar contenido, el asistente lo conoce sin tocar nada más.
- **Motor local** (`src/lib/chat/engine.ts`): responde en el navegador de forma determinista, sin red. Cruza tecnologías con experiencia y proyectos («¿tiene experiencia con React?»).
- **Modelo de lenguaje** (`worker/index.ts`): `POST /api/chat` usa Workers AI con el perfil como contexto. Si falla o se agota la cuota gratuita, el navegador recurre al motor local. El modelo se cambia en `wrangler.jsonc` (`CHAT_MODEL`).

## Despliegue

Cloudflare Workers Builds, conectado a este repositorio: cada push construye (`pnpm build`) y publica (`wrangler deploy`) según `wrangler.jsonc`. GitHub Actions ejecuta formato, lint, tests y build en cada push y pull request.

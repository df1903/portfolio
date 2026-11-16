# Portafolio — Daniel Franco

Sitio personal de [Daniel Felipe Franco Rincón](https://github.com/df1903): presentación, experiencia, proyectos, tecnologías, habilidades, estudios, certificaciones y contacto, en **español e inglés**, con un asistente que responde preguntas sobre el perfil y la actividad de GitHub en vivo.

Sitio estático generado con **Astro 6 + TypeScript + Tailwind CSS 4**, sin frameworks de cliente, desplegado en **Cloudflare Workers** (assets estáticos + un Worker mínimo para `/api/*`).

## Comandos

| Comando           | Qué hace                                       |
| :---------------- | :--------------------------------------------- |
| `pnpm install`    | Instala dependencias                           |
| `pnpm dev`        | Servidor de desarrollo en `localhost:4321`     |
| `pnpm build`      | Genera el sitio en `dist/`                     |
| `pnpm preview`    | Sirve `dist/` localmente                       |
| `pnpm lint`       | ESLint                                         |
| `pnpm format`     | Prettier (escribe)                             |
| `pnpm test`       | Tests unitarios (Vitest) con cobertura         |
| `pnpm test:e2e`   | Tests de humo (Playwright, escritorio y móvil) |
| `pnpm worker:dev` | Sitio + Worker en local (`localhost:8787`)     |

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

| Qué         | Dónde                                                        |
| :---------- | :----------------------------------------------------------- |
| Tecnología  | bloque nuevo en `src/content/technologies/technologies.yaml` |
| Habilidad   | bloque nuevo en `src/content/skills/skills.yaml`             |
| Experiencia | archivo nuevo en `src/content/experience/`                   |
| Estudio     | archivo nuevo en `src/content/studies/`                      |
| Sobre mí    | `src/content/about/about.md`                                 |

Los iconos son de [Iconify](https://icon-sets.iconify.design) (colecciones `simple-icons` y `mdi`).

### Traducciones

El contenido base es español. Cada entrada admite un bloque opcional `en` con los mismos campos de texto:

```yaml
title: Mi proyecto
summary: Resumen en español.
en:
  title: My project
  summary: Summary in English.
```

Lo que no se traduzca se muestra en español en la versión inglesa, así que una entrada nueva nunca rompe `/en/`. Los textos de interfaz (menú, botones, títulos de sección) están en `src/i18n/ui.ts`; TypeScript exige que ambos idiomas tengan las mismas claves.

### Datos de contacto y del sitio

`src/data/site.ts`: nombre, correo, WhatsApp, LinkedIn, GitHub, ruta del CV y URL pública. Un canal sin dato no se muestra.

WhatsApp admite tres formas: `whatsappUrl` (el enlace que genera la app al compartir tu usuario), `whatsappNumber` (expone el número) o solo `whatsappUsername` (la tarjeta copia el usuario, sin exponer el número).

## Arquitectura

```
src/
├─ content/            Contenido tipado (una colección por sección)
├─ content.config.ts   Esquemas Zod de las colecciones
├─ i18n/               Idiomas soportados y textos de interfaz
├─ data/               Config del sitio y carga de colecciones → modelos de vista (portfolio.ts)
├─ lib/                Funciones puras con tests (fechas, enlaces, certificados, chat, GitHub)
├─ components/
│  ├─ ui/              Piezas reutilizables
│  ├─ layout/          Cabecera, pie y widget del chat
│  ├─ sections/        Una sección del portafolio por archivo
│  └─ PortfolioPage    La página completa, igual para todos los idiomas
├─ scripts/            Interactividad en TypeScript (filtros, visor, diálogo, chat…)
├─ layouts/  styles/
└─ pages/              `/` (español) y `/en/` (inglés), cada una con su `knowledge.json`
worker/                Worker de Cloudflare: /api/chat y /api/github
tests/                 unit (Vitest) · e2e (Playwright)
```

Flujo de datos: `content/` → `data/portfolio.ts` (único punto que consulta colecciones, ya resuelto a un idioma) → props → componentes. Cada sección es independiente: agregar o quitar una no afecta a las demás.

### El asistente

- En el build se genera un `knowledge.json` por idioma con todo el perfil, a partir de las mismas colecciones que la página. Al agregar contenido, el asistente lo conoce sin tocar nada más.
- **Motor local** (`src/lib/chat/engine.ts`): responde en el navegador de forma determinista, sin red. Cruza tecnologías con experiencia y proyectos («¿tiene experiencia con React?»).
- **Modelo de lenguaje** (`worker/index.ts`): `POST /api/chat` usa Workers AI con el perfil como contexto. Si falla o se agota la cuota gratuita, el navegador recurre al motor local. El modelo se cambia en `wrangler.jsonc` (`CHAT_MODEL`).

### Actividad de GitHub

Bloque al final de Proyectos, con dos fuentes independientes; si ninguna responde, el bloque no aparece.

- **Repositorios recientes**: API pública de GitHub desde el navegador. No requiere configuración.
- **Calendario de contribuciones**: `GET /api/github` en el Worker, porque esa API exige un token y un token no puede ir al navegador. Para activarlo:
  1. Crea un token en GitHub → Settings → Developer settings → _Fine-grained tokens_, con acceso solo a repositorios públicos y **sin permisos adicionales** (solo lectura).
  2. Guárdalo como secreto del Worker: `pnpm exec wrangler secret put GITHUB_TOKEN` (o en el panel de Cloudflare → Worker `portfolio` → Settings → Variables and Secrets).

  El token nunca se escribe en el repositorio. La respuesta se guarda 6 horas en la caché del edge.

## Despliegue

Cloudflare Workers Builds, conectado a este repositorio: cada push construye (`pnpm build`) y publica (`wrangler deploy`) según `wrangler.jsonc`. GitHub Actions ejecuta formato, lint, tests y build en cada push y pull request.

# Proyectos

## 1. SIMACAD-Edge

- **Repo**: https://github.com/df1903/simacad
- **Demo**: no tiene
- **Descripción**: Prototipo embebido de seguridad y monitoreo integrado para micro data centers edge. Combina control de acceso RFID, detección de gas CO con ventilación automática, detección de intrusión PIR y logging persistente en SQLite con dashboard SCADA en Python.
- **Tecnologías**:
  - Lenguajes: Python (68.8%), C++ (31.2%)
  - Hardware: Arduino UNO (ATmega328P)
  - Backend: Python 3.10+, pyserial, sqlite3
  - GUI: CustomTkinter, Matplotlib, Pillow
  - Firmware: C++ vía PlatformIO
  - Base de datos: SQLite 3
  - Comunicación: Serial UART 9600 bps
- **Features clave**:
  - Control de acceso por tarjeta RFID con tracking de ocupación
  - Detección de monóxido de carbono con activación automática de ventilador
  - Detección de movimiento PIR con lógica anti-tailgating
  - Dashboard en tiempo real con histórico y estadísticas
  - Registro de eventos (accesos, alarmas, lecturas ambientales)
  - Modo simulación (testing sin hardware físico)
  - Interfaz SCADA multi-tab (Dashboard, Histórico, Estadísticas, Configuración)
  - Referencia a estándares ASHRAE TC 9.9
- img: src/assets/projects/project-simacad-edge.webp

---

## 2. PDC_FINAL

- **Repo**: https://github.com/df1903/PDC_FINAL
- **Demo**: no tiene (resultados en CSV benchmark + reporte técnico PDF)
- **Descripción**: Proyecto de computación de alto rendimiento (HPC) que implementa búsqueda aleatoria multinivel sobre un simplex 3D para maximizar AUC en clasificación binaria de muestras metagenómicas. Introduce paralelismo progresivo a través de múltiples paradigmas computacionales (multicore, OpenMP, MPI, CUDA).
- **Tecnologías**:
  - Python (45.6%) — baseline y versión multicore
  - C (25.4%) — paralelización OpenMP y MPI
  - CUDA (4.3%) — aceleración GPU vía Google Colab
  - Jupyter Notebook (21.3%) — desarrollo interactivo
  - Shell & Makefile — automatización de build
- **Features clave**:
  - Baseline secuencial + multicore en Python
  - Paralelismo OpenMP (memoria compartida, CPU)
  - MPI (memoria distribuida, multi-nodo)
  - Kernel CUDA (aceleración GPU)
  - Framework de benchmarking con métricas de desempeño entre implementaciones
  - Protocolo de validación de consistencia AUC (ΔAUC < 1e-4)
  - Sistema de trazabilidad con logging automático de sesiones de agente IA
  - Búsqueda sobre simplex de pesos (W₁, W₂, W₃) optimizando Score = A @ (W₁·T + W₂·S + W₃·F) sobre 10 muestras metagenómicas (5 sanas, 5 enfermas)
- img: src/assets/projects/project-pdc-final.webp

---

## 3. iit-partitioning

- **Repo**: https://github.com/df1903/iit-partitioning
- **Demo**: no tiene (repositorio de investigación, sin hosting externo)/
- **Descripción**: Implementaciones experimentales para el cálculo de particiones mínimas de información (MIP) dentro del marco de la Teoría de Información Integrada (IIT), con dos familias de algoritmos.
- **Tecnologías**:
  - Python (83.7%), TeX (16.3%)
  - Dependencias clave: NumPy, Pandas, SciPy, PyPhi, OpenPyXL, Pyinstrument, Colorama
  - Requiere Python ≥3.12, gestor de paquetes `uv`
- **Features clave**:
  - **QNodes**: bipartición usando algoritmo de Queyranne con evaluación lazy-oracle
  - **KQNodes**: extensión greedy para k-particiones
  - **GeoMIP**: bipartición geométrica sobre hipercubo de Hamming
  - **KGeoMIP**: extensión divisiva E4/aglomerativa para k-partición
  - Suite de tests comparando resultados contra PyPhi y búsqueda exhaustiva en redes pequeñas
  - Entrada de datos vía Excel (matrices de probabilidad de transición TPM)
  - Utilidades de benchmarking y notas de implementación de los algoritmos
- img: src/assets/projects/project-iit-partitioning.webp

---

## 4. Pet Connect

- **Repo**: https://github.com/df1903/pet-connect
- **Demo**: no tiene
- **Estado**: completado
- **Descripción**: Solución de base de datos para una red social de mascotas con funcionalidad de marketplace integrado, pensada para ayudar a dueños a encontrar lugares y personas para socializar con sus mascotas.
- **Tecnologías**:
  - SQL (MySQL Workbench)
  - MongoDB
  - JSON
  - Tags: mysql, json, sql, database, mongodb, university, nosql, mysql-database
- **Features clave**:
  - Base de datos relacional con modelo entidad-relación y modelo relacional completo
  - Implementación de base de datos no relacional (MongoDB)
  - Scripts SQL completos
  - Scripts JSON para MongoDB con datos de ejecución
  - Diseño dual SQL/NoSQL, con fines educativos/universitarios
- img: src/assets/projects/project-pet-connect.webp

---

## 5. Akinmueble (plataforma inmobiliaria, arquitectura microservicios)

Proyecto único compuesto por 4 repos separados (frontend + 3 microservicios). Agrupados aquí porque conforman un mismo sistema.

- **Demo**: ninguno de los 4 repos tiene demo público
- **Descripción general**: Plataforma inmobiliaria (real estate) construida con arquitectura de microservicios en backend y frontend Angular independiente. Cubre gestión de propiedades, seguridad/autenticación, y notificaciones.
- **Stack tecnológico combinado**: TypeScript (dominante en los 3 microservicios y frontend), Angular 15 (frontend), LoopBack 4 (los 3 microservicios), MongoDB (seguridad), MySQL (business logic), C# (parte de notifications), SendGrid + AWS (notifications), Docker, OpenAPI, ESLint/Prettier, Mocha.

### 5.1 Frontend

- **Repo**: https://github.com/df1903/frontend-akinmueble
- Angular 15.2.6, TypeScript 62.7% / HTML 27% / CSS 10.3%
- Exploración de listados de propiedades, UI interactiva, diseño responsive

### 5.2 ms-security-akinmueble

- **Repo**: https://github.com/df1903/ms-security-akinmueble
- TypeScript 96.6%, LoopBack 4, MongoDB
- Autenticación, protección de datos de usuario, migraciones de BD, generación OpenAPI, Docker

### 5.3 ms-business-logic-akinmueble

- **Repo**: https://github.com/df1903/ms-business-logic-akinmueble
- TypeScript 98.8%, LoopBack 4, MySQL
- Lógica de negocio de propiedades inmobiliarias, OpenAPI, Docker, migraciones

### 5.4 ms-notifications-akinmueble

- **Repo**: https://github.com/df1903/ms-notifications-akinmueble
- C#/TypeScript, LoopBack, SendGrid, AWS
- Gestión y entrega de notificaciones para engagement de usuarios

- img: src/assets/projects/project-akinmueble.webp

---

## 6. Algorithm Complexity Analyzer (backend + frontend)

Proyecto único, 2 repos (backend analizador + frontend chat-like). Académico, Análisis y Diseño de Algoritmos, Universidad de Caldas.

- **Demo**: ninguno de los 2 repos tiene demo público
- **Descripción general**: Sistema inteligente de análisis automatizado de complejidad computacional de algoritmos escritos en pseudocódigo. Usa parsing (Lark) + agentes basados en Claude API para determinar complejidad en notación Big O, Omega y Theta. Interfaz web tipo chat para enviar pseudocódigo y ver el AST/resultado estructurado.

### 6.1 Backend — algorithm-analysis

- **Repo**: https://github.com/df1903/algorithm-analysis
- **Tecnologías**: Python 3.10+, FastAPI, Lark (parsing de gramática), Anthropic Claude API, Supabase (caché), Pydantic, Uvicorn
- **Features clave**:
  - Análisis automático de algoritmos recursivos e iterativos
  - Soporte pseudocódigo estilo Pascal (FOR, WHILE, REPEAT, IF-THEN-ELSE)
  - Detección inteligente de casos unificados, evita análisis redundante
  - Reducción de costo de API ~96% vía sistema de caché con Supabase
  - Generación de diagramas de flujo Mermaid
  - Traducción de lenguaje natural a pseudocódigo
  - 4 técnicas de resolución matemática: Teorema Maestro, sustitución, análisis de sumatorias, árboles de recursión
  - Arquitectura de dos fases: extracción (pseudocódigo a ecuaciones matemáticas) y resolución
  - Testing validado con 11 algoritmos (Factorial a Insertion Sort)
  - Endpoints documentados: `/analyzer/ast`, `/analyzer/natural-to-pseudocode`

### 6.2 Frontend — front-algorithm-analysis

- **Repo**: https://github.com/df1903/front-algorithm-analysis
- **Tecnologías**: React + TypeScript, Vite, Tailwind CSS v4, ESLint
- **Features clave**:
  - Interfaz tipo chat, tema oscuro por defecto, diseño responsive
  - Sidebar de sesiones: crear, seleccionar, renombrar
  - Títulos editables (click en header o doble-click en sidebar)
  - Header y sidebar fijos, área de contenido con scroll
  - Renderizado de bloques de código JSON para respuestas del analizador
  - Conecta a backend en `http://127.0.0.1:8000/api/analyzer/ast`

- img: src/assets/projects/project-algorithm-analyzer.webp

---

## 7. Medical Center (business logic backend)

- **Repo**: https://github.com/df1903/medical-center
- **Demo**: no tiene
- **Nota**: README casi vacío, información extraída de estructura real (package.json, carpetas)
- **Descripción**: Backend de lógica de negocio para gestión de centro médico. Sin descripción formal documentada en README, pero estructura y dependencias apuntan a sistema de gestión con autenticación, generación de documentos y automatización de tareas.
- **Tecnologías**:
  - TypeScript 100%, Node.js
  - Express (framework backend)
  - Prisma ORM (base de datos)
  - bcrypt (encriptación/autenticación)
  - Nodemailer (envío de correos)
  - Puppeteer (automatización de navegador)
  - Multer (subida de archivos)
  - node-cron (tareas programadas)
  - axios (peticiones HTTP)
  - PDFKit (generación de documentos PDF)
- **Features clave (inferidas de stack y estructura)**:
  - Gestión de datos de centro médico (carpetas `data`, `prisma`, `src`)
  - Autenticación de usuarios (bcrypt)
  - Generación de documentos/reportes en PDF (PDFKit + Puppeteer)
  - Notificaciones por correo (Nodemailer)
  - Tareas programadas/automatizadas (node-cron)
  - Subida de archivos (Multer)
- img: src/assets/projects/project-medical-center.webp

---

## 8. Escuelas Familiares (backend + frontend)

Proyecto único, 2 repos.

- **Demo**: ninguno de los 2 repos tiene demo público
- **Descripción general**: Plataforma para fortalecer la relación entre familias y escuelas mediante un enfoque interdisciplinario. Facilita acceso y gestión de información educativa para docentes, practicantes y directivos, consolidando un repositorio estructurado de informes de práctica, materiales educativos y artículos de investigación.

### 8.1 Backend

- **Repo**: https://github.com/df1903/backend-escuelas-familiares
- **Tecnologías**: Node.js v22.12.0, NestJS, TypeScript, MongoDB, ESLint/Prettier, Docker, GitHub Actions
- **Features clave**:
  - API RESTful con NestJS
  - Persistencia de datos en MongoDB
  - Notificaciones por correo vía Mailsend
  - Almacenamiento de archivos vía Supabase
  - Workflows automatizados (GitHub Actions)
  - Infraestructura de testing

### 8.2 Frontend

- **Repo**: https://github.com/df1903/frontend-escuelas-familiares
- **Tecnologías**: React + TypeScript, Vite, Tailwind CSS
- **Features clave**:
  - Gestión de información para múltiples roles (docentes, estudiantes practicantes, directivos)
  - Repositorio de informes de práctica y materiales educativos
  - Colección y organización de artículos de investigación
  - Sistema de datos estructurado
- img: src/assets/projects/project-escuelas-familiares.webp

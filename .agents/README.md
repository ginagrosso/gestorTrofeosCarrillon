# AI Agent Skills Index

## Purpose
Este README sirve como índice y guía rápida para los *skill agents* disponibles en `.agents/skills`.
Los skills contienen reglas, plantillas y referencias que los agentes usan para responder y ejecutar tareas relacionadas.

## Uso rápido
1. Identificar la intención del pedido.
2. Buscar el skill más relevante dentro de `.agents/skills/`.
3. Abrir su `SKILL.md` y aplicar las convenciones locales.

## Skills disponibles

### Del stack Firebase (reutilizados — ver links simbólicos en `.claude/skills/`)
- `firebase-basics/` — setup, CLI, autenticación Firebase, proyectos.
- `firebase-auth-basics/` — autenticación con Firebase Auth.
- `firebase-firestore/` — Firestore: modelos, queries, reglas de seguridad.
- `firebase-hosting-basics/` — deploy en Firebase Hosting.
- `firebase-security-rules-auditor/` — auditoría de reglas de seguridad.

### De este proyecto
- `cloud-functions-mvc/` — arquitectura MVC en Cloud Functions: modules, schemas Zod, repositories, services, controllers, routes.
- `react-fsd/` — Feature-Sliced Design con React + Vite + TypeScript.
- `commits/` — convenciones de commits para este proyecto.

## Cómo agregar un nuevo skill
1. Crear una carpeta en `.agents/skills/<nombre>`.
2. Incluir al menos `SKILL.md` describiendo el propósito y límites del skill.
3. Añadir `rules.md` si hay reglas operativas y `templates.md` si hay plantillas.
4. Registrar el nuevo skill en este README.

## Buenas prácticas
- Leer `SKILL.md` y `rules.md` antes de ejecutar cambios.
- Mantener los cambios pequeños y enfocados.
- Si un skill necesita actualización, editar su `SKILL.md`.

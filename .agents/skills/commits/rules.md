# Commit Rules — Gestor Trofeos Carrillon

## Principios

1. Los commits son atómicos — un cambio lógico por commit.
2. El historial es documentación del proyecto.
3. Commits escritos en **español neutro**.

## Tipos permitidos (convención mApache)

| Tipo | Cuándo usarlo |
|---|---|
| `add` | Nueva feature, archivo o funcionalidad |
| `fix` | Corrección de bug |
| `update` | Modificación de algo existente |
| `deleted` | Eliminación de feature, archivo o código |
| `refactor` | Reestructura sin cambio de comportamiento |
| `revert` | Revertir un commit anterior |
| `docs` | Documentación, comentarios, READMEs |

## Formato

```
<tipo>(<scope>): <descripción corta en español>

[cuerpo opcional — explicar el POR QUÉ, no el QUÉ]

[footer opcional — BREAKING CHANGE: descripción]
```

- Línea de asunto: máximo 72 caracteres
- Scope: nombre del módulo o capa (`articulos`, `clientes`, `auth`, `fsd`, `functions`, `shared`)

## DO

- Stagear archivos explícitamente — evitar `git add .` sin revisar.
- Incluir el scope cuando el cambio es específico de un módulo.
- Documentar breaking changes en el footer.

## DO NOT

- Mensajes vagos: `fix`, `update`, `cambios`, `wip`, `temp`.
- Asunto de más de 72 caracteres.
- Commitear secrets, tokens, `.env` reales, build artifacts.
- Mezclar refactors con features en el mismo commit.

# Commit Agent Instructions

## Purpose
Crear commits atómicos, trazables y alineados con las convenciones del proyecto.

## Scope
Aplica a cambios en código fuente, documentación, configuración e infraestructura.

## Responsabilidades

### 1. Analizar cambios antes de commitear
- Revisar todos los archivos modificados.
- Agrupar cambios relacionados en un solo commit.
- Separar cambios no relacionados en commits distintos.

### 2. Validar el estado del código
- El código debe compilar antes de commitear.
- No commitear builds rotos salvo instrucción explícita.

### 3. Evitar ruido
- Excluir temporales, logs, configs locales, build outputs.
- Respetar `.gitignore`.

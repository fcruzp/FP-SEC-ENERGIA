# Secretaría de Energía · Fuerza del Pueblo

Portal institucional y **Observatorio Energético** con datos oficiales del sector eléctrico dominicano (Ministerio de Energía y Minas).

- **[Guía de operación](GUIA-OPERACION.md)**: enlaces de GitHub (Actions, secrets), Supabase, Netlify, copias de seguridad y cómo cargar una edición nueva del MEM.
- **[Plan de profesionalización](PLAN-PROFESIONALIZACION.md)**: fases del proyecto y avance.

## Desarrollo local

Requiere [Bun](https://bun.sh) y un archivo `.env.local` con las variables de Supabase y del panel de administración (ver la guía de operación).

```bash
bun install
```

```bash
bunx next dev -p 3000
```

```bash
bun test tests
```

Sitio en http://localhost:3000.

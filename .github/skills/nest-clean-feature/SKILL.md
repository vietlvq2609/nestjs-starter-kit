---
name: nest-clean-feature
description: Scaffold a new NestJS feature module following the project's Clean Architecture conventions.
version: 1.0.0
triggers:
  keywords:
    - scaffold
    - new module
    - add feature
    - create feature
    - generate module
parameters:
  - name: FeatureName
    description: >
      PascalCase name for the feature (e.g. "Product", "Order").
      All other casing variants are derived from this value:
        - PascalCase  → {{FeatureName}}   (e.g. Product)
        - camelCase   → {{featureName}}   (e.g. product)
        - kebab-case  → {{feature-name}}  (e.g. product)
    required: true
---

# Skill: Scaffold a Clean Architecture Feature Module

## Overview

This skill generates a fully wired NestJS library module under
`libs/modules/{{feature-name}}/` that follows the project's three-layer
Clean Architecture:

```
Domain  ←  Application  ←  Infrastructure
```

Dependencies only ever point **inward** toward the Domain.
See `resources/arch-rules.md` for the full dependency rules.

---

## Step-by-step Plan

### 1 — Create the library directory tree

```
libs/modules/{{feature-name}}/
├── tsconfig.lib.json
└── src/
    ├── index.ts
    ├── {{feature-name}}.module.ts
    ├── domain/
    │   ├── entities/
    │   │   └── {{feature-name}}.entity.ts
    │   └── repositories/
    │       └── {{feature-name}}.repository.interface.ts
    ├── application/
    │   └── services/
    │       └── {{feature-name}}.service.ts
    └── infrastructure/
        └── persistence/
            └── drizzle-{{feature-name}}.repository.ts
```

### 2 — Generate each file from a template

| File                                                                | Template                                |
| ------------------------------------------------------------------- | --------------------------------------- |
| `domain/entities/{{feature-name}}.entity.ts`                        | `templates/entity.ts.txt`               |
| `domain/repositories/{{feature-name}}.repository.interface.ts`      | `templates/repository.interface.ts.txt` |
| `application/services/{{feature-name}}.service.ts`                  | `templates/service.ts.txt`              |
| `infrastructure/persistence/drizzle-{{feature-name}}.repository.ts` | `templates/drizzle-repository.ts.txt`   |
| `src/index.ts`                                                      | `templates/index.ts.txt`                |

Replace every placeholder token before writing:

| Token              | Value                   |
| ------------------ | ----------------------- |
| `{{FeatureName}}`  | PascalCase feature name |
| `{{featureName}}`  | camelCase feature name  |
| `{{feature-name}}` | kebab-case feature name |

### 3 — Create `tsconfig.lib.json`

```jsonc
// libs/modules/{{feature-name}}/tsconfig.lib.json
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "outDir": "../../../dist/libs/modules/{{feature-name}}",
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"],
}
```

> **Note:** The path `extends` uses three levels (`../../../`) because the
> file lives at `libs/modules/{{feature-name}}/tsconfig.lib.json`.

### 4 — Register the path alias in the root `tsconfig.json`

Add the following entry inside `compilerOptions.paths`:

```jsonc
"@app/{{feature-name}}": ["./libs/modules/{{feature-name}}/src/index.ts"]
```

### 5 — Create the NestJS module file

Wire the Drizzle repository to the repository interface token and expose the
service:

```typescript
// libs/modules/{{feature-name}}/src/{{feature-name}}.module.ts
import { Module } from '@nestjs/common';
import { {{FeatureName}}RepositoryInterface } from './domain/repositories/{{feature-name}}.repository.interface';
import { Drizzle{{FeatureName}}Repository } from './infrastructure/persistence/drizzle-{{feature-name}}.repository';
import { {{FeatureName}}Service } from './application/services/{{feature-name}}.service';

@Module({
  providers: [
    {
      provide: {{FeatureName}}RepositoryInterface.TOKEN,
      useClass: Drizzle{{FeatureName}}Repository,
    },
    {{FeatureName}}Service,
  ],
  exports: [{{FeatureName}}Service],
})
export class {{FeatureName}}Module {}
```

### 6 — Add a Drizzle schema (if needed)

Create `libs/database/src/schema/{{feature-name}}.schema.ts` and export it
from `libs/database/src/schema/index.ts` so the `DRIZZLE_CLIENT` picks it up
automatically.

### 7 — Import the new module in `ApiModule` (or another host module)

```typescript
// apps/api/src/api.module.ts
import { {{FeatureName}}Module } from '@app/{{feature-name}}';

@Module({
  imports: [/* ... */, {{FeatureName}}Module],
})
export class ApiModule {}
```

---

## Validation Checklist

- [ ] Entity has no framework imports (pure TypeScript class).
- [ ] Repository interface lives in the Domain layer and has no infrastructure imports.
- [ ] Service imports the repository via the injection token, not the concrete class.
- [ ] Drizzle repository imports `DRIZZLE_CLIENT` from `@app/database`.
- [ ] All cross-library imports use path aliases (`@app/...`), never relative `../` escapes.
- [ ] `tsconfig.lib.json` extends the root `tsconfig.json` with the correct relative depth.
- [ ] Validation schemas (Zod) live in the Application layer (e.g. inside `application/dto/`).

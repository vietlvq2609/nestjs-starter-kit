# Architecture Rules — NestJS Clean Architecture

This document defines the dependency rules enforced across all feature modules
in `libs/modules/`. Every new module scaffolded by the `nest-clean-feature`
skill **must** respect these rules.

---

## Dependency Direction

```
┌──────────────────────────────────────────────────────┐
│  Infrastructure  →  Application  →  Domain            │
│  (Drizzle repos)    (Services)      (Entities,        │
│                                      Repo interfaces) │
└──────────────────────────────────────────────────────┘
         Dependencies only point INWARD (→)
```

- **Domain** has zero dependencies on any other layer or framework.
- **Application** may depend on Domain only.
- **Infrastructure** may depend on Application and Domain, plus external
  libraries (`drizzle-orm`, `@app/database`).

---

## Layer Responsibilities

### Domain Layer (`domain/`)

| Artefact                               | Rule                                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| Entity (`entities/`)                   | Pure TypeScript class. No `@nestjs/*`, no ORM, no Zod. Encapsulates business invariants. |
| Repository Interface (`repositories/`) | TypeScript `interface` + a `Symbol` injection token. No infrastructure imports.          |

### Application Layer (`application/`)

| Artefact                  | Rule                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Service (`services/`)     | `@Injectable()` NestJS service. Receives the repository via its injection token (`@Inject`). **Never** imports the concrete Drizzle class. |
| DTO / Validation (`dto/`) | Zod schemas live here. Parse at the service boundary before passing data to the domain.                                                    |

### Infrastructure Layer (`infrastructure/`)

| Artefact                            | Rule                                                                                                                                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drizzle Repository (`persistence/`) | Implements the Domain repository interface. Receives `DRIZZLE_CLIENT` from `@app/database` via `@Inject`. Maps ORM rows → Domain entities in a private `toEntity()` helper. |

---

## Import / Path Rules

1. **Always use path aliases** — never use `../` escapes across library
   boundaries.

   | Alias                 | Resolves to                                |
   | --------------------- | ------------------------------------------ |
   | `@app/common`         | `libs/common/src/index.ts`                 |
   | `@app/database`       | `libs/database/src/index.ts`               |
   | `@app/iam`            | `libs/modules/iam/src/index.ts`            |
   | `@app/<feature-name>` | `libs/modules/<feature-name>/src/index.ts` |

2. **Intra-module relative imports** (`../../domain/...`) are only allowed
   _within the same library_.

3. **Cross-library imports** must always go through the barrel (`index.ts`) of
   the target library, never directly into its subdirectories.

---

## Module Wiring Rules

- The NestJS module file (`<feature-name>.module.ts`) is the **only** place
  that binds a concrete Infrastructure class to a Domain token:

  ```typescript
  {
    provide: ExampleRepositoryInterface.TOKEN,
    useClass: DrizzleExampleRepository,
  }
  ```

- Services and other Application-layer classes are never aware of the
  concrete repository class.

---

## Validation Rules

- Input validation is performed with **Zod** at the Application layer
  (inside services or dedicated DTO files under `application/dto/`).
- Domain entities do **not** carry Zod schemas.
- Infrastructure layer does **not** duplicate validation — it trusts that the
  Application layer has already validated the data.

---

## TypeScript Configuration Rules

- Every new library module must have its own `tsconfig.lib.json` that:
  - `extends` the root `tsconfig.json` with the correct relative depth.
  - Declares its own `outDir` under `dist/libs/modules/<feature-name>/`.
  - Excludes test and spec files.

  ```jsonc
  {
    "extends": "../../../tsconfig.json",
    "compilerOptions": {
      "declaration": true,
      "outDir": "../../../dist/libs/modules/<feature-name>",
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "test", "**/*spec.ts"],
  }
  ```

- The root `tsconfig.json` must be updated with the new path alias whenever a
  new library is added.

---

## Checklist Before Merging a New Feature Module

- [ ] Entity contains no framework or ORM imports.
- [ ] Repository interface contains no infrastructure imports.
- [ ] Service injects via the Symbol token, not the concrete class.
- [ ] Drizzle repository implements the domain interface and uses `DRIZZLE_CLIENT` from `@app/database`.
- [ ] All Drizzle schema changes are added to `libs/database/src/schema/` and exported from its `index.ts`.
- [ ] Path alias registered in root `tsconfig.json`.
- [ ] `tsconfig.lib.json` extends root config with correct depth.
- [ ] No cross-library relative-path imports.
- [ ] Zod schemas are in the Application layer only.

# Project Context

## 📅 Current Status
**Initialization Phase**
The project is currently in the process of initializing the Memory Bank documentation. The codebase is established with a robust architecture (Microkernel) and numerous implemented modules. The immediate focus is on documenting the existing system to facilitate future development and maintenance.

## 🚧 Recent Changes
- **Memory Bank Setup:** Creating core documentation files (`brief.md`, `product.md`, `context.md`, `architecture.md`, `tech.md`) to capture the project's state.
- **Analysis:** Analyzed `package.json`, `MANUAL_TECNICO_DESARROLLO_QA.md`, and project structure to understand the architecture and stack.
- **UploadFileV3 Enhancements:** Implemented advanced UI/UX enhancements including solid border with hover effects, updated placeholder messages, "+" icon for adding files, and improved drag-and-drop functionality.
- **Build Fixes:** Resolved InstantDB build issues by moving initialization inside hooks and preventing server-side execution of client-only queries. Fixed ESLint serialization error by disabling ESLint during builds.

## 🔭 Next Steps
1.  **Complete Documentation:** Finalize `architecture.md` and `tech.md`.
2.  **Verification:** Review the generated Memory Bank files with the user to ensure accuracy.
3.  **Development:** Once documentation is set, proceed with any pending feature requests or bug fixes (none currently pending).

## 🧠 Key Insights
- **Microkernel Architecture:** The project relies heavily on the `src/mk/` directory. Any new module development must strictly adhere to the patterns defined there (`useCrud`, `ModCrudType`, `FieldConfig`).
- **Strict TypeScript:** The project enforces strict TypeScript rules, requiring careful typing of all components and data structures.
- **Real-time Dependency:** Features like chat and alerts depend on InstantDB and Pusher, requiring valid configuration in `.env.development`.
// Lanza scripts/verificar-niveles.ts con el cargador de módulos de Vite
// (TypeScript, JSON e import.meta.glob sin dependencias extra).
import { runnerImport } from 'vite';

const { module } = await runnerImport('/scripts/verificar-niveles.ts');
process.exitCode = module.main();

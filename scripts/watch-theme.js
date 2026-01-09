#!/usr/bin/env node

/**
 * Keycloak Theme Watcher
 *
 * Observa mudanças nos arquivos do tema Next.js e reconstrói automaticamente.
 *
 * Uso:
 *   node scripts/watch-theme.js <pasta-do-tema-nextjs> [nome-do-tema]
 *
 * Exemplo:
 *   node scripts/watch-theme.js nextjs-keycloak-theme custom-theme
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn, execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// CONFIGURAÇÕES
// ==========================================
const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");
const DEBOUNCE_MS = 1000;

// ==========================================
// UTILITÁRIOS
// ==========================================
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message, color = "reset") {
  const time = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${time}] ${message}${colors.reset}`);
}

// ==========================================
// ARGUMENTOS
// ==========================================
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
${colors.cyan}Keycloak Theme Watcher${colors.reset}

Uso:
  node scripts/watch-theme.js <nome-do-tema> [nome-output]

Os temas devem estar na pasta src/

Exemplo:
  node scripts/watch-theme.js nextjs-keycloak-theme custom-theme
  node scripts/watch-theme.js my-new-theme
`);

  if (fs.existsSync(SRC_DIR)) {
    const themes = fs
      .readdirSync(SRC_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    if (themes.length > 0) {
      console.log(`${colors.cyan}Temas disponíveis em src/:${colors.reset}`);
      themes.forEach((t) => console.log(`   • ${t}`));
      console.log();
    }
  }

  process.exit(1);
}

const themeFolder = args[0];
const themeName = args[1] || themeFolder;
const themePath = path.join(SRC_DIR, themeFolder);

if (!fs.existsSync(themePath)) {
  log(`❌ Tema não encontrado: ${themePath}`, "red");
  log(`   Os temas devem estar na pasta src/`, "yellow");
  process.exit(1);
}

const themeSrcPath = path.join(themePath, "src");
if (!fs.existsSync(themeSrcPath)) {
  log(`❌ Pasta src não encontrada: ${themeSrcPath}`, "red");
  process.exit(1);
}

// ==========================================
// REBUILD
// ==========================================
let rebuildTimeout = null;
let isBuilding = false;

function rebuild() {
  if (isBuilding) {
    log("⏳ Build em andamento, aguardando...", "yellow");
    return;
  }

  isBuilding = true;
  log(`🔄 Reconstruindo tema "${themeName}"...`, "blue");

  try {
    // Executa o script de conversão
    execSync(
      `node "${path.join(
        __dirname,
        "convert-theme.js"
      )}" "${themeFolder}" "${themeName}"`,
      {
        cwd: ROOT_DIR,
        stdio: "inherit",
      }
    );

    log(`✅ Tema "${themeName}" atualizado!`, "green");
    log(
      "💡 Reinicie o Keycloak para ver as mudanças: docker-compose restart keycloak",
      "cyan"
    );
  } catch (error) {
    log(`❌ Erro ao reconstruir: ${error.message}`, "red");
  } finally {
    isBuilding = false;
  }
}

function scheduleRebuild() {
  if (rebuildTimeout) {
    clearTimeout(rebuildTimeout);
  }
  rebuildTimeout = setTimeout(rebuild, DEBOUNCE_MS);
}

// ==========================================
// WATCHER
// ==========================================
function watchDirectory(dir) {
  const watcher = fs.watch(dir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    // Ignora arquivos que não afetam o tema
    if (
      filename.includes("node_modules") ||
      filename.includes(".next") ||
      filename.includes("out") ||
      filename.startsWith(".")
    ) {
      return;
    }

    // Só reage a arquivos relevantes
    const ext = path.extname(filename);
    if ([".tsx", ".ts", ".jsx", ".js", ".css", ".html"].includes(ext)) {
      log(`📝 Alteração detectada: ${filename}`, "yellow");
      scheduleRebuild();
    }
  });

  return watcher;
}

// ==========================================
// MAIN
// ==========================================
console.log(`
${colors.magenta}╔══════════════════════════════════════════╗
║     🎨 Keycloak Theme Watcher            ║
╚══════════════════════════════════════════╝${colors.reset}

${colors.cyan}Tema:${colors.reset}   ${themeName}
${colors.cyan}Pasta:${colors.reset}  ${themePath}
${colors.cyan}Watch:${colors.reset}  ${themeSrcPath}

${colors.yellow}Aguardando mudanças...${colors.reset}
${colors.blue}Pressione Ctrl+C para parar${colors.reset}
`);

// Build inicial
rebuild();

// Inicia o watcher
const watcher = watchDirectory(themeSrcPath);

// Cleanup ao sair
process.on("SIGINT", () => {
  log("\n👋 Encerrando watcher...", "cyan");
  watcher.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  watcher.close();
  process.exit(0);
});

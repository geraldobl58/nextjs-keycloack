#!/usr/bin/env node

import { spawn, exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Cores para console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function clearScreen() {
  process.stdout.write("\x1Bc");
}

function printBanner() {
  console.log(`${colors.cyan}${colors.bold}
╔══════════════════════════════════════════════════════════════╗
║           🎨 Keycloak Theme Development Server               ║
╠══════════════════════════════════════════════════════════════╣
║  Watching for changes...                                      ║
║  Theme updates automatically on file changes                  ║
║  Press Ctrl+C to stop                                        ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
}

// Debounce para evitar múltiplos rebuilds
let buildTimeout = null;
let isBuilding = false;
let pendingBuild = false;
let buildCount = 0;

function triggerBuild(filename = null) {
  if (buildTimeout) {
    clearTimeout(buildTimeout);
  }

  buildTimeout = setTimeout(() => {
    if (isBuilding) {
      pendingBuild = true;
      log("⏳ Build em andamento, aguardando na fila...", "yellow");
      return;
    }

    isBuilding = true;
    pendingBuild = false;
    buildCount++;

    log(`🔄 Build #${buildCount} iniciando...`, "cyan");
    if (filename) {
      log(`   Arquivo modificado: ${filename}`, "blue");
    }

    const startTime = Date.now();

    exec(
      "npm run build && node scripts/build-theme.js",
      { cwd: projectRoot, maxBuffer: 1024 * 1024 * 10 },
      (error, stdout, stderr) => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        isBuilding = false;

        if (error) {
          log(`❌ Build #${buildCount} falhou após ${duration}s`, "red");
          log(`   Erro: ${error.message}`, "red");
          if (stderr) {
            console.error(stderr.slice(0, 500));
          }

          // Se houver build pendente, executa
          if (pendingBuild) {
            log("🔁 Executando build pendente...", "yellow");
            triggerBuild();
          }
          return;
        }

        log(`✅ Build #${buildCount} concluído em ${duration}s`, "green");

        // Mostra output resumido
        const lines = stdout
          .split("\n")
          .filter(
            (l) => l.includes("✓") || l.includes("📂") || l.includes("🌍")
          );
        lines.forEach((l) => console.log(`   ${l.trim()}`));

        log("👀 Aguardando novas mudanças...\n", "cyan");

        // Se houver build pendente, executa
        if (pendingBuild) {
          log("🔁 Executando build pendente...", "yellow");
          triggerBuild();
        }
      }
    );
  }, 800); // Debounce de 800ms para evitar múltiplos builds
}

// Diretórios para observar
const watchDirs = [
  path.join(projectRoot, "src"),
  path.join(projectRoot, "public"),
];

// Extensões para observar
const watchExtensions = [
  ".tsx",
  ".ts",
  ".css",
  ".js",
  ".jsx",
  ".json",
  ".html",
];

// Limpa a tela e mostra o banner
clearScreen();
printBanner();

log("📂 Diretórios monitorados:", "blue");
watchDirs.forEach((dir) => log(`   └─ ${dir}`, "reset"));
log("📝 Extensões: " + watchExtensions.join(", "), "blue");
log("", "reset");

// Inicia o watch usando fs.watch recursivo
watchDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    log(`⚠️  Diretório não encontrado: ${dir}`, "yellow");
    return;
  }

  fs.watch(dir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    const ext = path.extname(filename);
    if (!watchExtensions.includes(ext)) return;

    triggerBuild(filename);
  });
});

// Mantém o processo rodando
process.on("SIGINT", () => {
  console.log("");
  log("👋 Watch encerrado!", "cyan");
  log(`📊 Total de builds: ${buildCount}`, "blue");
  process.exit(0);
});

// Tratamento de erros não capturados
process.on("uncaughtException", (error) => {
  log(`❌ Erro não tratado: ${error.message}`, "red");
});

process.on("unhandledRejection", (reason) => {
  log(`❌ Promise rejeitada: ${reason}`, "red");
});

// Build inicial
log("🚀 Executando build inicial...", "cyan");
exec(
  "npm run build && node scripts/build-theme.js",
  { cwd: projectRoot, maxBuffer: 1024 * 1024 * 10 },
  (error, stdout, stderr) => {
    if (error) {
      log(`❌ Erro no build inicial: ${error.message}`, "red");
      if (stderr) console.error(stderr.slice(0, 1000));
      log("⚠️  Continuando em modo watch mesmo com erro...", "yellow");
    } else {
      log("✅ Build inicial concluído!", "green");
      const lines = stdout
        .split("\n")
        .filter((l) => l.includes("✓") || l.includes("📂") || l.includes("🌍"));
      lines.forEach((l) => console.log(`   ${l.trim()}`));
    }
    log("\n👀 Aguardando mudanças...\n", "cyan");
  }
);

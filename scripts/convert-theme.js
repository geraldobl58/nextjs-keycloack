#!/usr/bin/env node

/**
 * Keycloak Theme Converter
 *
 * Converte um projeto Next.js em tema Keycloak.
 *
 * Uso:
 *   node scripts/convert-theme.js <nome-do-tema> [nome-output]
 *
 * Os temas devem estar na pasta src/
 *
 * Exemplo:
 *   node scripts/convert-theme.js nextjs-keycloak-theme custom-theme
 *   node scripts/convert-theme.js my-new-theme
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// CONFIGURAÇÕES
// ==========================================
const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");
const THEMES_OUTPUT_DIR = path.join(ROOT_DIR, "themes");
const LOCALES = ["en", "pt_BR"];

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
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Busca arquivos CSS recursivamente em um diretório
 */
function findCssFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findCssFiles(fullPath, files);
    } else if (entry.name.endsWith(".css")) {
      files.push(fullPath);
    }
  }
  return files;
}

// ==========================================
// EXTRAÇÃO DO HTML DO NEXT.JS
// ==========================================
function extractHtmlFromNextBuild(outDir) {
  const indexPath = path.join(outDir, "index.html");

  if (!fs.existsSync(indexPath)) {
    throw new Error(`index.html não encontrado em ${outDir}`);
  }

  let html = fs.readFileSync(indexPath, "utf-8");
  log("📄 Lendo index.html...", "blue");

  // Extrai o body
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) {
    throw new Error("Não foi possível extrair o body do HTML.");
  }

  let bodyContent = bodyMatch[1];

  // Remove scripts e elementos do Next.js
  bodyContent = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, "");
  bodyContent = bodyContent.replace(
    /<next-route-announcer[\s\S]*?<\/next-route-announcer>/gi,
    ""
  );

  // Encontra o container principal
  const cardMatch = bodyContent.match(
    /(<div[^>]*class="[^"]*max-w-md[^"]*"[^>]*>[\s\S]*)/i
  );

  if (!cardMatch) {
    throw new Error("Container principal (max-w-md) não encontrado.");
  }

  bodyContent = cardMatch[1];

  // Balanceia as tags div
  let openTags = 0;
  let result = "";
  let i = 0;

  while (i < bodyContent.length) {
    if (bodyContent.slice(i, i + 4) === "<div") {
      openTags++;
      const closeTag = bodyContent.indexOf(">", i);
      result += bodyContent.slice(i, closeTag + 1);
      i = closeTag + 1;
    } else if (bodyContent.slice(i, i + 6) === "</div>") {
      if (openTags > 0) {
        result += "</div>";
        openTags--;
        if (openTags === 0) break;
      }
      i += 6;
    } else {
      result += bodyContent[i];
      i++;
    }
  }

  while (openTags > 0) {
    result += "</div>";
    openTags--;
  }

  log(`✓ Extraídos ${result.length} caracteres de HTML`, "green");
  return result.trim();
}

// ==========================================
// EXTRAÇÃO DO CSS DO NEXT.JS
// ==========================================
function extractCssFromNextBuild(outDir) {
  let combinedCSS = "";

  // Tenta buscar CSS em arquivos
  const staticDir = path.join(outDir, "_next", "static");
  const cssFiles = findCssFiles(staticDir);

  if (cssFiles.length > 0) {
    for (const file of cssFiles) {
      const content = fs.readFileSync(file, "utf-8");
      combinedCSS += content + "\n";
    }
    log(`✓ Extraídos ${cssFiles.length} arquivo(s) CSS`, "green");
  }

  // Também extrai CSS inline do HTML (Next.js 16+ pode usar inline)
  const indexPath = path.join(outDir, "index.html");
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, "utf-8");
    const styleMatches = html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);

    let inlineCount = 0;
    for (const match of styleMatches) {
      if (match[1] && match[1].trim()) {
        combinedCSS += "\n/* Inline CSS */\n" + match[1] + "\n";
        inlineCount++;
      }
    }

    if (inlineCount > 0) {
      log(`✓ Extraídos ${inlineCount} bloco(s) de CSS inline`, "green");
    }
  }

  if (!combinedCSS.trim()) {
    log("⚠️  Nenhum CSS encontrado, usando apenas Tailwind classes", "yellow");
  }

  return combinedCSS;
}

// ==========================================
// CSS DE RESET DO KEYCLOAK
// ==========================================
function getKeycloakResetCSS() {
  return `
/* Reset do Keycloak */
#kc-header, #kc-header-wrapper, .kc-logo-text,
.login-pf-page::before, .login-pf-page::after,
.pf-c-login__header, .pf-c-login__footer, .pf-c-brand,
#kc-locale, .kc-social-links {
  display: none !important;
}

html, body, .login-pf-page, .login-pf, #kc-content, #kc-content-wrapper,
#kc-container, #kc-container-wrapper, .pf-c-login, .pf-c-login__container,
.pf-c-login__main, .pf-c-login__main-body, .pf-c-login__main-footer,
.pf-c-card, .pf-c-card__body, .card-pf {
  background: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  box-shadow: none !important;
}

#kc-form-wrapper, #kc-form, .kc-form-card, .form-group {
  max-width: 100% !important;
  background: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
}

.pf-c-button, .btn, .btn-primary, .btn-default, .btn-lg {
  all: unset !important;
}

#kc-container {
  min-height: 100vh !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
`;
}

// ==========================================
// CONVERSÃO HTML -> FTL
// ==========================================
function convertHtmlToFtl(html) {
  let ftl = html;

  log("🔧 Convertendo HTML para FTL...", "blue");

  // Formulário
  ftl = ftl.replace(
    /<form[^>]*class="([^"]*)"[^>]*>/gi,
    '<form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post" class="$1">'
  );

  ftl = ftl.replace(/<form[^>]*>/gi, (match) => {
    if (match.includes("kc-form-login")) return match;
    return '<form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">';
  });

  // Input username
  ftl = ftl.replace(
    /(<input[^>]*id="username"[^>]*)(\/?>)/gi,
    (match, before, end) => {
      let result = before;
      if (!result.includes('name="')) result += ' name="username"';
      if (result.includes("value=")) {
        result = result.replace(
          /value="[^"]*"/,
          "value=\"${(login.username!'')}\""
        );
      } else {
        result += " value=\"${(login.username!'')}\"";
      }
      return result + end;
    }
  );

  // Input password
  ftl = ftl.replace(
    /(<input[^>]*id="password"[^>]*)(\/?>)/gi,
    (match, before, end) => {
      if (!before.includes('name="')) {
        return before + ' name="password"' + end;
      }
      return match;
    }
  );

  // Checkbox remember me
  ftl = ftl.replace(
    /(<input[^>]*type="checkbox"[^>]*)(\/?>)/gi,
    (match, before, end) => {
      let result = before;
      if (!result.includes('id="')) result += ' id="rememberMe"';
      if (!result.includes('name="')) result += ' name="rememberMe"';
      result += " <#if login.rememberMe??>checked</#if>";
      return result + end;
    }
  );

  // Botão submit
  ftl = ftl.replace(
    /<button([^>]*)type="submit"([^>]*)>([\s\S]*?)<\/button>/gi,
    '<button$1type="submit" name="login" id="kc-login"$2>${msg("doLogIn")}</button>'
  );

  // Links
  ftl = ftl.replace(/href="#register"/gi, 'href="${url.registrationUrl}"');
  ftl = ftl.replace(
    /href="#forgot-password"/gi,
    'href="${url.loginResetCredentialsUrl}"'
  );

  // Hidden field
  ftl = ftl.replace(
    /(<button[^>]*id="kc-login")/gi,
    '<input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>\n                    $1'
  );

  // Mensagens de erro
  const errorBlock = `
                <!-- Mensagens de Erro do Keycloak -->
                <#if messagesPerField.existsError('username','password')>
                    <div class="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                        \${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                    </div>
                </#if>
                
                <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                    <div class="mb-4 p-3 <#if message.type = 'success'>bg-green-500/10 border-green-500/50 text-green-400<#elseif message.type = 'warning'>bg-yellow-500/10 border-yellow-500/50 text-yellow-400<#elseif message.type = 'error'>bg-red-500/10 border-red-500/50 text-red-400<#else>bg-blue-500/10 border-blue-500/50 text-blue-400</#if> border rounded-lg text-sm">
                        \${kcSanitize(message.summary)?no_esc}
                    </div>
                </#if>
`;

  ftl = ftl.replace(
    /(<form[^>]*id="kc-form-login")/i,
    errorBlock + "\n                $1"
  );

  // Condicionais
  ftl = ftl.replace(
    /(<a[^>]*href="\$\{url\.loginResetCredentialsUrl\}"[^>]*>[^<]*<\/a>)/gi,
    "<#if realm.resetPasswordAllowed>$1</#if>"
  );

  ftl = ftl.replace(
    /(<span[^>]*>[^<]*<\/span>\s*<a[^>]*href="\$\{url\.registrationUrl\}"[^>]*>[^<]*<\/a>)/gi,
    "<#if realm.password && realm.registrationAllowed && !registrationDisabled??>$1</#if>"
  );

  ftl = ftl.replace(
    /(<label[^>]*class="flex items-center[^"]*"[^>]*>[\s\S]*?<input[^>]*id="rememberMe"[^>]*>[\s\S]*?<\/label>)/gi,
    "<#if realm.rememberMe && !usernameEditDisabled??>$1</#if>"
  );

  // Limpeza
  ftl = ftl.replace(/\s+onChange="[^"]*"/gi, "");
  ftl = ftl.replace(/\s+onClick="[^"]*"/gi, "");
  ftl = ftl.replace(/\s+onSubmit="[^"]*"/gi, "");
  ftl = ftl.replace(/\s+value=""/g, "");

  log("✓ Conversão concluída", "green");
  return ftl;
}

// ==========================================
// GERAÇÃO DOS TEMPLATES
// ==========================================
function generateLoginTemplate(css, formContent) {
  return `<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        <!-- Header gerenciado pelo design do Next.js -->
    <#elseif section = "form">
        <style>
            ${css}
        </style>
        
        ${formContent}
    </#if>
</@layout.registrationLayout>`;
}

function generateTemplateBase() {
  return `<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html class="\${properties.kcHtmlClass!}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>\${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="icon" href="\${url.resourcesPath}/img/favicon.ico" />
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="\${url.resourcesPath}/css/\${style}" rel="stylesheet" />
        </#list>
    </#if>
</head>
<body class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
    <div id="kc-container" class="min-h-screen flex items-center justify-center p-4">
        <div id="kc-content">
            <div id="kc-content-wrapper">
                <#nested "form">
            </div>
        </div>
    </div>
</body>
</html>
</#macro>`;
}

function generateThemeProperties(themeName) {
  return `# ${themeName} - Gerado automaticamente
parent=keycloak
import=common/keycloak
styles=css/login.css
locales=${LOCALES.join(",")}
`;
}

function generateMessages(locale) {
  const isPortuguese = locale === "pt_BR";

  const messages = {
    loginTitle: isPortuguese ? "Entrar - {0}" : "Sign In - {0}",
    doLogIn: isPortuguese ? "Entrar" : "Sign In",
    doRegister: isPortuguese ? "Criar conta" : "Create one",
    doForgotPassword: isPortuguese ? "Esqueceu a senha?" : "Forgot password?",
    username: isPortuguese ? "Usuário" : "Username",
    password: isPortuguese ? "Senha" : "Password",
    usernameOrEmail: isPortuguese ? "Usuário ou Email" : "Username or Email",
    rememberMe: isPortuguese ? "Lembrar de mim" : "Remember me",
    noAccount: isPortuguese ? "Não tem uma conta?" : "No account?",
    invalidUserMessage: isPortuguese
      ? "Usuário ou senha inválidos."
      : "Invalid username or password.",
  };

  let content = `# Mensagens (${locale})\n\n`;
  for (const [key, value] of Object.entries(messages)) {
    content += `${key}=${value}\n`;
  }
  return content;
}

// ==========================================
// MAIN
// ==========================================
async function main() {
  const args = process.argv.slice(2);

  console.log(`
${colors.magenta}╔══════════════════════════════════════════════════╗
║       🎨 Keycloak Theme Converter                ║
╚══════════════════════════════════════════════════╝${colors.reset}
`);

  if (args.length === 0) {
    // Lista temas disponíveis
    log(
      "Uso: node scripts/convert-theme.js <nome-do-tema> [nome-output]\n",
      "yellow"
    );

    if (fs.existsSync(SRC_DIR)) {
      const themes = fs
        .readdirSync(SRC_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

      if (themes.length > 0) {
        log("📂 Temas disponíveis em src/:", "cyan");
        themes.forEach((t) => log(`   • ${t}`, "reset"));
      }
    }

    log("\nExemplo:", "cyan");
    log(
      "  node scripts/convert-theme.js nextjs-keycloak-theme custom-theme",
      "reset"
    );
    log("  node scripts/convert-theme.js my-new-theme\n", "reset");
    process.exit(1);
  }

  const themeSourceName = args[0];
  const themeName = args[1] || themeSourceName;
  const themeSourcePath = path.join(SRC_DIR, themeSourceName);
  const outDir = path.join(themeSourcePath, "out");

  log(`🚀 Tema: ${themeSourceName} → ${themeName}\n`, "cyan");

  // Verifica se o diretório existe em src/
  if (!fs.existsSync(themeSourcePath)) {
    log(`❌ Tema não encontrado: ${themeSourcePath}`, "red");
    log(`   Os temas devem estar na pasta src/`, "yellow");
    process.exit(1);
  }

  // Verifica se tem package.json
  if (!fs.existsSync(path.join(themeSourcePath, "package.json"))) {
    log(`❌ package.json não encontrado em ${themeSourcePath}`, "red");
    process.exit(1);
  }

  // Build do Next.js
  log("📦 Fazendo build do Next.js...", "blue");
  try {
    execSync("npm run build", { cwd: themeSourcePath, stdio: "inherit" });
  } catch (error) {
    log("❌ Erro no build do Next.js", "red");
    process.exit(1);
  }

  // Verifica se o build foi gerado
  if (!fs.existsSync(outDir)) {
    log(`❌ Build não encontrado em ${outDir}`, "red");
    log(`   Certifique-se de que next.config tem output: "export"`, "yellow");
    process.exit(1);
  }

  // Extrai HTML e CSS
  log("\n📄 Extraindo HTML e CSS...", "blue");
  const extractedHtml = extractHtmlFromNextBuild(outDir);
  const nextCss = extractCssFromNextBuild(outDir);
  const css = getKeycloakResetCSS() + "\n\n/* Next.js CSS */\n" + nextCss;

  // Converte para FTL
  log("\n🔄 Convertendo para FTL...", "blue");
  const formContent = convertHtmlToFtl(extractedHtml);

  // Cria estrutura de diretórios
  const themeDir = path.join(THEMES_OUTPUT_DIR, themeName);
  const loginDir = path.join(themeDir, "login");
  const resourcesDir = path.join(loginDir, "resources");

  log("\n📁 Criando estrutura...", "blue");
  ensureDir(path.join(resourcesDir, "css"));
  ensureDir(path.join(resourcesDir, "js"));
  ensureDir(path.join(resourcesDir, "img"));
  ensureDir(path.join(loginDir, "messages"));

  // Gera arquivos
  log("\n✍️  Gerando arquivos...", "blue");

  fs.writeFileSync(path.join(loginDir, "template.ftl"), generateTemplateBase());
  log("   ✓ template.ftl", "green");

  fs.writeFileSync(
    path.join(loginDir, "login.ftl"),
    generateLoginTemplate(css, formContent)
  );
  log("   ✓ login.ftl", "green");

  fs.writeFileSync(
    path.join(loginDir, "theme.properties"),
    generateThemeProperties(themeName)
  );
  log("   ✓ theme.properties", "green");

  fs.writeFileSync(path.join(resourcesDir, "css", "login.css"), css);
  log("   ✓ css/login.css", "green");

  for (const locale of LOCALES) {
    fs.writeFileSync(
      path.join(loginDir, "messages", `messages_${locale}.properties`),
      generateMessages(locale)
    );
    log(`   ✓ messages/messages_${locale}.properties`, "green");
  }

  // Resumo
  log("\n" + "═".repeat(50), "green");
  log("✅ Tema gerado com sucesso!", "green");
  log("═".repeat(50), "green");
  log(`\n📂 Output: ${themeDir}`, "cyan");
  log("\n📝 Próximos passos:", "yellow");
  log("   1. docker-compose restart keycloak", "reset");
  log(`   2. Selecione "${themeName}" no Keycloak Admin\n`, "reset");
}

main().catch(console.error);

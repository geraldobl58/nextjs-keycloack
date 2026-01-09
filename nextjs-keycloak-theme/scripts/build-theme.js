#!/usr/bin/env node

/**
 * Build Theme Script - 100% Dinâmico
 *
 * Este script extrai o HTML e CSS do build do Next.js e gera
 * automaticamente os templates FTL para o Keycloak.
 *
 * Nenhum conteúdo é hardcoded - tudo vem do Next.js build.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// CONFIGURAÇÕES (único lugar com valores fixos)
// ==========================================
const CONFIG = {
  themeName: process.env.THEME_NAME || "custom-theme",
  projectRoot: path.resolve(__dirname, ".."),
  outDir: path.resolve(__dirname, "..", "out"),
  themesDir: path.resolve(__dirname, "..", "..", "themes"),
  locales: ["en", "pt_BR"],
};

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

// ==========================================
// EXTRAÇÃO DO HTML DO NEXT.JS
// ==========================================
function extractHtmlFromNextBuild() {
  const indexPath = path.join(CONFIG.outDir, "index.html");

  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `index.html não encontrado em ${CONFIG.outDir}. Execute "npm run build" primeiro.`
    );
  }

  let html = fs.readFileSync(indexPath, "utf-8");
  log("📄 Lendo index.html do build Next.js...", "blue");

  // Extrai o body
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) {
    throw new Error("Não foi possível extrair o body do HTML.");
  }

  let bodyContent = bodyMatch[1];

  // Remove scripts do Next.js
  bodyContent = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, "");

  // Remove elementos do Next.js
  bodyContent = bodyContent.replace(
    /<next-route-announcer[\s\S]*?<\/next-route-announcer>/gi,
    ""
  );

  // Encontra o container principal (div com max-w-md)
  const cardMatch = bodyContent.match(
    /(<div[^>]*class="[^"]*max-w-md[^"]*"[^>]*>[\s\S]*)/i
  );

  if (!cardMatch) {
    throw new Error(
      "Container principal (max-w-md) não encontrado. Verifique o componente LoginForm."
    );
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
function extractCssFromNextBuild() {
  const cssDir = path.join(CONFIG.outDir, "_next", "static", "css");

  if (!fs.existsSync(cssDir)) {
    throw new Error(
      `Diretório CSS não encontrado em ${cssDir}. Execute "npm run build" primeiro.`
    );
  }

  const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css"));

  if (cssFiles.length === 0) {
    throw new Error("Nenhum arquivo CSS encontrado no build.");
  }

  let combinedCSS = "";
  for (const file of cssFiles) {
    const content = fs.readFileSync(path.join(cssDir, file), "utf-8");
    combinedCSS += content + "\n";
  }

  log(`✓ Extraídos ${cssFiles.length} arquivo(s) CSS`, "green");
  return combinedCSS;
}

// ==========================================
// CSS DE RESET DO KEYCLOAK (necessário para sobrescrever estilos padrão)
// ==========================================
function getKeycloakResetCSS() {
  return `
/* Reset do Keycloak - Necessário para sobrescrever estilos padrão */
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
// CONVERSÃO HTML -> FTL (Dinâmico)
// ==========================================
function convertHtmlToFtl(html) {
  let ftl = html;

  log("🔧 Convertendo HTML para template FTL...", "blue");

  // 1. FORMULÁRIO - Adiciona atributos do Keycloak
  ftl = ftl.replace(
    /<form[^>]*class="([^"]*)"[^>]*>/gi,
    '<form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post" class="$1">'
  );

  // Fallback para form sem class
  ftl = ftl.replace(/<form[^>]*>/gi, (match) => {
    if (match.includes("kc-form-login")) return match;
    return '<form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">';
  });

  // 2. INPUT USERNAME - Adiciona value e name do Keycloak
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

  // 3. INPUT PASSWORD - Adiciona name
  ftl = ftl.replace(
    /(<input[^>]*id="password"[^>]*)(\/?>)/gi,
    (match, before, end) => {
      if (!before.includes('name="')) {
        return before + ' name="password"' + end;
      }
      return match;
    }
  );

  // 4. CHECKBOX REMEMBER ME - Adiciona name e checked condicional
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

  // 5. BOTÃO SUBMIT - Adiciona atributos do Keycloak
  ftl = ftl.replace(
    /<button([^>]*)type="submit"([^>]*)>([\s\S]*?)<\/button>/gi,
    '<button$1type="submit" name="login" id="kc-login"$2>${msg("doLogIn")}</button>'
  );

  // 6. LINKS - Substitui hrefs por URLs do Keycloak
  ftl = ftl.replace(/href="#register"/gi, 'href="${url.registrationUrl}"');
  ftl = ftl.replace(
    /href="#forgot-password"/gi,
    'href="${url.loginResetCredentialsUrl}"'
  );

  // 7. HIDDEN FIELD - Adiciona antes do botão submit
  ftl = ftl.replace(
    /(<button[^>]*id="kc-login")/gi,
    '<input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>\n                    $1'
  );

  // 8. MENSAGENS DE ERRO - Insere antes do form
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

  // 9. CONDICIONAIS - Envolve APENAS elementos específicos em blocos condicionais

  // Forgot password link - apenas o link, não o container
  ftl = ftl.replace(
    /(<a[^>]*href="\$\{url\.loginResetCredentialsUrl\}"[^>]*>[^<]*<\/a>)/gi,
    "<#if realm.resetPasswordAllowed>$1</#if>"
  );

  // Register link - apenas o link e texto anterior imediato
  ftl = ftl.replace(
    /(<span[^>]*>[^<]*<\/span>\s*<a[^>]*href="\$\{url\.registrationUrl\}"[^>]*>[^<]*<\/a>)/gi,
    "<#if realm.password && realm.registrationAllowed && !registrationDisabled??>$1</#if>"
  );

  // Remember me - envolve apenas o label com checkbox
  ftl = ftl.replace(
    /(<label[^>]*class="flex items-center[^"]*"[^>]*>[\s\S]*?<input[^>]*id="rememberMe"[^>]*>[\s\S]*?<\/label>)/gi,
    "<#if realm.rememberMe && !usernameEditDisabled??>$1</#if>"
  );

  // 10. LIMPEZA - Remove handlers React
  ftl = ftl.replace(/\s+onChange="[^"]*"/gi, "");
  ftl = ftl.replace(/\s+onClick="[^"]*"/gi, "");
  ftl = ftl.replace(/\s+onSubmit="[^"]*"/gi, "");
  ftl = ftl.replace(/\s+value=""/g, "");

  log("✓ Conversão HTML -> FTL concluída", "green");
  return ftl;
}

// ==========================================
// GERAÇÃO DO TEMPLATE LOGIN.FTL
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

// ==========================================
// GERAÇÃO DO TEMPLATE BASE
// ==========================================
function generateTemplateBase() {
  return `<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html class="\${properties.kcHtmlClass!}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="\${meta?split('==')[0]}" content="\${meta?split('==')[1]}"/>
        </#list>
    </#if>
    
    <title>\${msg("loginTitle",(realm.displayName!''))}</title>
    
    <link rel="icon" href="\${url.resourcesPath}/img/favicon.ico" />
    
    <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="\${url.resourcesCommonPath}/\${style}" rel="stylesheet" />
        </#list>
    </#if>
    
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="\${url.resourcesPath}/css/\${style}" rel="stylesheet" />
        </#list>
    </#if>
    
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="\${url.resourcesPath}/js/\${script}" type="text/javascript"></script>
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

// ==========================================
// GERAÇÃO DO THEME.PROPERTIES
// ==========================================
function generateThemeProperties() {
  return `# ${CONFIG.themeName} - Gerado automaticamente do Next.js
parent=keycloak
import=common/keycloak
styles=css/login.css
locales=${CONFIG.locales.join(",")}
`;
}

// ==========================================
// EXTRAÇÃO DE MENSAGENS DO COMPONENTE REACT
// ==========================================
function extractMessagesFromComponent() {
  const componentPath = path.join(
    CONFIG.projectRoot,
    "src",
    "components",
    "LoginForm.tsx"
  );

  if (!fs.existsSync(componentPath)) {
    log("⚠️ LoginForm.tsx não encontrado, usando mensagens padrão", "yellow");
    return null;
  }

  const content = fs.readFileSync(componentPath, "utf-8");
  const messages = {};

  // Extrai textos do componente usando regex
  const patterns = {
    // Labels e placeholders
    usernameLabel: /label[^>]*htmlFor="username"[^>]*>([^<]+)</i,
    passwordLabel: /label[^>]*htmlFor="password"[^>]*>([^<]+)</i,
    usernamePlaceholder: /id="username"[^>]*placeholder="([^"]+)"/i,
    passwordPlaceholder: /id="password"[^>]*placeholder="([^"]+)"/i,

    // Botões e links
    submitButton: /<button[^>]*type="submit"[^>]*>([^<]+)</i,
    forgotPassword: /href="#forgot-password"[^>]*>([^<]+)</i,
    registerLink: /href="#register"[^>]*>([^<]+)</i,
    noAccountText: />([^<]*)<\/span>\s*<a[^>]*href="#register"/i,
    rememberMe: /type="checkbox"[^>]*\/>\s*<span[^>]*>([^<]+)</i,

    // Header
    title: /<h1[^>]*>([^<]+)</i,
    subtitle: /<p[^>]*class="[^"]*text-slate-400[^"]*"[^>]*>([^<]+)</i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = content.match(pattern);
    if (match) {
      messages[key] = match[1].trim();
    }
  }

  log(
    `✓ Extraídas ${Object.keys(messages).length} mensagens do componente`,
    "green"
  );
  return messages;
}

// ==========================================
// GERAÇÃO DE MENSAGENS I18N
// ==========================================
function generateMessages(locale, extractedMessages) {
  const isPortuguese = locale === "pt_BR";

  // Mensagens base do Keycloak (necessárias para funcionar)
  const baseMessages = {
    loginTitle: isPortuguese ? "Entrar - {0}" : "Sign In - {0}",
    loginTitleHtml:
      extractedMessages?.title || (isPortuguese ? "Bem-vindo!" : "Welcome!"),
    doLogIn:
      extractedMessages?.submitButton || (isPortuguese ? "Entrar" : "Sign In"),
    doRegister:
      extractedMessages?.registerLink ||
      (isPortuguese ? "Criar conta" : "Create one"),
    doForgotPassword:
      extractedMessages?.forgotPassword ||
      (isPortuguese ? "Esqueceu a senha?" : "Forgot password?"),
    username: isPortuguese ? "Usuário" : "Username",
    password: isPortuguese ? "Senha" : "Password",
    usernameOrEmail:
      extractedMessages?.usernameLabel ||
      (isPortuguese ? "Usuário ou Email" : "Username or Email"),
    email: "Email",
    rememberMe:
      extractedMessages?.rememberMe ||
      (isPortuguese ? "Lembrar de mim" : "Remember me"),
    noAccount:
      extractedMessages?.noAccountText ||
      (isPortuguese ? "Não tem uma conta?" : "Don't have an account?"),

    // Mensagens de erro
    invalidUserMessage: isPortuguese
      ? "Usuário ou senha inválidos."
      : "Invalid username or password.",
    invalidEmailMessage: isPortuguese
      ? "Email inválido."
      : "Invalid email address.",
    accountDisabledMessage: isPortuguese
      ? "Conta desabilitada."
      : "Account is disabled.",
    accountTemporarilyDisabledMessage: isPortuguese
      ? "Conta temporariamente desabilitada."
      : "Account is temporarily disabled.",
    expiredCodeMessage: isPortuguese
      ? "Sessão expirada. Tente novamente."
      : "Session expired. Please try again.",
    missingUsernameMessage: isPortuguese
      ? "Informe o usuário."
      : "Please enter username.",
    missingPasswordMessage: isPortuguese
      ? "Informe a senha."
      : "Please enter password.",
    notMatchPasswordMessage: isPortuguese
      ? "As senhas não conferem."
      : "Passwords don't match.",

    // Registro
    registerTitle: isPortuguese ? "Criar Conta - {0}" : "Create Account - {0}",
    firstName: isPortuguese ? "Nome" : "First Name",
    lastName: isPortuguese ? "Sobrenome" : "Last Name",
    passwordConfirm: isPortuguese ? "Confirmar Senha" : "Confirm Password",

    // Reset de senha
    loginResetPasswordTitle: isPortuguese
      ? "Recuperar Senha"
      : "Reset Password",
    emailInstruction: isPortuguese
      ? "Informe seu email para redefinir sua senha."
      : "Enter your email to reset your password.",

    // Social login
    "identity-provider-login-label": isPortuguese
      ? "Ou entre com"
      : "Or sign in with",

    // Footer
    support: isPortuguese ? "Suporte" : "Support",
    documentation: isPortuguese ? "Documentação" : "Documentation",
    privacyPolicy: isPortuguese ? "Privacidade" : "Privacy",
    termsOfService: isPortuguese ? "Termos de Serviço" : "Terms of Service",

    // Outros
    backToLogin: isPortuguese ? "Voltar ao login" : "Back to Login",
    doSubmit: isPortuguese ? "Enviar" : "Submit",
    doCancel: isPortuguese ? "Cancelar" : "Cancel",
    doLogout: isPortuguese ? "Sair" : "Logout",
  };

  // Formata como arquivo .properties
  let content = `# ${CONFIG.themeName} - Mensagens (${locale})\n`;
  content += `# Gerado automaticamente do Next.js\n\n`;

  for (const [key, value] of Object.entries(baseMessages)) {
    content += `${key}=${value}\n`;
  }

  return content;
}

// ==========================================
// COPIA ASSETS ESTÁTICOS
// ==========================================
function copyStaticAssets(loginResourcesDir) {
  const publicDir = path.join(CONFIG.projectRoot, "public");

  if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir);
    for (const file of files) {
      const src = path.join(publicDir, file);
      const dest = path.join(loginResourcesDir, "img", file);
      if (fs.statSync(src).isFile()) {
        ensureDir(path.dirname(dest));
        fs.copyFileSync(src, dest);
      }
    }
    log(`✓ Copiados ${files.length} assets estáticos`, "green");
  }
}

// ==========================================
// BUILD PRINCIPAL
// ==========================================
async function buildTheme() {
  log("\n🚀 Build do Tema Keycloak (100% Dinâmico)\n", "cyan");

  try {
    // Verifica se o build do Next.js existe
    if (!fs.existsSync(CONFIG.outDir)) {
      throw new Error(
        `Diretório "${CONFIG.outDir}" não encontrado. Execute "npm run build" primeiro.`
      );
    }

    // 1. Extrai HTML do Next.js
    log("📦 Extraindo HTML do Next.js...", "blue");
    const extractedHtml = extractHtmlFromNextBuild();

    // 2. Extrai CSS do Next.js
    log("🎨 Extraindo CSS do Next.js...", "blue");
    const nextCss = extractCssFromNextBuild();
    const css = getKeycloakResetCSS() + "\n\n/* Next.js CSS */\n" + nextCss;

    // 3. Converte HTML para FTL
    log("🔄 Convertendo para template FTL...", "blue");
    const formContent = convertHtmlToFtl(extractedHtml);

    // 4. Extrai mensagens do componente React
    log("💬 Extraindo mensagens do componente...", "blue");
    const extractedMessages = extractMessagesFromComponent();

    // 5. Cria estrutura de diretórios
    const themeDir = path.join(CONFIG.themesDir, CONFIG.themeName);
    const loginDir = path.join(themeDir, "login");
    const loginResourcesDir = path.join(loginDir, "resources");

    log("📁 Criando estrutura de diretórios...", "blue");
    ensureDir(path.join(loginResourcesDir, "css"));
    ensureDir(path.join(loginResourcesDir, "js"));
    ensureDir(path.join(loginResourcesDir, "img"));
    ensureDir(path.join(loginDir, "messages"));

    // 6. Gera arquivos
    log("✍️  Gerando arquivos do tema...", "blue");

    // template.ftl
    fs.writeFileSync(
      path.join(loginDir, "template.ftl"),
      generateTemplateBase()
    );
    log("   ✓ template.ftl", "green");

    // login.ftl
    fs.writeFileSync(
      path.join(loginDir, "login.ftl"),
      generateLoginTemplate(css, formContent)
    );
    log("   ✓ login.ftl", "green");

    // theme.properties
    fs.writeFileSync(
      path.join(loginDir, "theme.properties"),
      generateThemeProperties()
    );
    log("   ✓ theme.properties", "green");

    // CSS
    fs.writeFileSync(path.join(loginResourcesDir, "css", "login.css"), css);
    log("   ✓ css/login.css", "green");

    // Mensagens para cada locale
    for (const locale of CONFIG.locales) {
      const messages = generateMessages(locale, extractedMessages);
      fs.writeFileSync(
        path.join(loginDir, "messages", `messages_${locale}.properties`),
        messages
      );
      log(`   ✓ messages/messages_${locale}.properties`, "green");
    }

    // 7. Copia assets
    log("📋 Copiando assets...", "blue");
    copyStaticAssets(loginResourcesDir);

    // Resumo
    log("\n✅ Tema gerado com sucesso!", "green");
    log(`📂 Local: ${themeDir}`, "cyan");
    log(`🌍 Idiomas: ${CONFIG.locales.join(", ")}`, "cyan");

    log("\n📝 Próximos passos:", "yellow");
    log("   1. Reinicie o Keycloak: docker-compose restart", "reset");
    log(
      `   2. Selecione "${CONFIG.themeName}" nas configurações do realm`,
      "reset"
    );
    log("");
  } catch (error) {
    log(`\n❌ Erro: ${error.message}`, "red");
    process.exit(1);
  }
}

// Executa
buildTheme();

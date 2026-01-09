# 🎨 Keycloak Custom Themes

Sistema para criar temas Keycloak customizados usando **Next.js + Tailwind CSS**.

## 📁 Estrutura do Projeto

```
keycloack/
├── src/                           # 📂 Temas Next.js (código fonte)
│   ├── nextjs-keycloak-theme/     # Tema padrão
│   │   ├── src/components/        # Componentes React
│   │   └── package.json
│   └── my-new-theme/              # Outro tema
│       └── ...
├── themes/                        # 📦 Temas compilados (Keycloak)
│   ├── custom-theme/
│   └── my-new-theme/
├── scripts/
│   ├── convert-theme.js           # Script de conversão
│   └── watch-theme.js             # Watch mode
├── docker-compose.yml             # Keycloak + PostgreSQL
└── package.json                   # Scripts globais
```

## 🚀 Quick Start

### 1. Iniciar Keycloak

```bash
docker-compose up -d
```

- **URL:** http://localhost:8080
- **Admin:** admin / admin123

### 2. Desenvolver um Tema

```bash
# Entrar na pasta do tema
cd src/nextjs-keycloak-theme
npm install

# Desenvolvimento (visualizar no browser)
npm run dev

# Desenvolvimento com watch (gera tema a cada mudança)
npm run dev:theme
```

Acesse http://localhost:3000 para visualizar.

### 3. Gerar Tema para Keycloak

```bash
# Da raiz do projeto
npm run convert nextjs-keycloak-theme custom-theme

# Ou dentro do tema
cd src/nextjs-keycloak-theme
npm run build:theme
```

### 4. Aplicar no Keycloak

```bash
docker-compose restart keycloak
```

No Admin Console → Realm Settings → Themes → Login Theme → Selecione o tema.

---

## 🆕 Criar um Novo Tema

### Passo 1: Criar Projeto Next.js

```bash
# Navegar para pasta src
cd src

# Criar novo projeto
npx create-next-app@latest meu-tema

# Responda às perguntas:
# ✔ TypeScript? Yes
# ✔ ESLint? Yes
# ✔ Tailwind CSS? Yes
# ✔ src/ directory? Yes
# ✔ App Router? Yes
# ✔ Import alias? @/*
```

### Passo 2: Configurar next.config

Edite `next.config.ts` (ou `.js`):

```typescript
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

### Passo 3: Adicionar Scripts

Edite `package.json`:

```json
{
  "scripts": {
    "dev": "rm -rf out && next dev",
    "dev:theme": "cd ../.. && npm run watch meu-tema",
    "build": "next build",
    "build:theme": "cd ../.. && npm run convert meu-tema",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Passo 4: Criar Componente de Login

Crie `src/components/LoginForm.tsx`:

```tsx
"use client";

import { useState } from "react";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="w-full max-w-md">
      <div className="bg-slate-800 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🚀 Meu Tema</h1>
          <p className="text-slate-400">Entre para continuar</p>
        </div>

        {/* Form */}
        <form className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="block text-sm text-slate-300 mb-2"
            >
              Username ou Email
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="Digite seu username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm text-slate-300 mb-2"
            >
              Senha
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="Digite sua senha"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-slate-300">
              <input type="checkbox" className="mr-2" />
              Lembrar de mim
            </label>
            <a href="#forgot-password" className="text-indigo-400">
              Esqueceu a senha?
            </a>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-400">Sem conta? </span>
          <a href="#register" className="text-indigo-400">
            Criar uma
          </a>
        </div>
      </div>
    </div>
  );
}
```

### Passo 5: Usar o Componente

Em `src/app/page.tsx`:

```tsx
import LoginForm from "@/components/LoginForm";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <LoginForm />
    </main>
  );
}
```

### Passo 6: Desenvolver e Converter

```bash
# Desenvolvimento
cd src/meu-tema
npm run dev

# Converter para Keycloak
npm run build:theme

# Ou da raiz
npm run convert meu-tema
```

---

## ⚠️ Regras Importantes para o Componente

Para que a conversão funcione corretamente:

### IDs Obrigatórios

```html
<!-- Input de usuário DEVE ter id="username" -->
<input id="username" ... />

<!-- Input de senha DEVE ter id="password" -->
<input id="password" ... />

<!-- Checkbox lembrar DEVE ser type="checkbox" -->
<input type="checkbox" ... />

<!-- Botão DEVE ser type="submit" -->
<button type="submit">...</button>
```

### Links Especiais

```html
<!-- Link de registro DEVE ter href="#register" -->
<a href="#register">Criar conta</a>

<!-- Link esqueci senha DEVE ter href="#forgot-password" -->
<a href="#forgot-password">Esqueci minha senha</a>
```

### Container Principal

```html
<!-- O container principal DEVE ter class "max-w-md" -->
<div className="w-full max-w-md">...</div>
```

### Evitar Apóstrofos

```tsx
// ❌ Errado - causa erro de ESLint
<p>Don't have an account?</p>

// ✅ Correto
<p>Sem conta?</p>
// ou
<p>Don&apos;t have an account?</p>
```

---

## 📦 Scripts Disponíveis

### Na Raiz (`/keycloack`)

| Comando                           | Descrição                         |
| --------------------------------- | --------------------------------- |
| `npm run convert <tema> [output]` | Converte tema para Keycloak       |
| `npm run watch <tema> [output]`   | Watch mode com rebuild automático |

### Em Cada Tema (`/src/<nome-do-tema>`)

| Comando               | Descrição                   |
| --------------------- | --------------------------- |
| `npm run dev`         | Servidor de desenvolvimento |
| `npm run dev:theme`   | Watch mode com conversão    |
| `npm run build`       | Build do Next.js            |
| `npm run build:theme` | Converte para Keycloak      |

---

## 🐳 Docker

### Comandos Úteis

```bash
# Iniciar
docker-compose up -d

# Logs
docker-compose logs -f keycloak

# Reiniciar (aplicar temas)
docker-compose restart keycloak

# Parar
docker-compose down
```

### Variáveis para Desenvolvimento

O `docker-compose.yml` já está configurado para desabilitar cache de temas:

```yaml
KC_SPI_THEME_CACHE_THEMES: "false"
KC_SPI_THEME_CACHE_TEMPLATES: "false"
```

---

## 🔧 Troubleshooting

### Erro: EPERM operation not permitted

```bash
# Feche o terminal e abra novamente
```

### Erro: Apóstrofo não escapado

```tsx
// Use &apos; ou altere o texto
<p>Don&apos;t have an account?</p>
```

### Tema não aparece no Keycloak

1. Verifique se o tema foi gerado em `themes/<nome>/login/`
2. Reinicie o Keycloak: `docker-compose restart keycloak`
3. Verifique os logs: `docker-compose logs keycloak`

### Build falha com MODULE_NOT_FOUND

```bash
# Limpe o cache
rm -rf .next out node_modules
npm install
npm run build
```

### Container principal não encontrado

Certifique-se de que seu componente tem um div com `className="... max-w-md ..."`:

```tsx
<div className="w-full max-w-md">{/* seu conteúdo */}</div>
```

---

## 📋 Temas Disponíveis

| Tema           | Pasta Fonte                 | Output                |
| -------------- | --------------------------- | --------------------- |
| `custom-theme` | `src/nextjs-keycloak-theme` | `themes/custom-theme` |
| `my-new-theme` | `src/my-new-theme`          | `themes/my-new-theme` |

---

## 📄 Licença

MIT

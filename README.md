# 🎨 Keycloak Custom Themes

Sistema para criar temas Keycloak customizados usando **Next.js + Tailwind CSS**.

## 📁 Estrutura do Projeto

```
keycloack/
├── nextjs-keycloak-theme/     # Tema padrão (exemplo)
│   ├── src/components/        # Componentes React
│   └── package.json
├── my-corporate-theme/        # Seu novo tema (exemplo)
│   └── ...
├── themes/                    # Temas compilados (para Keycloak)
│   ├── custom-theme/
│   └── my-corporate-theme/
├── scripts/
│   └── convert-theme.js       # Script de conversão (global)
├── docker-compose.yml         # Keycloak + PostgreSQL
└── package.json               # Scripts globais
```

## 🚀 Quick Start

### 1. Iniciar Keycloak

```bash
docker-compose up -d
```

- **URL:** http://localhost:8080
- **Admin:** admin / admin123

### 2. Desenvolver o Tema Existente

```bash
cd nextjs-keycloak-theme
npm install
npm run dev
```

Acesse http://localhost:3000 para visualizar.

### 3. Gerar Tema para Keycloak

```bash
# Da raiz do projeto
npm run convert:default

# Ou dentro do tema
cd nextjs-keycloak-theme
npm run build:theme  # Executa o script global
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
# Na raiz do projeto
npx create-next-app@latest my-new-theme

# Responda às perguntas:
# ✔ TypeScript? Yes
# ✔ ESLint? Yes
# ✔ Tailwind CSS? Yes
# ✔ src/ directory? Yes
# ✔ App Router? Yes
# ✔ Import alias? @/*
```

### Passo 2: Configurar next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

### Passo 3: Criar Componente de Login

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
          <h1 className="text-3xl font-bold text-white mb-2">🚀 My Theme</h1>
          <p className="text-slate-400">Sign in to continue</p>
        </div>

        {/* Form */}
        <form className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="block text-sm text-slate-300 mb-2"
            >
              Username or Email
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm text-slate-300 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="Enter your password"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-slate-300">
              <input type="checkbox" className="mr-2" />
              Remember me
            </label>
            <a href="#forgot-password" className="text-indigo-400">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-400">No account? </span>
          <a href="#register" className="text-indigo-400">
            Create one
          </a>
        </div>
      </div>
    </div>
  );
}
```

### Passo 4: Usar o Componente

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

### Passo 5: Desenvolver

```bash
cd my-new-theme
npm run dev
```

### Passo 6: Converter para Keycloak

```bash
# Da raiz do projeto
npm run convert my-new-theme my-new-theme

# Ou diretamente
node scripts/convert-theme.js my-new-theme my-new-theme
```

### Passo 7: Testar

```bash
docker-compose restart keycloak
```

---

## ⚠️ Regras Importantes para o Componente

Para que a conversão funcione corretamente, siga estas regras:

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
<a href="#register">Create one</a>

<!-- Link esqueci senha DEVE ter href="#forgot-password" -->
<a href="#forgot-password">Forgot password?</a>
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
<p>No account?</p>
// ou
<p>Don&apos;t have an account?</p>
```

---

## 📦 Scripts Disponíveis

### Na Raiz (`/keycloack`)

| Comando                          | Descrição                           |
| -------------------------------- | ----------------------------------- |
| `npm run convert <pasta> [nome]` | Converte tema Next.js para Keycloak |
| `npm run convert:default`        | Converte o tema padrão              |

### Em Cada Tema (`/<nome-do-tema>`)

| Comando               | Descrição                          |
| --------------------- | ---------------------------------- |
| `npm run dev`         | Servidor de desenvolvimento        |
| `npm run build`       | Build do Next.js                   |
| `npm run build:theme` | Executa script global de conversão |

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
# Feche o terminal e abra novamente, depois:
cd /caminho/do/projeto
npm run dev
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

---

## 📋 Temas Disponíveis

| Tema           | Pasta Fonte             | Descrição           |
| -------------- | ----------------------- | ------------------- |
| `custom-theme` | `nextjs-keycloak-theme` | Tema padrão moderno |

---

## 📄 Licença

MIT

"use client";

import { useState } from "react";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de login - remova no Keycloak
    if (username && password) {
      alert(`Login simulado: ${username}`);
    } else {
      setError("Por favor, preencha todos os campos");
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in-up">
      {/* Card Principal - Dark com borda mais definida */}
      <div className="bg-[#1a1f2e] backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-[#2d3548] p-8">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Logo SVG */}
          <div className="flex justify-center mb-6">
            <svg
              width="80"
              height="80"
              viewBox="0 0 100 100"
              className="animate-pulse-custom"
            >
              <circle cx="50" cy="50" r="45" fill="#6366f1" opacity="0.2" />
              <circle cx="50" cy="50" r="35" fill="#6366f1" />
              <path d="M 40 35 L 60 50 L 40 65 Z" fill="white" />
            </svg>
          </div>

          {/* <h1 className="text-3xl font-bold text-white mb-2">
            🚀 Welcome Back!
          </h1>
          <p className="text-slate-400">Sign in to continue to your account</p> */}

          {/* Badges */}
          <div className="flex justify-center gap-3 mt-4 flex-wrap">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold border border-indigo-500/30">
              🔒 Secure
            </span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold border border-purple-500/30">
              ⚡ Fast
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold border border-blue-500/30">
              🌟 Modern
            </span>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username/Email */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-slate-300 mb-2"
            >
              Username or Email
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1419] border border-[#2d3548] rounded-lg text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
              placeholder="Enter your username or email"
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-300 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f1419] border border-[#2d3548] rounded-lg text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-offset-0 cursor-pointer"
              />
              <span className="ml-2">Remember me</span>
            </label>

            <a
              href="#forgot-password"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Sign In
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center text-sm">
          <span className="text-slate-400">Don&apos;t have an account? </span>
          <a
            href="#register"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            Create one
          </a>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <div className="flex justify-center gap-6 text-xs text-slate-500 mb-3">
            <a
              href="#support"
              className="hover:text-indigo-400 transition-colors"
            >
              📧 Support
            </a>
            <a href="#docs" className="hover:text-indigo-400 transition-colors">
              📖 Docs
            </a>
            <a
              href="#privacy"
              className="hover:text-indigo-400 transition-colors"
            >
              🔐 Privacy
            </a>
          </div>
          <p className="text-center text-xs text-slate-600">
            © 2026 Your Company. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

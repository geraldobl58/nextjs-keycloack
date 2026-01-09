<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=!messagesPerField.existsError('username'); section>
    <#if section = "header">
        <!-- Header vazio -->
    <#elseif section = "form">
        <style>
            #kc-header, #kc-header-wrapper { display: none !important; }
            .login-pf-page, #kc-content, #kc-content-wrapper { background: transparent !important; padding: 0 !important; }
        </style>
        
        <div class="w-full max-w-md animate-fade-in-up">
            <div class="bg-[#1a1f2e] backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-[#2d3548] p-8">
                <!-- Header -->
                <div class="text-center mb-8">
                    <div class="flex justify-center mb-6">
                        <svg width="80" height="80" viewBox="0 0 100 100" class="animate-pulse-custom">
                            <circle cx="50" cy="50" r="45" fill="#6366f1" opacity="0.2"/>
                            <circle cx="50" cy="50" r="35" fill="#6366f1"/>
                            <path d="M 45 35 L 45 55 M 45 60 L 45 65" stroke="white" stroke-width="6" stroke-linecap="round"/>
                        </svg>
                    </div>
                    
                    <h1 class="text-3xl font-bold text-white mb-2">🔐 Recuperar Senha</h1>
                    <p class="text-slate-400">Informe seu email para receber as instruções</p>
                </div>
                
                <!-- Mensagens -->
                <#if messagesPerField.existsError('username')>
                    <div class="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                        ${kcSanitize(messagesPerField.getFirstError('username'))?no_esc}
                    </div>
                </#if>
                
                <!-- Formulário -->
                <form id="kc-reset-password-form" action="${url.loginAction}" method="post" class="space-y-5">
                    <div>
                        <label for="username" class="block text-sm font-semibold text-slate-300 mb-2">
                            <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
                        </label>
                        <input 
                            type="text" 
                            id="username" 
                            name="username"
                            class="w-full px-4 py-3 bg-[#0f1419] border border-[#2d3548] rounded-lg text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
                            placeholder="<#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>"
                            autofocus
                            autocomplete="username"
                        />
                    </div>
                    
                    <div class="flex gap-4 pt-4">
                        <a 
                            href="${url.loginUrl}"
                            class="flex-1 py-3 px-4 bg-[#0f1419] border border-[#2d3548] text-slate-300 font-semibold rounded-lg hover:bg-[#1a1f2e] transition-all text-center"
                        >
                            ${msg("backToLogin")}
                        </a>
                        <button 
                            type="submit"
                            class="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                            ${msg("doSubmit")}
                        </button>
                    </div>
                </form>
                
                <!-- Footer -->
                <div class="mt-8 pt-6 border-t border-slate-700">
                    <p class="text-center text-xs text-slate-600">© 2026 Your Company. All rights reserved.</p>
                </div>
            </div>
        </div>
    <#elseif section = "info">
        <div class="text-center text-sm text-slate-400 mt-4">
            ${msg("emailInstruction")}
        </div>
    </#if>
</@layout.registrationLayout>

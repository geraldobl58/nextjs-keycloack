<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm') displayRequiredFields=true; section>
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
                            <path d="M 40 35 L 60 50 L 40 65 Z" fill="white"/>
                        </svg>
                    </div>
                    
                    <h1 class="text-3xl font-bold text-white mb-2">🚀 ${msg("registerTitle", realm.displayName!'')}</h1>
                    <p class="text-slate-400">${realm.displayName!'Keycloak'}</p>
                </div>
                
                <!-- Mensagens -->
                <#if messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm')>
                    <div class="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                        <#if messagesPerField.existsError('firstName')>${kcSanitize(messagesPerField.get('firstName'))?no_esc}</#if>
                        <#if messagesPerField.existsError('lastName')>${kcSanitize(messagesPerField.get('lastName'))?no_esc}</#if>
                        <#if messagesPerField.existsError('email')>${kcSanitize(messagesPerField.get('email'))?no_esc}</#if>
                        <#if messagesPerField.existsError('username')>${kcSanitize(messagesPerField.get('username'))?no_esc}</#if>
                        <#if messagesPerField.existsError('password')>${kcSanitize(messagesPerField.get('password'))?no_esc}</#if>
                        <#if messagesPerField.existsError('password-confirm')>${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}</#if>
                    </div>
                </#if>
                
                <!-- Formulário -->
                <form id="kc-register-form" action="${url.registrationAction}" method="post" class="space-y-4">
                    <!-- Nome -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="firstName" class="block text-sm font-semibold text-slate-300 mb-2">${msg("firstName")}</label>
                            <input 
                                type="text" 
                                id="firstName" 
                                name="firstName"
                                value="${(register.formData.firstName!'')}"
                                class="w-full px-4 py-3 bg-[#0f1419] border border-[#2d3548] rounded-lg text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
                                autocomplete="given-name"
                            />
                        </div>
                        <div>
                            <label for="lastName" class="block text-sm font-semibold text-slate-300 mb-2">${msg("lastName")}</label>
                            <input 
                                type="text" 
                                id="lastName" 
                                name="lastName"
                                value="${(register.formData.lastName!'')}"
                                class="w-full px-4 py-3 bg-[#0f1419] border border-[#2d3548] rounded-lg text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
                                autocomplete="family-name"
                            />
                        </div>
                    </div>
                    
                    <!-- Email -->
                    <div>
                        <label for="email" class="block text-sm font-semibold text-slate-300 mb-2">${msg("email")}</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email"
                            value="${(register.formData.email!'')}"
                            class="w-full px-4 py-3 bg-[#0f1419] border border-[#2d3548] rounded-lg text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
                            autocomplete="email"
                        />
                    </div>
                    
                    <!-- Username -->
                    <#if !realm.registrationEmailAsUsername>
                        <div>
                            <label for="username" class="block text-sm font-semibold text-slate-300 mb-2">${msg("username")}</label>
                            <input 
                                type="text" 
                                id="username" 
                                name="username"
                                value="${(register.formData.username!'')}"
                                class="w-full px-4 py-3 bg-[#0f1419] border border-[#2d3548] rounded-lg text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
                                autocomplete="username"
                            />
                        </div>
                    </#if>
                    
                    <!-- Senha -->
                    <#if passwordRequired??>
                        <div>
                            <label for="password" class="block text-sm font-semibold text-slate-300 mb-2">${msg("password")}</label>
                            <input 
                                type="password" 
                                id="password" 
                                name="password"
                                class="w-full px-4 py-3 bg-[#0f1419] border border-[#2d3548] rounded-lg text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
                                autocomplete="new-password"
                            />
                        </div>
                        
                        <div>
                            <label for="password-confirm" class="block text-sm font-semibold text-slate-300 mb-2">${msg("passwordConfirm")}</label>
                            <input 
                                type="password" 
                                id="password-confirm" 
                                name="password-confirm"
                                class="w-full px-4 py-3 bg-[#0f1419] border border-[#2d3548] rounded-lg text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
                                autocomplete="new-password"
                            />
                        </div>
                    </#if>
                    
                    <!-- Termos -->
                    <#if recaptchaRequired??>
                        <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
                    </#if>
                    
                    <!-- Botões -->
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
                            ${msg("doRegister")}
                        </button>
                    </div>
                </form>
                
                <!-- Footer -->
                <div class="mt-8 pt-6 border-t border-slate-700">
                    <p class="text-center text-xs text-slate-600">© 2026 Your Company. All rights reserved.</p>
                </div>
            </div>
        </div>
    </#if>
</@layout.registrationLayout>

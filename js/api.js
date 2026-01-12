// js/api.js

// 1. CONFIGURACIÓN
const SB_URL = "https://nlimqewcchsczzccgkme.supabase.co"; 
const SB_KEY = "sb_publishable_t6-SiscKU7BChhVzzHnnyA_KNmVyWur"; 

// 2. INICIALIZACIÓN (Usaremos 'sb' consistentemente)
const sb = supabase.createClient(SB_URL, SB_KEY);

// 3. FUNCIÓN DE REGISTRO (La que faltaba)
async function registrarUsuario(email, password, nombre, empresa) {
    const { data, error } = await sb.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                nombre_completo: nombre,
                empresa: empresa
            }
        }
    });
    if (error) throw error;
    return data;
}

// 4. FUNCIÓN DE LOGIN
async function login(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({
        email: email,
        password: password,
    });
    if (error) throw error;
    localStorage.setItem('geo_session', JSON.stringify(data.session));
    return data;
}

// 5. VERIFICACIÓN DE SESIÓN
function verificarSesion() {
    const sessionStr = localStorage.getItem('geo_session');
    if (!sessionStr) {
        window.location.href = 'index.html';
        return null;
    }
    const session = JSON.parse(sessionStr);
    return {
        id: session.user.id,
        email: session.user.email,
        empresa: session.user.user_metadata?.nombre_completo || "Usuario"
    };
}

// --- CONFIGURACIÓN SUPABASE ---
const SB_URL = "https://nlimqewcchsczzccgkme.supabase.co"; // Reemplaza con tu URL
const SB_KEY = "sb_publishable_t6-SiscKU7BChhVzzHnnyA_KNmVyWur";              // Reemplaza con tu Key

// Inicializar el cliente (usamos 'sb' para no chocar con el objeto global 'supabase')
const sb = supabase.createClient(SB_URL, SB_KEY);

// --- FUNCIÓN DE LOGIN ---
async function login(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({
        email: email,
        password: password,
    });
    
    if (error) throw error; // Si hay error, lo captura el 'catch' del HTML
    
    // Guardamos la sesión
    localStorage.setItem('geo_session', JSON.stringify(data.session));
    return data;
}

// --- VERIFICACIÓN DE SESIÓN ---
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
        empresa: session.user.user_metadata?.empresa || "Usuario"
    };
}

// --- CERRAR SESIÓN ---
async function logout() {
    await sb.auth.signOut();
    localStorage.removeItem('geo_session');
    window.location.href = 'index.html';
}

// 1. CONFIGURACIÓN INICIAL
const SUPABASE_URL = "https://nlimqewcchsczzccgkme.supabase.co";
const SUPABASE_KEY = "sb_publishable_t6-SiscKU7BChhVzzHnnyA_KNmVyWur";

// Inicializar el cliente de Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. GESTIÓN DE SESIÓN (AUTENTICACIÓN NATIVA)
async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    
    if (error) throw error;
    
    // Guardamos la sesión en localStorage para persistencia rápida
    localStorage.setItem('geo_session', JSON.stringify(data.session));
    return data;
}

async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('geo_session');
    window.location.href = 'index.html';
}

function verificarSesion() {
    const sessionStr = localStorage.getItem('geo_session');
    if (!sessionStr) {
        window.location.href = 'index.html';
        return null;
    }
    const session = JSON.parse(sessionStr);
    
    // Retornamos un objeto compatible con lo que ya tenías
    return {
        id: session.user.id,
        email: session.user.email,
        empresa: session.user.user_metadata?.empresa || "Usuario"
    };
}

// 3. LOGICA DE DATOS (REEMPLAZA A callApi)
// Nota: Para subir archivos a Drive seguiremos usando la URL de Apps Script
const GAS_URL = "TU_URL_DE_APPS_SCRIPT_SOLO_PARA_DRIVE";

async function registrarArchivoEnSupabase(metadata) {
    const { data, error } = await supabase
        .from('archivos')
        .insert([metadata]);
    
    if (error) throw error;
    return data;
}

// Añadir a js/api.js
async function registrarUsuario(email, password, nombre, empresa) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            // Guardamos metadatos adicionales en el perfil de Auth
            data: {
                nombre_completo: nombre,
                empresa: empresa
            }
        }
    });

    if (error) throw error;
    return data;
}

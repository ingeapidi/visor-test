// 1. CONFIGURACIÓN INICIAL
const SUPABASE_URL = "https://nlimqewcchsczzccgkme.supabase.co";
const SUPABASE_KEY = "sb_publishable_t6-SiscKU7BChhVzzHnnyA_KNmVyWur";

// Inicializar cliente
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. SESIÓN
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

// 3. LOGIN
async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });
    if (error) throw error;
    localStorage.setItem('geo_session', JSON.stringify(data.session));
    return data;
}

// 4. REGISTRO
async function registrarUsuario(email, password, nombre, empresa) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: { data: { nombre_completo: nombre, empresa: empresa } }
    });
    if (error) throw error;
    return data;
}

// 5. GOOGLE DRIVE (Solo para el futuro envío de archivos pesados)
const GAS_URL_DRIVE = "ESTA_ES_LA_UNICA_URL_DE_GOOGLE_QUE_USAREMOS";

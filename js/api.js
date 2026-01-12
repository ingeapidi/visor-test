// CONFIGURACIÓN CENTRAL
const API_URL = "https://script.google.com/macros/s/AKfycbz7SoDrtjnHMr_LLIHu0xqosDWcEk3Y9CceA02HuMSee4_j6B21Pjb051wV0MmuG9voTQ/exec";

/**
 * Función maestra para hablar con Google Sheets
 * @param {string} action - La acción a realizar (login, registrar, etc)
 * @param {object} payload - Los datos que enviamos
 */
async function callApi(action, payload) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: action,
                payload: payload
            })
        });
        return await response.json();
    } catch (error) {
        console.error("Error en la comunicación con la API:", error);
        return { success: false, message: "Error de conexión con el servidor" };
    }
}

/**
 * Función para verificar si hay un usuario logueado (Seguridad)
 */
function verificarSesion() {
    const usuario = localStorage.getItem('usuario');
    if (!usuario && !window.location.href.includes('index.html') && !window.location.href.includes('registro.html')) {
        window.location.href = 'index.html';
    }
    return JSON.parse(usuario);
}

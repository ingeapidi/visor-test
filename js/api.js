// js/api.js
const API_URL = "https://script.google.com/macros/s/AKfycbz7SoDrtjnHMr_LLIHu0xqosDWcEk3Y9CceA02HuMSee4_j6B21Pjb051wV0MmuG9voTQ/exec";

async function callApi(action, payload) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: action, payload: payload })
        });
        return await response.json();
    } catch (error) {
        console.error("Error API:", error);
        return { success: false, message: "Error de conexión" };
    }
}

function verificarSesion() {
    const usuarioJson = localStorage.getItem('usuario');
    if (!usuarioJson && !window.location.href.includes('index.html') && !window.location.href.includes('registro.html')) {
        window.location.href = 'index.html';
        return null;
    }
    return JSON.parse(usuarioJson);
}

function inicializarInterfaz() {
    const usuario = verificarSesion();
    if (!usuario) return;

    // Actualizar nombre en Header (si existe)
    const nombreDisplay = document.querySelector('.user-access small, .user-info span');
    if (nombreDisplay) nombreDisplay.innerText = usuario.nombre;

    // Actualizar Avatar (si existe)
    const avatarDisplay = document.querySelector('.avatar-large');
    if (avatarDisplay && usuario.nombre) {
        const iniciales = usuario.nombre.split(' ').map(n => n[0]).join('').toUpperCase();
        avatarDisplay.innerText = iniciales;
    }
    console.log("Interfaz inicializada para:", usuario.nombre);
}

// Usamos DOMContentLoaded en lugar de window.onload para evitar conflictos
document.addEventListener('DOMContentLoaded', inicializarInterfaz);

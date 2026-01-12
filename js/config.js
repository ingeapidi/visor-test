// js/config.js

// 1. Datos de conexión (Cópialos de Supabase > Settings > API)
const SB_URL = "https://nlimqewcchsczzccgkme.supabase.co";
const SB_KEY = "sb_publishable_t6-SiscKU7BChhVzzHnnyA_KNmVyWur";

// 2. Inicializar el cliente global que usaremos en todas las páginas
// Usamos 'supabase' como nombre de variable para el cliente
const client = supabase.createClient(SB_URL, SB_KEY);

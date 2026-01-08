// TU DIRECCIÓN FIJA
const API_URL = "https://subepiglottic-hypobaric-lesha.ngrok-free.dev";

const map = new maplibregl.Map({
    container: 'map',
    style: { version: 8, sources: { 'osm': { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 }}, layers: [{ id: 'osm-layer', type: 'raster', source: 'osm' }]},
    center: [-60, -32], zoom: 4
});

const uppy = new Uppy.Uppy({ restrictions: { allowedFileTypes: ['.tif', '.tiff'] }})
    .use(Uppy.Dashboard, { inline: true, target: '#drag-drop-area', height: 300 })
    .use(Uppy.XHRUpload, { endpoint: `${API_URL}/upload`, fieldName: 'files[]' });

// Escala Térmica Dinámica (Azul -> Verde -> Rojo)
function colorRamp(val, min, max) {
    if (val === -9999 || isNaN(val)) return [0,0,0,0];
    const r = Math.min(1, Math.max(0, (val - min) / (max - min)));
    let red = r < 0.5 ? 0 : Math.floor((r - 0.5) * 2 * 255);
    let green = r < 0.5 ? Math.floor(r * 2 * 255) : Math.floor((1 - r) * 2 * 255);
    let blue = r < 0.5 ? Math.floor((0.5 - r) * 2 * 255) : 0;
    return [red, green, blue, 255];
}

async function visualizar(filename, tipo, minZ, maxZ) {
    const base = filename.split('.')[0];
    const url = `${API_URL}/data/cog_${base}.tif?t=${Date.now()}`;
    const tiff = await GeoTIFF.fromUrl(url);
    const image = await tiff.getImage();
    const bbox = image.getBoundingBox();
    const rasters = await image.readRasters({ width: 1024, height: 1024 });
    
    const canvas = document.createElement('canvas');
    canvas.width = rasters.width; canvas.height = rasters.height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(canvas.width, canvas.height);

    for (let i = 0; i < rasters[0].length; i++) {
        let c = tipo === "MDT" ? colorRamp(rasters[0][i], minZ, maxZ) : [rasters[0][i], rasters[1][i], rasters[2][i], (rasters[0][i] === 0 ? 0 : 255)];
        imgData.data[i*4]=c[0]; imgData.data[i*4+1]=c[1]; imgData.data[i*4+2]=c[2]; imgData.data[i*4+3]=c[3];
    }
    ctx.putImageData(imgData, 0, 0);

    const id = `layer-${base}`;
    if (map.getLayer(id)) { map.removeLayer(id); map.removeSource(id); }
    map.addSource(id, { type: 'canvas', canvas: canvas, coordinates: [[bbox[0], bbox[3]], [bbox[2], bbox[3]], [bbox[2], bbox[1]], [bbox[0], bbox[1]]] });
    map.addLayer({ id: id, type: 'raster', source: id });
    map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 50 });
}

async function actualizarLista() {
    const res = await fetch(`${API_URL}/list-files`);
    const archivos = await res.json();
    document.getElementById('file-list').innerHTML = archivos.map(a => `
        <li class="file-item">
            <div><strong>${a.name}</strong><br><small>${a.tipo === 'MDT' ? `Elevación: ${a.min_z}-${a.max_z}m` : 'Imagen RGB'}</small></div>
            <div>
                <button onclick="visualizar('${a.name}','${a.tipo}',${a.min_z},${a.max_z})">📍</button>
                <a href="${API_URL}/data/${a.name}" class="btn-dl">TIF</a>
                <a href="${API_URL}/data/calidad_${a.name.split('.')[0]}.jp2" class="btn-dl" style="background:#8e44ad">JP2</a>
            </div>
        </li>`).join('');
}

uppy.on('complete', (res) => {
    if (res.successful.length > 0) {
        const fn = res.successful[0].name;
        const itv = setInterval(async () => {
            const r = await fetch(`${API_URL}/progress/${fn}`);
            const d = await r.json();
            document.getElementById('status-text').innerText = `${d.etapa} (${d.percent}%)`;
            if (d.percent === 100) { clearInterval(itv); actualizarLista(); }
        }, 2000);
    }
});
document.addEventListener('DOMContentLoaded', actualizarLista);

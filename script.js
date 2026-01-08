// REEMPLAZA ESTO CON TU DOMINIO ESTATICO DE NGROK
const API_URL = "subepiglottic-hypobaric-lesha.ngrok-free.dev";

const map = new maplibregl.Map({
    container: 'map',
    style: { version: 8, sources: { 'osm': { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 }}, layers: [{ id: 'osm-layer', type: 'raster', source: 'osm' }]},
    center: [-60, -32], zoom: 4
});

const uppy = new Uppy.Uppy({ restrictions: { allowedFileTypes: ['.tif', '.tiff'] }})
    .use(Uppy.Dashboard, { inline: true, target: '#drag-drop-area', height: 300 })
    .use(Uppy.XHRUpload, { endpoint: `${API_URL}/upload`, fieldName: 'files[]' });

function getColor(val, min, max) {
    if (val === -9999 || isNaN(val)) return [0,0,0,0];
    const r = (val - min) / (max - min); // Normalización dinámica
    const ratio = Math.min(1, Math.max(0, r));
    let red=0, green=0, blue=0;
    if (ratio < 0.25) { blue=255; green=Math.floor(ratio*4*255); }
    else if (ratio < 0.5) { blue=Math.floor((0.5-ratio)*4*255); green=255; }
    else if (ratio < 0.75) { green=255; red=Math.floor((ratio-0.5)*4*255); }
    else { green=Math.floor((1-ratio)*4*255); red=255; }
    return [red, green, blue, 255];
}

async function visualizar(filename, tipo, minZ, maxZ) {
    const base = filename.split('.')[0];
    const cogUrl = `${API_URL}/data/cog_${base}.tif?t=${Date.now()}`;
    const layerId = `layer-${base}`;

    try {
        const tiff = await GeoTIFF.fromUrl(cogUrl);
        const image = await tiff.getImage();
        const bbox = image.getBoundingBox();
        const rasters = await image.readRasters({ width: 1024, height: 1024 });
        
        const canvas = document.createElement('canvas');
        canvas.width = rasters.width; canvas.height = rasters.height;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(canvas.width, canvas.height);

        for (let i = 0; i < rasters[0].length; i++) {
            let color;
            if (tipo === "MDT") {
                color = getColor(rasters[0][i], minZ, maxZ);
            } else {
                const r = rasters[0][i], g = rasters[1][i], b = rasters[2][i];
                color = (r === 0 && g === 0 && b === 0) ? [0,0,0,0] : [r, g, b, 255];
            }
            imgData.data[i*4]=color[0]; imgData.data[i*4+1]=color[1]; imgData.data[i*4+2]=color[2]; imgData.data[i*4+3]=color[3];
        }
        ctx.putImageData(imgData, 0, 0);

        if (map.getLayer(layerId)) { map.removeLayer(layerId); map.removeSource(layerId); }
        map.addSource(layerId, { type: 'canvas', canvas: canvas, coordinates: [[bbox[0], bbox[3]], [bbox[2], bbox[3]], [bbox[2], bbox[1]], [bbox[0], bbox[1]]] });
        map.addLayer({ id: layerId, type: 'raster', source: layerId });
        map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 50 });
    } catch (e) { console.error(e); }
}

async function actualizarPanel() {
    const res = await fetch(`${API_URL}/list-files`);
    const archivos = await res.json();
    document.getElementById('file-list').innerHTML = archivos.map(a => `
        <li class="file-item">
            <div><strong>${a.name}</strong><br><small>${a.tipo === 'MDT' ? `Z: ${a.min_z} a ${a.max_z}m` : 'Imagen RGB'}</small></div>
            <div>
                <button onclick="visualizar('${a.name}','${a.tipo}',${a.min_z},${a.max_z})">📍</button>
                <a href="${API_URL}/data/${a.name}" class="btn-dl">TIF</a>
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
            if (d.percent === 100) { clearInterval(itv); actualizarPanel(); }
        }, 2000);
    }
});
document.addEventListener('DOMContentLoaded', actualizarPanel);

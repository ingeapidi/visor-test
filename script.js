const API_URL = "https://subepiglottic-hypobaric-lesha.ngrok-free.dev";
const headersNgrok = { 'ngrok-skip-browser-warning': 'true' };

const map = new maplibregl.Map({
    container: 'map',
    style: { version: 8, sources: { 'osm': { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 }}, layers: [{ id: 'osm-layer', type: 'raster', source: 'osm' }]},
    center: [-60, -32], zoom: 4
});

const uppy = new Uppy.Uppy({ restrictions: { allowedFileTypes: ['.tif', '.tiff'] }})
    .use(Uppy.Dashboard, { inline: true, target: '#drag-drop-area', height: 300 })
    .use(Uppy.XHRUpload, { endpoint: `${API_URL}/upload`, fieldName: 'files[]', headers: headersNgrok });

// RAMPA DE COLOR TÉRMICA PARA MDT (Estilo Global Mapper)
function colorRamp(val, min, max) {
    if (val === -9999 || isNaN(val)) return [0,0,0,0];
    const r = Math.min(1, Math.max(0, (val - min) / (max - min)));
    let red, green, blue;
    if (r < 0.2) { red = 0; green = Math.floor(r * 5 * 255); blue = 255; }
    else if (r < 0.4) { red = 0; green = 255; blue = Math.floor((0.4 - r) * 5 * 255); }
    else if (r < 0.6) { red = Math.floor((r - 0.4) * 5 * 255); green = 255; blue = 0; }
    else if (r < 0.8) { red = 255; green = Math.floor((0.8 - r) * 5 * 255 + 128); blue = 0; }
    else { red = 255; green = Math.floor((1 - r) * 5 * 128); blue = 0; }
    return [red, green, blue, 255];
}

async function visualizar(filename, tipo, minZ, maxZ) {
    const base = filename.split('.')[0];
    const url = `${API_URL}/data/cog_${base}.tif?t=${Date.now()}`;
    const tiff = await GeoTIFF.fromUrl(url, { headers: headersNgrok });
    const image = await tiff.getImage();
    const bbox = image.getBoundingBox();
    
    // Leemos los canales: MDT tendrá 1 solo, Orto tendrá 3 o más
    const rasters = await image.readRasters({ width: 1024, height: 1024 });
    
    const canvas = document.createElement('canvas');
    canvas.width = rasters.width; canvas.height = rasters.height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(canvas.width, canvas.height);

    for (let i = 0; i < rasters[0].length; i++) {
        let c;
        if (tipo === "MDT") {
            c = colorRamp(rasters[0][i], minZ, maxZ);
        } else {
            // Caso ORTOMOSAICO: Leemos RGB original
            const r = rasters[0][i], g = rasters[1][i], b = rasters[2][i];
            c = (r === 0 && g === 0 && b === 0) ? [0,0,0,0] : [r, g, b, 255];
        }
        const idx = i * 4;
        imgData.data[idx]=c[0]; imgData.data[idx+1]=c[1]; imgData.data[idx+2]=c[2]; imgData.data[idx+3]=c[3];
    }
    ctx.putImageData(imgData, 0, 0);

    const id = `layer-${base}`;
    if (map.getLayer(id)) { map.removeLayer(id); map.removeSource(id); }
    map.addSource(id, { type: 'canvas', canvas: canvas, coordinates: [[bbox[0], bbox[3]], [bbox[2], bbox[3]], [bbox[2], bbox[1]], [bbox[0], bbox[1]]] });
    map.addLayer({ id: id, type: 'raster', source: id });
    map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 50 });
}

async function actualizarLista() {
    const res = await fetch(`${API_URL}/list-files`, { headers: headersNgrok });
    const archivos = await res.json();
    document.getElementById('file-list').innerHTML = archivos.map(a => {
        const base = a.name.split('.')[0];
        // Si es Ortomosaico, habilitamos botón JP2. Si es MDT, solo TIF
        const btnDownload = a.tipo === "ORTOMOSAICO" 
            ? `<a href="${API_URL}/data/calidad_${base}.jp2" class="btn-dl" style="background:#8e44ad">JP2</a>`
            : `<a href="${API_URL}/data/${a.name}" class="btn-dl">TIF</a>`;
            
        return `
        <li class="file-item">
            <div><strong>${a.name}</strong><br><small>${a.tipo === 'MDT' ? `MDT (${a.min_z}-${a.max_z}m)` : 'Ortomosaico RGB'}</small></div>
            <div>
                <button onclick="visualizar('${a.name}','${a.tipo}',${a.min_z},${a.max_z})">📍</button>
                ${btnDownload}
            </div>
        </li>`;
    }).join('');
}

uppy.on('complete', (res) => {
    if (res.successful.length > 0) {
        const fn = res.successful[0].name;
        const itv = setInterval(async () => {
            const r = await fetch(`${API_URL}/progress/${fn}`, { headers: headersNgrok });
            const d = await r.json();
            document.getElementById('status-text').innerText = `${d.etapa} (${d.percent}%)`;
            if (d.percent === 100) { clearInterval(itv); actualizarLista(); }
        }, 2000);
    }
});
document.addEventListener('DOMContentLoaded', actualizarLista);

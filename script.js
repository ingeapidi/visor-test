const API_URL = "https://subepiglottic-hypobaric-lesha.ngrok-free.dev";
const headersNgrok = { 'ngrok-skip-browser-warning': 'true' };

const map = new maplibregl.Map({
    container: 'map',
    style: { version: 8, sources: { 'osm': { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 }}, layers: [{ id: 'osm-layer', type: 'raster', source: 'osm' }]},
    center: [-60, -32], zoom: 4
});

const uppy = new Uppy.Uppy({ restrictions: { allowedFileTypes: ['.tif', '.tiff'] }})
    .use(Uppy.Dashboard, { inline: true, target: '#drag-drop-area', height: 280, proudlyDisplayPoweredByUppy: false })
    .use(Uppy.XHRUpload, { endpoint: `${API_URL}/upload`, fieldName: 'files[]', headers: headersNgrok });

function colorRamp(val, min, max) {
    if (val === -9999 || isNaN(val)) return [0,0,0,0];
    const r = Math.min(1, Math.max(0, (val - min) / (max - min)));
    let red, green, blue;
    if (r < 0.25) { red = 0; green = Math.floor(r*4*255); blue = 255; }
    else if (r < 0.5) { red = 0; green = 255; blue = Math.floor((0.5-r)*4*255); }
    else if (r < 0.75) { red = Math.floor((r-0.5)*4*255); green = 255; blue = 0; }
    else { red = 255; green = Math.floor((1-r)*4*255); blue = 0; }
    return [red, green, blue, 255];
}

async function gestionarCapa(filename, tipo, minZ, maxZ, btn) {
    const base = filename.substring(0, filename.lastIndexOf('.'));
    const id = `layer-${base}`;
    const legend = document.getElementById('mdt-legend');

    if (map.getLayer(id)) {
        const vis = map.getLayoutProperty(id, 'visibility') || 'visible';
        const newVis = vis === 'visible' ? 'none' : 'visible';
        map.setLayoutProperty(id, 'visibility', newVis);
        btn.innerText = newVis === 'visible' ? '👁️' : '🕶️';
        if (tipo === "MDT") legend.style.display = (newVis === 'visible') ? 'block' : 'none';
        return;
    }

    btn.innerText = '⌛';
    const url = `${API_URL}/data/cog_${base}.tif?t=${Date.now()}`;
    
    try {
        const tiff = await GeoTIFF.fromUrl(url, { headers: headersNgrok });
        const image = await tiff.getImage();
        const bbox = image.getBoundingBox();
        const rasters = await image.readRasters({ width: 1024, height: 1024 });
        
        const canvas = document.createElement('canvas');
        canvas.width = rasters.width; canvas.height = rasters.height;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(canvas.width, canvas.height);

        for (let i = 0; i < rasters[0].length; i++) {
            let c = (tipo === "MDT") 
                ? colorRamp(rasters[0][i], minZ, maxZ) 
                : [rasters[0][i], rasters[1][i], rasters[2][i], (rasters[0][i] === 0 ? 0 : 255)];
            imgData.data[i*4]=c[0]; imgData.data[i*4+1]=c[1]; imgData.data[i*4+2]=c[2]; imgData.data[i*4+3]=c[3];
        }
        ctx.putImageData(imgData, 0, 0);

        map.addSource(id, { type: 'canvas', canvas: canvas, coordinates: [[bbox[0], bbox[3]], [bbox[2], bbox[3]], [bbox[2], bbox[1]], [bbox[0], bbox[1]]] });
        map.addLayer({ id: id, type: 'raster', source: id });
        map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 50 });

        btn.innerText = '👁️';
        if (tipo === "MDT") {
            legend.style.display = 'block';
            document.getElementById('z-min').innerText = `${minZ}m`;
            document.getElementById('z-max').innerText = `${maxZ}m`;
        }
    } catch (e) { btn.innerText = '❌'; }
}

async function actualizarLista() {
    const res = await fetch(`${API_URL}/list-files`, { headers: headersNgrok });
    const archivos = await res.json();
    document.getElementById('file-list').innerHTML = archivos.map(a => {
        const base = a.name.substring(0, a.name.lastIndexOf('.'));
        // Botón dinámico según el tipo detectado
        const btnDownload = a.tipo === "ORTOMOSAICO" 
            ? `<a href="${API_URL}/data/calidad_${base}.jp2" class="btn-dl" style="background:#8e44ad">JP2</a>`
            : `<a href="${API_URL}/data/${a.name}" class="btn-dl">TIF</a>`;

        return `
        <li class="file-item">
            <div style="flex:1"><strong>${a.name}</strong><br><small>${a.tipo || 'Pendiente'}</small></div>
            <div class="actions">
                <button class="btn-eye" onclick="gestionarCapa('${a.name}','${a.tipo}',${a.min_z},${a.max_z}, this)">👁️</button>
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

from pyscript import display, document
import pyproj
import re

async def procesar_coordenadas(event):
    # 1. Obtener valores de la web
    texto_input = document.getElementById("coord-input").value
    epsg_target = document.getElementById("epsg-input").value
    output_div = document.getElementById("output")

    if not texto_input or not epsg_target:
        output_div.innerText = "⚠️ Por favor, completa todos los campos."
        return

    try:
        # 2. Limpieza de coordenadas (Regex que ya conoces)
        numeros = re.findall(r"[-+]?\d*\.\d+|\d+", texto_input)
        lat, lon, h_elip = float(numeros[0]), float(numeros[1]), float(numeros[2])

        # 3. Proyección Geodésica
        wgs84 = pyproj.CRS("EPSG:4326")
        target = pyproj.CRS(f"EPSG:{epsg_target}")
        transformer = pyproj.Transformer.from_crs(wgs84, target, always_xy=True)
        east, north = transformer.transform(lon, lat)

        # 4. Mostrar resultado en la web
        resultado = f"""
✅ PROYECCIÓN EXITOSA:
-----------------------------------
NORTE (N): {north:.4f}
ESTE (E):  {east:.4f}
Z (Elips): {h_elip:.4f} m
SISTEMA:   {target.name}
-----------------------------------
"""
        output_div.innerText = resultado

    except Exception as e:
        output_div.innerText = f"❌ Error: {str(e)}"

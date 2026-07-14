# Movimientos MBC — backend

Este es el servicio intermediario que guarda la llave de Anthropic de forma
segura. El dashboard "Movimientos MBC" le habla a este servicio en vez de
hablarle directo a la API de Anthropic, así que la llave nunca queda expuesta
en el navegador de quien abra el dashboard.

## Qué hace

Expone:

- `GET /` — confirma que el servicio está activo.
- `GET /health` — indica si la llave de Anthropic ya quedó configurada.
- `POST /api/query` — recibe `{ system, prompt, maxTokens }`, llama a la API
  de Anthropic (modelo `claude-sonnet-4-6`) con el conector MCP de Foodology
  Redshift ya configurado, y devuelve `{ text, stop_reason }`.

## Desplegar en Render (recomendado: usando el Blueprint)

Esta carpeta incluye `render.yaml`, que le dice a Render exactamente qué tipo
de servicio crear (Web Service, no Static Site) y qué comandos usar — así se
evita el error más común de esta configuración.

1. Sube esta carpeta completa (`server.js`, `package.json`, `render.yaml`) a
   un repositorio de GitHub (puede ser privado).
2. Si ya tienes un servicio anterior mal configurado (por ejemplo, como
   Static Site), **bórralo** desde su página en Render (Settings → Delete).
3. En Render: **New +** → **Blueprint** → conecta ese repositorio.
4. Render detecta `render.yaml` automáticamente y te muestra el servicio
   `movimientos-mbc-backend` de tipo **Web Service**, listo para crear.
5. Antes de confirmar (o justo después, en la pestaña **Environment**),
   completa el valor de:
   - `ANTHROPIC_API_KEY` = tu llave de la API de Anthropic (la generas en
     [console.anthropic.com](https://console.anthropic.com), sección API Keys).

   **Esto lo debes hacer tú directamente en Render** — nunca pegues la llave
   en el código ni se la compartas a nadie por chat o correo.
6. `FOODOLOGY_MCP_TOKEN` déjalo vacío a menos que el equipo de datos te
   confirme que el conector MCP de Foodology exige su propio token.
7. Despliega y espera a que el status quede en **Live**.

## Verificar que quedó bien

Abre en el navegador la URL de tu servicio + `/health`, por ejemplo:
`https://movimientos-mbc-backend.onrender.com/health`

- `{"ok":true,"has_api_key":true}` → todo listo, sigue al paso 8.
- `{"ok":true,"has_api_key":false}` → falta agregar `ANTHROPIC_API_KEY` en Environment.
- Página en blanco con solo la palabra **"Not Found"** (sin JSON) → el servicio
  se creó como Static Site o el build falló. Revisa la pestaña **Logs**: debe
  decir algo como `Movimientos MBC backend escuchando en el puerto 10000`. Si
  no aparece eso, borra el servicio y repite el paso 3 usando **Blueprint**.

## Conectar el dashboard

8. Abre el archivo `foodology_inventario_dashboard.html`, busca:
   ```js
   const BACKEND_URL = "...";
   ```
   y confirma que apunte a tu URL real seguida de `/api/query`, por ejemplo:
   ```js
   const BACKEND_URL = "https://movimientos-mbc-backend.onrender.com/api/query";
   ```
9. Guarda y comparte el HTML — cualquiera que lo abra podrá consultar el
   warehouse en vivo, sin ver la llave.

## Nota sobre el plan gratuito de Render

Si usas el plan free, el servicio "duerme" tras un rato sin uso y la primera
consulta después de eso tarda unos segundos más en responder mientras
despierta. Es normal, no es un error.


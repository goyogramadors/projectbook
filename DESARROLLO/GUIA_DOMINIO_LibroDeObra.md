# 🌐 Guía — Publicar "Libro de Obra Digital" en su propio dominio (`librodeobra.cl`)

> **Para Andrés / Gregorio.** Cómo dejar la landing del producto **Libro de Obra Digital** servida en el dominio **`librodeobra.cl`**, de la forma más simple posible.
> **Resultado:** abrir `https://librodeobra.cl` carga la experiencia LDO (solo Libro de Obras + Carpeta Digital), y `https://archibots.cl` sigue mostrando Archiblocks completo. Mismo código, misma cuenta, mismo backend.

---

## 0. Lo importante primero: NO hay que tocar código

La app es **host-aware**: al cargar lee el dominio y decide qué producto mostrar.
En `Web/src/core/product/product.ts` (línea 60) ya está contemplado `librodeobra.cl`:

```ts
if (host.startsWith('librodeobra.') || host === 'librodeobra.cl') return 'librodeobra';
return 'archiblocks';
```

Por lo tanto esto es **solo configuración de dominio + DNS**. No requiere cambios de código, ni variables de entorno, ni un build aparte. El mismo deploy de Cloudflare Pages sirve los dos dominios.

---

## 1. Requisito previo: tener el dominio

Registrar (o ya tener) **`librodeobra.cl`** en **NIC Chile** (https://nic.cl). Es el único costo obligatorio (~$/año en NIC).

---

## 2. Camino recomendado (el más simple y robusto): mover el DNS a Cloudflare

Como el sitio ya vive en **Cloudflare Pages** (proyecto `projectbook`), lo más limpio para un dominio **apex** (`.cl` sin subdominio) es tener su DNS en Cloudflare. Así Cloudflare crea los registros solos y el apex funciona (CNAME flattening), cosa que el DNS de NIC normalmente no resuelve bien para un dominio raíz.

**Paso 2.1 — Agregar el dominio a Cloudflare**
1. En el dashboard de Cloudflare (la misma cuenta donde está `archibots.cl`): **Add a site** → escribe `librodeobra.cl` → plan **Free**.
2. Cloudflare escanea y te muestra **dos nameservers** (algo como `xxx.ns.cloudflare.com`). Anótalos.

**Paso 2.2 — Apuntar NIC Chile a Cloudflare**
1. Entra a tu cuenta en **nic.cl** → dominio `librodeobra.cl` → **Editar / Servidores de nombre (DNS)**.
2. Reemplaza los nameservers actuales por los **dos de Cloudflare** del paso anterior.
3. Guarda. La propagación suele tardar de minutos a unas horas; Cloudflare te avisa por correo cuando el dominio queda **Active**.

> Si prefieres **NO** mover el DNS de NIC, es posible pero más frágil para el apex (depende de que NIC soporte ALIAS/redirección de raíz). Mover la zona a Cloudflare es lo recomendado y mantiene todo en un solo lugar.

---

## 3. Conectar el dominio al proyecto de Cloudflare Pages

1. Cloudflare → **Workers & Pages** → proyecto **`projectbook`** → pestaña **Custom domains**.
2. **Set up a custom domain** → escribe **`librodeobra.cl`** → continuar.
3. Como la zona ya está en Cloudflare (paso 2), Pages **crea el registro automáticamente**. Espera a que el estado pase a **Active** y a que emita el **certificado SSL** (HTTPS) — esto es automático.

Eso es todo: `https://librodeobra.cl` ya sirve el mismo sitio y el código lo resuelve como producto LDO.

---

## 4. Manejo de `www` (recomendado)

El código resuelve `librodeobra.cl` y `librodeobra.archibots.cl`, **pero no** `www.librodeobra.cl` (ese caería a Archiblocks). Para evitar confusión, haz que `www` redirija al apex:

- Cloudflare → dominio `librodeobra.cl` → **Rules → Redirect Rules** → crea una regla:
  - **Si** el hostname es `www.librodeobra.cl`
  - **Entonces** redirección **301** a `https://librodeobra.cl/$1` (preservando la ruta).

(Alternativa: no publicar `www` en absoluto y comunicar solo el apex `librodeobra.cl`.)

---

## 5. Verificación

1. Abre **`https://librodeobra.cl`** → debe cargar la **landing de Libro de Obra Digital** (marca "Libro de Obra Digital — un producto de Archiblocks", solo las dos herramientas).
2. Abre **`https://archibots.cl`** → debe seguir mostrando **Archiblocks** completo, sin cambios.
3. Candado HTTPS válido en ambos.
4. Prueba de humo del código sin depender de DNS: en cualquier dominio, `…/?product=librodeobra` fuerza el modo LDO (y `?product=archiblocks` lo revierte). Útil para confirmar la app antes de que propague el dominio.

---

## 6. Opcional / más adelante (no bloquea el lanzamiento)

Estos detalles eran parte del antiguo plan; no son necesarios para tener la landing en vivo, pero conviene tenerlos en el radar:

- **Título y favicon por producto.** El `<title>` y el favicon de `Web/index.html` son estáticos (marca Archiblocks). Si se quiere que la pestaña del navegador diga "Libro de Obra Digital" en `librodeobra.cl`, hay que setear `document.title`/favicon según `PRODUCT` al arrancar la app. Cosmético.
- **Enlaces de invitación product-aware.** Las Cloud Functions de invitación (`sendInviteEmail` / `sendPremiumInviteEmail`) generan enlaces con base `https://archibots.cl/...`. Una invitación creada desde una **obra** idealmente debería apuntar a `https://librodeobra.cl/o/...`. Se resuelve pasando el origen/producto a la function o derivándolo del `Origin` de la request. Pendiente menor; las invitaciones hoy igual funcionan (llevan a archibots.cl).

---

## 7. Si algo sale mal (rollback)

- Quitar el dominio en **Pages → Custom domains** deja `librodeobra.cl` sin servir, sin afectar a `archibots.cl`.
- Revertir nameservers en NIC devuelve el control del DNS a NIC.
- Nada de esto toca el deploy ni el código de producción.

---

## 8. Resumen en una línea

Registrar `librodeobra.cl` → mover su DNS a Cloudflare → añadirlo como Custom Domain del proyecto Pages `projectbook` → (opcional) redirigir `www` al apex → verificar. **Cero cambios de código.**

# 🛠️ Script para Generar Artículos de Prueba

Este script genera 50 artículos de ejemplo en tu marketplace para poder probar la funcionalidad.

## 📋 Qué Genera

- **50 artículos** con datos realistas
- **8 categorías** diferentes (Computación, Celulares, Audio, etc.)
- **Precios variados** según categoría
- **Imágenes placeholder** de Picsum Photos
- **Condiciones variadas** (Nuevo, Como Nuevo, Usado, etc.)
- **Descripciones realistas**

## 🚀 Cómo Usar

### Opción 1: Desde la Consola del Navegador (RECOMENDADO)

1. **Abre tu aplicación** en el navegador:

   ```
   http://localhost:5173
   ```

2. **la consola del navegador**:
   - Windows/Linux: `F12` o `Ctrl + Shift + J`
   - Mac: `Cmd + Option + J`

3. **Abre el archivo** `generate-items-browser.js`:
   - Está en la raíz del proyecto
   - Copia TODO su contenido

4. **Pega en la consola** y presiona `Enter`

5. **Espera** a que termine (verás logs en verde):

   ```
   ✅ [1/50] Laptop Dell XPS 1 - $45,000
   ✅ [2/50] iPhone 14 Pro 2 - $120,000
   ...
   🎉 ¡Generación completada!
   ```

6. **Recarga la página** para ver los artículos

### Opción 2: Desde Node.js (Requiere configuración)

⚠️ **Nota**: Esta opción puede dar errores de permisos con Firebase.

```bash
npx tsx generate-items.ts
```

## ✨ Características de los Artículos Generados

### Categorías

- Computación (Laptops, PCs, Monitores, etc.)
- Celulares y Teléfonos
- Audio y Video
- Videojuegos (Consolas, juegos, etc.)
- Muebles y Decoración
- Electrodomésticos
- Moda y Accesorios
- Deportes y Fitness

### Rangos de Precio

- Computación: $15,000 - $250,000
- Celulares: $30,000 - $300,000
- Audio y Video: $10,000 - $80,000
- Videojuegos: $50,000 - $180,000
- Y más...

### Estados del Producto

- `new` - Nuevo
- `like_new` - Como Nuevo
- `good` - Usado - Buen Estado
- `fair` - Usado - Aceptable

## 🎯 Datos Generados

Cada artículo incluye:

- ✅ Título descriptivo
- ✅ Descripción realista
- ✅ Precio acorde a la categoría
- ✅ 3 imágenes placeholder
- ✅ Categoría
- ✅ Condición del producto
- ✅ ID de vendedor (aleatorio)
- ✅ Estado: AVAILABLE
- ✅ Keywords para búsqueda
- ✅ Timestamp de creación

## 🔧 Personalización

Si quieres modificar los datos generados, edita el archivo `generate-items-browser.js`:

- **Categorías**: Array `categories`
- **Nombres de productos**: Objeto `productsByCategory`
- **Descripciones**: Array `descriptions`
- **Rangos de precio**: Función `generatePrice()`

## 🐛 Solución de Problemas

### Error: "Cannot find module"

- Asegúrate de estar ejecutando el script desde la consola del navegador
- NO desde la terminal de Node.js

### No aparecen los artículos

- Recarga la página (F5 o Cmd+R)
- Verifica la consola para ver si hubo errores
- Revisa que Firebase esté correctamente configurado

### Permisos denegados

- El script desde el navegador usa las credenciales de tu sesión
- Asegúrate de estar logueado en la aplicación
- Las reglas de Firestore deben permitir escritura

## 📝 Notas

- Los artículos se crean con `sellerId` de prueba
- Las imágenes son placeholders aleatorios de Picsum
- Puedes ejecutar el script múltiples veces
- Cada ejecución crea 50 artículos NUEVOS (no reemplaza)

## 🎨 Próximos Pasos

Después de generar los artículos:

1. Recarga la página principal
2. Explora el marketplace
3. Prueba búsquedas y filtros
4. Verifica que las categorías funcionen
5. Revisa las páginas de detalle

---

💡 **Tip**: Si quieres limpiar los artículos de prueba después, puedes hacerlo desde Firebase Console → Firestore → Colección `items`

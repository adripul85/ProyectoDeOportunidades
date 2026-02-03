# 🚀 Generar Artículos - Instrucciones

## ⚠️ Problema Actual

El script falla porque las reglas de Firestore requieren autenticación. Necesitas hacer cambios temporales.

## 📝 Solución Rápida

### Paso 1: Cambiar Reglas de Firestore (Temporal)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **deoportunidades**
3. Ve a **Firestore Database** → **Reglas**
4. Reemplaza las reglas actuales con estas **TEMPORALES**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORAL: Permitir escritura en items sin autenticación
    match /items/{itemId} {
      allow read: if true;
      allow write: if true;  // ⚠️ TEMPORAL - CAMBIAR DESPUÉS
    }
    
    // Mantener otras reglas como están
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

1. Haz clic en **Publicar**

### Paso 2: Ejecutar el Script

```bash
node generate-items.mjs
```

Verás algo como:

```
🚀 Iniciando generación de 50 artículos...

✅ [1/50] Laptop Dell XPS 1 - $125,450
✅ [2/50] iPhone 14 Pro 2 - $289,900
...
🎉 ¡Generación completada exitosamente!
📊 Total creado: 50/50 artículos
```

### Paso 3: Restaurar Reglas de Seguridad

**MUY IMPORTANTE:** Después de generar los artículos, vuelve a Firebase Console y cambia las reglas a:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /items/{itemId} {
      allow read: if true;
      allow create: if request.auth != null;  // ✅ Solo usuarios autenticados
      allow update, delete: if request.auth != null && 
                              request.auth.uid == resource.data.sellerId;
    }
    
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Paso 4: Borrar el Script

```bash
del generate-items.mjs
```

O simplemente bórralo desde VS Code.

---

## 🔄 Alternativa: Usar la Consola del Navegador

Si no quieres tocar las reglas de Firestore, usa el script del navegador:

1. Abre <http://localhost:5173>
2. Presiona F12
3. Copia todo el contenido de `generate-items-browser.js`
4. Pégalo en la consola y presiona Enter

Esto funciona porque usa tu sesión autenticada de usuario.

---

## ❓ ¿Cuál método usar?

| Método | Pros | Contras |
|--------|------|---------|
| **Node.js** | Más rápido, automatizado | Requiere cambiar reglas temporalmente |
| **Navegador** | No requiere cambios de seguridad | Manual, copiar/pegar |

**Recomendación:** Si vas a hacer esto solo una vez, usa el navegador. Si necesitas generar datos varias veces, usa Node.js.

---

## 🆘 Si tienes problemas

- Asegúrate de publicar las reglas en Firebase Console
- Espera 30 segundos después de cambiar las reglas
- Verifica que estés en el proyecto correcto (deoportunidades)
- Si persiste el error, usa el método del navegador

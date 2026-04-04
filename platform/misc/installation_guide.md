# 📄 Módulo de Certificados Ciudadanos - Guía de Instalación

## 🚀 Instalación de Dependencias

Para implementar el sistema de certificados ciudadanos, necesitas instalar las siguientes dependencias:

```bash
# Dependencias principales
npm install jspdf qrcode

# Tipos de TypeScript (si usas TypeScript)
npm install --save-dev @types/qrcode
```

## 📁 Estructura de Archivos

```
platform/frontend-mobile/web/src/
├── utils/
│   └── certificates/
│       └── generateCitizenCertificate.ts
├── components/
│   ├── certificates/
│   │   └── CertificateDownloadButton.tsx
│   └── profile/
│       └── CitizenProfileActions.tsx
└── types/
    └── certificates.ts (opcional)
```

## 🛠️ Configuración

### 1. Configurar Variables de Entorno

Crea o actualiza tu archivo `.env`:

```env
# URLs de la plataforma
REACT_APP_PLATFORM_URL=https://shout-aloud.platform
REACT_APP_VERIFICATION_URL=https://shout-aloud.platform/verify

# Configuración de certificados
REACT_APP_ENABLE_CERTIFICATES=true
REACT_APP_MAX_ACHIEVEMENTS_IN_CERTIFICATE=3
```

### 2. Configurar Webpack (si es necesario)

Si encuentras problemas con las dependencias PDF, añade a tu `webpack.config.js`:

```javascript
module.exports = {
  // ... otras configuraciones
  resolve: {
    fallback: {
      "buffer": require.resolve("buffer/"),
      "stream": require.resolve("stream-browserify")
    }
  }
};
```

## 🎨 Personalización del Diseño

### Colores del Tema

Puedes personalizar los colores editando el objeto `COLORS` en `generateCitizenCertificate.ts`:

```typescript
const COLORS = {
  primary: '#2563eb',     // Azul principal
  secondary: '#64748b',   // Gris secundario
  accent: '#f59e0b',      // Naranja para logros
  success: '#10b981',     // Verde para éxito
  text: '#1f2937',        // Texto principal
  light: '#f8fafc',       // Fondo claro
  border: '#e2e8f0'       // Bordes
};
```

### Frases Motivacionales

Personaliza las frases por nivel en `MOTIVATIONAL_PHRASES`:

```typescript
const MOTIVATIONAL_PHRASES = {
  1: "Tu frase para nivel 1",
  2: "Tu frase para nivel 2",
  // ... etc
};
```

## 🔧 Integración con Componentes Existentes

### En CitizenProfilePage.tsx

```typescript
import { CitizenProfileActions } from '../components/profile/CitizenProfileActions';

// Dentro de tu componente
<CitizenProfileActions
  userData={userData}
  reputation={reputationData}
  achievements={achievementsData}
  stats={participationStats}
/>
```

### Datos Requeridos

Asegúrate de que tus componentes proporcionen los datos en el formato correcto:

```typescript
// Ejemplo de transformación de datos
const transformUserDataForCertificate = (user: YourUserType): UserData => ({
  id: user.id,
  name: user.displayName,
  did: user.decentralizedId,
  registrationDate: new Date(user.createdAt),
  location: {
    city: user.profile?.city,
    country: user.profile?.country
  },
  publicProfile: user.settings?.publicProfile ?? false
});
```

## 🛡️ Consideraciones de Seguridad

### 1. Validación de Datos

Siempre valida los datos antes de generar certificados:

```typescript
const validateCertificateData = (userData: UserData, reputation: ReputationData) => {
  if (!userData.id || !reputation.level) {
    throw new Error('Datos insuficientes para generar certificado');
  }
  // Más validaciones...
};
```

### 2. Rate Limiting

Considera implementar rate limiting para evitar abuso:

```typescript
// Ejemplo de cache simple para limitar generación
const certificateCache = new Map<string, number>();

const canGenerateCertificate = (userId: string): boolean => {
  const lastGeneration = certificateCache.get(userId);
  const now = Date.now();
  const cooldown = 5 * 60 * 1000; // 5 minutos
  
  if (lastGeneration && now - lastGeneration < cooldown) {
    return false;
  }
  
  certificateCache.set(userId, now);
  return true;
};
```

## 🎯 Funcionalidades Adicionales

### 1. Integración con Sistema de Logros

```typescript
// Hook para obtener logros del usuario
const useUserAchievements = (userId: string) => {
  // Tu lógica para obtener logros
  return {
    achievements: [...],
    isLoading: false,
    error: null
  };
};
```

### 2. Analytics de Certificados

```typescript
// Opcional: trackear generación de certificados
const trackCertificateGeneration = (userData: UserData) => {
  analytics.track('certificate_generated', {
    userId: userData.id,
    reputationLevel: reputation.level,
    achievementCount: achievements.length
  });
};
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error: "jsPDF is not defined"**
   ```bash
   npm install jspdf --save
   ```

2. **Error con QR Code**
   ```bash
   npm install qrcode @types/qrcode --save
   ```

3. **Problemas de memoria con PDFs grandes**
   - Reduce el tamaño de imágenes
   - Limita el número de logros mostrados
   - Optimiza el contenido de texto

4. **Problemas de renderizado en diferentes navegadores**
   - Testa en Chrome, Firefox, Safari
   - Considera usar `html2canvas` para mejor compatibilidad

## 📱 Responsive Design

El certificado está optimizado para:
- ✅ Descarga en desktop
- ✅ Vista previa en móvil
- ✅ Impresión en A4
- ✅ Compartir vía email/redes sociales

## 🎉 ¡Listo!

Una vez instalado y configurado, los usuarios podrán:

1. **Ver su perfil** con estadísticas actualizadas
2. **Generar certificados** en un click
3. **Previsualizar** antes de descargar
4. **Verificar autenticidad** via QR (si perfil público)
5. **Compartir logros** de manera ética y transparente

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs del navegador
2. Verifica que todas las dependencias estén instaladas
3. Comprueba que los datos tienen el formato correcto
4. Contacta al equipo de desarrollo

¡Disfruta celebrando la participación cívica! 🏅✨
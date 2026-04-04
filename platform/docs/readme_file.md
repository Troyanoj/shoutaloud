# Shout Aloud - Frontend Web

Frontend React de la plataforma democrática descentralizada **Shout Aloud**, conectada al backend FastAPI y sistema blockchain.

## 🚀 Características Implementadas

### ✅ Sistema de Votaciones
- **Propuestas ciudadanas** con análisis de IA integrado
- **Votación segura** con verificación DID y pruebas ZK
- **Resultados transparentes** en tiempo real
- **Participación por municipio** con estadísticas detalladas

### ✅ Calificación de Funcionarios
- **Sistema de rating** basado en estrellas (1-5)
- **Etiquetas inteligentes** sin comentarios (anti-trolling)
- **Reputación por municipio** con verificación
- **Análisis estadístico** de desempeño público

### ✅ Interfaz de Usuario
- **Diseño responsivo** mobile-first con Tailwind CSS
- **Navegación intuitiva** con bottom navigation en móvil
- **Filtros avanzados** y búsqueda en tiempo real
- **Animaciones fluidas** y feedback visual

### ✅ Conectividad Backend
- **API REST** completa con manejo de errores
- **Conexión FastAPI** a `http://localhost:8000`
- **Estados de carga** y manejo de errores elegante
- **Proxy configurado** para desarrollo local

## 📁 Estructura del Proyecto

```
platform/frontend-mobile/web/
├── public/
│   ├── index.html          # HTML base con splash screen
│   ├── manifest.json       # PWA manifest (futuro)
│   └── favicon.ico         # Favicon de la aplicación
├── src/
│   ├── components/         # Componentes React
│   │   ├── ProposalsList.tsx      # Lista de propuestas
│   │   ├── ProposalCard.tsx       # Tarjeta individual de propuesta
│   │   ├── ProposalDetail.tsx     # Detalle completo de propuesta
│   │   ├── VotingPage.tsx         # Sistema de votación
│   │   ├── ResultsPage.tsx        # Página de resultados
│   │   ├── OfficialRatings.tsx    # Calificación de funcionarios
│   │   └── MunicipalitySelector.tsx # Selector de municipios
│   ├── services/
│   │   └── api.ts          # Servicio de conexión con FastAPI
│   ├── App.tsx             # Componente principal
│   ├── App.css             # Estilos globales y Tailwind
│   └── index.tsx           # Punto de entrada
├── package.json            # Dependencias y scripts
├── tailwind.config.js      # Configuración de Tailwind
└── README.md              # Esta documentación
```

## 🛠️ Instalación y Desarrollo

### Prerrequisitos
- **Node.js 16+** y npm/yarn
- **Backend FastAPI** corriendo en `localhost:8000`
- **SQLite** con datos de simulación activos

### Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local (puerto 3000)
npm start

# Build para producción
npm run build

# Ejecutar tests
npm test
```

### Variables de Entorno

Crear archivo `.env.local`:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_BLOCKCHAIN_NETWORK=local
REACT_APP_ENVIRONMENT=development
```

## 🔗 Conexiones con Backend

### Endpoints Utilizados

- `GET /api/proposals` - Lista de propuestas
- `GET /api/proposals/{id}` - Detalle de propuesta
- `POST /api/vote` - Emisión de voto
- `GET /api/vote/results/{id}` - Resultados de votación
- `GET /api/municipalities` - Lista de municipios
- `GET /api/officials` - Lista de funcionarios
- `POST /api/officials/{id}/rate` - Calificar funcionario
- `POST /api/ai/analyze` - Análisis con IA

### Tipos de Datos

```typescript
interface Proposal {
  id: string;
  title: string;
  description: string;
  municipality: string;
  status: 'active' | 'completed' | 'draft';
  votes_for: number;
  votes_against: number;
  total_votes: number;
  ai_analysis?: AIAnalysis;
}

interface Official {
  id: string;
  name: string;
  position: string;
  municipality: string;
  rating: number;
  total_ratings: number;
  tags: string[];
}
```

## 🎨 Sistema de Diseño

### Colores Principales

```css
--democracy-blue: #2563eb    /* Propuestas */
--democracy-green: #16a34a   /* Aprobación */
--democracy-red: #dc2626     /* Rechazo */
--democracy-purple: #7c3aed  /* Funcionarios */
```

### Componentes Reutilizables

- **ProposalCard**: Tarjeta de propuesta con estado y análisis IA
- **MunicipalitySelector**: Selector con estadísticas
- **OfficialCard**: Tarjeta de funcionario con rating
- **VotingInterface**: Interfaz de votación segura

## 🔒 Seguridad y Privacidad

### Características Implementadas
- **Verificación DID** simulada para identidad descentralizada
- **Pruebas ZK** para privacidad de votos
- **Validación única** de votos por usuario
- **Encriptación** de comunicaciones con backend

### Consideraciones de Seguridad
- No almacenamiento local de datos sensibles
- Validación de entrada en frontend y backend
- Manejo seguro de tokens de autenticación
- Protección contra CSRF y XSS

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px (navegación inferior)
- **Tablet**: 768px - 1024px (layout adaptativo)
- **Desktop**: > 1024px (navegación lateral)

### Optimizaciones Móviles
- Touch-friendly buttons (44px mínimo)
- Navegación con thumb zone
- Carga lazy de imágenes
- Gestos swipe preparados

## 🧪 Testing y Calidad

### Tests Incluidos (preparados)
- Unit tests con Jest
- Integration tests con React Testing Library
- E2E tests con Cypress (configuración futura)

### Herramientas de Calidad
- ESLint para código limpio
- Prettier para formato consistente
- TypeScript para type safety
- Lighthouse para performance

## 🚀 Deployment

### Build de Producción
```bash
npm run build
```

### Consideraciones para Deploy
- Variables de entorno para API URLs
- CDN para assets estáticos
- Service Worker para PWA
- SSL/TLS obligatorio para DID/ZK

## 🔄 Próximas Características

### En Desarrollo
- [ ] **PWA completa** con offline support
- [ ] **Notificaciones push** para votaciones
- [ ] **Dark mode** con preferencias del usuario
- [ ] **Internacionalización** (i18n) multi-idioma

### Roadmap Técnico
- [ ] **WebRTC** para comunicación P2P
- [ ] **IPFS** para almacenamiento descentralizado
- [ ] **Web3** integration completa
- [ ] **MetaMask** y wallets cripto

## 🆘 Solución de Problemas

### Problemas Comunes

**Error de conexión con backend:**
```bash
# Verificar que FastAPI esté corriendo
curl http://localhost:8000/api/proposals

# Revisar proxy en package.json
"proxy": "http://localhost:8000"
```

**Estilos no cargan:**
```bash
# Reinstalar dependencias de Tailwind
npm install tailwindcss autoprefixer postcss
```

**TypeScript errors:**
```bash
# Limpiar cache de TypeScript
rm -rf node_modules/.cache
npm start
```

## 📞 Soporte

Para problemas técnicos o sugerencias:
- **GitHub Issues**: Repository issues
- **Discord**: Comunidad de desarrolladores
- **Email**: dev@shoutaloud.org

---

**Shout Aloud** - Devolviendo el poder al pueblo 🗳️✊
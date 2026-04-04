# 🗣️ Shout Aloud - Plataforma Descentralizada de Participación Ciudadana

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React Native](https://img.shields.io/badge/React%20Native-0.72+-blue.svg)](https://reactnative.dev/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8+-green.svg)](https://soliditylang.org/)

## 🎯 Misión

Devolver el poder democrático a los ciudadanos mediante tecnología descentralizada, transparente y resistente a la censura.

## 🏗️ Arquitectura Técnica

### Backend Distribuido
- **🔐 Identity**: Sistema DID y Zero-Knowledge proofs
- **📋 Ciudadanas**: Gestión de propuestas ciudadanas  
- **🛡️ Moderación**: Sistema descentralizado de moderación
- **🔔 Notifications**: Sistema de notificaciones inteligentes
- **⭐ Reputation**: Motor de reputación ciudadana
- **📊 Analytics**: Análisis de participación y impacto

### Frontend Multiplataforma
- **🌐 Web**: React + TypeScript + Tailwind CSS
- **📱 Mobile**: React Native para iOS/Android

### Blockchain & Web3
- **🏛️ Governance**: Smart contracts de gobernanza
- **🗳️ Voting**: Sistema de votación seguro y verificable
- **🔗 Infrastructure**: Red P2P descentralizada

## 🚀 Inicio Rápido

### Prerrequisitos
```bash
- Node.js 18+ 
- Python 3.8+
- Git
- MetaMask o wallet Web3
```

### Instalación Backend
```bash
cd platform/backend
pip install -r requirements.txt

# Configurar base de datos
python -m alembic upgrade head

# Iniciar servicios
uvicorn api.main:app --reload --port 8000
```

### Instalación Frontend Web
```bash
cd platform/frontend-mobile/web
npm install
npm start
```

### Instalación Mobile
```bash
cd platform/frontend-mobile/mobile
npm install
npx react-native run-android  # o run-ios
```

### Blockchain Setup
```bash
cd platform/blockchain
npm install
npx hardhat compile
npx hardhat deploy --network localhost
```

## 📁 Estructura del Proyecto

```
platform/
├── backend/                    # Servicios backend
│   ├── identity/              # DID & Zero-Knowledge
│   ├── ciudadanas/            # Propuestas ciudadanas
│   ├── moderacion/            # Sistema de moderación
│   ├── notifications/         # Notificaciones
│   ├── reputation/            # Reputación ciudadana
│   └── analytics/             # Análisis y métricas
├── frontend-mobile/           # Clientes frontend
│   ├── web/                   # Aplicación web React
│   └── mobile/                # App móvil React Native
├── blockchain/                # Smart contracts
├── governance/                # Sistema de gobernanza
├── infrastructure/            # Red P2P descentralizada
├── config/                    # Configuraciones
├── scripts/                   # Automatización
└── docs/                      # Documentación
```

## 🌟 Características Principales

### 🔐 **Identidad Descentralizada**
- Autenticación DID sin servidores centrales
- Zero-Knowledge proofs para privacidad
- Verificación criptográfica de identidad

### 📋 **Propuestas Ciudadanas**
- Creación y gestión de propuestas
- Sistema de apoyo y comentarios
- Moderación descentralizada

### 🗳️ **Votación Segura**
- Smart contracts auditables
- Verificación criptográfica de votos
- Resultados inmutables en blockchain

### ⭐ **Reputación Ciudadana**
- Algoritmo de puntuación transparente
- Badges y logros de participación
- Sistema anti-manipulación

### 🛡️ **Moderación Descentralizada**
- Moderación por consenso ciudadano
- Algoritmos anti-spam automatizados
- Transparencia total en decisiones

## 📚 Documentación

- [📖 Documentación Completa](./platform/docs/)
- [🛠️ Guía de Instalación](./platform/docs/setup_instructions.md)
- [🏗️ Arquitectura del Sistema](./platform/docs/shout-aloud-architecture.tsx)
- [🔐 Seguridad y Privacidad](./platform/docs/security.md)
- [🗳️ Sistema de Votación](./platform/blockchain/voting-documentation.md)

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! 

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'feat: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 🔧 Scripts Útiles

```bash
# Ejecutar todos los tests
./platform/scripts/setup_script.sh test

# Construir para producción
./platform/scripts/setup_script.sh build

# Limpiar dependencias
./platform/scripts/setup_script.sh clean
```

## 🌐 Despliegue

### Desarrollo Local
```bash
# Backend: http://localhost:8000
# Frontend Web: http://localhost:3000
# Documentación: http://localhost:8000/docs
```

### Infraestructura Descentralizada
- Red IPFS para almacenamiento distribuido
- Nodos P2P para redundancia
- DNS descentralizado

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/shout-aloud-platform/issues)
- **Discord**: [Comunidad Shout Aloud](https://discord.gg/shoutaloud)
- **Email**: support@shout-aloud.eth
- **Matrix**: `#shout-aloud:matrix.org`

---

**🎯 Objetivo**: Democratizar la participación ciudadana mediante tecnología descentralizada, transparente y accesible para todos.

**¿Tienes preguntas?** ¡Abre un issue o únete a nuestra comunidad!
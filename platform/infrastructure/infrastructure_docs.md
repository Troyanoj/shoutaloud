# 🏗️ Infraestructura Antifrágil - Shout Aloud

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Replicación de Nodos](#replicación-de-nodos)
3. [DNS Descentralizado](#dns-descentralizado)
4. [Almacenamiento IPFS](#almacenamiento-ipfs)
5. [Blockchain y Web3](#blockchain-y-web3)
6. [Comandos de Gestión](#comandos-de-gestión)
7. [Monitoreo y Diagnóstico](#monitoreo-y-diagnóstico)

---

## 🏛️ Arquitectura General

### Principios de Diseño Antifrágil

La infraestructura de **Shout Aloud** está diseñada para:

- **Resistir censura** mediante múltiples nodos distribuidos
- **Auto-repararse** cuando algunos componentes fallan
- **Mejorar con el estrés** aumentando redundancia bajo ataque
- **Operar sin puntos únicos de falla**

### Componentes Principales

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Blockchain    │
│   React + Web3  │◄──►│   FastAPI       │◄──►│   Hardhat       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IPFS Storage  │    │   Node Network  │    │   DNS Resolver  │
│   Descentralized│◄──►│   P2P Replica   │◄──►│   Distributed   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔄 Replicación de Nodos

### Descripción

El **Node Replicator** crea una red P2P de nodos backend que se replican automáticamente para garantizar disponibilidad.

### Características

- **Auto-descubrimiento** de nodos en la red
- **Health checks** automáticos cada 30 segundos
- **Replicación de datos** críticos entre nodos
- **Consensus** simple para validar información
- **Cleanup** automático de nodos inactivos

### Comandos de Gestión

#### Iniciar Replicador
```bash
# Iniciar nodo principal
python -m infrastructure.node_replicator --port 8000

# Iniciar nodos adicionales
python -m infrastructure.node_replicator --port 8001
python -m infrastructure.node_replicator --port 8002
```

#### Ver Estadísticas
```bash
python -m infrastructure.node_replicator --stats
```

**Salida esperada:**
```json
{
  "active_nodes": 3,
  "replications_24h": {
    "successful": 45,
    "failed": 2,
    "success_rate": 95.74
  },
  "replication_by_type": {
    "voting_results": 20,
    "proposals": 15,
    "config": 10
  },
  "network_resilience": "high"
}
```

### Configuración de Nodos Semilla

Editar nodos bootstrap en `node_replicator.py`:

```python
self.seed_nodes = [
    "http://localhost:8001",
    "http://localhost:8002", 
    "http://localhost:8003",
    "https://node1.shout-aloud.org",
    "https://node2.shout-aloud.org"
]
```

---

## 🌐 DNS Descentralizado

### Descripción

El **DNS Resolver** permite que la plataforma funcione sin depender de DNS centralizados que pueden ser censurados.

### Dominios Especiales

La plataforma incluye dominios internos que se resuelven localmente:

- `democracy.local` → `127.0.0.1:8000` (Frontend)
- `api.democracy.local` → `127.0.0.1:8000` (API)
- `ipfs.democracy.local` → `gateway.pinata.cloud` (IPFS)
- `blockchain.democracy.local` → `127.0.0.1:8545` (Hardhat)

### Comandos de Gestión

#### Resolver Dominios
```bash
# Resolver dominio local
python -m infrastructure.dns_resolver --resolve democracy.local

# Resolver dominio externo
python -m infrastructure.dns_resolver --resolve example.com
```

#### Registrar Dominio
```bash
# Registrar nuevo dominio en la red
python -m infrastructure.dns_resolver --register voting.democracy 192.168.1.100
```

#### Ejecutar Pruebas
```bash
python -m infrastructure.dns_resolver --test
```

#### Ver Estadísticas DNS
```bash
python -m infrastructure.dns_resolver --stats
```

**Salida esperada:**
```json
{
  "node_id": "dns_node_1640995200",
  "cached_records": 15,
  "total_records": 50,
  "active_resolver_nodes": 3,
  "resolutions_24h": {
    "successful": 120,
    "failed": 8,
    "success_rate": 93.75
  },
  "platform_domains": [
    "democracy.local",
    "api.democracy.local",
    "ipfs.democracy.local",
    "blockchain.democracy.local"
  ]
}
```

### Configuración de Nodos DNS

Editar nodos bootstrap en `dns_resolver.py`:

```python
self.bootstrap_nodes = [
    "https://dns1.shout-aloud.org",
    "https://dns2.shout-aloud.org", 
    "https://dns3.shout-aloud.org"
]
```

---

## 📎 Almacenamiento IPFS

### Descripción

**IPFS** (InterPlanetary File System) almacena documentos y datos de forma descentralizada, asegurando que no puedan ser censurados.

### Tipos de Contenido

- **Propuestas legales** - Documentos PDF de leyes
- **Resultados de votación** - JSON con resultados
- **Evidencia** - Documentos de respaldo
- **Configuración** - Metadatos del sistema

### Configuración

#### Variables de Entorno

```bash
# .env file
REACT_APP_PINATA_API_KEY=your_pinata_api_key
REACT_APP_PINATA_SECRET=your_pinata_secret_key
```

Si no se configuran, el sistema funciona en **modo simulación** local.

### Uso en Código

#### Frontend (TypeScript)
```typescript
import { ipfsService } from './services/ipfs';

// Subir archivo
const result = await ipfsService.uploadFile(file, {
  type: 'proposal',
  municipalityId: 1
});

// Recuperar contenido
const content = await ipfsService.fetchFromIPFS(hash);

// Generar URL pública
const url = ipfsService.getPublicUrl(hash, 'pinata');
```

#### Backend (Python)
```python
from backend.ipfs.ipfs_manager import upload_proposal_document

# Subir documento de propuesta
result = await upload_proposal_document(
    file_path="./proposal.pdf",
    municipality_id=1,
    proposal_id=123
)
```

### Gateways IPFS

La plataforma usa múltiples gateways para resistencia:

1. **Pinata Gateway** (principal): `https://gateway.pinata.cloud/ipfs/`
2. **IPFS.io** (fallback): `https://ipfs.io/ipfs/`
3. **Local** (desarrollo): Simulación en `local_storage/`

---

## ⛓️ Blockchain y Web3

### Red Local Hardhat

#### Iniciar Red Local
```bash
cd platform/blockchain
npx hardhat node
```

#### Desplegar Contratos
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Configuración MetaMask

1. **Agregar Red Local**:
   - URL RPC: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Símbolo: `ETH`

2. **Importar Cuenta de Prueba**:
   - Usar private key del nodo Hardhat
   - Tendrá ETH para pruebas

### Uso de Servicios Web3

```typescript
import { blockchainService } from './services/blockchain';
import { walletService } from './services/wallet';

// Conectar wallet
await walletService.connect();

// Enviar voto a blockchain
const voteData = {
  municipalityId: 1,
  officialId: 456,
  rating: 8,
  voterDID: "did:eth:0x...",
  timestamp: Date.now()
};

const result = await blockchainService.submitVote(voteData);
```

---

## 🛠️ Comandos de Gestión

### Inicio Rápido del Sistema

```bash
# 1. Iniciar blockchain local
cd platform/blockchain
npx hardhat node &

# 2. Iniciar replicador de nodos
python -m infrastructure.node_replicator --port 8000 &

# 3. Iniciar DNS resolver
python -m infrastructure.dns_resolver &

# 4. Iniciar backend
cd platform/backend
uvicorn main:app --port 8000 --reload &

# 5. Iniciar frontend
cd platform/frontend-mobile/web
npm start
```

### Script de Monitoreo

```bash
#!/bin/bash
# monitor.sh

echo "🔍 Estado de la Infraestructura Shout Aloud"
echo "=========================================="

# Estado de nodos
echo "📊 Nodos:"
python -m infrastructure.node_replicator --stats | jq .network_resilience

# Estado DNS
echo "🌐 DNS:"
python -m infrastructure.dns_resolver --stats | jq .resolutions_24h.success_rate

# Estado IPFS (simulado)
echo "📎 IPFS: Activo (simulación local)"

# Estado Blockchain
echo "⛓️ Blockchain:"
curl -s http://localhost:8545 > /dev/null && echo "✅ Activo" || echo "❌ Inactivo"

# Estado Backend
echo "🔧 Backend:"
curl -s http://localhost:8000/health | jq .status

echo "=========================================="
```

### Comandos de Diagnóstico

#### Verificar Conectividad
```bash
# Test completo del sistema
python -m infrastructure.dns_resolver --test
```

#### Limpiar Cachés
```bash
# Limpiar caché DNS
rm infrastructure/dns_cache.db

# Limpiar caché de nodos
rm infrastructure/infrastructure.db

# Limpiar almacenamiento IPFS local
rm -rf platform/backend/ipfs/local_storage/
```

#### Logs de Sistema
```bash
# Ver logs de replicación
sqlite3 infrastructure.db "SELECT * FROM replication_log ORDER BY timestamp DESC LIMIT 10;"

# Ver logs DNS
sqlite3 dns_cache.db "SELECT * FROM resolution_log ORDER BY timestamp DESC LIMIT 10;"
```

---

## 📈 Monitoreo y Diagnóstico

### Métricas Clave

#### Salud de la Red
- **Nodos activos**: Mínimo 2, óptimo 3+
- **Success rate**: >90% para replicación y DNS
- **Latencia promedio**: <500ms entre nodos
- **Uptime**: >99% para nodos críticos

#### Alertas Automáticas

El sistema genera alertas cuando:

- Menos de 2 nodos activos
- Success rate <80%
- Latencia >1000ms
- Fallos de IPFS o blockchain

### Dashboard de Estado

Acceder en: `http://localhost:8000/infrastructure/status`

**Ejemplo de respuesta:**
```json
{
  "timestamp": "2025-06-17T10:30:00Z",
  "overall_health": "healthy",
  "components": {
    "nodes": {
      "status": "healthy",
      "active": 3,
      "total": 5,
      "success_rate": 96.2
    },
    "dns": {
      "status": "healthy", 
      "cached_records": 25,
      "success_rate": 94.1
    },
    "ipfs": {
      "status": "simulation",
      "stored_files": 12,
      "total_size": "2.4MB"
    },
    "blockchain": {
      "status": "connected",
      "network": "hardhat",
      "block_number": 1234
    }
  }
}
```

### Alertas por Email/Webhook

Configurar en `config/monitoring.json`:

```json
{
  "alerts": {
    "email": "admin@democracy.org",
    "webhook": "https://hooks.slack.com/...",
    "thresholds": {
      "min_nodes": 2,
      "min_success_rate": 80,
      "max_latency": 1000
    }
  }
}
```

---

## 🚀 Despliegue en Producción

### Requisitos Mínimos

- **3 servidores** en diferentes ubicaciones
- **2GB RAM** por servidor
- **10GB almacenamiento** por servidor
- **Conexión estable** a Internet

### Variables de Entorno Producción

```bash
# .env.production
NODE_ENV=production
PINATA_API_KEY=real_api_key
PINATA_SECRET=real_secret
BLOCKCHAIN_NETWORK=polygon
DNS_BOOTSTRAP_NODES=https://dns1.prod.org,https://dns2.prod.org
NODE_BOOTSTRAP_SERVERS=https://node1.prod.org,https://node2.prod.org
MONITORING_WEBHOOK=https://alerts.democracy.org/webhook
```

### Docker Compose (Opcional)

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build: ./platform/backend
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  node-replicator:
    build: ./platform/infrastructure
    command: python -m node_replicator --port 8001
    depends_on:
      - backend
    restart: unless-stopped

  dns-resolver:
    build: ./platform/infrastructure  
    command: python -m dns_resolver
    restart: unless-stopped

  frontend:
    build: ./platform/frontend-mobile/web
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=https://api.democracy.org
      - REACT_APP_PINATA_API_KEY=${PINATA_API_KEY}
    restart: unless-stopped
```

### Comandos de Despliegue

```bash
# Construir y desplegar
docker-compose -f docker-compose.prod.yml up -d

# Verificar estado
docker-compose ps

# Ver logs
docker-compose logs -f backend

# Actualizar servicios
docker-compose pull && docker-compose up -d
```

---

## 🔐 Seguridad y Backup

### Backup Automático

```bash
#!/bin/bash
# backup.sh - Ejecutar cada 6 horas via cron

BACKUP_DIR="/backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup bases de datos
cp infrastructure.db $BACKUP_DIR/
cp dns_cache.db $BACKUP_DIR/
cp platform/backend/democracy.db $BACKUP_DIR/

# Backup IPFS local
tar -czf $BACKUP_DIR/ipfs_storage.tar.gz platform/backend/ipfs/local_storage/

# Backup configuración
cp -r config/ $BACKUP_DIR/

# Subir a IPFS para backup descentralizado
python -c "
from platform.backend.ipfs.ipfs_manager import ipfs_manager
import asyncio
result = asyncio.run(ipfs_manager.upload_file('$BACKUP_DIR.tar.gz'))
print(f'Backup IPFS: {result[\"hash\"]}')
"

echo "✅ Backup completado: $BACKUP_DIR"
```

### Restauración

```bash
#!/bin/bash
# restore.sh

BACKUP_HASH="QmYourBackupHashHere"

# Descargar backup de IPFS
python -c "
from platform.backend.ipfs.ipfs_manager import ipfs_manager
import asyncio
asyncio.run(ipfs_manager.fetch_content('$BACKUP_HASH'))
"

# Restaurar archivos
tar -xzf backup.tar.gz
cp backup/*.db ./
cp -r backup/config/ ./

echo "✅ Restauración completada"
```

---

## 🧪 Testing y Validación

### Suite de Pruebas Completa

```bash
#!/bin/bash
# test_infrastructure.sh

echo "🧪 Pruebas de Infraestructura Shout Aloud"
echo "========================================"

# Test 1: Replicación de nodos
echo "Test 1: Replicación de nodos..."
python -m infrastructure.node_replicator --port 8000 &
sleep 5
python -m infrastructure.node_replicator --port 8001 &
sleep 10

# Verificar conectividad entre nodos
STATS=$(python -m infrastructure.node_replicator --stats)
ACTIVE_NODES=$(echo $STATS | jq .active_nodes)

if [ $ACTIVE_NODES -ge 2 ]; then
    echo "✅ Test 1 PASS: $ACTIVE_NODES nodos activos"
else
    echo "❌ Test 1 FAIL: Solo $ACTIVE_NODES nodos activos"
fi

# Test 2: DNS descentralizado
echo "Test 2: DNS descentralizado..."
RESOLVED=$(python -m infrastructure.dns_resolver --resolve democracy.local)

if [[ $RESOLVED == *"127.0.0.1:8000"* ]]; then
    echo "✅ Test 2 PASS: DNS local funcionando"
else
    echo "❌ Test 2 FAIL: DNS local no funciona"
fi

# Test 3: IPFS simulado
echo "Test 3: IPFS simulado..."
python -c "
import asyncio
from platform.backend.ipfs.ipfs_manager import ipfs_manager

async def test_ipfs():
    # Test upload
    result = await ipfs_manager.upload_json({'test': 'data'}, 'test.json')
    if result['success']:
        print('✅ Test 3a PASS: Upload funcionando')
        
        # Test fetch
        content = await ipfs_manager.fetch_content(result['hash'])
        if content['success']:
            print('✅ Test 3b PASS: Fetch funcionando')
        else:
            print('❌ Test 3b FAIL: Fetch no funciona')
    else:
        print('❌ Test 3a FAIL: Upload no funciona')

asyncio.run(test_ipfs())
"

# Test 4: Blockchain local
echo "Test 4: Blockchain local..."
BLOCKCHAIN_STATUS=$(curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r .result)

if [[ $BLOCKCHAIN_STATUS != "null" ]]; then
    echo "✅ Test 4 PASS: Blockchain respondiendo"
else
    echo "❌ Test 4 FAIL: Blockchain no responde"
fi

# Test 5: API Backend
echo "Test 5: API Backend..."
API_STATUS=$(curl -s http://localhost:8000/health | jq -r .status)

if [[ $API_STATUS == "healthy" ]]; then
    echo "✅ Test 5 PASS: API funcionando"
else
    echo "❌ Test 5 FAIL: API no funciona"
fi

echo "========================================"
echo "🏁 Pruebas de infraestructura completadas"
```

### Pruebas de Estrés

```bash
#!/bin/bash
# stress_test.sh

echo "💪 Pruebas de Estrés - Simulando Ataque"
echo "======================================="

# Simular múltiples consultas DNS
for i in {1..100}; do
    python -m infrastructure.dns_resolver --resolve test$i.democracy &
done
wait

# Simular múltiples uploads IPFS
for i in {1..50}; do
    echo "Test data $i" > test$i.txt
    python -c "
import asyncio
from platform.backend.ipfs.ipfs_manager import ipfs_manager
asyncio.run(ipfs_manager.upload_file('test$i.txt'))
" &
done
wait

# Verificar que el sistema sigue funcionando
python -m infrastructure.node_replicator --stats
python -m infrastructure.dns_resolver --stats

echo "✅ Sistema resistió pruebas de estrés"
```

---

## 📚 Troubleshooting

### Problemas Comunes

#### 1. Nodos no se conectan
```bash
# Verificar puertos
netstat -an | grep 8000
netstat -an | grep 8001

# Verificar logs
tail -f /var/log/shout-aloud/node_replicator.log

# Reiniciar servicios
pkill -f node_replicator
python -m infrastructure.node_replicator --port 8000
```

#### 2. DNS no resuelve
```bash
# Limpiar caché DNS
rm dns_cache.db

# Verificar dominios locales
python -c "
from infrastructure.dns_resolver import dns_resolver
print(dns_resolver.platform_domains)
"

# Test manual
python -m infrastructure.dns_resolver --resolve democracy.local
```

#### 3. IPFS falla
```bash
# Verificar variables de entorno
echo $REACT_APP_PINATA_API_KEY
echo $REACT_APP_PINATA_SECRET

# Test conexión Pinata
curl -X GET "https://api.pinata.cloud/data/testAuthentication" \
  -H "pinata_api_key: $PINATA_API_KEY" \
  -H "pinata_secret_api_key: $PINATA_SECRET"

# Verificar almacenamiento local
ls -la platform/backend/ipfs/local_storage/
```

#### 4. Blockchain no conecta
```bash
# Verificar Hardhat
npx hardhat node --hostname 0.0.0.0

# Test RPC
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Verificar contratos
npx hardhat run scripts/deploy.js --network localhost
```

### Logs y Debugging

#### Habilitar Debug Mode
```bash
export DEBUG=true
export LOG_LEVEL=debug

# Logs detallados
python -m infrastructure.node_replicator --port 8000 --debug
```

#### Estructura de Logs
```
/var/log/shout-aloud/
├── node_replicator.log
├── dns_resolver.log  
├── ipfs_manager.log
├── backend.log
└── infrastructure.log
```

#### Analizar Logs
```bash
# Errores recientes
grep ERROR /var/log/shout-aloud/*.log | tail -20

# Estadísticas de conexión
grep "Nodo conectado" /var/log/shout-aloud/node_replicator.log | wc -l

# Performance DNS
grep "resuelto" /var/log/shout-aloud/dns_resolver.log | awk '{print $1}' | sort | uniq -c
```

---

## 🎯 Próximos Pasos

### Fase Siguiente (No implementar aún)

1. **WebRTC para P2P directo**
   - Comunicación directa entre ciudadanos
   - Sin servidores intermedios

2. **Propuestas ciudadanas descentralizadas**
   - Sistema de propuestas bottom-up
   - Validación comunitaria

3. **Token de reputación cívica**
   - Incentivos por participación
   - Sistema anti-spam

4. **IA antifraude**
   - Detección de patrones sospechosos
   - Verificación cruzada automática

### Configuración Avanzada

```json
{
  "infrastructure": {
    "replication": {
      "min_nodes": 3,
      "max_nodes": 50,
      "sync_interval": 60,
      "health_check_interval": 30
    },
    "dns": {
      "cache_ttl": 3600,
      "max_cache_size": 10000,
      "bootstrap_nodes": 5
    },
    "ipfs": {
      "pin_duration": "permanent",
      "redundancy_factor": 3,
      "compression": true
    },
    "monitoring": {
      "metrics_retention": "30d",
      "alert_cooldown": 300,
      "health_check_timeout": 10
    }
  }
}
```

---

## 📞 Soporte

### Contacto Técnico
- **Email**: tech@shout-aloud.org
- **Matrix**: #shout-aloud-dev:matrix.org
- **GitHub**: github.com/shout-aloud/platform

### Contribuciones
1. Fork el repositorio
2. Crear branch para feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit changes: `git commit -am 'Agregar nueva funcionalidad'`
4. Push branch: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Licencia
MIT License - Ver `LICENSE` file para detalles.

---

**🌟 La democracia descentralizada es antifrágil por diseño**
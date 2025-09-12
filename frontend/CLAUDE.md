# Recitrack - Sistema de Gestión de Reciclaje

## Descripción del Proyecto
Recitrack es una plataforma completa de gestión y trazabilidad de reciclaje que integra frontend web con backend robusto. Permite el seguimiento de depósitos de materiales reciclables desde la recolección hasta el procesamiento industrial, con integración blockchain y generación de certificados.

## Arquitectura del Sistema

### Frontend (Next.js)
- **Ubicación**: `/Users/nicoa/recitrack-frontend`
- **Tech Stack**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Puerto**: 3000
- **Estado Global**: Zustand
- **HTTP Client**: Axios con interceptores
- **Autenticación**: JWT con cookies

### Backend (NestJS) 
- **Ubicación**: `/Users/nicoa/Documents/recitrack-backend`
- **Tech Stack**: NestJS, TypeScript, Prisma, PostgreSQL
- **Puerto**: 3001
- **Base de datos**: PostgreSQL (Puerto 5432)
- **Cache**: Redis (Puerto 6379)
- **Autenticación**: JWT + Passport

## Comandos Esenciales

### Desarrollo Frontend
```bash
cd /Users/nicoa/recitrack-frontend
npm run dev          # Servidor de desarrollo (puerto 3000)
npm run build        # Compilar para producción
npm run start        # Servidor de producción
npm run lint         # Linter ESLint
```

### Desarrollo Backend
```bash
cd /Users/nicoa/Documents/recitrack-backend
npm run start:dev    # Servidor desarrollo con watch (puerto 3001)
npm run start        # Servidor producción
npm run build        # Compilar TypeScript
npm run lint         # Linter con auto-fix
npm run test         # Tests unitarios
npm run test:e2e     # Tests end-to-end
```

### Base de Datos (Prisma)
```bash
cd /Users/nicoa/Documents/recitrack-backend
npx prisma generate  # Generar cliente Prisma
npx prisma db push   # Sincronizar schema con DB
npx prisma migrate dev # Crear nueva migración
npx prisma studio    # Interface gráfica de DB
```

### Docker Services
```bash
cd /Users/nicoa/Documents/recitrack-backend
docker-compose up -d # Levantar PostgreSQL y Redis
docker-compose down  # Detener servicios
```

## Estructura del Proyecto

### Frontend (`/Users/nicoa/recitrack-frontend/src/`)
```
app/
├── (auth)/
│   └── login/page.tsx        # Página de login
├── (dashboard)/
│   └── layout.tsx           # Layout del dashboard
├── layout.tsx               # Layout raíz con providers
├── page.tsx                 # Dashboard principal
├── providers.tsx            # Proveedores React Query
└── globals.css              # Estilos globales

lib/
├── api/client.ts            # Cliente HTTP con interceptores
└── store/auth.store.ts      # Store Zustand autenticación

services/
└── auth.service.ts          # Servicios de autenticación

types/
└── index.ts                 # Definiciones TypeScript
```

### Backend (`/Users/nicoa/Documents/recitrack-backend/src/`)
```
modules/
├── auth/                    # Autenticación JWT
├── users/                   # Gestión de usuarios
├── organizations/           # Organizaciones y facilities
├── collection-points/       # Puntos de recolección
├── qr-codes/               # Sistema códigos QR
├── deposits/               # Depósitos de materiales
├── batches/                # Lotes de procesamiento
├── metrics/                # Métricas y estadísticas
├── reports/                # Generación reportes PDF
└── prisma/                 # Servicio Prisma

common/
├── guards/jwt-auth.guard.ts # Guard autenticación
└── decorators/             # Decoradores custom
```

## Variables de Entorno

### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (`.env`)
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/recitrack"
JWT_SECRET=tu-clave-super-secreta-cambiar-en-produccion
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
```

## Modelo de Datos (Prisma Schema)

### Entidades Principales
- **Organizations**: Empresas (centros recolección, transformadoras)
- **Facilities**: Instalaciones de las organizaciones
- **Users**: Usuarios con roles (COLLECTOR, OPERATOR, ADMIN, COMPANY)
- **CollectionPoints**: Puntos físicos de recolección
- **QrCode**: Códigos QR para trazabilidad
- **Deposits**: Depósitos de materiales reciclables
- **Batches**: Lotes para procesamiento industrial
- **Validations**: Validaciones de depósitos
- **Certificates**: Certificados PDF generados
- **AuditLog**: Auditoría de acciones

### Materiales Soportados
PET, HDPE, PP, LDPE, PS, PVC, CARTON, GLASS, ALUMINUM, STEEL, COPPER, OTHER_METAL

## Flujo de Trabajo Típico

### Desarrollo Full-Stack
1. **Levantar servicios**:
   ```bash
   cd /Users/nicoa/Documents/recitrack-backend
   docker-compose up -d  # PostgreSQL + Redis
   npm run start:dev     # Backend NestJS
   ```

2. **Frontend en paralelo**:
   ```bash
   cd /Users/nicoa/recitrack-frontend
   npm run dev          # Next.js frontend
   ```

3. **Verificar conexión**: http://localhost:3000 → http://localhost:3001

### Testing y Calidad
```bash
# Backend
npm run test         # Tests unitarios
npm run test:e2e     # Tests integración
npm run lint         # Linting + auto-fix

# Frontend  
npm run lint         # ESLint
npm run build        # Verificar build
```

## Características Especiales

### Autenticación
- JWT tokens almacenados en cookies httpOnly
- Interceptores automáticos para refresh
- Guards protegiendo rutas backend
- Store Zustand para estado frontend

### Trazabilidad
- Sistema QR codes únicos
- Blockchain integration (Ethers.js)
- Auditoría completa de acciones
- Certificados PDF generados

### API Integration
- Cliente HTTP con retry automático
- Manejo centralizado de errores
- CORS configurado para desarrollo
- Validación automática DTOs

## Solución de Problemas Comunes

### Error de conexión API
- Verificar que backend esté en puerto 3001
- Confirmar variable NEXT_PUBLIC_API_URL
- Revisar CORS en main.ts del backend

### Problemas de base de datos
```bash
npx prisma db push    # Sincronizar schema
npx prisma generate   # Regenerar cliente
docker-compose restart postgres  # Reiniciar DB
```

### Issues de autenticación
- Verificar JWT_SECRET en .env
- Limpiar cookies del navegador
- Revisar token expiration

## Herramientas de Desarrollo Recomendadas
- **VS Code**: Con extensiones Prisma, ESLint, Prettier
- **Prisma Studio**: Interface gráfica de base de datos
- **React DevTools**: Para debugging frontend
- **Postman**: Para testing APIs
- **Docker Desktop**: Para manejo de contenedores

## Scripts de Utilidad
```bash
# Resetear todo el entorno
cd /Users/nicoa/Documents/recitrack-backend
docker-compose down && docker-compose up -d
npx prisma db push
npm run start:dev

# Generar nuevos tipos después de cambios en schema
npx prisma generate
cd /Users/nicoa/recitrack-frontend && npm run dev
```

## Consideraciones de Producción
- Cambiar JWT_SECRET y DATABASE_URL
- Configurar CORS para dominio específico
- Habilitar SSL/TLS
- Configurar respaldos de base de datos
- Monitoreo y logging apropiados
- Variables de entorno seguras
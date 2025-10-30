# 🏪 Kiosquito - Sistema de Inventario y Ventas

Una aplicación móvil completa para la gestión de inventario y ventas de pequeños negocios, desarrollada con React Native y Expo.

## 📱 Características

- **Gestión de Productos**: Crear, editar y eliminar productos con control de stock
- **Sistema de Ventas**: Registro rápido de ventas con múltiples monedas
- **Gestión de Monedas**: Soporte para múltiples divisas con tasas de cambio
- **Historial de Ventas**: Visualización completa del historial de transacciones
- **Panel Administrativo**: Estadísticas y resúmenes de ventas
- **Autenticación**: Sistema seguro de login con cambio de contraseña
- **Base de Datos Local**: SQLite para almacenamiento offline
- **Interfaz Moderna**: Diseño dark theme con componentes personalizados

## 🛠️ Tecnologías Utilizadas

- **React Native** con Expo
- **TypeScript** para tipado estático
- **Expo Router** para navegación
- **SQLite** para base de datos local
- **Expo Vector Icons** para iconografía
- **AsyncStorage** para persistencia de datos

## 📋 Requisitos Previos

- Node.js (versión 18 o superior)
- npm o yarn
- Expo CLI
- EAS CLI (para builds de producción)
- Android Studio (para emulador Android)
- Xcode (para simulador iOS - solo macOS)

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd kiosquito-app
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Instalar EAS CLI (si no está instalado)
```bash
npm install -g @expo/eas-cli
```

### 4. Configurar EAS (primera vez)
```bash
eas login
eas build:configure
```

## 🏃‍♂️ Desarrollo

### Iniciar el servidor de desarrollo
```bash
npx expo start
```

### Opciones de desarrollo:
- Presiona `a` para abrir en emulador Android
- Presiona `i` para abrir en simulador iOS
- Presiona `w` para abrir en navegador web
- Escanea el código QR con Expo Go para probar en dispositivo físico

### Modo desarrollo con recarga automática
```bash
npx expo start --dev-client
```

## 📦 Builds de Producción

### Build para Android (APK)
```bash
eas build -p android --profile preview
```

### Build para Android (Production)
```bash
eas build -p android --profile production
```

### Build para iOS (Development)
```bash
eas build -p ios --profile development
```

### Build para iOS (Production)
```bash
eas build -p ios --profile production
```

### Build para ambas plataformas
```bash
eas build --platform all --profile production
```

## 🔧 Configuración de Perfiles de Build

Los perfiles de build están configurados en `eas.json`:

- **development**: Para desarrollo con development client
- **preview**: Para testing interno (APK para Android)
- **production**: Para releases de producción (App Bundle para Android)

## 📱 Instalación en Dispositivo

### Android
1. Ejecutar build de preview: `eas build -p android --profile preview`
2. Descargar el APK generado
3. Instalar en dispositivo Android (habilitar "Fuentes desconocidas")

### iOS
1. Ejecutar build de development: `eas build -p ios --profile development`
2. Instalar usando TestFlight o desarrollo directo

## 🗄️ Base de Datos

La aplicación utiliza SQLite local con las siguientes tablas:
- `usuarios`: Gestión de autenticación
- `productos`: Inventario de productos
- `monedas`: Configuración de divisas
- `ventas`: Registro de transacciones

### Datos por defecto:
- **Usuario**: admin / admin123
- **Moneda base**: CUP (Peso Cubano)
- **Monedas adicionales**: USD, MLC

## 🎨 Estructura del Proyecto

```
kiosquito-app/
├── app/                    # Pantallas principales
│   ├── (tabs)/            # Navegación por pestañas
│   │   ├── index.tsx      # Pantalla de ventas
│   │   ├── admin.tsx      # Panel administrativo
│   │   ├── perfil.tsx     # Perfil de usuario
│   │   └── monedas.tsx    # Gestión de monedas
│   ├── login.tsx          # Pantalla de login
│   ├── productos.tsx      # Gestión de productos
│   └── historial-ventas.tsx # Historial de ventas
├── components/            # Componentes reutilizables
│   └── ui/               # Componentes de interfaz
├── contexts/             # Contextos de React
├── services/             # Servicios (DB, Auth)
├── constants/            # Constantes y temas
└── hooks/               # Hooks personalizados
```

## 🔐 Autenticación

### Credenciales por defecto:
- **Usuario**: `admin`
- **Contraseña**: `admin123`

### Cambiar contraseña:
1. Ir a la pestaña "Perfil"
2. Tocar "Cambiar Datos"
3. Ingresar contraseña actual y nueva contraseña

## 📊 Funcionalidades Principales

### Gestión de Productos
- Crear productos con nombre, precio y stock
- Editar información de productos existentes
- Eliminar productos (con confirmación)
- Control automático de stock en ventas

### Sistema de Ventas
- Selección rápida de productos
- Control de cantidad disponible
- Cálculo automático en múltiples monedas
- Actualización automática de inventario

### Gestión de Monedas
- Agregar nuevas divisas
- Configurar tasas de cambio
- Editar monedas existentes
- Protección de moneda base (CUP)

### Reportes y Estadísticas
- Resumen de ventas diarias, semanales y mensuales
- Estadísticas de productos
- Alertas de stock bajo
- Historial completo de transacciones

## 🐛 Solución de Problemas

### Error de build
```bash
# Limpiar caché
npx expo install --fix
npm start -- --reset-cache
```

### Problemas de base de datos
```bash
# La app recreará automáticamente las tablas en el primer inicio
# Los datos se mantienen entre actualizaciones
```

### Problemas de autenticación
```bash
# Usar las credenciales por defecto: admin / admin123
# O reiniciar la app para recrear el usuario por defecto
```

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm start                    # Iniciar servidor de desarrollo
npm run android             # Abrir en emulador Android
npm run ios                 # Abrir en simulador iOS
npm run web                 # Abrir en navegador

# Builds
npm run build:android       # Build Android preview
npm run build:production    # Build producción
npm run build:ios          # Build iOS

# Utilidades
npm run type-check         # Verificar tipos TypeScript
npm run lint              # Ejecutar linter
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo

---

**Desarrollado con ❤️ usando React Native y Expo**
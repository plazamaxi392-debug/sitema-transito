const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Cargar .env manualmente
const envPath = path.join(__dirname, '.env');
console.log('📁 Buscando .env en:', envPath);

if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log('✅ Archivo .env cargado manualmente');
} else {
    console.log('❌ Archivo .env no encontrado, usando valores por defecto');
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3000';
    process.env.DB_HOST = 'localhost';
    process.env.DB_USER = 'root';
    process.env.DB_PASSWORD = '';
    process.env.DB_NAME = 'sistema_transito';
    process.env.JWT_SECRET = 'clave_secreta_por_defecto_para_desarrollo_' + Date.now();
    process.env.JWT_EXPIRES_IN = '24h';
}

// VERIFICACIÓN DE VARIABLES
console.log('🔧 Variables de entorno:');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO');
console.log('   PORT:', process.env.PORT);
console.log('   DB_HOST:', process.env.DB_HOST);
console.log('   DB_NAME:', process.env.DB_NAME);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas
const authRoutes = require('./routes/auth');
const vehiculosRoutes = require('./routes/vehiculos');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/vehiculos', vehiculosRoutes);

// Rutas básicas
app.get('/', (req, res) => {
    res.json({ 
        message: 'Sistema de Tránsito - API',
        version: '1.0.0',
        status: 'Activo',
        endpoints: {
            auth: '/api/auth',
            vehiculos: '/api/vehiculos'
        }
    });
});

// Health check
app.get('/health', async (req, res) => {
    const { testConnection } = require('./config/database');
    const dbStatus = await testConnection();
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: dbStatus ? 'Conectado' : 'Desconectado',
        environment: process.env.NODE_ENV
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Ruta no encontrada
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Inicializar servidor
app.listen(PORT, async () => {
    console.log(`🚓 Servidor de tránsito ejecutándose en puerto ${PORT}`);
    console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
    
    // Verificar conexión a BD al inicio
    const { testConnection } = require('./config/database');
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.log('⚠️  Advertencia: No se pudo conectar a la base de datos');
    }
});
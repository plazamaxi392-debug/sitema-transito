const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initializeDatabase() {
    let connection;
    try {
        console.log('🔌 Conectando a MySQL...');
        
        // Conexión sin base de datos especificada (usando createConnection en lugar de createPool)
        connection = mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true // IMPORTANTE: Permitir múltiples sentencias
        });

        // Conectar
        connection.connect((err) => {
            if (err) {
                console.error('❌ Error conectando a MySQL:', err.message);
                return;
            }
            console.log('✅ Conectado a MySQL server');
        });

        // Crear base de datos
        connection.query('CREATE DATABASE IF NOT EXISTS sistema_transito', (err) => {
            if (err) {
                console.error('❌ Error creando base de datos:', err.message);
                return;
            }
            console.log('✅ Base de datos verificada/creada');
        });

        // Usar la base de datos
        connection.query('USE sistema_transito', (err) => {
            if (err) {
                console.error('❌ Error usando base de datos:', err.message);
                return;
            }
            console.log('📊 Usando base de datos sistema_transito');
        });

        // Leer y ejecutar el script SQL completo
        const sqlScriptPath = path.join(__dirname, '../../database/schema.sql');
        console.log('📖 Leyendo archivo SQL:', sqlScriptPath);
        
        const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');
        
        console.log('📝 Ejecutando script SQL completo...');
        connection.query(sqlScript, (err, results) => {
            if (err) {
                console.error('❌ Error ejecutando script SQL:', err.message);
                return;
            }
            console.log('✅ Script SQL ejecutado correctamente');
            console.log('🎉 Base de datos inicializada correctamente');
            
            // Cerrar conexión
            connection.end();
        });
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
        if (connection) {
            connection.end();
        }
    }
}

// Solo ejecutar si es el archivo principal
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

console.log('🔄 Reseteando usuarios del sistema...');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sistema_transito'
});

async function fixUsers() {
    try {
        connection.connect();
        
        // 1. Eliminar todos los usuarios existentes
        await connection.promise().execute('DELETE FROM usuarios');
        console.log('✅ Usuarios antiguos eliminados');
        
        // 2. Crear nuevo usuario admin con contraseña conocida
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);
        
        await connection.promise().execute(
            'INSERT INTO usuarios (username, password, rol, nombre_completo, email) VALUES (?, ?, ?, ?, ?)',
            ['admin', hash, 'admin', 'Administrador Principal', 'admin@transito.gov']
        );
        
        console.log('✅ NUEVO USUARIO CREADO:');
        console.log('   👤 Usuario: admin');
        console.log('   🔑 Contraseña: admin123');
        console.log('   👑 Rol: admin');
        
        // 3. Verificar que se creó correctamente
        const [users] = await connection.promise().execute('SELECT * FROM usuarios');
        console.log('📋 Usuarios en la base de datos:', users.length);
        
        users.forEach(user => {
            console.log(`   - ${user.username} (${user.rol})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        connection.end();
        console.log('🎉 Proceso completado');
    }
}

fixUsers();
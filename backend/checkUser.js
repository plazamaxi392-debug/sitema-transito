const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sistema_transito'
});

console.log('🔍 Verificando usuario admin en la base de datos...');

connection.connect((err) => {
    if (err) {
        console.error('❌ Error conectando:', err.message);
        return;
    }
    
    // Verificar usuarios
    connection.query('SELECT id, username, rol, password FROM usuarios', (err, results) => {
        if (err) {
            console.error('❌ Error consultando usuarios:', err.message);
            return;
        }
        
        console.log('📊 Usuarios en la base de datos:');
        if (results.length === 0) {
            console.log('   No hay usuarios registrados');
        } else {
            results.forEach(user => {
                console.log(`   👤 ID: ${user.id}, Usuario: ${user.username}, Rol: ${user.rol}`);
                console.log(`      Password Hash: ${user.password.substring(0, 20)}...`);
            });
        }
        
        connection.end();
    });
});
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sistema_transito'
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Error conectando:', err.message);
        return;
    }
    console.log('✅ Conexión a BD exitosa');
    
    // Verificar tablas
    connection.query('SHOW TABLES', (err, results) => {
        if (err) {
            console.error('❌ Error mostrando tablas:', err.message);
            return;
        }
        console.log('📊 Tablas en la base de datos:');
        results.forEach(row => {
            console.log('   - ' + Object.values(row)[0]);
        });
        
        connection.end();
    });
});
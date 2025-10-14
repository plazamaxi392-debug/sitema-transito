const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

async function createUser() {
    const hash = await bcrypt.hash('admin123', 10);
    
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'sistema_transito'
    });
    
    connection.connect();
    
    const sql = `
        INSERT INTO usuarios (username, password, rol, nombre_completo, email) 
        VALUES ('admin2', ?, 'admin', 'Administrador Backup', 'admin2@transito.gov')
    `;
    
    connection.query(sql, [hash], (err, results) => {
        if (err) {
            console.error('Error:', err.message);
        } else {
            console.log('✅ Nuevo usuario creado:');
            console.log('   👤 Usuario: admin2');
            console.log('   🔑 Contraseña: admin123');
        }
        connection.end();
    });
}

createUser();
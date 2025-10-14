const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('🔐 Intento de login para usuario:', username);

        if (!username || !password) {
            return res.status(400).json({ 
                error: 'Usuario y contraseña son requeridos' 
            });
        }

        // Buscar usuario
        const [users] = await pool.execute(
            'SELECT * FROM usuarios WHERE username = ? AND activo = TRUE',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const user = users[0];

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // SOLUCIÓN: Usar JWT_SECRET del environment o un valor por defecto
        const jwtSecret = process.env.JWT_SECRET || 'transito';
        
        if (!jwtSecret) {
            throw new Error('JWT_SECRET no está configurado');
        }

        // Generar token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                rol: user.rol 
            },
            jwtSecret,  // Usar la variable que definimos
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Actualizar último login
        await pool.execute(
            'UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Respuesta exitosa
        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                username: user.username,
                rol: user.rol,
                nombre_completo: user.nombre_completo,
                email: user.email
            }
        });

    } catch (error) {
        console.error('💥 ERROR en login:', error.message);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


const getProfile = async (req, res) => {
    res.json({
        user: req.user
    });
};

module.exports = { login, getProfile };
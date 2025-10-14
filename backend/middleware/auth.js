const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [users] = await pool.execute(
            'SELECT id, username, rol, nombre_completo, email FROM usuarios WHERE id = ? AND activo = TRUE',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(403).json({ error: 'Usuario no válido' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
    }
};

// Middleware para verificar roles
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ 
                error: 'Permisos insuficientes para esta acción',
                required: roles,
                current: req.user.rol
            });
        }
        next();
    };
};

// Middlewares predefinidos para cada rol
const requireAdmin = requireRole(['admin']);
const requireUsuario = requireRole(['admin', 'usuario']);
const requireInvitado = requireRole(['admin', 'usuario', 'invitado']); // ✅ Asegurar que esta línea existe

module.exports = { 
    authenticateToken, 
    requireRole,
    requireAdmin,
    requireUsuario,
    requireInvitado  // ✅ Asegurar que está exportado
};
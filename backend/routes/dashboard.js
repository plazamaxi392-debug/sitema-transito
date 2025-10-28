const express = require('express');
const {
    getDashboardStats,
    getActividadReciente
} = require('../controllers/dashboardController');
const { authenticateToken, requireUsuario } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/dashboard/stats - Obtener estadísticas del dashboard
router.get('/stats', requireUsuario, getDashboardStats);

// GET /api/dashboard/actividad - Obtener actividad reciente
router.get('/actividad', requireUsuario, getActividadReciente);

module.exports = router;
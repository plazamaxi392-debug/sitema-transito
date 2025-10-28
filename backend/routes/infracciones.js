const express = require('express');
const {
    getAllInfracciones,
    getInfraccionById,
    createInfraccion,
    updateInfraccion,
    deleteInfraccion,
    searchInfracciones,
    getEstadisticasInfracciones
} = require('../controllers/infraccionesController');
const { authenticateToken, requireUsuario, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/infracciones - Obtener todas las infracciones
router.get('/', requireUsuario, getAllInfracciones);

// GET /api/infracciones/search - Buscar infracciones por criterios
router.get('/search', requireUsuario, searchInfracciones);

// GET /api/infracciones/estadisticas - Obtener estadísticas
router.get('/estadisticas', requireUsuario, getEstadisticasInfracciones);

// GET /api/infracciones/:id - Obtener infracción por ID
router.get('/:id', requireUsuario, getInfraccionById);

// POST /api/infracciones - Crear nueva infracción
router.post('/', requireUsuario, createInfraccion);

// PUT /api/infracciones/:id - Actualizar infracción
router.put('/:id', requireAdmin, updateInfraccion);

// DELETE /api/infracciones/:id - Eliminar infracción
router.delete('/:id', requireAdmin, deleteInfraccion);
const express = require('express');
const {
    getAllPropietarios,
    getPropietarioById,
    createPropietario,
    updatePropietario,
    deletePropietario,
    searchPropietarios
} = require('../controllers/propietariosController');
const { authenticateToken, requireUsuario, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/propietarios - Obtener todos los propietarios
router.get('/', requireUsuario, getAllPropietarios);

// GET /api/propietarios/search - Buscar propietarios por criterios
router.get('/search', requireUsuario, searchPropietarios);

// GET /api/propietarios/:id - Obtener propietario por ID
router.get('/:id', requireUsuario, getPropietarioById);

// POST /api/propietarios - Crear nuevo propietario
router.post('/', requireUsuario, createPropietario);

// PUT /api/propietarios/:id - Actualizar propietario
router.put('/:id', requireAdmin, updatePropietario);

// DELETE /api/propietarios/:id - Eliminar propietario
router.delete('/:id', requireAdmin, deletePropietario);

module.exports = router;
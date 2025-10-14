const express = require('express');
const {
    getAllVehiculos,
    getVehiculoById,
    createVehiculo,
    searchVehiculoByPatente,
    searchVehiculos,
    updateVehiculo,
    deleteVehiculo
} = require('../controllers/vehiculosController');
const { authenticateToken, requireUsuario, requireInvitado, requireAdmin } = require('../middleware/auth'); // ✅ Agregar requireInvitado

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/vehiculos - Obtener todos los vehículos
router.get('/', requireUsuario, getAllVehiculos);

// GET /api/vehiculos/search/:patente - Buscar por patente
router.get('/search/:patente', requireInvitado, searchVehiculoByPatente);

// GET /api/vehiculos/:id - Obtener vehículo por ID
router.get('/:id', requireUsuario, getVehiculoById);

// POST /api/vehiculos - Crear nuevo vehículo
router.post('/', requireUsuario, createVehiculo);

// Agrega esta ruta para búsqueda avanzada:
router.get('/search', requireUsuario, searchVehiculos);
// DELETE /api/vehiculos/:id - Eliminar vehículo
router.delete('/:id', requireAdmin, deleteVehiculo);

// PUT /api/vehiculos/:id - Actualizar vehículo
router.put('/:id', requireAdmin, updateVehiculo);

module.exports = router;
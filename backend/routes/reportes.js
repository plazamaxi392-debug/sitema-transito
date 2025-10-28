const express = require('express');
const {
    getReporteInfraccionesPorFecha,
    getReporteVehiculosMasInfracciones,
    getConsultaPorPatente,
    getConsultaPorActa,
    getConsultaPorDNI,
    getReporteGeneral
} = require('../controllers/reportesController');
const { authenticateToken, requireUsuario, requireInvitado } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/reportes/infracciones-fecha - Reporte de infracciones por fecha
router.get('/infracciones-fecha', requireUsuario, getReporteInfraccionesPorFecha);

// GET /api/reportes/vehiculos-mas-infracciones - Vehículos con más infracciones
router.get('/vehiculos-mas-infracciones', requireUsuario, getReporteVehiculosMasInfracciones);

// GET /api/reportes/consulta-patente - Consulta por patente
router.get('/consulta-patente', requireInvitado, getConsultaPorPatente);

// GET /api/reportes/consulta-acta - Consulta por número de acta
router.get('/consulta-acta', requireInvitado, getConsultaPorActa);

// GET /api/reportes/consulta-dni - Consulta por DNI
router.get('/consulta-dni', requireInvitado, getConsultaPorDNI);

// GET /api/reportes/general - Reporte general del sistema
router.get('/general', requireUsuario, getReporteGeneral);

module.exports = router;
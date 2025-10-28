const { pool } = require('../config/database');

// Obtener estadísticas completas del dashboard
const getDashboardStats = async (req, res) => {
    try {
        console.log('📊 Obteniendo estadísticas del dashboard');
        
        // Estadísticas básicas
        const [stats] = await pool.execute(`
            SELECT 
                (SELECT COUNT(*) FROM vehiculos) as total_vehiculos,
                (SELECT COUNT(*) FROM propietarios) as total_propietarios,
                (SELECT COUNT(*) FROM infracciones) as total_infracciones,
                (SELECT COUNT(*) FROM infracciones WHERE estado = 'pendiente') as infracciones_pendientes,
                (SELECT COUNT(*) FROM infracciones WHERE estado = 'pagada') as infracciones_pagadas,
                (SELECT COUNT(*) FROM usuarios WHERE activo = true) as total_usuarios,
                (SELECT COUNT(*) FROM infracciones WHERE DATE(fecha_infraccion) = CURDATE()) as infracciones_hoy
        `);

        // Infracciones por tipo de vehículo (últimos 30 días)
        const [infraccionesPorTipo] = await pool.execute(`
            SELECT 
                v.tipo_vehiculo,
                COUNT(i.id) as cantidad
            FROM infracciones i
            LEFT JOIN vehiculos v ON i.vehiculo_id = v.id
            WHERE i.fecha_infraccion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY v.tipo_vehiculo
            ORDER BY cantidad DESC
        `);

        // Infracciones por día (últimos 7 días)
        const [infraccionesPorDia] = await pool.execute(`
            SELECT 
                DATE(fecha_infraccion) as fecha,
                COUNT(*) as cantidad
            FROM infracciones 
            WHERE fecha_infraccion >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(fecha_infraccion)
            ORDER BY fecha ASC
        `);

        // Top agentes más activos (últimos 30 días)
        const [agentesActivos] = await pool.execute(`
            SELECT 
                u.nombre_completo,
                COUNT(i.id) as infracciones_registradas
            FROM usuarios u
            LEFT JOIN infracciones i ON u.id = i.usuario_id
            WHERE i.fecha_infraccion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY u.id
            ORDER BY infracciones_registradas DESC
            LIMIT 5
        `);

        // Vehículos con más infracciones
        const [vehiculosProblematicos] = await pool.execute(`
            SELECT 
                v.patente,
                v.marca,
                v.modelo,
                COUNT(i.id) as total_infracciones
            FROM vehiculos v
            LEFT JOIN infracciones i ON v.id = i.vehiculo_id
            GROUP BY v.id
            HAVING total_infracciones > 0
            ORDER BY total_infracciones DESC
            LIMIT 5
        `);

        // Infracciones por estado
        const [infraccionesPorEstado] = await pool.execute(`
            SELECT 
                estado,
                COUNT(*) as cantidad
            FROM infracciones
            GROUP BY estado
        `);

        res.json({
            success: true,
            data: {
                estadisticas: stats[0],
                por_tipo_vehiculo: infraccionesPorTipo,
                por_dia: infraccionesPorDia,
                agentes_activos: agentesActivos,
                vehiculos_problematicos: vehiculosProblematicos,
                por_estado: infraccionesPorEstado
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas del dashboard:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener actividad reciente
const getActividadReciente = async (req, res) => {
    try {
        console.log('🔄 Obteniendo actividad reciente');
        
        // Infracciones recientes
        const [infraccionesRecientes] = await pool.execute(`
            SELECT 
                i.*,
                v.patente,
                v.marca,
                v.modelo,
                u.nombre_completo as agente
            FROM infracciones i
            LEFT JOIN vehiculos v ON i.vehiculo_id = v.id
            LEFT JOIN usuarios u ON i.usuario_id = u.id
            ORDER BY i.fecha_registro DESC
            LIMIT 10
        `);

        // Vehículos registrados recientemente
        const [vehiculosRecientes] = await pool.execute(`
            SELECT 
                v.*,
                p.nombre as propietario_nombre
            FROM vehiculos v
            LEFT JOIN propietarios p ON v.propietario_id = p.id
            ORDER BY v.fecha_registro DESC
            LIMIT 5
        `);

        // Propietarios registrados recientemente
        const [propietariosRecientes] = await pool.execute(`
            SELECT *
            FROM propietarios
            ORDER BY fecha_registro DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                infracciones: infraccionesRecientes,
                vehiculos: vehiculosRecientes,
                propietarios: propietariosRecientes
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo actividad reciente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    getDashboardStats,
    getActividadReciente
};
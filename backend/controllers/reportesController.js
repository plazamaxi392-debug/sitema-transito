const { pool } = require('../config/database');

// Reporte de infracciones por fecha
const getReporteInfraccionesPorFecha = async (req, res) => {
    try {
        const { fecha_desde, fecha_hasta, agrupacion = 'dia' } = req.query;
        
        console.log('📊 Generando reporte por fecha:', { fecha_desde, fecha_hasta, agrupacion });

        let groupByClause, dateFormat;
        switch (agrupacion) {
            case 'mes':
                groupByClause = 'YEAR(fecha_infraccion), MONTH(fecha_infraccion)';
                dateFormat = 'DATE_FORMAT(fecha_infraccion, "%Y-%m")';
                break;
            case 'semana':
                groupByClause = 'YEAR(fecha_infraccion), WEEK(fecha_infraccion)';
                dateFormat = 'DATE_FORMAT(fecha_infraccion, "%Y-%u")';
                break;
            default: // día
                groupByClause = 'DATE(fecha_infraccion)';
                dateFormat = 'DATE(fecha_infraccion)';
        }

        let query = `
            SELECT 
                ${dateFormat} as periodo,
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'pagada' THEN 1 ELSE 0 END) as pagadas,
                SUM(CASE WHEN estado = 'recurrida' THEN 1 ELSE 0 END) as recurridas
            FROM infracciones 
            WHERE 1=1
        `;
        const params = [];

        if (fecha_desde) {
            query += ' AND DATE(fecha_infraccion) >= ?';
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            query += ' AND DATE(fecha_infraccion) <= ?';
            params.push(fecha_hasta);
        }

        query += ` GROUP BY ${groupByClause} ORDER BY periodo DESC`;

        console.log('📝 Query ejecutado:', query);
        console.log('🔧 Parámetros:', params);

        const [reporte] = await pool.execute(query, params);

        // Obtener detalles adicionales para el período más reciente
        let detallesRecientes = [];
        if (reporte.length > 0) {
            const [detalles] = await pool.execute(`
                SELECT i.*, v.patente, v.marca, v.modelo, u.nombre_completo as agente
                FROM infracciones i
                LEFT JOIN vehiculos v ON i.vehiculo_id = v.id
                LEFT JOIN usuarios u ON i.usuario_id = u.id
                WHERE DATE(i.fecha_infraccion) >= ?
                ORDER BY i.fecha_infraccion DESC
                LIMIT 10
            `, [fecha_desde || new Date().toISOString().split('T')[0]]);
            
            detallesRecientes = detalles;
        }

        res.json({
            success: true,
            data: {
                resumen: reporte,
                detalles: detallesRecientes,
                totalGeneral: reporte.reduce((sum, item) => sum + item.total, 0)
            }
        });

    } catch (error) {
        console.error('❌ Error generando reporte por fecha:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Reporte de vehículos con más infracciones
const getReporteVehiculosMasInfracciones = async (req, res) => {
    try {
        const { limite = 10, fecha_desde, fecha_hasta } = req.query;
        
        console.log('🚗 Generando reporte de vehículos con más infracciones');

        let query = `
            SELECT 
                v.id,
                v.patente,
                v.marca,
                v.modelo,
                v.color,
                v.tipo_vehiculo,
                COUNT(i.id) as total_infracciones,
                SUM(CASE WHEN i.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                p.nombre as propietario_nombre,
                p.dni as propietario_dni
            FROM vehiculos v
            LEFT JOIN infracciones i ON v.id = i.vehiculo_id
            LEFT JOIN propietarios p ON v.propietario_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (fecha_desde) {
            query += ' AND DATE(i.fecha_infraccion) >= ?';
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            query += ' AND DATE(i.fecha_infraccion) <= ?';
            params.push(fecha_hasta);
        }

        query += `
            GROUP BY v.id
            HAVING total_infracciones > 0
            ORDER BY total_infracciones DESC
            LIMIT ?
        `;
        params.push(parseInt(limite));

        const [vehiculos] = await pool.execute(query, params);

        res.json({
            success: true,
            data: vehiculos
        });

    } catch (error) {
        console.error('❌ Error generando reporte de vehículos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Consulta por patente
const getConsultaPorPatente = async (req, res) => {
    try {
        const { patente } = req.query;
        
        if (!patente) {
            return res.status(400).json({ error: 'La patente es requerida' });
        }

        console.log('🔍 Consultando por patente:', patente);

        // Obtener información del vehículo
        const [vehiculos] = await pool.execute(`
            SELECT v.*, p.nombre as propietario_nombre, p.dni as propietario_dni,
                   p.telefono, p.email, p.direccion
            FROM vehiculos v
            LEFT JOIN propietarios p ON v.propietario_id = p.id
            WHERE v.patente LIKE ?
        `, [`%${patente}%`]);

        if (vehiculos.length === 0) {
            return res.json({
                success: true,
                data: {
                    vehiculo: null,
                    infracciones: []
                }
            });
        }

        const vehiculo = vehiculos[0];

        // Obtener infracciones del vehículo
        const [infracciones] = await pool.execute(`
            SELECT i.*, u.nombre_completo as agente
            FROM infracciones i
            LEFT JOIN usuarios u ON i.usuario_id = u.id
            WHERE i.vehiculo_id = ?
            ORDER BY i.fecha_infraccion DESC
        `, [vehiculo.id]);

        res.json({
            success: true,
            data: {
                vehiculo,
                infracciones
            }
        });

    } catch (error) {
        console.error('❌ Error en consulta por patente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Consulta por número de acta
const getConsultaPorActa = async (req, res) => {
    try {
        const { numero_acta } = req.query;
        
        if (!numero_acta) {
            return res.status(400).json({ error: 'El número de acta es requerido' });
        }

        console.log('🔍 Consultando por acta:', numero_acta);

        const [infracciones] = await pool.execute(`
            SELECT i.*, 
                   v.patente, v.marca, v.modelo, v.color,
                   p.nombre as propietario_nombre, p.dni as propietario_dni,
                   u.nombre_completo as agente
            FROM infracciones i
            LEFT JOIN vehiculos v ON i.vehiculo_id = v.id
            LEFT JOIN propietarios p ON i.conductor_dni = p.dni
            LEFT JOIN usuarios u ON i.usuario_id = u.id
            WHERE i.numero_acta LIKE ?
        `, [`%${numero_acta}%`]);

        res.json({
            success: true,
            data: infracciones
        });

    } catch (error) {
        console.error('❌ Error en consulta por acta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Consulta por DNI
const getConsultaPorDNI = async (req, res) => {
    try {
        const { dni } = req.query;
        
        if (!dni) {
            return res.status(400).json({ error: 'El DNI es requerido' });
        }

        console.log('🔍 Consultando por DNI:', dni);

        // Buscar como propietario de vehículos
        const [propietarioData] = await pool.execute(`
            SELECT p.*, COUNT(v.id) as total_vehiculos
            FROM propietarios p
            LEFT JOIN vehiculos v ON p.id = v.propietario_id
            WHERE p.dni LIKE ?
            GROUP BY p.id
        `, [`%${dni}%`]);

        // Buscar como conductor en infracciones
        const [infraccionesComoConductor] = await pool.execute(`
            SELECT i.*, 
                   v.patente, v.marca, v.modelo, v.color,
                   u.nombre_completo as agente
            FROM infracciones i
            LEFT JOIN vehiculos v ON i.vehiculo_id = v.id
            LEFT JOIN usuarios u ON i.usuario_id = u.id
            WHERE i.conductor_dni LIKE ?
            ORDER BY i.fecha_infraccion DESC
        `, [`%${dni}%`]);

        res.json({
            success: true,
            data: {
                propietario: propietarioData[0] || null,
                infracciones_como_conductor: infraccionesComoConductor,
                infracciones_como_propietario: [] // Se puede expandir si es necesario
            }
        });

    } catch (error) {
        console.error('❌ Error en consulta por DNI:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Reporte general del sistema
const getReporteGeneral = async (req, res) => {
    try {
        console.log('📈 Generando reporte general del sistema');

        // Estadísticas generales
        const [estadisticas] = await pool.execute(`
            SELECT 
                (SELECT COUNT(*) FROM vehiculos) as total_vehiculos,
                (SELECT COUNT(*) FROM propietarios) as total_propietarios,
                (SELECT COUNT(*) FROM infracciones) as total_infracciones,
                (SELECT COUNT(*) FROM infracciones WHERE estado = 'pendiente') as infracciones_pendientes,
                (SELECT COUNT(*) FROM infracciones WHERE estado = 'pagada') as infracciones_pagadas,
                (SELECT COUNT(*) FROM usuarios WHERE activo = true) as total_usuarios
        `);

        // Infracciones por mes (últimos 6 meses)
        const [infraccionesPorMes] = await pool.execute(`
            SELECT 
                DATE_FORMAT(fecha_infraccion, '%Y-%m') as mes,
                COUNT(*) as cantidad
            FROM infracciones 
            WHERE fecha_infraccion >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(fecha_infraccion, '%Y-%m')
            ORDER BY mes DESC
        `);

        // Vehículos por tipo
        const [vehiculosPorTipo] = await pool.execute(`
            SELECT 
                tipo_vehiculo,
                COUNT(*) as cantidad
            FROM vehiculos
            GROUP BY tipo_vehiculo
            ORDER BY cantidad DESC
        `);

        // Top agentes (usuarios que registran más infracciones)
        const [topAgentes] = await pool.execute(`
            SELECT 
                u.nombre_completo,
                COUNT(i.id) as infracciones_registradas
            FROM usuarios u
            LEFT JOIN infracciones i ON u.id = i.usuario_id
            WHERE u.activo = true
            GROUP BY u.id
            ORDER BY infracciones_registradas DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                estadisticas: estadisticas[0],
                infracciones_por_mes: infraccionesPorMes,
                vehiculos_por_tipo: vehiculosPorTipo,
                top_agentes: topAgentes
            }
        });

    } catch (error) {
        console.error('❌ Error generando reporte general:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    getReporteInfraccionesPorFecha,
    getReporteVehiculosMasInfracciones,
    getConsultaPorPatente,
    getConsultaPorActa,
    getConsultaPorDNI,
    getReporteGeneral
};
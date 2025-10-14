const { pool } = require('../config/database');

// Obtener todos los vehículos
const getAllVehiculos = async (req, res) => {
    try {
        const [vehiculos] = await pool.execute(`
            SELECT 
                v.id, v.patente, v.tipo_vehiculo, v.marca, v.modelo, v.color,
                v.numero_motor, v.numero_chasis, v.propietario_id,
                v.cedula_verde, v.titulo_registro, v.seguro_activo, 
                v.compañia_seguro, v.fecha_registro,
                p.nombre as propietario_nombre, p.dni as propietario_dni
            FROM vehiculos v
            LEFT JOIN propietarios p ON v.propietario_id = p.id
            ORDER BY v.fecha_registro DESC
        `);

        console.log('📊 Vehículos en BD:', vehiculos); // Debug del backend

        res.json({
            success: true,
            data: vehiculos,
            total: vehiculos.length
        });
    } catch (error) {
        console.error('Error obteniendo vehículos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener vehículo por ID
const getVehiculoById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [vehiculos] = await pool.execute(`
            SELECT v.*, p.nombre as propietario_nombre, p.dni as propietario_dni, 
                   p.carnet_conducir, p.direccion, p.telefono, p.email
            FROM vehiculos v
            LEFT JOIN propietarios p ON v.propietario_id = p.id
            WHERE v.id = ?
        `, [id]);

        if (vehiculos.length === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }

        res.json({
            success: true,
            data: vehiculos[0]
        });
    } catch (error) {
        console.error('Error obteniendo vehículo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Función helper para convertir undefined a null
const safeValue = (value) => {
    return value === undefined ? null : value;
};

// Crear nuevo vehículo - CORREGIDO
const createVehiculo = async (req, res) => {
    try {
        const {
            patente,
            tipo_vehiculo,
            marca,
            modelo,
            color,
            numero_motor,
            numero_chasis,
            propietario_dni,
            cedula_verde,
            titulo_registro,
            seguro_activo,
            compañia_seguro
        } = req.body;

        console.log('📝 Datos recibidos:', req.body); // Para debug

        // Validaciones básicas
        if (!patente || !tipo_vehiculo) {
            return res.status(400).json({ error: 'Patente y tipo de vehículo son requeridos' });
        }

        let propietario_id = null;

        // Si se proporciona DNI del propietario, buscarlo
        if (propietario_dni) {
            const [propietarios] = await pool.execute(
                'SELECT id FROM propietarios WHERE dni = ?',
                [propietario_dni]
            );

            if (propietarios.length === 0) {
                return res.status(400).json({ 
                    error: 'Propietario no encontrado. Primero debe registrar el propietario.' 
                });
            }

            propietario_id = propietarios[0].id;
        }

        // CORRECCIÓN: Convertir undefined a null para todos los campos
        const insertData = [
            safeValue(patente),
            safeValue(tipo_vehiculo),
            safeValue(marca),
            safeValue(modelo),
            safeValue(color),
            safeValue(numero_motor),
            safeValue(numero_chasis),
            safeValue(propietario_id),
            safeValue(cedula_verde),
            safeValue(titulo_registro),
            safeValue(seguro_activo) || false, // Default a false si es undefined
            safeValue(compañia_seguro)
        ];

        console.log('💾 Datos a insertar:', insertData); // Para debug

        // Insertar vehículo
        const [result] = await pool.execute(
            `INSERT INTO vehiculos 
            (patente, tipo_vehiculo, marca, modelo, color, numero_motor, numero_chasis, 
             propietario_id, cedula_verde, titulo_registro, seguro_activo, compañia_seguro) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            insertData
        );

        // Obtener el vehículo recién creado
        const [nuevoVehiculo] = await pool.execute(`
            SELECT v.*, p.nombre as propietario_nombre, p.dni as propietario_dni
            FROM vehiculos v
            LEFT JOIN propietarios p ON v.propietario_id = p.id
            WHERE v.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Vehículo creado exitosamente',
            data: nuevoVehiculo[0]
        });

    } catch (error) {
        console.error('💥 Error creando vehículo:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'La patente ya existe en el sistema' });
        }
        
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Buscar vehículo por patente
const searchVehiculoByPatente = async (req, res) => {
    try {
        const { patente } = req.params;
        
        const [vehiculos] = await pool.execute(`
            SELECT v.*, p.nombre as propietario_nombre, p.dni as propietario_dni
            FROM vehiculos v
            LEFT JOIN propietarios p ON v.propietario_id = p.id
            WHERE v.patente LIKE ?
        `, [`%${patente}%`]);

        res.json({
            success: true,
            data: vehiculos,
            total: vehiculos.length
        });
    } catch (error) {
        console.error('Error buscando vehículo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
// Eliminar vehículo
// Eliminar vehículo
// Eliminar vehículo
const deleteVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('🗑️ Solicitud de eliminación para vehículo ID:', id);
        
        // Verificar si el vehículo existe
        const [vehiculos] = await pool.execute(
            'SELECT id, patente FROM vehiculos WHERE id = ?',
            [id]
        );
        
        if (vehiculos.length === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        
        const vehiculo = vehiculos[0];
        
        // Verificar si el vehículo tiene infracciones asociadas
        const [infracciones] = await pool.execute(
            'SELECT id FROM infracciones WHERE vehiculo_id = ?',
            [id]
        );
        
        if (infracciones.length > 0) {
            return res.status(400).json({ 
                error: `No se puede eliminar el vehículo. Tiene ${infracciones.length} infracción(es) asociada(s).` 
            });
        }
        
        // Eliminar el vehículo
        await pool.execute('DELETE FROM vehiculos WHERE id = ?', [id]);
        
        console.log('✅ Vehículo eliminado exitosamente:', vehiculo.patente);
        
        res.json({
            success: true,
            message: `Vehículo ${vehiculo.patente} eliminado exitosamente`
        });
        
    } catch (error) {
        console.error('❌ Error eliminando vehículo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
// Buscar vehículos por múltiples criterios
const searchVehiculos = async (req, res) => {
    try {
        const { patente, marca, propietario } = req.query;
        
        let query = `
            SELECT v.*, p.nombre as propietario_nombre, p.dni as propietario_dni
            FROM vehiculos v
            LEFT JOIN propietarios p ON v.propietario_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (patente) {
            query += ' AND v.patente LIKE ?';
            params.push(`%${patente}%`);
        }

        if (marca) {
            query += ' AND v.marca LIKE ?';
            params.push(`%${marca}%`);
        }

        if (propietario) {
            query += ' AND (p.nombre LIKE ? OR p.dni LIKE ?)';
            params.push(`%${propietario}%`, `%${propietario}%`);
        }

        query += ' ORDER BY v.fecha_registro DESC';

        const [vehiculos] = await pool.execute(query, params);

        res.json({
            success: true,
            data: vehiculos,
            total: vehiculos.length
        });
    } catch (error) {
        console.error('Error buscando vehículos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
// Actualizar vehículo
const updateVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            patente,
            tipo_vehiculo,
            marca,
            modelo,
            color,
            numero_motor,
            numero_chasis,
            propietario_dni,
            cedula_verde,
            titulo_registro,
            seguro_activo,
            compañia_seguro
        } = req.body;

        console.log('✏️ Actualizando vehículo ID:', id, 'Datos:', req.body);

        // Verificar que el vehículo existe
        const [vehiculos] = await pool.execute(
            'SELECT id FROM vehiculos WHERE id = ?',
            [id]
        );

        if (vehiculos.length === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }

        let propietario_id = null;

        // Si se proporciona DNI del propietario, buscarlo
        if (propietario_dni) {
            const [propietarios] = await pool.execute(
                'SELECT id FROM propietarios WHERE dni = ?',
                [propietario_dni]
            );

            if (propietarios.length > 0) {
                propietario_id = propietarios[0].id;
            }
        }

        // Actualizar vehículo
        await pool.execute(
            `UPDATE vehiculos 
            SET tipo_vehiculo = ?, marca = ?, modelo = ?, color = ?,
                numero_motor = ?, numero_chasis = ?, propietario_id = ?,
                cedula_verde = ?, titulo_registro = ?, seguro_activo = ?,
                compañia_seguro = ?
            WHERE id = ?`,
            [
                tipo_vehiculo, marca, modelo, color,
                numero_motor, numero_chasis, propietario_id,
                cedula_verde, titulo_registro, seguro_activo,
                compañia_seguro, id
            ]
        );

        // Obtener el vehículo actualizado
        const [vehiculoActualizado] = await pool.execute(`
            SELECT v.*, p.nombre as propietario_nombre, p.dni as propietario_dni
            FROM vehiculos v
            LEFT JOIN propietarios p ON v.propietario_id = p.id
            WHERE v.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Vehículo actualizado exitosamente',
            data: vehiculoActualizado[0]
        });

    } catch (error) {
        console.error('💥 Error actualizando vehículo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
module.exports = {
    getAllVehiculos,
    getVehiculoById,
    createVehiculo,
    searchVehiculoByPatente,
    searchVehiculos,
    updateVehiculo,
    deleteVehiculo  // Agregar esta línea
};
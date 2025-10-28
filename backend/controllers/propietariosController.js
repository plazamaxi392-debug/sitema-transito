const { pool } = require('../config/database');

// Obtener todos los propietarios
const getAllPropietarios = async (req, res) => {
    try {
        console.log('📋 Obteniendo todos los propietarios');
        const [propietarios] = await pool.execute(`
            SELECT p.*, 
                   COUNT(v.id) as total_vehiculos
            FROM propietarios p
            LEFT JOIN vehiculos v ON p.id = v.propietario_id
            GROUP BY p.id
            ORDER BY p.fecha_registro DESC
        `);

        console.log(`✅ Encontrados ${propietarios.length} propietarios`);
        res.json({
            success: true,
            data: propietarios,
            total: propietarios.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo propietarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener propietario por ID
const getPropietarioById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Obteniendo propietario ID:', id);
        
        const [propietarios] = await pool.execute(
            'SELECT * FROM propietarios WHERE id = ?',
            [id]
        );

        if (propietarios.length === 0) {
            console.log('❌ Propietario no encontrado ID:', id);
            return res.status(404).json({ error: 'Propietario no encontrado' });
        }

        // Obtener vehículos del propietario
        const [vehiculos] = await pool.execute(
            'SELECT id, patente, marca, modelo FROM vehiculos WHERE propietario_id = ?',
            [id]
        );

        const propietario = propietarios[0];
        propietario.vehiculos = vehiculos;

        console.log('✅ Propietario encontrado:', propietario.nombre);
        res.json({
            success: true,
            data: propietario
        });
    } catch (error) {
        console.error('❌ Error obteniendo propietario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Crear nuevo propietario
const createPropietario = async (req, res) => {
    try {
        const {
            dni,
            nombre,
            carnet_conducir,
            direccion,
            telefono,
            email,
            fecha_nacimiento
        } = req.body;

        console.log('📝 Creando propietario con datos:', req.body);

        // Validaciones básicas
        if (!dni || !nombre) {
            return res.status(400).json({ error: 'DNI y nombre son requeridos' });
        }

        // Validar formato de DNI (solo números)
        if (!/^\d+$/.test(dni)) {
            return res.status(400).json({ error: 'El DNI debe contener solo números' });
        }

        // Insertar propietario
        const [result] = await pool.execute(
            `INSERT INTO propietarios 
            (dni, nombre, carnet_conducir, direccion, telefono, email, fecha_nacimiento) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [dni, nombre, carnet_conducir || null, direccion || null, telefono || null, email || null, fecha_nacimiento || null]
        );

        console.log('✅ Propietario creado ID:', result.insertId);

        // Obtener el propietario recién creado
        const [nuevoPropietario] = await pool.execute(
            'SELECT * FROM propietarios WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Propietario creado exitosamente',
            data: nuevoPropietario[0]
        });

    } catch (error) {
        console.error('💥 Error creando propietario:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El DNI ya existe en el sistema' });
        }
        
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Actualizar propietario
const updatePropietario = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            dni,
            nombre,
            carnet_conducir,
            direccion,
            telefono,
            email,
            fecha_nacimiento
        } = req.body;

        console.log('✏️ Actualizando propietario ID:', id, 'Datos:', req.body);

        // Verificar que el propietario existe
        const [propietarios] = await pool.execute(
            'SELECT id, nombre FROM propietarios WHERE id = ?',
            [id]
        );

        if (propietarios.length === 0) {
            return res.status(404).json({ error: 'Propietario no encontrado' });
        }

        const propietarioActual = propietarios[0];

        // Validar formato de DNI (solo números)
        if (dni && !/^\d+$/.test(dni)) {
            return res.status(400).json({ error: 'El DNI debe contener solo números' });
        }

        // Actualizar propietario
        await pool.execute(
            `UPDATE propietarios 
            SET dni = ?, nombre = ?, carnet_conducir = ?, direccion = ?,
                telefono = ?, email = ?, fecha_nacimiento = ?
            WHERE id = ?`,
            [dni, nombre, carnet_conducir, direccion, telefono, email, fecha_nacimiento, id]
        );

        console.log('✅ Propietario actualizado:', propietarioActual.nombre);

        res.json({
            success: true,
            message: `Propietario ${propietarioActual.nombre} actualizado exitosamente`
        });

    } catch (error) {
        console.error('💥 Error actualizando propietario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar propietario
const deletePropietario = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('🗑️ Eliminando propietario ID:', id);
        
        // Verificar si el propietario existe
        const [propietarios] = await pool.execute(
            'SELECT id, nombre FROM propietarios WHERE id = ?',
            [id]
        );
        
        if (propietarios.length === 0) {
            return res.status(404).json({ error: 'Propietario no encontrado' });
        }
        
        const propietario = propietarios[0];
        
        // Verificar si el propietario tiene vehículos asociados
        const [vehiculos] = await pool.execute(
            'SELECT id, patente FROM vehiculos WHERE propietario_id = ?',
            [id]
        );
        
        if (vehiculos.length > 0) {
            const vehiculosList = vehiculos.map(v => v.patente).join(', ');
            return res.status(400).json({ 
                error: `No se puede eliminar el propietario. Tiene ${vehiculos.length} vehículo(s) asociado(s): ${vehiculosList}` 
            });
        }
        
        // Eliminar el propietario
        await pool.execute('DELETE FROM propietarios WHERE id = ?', [id]);
        
        console.log('✅ Propietario eliminado:', propietario.nombre);
        
        res.json({
            success: true,
            message: `Propietario ${propietario.nombre} eliminado exitosamente`
        });
        
    } catch (error) {
        console.error('❌ Error eliminando propietario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Buscar propietarios por múltiples criterios
const searchPropietarios = async (req, res) => {
    try {
        const { dni, nombre, carnet } = req.query;
        
        console.log('🔍 Búsqueda de propietarios con filtros:', { dni, nombre, carnet });
        
        let query = `
            SELECT p.*, COUNT(v.id) as total_vehiculos
            FROM propietarios p
            LEFT JOIN vehiculos v ON p.id = v.propietario_id
            WHERE 1=1
        `;
        const params = [];

        if (dni) {
            query += ' AND p.dni LIKE ?';
            params.push(`%${dni}%`);
        }

        if (nombre) {
            query += ' AND p.nombre LIKE ?';
            params.push(`%${nombre}%`);
        }

        if (carnet) {
            query += ' AND p.carnet_conducir LIKE ?';
            params.push(`%${carnet}%`);
        }

        query += ' GROUP BY p.id ORDER BY p.fecha_registro DESC';

        console.log('📝 Query ejecutado:', query);
        console.log('🔧 Parámetros:', params);

        const [propietarios] = await pool.execute(query, params);

        console.log(`✅ Búsqueda completada: ${propietarios.length} propietarios encontrados`);

        res.json({
            success: true,
            data: propietarios,
            total: propietarios.length
        });
    } catch (error) {
        console.error('❌ Error buscando propietarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    getAllPropietarios,
    getPropietarioById,
    createPropietario,
    updatePropietario,
    deletePropietario,
    searchPropietarios
};
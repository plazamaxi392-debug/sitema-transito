class SistemaTransito {
    constructor() {
        this.apiBase = 'http://localhost:3000/api';
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuth();
    }

    bindEvents() {
        // Login
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        
        // Navegación
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchTab(e));
        });

        // Vehículos
        document.getElementById('nuevoVehiculoBtn').addEventListener('click', () => this.showVehiculoModal());
        document.getElementById('vehiculoForm').addEventListener('submit', (e) => this.handleVehiculoSubmit(e));
        document.querySelector('.close').addEventListener('click', () => this.hideModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideModal());

        // Cerrar modal al hacer click fuera
        document.getElementById('vehiculoModal').addEventListener('click', (e) => {
            if (e.target.id === 'vehiculoModal') this.hideModal();
        });

            // Nuevos listeners para modales
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal');
                this.ocultarModal(modalId);
            });
        });
        
        document.querySelectorAll('.btn-secondary[data-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal');
                this.ocultarModal(modalId);
            });
        });
        
        // Cerrar modales al hacer click fuera
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.ocultarModal(modal.id);
                }
            });
        });
        
        document.getElementById('buscarVehiculosBtn').addEventListener('click', () => this.buscarVehiculos());
        document.getElementById('limpiarFiltrosVehiculosBtn').addEventListener('click', () => this.limpiarFiltrosVehiculos());
    }

    checkAuth() {
        if (this.token && this.user.id) {
            this.showDashboard();
            this.loadDashboardData();
        } else {
            this.showLogin();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                this.showDashboard();
                this.loadDashboardData();
                this.showMessage('Login exitoso', 'success');
            } else {
                this.showMessage(data.error, 'error');
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.showMessage('Error de conexión', 'error');
        }
    }

    handleLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.token = null;
        this.user = {};
        this.showLogin();
    }

    showLogin() {
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('dashboard').classList.remove('active');
    }

    showDashboard() {
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('dashboard').classList.add('active');
        
        // Actualizar información del usuario
        document.getElementById('userWelcome').textContent = `Bienvenido, ${this.user.nombre_completo}`;
        
        // Mostrar/ocultar elementos según el rol
        if (this.user.rol === 'admin') {
            document.body.classList.add('user-role-admin');
        }
    }

    switchTab(e) {
        const tabId = e.currentTarget.getAttribute('data-tab');
        
        // Actualizar navegación
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        e.currentTarget.classList.add('active');
        
        // Mostrar contenido de la pestaña
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');
        
        // Cargar datos específicos de la pestaña
        if (tabId === 'vehiculos-tab') {
            this.loadVehiculos();
        }
    }

    async loadDashboardData() {
        try {
            // Cargar vehículos para el contador
            const vehiculos = await this.apiCall('/vehiculos');
            document.getElementById('totalVehiculos').textContent = vehiculos.total || 0;
            
            // Por ahora, valores de ejemplo para otros contadores
            document.getElementById('totalInfracciones').textContent = '0';
            document.getElementById('totalUsuarios').textContent = '1';
            
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
        }
    }

    async loadVehiculos() {
        try {
            console.log('🔄 Cargando vehículos...'); // Debug
            const data = await this.apiCall('/vehiculos');
            console.log('📦 Datos recibidos:', data); // Debug
            this.renderVehiculosTable(data.data || []);
        } catch (error) {
            console.error('❌ Error cargando vehículos:', error);
            this.showMessage('Error al cargar vehículos', 'error');
        }
    }

    renderVehiculosTable(vehiculos) {
        const tbody = document.getElementById('vehiculosTableBody');
        tbody.innerHTML = '';

        console.log('🎯 Vehículos a renderizar:', vehiculos);

        if (vehiculos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="12" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-car" style="font-size: 2rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                        <p>No hay vehículos registrados</p>
                    </td>
                </tr>
            `;
            return;
        }

        vehiculos.forEach(vehiculo => {
            console.log('🚗 Procesando vehículo:', vehiculo);
            
            const row = document.createElement('tr');
            
            // Verificar que tenemos los datos
            const tieneDocumentacion = vehiculo.cedula_verde || vehiculo.titulo_registro;
            const tieneSeguro = vehiculo.seguro_activo;
            const fechaRegistro = vehiculo.fecha_registro ? this.formatFecha(vehiculo.fecha_registro) : '-';
            
            // Crear las celdas de datos normalmente
            row.innerHTML = `
                <td><strong>${vehiculo.patente || '-'}</strong></td>
                <td><span class="badge">${this.formatTipoVehiculo(vehiculo.tipo_vehiculo)}</span></td>
                <td>${vehiculo.marca || '-'}</td>
                <td>${vehiculo.modelo || '-'}</td>
                <td>${vehiculo.color || '-'}</td>
                <td>${vehiculo.numero_motor || '-'}</td>
                <td>${vehiculo.numero_chasis || '-'}</td>
                <td>${vehiculo.propietario_nombre || (vehiculo.propietario_dni ? `DNI: ${vehiculo.propietario_dni}` : 'No asignado')}</td>
                <td>${tieneDocumentacion ? '✅' : '❌'}</td>
                <td>
                    ${tieneSeguro ? '✅' : '❌'}
                    ${tieneSeguro && vehiculo.compañia_seguro ? `<br><small>${vehiculo.compañia_seguro}</small>` : ''}
                </td>
                <td>${fechaRegistro}</td>
            `;
            
            // === PARTE CORREGIDA: CREAR CELDA DE ACCIONES CON EVENT LISTENERS ===
            const accionesCell = document.createElement('td');
            
            // Botón Ver Detalles
            const btnVer = document.createElement('button');
            btnVer.className = 'btn-icon';
            btnVer.title = 'Ver detalles';
            btnVer.innerHTML = '<i class="fas fa-eye"></i>';
            btnVer.addEventListener('click', () => {
                console.log('👁️ Click en Ver:', vehiculo.id);
                this.verVehiculo(vehiculo.id);
            });
            
            // Botón Editar
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-icon';
            btnEditar.title = 'Editar';
            btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
            btnEditar.addEventListener('click', () => {
                console.log('✏️ Click en Editar:', vehiculo.id);
                this.editarVehiculo(vehiculo.id);
            });
            
            // Botón Eliminar
            const btnEliminar = document.createElement('button');
            btnEliminar.className = 'btn-icon btn-danger';
            btnEliminar.title = 'Eliminar';
            btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
            btnEliminar.addEventListener('click', () => {
                console.log('🗑️ Click en Eliminar:', vehiculo.id);
                this.eliminarVehiculo(vehiculo.id);
            });
            
            // Agregar botones a la celda
            accionesCell.appendChild(btnVer);
            accionesCell.appendChild(btnEditar);
            accionesCell.appendChild(btnEliminar);
            
            // Agregar celda de acciones a la fila
            row.appendChild(accionesCell);
            
            tbody.appendChild(row);
        });
    }

    formatTipoVehiculo(tipo) {
        const tipos = {
            'auto': 'Auto',
            'camion': 'Camión',
            'moto': 'Moto',
            'bicicleta': 'Bicicleta',
            'otro': 'Otro'
        };
        return tipos[tipo] || tipo;
    }

    showVehiculoModal() {
        document.getElementById('vehiculoModal').style.display = 'block';
        document.getElementById('modalTitle').textContent = 'Nuevo Vehículo';
        document.getElementById('vehiculoForm').reset();
                // En showVehiculoModal, agrega:
        delete document.getElementById('vehiculoForm').dataset.editingId;
        document.getElementById('patente').readOnly = false;
    }

    hideModal() {
        document.getElementById('vehiculoModal').style.display = 'none';
    }

    // Manejar envío de vehículo COMPLETO
    async handleVehiculoSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const vehiculoData = {
            patente: formData.get('patente'),
            tipo_vehiculo: formData.get('tipo_vehiculo'),
            marca: formData.get('marca'),
            modelo: formData.get('modelo'),
            color: formData.get('color'),
            numero_motor: formData.get('numero_motor'),
            numero_chasis: formData.get('numero_chasis'),
            propietario_dni: formData.get('propietario_dni') || null,
            cedula_verde: formData.get('cedula_verde') || null,
            titulo_registro: formData.get('titulo_registro') || null,
            seguro_activo: formData.get('seguro_activo') === 'true',
            compañia_seguro: formData.get('compañia_seguro') || null
        };

        console.log('📝 Datos del vehículo:', vehiculoData); // Para debug

        try {
            const editingId = document.getElementById('vehiculoForm').dataset.editingId;
            
            if (editingId) {
                // Modo edición - PUT request
                const data = await this.apiCall(`/vehiculos/${editingId}`, 'PUT', vehiculoData);
                this.showMessage('Vehículo actualizado exitosamente', 'success');
                
                // Limpiar el ID de edición
                delete document.getElementById('vehiculoForm').dataset.editingId;
            } else {
                // Modo creación - POST request
                const data = await this.apiCall('/vehiculos', 'POST', vehiculoData);
                this.showMessage('Vehículo creado exitosamente', 'success');
            }
            
            this.hideModal();
            this.loadVehiculos();
            this.loadDashboardData();
            
        }catch (error) {
            console.error('Error creando vehículo:', error);
            this.showMessage(error.message || 'Error al crear vehículo', 'error');
        }
    }
    // Buscar vehículos con filtros - VERSIÓN CORREGIDA
    async buscarVehiculos() {
        const patente = document.getElementById('filterPatente').value.trim();
        const marca = document.getElementById('filterMarca').value.trim();
        const propietario = document.getElementById('filterPropietario').value.trim();

        console.log('🔍 Filtros de búsqueda:', { patente, marca, propietario });

        // Si no hay filtros, cargar todos
        if (!patente && !marca && !propietario) {
            this.loadVehiculos();
            return;
        }

        try {
            // Construir query string con todos los filtros
            const params = new URLSearchParams();
            if (patente) params.append('patente', patente);
            if (marca) params.append('marca', marca);
            if (propietario) params.append('propietario', propietario);

            const queryString = params.toString();
            console.log('🌐 Query string:', queryString);

            const data = await this.apiCall(`/vehiculos/search?${queryString}`);
            console.log('✅ Resultados de búsqueda:', data.data);
            
            this.renderVehiculosTable(data.data || []);
            
            if (data.data && data.data.length === 0) {
                this.showMessage('No se encontraron vehículos con los filtros aplicados', 'info');
            }
        } catch (error) {
            console.error('❌ Error buscando vehículos:', error);
            this.showMessage('Error al buscar vehículos', 'error');
            this.loadVehiculos(); // Recargar todos en caso de error
        }
    }   

    // Limpiar filtros de vehículos
    limpiarFiltrosVehiculos() {
        document.getElementById('filterPatente').value = '';
        document.getElementById('filterMarca').value = '';
        document.getElementById('filterPropietario').value = '';
        this.loadVehiculos();
    }

    // Función para ver detalles de vehículo
    async verVehiculo(id) {
        try {
            console.log('🔍 Obteniendo detalles del vehículo:', id);
            
            const data = await this.apiCall(`/vehiculos/${id}`);
            const vehiculo = data.data;
            
            this.mostrarDetalleVehiculo(vehiculo);
            
        } catch (error) {
            console.error('Error obteniendo detalles del vehículo:', error);
            this.showMessage('Error al cargar detalles del vehículo', 'error');
        }
    }
    // Mostrar detalles en modal
    mostrarDetalleVehiculo(vehiculo) {
        const content = document.getElementById('detalleVehiculoContent');
        
        content.innerHTML = `
            <div class="detalle-section">
                <h4>Información Básica</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Patente</div>
                        <div class="detalle-value"><strong>${vehiculo.patente}</strong></div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Tipo de Vehículo</div>
                        <div class="detalle-value">${this.formatTipoVehiculo(vehiculo.tipo_vehiculo)}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Marca</div>
                        <div class="detalle-value">${vehiculo.marca || 'No especificado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Modelo</div>
                        <div class="detalle-value">${vehiculo.modelo || 'No especificado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Color</div>
                        <div class="detalle-value">${vehiculo.color || 'No especificado'}</div>
                    </div>
                </div>
            </div>

            <div class="detalle-section">
                <h4>Identificación Técnica</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Número de Motor</div>
                        <div class="detalle-value">${vehiculo.numero_motor || 'No especificado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Número de Chasis</div>
                        <div class="detalle-value">${vehiculo.numero_chasis || 'No especificado'}</div>
                    </div>
                </div>
            </div>

            <div class="detalle-section">
                <h4>Propietario</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Nombre</div>
                        <div class="detalle-value">${vehiculo.propietario_nombre || 'No asignado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">DNI</div>
                        <div class="detalle-value">${vehiculo.propietario_dni || 'No especificado'}</div>
                    </div>
                </div>
            </div>

            <div class="detalle-section">
                <h4>Documentación</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Cédula Verde</div>
                        <div class="detalle-value">${vehiculo.cedula_verde || 'No registrada'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Título de Registro</div>
                        <div class="detalle-value">${vehiculo.titulo_registro || 'No registrado'}</div>
                    </div>
                </div>
            </div>

            <div class="detalle-section">
                <h4>Seguro</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Seguro Activo</div>
                        <div class="detalle-value">${vehiculo.seguro_activo ? '✅ Sí' : '❌ No'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Compañía de Seguro</div>
                        <div class="detalle-value">${vehiculo.compañia_seguro || 'No especificada'}</div>
                    </div>
                </div>
            </div>

            <div class="detalle-section">
                <h4>Información del Sistema</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Fecha de Registro</div>
                        <div class="detalle-value">${this.formatFecha(vehiculo.fecha_registro)}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">ID del Vehículo</div>
                        <div class="detalle-value">#${vehiculo.id}</div>
                    </div>
                </div>
            </div>
        `;
        
        this.mostrarModal('detalleVehiculoModal');
    }
        // Editar vehículo - VERSIÓN FUNCIONAL
    async editarVehiculo(id) {
        try {
            console.log('✏️ Cargando datos del vehículo para editar ID:', id);
            
            // Obtener datos del vehículo
            const data = await this.apiCall(`/vehiculos/${id}`);
            const vehiculo = data.data;
            
            console.log('📋 Datos del vehículo a editar:', vehiculo);
            
            // Llenar el formulario con los datos existentes
            this.llenarFormularioEdicion(vehiculo);
            
            // Mostrar mensaje informativo
            this.showMessage(`Modo edición: Vehículo ${vehiculo.patente}. Complete los campos y guarde los cambios.`, 'info');
            
        } catch (error) {
            console.error('❌ Error cargando vehículo para editar:', error);
            this.showMessage('Error al cargar datos del vehículo para editar', 'error');
        }
    }

    // Llenar formulario para edición
    llenarFormularioEdicion(vehiculo) {
        // Mostrar el modal de vehículo
        this.mostrarModal('vehiculoModal');
        
        // Cambiar título del modal
        document.getElementById('modalTitle').textContent = `Editar Vehículo: ${vehiculo.patente}`;
        
        // Llenar campos del formulario
        document.getElementById('patente').value = vehiculo.patente || '';
        document.getElementById('tipo_vehiculo').value = vehiculo.tipo_vehiculo || '';
        document.getElementById('marca').value = vehiculo.marca || '';
        document.getElementById('modelo').value = vehiculo.modelo || '';
        document.getElementById('color').value = vehiculo.color || '';
        document.getElementById('numero_motor').value = vehiculo.numero_motor || '';
        document.getElementById('numero_chasis').value = vehiculo.numero_chasis || '';
        document.getElementById('cedula_verde').value = vehiculo.cedula_verde || '';
        document.getElementById('titulo_registro').value = vehiculo.titulo_registro || '';
        document.getElementById('propietario_dni').value = vehiculo.propietario_dni || '';
        document.getElementById('seguro_activo').value = vehiculo.seguro_activo ? 'true' : 'false';
        document.getElementById('compañia_seguro').value = vehiculo.compañia_seguro || '';
        
        // Guardar el ID del vehículo que se está editando
        document.getElementById('vehiculoForm').dataset.editingId = vehiculo.id;
        
        // Hacer la patente de solo lectura durante la edición
        document.getElementById('patente').readOnly = true;
    }
    // Eliminar vehículo
    // Eliminar vehículo - VERSIÓN FUNCIONAL
    async eliminarVehiculo(id) {
        try {
            console.log('🗑️ Iniciando eliminación del vehículo ID:', id);
            
            // Buscar información del vehículo para el mensaje de confirmación
            const vehiculosData = await this.apiCall('/vehiculos');
            const vehiculo = vehiculosData.data.find(v => v.id === id);
            
            if (!vehiculo) {
                this.showMessage('Vehículo no encontrado', 'error');
                return;
            }

            // Mostrar confirmación
            const confirmar = confirm(`¿Estás seguro de que deseas eliminar el vehículo con patente "${vehiculo.patente}"?\n\nEsta acción no se puede deshacer.`);
            
            if (!confirmar) {
                console.log('❌ Eliminación cancelada por el usuario');
                return;
            }

            console.log('✅ Usuario confirmó eliminación, procediendo...');
            
            // Realizar eliminación
            const resultado = await this.apiCall(`/vehiculos/${id}`, 'DELETE');
            
            console.log('✅ Vehículo eliminado exitosamente:', resultado);
            this.showMessage(`Vehículo ${vehiculo.patente} eliminado exitosamente`, 'success');
            
            // Recargar la lista
            this.loadVehiculos();
            this.loadDashboardData();
            
        } catch (error) {
            console.error('❌ Error eliminando vehículo:', error);
            
            if (error.message.includes('infracción') || error.message.includes('infracciones')) {
                this.showMessage(`No se puede eliminar el vehículo: ${error.message}`, 'error');
            } else {
                this.showMessage('Error al eliminar el vehículo: ' + error.message, 'error');
            }
        }
    }

    // Confirmar eliminación de vehículo
    async confirmarEliminacionVehiculo(id) {
        const confirmarBtn = document.getElementById('confirmarEliminarBtn');
        const originalText = confirmarBtn.textContent;
        
        try {
            // Deshabilitar botón y mostrar carga
            confirmarBtn.disabled = true;
            confirmarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
            
            // TODO: Implementar endpoint DELETE en el backend
            // Por ahora mostramos un mensaje de que está en desarrollo
            this.showMessage('Función de eliminación en desarrollo. Por ahora, los vehículos no se pueden eliminar.', 'info');
            
            // Cerrar modal
            this.ocultarModal('confirmarEliminarModal');
            
            // Recargar la tabla (en una implementación real, eliminaríamos el vehículo)
            // await this.apiCall(`/vehiculos/${id}`, 'DELETE');
            // this.loadVehiculos();
            // this.showMessage('Vehículo eliminado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error eliminando vehículo:', error);
            this.showMessage('Error al eliminar vehículo', 'error');
        } finally {
            // Restaurar botón
            confirmarBtn.disabled = false;
            confirmarBtn.textContent = originalText;
        }
    }
        // Helper: Obtener vehículo de la tabla por ID
    obtenerVehiculoDeTabla(id) {
        // Esta es una implementación simple - en una app real buscaríamos en los datos cargados
        const filas = document.querySelectorAll('#vehiculosTableBody tr');
        
        for (let fila of filas) {
            const botonVer = fila.querySelector('button[title="Ver detalles"]');
            if (botonVer && botonVer.onclick) {
                const onclickStr = botonVer.onclick.toString();
                const match = onclickStr.match(/app\.verVehiculo\((\d+)\)/);
                if (match && match[1] == id) {
                    const celdas = fila.querySelectorAll('td');
                    return {
                        id: id,
                        patente: celdas[0].textContent.trim(),
                        tipo_vehiculo: celdas[1].textContent.trim(),
                        marca: celdas[2].textContent.trim(),
                        // ... otros campos que necesites
                    };
                }
            }
        }
        return null;
    }

    // Helper: Mostrar modal
    mostrarModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    // Helper: Ocultar modal
    ocultarModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }


    async apiCall(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        };

        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.apiBase}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error en la petición');
        }

        return data;
    }

    showMessage(message, type) {
        const messageEl = document.getElementById('loginMessage');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';

        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
    formatFecha(fechaString) {
        if (!fechaString) return '-';
        
        try {
            const fecha = new Date(fechaString);
            
            // Verificar si la fecha es válida
            if (isNaN(fecha.getTime())) {
                console.warn('Fecha inválida:', fechaString);
                return '-';
            }
            
            return fecha.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formateando fecha:', error, 'Fecha original:', fechaString);
            return '-';
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new SistemaTransito();
    window.app = app; // Hacerla global para los onclick
});
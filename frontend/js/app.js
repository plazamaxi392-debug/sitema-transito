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
        document.getElementById('nuevoPropietarioBtn').addEventListener('click', () => this.showPropietarioModal());
        document.getElementById('propietarioForm').addEventListener('submit', (e) => this.handlePropietarioSubmit(e));
        document.getElementById('buscarPropietariosBtn').addEventListener('click', () => this.buscarPropietarios());
        document.getElementById('limpiarFiltrosPropietariosBtn').addEventListener('click', () => this.limpiarFiltrosPropietarios());
        document.getElementById('nuevaInfraccionBtn').addEventListener('click', () => this.showInfraccionModal());
        document.getElementById('infraccionForm').addEventListener('submit', (e) => this.handleInfraccionSubmit(e));
        document.getElementById('buscarInfraccionesBtn').addEventListener('click', () => this.buscarInfracciones());
        document.getElementById('limpiarFiltrosInfraccionesBtn').addEventListener('click', () => this.limpiarFiltrosInfracciones());
        document.getElementById('generarReporteGeneralBtn').addEventListener('click', () => this.loadReporteGeneral());
        document.getElementById('buscarPorPatenteBtn').addEventListener('click', () => this.consultarPorPatente());
        document.getElementById('buscarPorActaBtn').addEventListener('click', () => this.consultarPorActa());
        document.getElementById('buscarPorDNIBtn').addEventListener('click', () => this.consultarPorDNI());
        document.getElementById('generarReporteFechaBtn').addEventListener('click', () => this.generarReporteFecha());
        document.getElementById('generarReporteVehiculosBtn').addEventListener('click', () => this.generarReporteVehiculos());
        document.getElementById('actualizarDashboardBtn').addEventListener('click', () => this.loadDashboardCompleto());
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
        if (tabId === 'dashboard-tab') {
            this.loadDashboardCompleto();
        }
        if (tabId === 'vehiculos-tab') {
            this.loadVehiculos();
        }
        if (tabId === 'propietarios-tab') {
        this.loadPropietarios();
        }
        if (tabId === 'infracciones-tab') {
            this.loadInfracciones();
            this.loadEstadisticasInfracciones();
        }
        if (tabId === 'reportes-tab') {
            this.loadReporteGeneral();
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
    async loadPropietarios() {
        try {
            console.log('🔄 Cargando propietarios...');
            const data = await this.apiCall('/propietarios');
            console.log('✅ Propietarios cargados:', data.data.length);
            this.renderPropietariosTable(data.data || []);
        } catch (error) {
            console.error('❌ Error cargando propietarios:', error);
            this.showMessage('Error al cargar propietarios', 'error');
        }
    }

    // Renderizar tabla de propietarios
    renderPropietariosTable(propietarios) {
        const tbody = document.getElementById('propietariosTableBody');
        tbody.innerHTML = '';

        if (propietarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-user-tie" style="font-size: 2rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                        <p>No hay propietarios registrados</p>
                    </td>
                </tr>
            `;
            return;
        }

        propietarios.forEach(propietario => {
            const row = document.createElement('tr');
            
            const fechaRegistro = this.formatFecha(propietario.fecha_registro);
            
            row.innerHTML = `
                <td><strong>${propietario.dni}</strong></td>
                <td>${propietario.nombre}</td>
                <td>${propietario.carnet_conducir || '-'}</td>
                <td>${propietario.telefono || '-'}</td>
                <td>${propietario.email || '-'}</td>
                <td><span class="badge">${propietario.total_vehiculos || 0}</span></td>
                <td>${fechaRegistro}</td>
            `;
            
            // Celda de acciones
            const accionesCell = document.createElement('td');
            
            // Botón Ver
            const btnVer = document.createElement('button');
            btnVer.className = 'btn-icon';
            btnVer.title = 'Ver detalles';
            btnVer.innerHTML = '<i class="fas fa-eye"></i>';
            btnVer.addEventListener('click', () => this.verPropietario(propietario.id));
            
            // Botón Editar
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-icon';
            btnEditar.title = 'Editar';
            btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
            btnEditar.addEventListener('click', () => this.editarPropietario(propietario.id));
            
            // Botón Eliminar
            const btnEliminar = document.createElement('button');
            btnEliminar.className = 'btn-icon btn-danger';
            btnEliminar.title = 'Eliminar';
            btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
            btnEliminar.addEventListener('click', () => this.eliminarPropietario(propietario.id));
            
            accionesCell.appendChild(btnVer);
            accionesCell.appendChild(btnEditar);
            accionesCell.appendChild(btnEliminar);
            row.appendChild(accionesCell);
            
            tbody.appendChild(row);
        });
    }

    // Mostrar modal de propietario
    showPropietarioModal() {
        this.mostrarModal('propietarioModal');
        document.getElementById('modalPropietarioTitle').textContent = 'Nuevo Propietario';
        document.getElementById('propietarioForm').reset();
        delete document.getElementById('propietarioForm').dataset.editingId;
    }

    // Manejar envío de propietario
    async handlePropietarioSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const propietarioData = {
            dni: formData.get('dni'),
            nombre: formData.get('nombre'),
            carnet_conducir: formData.get('carnet_conducir'),
            direccion: formData.get('direccion'),
            telefono: formData.get('telefono'),
            email: formData.get('email'),
            fecha_nacimiento: formData.get('fecha_nacimiento')
        };

        console.log('📝 Datos del propietario:', propietarioData);

        try {
            const editingId = document.getElementById('propietarioForm').dataset.editingId;
            
            if (editingId) {
                // Modo edición
                await this.apiCall(`/propietarios/${editingId}`, 'PUT', propietarioData);
                this.showMessage('Propietario actualizado exitosamente', 'success');
            } else {
                // Modo creación
                await this.apiCall('/propietarios', 'POST', propietarioData);
                this.showMessage('Propietario creado exitosamente', 'success');
            }
            
            this.ocultarModal('propietarioModal');
            this.loadPropietarios();
            
        } catch (error) {
            console.error('Error guardando propietario:', error);
            this.showMessage('Error al guardar propietario: ' + error.message, 'error');
        }
    }

    // Buscar propietarios
    async buscarPropietarios() {
        const dni = document.getElementById('filterDNI').value.trim();
        const nombre = document.getElementById('filterNombre').value.trim();
        const carnet = document.getElementById('filterCarnet').value.trim();

        console.log('🔍 Buscando propietarios con filtros:', { dni, nombre, carnet });

        // Si no hay filtros, cargar todos
        if (!dni && !nombre && !carnet) {
            this.loadPropietarios();
            return;
        }

        try {
            const params = new URLSearchParams();
            if (dni) params.append('dni', dni);
            if (nombre) params.append('nombre', nombre);
            if (carnet) params.append('carnet', carnet);

            const data = await this.apiCall(`/propietarios/search?${params}`);
            console.log('✅ Resultados búsqueda:', data.data.length);
            
            this.renderPropietariosTable(data.data);
            
            if (data.data.length === 0) {
                this.showMessage('No se encontraron propietarios con los filtros aplicados', 'info');
            }
        } catch (error) {
            console.error('❌ Error buscando propietarios:', error);
            this.showMessage('Error al buscar propietarios', 'error');
        }
    }

    // Limpiar filtros de propietarios
    limpiarFiltrosPropietarios() {
        document.getElementById('filterDNI').value = '';
        document.getElementById('filterNombre').value = '';
        document.getElementById('filterCarnet').value = '';
        this.loadPropietarios();
    }

    // Ver detalles de propietario
    async verPropietario(id) {
        try {
            console.log('🔍 Ver detalles del propietario ID:', id);
            const data = await this.apiCall(`/propietarios/${id}`);
            this.mostrarDetallePropietario(data.data);
        } catch (error) {
            console.error('Error:', error);
            this.showMessage('Error al cargar detalles del propietario', 'error');
        }
    }

    // Mostrar detalles del propietario en modal
    mostrarDetallePropietario(propietario) {
        const content = document.getElementById('detallePropietarioContent');
        
        let vehiculosHTML = '';
        if (propietario.vehiculos && propietario.vehiculos.length > 0) {
            vehiculosHTML = `
                <div class="detalle-section">
                    <h4>Vehículos del Propietario</h4>
                    <div class="vehiculos-list">
                        ${propietario.vehiculos.map(vehiculo => `
                            <div class="vehiculo-item">
                                <div class="vehiculo-info">
                                    <div>
                                        <span class="vehiculo-patente">${vehiculo.patente}</span>
                                        <span class="vehiculo-modelo"> - ${vehiculo.marca} ${vehiculo.modelo}</span>
                                    </div>
                                    <button class="btn-icon" onclick="app.verVehiculo(${vehiculo.id})">
                                        <i class="fas fa-external-link-alt"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            vehiculosHTML = `
                <div class="detalle-section">
                    <h4>Vehículos del Propietario</h4>
                    <p style="text-align: center; color: var(--text-light);">
                        <i class="fas fa-car" style="font-size: 2rem; margin-bottom: 1rem;"></i><br>
                        No tiene vehículos registrados
                    </p>
                </div>
            `;
        }
        
        content.innerHTML = `
            <div class="detalle-section">
                <h4>Información Personal</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">DNI</div>
                        <div class="detalle-value"><strong>${propietario.dni}</strong></div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Nombre Completo</div>
                        <div class="detalle-value">${propietario.nombre}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Carnet de Conducir</div>
                        <div class="detalle-value">${propietario.carnet_conducir || 'No registrado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Fecha de Nacimiento</div>
                        <div class="detalle-value">${propietario.fecha_nacimiento ? this.formatFecha(propietario.fecha_nacimiento) : 'No registrada'}</div>
                    </div>
                </div>
            </div>

            <div class="detalle-section">
                <h4>Información de Contacto</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Teléfono</div>
                        <div class="detalle-value">${propietario.telefono || 'No registrado'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">Email</div>
                        <div class="detalle-value">${propietario.email || 'No registrado'}</div>
                    </div>
                    <div class="detalle-item" style="grid-column: span 2;">
                        <div class="detalle-label">Dirección</div>
                        <div class="detalle-value">${propietario.direccion || 'No registrada'}</div>
                    </div>
                </div>
            </div>

            ${vehiculosHTML}

            <div class="detalle-section">
                <h4>Información del Sistema</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <div class="detalle-label">Fecha de Registro</div>
                        <div class="detalle-value">${this.formatFecha(propietario.fecha_registro)}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">ID del Propietario</div>
                        <div class="detalle-value">#${propietario.id}</div>
                    </div>
                </div>
            </div>
        `;
        
        this.mostrarModal('detallePropietarioModal');
    }

    // Editar propietario
    async editarPropietario(id) {
        try {
            console.log('✏️ Editando propietario ID:', id);
            const data = await this.apiCall(`/propietarios/${id}`);
            const propietario = data.data;
            
            this.llenarFormularioPropietarioEdicion(propietario);
            this.showMessage(`Editando propietario ${propietario.nombre}`, 'info');
            
        } catch (error) {
            console.error('❌ Error editando propietario:', error);
            this.showMessage('Error al cargar propietario para editar', 'error');
        }
    }

    // Llenar formulario para edición de propietario
    llenarFormularioPropietarioEdicion(propietario) {
        this.mostrarModal('propietarioModal');
        document.getElementById('modalPropietarioTitle').textContent = `Editar Propietario: ${propietario.nombre}`;
        
        document.getElementById('dni').value = propietario.dni;
        document.getElementById('nombre').value = propietario.nombre;
        document.getElementById('carnet_conducir').value = propietario.carnet_conducir || '';
        document.getElementById('direccion').value = propietario.direccion || '';
        document.getElementById('telefono').value = propietario.telefono || '';
        document.getElementById('email').value = propietario.email || '';
        document.getElementById('fecha_nacimiento').value = propietario.fecha_nacimiento || '';
        
        document.getElementById('propietarioForm').dataset.editingId = propietario.id;
    }

    // Eliminar propietario
    async eliminarPropietario(id) {
        try {
            console.log('🗑️ Eliminando propietario ID:', id);
            
            const confirmar = confirm('¿Estás seguro de que deseas eliminar este propietario?\n\nEsta acción no se puede deshacer.');
            
            if (!confirmar) {
                console.log('❌ Eliminación cancelada');
                return;
            }

            await this.apiCall(`/propietarios/${id}`, 'DELETE');
            
            console.log('✅ Propietario eliminado');
            this.showMessage('Propietario eliminado exitosamente', 'success');
            
            this.loadPropietarios();
            
        } catch (error) {
            console.error('❌ Error eliminando propietario:', error);
            this.showMessage('Error al eliminar propietario: ' + error.message, 'error');
        }
    }
    // Cargar infracciones
async loadInfracciones() {
    try {
        console.log('🔄 Cargando infracciones...');
        const data = await this.apiCall('/infracciones');
        console.log('✅ Infracciones cargadas:', data.data.length);
        this.renderInfraccionesTable(data.data || []);
    } catch (error) {
        console.error('❌ Error cargando infracciones:', error);
        this.showMessage('Error al cargar infracciones', 'error');
    }
}

// Renderizar tabla de infracciones
renderInfraccionesTable(infracciones) {
    const tbody = document.getElementById('infraccionesTableBody');
    tbody.innerHTML = '';

    if (infracciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-clipboard-list" style="font-size: 2rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                    <p>No hay infracciones registradas</p>
                </td>
            </tr>
        `;
        return;
    }

    infracciones.forEach(infraccion => {
        const row = document.createElement('tr');
        
        const fechaInfraccion = this.formatFecha(infraccion.fecha_infraccion);
        const fechaRegistro = this.formatFecha(infraccion.fecha_registro);
        
        // Determinar clase CSS según el estado
        let estadoClass = '';
        switch(infraccion.estado) {
            case 'pendiente': estadoClass = 'badge badge-warning'; break;
            case 'pagada': estadoClass = 'badge badge-success'; break;
            case 'recurrida': estadoClass = 'badge badge-info'; break;
            default: estadoClass = 'badge';
        }
        
        row.innerHTML = `
            <td><strong>${infraccion.numero_acta}</strong></td>
            <td>${fechaInfraccion}</td>
            <td>
                ${infraccion.patente ? `
                    <strong>${infraccion.patente}</strong><br>
                    <small>${infraccion.marca} ${infraccion.modelo} - ${infraccion.color}</small>
                ` : 'Vehículo no encontrado'}
            </td>
            <td>${infraccion.conductor_nombre}</td>
            <td>${infraccion.conductor_dni || '-'}</td>
            <td title="${infraccion.motivo}">${this.truncateText(infraccion.motivo, 50)}</td>
            <td title="${infraccion.lugar_infraccion || ''}">${this.truncateText(infraccion.lugar_infraccion, 30) || '-'}</td>
            <td><span class="${estadoClass}">${this.formatEstadoInfraccion(infraccion.estado)}</span></td>
            <td>${infraccion.usuario_nombre || 'Sistema'}</td>
            <td>${fechaRegistro}</td>
        `;
        
        // Celda de acciones
        const accionesCell = document.createElement('td');
        
        // Botón Ver
        const btnVer = document.createElement('button');
        btnVer.className = 'btn-icon';
        btnVer.title = 'Ver detalles';
        btnVer.innerHTML = '<i class="fas fa-eye"></i>';
        btnVer.addEventListener('click', () => this.verInfraccion(infraccion.id));
        
        // Botón Editar (solo admin)
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn-icon';
        btnEditar.title = 'Editar';
        btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
        if (this.user.rol === 'admin') {
            btnEditar.addEventListener('click', () => this.editarInfraccion(infraccion.id));
        } else {
            btnEditar.disabled = true;
            btnEditar.title = 'Solo administradores pueden editar';
        }
        
        // Botón Eliminar (solo admin)
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn-icon btn-danger';
        btnEliminar.title = 'Eliminar';
        btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
        if (this.user.rol === 'admin') {
            btnEliminar.addEventListener('click', () => this.eliminarInfraccion(infraccion.id));
        } else {
            btnEliminar.disabled = true;
            btnEliminar.title = 'Solo administradores pueden eliminar';
        }
        
        accionesCell.appendChild(btnVer);
        accionesCell.appendChild(btnEditar);
        accionesCell.appendChild(btnEliminar);
        row.appendChild(accionesCell);
        
        tbody.appendChild(row);
    });
}

// Formatear estado de infracción
formatEstadoInfraccion(estado) {
    const estados = {
        'pendiente': 'Pendiente',
        'pagada': 'Pagada',
        'recurrida': 'Recurrida'
    };
    return estados[estado] || estado;
}

// Mostrar modal de infracción
async showInfraccionModal() {
    await this.cargarVehiculosEnSelect();
    this.mostrarModal('infraccionModal');
    document.getElementById('modalInfraccionTitle').textContent = 'Nueva Infracción';
    document.getElementById('infraccionForm').reset();
    
    // Establecer fecha y hora actual por defecto
    const now = new Date();
    const localDateTime = now.toISOString().slice(0, 16);
    document.getElementById('fecha_infraccion').value = localDateTime;
    
    delete document.getElementById('infraccionForm').dataset.editingId;
}

// Cargar vehículos en el select
async cargarVehiculosEnSelect() {
    try {
        const select = document.getElementById('vehiculo_id');
        select.innerHTML = '<option value="">Seleccionar vehículo...</option>';
        
        const data = await this.apiCall('/vehiculos');
        data.data.forEach(vehiculo => {
            const option = document.createElement('option');
            option.value = vehiculo.id;
            option.textContent = `${vehiculo.patente} - ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.color})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando vehículos:', error);
    }
}

// Manejar envío de infracción
async handleInfraccionSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const infraccionData = {
        numero_acta: formData.get('numero_acta'),
        vehiculo_id: formData.get('vehiculo_id'),
        conductor_dni: formData.get('conductor_dni'),
        conductor_nombre: formData.get('conductor_nombre'),
        motivo: formData.get('motivo'),
        fecha_infraccion: formData.get('fecha_infraccion'),
        lugar_infraccion: formData.get('lugar_infraccion'),
        estado: formData.get('estado'),
        observaciones: formData.get('observaciones')
    };

    console.log('📝 Datos de la infracción:', infraccionData);

    try {
        const editingId = document.getElementById('infraccionForm').dataset.editingId;
        
        if (editingId) {
            // Modo edición
            await this.apiCall(`/infracciones/${editingId}`, 'PUT', infraccionData);
            this.showMessage('Infracción actualizada exitosamente', 'success');
        } else {
            // Modo creación
            await this.apiCall('/infracciones', 'POST', infraccionData);
            this.showMessage('Infracción creada exitosamente', 'success');
        }
        
        this.ocultarModal('infraccionModal');
        this.loadInfracciones();
        this.loadEstadisticasInfracciones();
        
    } catch (error) {
        console.error('Error guardando infracción:', error);
        this.showMessage('Error al guardar infracción: ' + error.message, 'error');
    }
}

// Buscar infracciones
async buscarInfracciones() {
    const numero_acta = document.getElementById('filterNumeroActa').value.trim();
    const patente = document.getElementById('filterPatenteInfraccion').value.trim();
    const conductor_dni = document.getElementById('filterConductorDNI').value.trim();
    const estado = document.getElementById('filterEstado').value;
    const fecha_desde = document.getElementById('filterFechaDesde').value;
    const fecha_hasta = document.getElementById('filterFechaHasta').value;

    console.log('🔍 Buscando infracciones con filtros:', { 
        numero_acta, patente, conductor_dni, estado, fecha_desde, fecha_hasta 
    });

    // Si no hay filtros, cargar todos
    if (!numero_acta && !patente && !conductor_dni && !estado && !fecha_desde && !fecha_hasta) {
        this.loadInfracciones();
        return;
    }

    try {
        const params = new URLSearchParams();
        if (numero_acta) params.append('numero_acta', numero_acta);
        if (patente) params.append('patente', patente);
        if (conductor_dni) params.append('conductor_dni', conductor_dni);
        if (estado) params.append('estado', estado);
        if (fecha_desde) params.append('fecha_desde', fecha_desde);
        if (fecha_hasta) params.append('fecha_hasta', fecha_hasta);

        const data = await this.apiCall(`/infracciones/search?${params}`);
        console.log('✅ Resultados búsqueda:', data.data.length);
        
        this.renderInfraccionesTable(data.data);
        
        if (data.data.length === 0) {
            this.showMessage('No se encontraron infracciones con los filtros aplicados', 'info');
        }
    } catch (error) {
        console.error('❌ Error buscando infracciones:', error);
        this.showMessage('Error al buscar infracciones', 'error');
    }
}

// Limpiar filtros de infracciones
limpiarFiltrosInfracciones() {
    document.getElementById('filterNumeroActa').value = '';
    document.getElementById('filterPatenteInfraccion').value = '';
    document.getElementById('filterConductorDNI').value = '';
    document.getElementById('filterEstado').value = '';
    document.getElementById('filterFechaDesde').value = '';
    document.getElementById('filterFechaHasta').value = '';
    this.loadInfracciones();
}

// Ver detalles de infracción
async verInfraccion(id) {
    try {
        console.log('🔍 Ver detalles de infracción ID:', id);
        const data = await this.apiCall(`/infracciones/${id}`);
        this.mostrarDetalleInfraccion(data.data);
    } catch (error) {
        console.error('Error:', error);
        this.showMessage('Error al cargar detalles de la infracción', 'error');
    }
}

// Mostrar detalles de infracción en modal
mostrarDetalleInfraccion(infraccion) {
    const content = document.getElementById('detalleInfraccionContent');
    
    const fechaInfraccion = this.formatFecha(infraccion.fecha_infraccion);
    const fechaRegistro = this.formatFecha(infraccion.fecha_registro);
    
    content.innerHTML = `
        <div class="detalle-section">
            <h4>Información del Acta</h4>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <div class="detalle-label">Número de Acta</div>
                    <div class="detalle-value"><strong>${infraccion.numero_acta}</strong></div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Estado</div>
                    <div class="detalle-value"><span class="badge">${this.formatEstadoInfraccion(infraccion.estado)}</span></div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Fecha de Infracción</div>
                    <div class="detalle-value">${fechaInfraccion}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Lugar</div>
                    <div class="detalle-value">${infraccion.lugar_infraccion || 'No especificado'}</div>
                </div>
            </div>
        </div>

        <div class="detalle-section">
            <h4>Vehículo Involucrado</h4>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <div class="detalle-label">Patente</div>
                    <div class="detalle-value">${infraccion.patente || 'No especificado'}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Marca y Modelo</div>
                    <div class="detalle-value">${infraccion.marca || ''} ${infraccion.modelo || ''}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Color</div>
                    <div class="detalle-value">${infraccion.color || 'No especificado'}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Tipo de Vehículo</div>
                    <div class="detalle-value">${this.formatTipoVehiculo(infraccion.tipo_vehiculo)}</div>
                </div>
            </div>
        </div>

        <div class="detalle-section">
            <h4>Información del Conductor</h4>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <div class="detalle-label">Nombre</div>
                    <div class="detalle-value">${infraccion.conductor_nombre}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">DNI</div>
                    <div class="detalle-value">${infraccion.conductor_dni || 'No especificado'}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Teléfono</div>
                    <div class="detalle-value">${infraccion.propietario_telefono || 'No especificado'}</div>
                </div>
            </div>
        </div>

        <div class="detalle-section">
            <h4>Detalles de la Infracción</h4>
            <div class="detalle-item" style="grid-column: span 2;">
                <div class="detalle-label">Motivo</div>
                <div class="detalle-value" style="white-space: pre-wrap;">${infraccion.motivo}</div>
            </div>
            ${infraccion.observaciones ? `
            <div class="detalle-item" style="grid-column: span 2;">
                <div class="detalle-label">Observaciones</div>
                <div class="detalle-value" style="white-space: pre-wrap;">${infraccion.observaciones}</div>
            </div>
            ` : ''}
        </div>

        <div class="detalle-section">
            <h4>Información del Sistema</h4>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <div class="detalle-label">Agente Registrador</div>
                    <div class="detalle-value">${infraccion.usuario_nombre || 'Sistema'}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">Fecha de Registro</div>
                    <div class="detalle-value">${fechaRegistro}</div>
                </div>
                <div class="detalle-item">
                    <div class="detalle-label">ID de Infracción</div>
                    <div class="detalle-value">#${infraccion.id}</div>
                </div>
            </div>
        </div>
    `;
    
    this.mostrarModal('detalleInfraccionModal');
}

// Cargar estadísticas de infracciones
async loadEstadisticasInfracciones() {
    try {
        const data = await this.apiCall('/infracciones/estadisticas');
        const stats = data.data.resumen;
        
        document.getElementById('totalInfracciones').textContent = stats.total || 0;
        document.getElementById('infraccionesPendientes').textContent = stats.pendientes || 0;
        document.getElementById('infraccionesPagadas').textContent = stats.pagadas || 0;
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Helper para truncar texto
truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Editar infracción
async editarInfraccion(id) {
    try {
        console.log('✏️ Editando infracción ID:', id);
        const data = await this.apiCall(`/infracciones/${id}`);
        const infraccion = data.data;
        
        await this.cargarVehiculosEnSelect();
        this.mostrarModal('infraccionModal');
        document.getElementById('modalInfraccionTitle').textContent = `Editar Infracción: ${infraccion.numero_acta}`;
        
        // Llenar formulario con datos existentes
        document.getElementById('numero_acta').value = infraccion.numero_acta;
        document.getElementById('vehiculo_id').value = infraccion.vehiculo_id;
        document.getElementById('conductor_dni').value = infraccion.conductor_dni || '';
        document.getElementById('conductor_nombre').value = infraccion.conductor_nombre;
        document.getElementById('motivo').value = infraccion.motivo;
        document.getElementById('lugar_infraccion').value = infraccion.lugar_infraccion || '';
        document.getElementById('estado').value = infraccion.estado;
        document.getElementById('observaciones').value = infraccion.observaciones || '';
        
        // Formatear fecha para el input datetime-local
        if (infraccion.fecha_infraccion) {
            const fecha = new Date(infraccion.fecha_infraccion);
            const localDateTime = fecha.toISOString().slice(0, 16);
            document.getElementById('fecha_infraccion').value = localDateTime;
        }
        
        document.getElementById('infraccionForm').dataset.editingId = infraccion.id;
        
    } catch (error) {
        console.error('❌ Error editando infracción:', error);
        this.showMessage('Error al cargar infracción para editar', 'error');
    }
}

// Eliminar infracción
async eliminarInfraccion(id) {
    try {
        console.log('🗑️ Eliminando infracción ID:', id);
        
        // Buscar información de la infracción para el mensaje de confirmación
        const data = await this.apiCall(`/infracciones/${id}`);
        const infraccion = data.data;
        
        const confirmar = confirm(`¿Estás seguro de que deseas eliminar la infracción "${infraccion.numero_acta}"?\n\nEsta acción no se puede deshacer.`);
        
        if (!confirmar) {
            console.log('❌ Eliminación cancelada por el usuario');
            return;
        }

        await this.apiCall(`/infracciones/${id}`, 'DELETE');
        
        console.log('✅ Infracción eliminada');
        this.showMessage('Infracción eliminada exitosamente', 'success');
        
        this.loadInfracciones();
        this.loadEstadisticasInfracciones();
        
    } catch (error) {
        console.error('❌ Error eliminando infracción:', error);
        this.showMessage('Error al eliminar infracción: ' + error.message, 'error');
    }
}
// Cargar reporte general
async loadReporteGeneral() {
    try {
        console.log('📈 Cargando reporte general...');
        const data = await this.apiCall('/reportes/general');
        const stats = data.data.estadisticas;
        
        // Actualizar estadísticas
        document.getElementById('totalVehiculosReporte').textContent = stats.total_vehiculos || 0;
        document.getElementById('totalPropietariosReporte').textContent = stats.total_propietarios || 0;
        document.getElementById('totalInfraccionesReporte').textContent = stats.total_infracciones || 0;
        document.getElementById('totalUsuariosReporte').textContent = stats.total_usuarios || 0;
        
        console.log('✅ Reporte general cargado');
        
    } catch (error) {
        console.error('❌ Error cargando reporte general:', error);
        this.showMessage('Error al cargar reporte general', 'error');
    }
}
// Consultar por patente
async consultarPorPatente() {
    const patente = document.getElementById('consultaPatente').value.trim();
    
    if (!patente) {
        this.showMessage('Ingrese una patente para buscar', 'error');
        return;
    }

    try {
        console.log('🔍 Consultando por patente:', patente);
        const resultado = document.getElementById('resultadoPatente');
        resultado.innerHTML = '<div style="text-align: center; padding: 1rem;"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';
        
        const data = await this.apiCall(`/reportes/consulta-patente?patente=${encodeURIComponent(patente)}`);
        
        if (!data.data.vehiculo) {
            resultado.innerHTML = `
                <div class="sin-resultados">
                    <i class="fas fa-car"></i>
                    <p>No se encontró ningún vehículo con la patente "${patente}"</p>
                </div>
            `;
            return;
        }

        const vehiculo = data.data.vehiculo;
        const infracciones = data.data.infractions || [];

        let infraccionesHTML = '';
        if (infracciones.length > 0) {
            infraccionesHTML = `
                <div style="margin-top: 1rem;">
                    <h6 style="margin-bottom: 0.5rem; color: var(--danger);">Infracciones (${infracciones.length}):</h6>
                    ${infracciones.map(infraccion => `
                        <div class="resultado-card" style="border-left-color: var(--danger);">
                            <h6>Acta: ${infraccion.numero_acta}</h6>
                            <p><strong>Fecha:</strong> ${this.formatFecha(infraccion.fecha_infraccion)}</p>
                            <p><strong>Motivo:</strong> ${this.truncateText(infraccion.motivo, 100)}</p>
                            <p><strong>Estado:</strong> <span class="badge">${this.formatEstadoInfraccion(infraccion.estado)}</span></p>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            infraccionesHTML = `
                <div style="margin-top: 1rem; text-align: center; color: var(--success);">
                    <i class="fas fa-check-circle"></i>
                    <p>No tiene infracciones registradas</p>
                </div>
            `;
        }

        resultado.innerHTML = `
            <div class="resultado-card">
                <h5>Vehículo Encontrado</h5>
                <p><strong>Patente:</strong> ${vehiculo.patente}</p>
                <p><strong>Marca/Modelo:</strong> ${vehiculo.marca} ${vehiculo.modelo}</p>
                <p><strong>Color:</strong> ${vehiculo.color}</p>
                <p><strong>Tipo:</strong> ${this.formatTipoVehiculo(vehiculo.tipo_vehiculo)}</p>
                ${vehiculo.propietario_nombre ? `
                    <p><strong>Propietario:</strong> ${vehiculo.propietario_nombre} (DNI: ${vehiculo.propietario_dni})</p>
                ` : '<p><strong>Propietario:</strong> No asignado</p>'}
                ${infraccionesHTML}
            </div>
        `;

    } catch (error) {
        console.error('❌ Error consultando por patente:', error);
        document.getElementById('resultadoPatente').innerHTML = `
            <div class="sin-resultados" style="color: var(--danger);">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al buscar patente</p>
            </div>
        `;
    }
}

// Consultar por acta
async consultarPorActa() {
    const numero_acta = document.getElementById('consultaActa').value.trim();
    
    if (!numero_acta) {
        this.showMessage('Ingrese un número de acta para buscar', 'error');
        return;
    }

    try {
        console.log('🔍 Consultando por acta:', numero_acta);
        const resultado = document.getElementById('resultadoActa');
        resultado.innerHTML = '<div style="text-align: center; padding: 1rem;"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';
        
        const data = await this.apiCall(`/reportes/consulta-acta?numero_acta=${encodeURIComponent(numero_acta)}`);
        
        if (data.data.length === 0) {
            resultado.innerHTML = `
                <div class="sin-resultados">
                    <i class="fas fa-file-alt"></i>
                    <p>No se encontró ninguna infracción con el acta "${numero_acta}"</p>
                </div>
            `;
            return;
        }

        const infracciones = data.data;
        
        resultado.innerHTML = infracciones.map(infraccion => `
            <div class="resultado-card">
                <h5>Infracción: ${infraccion.numero_acta}</h5>
                <p><strong>Fecha:</strong> ${this.formatFecha(infraccion.fecha_infraccion)}</p>
                <p><strong>Vehículo:</strong> ${infraccion.patente} - ${infraccion.marca} ${infraccion.modelo}</p>
                <p><strong>Conductor:</strong> ${infraccion.conductor_nombre} (DNI: ${infraccion.conductor_dni || 'No especificado'})</p>
                <p><strong>Motivo:</strong> ${infraccion.motivo}</p>
                <p><strong>Estado:</strong> <span class="badge">${this.formatEstadoInfraccion(infraccion.estado)}</span></p>
                <p><strong>Lugar:</strong> ${infraccion.lugar_infraccion || 'No especificado'}</p>
                <p><strong>Agente:</strong> ${infraccion.agente || 'Sistema'}</p>
            </div>
        `).join('');

    } catch (error) {
        console.error('❌ Error consultando por acta:', error);
        document.getElementById('resultadoActa').innerHTML = `
            <div class="sin-resultados" style="color: var(--danger);">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al buscar acta</p>
            </div>
        `;
    }
}

// Consultar por DNI
async consultarPorDNI() {
    const dni = document.getElementById('consultaDNI').value.trim();
    
    if (!dni) {
        this.showMessage('Ingrese un DNI para buscar', 'error');
        return;
    }

    try {
        console.log('🔍 Consultando por DNI:', dni);
        const resultado = document.getElementById('resultadoDNI');
        resultado.innerHTML = '<div style="text-align: center; padding: 1rem;"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';
        
        const data = await this.apiCall(`/reportes/consulta-dni?dni=${encodeURIComponent(dni)}`);
        
        const propietario = data.data.propietario;
        const infraccionesConductor = data.data.infractions_como_conductor || [];

        let propietarioHTML = '';
        if (propietario) {
            propietarioHTML = `
                <div class="resultado-card">
                    <h5>Información del Propietario</h5>
                    <p><strong>Nombre:</strong> ${propietario.nombre}</p>
                    <p><strong>DNI:</strong> ${propietario.dni}</p>
                    <p><strong>Teléfono:</strong> ${propietario.telefono || 'No especificado'}</p>
                    <p><strong>Email:</strong> ${propietario.email || 'No especificado'}</p>
                    <p><strong>Vehículos registrados:</strong> ${propietario.total_vehiculos || 0}</p>
                </div>
            `;
        } else {
            propietarioHTML = `
                <div class="resultado-card" style="border-left-color: var(--warning);">
                    <h5>Información del Propietario</h5>
                    <p>No se encontró como propietario registrado</p>
                </div>
            `;
        }

        let infraccionesHTML = '';
        if (infraccionesConductor.length > 0) {
            infraccionesHTML = `
                <div class="resultado-card" style="border-left-color: var(--danger);">
                    <h5>Infracciones como Conductor (${infraccionesConductor.length})</h5>
                    ${infraccionesConductor.map(infraccion => `
                        <div style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border);">
                            <p><strong>Acta:</strong> ${infraccion.numero_acta}</p>
                            <p><strong>Fecha:</strong> ${this.formatFecha(infraccion.fecha_infraccion)}</p>
                            <p><strong>Vehículo:</strong> ${infraccion.patente}</p>
                            <p><strong>Motivo:</strong> ${this.truncateText(infraccion.motivo, 80)}</p>
                            <p><strong>Estado:</strong> <span class="badge">${this.formatEstadoInfraccion(infraccion.estado)}</span></p>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            infraccionesHTML = `
                <div class="resultado-card" style="border-left-color: var(--success);">
                    <h5>Infracciones como Conductor</h5>
                    <p>No tiene infracciones registradas como conductor</p>
                </div>
            `;
        }

        resultado.innerHTML = propietarioHTML + infraccionesHTML;

    } catch (error) {
        console.error('❌ Error consultando por DNI:', error);
        document.getElementById('resultadoDNI').innerHTML = `
            <div class="sin-resultados" style="color: var(--danger);">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al buscar DNI</p>
            </div>
        `;
    }
}

// Generar reporte por fecha
async generarReporteFecha() {
    const fechaDesde = document.getElementById('reporteFechaDesde').value;
    const fechaHasta = document.getElementById('reporteFechaHasta').value;
    const agrupacion = document.getElementById('reporteAgrupacion').value;

    if (!fechaDesde || !fechaHasta) {
        this.showMessage('Seleccione un rango de fechas', 'error');
        return;
    }

    try {
        console.log('📊 Generando reporte por fecha:', { fechaDesde, fechaHasta, agrupacion });
        const resultado = document.getElementById('resultadoReporteFecha');
        resultado.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Generando reporte...</div>';
        
        const params = new URLSearchParams({
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta,
            agrupacion: agrupacion
        });

        const data = await this.apiCall(`/reportes/infracciones-fecha?${params}`);
        
        if (data.data.resumen.length === 0) {
            resultado.innerHTML = `
                <div class="sin-resultados">
                    <i class="fas fa-chart-bar"></i>
                    <p>No hay infracciones en el período seleccionado</p>
                </div>
            `;
            return;
        }

        const totalGeneral = data.data.totalGeneral;
        const resumen = data.data.resumen;

        let tablaHTML = `
            <div style="margin-bottom: 1rem; padding: 1rem; background: var(--success); color: white; border-radius: 6px;">
                <strong>Total de infracciones en el período: ${totalGeneral}</strong>
            </div>
            <table class="resultado-table">
                <thead>
                    <tr>
                        <th>Período</th>
                        <th>Total</th>
                        <th>Pendientes</th>
                        <th>Pagadas</th>
                        <th>Recurridas</th>
                    </tr>
                </thead>
                <tbody>
        `;

        resumen.forEach(item => {
            tablaHTML += `
                <tr>
                    <td><strong>${this.formatearPeriodo(item.periodo, agrupacion)}</strong></td>
                    <td>${item.total}</td>
                    <td><span style="color: var(--warning);">${item.pendientes}</span></td>
                    <td><span style="color: var(--success);">${item.pagadas}</span></td>
                    <td><span style="color: var(--primary);">${item.recurridas}</span></td>
                </tr>
            `;
        });

        tablaHTML += `
                </tbody>
            </table>
        `;

        resultado.innerHTML = tablaHTML;

    } catch (error) {
        console.error('❌ Error generando reporte por fecha:', error);
        document.getElementById('resultadoReporteFecha').innerHTML = `
            <div class="sin-resultados" style="color: var(--danger);">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al generar reporte</p>
            </div>
        `;
    }
}

// Generar reporte de vehículos con más infracciones
async generarReporteVehiculos() {
    const limite = document.getElementById('reporteLimite').value;

    try {
        console.log('🚗 Generando reporte de vehículos con más infracciones');
        const resultado = document.getElementById('resultadoReporteVehiculos');
        resultado.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Generando reporte...</div>';
        
        const data = await this.apiCall(`/reportes/vehiculos-mas-infracciones?limite=${limite}`);
        
        if (data.data.length === 0) {
            resultado.innerHTML = `
                <div class="sin-resultados">
                    <i class="fas fa-car"></i>
                    <p>No hay vehículos con infracciones registradas</p>
                </div>
            `;
            return;
        }

        let tablaHTML = `
            <table class="resultado-table">
                <thead>
                    <tr>
                        <th>Patente</th>
                        <th>Vehículo</th>
                        <th>Propietario</th>
                        <th>Total Infracciones</th>
                        <th>Pendientes</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.data.forEach(vehiculo => {
            tablaHTML += `
                <tr>
                    <td><strong>${vehiculo.patente}</strong></td>
                    <td>${vehiculo.marca} ${vehiculo.modelo}<br><small>${vehiculo.color} - ${this.formatTipoVehiculo(vehiculo.tipo_vehiculo)}</small></td>
                    <td>${vehiculo.propietario_nombre || 'No asignado'}<br><small>DNI: ${vehiculo.propietario_dni || 'N/A'}</small></td>
                    <td><strong style="color: var(--danger);">${vehiculo.total_infracciones}</strong></td>
                    <td><span style="color: var(--warning);">${vehiculo.pendientes}</span></td>
                </tr>
            `;
        });

        tablaHTML += `
                </tbody>
            </table>
        `;

        resultado.innerHTML = tablaHTML;

    } catch (error) {
        console.error('❌ Error generando reporte de vehículos:', error);
        document.getElementById('resultadoReporteVehiculos').innerHTML = `
            <div class="sin-resultados" style="color: var(--danger);">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al generar reporte</p>
            </div>
        `;
    }
}

// Helper para formatear período según agrupación
formatearPeriodo(periodo, agrupacion) {
    switch (agrupacion) {
        case 'mes':
            const [year, month] = periodo.split('-');
            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            return `${meses[parseInt(month) - 1]} ${year}`;
        case 'semana':
            const [yearSemana, semana] = periodo.split('-');
            return `Semana ${semana} del ${yearSemana}`;
        default: // día
            return new Date(periodo).toLocaleDateString('es-ES');
    }
}
// Métodos para dashboard mejorado:

// Cargar dashboard completo
async loadDashboardCompleto() {
    try {
        console.log('📊 Cargando dashboard completo...');
        
        // Cargar estadísticas
        await this.loadDashboardStats();
        
        // Cargar actividad reciente
        await this.loadActividadReciente();
        
        console.log('✅ Dashboard cargado completamente');
        
    } catch (error) {
        console.error('❌ Error cargando dashboard:', error);
        this.showMessage('Error al cargar el dashboard', 'error');
    }
}

// Cargar estadísticas del dashboard
async loadDashboardStats() {
    try {
        const data = await this.apiCall('/dashboard/stats');
        const stats = data.data;
        
        // Actualizar estadísticas principales
        document.getElementById('totalVehiculos').textContent = stats.estadisticas.total_vehiculos || 0;
        document.getElementById('totalPropietarios').textContent = stats.estadisticas.total_propietarios || 0;
        document.getElementById('totalInfracciones').textContent = stats.estadisticas.total_infracciones || 0;
        document.getElementById('infraccionesPendientes').textContent = stats.estadisticas.infracciones_pendientes || 0;
        document.getElementById('infraccionesPagadas').textContent = stats.estadisticas.infracciones_pagadas || 0;
        document.getElementById('totalUsuarios').textContent = stats.estadisticas.total_usuarios || 0;
        document.getElementById('infraccionesHoy').textContent = stats.estadisticas.infracciones_hoy || 0;
        
        // Renderizar gráficos
        this.renderChartTipoVehiculo(stats.por_tipo_vehiculo);
        this.renderChartEstadoInfracciones(stats.por_estado);
        this.renderChartTendencia(stats.por_dia);
        this.renderListaAgentes(stats.agentes_activos);
        this.renderVehiculosProblematicos(stats.vehiculos_problematicos);
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
    }
}

// Cargar actividad reciente
async loadActividadReciente() {
    try {
        const data = await this.apiCall('/dashboard/actividad');
        
        this.renderInfraccionesRecientes(data.data.infractions);
        this.renderVehiculosRecientes(data.data.vehiculos);
        
    } catch (error) {
        console.error('❌ Error cargando actividad reciente:', error);
    }
}

// Renderizar gráfico de tipo de vehículo
renderChartTipoVehiculo(datos) {
    const container = document.getElementById('chartTipoVehiculo');
    
    if (!datos || datos.length === 0) {
        container.innerHTML = '<div class="sin-resultados">No hay datos</div>';
        return;
    }
    
    const total = datos.reduce((sum, item) => sum + item.cantidad, 0);
    
    let html = '<div class="chart-bars">';
    
    datos.forEach(item => {
        const porcentaje = total > 0 ? (item.cantidad / total) * 100 : 0;
        const altura = Math.max(porcentaje * 1.5, 20); // Mínimo 20px de altura
        
        html += `
            <div class="chart-bar" style="height: ${altura}px; background: ${this.getColorForTipo(item.tipo_vehiculo)}" 
                 title="${this.formatTipoVehiculo(item.tipo_vehiculo)}: ${item.cantidad} (${porcentaje.toFixed(1)}%)">
                <div class="chart-bar-value">${item.cantidad}</div>
                <div class="chart-bar-label">${this.formatTipoVehiculo(item.tipo_vehiculo).substring(0, 3)}</div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Renderizar gráfico de estado de infracciones
renderChartEstadoInfracciones(datos) {
    const container = document.getElementById('chartEstadoInfracciones');
    
    if (!datos || datos.length === 0) {
        container.innerHTML = '<div class="sin-resultados">No hay datos</div>';
        return;
    }
    
    let html = '<div class="chart-bars">';
    
    datos.forEach(item => {
        const color = this.getColorForEstado(item.estado);
        const altura = Math.max(item.cantidad * 2, 20); // Escala de 2px por infracción
        
        html += `
            <div class="chart-bar" style="height: ${altura}px; background: ${color}" 
                 title="${this.formatEstadoInfraccion(item.estado)}: ${item.cantidad}">
                <div class="chart-bar-value">${item.cantidad}</div>
                <div class="chart-bar-label">${this.formatEstadoInfraccion(item.estado).substring(0, 3)}</div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Renderizar gráfico de tendencia
renderChartTendencia(datos) {
    const container = document.getElementById('chartTendencia');
    
    if (!datos || datos.length === 0) {
        container.innerHTML = '<div class="sin-resultados">No hay datos</div>';
        return;
    }
    
    // Completar días faltantes para tener 7 días consecutivos
    const fechasCompletas = this.completarDiasFaltantes(datos, 7);
    const maxCantidad = Math.max(...fechasCompletas.map(d => d.cantidad));
    
    let html = '<div class="chart-bars">';
    
    fechasCompletas.forEach(item => {
        const porcentaje = maxCantidad > 0 ? (item.cantidad / maxCantidad) * 100 : 0;
        const altura = Math.max(porcentaje * 1.5, 10);
        const fecha = new Date(item.fecha);
        const dia = fecha.getDate();
        const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });
        
        html += `
            <div class="chart-bar" style="height: ${altura}px; background: var(--primary)" 
                 title="${fecha.toLocaleDateString('es-ES')}: ${item.cantidad} infracciones">
                <div class="chart-bar-value">${item.cantidad}</div>
                <div class="chart-bar-label">${dia}/${mes}</div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Completar días faltantes en el dataset
completarDiasFaltantes(datos, dias) {
    const resultado = [];
    const hoy = new Date();
    
    for (let i = dias - 1; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(hoy.getDate() - i);
        const fechaStr = fecha.toISOString().split('T')[0];
        
        const datoExistente = datos.find(d => d.fecha === fechaStr);
        resultado.push({
            fecha: fechaStr,
            cantidad: datoExistente ? datoExistente.cantidad : 0
        });
    }
    
    return resultado;
}

// Renderizar lista de agentes activos
renderListaAgentes(agentes) {
    const container = document.getElementById('listaAgentes');
    
    if (!agentes || agentes.length === 0) {
        container.innerHTML = '<div class="sin-resultados">No hay agentes activos</div>';
        return;
    }
    
    let html = '';
    agentes.forEach(agente => {
        html += `
            <div class="agente-item">
                <span class="agente-nombre">${agente.nombre_completo}</span>
                <span class="agente-contador">${agente.infracciones_registradas}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Renderizar infracciones recientes
renderInfraccionesRecientes(infracciones) {
    const container = document.getElementById('listaInfraccionesRecientes');
    
    if (!infracciones || infracciones.length === 0) {
        container.innerHTML = '<div class="sin-resultados">No hay infracciones recientes</div>';
        return;
    }
    
    let html = '';
    infracciones.forEach(infraccion => {
        const fecha = this.formatFecha(infraccion.fecha_infraccion);
        const estadoClass = this.getClassForEstado(infraccion.estado);
        
        html += `
            <div class="actividad-item ${estadoClass}" onclick="app.verInfraccion(${infraccion.id})" style="cursor: pointer;">
                <div class="actividad-header">
                    <span class="actividad-titulo">${infraccion.numero_acta}</span>
                    <span class="actividad-fecha">${fecha}</span>
                </div>
                <div class="actividad-descripcion">${this.truncateText(infraccion.motivo, 60)}</div>
                <div class="actividad-meta">
                    <span>${infraccion.patente}</span>
                    <span>${infraccion.agente}</span>
                    <span class="badge">${this.formatEstadoInfraccion(infraccion.estado)}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Renderizar vehículos recientes
renderVehiculosRecientes(vehiculos) {
    const container = document.getElementById('listaVehiculosRecientes');
    
    if (!vehiculos || vehiculos.length === 0) {
        container.innerHTML = '<div class="sin-resultados">No hay vehículos recientes</div>';
        return;
    }
    
    let html = '';
    vehiculos.forEach(vehiculo => {
        const fecha = this.formatFecha(vehiculo.fecha_registro);
        
        html += `
            <div class="actividad-item" onclick="app.verVehiculo(${vehiculo.id})" style="cursor: pointer;">
                <div class="actividad-header">
                    <span class="actividad-titulo">${vehiculo.patente}</span>
                    <span class="actividad-fecha">${fecha}</span>
                </div>
                <div class="actividad-descripcion">${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.color}</div>
                <div class="actividad-meta">
                    <span>${this.formatTipoVehiculo(vehiculo.tipo_vehiculo)}</span>
                    <span>${vehiculo.propietario_nombre || 'Sin propietario'}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Renderizar vehículos problemáticos
renderVehiculosProblematicos(vehiculos) {
    const container = document.getElementById('listaVehiculosProblematicos');
    
    if (!vehiculos || vehiculos.length === 0) {
        container.innerHTML = '<div class="sin-resultados">No hay vehículos con infracciones</div>';
        return;
    }
    
    let html = '';
    vehiculos.forEach(vehiculo => {
        html += `
            <div class="actividad-item danger" onclick="app.verVehiculo(${vehiculo.id})" style="cursor: pointer;">
                <div class="actividad-header">
                    <span class="actividad-titulo">${vehiculo.patente}</span>
                    <span class="agente-contador">${vehiculo.total_infracciones}</span>
                </div>
                <div class="actividad-descripcion">${vehiculo.marca} ${vehiculo.modelo}</div>
                <div class="actividad-meta">
                    <span>${vehiculo.total_infracciones} infracciones</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Helper: Obtener color según tipo de vehículo
getColorForTipo(tipo) {
    const colores = {
        'auto': '#3B82F6',
        'camion': '#EF4444',
        'moto': '#10B981',
        'bicicleta': '#8B5CF6',
        'otro': '#6B7280'
    };
    return colores[tipo] || '#6B7280';
}

// Helper: Obtener color según estado
getColorForEstado(estado) {
    const colores = {
        'pendiente': '#F59E0B',
        'pagada': '#10B981',
        'recurrida': '#3B82F6'
    };
    return colores[estado] || '#6B7280';
}

// Helper: Obtener clase CSS según estado
getClassForEstado(estado) {
    const clases = {
        'pendiente': 'warning',
        'pagada': 'success',
        'recurrida': 'info'
    };
    return clases[estado] || '';
}
}
// Inicializar la aplicación cuando el DOM esté listo
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new SistemaTransito();
    window.app = app; // Hacerla global para los onclick
});
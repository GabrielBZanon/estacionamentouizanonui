class EstacionamentoUI {
    constructor(api) {
        this.api = api;
        this.init();
    }

    async init() {
        this.showLoading(true);
        try {
            await Promise.all([
                this.carregarVeiculos(),
                this.carregarEstadias()
            ]);
            this.configurarEventos();
        } catch (error) {
            this.mostrarErro('Erro ao inicializar a aplicação');
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'flex' : 'none';
        }
    }

    async carregarVeiculos() {
        try {
            const veiculos = await this.api.getVeiculos();
            this.renderVeiculos(veiculos);
        } catch (error) {
            this.mostrarErro('Erro ao carregar veículos');
        }
    }

    async carregarEstadias() {
        try {
            const estadias = await this.api.getEstadias();
            this.renderEstadias(estadias);
        } catch (error) {
            this.mostrarErro('Erro ao carregar estadias');
        }
    }

    renderVeiculos(veiculos) {
        const container = document.getElementById('veiculos-list');
        if (!container) return;
        
        if (!Array.isArray(veiculos) || veiculos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>🚗 Nenhum veículo no estacionamento</p>
                </div>
            `;
            return;
        }

        container.innerHTML = veiculos.map(veiculo => `
            <div class="veiculo-item">
                <h3>${veiculo.placa || 'Placa não informada'}</h3>
                <p>Entrada: ${this.formatarData(veiculo.entrada)}</p>
                
                ${veiculo.saida ? `
                    <p>Saída: ${this.formatarData(veiculo.saida)}</p>
                    <div class="valor-info">
                        <span>Valor Hora: R$ 10,00</span>
                        <span>Total: R$ ${this.calcularTotal(veiculo)}</span>
                    </div>
                ` : `
                    <p>Status: <strong style="color: green;">Estacionado</strong></p>
                    <div class="valor-info">
                        <span>Valor Hora: R$ 10,00</span>
                        <span>Tempo: ${this.calcularTempoDecorrido(veiculo.entrada)}</span>
                    </div>
                    <button class="btn-baixa" onclick="appUI.darBaixaVeiculo('${veiculo.placa}')">
                        🚗 Dar Baixa na Saída
                    </button>
                `}
            </div>
        `).join('');
    }

    renderEstadias(estadias) {
        const container = document.getElementById('estadias-list');
        if (!container) return;
        
        if (!Array.isArray(estadias) || estadias.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📊 Nenhuma estadia registrada hoje</p>
                </div>
            `;
            return;
        }

        // Filtrar estadias de hoje
        const hoje = new Date().toLocaleDateString('pt-BR');
        const estadiasHoje = estadias.filter(estadia => 
            estadia.entrada && new Date(estadia.entrada).toLocaleDateString('pt-BR') === hoje
        );

        if (estadiasHoje.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📊 Nenhuma estadia registrada hoje</p>
                </div>
            `;
            return;
        }

        container.innerHTML = estadiasHoje.map(estadia => `
            <div class="estadia-item">
                <h3>${estadia.placa || 'Placa não informada'}</h3>
                <p>Entrada: ${this.formatarData(estadia.entrada)}</p>
                <p>Saída: ${estadia.saida ? this.formatarData(estadia.saida) : 'Em andamento'}</p>
                <div class="valor-info">
                    <span>Valor Hora: R$ 10,00</span>
                    <span>Total: R$ ${estadia.valor ? estadia.valor.toFixed(2) : '0,00'}</span>
                </div>
            </div>
        `).join('');
    }

    formatarData(dataString) {
        if (!dataString) return 'Não registrada';
        try {
            const data = new Date(dataString);
            return data.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Data inválida';
        }
    }

    calcularTotal(registro) {
        if (!registro.entrada || !registro.saida) return '0,00';
        
        try {
            const entrada = new Date(registro.entrada);
            const saida = new Date(registro.saida);
            const horas = Math.ceil((saida - entrada) / (1000 * 60 * 60));
            const total = horas * 10;
            return total.toFixed(2);
        } catch {
            return '0,00';
        }
    }

    calcularTempoDecorrido(entrada) {
        if (!entrada) return '0h 0m';
        
        try {
            const entradaDate = new Date(entrada);
            const agora = new Date();
            const diffMs = agora - entradaDate;
            
            const horas = Math.floor(diffMs / (1000 * 60 * 60));
            const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            return `${horas}h ${minutos}m`;
        } catch {
            return '0h 0m';
        }
    }

    configurarEventos() {
        // Formulário de novo veículo
        const formVeiculo = document.getElementById('form-veiculo');
        if (formVeiculo) {
            formVeiculo.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.cadastrarNovoVeiculo();
            });
        }

        // Fechar modal clicando fora
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    async cadastrarNovoVeiculo() {
        const placaInput = document.getElementById('placa');
        const placa = placaInput?.value?.toUpperCase().replace(/\s+/g, '');

        if (!placa) {
            alert('Por favor, informe a placa do veículo');
            return;
        }

        // Validar formato da placa (AAA0000 ou AAA0A00)
        const placaRegex = /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/;
        if (!placaRegex.test(placa)) {
            alert('Formato de placa inválido. Use: AAA0000 ou AAA0A00');
            return;
        }

        this.showLoading(true);
        try {
            const veiculoData = {
                placa: placa,
                entrada: new Date().toISOString()
            };

            await this.api.createVeiculo(veiculoData);
            
            // Atualizar os dados na tela
            await this.carregarVeiculos();
            await this.carregarEstadias();
            
            // Fechar modal e limpar formulário
            closeModal('novo-veiculo');
            if (placaInput) placaInput.value = '';
            
            this.mostrarNotificacao('✅ Veículo cadastrado com sucesso!', 'success');
            
        } catch (error) {
            this.mostrarNotificacao('❌ Erro ao cadastrar veículo', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async darBaixaVeiculo(placa) {
        if (!confirm(`Deseja dar baixa no veículo ${placa}?`)) {
            return;
        }

        this.showLoading(true);
        try {
            const response = await fetch(`${API_BASE}/veiculos/${placa}/saida`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao dar baixa');
            }

            const data = await response.json();
            
            // Atualizar a UI
            await this.carregarVeiculos();
            await this.carregarEstadias();
            
            this.mostrarNotificacao(
                `✅ Baixa realizada para ${placa} - Valor: R$ ${data.estadia?.valor?.toFixed(2) || '0,00'}`,
                'success'
            );
            
        } catch (error) {
            this.mostrarNotificacao(`❌ ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async gerenciarVeiculos() {
        this.showLoading(true);
        try {
            const response = await fetch(`${API_BASE}/veiculos/estacionados`);
            const veiculosEstacionados = await response.json();
            
            let modalContent = `
                <h2>🚗 Veículos Estacionados</h2>
                <div class="gestao-container">
            `;
            
            if (veiculosEstacionados.length === 0) {
                modalContent += '<p class="empty">Nenhum veículo estacionado</p>';
            } else {
                veiculosEstacionados.forEach(veiculo => {
                    modalContent += `
                        <div class="veiculo-gestao">
                            <div class="veiculo-info">
                                <strong>${veiculo.placa}</strong>
                                <p>Entrada: ${this.formatarData(veiculo.entrada)}</p>
                                <p>Tempo: ${this.calcularTempoDecorrido(veiculo.entrada)}</p>
                            </div>
                            <button class="btn-baixa" onclick="appUI.darBaixaVeiculo('${veiculo.placa}')">
                                Dar Baixa
                            </button>
                        </div>
                    `;
                });
            }
            
            modalContent += '</div>';
            
            this.mostrarModalGestao(modalContent);
        } catch (error) {
            this.mostrarNotificacao('Erro ao carregar veículos', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    mostrarModalGestao(content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <span class="close" onclick="this.parentElement.parentElement.style.display='none'">&times;</span>
                ${content}
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    mostrarNotificacao(mensagem, tipo = 'info') {
        // Criar notificação
        const notification = document.createElement('div');
        notification.className = `notification ${tipo}`;
        notification.textContent = mensagem;
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    mostrarErro(mensagem) {
        this.mostrarNotificacao(mensagem, 'error');
    }
}

// ⚡ Configuração da API
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isDevelopment 
    ? 'http://localhost:3000'
    : 'https://estacionamentogrupozanon.vercel.app';

console.log(`🌐 Conectando à API: ${API_BASE}`);

class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async handleRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
            
        } catch (error) {
            console.error(`Erro na requisição para ${endpoint}:`, error);
            throw new Error(`Falha na comunicação com a API: ${error.message}`);
        }
    }

    async getVeiculos() {
        try {
            return await this.handleRequest('/veiculos');
        } catch (error) {
            console.error('Erro ao buscar veículos:', error);
            throw error;
        }
    }

    async createVeiculo(veiculoData) {
        return this.handleRequest('/veiculos', {
            method: 'POST',
            body: JSON.stringify(veiculoData)
        });
    }

    async getEstadias() {
        try {
            return await this.handleRequest('/estadias');
        } catch (error) {
            console.error('Erro ao buscar estadias:', error);
            throw error;
        }
    }
}

// Instância global da API
const apiService = new ApiService(API_BASE);

// Funções globais
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function editarVeiculos() {
    appUI.gerenciarVeiculos();
}

function gerarRelatorio() {
    alert('📊 Relatório em desenvolvimento!');
}

// ⚡ Variável global para acesso via console
let appUI;

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', () => {
    appUI = new EstacionamentoUI(apiService);
    window.appUI = appUI;
});

// Estilos dinâmicos
const style = document.createElement('style');
style.textContent = `
    .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #6c757d;
        font-style: italic;
    }
    
    .empty-state p {
        font-size: 1.1em;
        margin-top: 10px;
    }
    
    .valor-info {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px dashed #dee2e6;
        font-weight: 600;
        color: #28a745;
    }
    
    .btn-baixa {
        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
        color: white;
        border: none;
        padding: 12px 15px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        margin-top: 10px;
        width: 100%;
        transition: transform 0.2s;
    }
    
    .btn-baixa:hover {
        transform: translateY(-2px);
        background: linear-gradient(135deg, #c82333 0%, #a71e2a 100%);
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        z-index: 10000;
        font-weight: bold;
        font-size: 14px;
    }
    
    .notification.success {
        background: #28a745;
    }
    
    .notification.error {
        background: #dc3545;
    }
    
    .notification.info {
        background: #17a2b8;
    }
    
    .gestao-container {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .veiculo-gestao {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        margin: 10px 0;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #667eea;
    }
    
    .veiculo-info {
        flex: 1;
    }
    
    .veiculo-gestao .btn-baixa {
        width: auto;
        margin: 0;
        margin-left: 15px;
    }
`;
document.head.appendChild(style);
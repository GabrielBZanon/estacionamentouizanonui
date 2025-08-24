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
                    <span>Total: R$ ${this.calcularTotal(estadia)}</span>
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
            const horas = (saida - entrada) / (1000 * 60 * 60);
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
            
            // ⚡ **ATUALIZAR OS DADOS NA TELA - ISSO É IMPORTANTE!**
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

    mostrarNotificacao(mensagem, tipo = 'info') {
        // Criar notificação
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            font-weight: bold;
            font-size: 14px;
            ${tipo === 'error' ? 'background: #dc3545;' : ''}
            ${tipo === 'success' ? 'background: #28a745;' : ''}
            ${tipo === 'info' ? 'background: #17a2b8;' : ''}
        `;
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

// Funções globais para modais
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
    alert('Funcionalidade de edição em desenvolvimento!');
}

function gerarRelatorio() {
    alert('Relatório sendo gerado...');
}

// ⚡ **VARIÁVEL GLOBAL para acesso via console**
let appUI;

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    appUI = new EstacionamentoUI(apiService);
    window.appUI = appUI; // Disponibiliza globalmente para debugging
});

// Adicionar estilos para empty-state
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
        color: #28a745 !important;
    }
`;
document.head.appendChild(style);
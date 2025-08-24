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
        document.getElementById('loading').style.display = show ? 'flex' : 'none';
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
                    <p>Status: <strong>Estacionado</strong></p>
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
            new Date(estadia.entrada).toLocaleDateString('pt-BR') === hoje
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
            
            // Recarregar dados
            await Promise.all([
                this.carregarVeiculos(),
                this.carregarEstadias()
            ]);
            
            // Fechar modal e limpar formulário
            closeModal('novo-veiculo');
            if (placaInput) placaInput.value = '';
            
            alert('Veículo cadastrado com sucesso!');
            
        } catch (error) {
            alert('Erro ao cadastrar veículo. Verifique se a placa já existe.');
        } finally {
            this.showLoading(false);
        }
    }

    mostrarErro(mensagem) {
        alert(mensagem);
    }
}

// Funções globais
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function editarVeiculos() {
    alert('Funcionalidade de edição em desenvolvimento!');
}

function gerarRelatorio() {
    alert('Relatório sendo gerado...');
    // Aqui você pode implementar a geração de relatório em PDF
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new EstacionamentoUI(apiService);
});
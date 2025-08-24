// api.js - Versão Corrigida
// Detectar automaticamente se está em desenvolvimento ou produção
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isDevelopment 
    ? 'http://localhost:3000'  // Desenvolvimento local
    : 'https://estacionamentogrupozanon.vercel.app';  // Produção

console.log(`Conectando à API: ${API_BASE}`);

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

            console.log(`Requisição: ${endpoint}`, response.status);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log(`Resposta de ${endpoint}:`, data);
                return data;
            }
            
            const textData = await response.text();
            console.log(`Resposta texto de ${endpoint}:`, textData);
            return textData;
            
        } catch (error) {
            console.error(`Erro na requisição para ${endpoint}:`, error);
            throw new Error(`Falha na comunicação com a API: ${error.message}`);
        }
    }

    // Veículos
    async getVeiculos() {
        try {
            const data = await this.handleRequest('/veiculos');
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Erro ao buscar veículos:', error);
            this.mostrarNotificacao('Erro ao carregar veículos', 'error');
            return [];
        }
    }

    async createVeiculo(veiculoData) {
        try {
            const result = await this.handleRequest('/veiculos', {
                method: 'POST',
                body: JSON.stringify(veiculoData)
            });
            this.mostrarNotificacao('Veículo cadastrado com sucesso!', 'success');
            return result;
        } catch (error) {
            this.mostrarNotificacao('Erro ao cadastrar veículo', 'error');
            throw error;
        }
    }

    async updateVeiculo(placa, veiculoData) {
        return this.handleRequest(`/veiculos/${encodeURIComponent(placa)}`, {
            method: 'PATCH',
            body: JSON.stringify(veiculoData)
        });
    }

    async deleteVeiculo(placa) {
        return this.handleRequest(`/veiculos/${encodeURIComponent(placa)}`, {
            method: 'DELETE'
        });
    }

    // Estadias
    async getEstadias() {
        try {
            const data = await this.handleRequest('/estadias');
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Erro ao buscar estadias:', error);
            this.mostrarNotificacao('Erro ao carregar estadias', 'error');
            return [];
        }
    }

    async createEstadia(estadiaData) {
        try {
            const result = await this.handleRequest('/estadias', {
                method: 'POST',
                body: JSON.stringify(estadiaData)
            });
            this.mostrarNotificacao('Estadia iniciada com sucesso!', 'success');
            return result;
        } catch (error) {
            this.mostrarNotificacao('Erro ao iniciar estadia', 'error');
            throw error;
        }
    }

    async updateEstadia(id, estadiaData) {
        return this.handleRequest(`/estadias/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(estadiaData)
        });
    }

    async finalizarEstadia(id, saidaData) {
        try {
            const result = await this.handleRequest(`/estadias/${id}/saida`, {
                method: 'PATCH',
                body: JSON.stringify({ saida: saidaData })
            });
            this.mostrarNotificacao('Estadia finalizada com sucesso!', 'success');
            return result;
        } catch (error) {
            this.mostrarNotificacao('Erro ao finalizar estadia', 'error');
            throw error;
        }
    }

    mostrarNotificacao(mensagem, tipo = 'info') {
        // Criar notificação na interface
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            font-weight: bold;
            ${tipo === 'error' ? 'background: #dc3545;' : ''}
            ${tipo === 'success' ? 'background: #28a745;' : ''}
            ${tipo === 'info' ? 'background: #17a2b8;' : ''}
        `;
        notification.textContent = mensagem;
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
}

// Instância global da API
const apiService = new ApiService(API_BASE);
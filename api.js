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

            console.log(`📡 Requisição: ${endpoint}`, response.status);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log(`📦 Resposta de ${endpoint}:`, data);
                return data;
            }
            
            const textData = await response.text();
            console.log(`📦 Resposta texto de ${endpoint}:`, textData);
            return textData;
            
        } catch (error) {
            console.error(`❌ Erro na requisição para ${endpoint}:`, error);
            throw new Error(`Falha na comunicação com a API: ${error.message}`);
        }
    }

    async getVeiculos() {
        try {
            const data = await this.handleRequest('/veiculos');
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Erro ao buscar veículos:', error);
            return [];
        }
    }

    async createVeiculo(veiculoData) {
        try {
            const result = await this.handleRequest('/veiculos', {
                method: 'POST',
                body: JSON.stringify(veiculoData)
            });
            return result;
        } catch (error) {
            console.error('Erro ao cadastrar veículo:', error);
            throw error;
        }
    }

    async getEstadias() {
        try {
            const data = await this.handleRequest('/estadias');
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Erro ao buscar estadias:', error);
            return [];
        }
    }
}

// Instância global da API
const apiService = new ApiService(API_BASE);
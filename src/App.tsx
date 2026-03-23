import React, { useState } from 'react';
import { FileText, CheckCircle, AlertTriangle, Settings, HardDrive, RefreshCw, ShieldCheck, Building, MapPin, FileDigit, ArrowLeft, Save, Tag } from 'lucide-react';

// Tipos para o nosso protótipo
type Invoice = {
  id: string;
  os_id: string;
  cliente: string;
  valor: number;
  status: 'pendente' | 'assinando' | 'emitida' | 'erro';
};

const mockInvoices: Invoice[] = [
  { id: '1', os_id: 'OS-1042', cliente: 'João Silva', valor: 450.00, status: 'pendente' },
  { id: '2', os_id: 'OS-1043', cliente: 'Maria Oliveira', valor: 1200.50, status: 'pendente' },
  { id: '3', os_id: 'OS-1044', cliente: 'Empresa XYZ Ltda', valor: 3500.00, status: 'pendente' },
];

export default function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'settings'>('dashboard');
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [agentStatus, setAgentStatus] = useState<'checking' | 'connected' | 'disconnected'>('disconnected');
  const [selectedCert, setSelectedCert] = useState<string | null>(null);

  // Simula a verificação de um agente local (WebSocket) rodando na máquina do cliente para ler o A3
  const checkLocalAgent = () => {
    setAgentStatus('checking');
    setTimeout(() => {
      // Simula que encontrou o agente local e o certificado A3 espetado na máquina
      setAgentStatus('connected');
      setSelectedCert('CN=EMPRESA EXEMPLO LTDA:12345678000199, OU=A3');
    }, 1500);
  };

  const handleEmitir = (id: string) => {
    if (agentStatus !== 'connected') {
      alert('Por favor, conecte o Agente Local de Certificado A3 primeiro.');
      return;
    }

    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'assinando' } : inv));

    // Simula o fluxo: 
    // 1. Pede o XML pro backend
    // 2. Envia pro agente local assinar com o A3
    // 3. Devolve pro backend transmitir pra SEFAZ
    setTimeout(() => {
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'emitida' } : inv));
    }, 3000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Configurações fiscais salvas com sucesso no banco de dados!');
    setActiveView('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold">MapOS - Módulo Fiscal</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span>SEFAZ: Online</span>
            </div>
            {activeView === 'dashboard' ? (
              <button 
                onClick={() => setActiveView('settings')}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2"
                title="Configurações Fiscais"
              >
                <Settings className="w-5 h-5" />
                <span className="hidden sm:inline">Configurar Dados</span>
              </button>
            ) : (
              <button 
                onClick={() => setActiveView('dashboard')}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Voltar ao Painel</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        
        {activeView === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar / Status do Certificado */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-gray-500" />
                  Certificado A3
                </h2>
                
                <div className="space-y-4">
                  <div className={`p-3 rounded-lg border ${agentStatus === 'connected' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Status do Agente Local</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${agentStatus === 'connected' ? 'bg-green-500' : agentStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-medium text-gray-700">
                        {agentStatus === 'connected' ? 'Conectado' : agentStatus === 'checking' ? 'Buscando...' : 'Desconectado'}
                      </span>
                    </div>
                  </div>

                  {selectedCert && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium uppercase tracking-wider mb-1">Certificado Detectado</p>
                      <p className="text-sm font-medium text-blue-900 truncate" title={selectedCert}>{selectedCert}</p>
                      <p className="text-xs text-blue-600 mt-1">Válido até: 12/12/2026</p>
                    </div>
                  )}

                  <button 
                    onClick={checkLocalAgent}
                    disabled={agentStatus === 'checking'}
                    className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <RefreshCw className={`w-4 h-4 ${agentStatus === 'checking' ? 'animate-spin' : ''}`} />
                    {agentStatus === 'connected' ? 'Atualizar Leitura' : 'Conectar Token A3'}
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Notas */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="font-semibold text-gray-800">Faturamento Pendente (MapOS)</h2>
                  <span className="text-sm text-gray-500">Mostrando OS finalizadas</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="p-4 font-medium">Referência</th>
                        <th className="p-4 font-medium">Cliente</th>
                        <th className="p-4 font-medium">Valor (R$)</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <span className="font-medium text-gray-900">{inv.os_id}</span>
                          </td>
                          <td className="p-4 text-gray-600">{inv.cliente}</td>
                          <td className="p-4 font-medium text-gray-900">
                            {inv.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="p-4">
                            {inv.status === 'pendente' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><AlertTriangle className="w-3.5 h-3.5" /> Pendente</span>}
                            {inv.status === 'assinando' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Assinando com A3...</span>}
                            {inv.status === 'emitida' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3.5 h-3.5" /> Emitida</span>}
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => handleEmitir(inv.id)}
                              disabled={inv.status !== 'pendente'}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                inv.status === 'pendente' 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {inv.status === 'emitida' ? 'Ver DANFE' : 'Emitir NF-e'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl mx-auto">
            <div className="p-6 border-b border-gray-100 bg-slate-50">
              <h2 className="text-xl font-semibold text-gray-800">Configurações Fiscais da Empresa</h2>
              <p className="text-sm text-gray-500 mt-1">Preencha os dados do emitente para geração do XML da NF-e/NFC-e.</p>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-8">
              
              {/* Seção: Dados da Empresa */}
              <section>
                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <Building className="w-5 h-5 text-blue-500" />
                  Dados do Emitente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                    <input type="text" defaultValue="12.345.678/0001-99" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual (IE)</label>
                    <input type="text" defaultValue="123456789" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                    <input type="text" defaultValue="Empresa Exemplo de Manutenção Ltda" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                    <input type="text" defaultValue="MapOS Tech" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                </div>
              </section>

              {/* Seção: Endereço */}
              <section>
                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  Endereço do Emitente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                    <input type="text" defaultValue="01001-000" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
                    <input type="text" defaultValue="Praça da Sé" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                    <input type="text" defaultValue="100" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                    <input type="text" defaultValue="Sé" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade / UF</label>
                    <div className="flex gap-2">
                      <input type="text" defaultValue="São Paulo" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                      <input type="text" defaultValue="SP" className="w-16 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center" required />
                    </div>
                  </div>
                </div>
              </section>

              {/* Seção: Tributação e Ambiente */}
              <section>
                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <FileDigit className="w-5 h-5 text-blue-500" />
                  Tributação e Ambiente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente da SEFAZ</label>
                    <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                      <option value="2">Homologação (Testes)</option>
                      <option value="1">Produção (Validade Jurídica)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Regime Tributário (CRT)</label>
                    <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                      <option value="1">1 - Simples Nacional</option>
                      <option value="2">2 - Simples Nacional (Excesso de sublimite)</option>
                      <option value="3">3 - Regime Normal (Lucro Presumido/Real)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Série da NF-e</label>
                    <input type="number" defaultValue="1" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Próximo Número da NF-e</label>
                    <input type="number" defaultValue="154" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                  </div>
                </div>
              </section>

              {/* Seção: Tributação Padrão de Produtos */}
              <section>
                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <Tag className="w-5 h-5 text-blue-500" />
                  Tributação Padrão de Produtos/Serviços
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CFOP (Dentro do Estado)</label>
                    <input type="text" defaultValue="5102" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Ex: 5102" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CFOP (Fora do Estado)</label>
                    <input type="text" defaultValue="6102" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Ex: 6102" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NCM Padrão</label>
                    <input type="text" defaultValue="00000000" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Ex: 85171231" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origem do Produto</label>
                    <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                      <option value="0">0 - Nacional</option>
                      <option value="1">1 - Estrangeira (Importação direta)</option>
                      <option value="2">2 - Estrangeira (Mercado interno)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CSOSN Padrão (ICMS)</label>
                    <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                      <option value="102">102 - Tributada pelo Simples Nacional sem permissão de crédito</option>
                      <option value="103">103 - Isenção do ICMS no Simples Nacional</option>
                      <option value="400">400 - Não tributada pelo Simples Nacional</option>
                      <option value="500">500 - ICMS cobrado anteriormente por ST</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CST PIS/COFINS</label>
                    <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                      <option value="49">49 - Outras Operações de Saída</option>
                      <option value="99">99 - Outras Operações</option>
                      <option value="01">01 - Operação Tributável</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  * Estes valores serão usados automaticamente caso o produto da Ordem de Serviço não tenha tributação específica cadastrada.
                </p>
              </section>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setActiveView('dashboard')}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}


# Guia de Implementação: Módulo Fiscal (NF-e/NFC-e) com Certificado A3 no MapOS

Para implementar este Módulo Fiscal com Certificado A3 no **MapOS real** (desenvolvido em PHP com o framework CodeIgniter 3), é necessário alterar o backend (PHP), o banco de dados (MySQL) e o frontend (HTML/JS).

Abaixo está o guia passo a passo da arquitetura para essa implementação no repositório oficial do MapOS.

---

## Passo 1: Banco de Dados (MySQL)

Você precisa criar as tabelas para guardar as configurações fiscais e o histórico de notas emitidas.
Acesse o seu banco de dados (via phpMyAdmin ou terminal) e execute o seguinte SQL:

```sql
-- Tabela para guardar as configurações fiscais da empresa
CREATE TABLE `configuracoes_fiscais` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ambiente` int(1) DEFAULT 2, -- 1 Produção, 2 Homologação
  `crt` int(1) DEFAULT 1, -- 1 Simples Nacional
  `serie_nfe` int(11) DEFAULT 1,
  `numero_nfe` int(11) DEFAULT 1,
  `cfop_dentro_estado` varchar(4) DEFAULT '5102',
  `cfop_fora_estado` varchar(4) DEFAULT '6102',
  `ncm_padrao` varchar(8) DEFAULT '00000000',
  `csosn_padrao` varchar(4) DEFAULT '102',
  `cst_pis_cofins` varchar(2) DEFAULT '49',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Tabela para guardar o histórico das notas emitidas
CREATE TABLE `notas_fiscais` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `os_id` int(11) NOT NULL,
  `chave_acesso` varchar(44) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pendente', -- pendente, assinando, emitida, erro
  `xml_assinado` text DEFAULT NULL,
  `recibo_sefaz` varchar(50) DEFAULT NULL,
  `data_emissao` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`os_id`) REFERENCES `os`(`idOs`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

---

## Passo 2: Instalar a Biblioteca NFePHP

O MapOS usa o Composer para gerenciar dependências. Você precisa instalar a biblioteca padrão do Brasil para gerar os XMLs da SEFAZ.

No terminal, na raiz da pasta do MapOS, rode:
```bash
composer require nfephp-org/sped-nfe
```

---

## Passo 3: Criar o Controller no CodeIgniter (PHP)

Você precisará criar um novo arquivo em `application/controllers/Fiscal.php`. Este arquivo será responsável por:
1. Pegar os dados da OS e do Emitente.
2. Montar o XML da NF-e usando a biblioteca NFePHP.
3. Devolver o XML "cru" (não assinado) para o navegador (JavaScript).

```php
<?php
// application/controllers/Fiscal.php
class Fiscal extends MY_Controller {
    
    public function __construct() {
        parent::__construct();
        $this->load->model('os_model');
        // Carregar models de emitente, clientes, etc.
    }

    // Rota que o JavaScript vai chamar para pedir o XML
    public function gerar_xml_nfe($idOs) {
        $os = $this->os_model->getById($idOs);
        $produtos = $this->os_model->getProdutos($idOs);
        // Buscar configurações fiscais do banco...

        // Aqui você usa a documentação do NFePHP para montar a string do XML
        // Exemplo simplificado:
        $nfe = new NFePHP\NFe\Make();
        $nfe->taginfNFe(...);
        $nfe->tagemit(...);
        $nfe->tagdest(...);
        
        foreach($produtos as $p) {
            $nfe->tagprod(...);
            $nfe->tagICMSSN(...); // Usando o CSOSN padrão se não tiver
        }

        $xmlCru = $nfe->getXML(); // Retorna o XML sem assinatura
        
        // Devolve pro JavaScript
        echo json_encode(['status' => true, 'xml' => base64_encode($xmlCru)]);
    }

    // Rota que o JavaScript vai chamar DEPOIS que o Agente Local assinar o XML
    public function transmitir_sefaz() {
        $xmlAssinadoBase64 = $this->input->post('xml_assinado');
        $xmlAssinado = base64_decode($xmlAssinadoBase64);

        // Aqui você usa o NFePHP para enviar o XML assinado para a SEFAZ
        // $tools = new NFePHP\NFe\Tools($configJson, $certificadoApenasParaConexaoTLS);
        // $response = $tools->sefazEnviaLote([$xmlAssinado], $idLote);

        // Salva o recibo e a chave de acesso no banco de dados
        // Retorna sucesso para a tela
    }
}
```

---

## Passo 4: O Frontend (Views e JavaScript)

No MapOS, você precisará criar a tela (View) parecida com o protótipo em React. O arquivo ficará em `application/views/fiscal/painel.php`.

O pulo do gato está no JavaScript dessa tela. Ele fará a ponte entre o PHP e o Agente Local do Certificado A3.

```javascript
// Exemplo do fluxo no JavaScript da View do MapOS

async function emitirNFe(idOs) {
    // 1. Pede o XML pro MapOS (PHP)
    const resXml = await fetch(`/index.php/fiscal/gerar_xml_nfe/${idOs}`);
    const dataXml = await resXml.json();
    const xmlCruBase64 = dataXml.xml;

    // 2. Envia o XML pro Agente Local (que está rodando no Windows do cliente) assinar com o A3
    // Geralmente agentes locais rodam um WebSocket na porta 8080 ou 9000
    try {
        const ws = new WebSocket('ws://localhost:9000');
        
        ws.onopen = () => {
            // Pede pro agente assinar
            ws.send(JSON.stringify({
                acao: 'assinar_xml',
                xml: xmlCruBase64
            }));
        };

        ws.onmessage = async (event) => {
            const respostaAgente = JSON.parse(event.data);
            
            if (respostaAgente.sucesso) {
                const xmlAssinadoBase64 = respostaAgente.xml_assinado;

                // 3. Devolve o XML assinado pro MapOS (PHP) transmitir pra SEFAZ
                const resSefaz = await fetch('/index.php/fiscal/transmitir_sefaz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `xml_assinado=${encodeURIComponent(xmlAssinadoBase64)}`
                });
                
                alert('Nota emitida com sucesso!');
            }
        };
    } catch (e) {
        alert('Agente local do Certificado A3 não encontrado rodando no seu Windows.');
    }
}
```

---

## Passo 5: O Agente Local (O Software do Windows)

Como o Certificado A3 é um hardware (pendrive/cartão), o navegador não consegue acessá-lo diretamente por questões de segurança. Você **precisa** que o cliente instale um programa no computador dele.

Você tem duas opções para o Agente Local:

### Opção A (Mais fácil, porém paga)
Usar o **Web PKI da Lacuna Software**. Eles já fornecem o agente local pronto e a biblioteca JavaScript. Você só paga uma mensalidade para usar a API deles. É o que a grande maioria dos sistemas web fazem para evitar dor de cabeça com A3.

### Opção B (Gratuita, mas exige desenvolvimento)
Criar um pequeno programa em **C# (.NET)** ou **Java** que o cliente instala no Windows.
Esse programa:
1. Fica rodando em segundo plano (na bandeja do sistema).
2. Abre um servidor WebSocket local (ex: `ws://localhost:9000`).
3. Quando recebe o XML do navegador via WebSocket, ele abre a janela do Windows pedindo a senha (PIN) do token A3.
4. Assina a tag `<infNFe>` do XML usando a biblioteca de criptografia do Windows.
5. Devolve o XML assinado pelo WebSocket para o navegador.

---

## Resumo do Desafio

Implementar emissão fiscal no MapOS é perfeitamente possível, mas o **Certificado A3** é o grande vilão de sistemas web. 

**Recomendação de Ouro:** Se você puder convencer seus clientes a usarem o **Certificado A1** (arquivo digital `.pfx`), você elimina completamente a necessidade do Agente Local e do WebSocket, fazendo tudo 100% no PHP (servidor) de forma muito mais simples, rápida e estável.

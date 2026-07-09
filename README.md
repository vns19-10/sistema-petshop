# 🐾 Pet's Hub - Sistema Operacional

## 📌 Sobre o Projeto
O Pet's Hub é uma aplicação web *Single Page Application* (SPA) desenvolvida para gerenciar o fluxo de atendimento (Banho & Tosa) de um Pet Shop. O sistema utiliza a metodologia ágil Kanban para o controle visual e em tempo real da esteira de produção.

## 🚀 Funcionalidades
- **Painel Kanban:** Gerenciamento interativo de status de serviço (Em Espera, Em Atendimento, Concluído).
- **Novo Check-in:** Formulário com validação nativa para entrada simultânea de Tutores e Pets.
- **Pets Cadastrados:** Interface de listagem com barra de pesquisa dinâmica (filtragem em tempo real).
- **Gestão de Dados (CRUD):** Edição de cadastros e exclusão segura com pop-up de confirmação customizado.

## 🛠️ Tecnologias Utilizadas (Front-end)
- **HTML5:** Estrutura semântica e acessível.
- **CSS3:** Design responsivo utilizando CSS Grid e Flexbox.
- **JavaScript (Vanilla):** Manipulação de DOM, eventos assíncronos e simulação de banco de dados temporário (LocalStorage).
- *(Em implantação: Back-end utilizando integração Headless com WordPress e MySQL)*.

---

## 📄 Relatório de Validação W3C & Qualidade
O código-fonte da interface foi submetido e aprovado nas ferramentas oficiais de validação da *World Wide Web Consortium (W3C)*, garantindo interoperabilidade e acessibilidade:

- **Análise HTML5 (Nu Html Checker):** 0 erros e 0 avisos. Validação de tags semânticas e conformidade com diretrizes de acessibilidade (WCAG) através de atributos ARIA.
- **Análise CSS3 (W3C CSS Validator):** 0 erros (Nível 3 + SVG). Separação estrita de responsabilidades, garantindo a ausência de estilização *inline* no HTML.

## 🚧 Restrições Técnicas e Soluções Adotadas
Durante o desenvolvimento da interface inicial, lidamos com os seguintes desafios de engenharia front-end:

1. **Vulnerabilidade de Injeção de Código (XSS):** - *Restrição:* Risco de injeção de scripts maliciosos através dos campos de observação livre.
   - *Solução:* Implementação da função `escaparHTML()` para sanitizar todas as entradas de dados antes da renderização na interface.

2. **Gargalo de Performance na Manipulação do DOM:** - *Restrição:* Atualizações constantes do quadro Kanban geravam reflows excessivos no navegador, comprometendo a performance.
   - *Solução:* Utilização de variáveis temporárias de concatenação de strings para processar a estrutura em memória, realizando apenas uma injeção (`innerHTML`) por coluna.

3. **Integridade Relacional no Front-end:** - *Restrição:* Dificuldade em manter o vínculo estrutural entre Cliente, Pet e Histórico de Atendimentos sem um banco de dados real.
   - *Solução:* Criação de uma lógica de Exclusão em Cascata (*Cascade Delete*) no JavaScript do Modal, garantindo que a deleção de um cadastro elimine automaticamente seus registros dependentes.
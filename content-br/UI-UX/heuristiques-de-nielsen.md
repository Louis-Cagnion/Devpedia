---
order: 5
---

# Heurísticas de usabilidade (Nielsen)

Em 1994, o pesquisador em ergonomia Jakob Nielsen formulou dez regras empíricas para avaliar se uma interface é utilizável: nem um framework teórico, nem uma checklist oficial, mas dez observações vindas da análise de centenas de interfaces falhas. Trinta anos depois, elas continuam sendo a referência mais citada da área.

| # | Heurística | O que ela exige | Exemplo concreto | Armadilha se ignorada |
|---|---|---|---|---|
| 1 | Visibilidade do status do sistema | Informar o usuário do que está acontecendo, com um retorno em prazo razoável | Uma barra de progresso durante um download, uma mensagem "Salvo" após um salvamento | O usuário não sabe se sua ação funcionou: clica várias vezes, ou desiste |
| 2 | Correspondência entre sistema e mundo real | Usar as palavras e conceitos do usuário, não o jargão interno do sistema | Um ícone de lixeira para "excluir", em vez de um código de erro técnico | O usuário precisa adivinhar ou traduzir mentalmente uma linguagem que não é a dele |
| 3 | Controle e liberdade do usuário | Prever uma "saída de emergência" clara em caso de ação disparada por engano | Um botão "Desfazer" após uma exclusão, um "Voltar" em um formulário com etapas | O usuário se sente preso em um estado do qual não consegue voltar |
| 4 | Consistência e padrões | Nunca fazer as mesmas palavras ou elementos dizerem coisas diferentes; seguir as convenções da plataforma | Um botão "Salvar" sempre no mesmo lugar de uma tela para outra | O usuário precisa reaprender a interface a cada tela em vez de reutilizar o que já sabe |
| 5 | Prevenção de erros | Projetar para impedir um problema em vez de exibir uma boa mensagem de erro depois | Deixar um botão "Enviar" desabilitado enquanto um campo obrigatório está vazio; pedir confirmação antes de uma exclusão | O usuário descobre o erro só depois de cometê-lo, às vezes tarde demais para desfazer |
| 6 | Reconhecimento em vez de lembrança | Tornar visíveis os objetos, ações e opções disponíveis, sem exigir que sejam lembrados | Um histórico de buscas recentes sugerido automaticamente | O usuário precisa reter uma informação de uma tela para outra: carga mental desnecessária |
| 7 | Flexibilidade e eficiência de uso | Oferecer atalhos para o usuário experiente, invisíveis e sem incômodo para o iniciante | Um atalho de teclado para uma ação frequente, além do botão visível | A interface permanece tão lenta para um uso diário intensivo quanto para a primeiríssima visita |
| 8 | Estética e design minimalista | Só exibir a informação realmente relevante: cada elemento supérfluo dilui os outros | Um formulário que só pede os campos estritamente necessários | Conecta-se à [hierarquia visual](/?c=ui-ux&p=hierarchie-visuelle): elementos demais anulam a hierarquia desejada |
| 9 | Ajuda no diagnóstico e recuperação de erros | Uma mensagem de erro em linguagem clara, que especifica o problema e sugere uma solução | "A senha deve ter pelo menos 8 caracteres" em vez de um simples código de erro | O usuário sabe que há um problema, mas não qual nem como resolvê-lo |
| 10 | Ajuda e documentação | Uma ajuda fácil de encontrar, centrada nas tarefas reais do usuário, se a interface não se basta sozinha | Um FAQ contextual acessível a partir da tela em questão, não apenas um manual genérico | O usuário travado precisa buscar ajuda em outro lugar (motor de busca, fórum) em vez de ali mesmo |

> **Tendência atual (2026):** essas dez regras têm trinta anos, mas voltam a ser atuais diante do cansaço do design puramente experimental: o mesmo movimento de retorno à clareza já observado para a [hierarquia visual](/?c=ui-ux&p=hierarchie-visuelle) e o [espaçamento](/?c=ui-ux&p=espacement-et-grille). Uma interface que respeita esses dez pontos permanece legível e utilizável mesmo sem seguir a tendência visual do momento.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | As 10 heurísticas de Nielsen avaliam a usabilidade de uma interface: visibilidade do status, linguagem familiar, liberdade de controle, consistência, prevenção de erros, reconhecimento em vez de lembrança, flexibilidade, minimalismo, diagnóstico de erro claro, ajuda acessível. |
| **Ferramentas utilizáveis** | Nenhuma ferramenta específica: essas heurísticas se usam como grade de releitura manual de uma interface já projetada ou em projeto. |
| **Armadilhas a evitar** | Ignorar uma dessas regras pensando que ela só se aplica a um caso particular: cada uma vem de observações repetidas em interfaces reais, não de uma preferência teórica. |
| **Boas práticas** | Reler uma maquete ou uma interface existente contra as 10 heurísticas antes de colocar em produção, anotando explicitamente onde cada uma é ou não respeitada. |

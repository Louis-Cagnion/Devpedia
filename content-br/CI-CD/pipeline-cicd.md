---
order: 1
---

# O que é um pipeline CI/CD?

Depois de enviar uma mudança para um repositório [Git](/?c=git), alguém ainda precisa reconstruir o projeto, rodar seus testes e depois implantá-lo. Feito manualmente a cada mudança, esse trabalho é lento, repetitivo, e basta esquecer uma etapa (relançar os testes, por exemplo) para deixar passar um erro. Um **pipeline CI/CD** automatiza exatamente essa sequência de etapas.

## O problema: repetir as mesmas etapas, sem nunca esquecer nenhuma

```text
Sem automação, a cada mudanca:
desenvolvedor -> reconstroi o projeto -> roda os testes manualmente -> implanta manualmente

Um esquecimento em qualquer etapa (testes nao relancados, versao errada implantada...)
passa despercebido ate que um usuario esbarre no problema em producao.
```

> **Armadilha:** confiar na disciplina humana para nunca pular uma etapa. Sob pressão de prazo, uma etapa "só dessa vez" pulada (os testes, geralmente) é justamente a que teria detectado o problema.
>
> **Boa prática:** automatizar a sequência de etapas de uma vez por todas, para que nenhuma etapa mais dependa da memória ou da disciplina de quem envia a mudança.

## Integração contínua (CI): construir e testar a cada mudança

A **integração contínua** (*Continuous Integration*, CI) reconstrói o projeto e roda seus testes automaticamente a cada mudança enviada ao repositório, antes mesmo que alguém precise pedir isso.

```text
push no repositorio -> dispara automaticamente -> construcao -> testes
                                                                     |
                                                    falha <----------+----------> sucesso
                                              (a mudanca                    (a mudanca
                                            nao e integrada,               e integrada, pronta
                                          o autor e avisado)                para a proxima etapa)
```

> **Armadilha:** ignorar um pipeline de CI que falha pensando "eu corrijo depois", e continuar empilhando mudanças em cima. Cada nova mudança passa então a se apoiar em uma base já quebrada, tornando a origem real do problema cada vez mais difícil de isolar.
>
> **Boa prática:** tratar um pipeline de CI com falha como bloqueante: corrigir antes de adicionar código novo em cima, não depois.

## Entrega contínua e implantação contínua (CD): dois níveis de automação

**CD** designa na verdade duas práticas diferentes, frequentemente confundidas:

| | Entrega contínua (*Continuous Delivery*) | Implantação contínua (*Continuous Deployment*) |
|---|---|---|
| O que é automatizado | Preparar uma versão pronta para implantar | Preparar **e** implantar em produção |
| Etapa humana restante | Um humano dispara a colocação em produção | Nenhuma: a colocação em produção é automática após um sucesso na CI |
| Controle | Mais controle antes de ir ao ar | Colocação em produção o mais rápida possível |

> **Armadilha:** confundir as duas e supor que um pipeline "CD" implanta automaticamente em produção, quando ele pode apenas preparar uma versão aguardando validação humana (entrega contínua).
>
> **Boa prática:** deixar explícito, para cada pipeline, se ele para em uma versão pronta para implantar ou se vai até a colocação em produção automática, em vez de supor uma coisa ou outra.

## O pipeline completo: uma sequência de etapas que devem ter sucesso em ordem

```text
commit -> build -> testes -> pacote -> implantacao (staging) -> implantacao (producao)
```

Cada etapa só é disparada se a anterior teve sucesso: uma falha interrompe o pipeline antes da etapa seguinte, em vez de deixar um problema passar adiante na cadeia.

> **Boa prática:** ordenar as etapas da mais rápida/barata para a mais lenta/custosa (um teste unitário antes de uma implantação completa, por exemplo): um pipeline que falha faz isso o mais cedo possível, sem desperdiçar tempo nas etapas seguintes.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um pipeline CI/CD automatiza a construção, os testes e a implantação de um projeto a cada mudança. CI constrói e testa; CD (entrega contínua ou implantação contínua, dois níveis diferentes) assume o controle até uma versão pronta para implantar, ou até implantada automaticamente. |
| **Ferramentas utilizáveis** | [Azure Pipelines](/?c=ci-cd&p=azure-devops-plateforme), [GitHub Actions](/?c=ci-cd&p=azure-pipelines-vs-github-actions), e outras plataformas equivalentes, para definir e executar essas etapas automaticamente. |
| **Armadilhas a evitar** | Pular uma etapa "só dessa vez" sob pressão de prazo. Ignorar um pipeline de CI com falha e empilhar código novo em cima. Confundir entrega contínua e implantação contínua. |
| **Boas práticas** | Automatizar a sequência de etapas para não depender mais da disciplina humana. Tratar uma falha de CI como bloqueante. Ordenar as etapas da mais rápida para a mais lenta. |

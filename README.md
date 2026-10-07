# Laboratório do voto 2026

Mapa interativo do 1º turno das eleições de 2026: voto para presidente comparado ao voto para governador, Senado e Câmara, e comparação de Flávio Bolsonaro com Jair Bolsonaro (2018 e 2022), por estado, município e zona eleitoral.

Acesse: https://lucashang07.github.io/laboratorio-voto-2026/

## Fontes

- TSE: resultados oficiais do 1º turno de 04/10/2026 (100% das seções), por município e zona.
- TSE, dados abertos: votação para presidente por município e zona, 2018 e 2022.
- IBGE: malha municipal.
- G1: apoio dos governadores eleitos (05/10/2026).

## Notas de método

- Votos do exterior excluídos em todos os anos.
- Comparações com 2018 e 2022 são feitas por município, porque as zonas eleitorais mudaram desde 2022. Boa Esperança do Norte (MT) é município novo e não tem histórico.
- Classificação dos candidatos pela coligação registrada no TSE: "campo de Lula" = coligações que incluem o PT; "esquerda" = partidos de esquerda fora dessa coligação; "não-lulista" = demais.
- Os fluxos entre candidatos são estimativas coerentes com os totais oficiais, não contagem de votos individuais.

## Apuração ao vivo (2º turno)

Página `apuracao/`: lê os arquivos públicos de divulgação do TSE (resultados.tse.jus.br) direto do navegador a cada minuto, com botão de atualização manual. Compara a evolução de cada candidato com a apuração real do 2º turno de 2022 e do 1º turno de 2026, reconstruídas a partir dos boletins de urna publicados pelo TSE (horário de recebimento de cada boletim).

O coletor em `.github/workflows/coletor-apuracao.yml` (GitHub Actions) grava o histórico da noite no branch `dados`, para que quem abrir a página no meio ou depois da apuração veja as curvas completas.

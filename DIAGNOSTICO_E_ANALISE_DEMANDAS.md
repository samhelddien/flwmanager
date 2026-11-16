# 📊 Diagnóstico e Análise de Demandas — Follow (Lagoinha Manaus)

Este relatório consolida a análise detalhada das conversas extraídas de 16 grupos de atendimento de WhatsApp entre a liderança do **Follow (Comunicação da Igreja Batista da Lagoinha Manaus)** e os ministérios locais.

---

## 1. Contexto Operacional e Estrutura da Equipe

- **Natureza da Equipe**: Ministério voluntário formado por membros que doam tempo e talentos paralelamente aos seus empregos e estudos.
- **Atendimento e Gestão**: Centralizado pelo **Manager do Follow (Sam Held)** com coordenação geral (**Dinho Neto**) e liderança criativa (**Benício**).
- **Ministérios Atendidos (16 frentes mapeadas)**:
  1. *Art Factory* (Dança, Teatro e Artes)
  2. *Carisma* (Seminário Teológico)
  3. *Champions* (Homens / Eventos esportivos)
  4. *Consolidação*
  5. *Diaconato*
  6. *Eventos*
  7. *Future* (Jovens Universitários e Projeção)
  8. *Hero* (Adolescentes)
  9. *Intercessão*
  10. *Kids* (Crianças e Start Kids)
  11. *Lagoinha Sede / Pastoral* (Cultos principais, Pr. William e Prª Joelma, avisos gerais)
  12. *Legacy* (Jovens Adultos / Casais / Conferências)
  13. *Melhor Idade* (Terceira Idade)
  14. *Pacificadores* (Segurança / Forças Policiais)
  15. *Rocket* (Juniores)
  16. *WeCare* (Ação Social e Cuidado Comunitário)

---

## 2. As 4 Áreas de Atuação e Tipos de Solicitação Recorrentes

| Área | Tipos de Demandas Mais Recorrentes Identificadas nos Chats | Detalhes & Especificidades Técnicas |
| :--- | :--- | :--- |
| **1. Design** | • **Temas de Culto / Pregação**<br>• **BGs para Telão / LED** (Louvor, Bíblia, Oferta, Final, Avisos)<br>• **Redes Sociais** (Cards Feed 1:1 e 4:5, Stories 9:16, Carrosséis)<br>• **Materiais Impressos** (Banners 2x9m, Backdrops de inscrições, lonas, stands)<br>• **Comunicação Interna** (Avatares/Cards para grupos de WhatsApp, capas app 1600x838)<br>• **Vestuário** (Artes de camisa para silk/sublimação) | • Teto rigoroso de **4 telas de pregação** (Tema + até 3 tópicos)<br>• Resolução de telão (1920x1080 Full HD)<br>• Necessidade de artes em vetor/PNG sem fundo para parceiros/patrocinadores |
| **2. Video Editing** | • **Lagoinha News** (Gravação e edição de chamadas de líderes/pastor)<br>• **Vídeos de Abertura / Loopings de Culto**<br>• **Vídeos de Homenagem** (Dia dos Avós, despedidas de obreiros)<br>• **Reels de Bastidores e Convites**<br>• **Campanhas Anuais** (Natal, Recrutamento de Voluntários) | • Dependência direta de gravação prévia nos cultos de domingo ou quinta<br>• Necessidade de roteiro prévio aprovado<br>• Prazos de pós-produção mais longos |
| **3. Fotografia** | • **Cobertura de Cultos Regulares** (Quinta 19h30, Domingo 10h e 18h)<br>• **Momentos Específicos** (Batismo, Novos Membros, Apelo, Formatura Start)<br>• **Eventos Especiais & Externos** (Corrida Alphaville, Ações WeCare, LGCY CONF, Acampamento Revival, Café de Comunhão) | • Pontualidade e alinhamento de horários (ex: concentração 5h da manhã)<br>• Localização exata (Auditório Carisma vs Nave Sede vs Estacionamento)<br>• **Privacidade**: Fotos filtradas para carrossel; não são abertos links com banco bruto por segurança de menores |
| **4. Redes Sociais** | • **Publicação e Programação no Instagram Oficial** (@lagoinhamanaus)<br>• **Storytelling em Tempo Real** (Cobertura durante cultos e conferências)<br>• **Carrosséis Devocionais** (Resumos de pregação dos cultos)<br>• **Collabs com Ministérios Locais**<br>• **Links na Bio e Adesivos em Stories** (Inscrições, Spotify) | • Calendário e horários de pico de postagem<br>• Necessidade do texto da legenda (copy) revisado com versículos e datas certas |

---

## 3. Principais Dores e Causas de Sobrecarga Encontradas

1. **Quebra da Antecedência Mínima (3 Dias)**:
   - Ministérios solicitando vídeos na terça para domingo, quando as gravações dependiam do domingo anterior.
   - Gráficas cobrando lonas e backdrops com urgência por falta de planejamento prévio.
2. **Excesso de Telas em Temas de Pregação**:
   - Preletores e líderes enviando esboços com 4 a 6 tópicos extensos.
   - *Regra oficial*: **Tema Principal + 2 tópicos (3 telas - recomendado)** ou **Tema Principal + 3 tópicos (4 telas - máximo)**.
3. **Briefings Falhos e Vaivém de Mensagens**:
   - Áudios longos sem dados claros de data, horário, local (Nave vs Auditório Carisma) e dimensões.
4. **Respeito ao Voluntariado**:
   - Equipes cobrando os voluntários como se fossem funcionários em regime comercial.

---

## 4. Requisitos Implementados no Formulário

- **Trava de Data**: Bloqueio estrito de datas com menos de **3 dias de antecedência**.
- **Seletor de Área Especializado**: Campos dedicados para Design, Vídeo, Fotografia e Redes Sociais.
- **Construtor Inteligente de Telas de Culto**: Validador dinâmico que impede mais de 3 tópicos (teto de 4 telas) e mostra preview em tempo real.
- **Gerador de Briefing Pronto para WhatsApp**: Permite que o líder copie ou envie diretamente a solicitação formatada para o grupo de WhatsApp oficial.

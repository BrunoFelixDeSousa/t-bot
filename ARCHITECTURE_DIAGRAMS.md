# 🏗️ Arquitetura do Sistema - Diagramas Mermaid

## 📋 Índice
1. [Arquitetura Geral](#1-arquitetura-geral)
2. [Fluxo de Usuário](#2-fluxo-de-usuário)
3. [Sistema de Jogos](#3-sistema-de-jogos)
4. [Banco de Dados](#4-banco-de-dados)
5. [Bot Telegram](#5-bot-telegram)
6. [Fluxo Multiplayer](#6-fluxo-multiplayer)
7. [Sistema de Transações](#7-sistema-de-transações)
8. [Jogo Dominó](#8-jogo-dominó)

---

## 1. Arquitetura Geral

```mermaid
graph TB
    subgraph "🤖 Telegram Layer"
        TG[Telegram API]
        BOT[Bot Handlers]
        MW[Middleware]
        KB[Keyboards]
    end

    subgraph "🎮 Application Layer"
        APP[Application Main]
        CTX[Game Context]
        SESS[Session Management]
    end

    subgraph "🔧 Service Layer"
        US[User Service]
        GS[Game Service]
        NS[Notification Service]
    end

    subgraph "🎯 Game Engine"
        BG[Base Game]
        CF[Coin Flip]
        DOM[Domino]
    end

    subgraph "🗄️ Data Layer"
        UR[User Repository]
        GR[Game Repository]
        TR[Transaction Repository]
        DB[(PostgreSQL)]
    end

    subgraph "⚙️ Config & Utils"
        CFG[Configuration]
        LOG[Logger]
        HELP[Helpers]
        CONST[Constants]
    end

    %% Connections
    TG --> BOT
    BOT --> MW
    BOT --> KB
    BOT --> APP
    APP --> CTX
    APP --> SESS
    CTX --> US
    CTX --> GS
    CTX --> NS
    GS --> BG
    BG --> CF
    BG --> DOM
    US --> UR
    GS --> GR
    US --> TR
    UR --> DB
    GR --> DB
    TR --> DB
    APP --> CFG
    APP --> LOG
    BOT --> HELP
    BOT --> CONST

    %% Styling
    classDef telegram fill:#0088cc,stroke:#005580,color:#fff
    classDef service fill:#28a745,stroke:#1e7e34,color:#fff
    classDef game fill:#fd7e14,stroke:#e55a00,color:#fff
    classDef data fill:#6610f2,stroke:#520dc2,color:#fff
    classDef config fill:#6c757d,stroke:#545b62,color:#fff

    class TG,BOT,MW,KB telegram
    class US,GS,NS service
    class BG,CF,DOM game
    class UR,GR,TR,DB data
    class CFG,LOG,HELP,CONST config
```

---

## 2. Fluxo de Usuário

```mermaid
sequenceDiagram
    participant U as 👤 Usuário
    participant T as 🤖 Telegram
    participant B as 🎮 Bot Handler
    participant M as 🔧 Middleware
    participant S as 📊 Service
    participant D as 🗄️ Database

    U->>T: /start
    T->>B: handleStart()
    B->>M: userMiddleware
    M->>S: getUserById()
    S->>D: SELECT user
    
    alt Usuário existe
        D-->>S: userData
        S-->>M: user
    else Usuário novo
        S->>D: INSERT user
        D-->>S: newUser
        S-->>M: newUser
    end
    
    M-->>B: ctx.state.user
    B->>T: Menu Principal
    T-->>U: 🎮 Bem-vindo!

    note over U,D: Usuário autenticado e pronto para jogar
```

---

## 3. Sistema de Jogos

```mermaid
flowchart TD
    START[🎮 Menu de Jogos] --> SELECT{Selecionar Jogo}
    
    SELECT -->|Coin Flip| CF[🪙 Cara ou Coroa]
    SELECT -->|Dominó| DOM[🀱 Dominó]
    SELECT -->|Outros| OTHER[🎲 Em Desenvolvimento]
    
    CF --> CFOPT{Opções Coin Flip}
    CFOPT -->|Criar| CFCREATE[Criar Partida CF]
    CFOPT -->|Entrar| CFJOIN[Entrar Partida CF]
    
    DOM --> DOMOPT{Opções Dominó}
    DOMOPT -->|Criar| DOMCREATE[Criar Partida Dominó]
    DOMOPT -->|Entrar| DOMJOIN[Entrar Partida Dominó]
    
    CFCREATE --> BET[💰 Selecionar Aposta]
    DOMCREATE --> BET
    
    BET --> VALIDATE{Validar Saldo?}
    VALIDATE -->|❌ Insuficiente| ERROR[❌ Saldo Insuficiente]
    VALIDATE -->|✅ OK| CREATE[🎮 Criar Jogo]
    
    CREATE --> WAITING[⏳ Aguardando Oponente]
    
    CFJOIN --> CFLIST[📋 Lista de Partidas CF]
    DOMJOIN --> DOMLIST[📋 Lista de Partidas Dominó]
    
    CFLIST --> JOINSELECT[Selecionar Partida]
    DOMLIST --> JOINSELECT
    
    JOINSELECT --> JOINGAME[🎯 Entrar no Jogo]
    
    WAITING --> READY{Oponente Entrou?}
    JOINGAME --> READY
    
    READY -->|✅ Sim| GAMEPLAY[🎮 Iniciar Gameplay]
    READY -->|❌ Não| WAITING
    
    GAMEPLAY --> RESULT[🏆 Resultado]
    RESULT --> TRANSACTION[💸 Processar Transação]
    TRANSACTION --> END[🏠 Menu Principal]
    
    ERROR --> END
    OTHER --> END

    %% Styling
    classDef startEnd fill:#28a745,stroke:#1e7e34,color:#fff
    classDef decision fill:#ffc107,stroke:#d39e00,color:#000
    classDef process fill:#007bff,stroke:#0056b3,color:#fff
    classDef error fill:#dc3545,stroke:#a71d2d,color:#fff
    classDef game fill:#fd7e14,stroke:#e55a00,color:#fff

    class START,END startEnd
    class SELECT,CFOPT,DOMOPT,VALIDATE,READY decision
    class BET,CREATE,WAITING,JOINSELECT,JOINGAME,GAMEPLAY,RESULT,TRANSACTION process
    class ERROR error
    class CF,DOM,CFCREATE,CFCREATE,DOMCREATE,CFLIST,DOMLIST game
```

---

## 4. Banco de Dados

```mermaid
erDiagram
    users {
        int id PK
        varchar telegram_id UK
        varchar chat_id
        varchar first_name
        varchar last_name
        varchar username
        decimal balance
        enum status
        timestamp last_activity
        timestamp created_at
        timestamp updated_at
    }

    games {
        int id PK
        int creator_id FK
        int player2_id FK
        enum game_type
        enum match_type
        decimal bet_amount
        enum status
        json game_data
        int winner_id FK
        decimal prize
        decimal rake_amount
        timestamp expires_at
        timestamp started_at
        timestamp completed_at
        timestamp created_at
        timestamp updated_at
    }

    transactions {
        int id PK
        int user_id FK
        enum type
        decimal amount
        decimal balance_before
        decimal balance_after
        enum status
        text description
        timestamp created_at
        timestamp updated_at
    }

    %% Relacionamentos
    users ||--o{ games : "creates (creator_id)"
    users ||--o{ games : "plays as player2 (player2_id)"
    users ||--o{ games : "wins (winner_id)"
    users ||--o{ transactions : "has transactions"

    %% Enums
    games }|--|| game_type_enum : "coin_flip, domino, etc"
    games }|--|| game_status_enum : "waiting, active, completed"
    games }|--|| match_type_enum : "multiplayer, tournament"
    transactions }|--|| transaction_type_enum : "bet_win, bet_loss, etc"
    transactions }|--|| transaction_status_enum : "pending, completed"
    users }|--|| user_status_enum : "active, suspended, banned"
```

---

## 5. Bot Telegram

```mermaid
graph LR
    subgraph "📱 User Interface"
        USER[👤 Usuário]
        TG[📱 Telegram App]
    end

    subgraph "🤖 Bot Layer"
        HANDLERS[🎮 Bot Handlers]
        KEYBOARDS[⌨️ Keyboards]
        CONTEXT[📝 Context]
        MIDDLEWARE[🔧 Middleware]
    end

    subgraph "🎯 Handler Types"
        START[/start]
        HELP[/help]
        PROFILE[/profile]
        CALLBACKS[📞 Callbacks]
        ACTIONS[⚡ Actions]
    end

    subgraph "⌨️ Keyboard Types"
        MAIN[🏠 Main Menu]
        GAMES[🎮 Games Menu]
        WALLET[💼 Wallet Menu]
        BETS[💰 Bet Selection]
        CHOICES[🎯 Game Choices]
    end

    subgraph "🔧 Middleware Flow"
        AUTH[🔐 Authentication]
        USER_LOAD[👤 Load User]
        SESSION[📊 Session Management]
        LOGGING[📝 Logging]
    end

    USER --> TG
    TG --> HANDLERS
    HANDLERS --> KEYBOARDS
    HANDLERS --> CONTEXT
    HANDLERS --> MIDDLEWARE

    HANDLERS --> START
    HANDLERS --> HELP
    HANDLERS --> PROFILE
    HANDLERS --> CALLBACKS
    HANDLERS --> ACTIONS

    KEYBOARDS --> MAIN
    KEYBOARDS --> GAMES
    KEYBOARDS --> WALLET
    KEYBOARDS --> BETS
    KEYBOARDS --> CHOICES

    MIDDLEWARE --> AUTH
    AUTH --> USER_LOAD
    USER_LOAD --> SESSION
    SESSION --> LOGGING

    %% Return flows
    LOGGING --> CONTEXT
    CONTEXT --> HANDLERS
    HANDLERS --> TG
    TG --> USER

    %% Styling
    classDef user fill:#17a2b8,stroke:#138496,color:#fff
    classDef bot fill:#28a745,stroke:#1e7e34,color:#fff
    classDef handler fill:#fd7e14,stroke:#e55a00,color:#fff
    classDef keyboard fill:#6f42c1,stroke:#563d7c,color:#fff
    classDef middleware fill:#dc3545,stroke:#a71d2d,color:#fff

    class USER,TG user
    class HANDLERS,KEYBOARDS,CONTEXT bot
    class START,HELP,PROFILE,CALLBACKS,ACTIONS handler
    class MAIN,GAMES,WALLET,BETS,CHOICES keyboard
    class AUTH,USER_LOAD,SESSION,LOGGING middleware
```

---

## 6. Fluxo Multiplayer

```mermaid
sequenceDiagram
    participant P1 as 👤 Jogador 1
    participant P2 as 👤 Jogador 2
    participant B as 🤖 Bot
    participant GS as 🎮 Game Service
    participant NS as 📢 Notification
    participant DB as 🗄️ Database

    %% Criação do Jogo
    P1->>B: Criar Partida
    B->>GS: createGame()
    GS->>DB: INSERT game (status: waiting)
    GS->>GS: debitBalance(P1, betAmount)
    GS-->>B: gameId
    B-->>P1: ✅ Partida #123 criada

    %% Entrada do Segundo Jogador
    P2->>B: Entrar Partida #123
    B->>GS: joinGame(123, P2)
    GS->>DB: SELECT game WHERE id=123
    GS->>GS: validateGame()
    GS->>GS: debitBalance(P2, betAmount)
    GS->>DB: UPDATE game SET player2_id=P2, status='active'
    GS-->>B: gameData
    
    %% Notificação
    B->>NS: notifyPlayerJoined()
    NS-->>P1: 🎮 Jogador entrou na partida!
    B-->>P2: ✅ Você entrou na partida!

    %% Gameplay
    note over P1,P2: Ambos fazem suas escolhas

    P1->>B: Escolha "heads"
    B->>GS: makeMove(123, P1, "heads")
    GS->>DB: UPDATE game_data
    GS-->>B: {waiting: true}
    B-->>P1: ⏳ Aguardando oponente...

    P2->>B: Escolha "tails"
    B->>GS: makeMove(123, P2, "tails")
    GS->>GS: processMultiplayerResult()
    GS->>GS: determineWinner()
    GS->>GS: distributePrizes()
    GS->>DB: UPDATE game SET status='completed'
    GS-->>B: {waiting: false, result: {...}}
    
    %% Resultado
    B-->>P1: 🎉 Você ganhou! +R$19,00
    B-->>P2: 😔 Você perdeu! -R$10,00

    note over P1,DB: Transações registradas e saldos atualizados
```

---

## 7. Sistema de Transações

```mermaid
flowchart TD
    START[💰 Início Transação] --> TYPE{Tipo de Transação}
    
    TYPE -->|Aposta| BET[🎲 Apostar]
    TYPE -->|Ganho| WIN[🏆 Ganho]
    TYPE -->|Perda| LOSS[💸 Perda]
    TYPE -->|Depósito| DEPOSIT[💳 Depósito]
    TYPE -->|Saque| WITHDRAW[🏧 Saque]
    
    BET --> VALIDATE_BET{Validar Saldo?}
    VALIDATE_BET -->|❌ Insuficiente| ERROR[❌ Saldo Insuficiente]
    VALIDATE_BET -->|✅ OK| DEBIT[➖ Debitar Valor]
    
    WIN --> CREDIT[➕ Creditar Prêmio]
    LOSS --> LOG_LOSS[📝 Registrar Perda]
    
    DEPOSIT --> VALIDATE_DEPOSIT{Validar Depósito?}
    VALIDATE_DEPOSIT -->|✅ OK| CREDIT
    VALIDATE_DEPOSIT -->|❌ Erro| ERROR
    
    WITHDRAW --> VALIDATE_WITHDRAW{Validar Saque?}
    VALIDATE_WITHDRAW -->|✅ OK| DEBIT
    VALIDATE_WITHDRAW -->|❌ Erro| ERROR
    
    DEBIT --> UPDATE_BALANCE[🔄 Atualizar Saldo]
    CREDIT --> UPDATE_BALANCE
    LOG_LOSS --> UPDATE_BALANCE
    
    UPDATE_BALANCE --> CREATE_TRANSACTION[📝 Criar Transação]
    CREATE_TRANSACTION --> UPDATE_USER[👤 Atualizar Usuário]
    UPDATE_USER --> SUCCESS[✅ Sucesso]
    
    ERROR --> END[🔚 Fim]
    SUCCESS --> END

    %% Styling
    classDef start fill:#28a745,stroke:#1e7e34,color:#fff
    classDef decision fill:#ffc107,stroke:#d39e00,color:#000
    classDef process fill:#007bff,stroke:#0056b3,color:#fff
    classDef error fill:#dc3545,stroke:#a71d2d,color:#fff
    classDef success fill:#28a745,stroke:#1e7e34,color:#fff

    class START start
    class TYPE,VALIDATE_BET,VALIDATE_DEPOSIT,VALIDATE_WITHDRAW decision
    class BET,WIN,LOSS,DEPOSIT,WITHDRAW,DEBIT,CREDIT,LOG_LOSS,UPDATE_BALANCE,CREATE_TRANSACTION,UPDATE_USER process
    class ERROR error
    class SUCCESS,END success
```

---

## 8. Jogo Dominó

```mermaid
stateDiagram-v2
    [*] --> Criando
    
    state "🎮 Criando Partida" as Criando {
        [*] --> ValidandoAposta
        ValidandoAposta --> DebitandoSaldo
        DebitandoSaldo --> CriandoJogo
        CriandoJogo --> [*]
    }
    
    Criando --> Aguardando
    
    state "⏳ Aguardando Oponente" as Aguardando {
        [*] --> EsperandoJogador2
        EsperandoJogador2 --> ValidandoEntrada
        ValidandoEntrada --> DebitandoJogador2
        DebitandoJogador2 --> [*]
    }
    
    Aguardando --> Inicializando
    
    state "🚀 Inicializando Jogo" as Inicializando {
        [*] --> CriandoDeck
        CriandoDeck --> EmbaralhandoPeças
        EmbaralhandoPeças --> DistribuindoMãos
        DistribuindoMãos --> DefinindoPrimeiroJogador
        DefinindoPrimeiroJogador --> [*]
    }
    
    Inicializando --> Jogando
    
    state "🎯 Jogando" as Jogando {
        [*] --> VezJogador1
        VezJogador1 --> ValidandoJogada1 : Jogada
        ValidandoJogada1 --> ColocandoPeça1 : ✅ Válida
        ValidandoJogada1 --> VezJogador1 : ❌ Inválida
        ColocandoPeça1 --> VerificandoFim1
        VerificandoFim1 --> VezJogador2 : Continua
        VerificandoFim1 --> CalculandoVencedor : Fim
        
        VezJogador2 --> ValidandoJogada2 : Jogada
        ValidandoJogada2 --> ColocandoPeça2 : ✅ Válida
        ValidandoJogada2 --> VezJogador2 : ❌ Inválida
        ColocandoPeça2 --> VerificandoFim2
        VerificandoFim2 --> VezJogador1 : Continua
        VerificandoFim2 --> CalculandoVencedor : Fim
        
        CalculandoVencedor --> [*]
    }
    
    Jogando --> Finalizando
    
    state "🏆 Finalizando" as Finalizando {
        [*] --> DeterminandoVencedor
        DeterminandoVencedor --> CalculandoPrêmios
        CalculandoPrêmios --> DistribuindoPrêmios
        DistribuindoPrêmios --> RegistrandoTransações
        RegistrandoTransações --> [*]
    }
    
    Finalizando --> [*]
    
    note right of Criando
        - Validação de saldo
        - Criação do jogo
        - Status: waiting
    end note
    
    note right of Aguardando
        - Exibição para outros jogadores
        - Entrada do 2º jogador
        - Status: active
    end note
    
    note right of Inicializando
        - 28 peças (0-0 até 6-6)
        - 7 peças por jogador
        - Mesa vazia
    end note
    
    note right of Jogando
        - Validação de jogadas
        - Atualização da mesa
        - Verificação de vitória
    end note
    
    note right of Finalizando
        - Cálculo de pontos
        - Distribuição de prêmios
        - Rake da casa (5%)
    end note
```

---

## 🔄 Fluxo Completo: Criação e Execução de Jogo

```mermaid
sequenceDiagram
    participant U1 as 👤 Jogador 1
    participant U2 as 👤 Jogador 2
    participant TG as 📱 Telegram
    participant BH as 🎮 Bot Handlers
    participant GS as 🔧 Game Service
    participant US as 👤 User Service
    participant GR as 🗄️ Game Repository
    participant TR as 📊 Transaction Repo
    participant NS as 📢 Notifications
    participant DOM as 🀱 Domino Engine

    %% Criação da Partida
    U1->>TG: 🎮 Jogar Dominó
    TG->>BH: handleGameSelection('domino')
    BH->>TG: Opções Dominó
    TG->>U1: [Criar] [Entrar]
    
    U1->>TG: Criar Partida
    TG->>BH: handleCreateDomino()
    BH->>TG: Selecionar Aposta
    TG->>U1: [R$5] [R$10] [R$25]...
    
    U1->>TG: R$ 10,00
    TG->>BH: handleBetSelection()
    BH->>US: Validar saldo
    US->>BH: ✅ Saldo OK
    BH->>GS: createGame(domino, 10.00)
    GS->>US: updateUserBalance(U1, -10.00)
    GS->>GR: create(gameData)
    GR->>GS: gameId: 123
    GS->>BH: Game criado
    BH->>TG: Partida #123 criada
    TG->>U1: ⏳ Aguardando oponente...

    %% Entrada do Segundo Jogador
    U2->>TG: 🔍 Entrar em Partida
    TG->>BH: handleJoinDomino()
    BH->>GS: getAvailableGames('domino')
    GS->>GR: findAvailableGames()
    GR->>GS: [Partida #123]
    GS->>BH: Lista de partidas
    BH->>TG: Partidas disponíveis
    TG->>U2: [#123 - R$10,00]
    
    U2->>TG: Entrar #123
    TG->>BH: handleJoinSpecificDomino(123)
    BH->>GS: joinGame(123, U2)
    GS->>US: Validar saldo U2
    US->>GS: ✅ Saldo OK
    GS->>US: updateUserBalance(U2, -10.00)
    GS->>GR: updateGameWithPlayer2(123, U2)
    GS->>BH: Jogo ativo
    BH->>NS: notifyPlayerJoined()
    NS->>U1: 🎮 Jogador entrou!
    BH->>TG: Você entrou na partida
    TG->>U2: ✅ Partida iniciada

    %% Inicialização do Dominó
    note over DOM: Criar deck, distribuir peças
    BH->>DOM: create(10.00, U1, U2)
    DOM->>DOM: initializeGameState()
    DOM->>GS: gameState
    GS->>GR: updateGameData(123, gameState)

    %% Gameplay
    loop Turno dos Jogadores
        BH->>DOM: getAvailableMoves(currentPlayer)
        DOM->>BH: Lista de jogadas
        BH->>TG: Suas jogadas disponíveis
        TG->>U1: [Peça1-Esq] [Peça1-Dir]...
        
        U1->>TG: Jogar Peça [2|3] lado direito
        TG->>BH: handleDominoMove(123, piece, 'right')
        BH->>DOM: makeMove(U1, pieceId, 'right')
        DOM->>DOM: validateMove()
        DOM->>DOM: placePieceOnTable()
        DOM->>DOM: switchToNextPlayer()
        DOM->>BH: moveResult
        BH->>GS: updateGameData(123, newState)
        
        alt Jogo Continua
            BH->>TG: Jogada registrada
            TG->>U1: ⏳ Aguardando adversário
            note over U2: Vez do Jogador 2
        else Jogo Terminou
            DOM->>DOM: determineWinner()
            DOM->>BH: gameResult
            BH->>GS: processGameResult()
            GS->>US: updateUserBalance(winner, prize)
            GS->>TR: createTransaction()
            GS->>GR: completeGame()
            BH->>TG: Resultado final
            TG->>U1: 🏆 Você ganhou R$19,00!
            TG->>U2: 😔 Você perdeu R$10,00
        end
    end

    note over U1,DOM: Rake da casa: R$1,00 (5%)
    note over U1,DOM: Prêmio total: R$19,00
```

---

## 📊 Métricas e Estatísticas

```mermaid
pie title Distribuição de Componentes
    "Handlers (32 métodos)" : 35
    "Services (3 classes)" : 25
    "Game Engines (3 tipos)" : 20
    "Repositories (3 tipos)" : 15
    "Utils & Config" : 5

pie title Status de Implementação
    "✅ Implementado (85%)" : 85
    "🔄 Em Desenvolvimento (10%)" : 10
    "📋 Planejado (5%)" : 5
```

---

## 🔧 Configuração do Sistema

```mermaid
mindmap
  root((⚙️ Configuração))
    🔐 Segurança
      TOKEN Bot
      JWT Secret
      Admin IDs
      CORS Origin
    🗄️ Database
      PostgreSQL URL
      Connection Pool
      Migration Scripts
      Seed Data
    🎮 Jogos
      Rake Percentage (5%)
      Min/Max Bet
      Game Timeout (15min)
      Max Active Games
    📝 Logging
      Winston Logger
      Log Levels
      File Rotation
      Error Tracking
    🔔 Notificações
      Telegram API
      Message Templates
      Rate Limiting
      Retry Logic
```

---

## 📈 Fluxo de Desenvolvimento

```mermaid
gitgraph
    commit id: "Initial Setup"
    branch feature/bot-handlers
    commit id: "Basic Handlers"
    commit id: "Menu System"
    commit id: "User Management"
    checkout main
    merge feature/bot-handlers
    
    branch feature/game-engine
    commit id: "Base Game Class"
    commit id: "Coin Flip Game"
    commit id: "Domino Engine"
    checkout main
    merge feature/game-engine
    
    branch feature/services
    commit id: "User Service"
    commit id: "Game Service"
    commit id: "Notification Service"
    checkout main
    merge feature/services
    
    branch feature/database
    commit id: "Schema Design"
    commit id: "Repositories"
    commit id: "Migrations"
    checkout main
    merge feature/database
    
    commit id: "Integration Tests"
    commit id: "JSDoc Documentation"
    commit id: "Production Ready"
```

---

## 🎯 Próximos Passos

```mermaid
roadmap
    title Roadmap de Desenvolvimento
    
    section Atual (v1.0)
        Coin Flip Multiplayer     : done, coinflip, 2024-01-01, 2024-01-15
        Domino Multiplayer        : done, domino, 2024-01-10, 2024-01-30
        Sistema de Transações     : done, transactions, 2024-01-05, 2024-01-20
        Bot Telegram              : done, bot, 2024-01-01, 2024-01-25
        
    section Próxima (v1.1)
        Pedra/Papel/Tesoura      : active, rps, 2024-02-01, 2024-02-15
        Sistema de Dados         : dice, 2024-02-10, 2024-02-25
        Histórico de Jogos       : history, 2024-02-05, 2024-02-20
        
    section Futura (v2.0)
        Sistema de Torneios      : tournament, 2024-03-01, 2024-03-30
        Rankings e Leaderboards  : ranking, 2024-03-15, 2024-04-01
        Sistema de Depósito/Saque: payments, 2024-04-01, 2024-04-30
        API REST                 : api, 2024-04-15, 2024-05-15
```

---

## 📋 Resumo da Arquitetura

### 🏗️ **Características Principais:**
- **Arquitetura em Camadas**: Separação clara entre apresentação, serviços e dados
- **Sistema Multiplayer**: Jogos PvP em tempo real
- **Gestão de Estado**: Persistência de jogos complexos (Dominó)
- **Transações Seguras**: Sistema robusto de apostas e prêmios
- **Escalabilidade**: Estrutura preparada para novos jogos

### 🎮 **Jogos Implementados:**
- ✅ **Coin Flip**: Cara ou Coroa multiplayer
- ✅ **Domino**: Jogo complexo com 28 peças
- 🔄 **Outros**: Em desenvolvimento

### 🔧 **Tecnologias:**
- **Backend**: Node.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Bot**: Telegraf.js
- **Logger**: Winston
- **Validation**: Zod

### 📊 **Métricas:**
- **85%** de implementação completa
- **32** handlers do bot documentados
- **3** serviços principais
- **3** repositórios de dados
- **2** jogos multiplayer funcionais

---

*📝 Documentação gerada automaticamente - Última atualização: Janeiro 2025*

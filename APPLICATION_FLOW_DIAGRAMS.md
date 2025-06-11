# 🔄 Fluxos da Aplicação - Diagramas Detalhados

## 📋 Índice
1. [Fluxo de Inicialização Completo](#1-fluxo-de-inicialização-completo)
2. [Fluxo Coin Flip Multiplayer](#2-fluxo-coin-flip-multiplayer)
3. [Fluxo Domino Detalhado](#3-fluxo-domino-detalhado)
4. [Sistema de Transações](#4-sistema-de-transações)
5. [Mapa de Handlers](#5-mapa-de-handlers)
6. [Arquitetura de Dados](#6-arquitetura-de-dados)
7. [Estados de Sistema](#7-estados-de-sistema)
8. [Notificações em Tempo Real](#8-notificações-em-tempo-real)

---

## 1. Fluxo de Inicialização Completo

```mermaid
sequenceDiagram
    participant U as 👤 Usuário
    participant TG as 📱 Telegram
    participant BH as 🤖 Bot Handlers
    participant MW as 🔧 Middleware
    participant US as 👥 UserService
    participant UR as 🗄️ UserRepository
    participant DB as 🗄️ Database

    U->>TG: /start
    TG->>BH: handleStart()
    BH->>MW: authenticateUser()
    MW->>US: findOrCreateUser(telegramData)
    US->>UR: findByTelegramId(telegramId)
    
    alt Usuário Novo
        UR->>DB: SELECT * FROM users WHERE telegram_id = ?
        DB->>UR: []
        UR->>US: null
        US->>UR: create(userData)
        UR->>DB: INSERT INTO users (...)
        DB->>UR: newUser
        UR->>US: User created
        US->>UR: updateChatId(userId, chatId)
        UR->>DB: UPDATE users SET chat_id = ?
    else Usuário Existente
        UR->>DB: SELECT * FROM users
        DB->>UR: existingUser
        UR->>US: User found
        US->>UR: updateLastActivity(userId)
        UR->>DB: UPDATE users SET last_activity = NOW()
    end
    
    US->>MW: User authenticated
    MW->>BH: ctx.state.user = user
    BH->>TG: Welcome message + mainMenuKeyboard
    TG->>U: 🏠 Menu Principal<br/>[🎮 Jogar] [💼 Carteira] [📊 Ranking]

    Note over U,DB: Sistema pronto para jogos multiplayer
```

---

## 2. Fluxo Coin Flip Multiplayer

```mermaid
sequenceDiagram
    participant U1 as 👤 Jogador 1
    participant U2 as 👤 Jogador 2
    participant TG as 📱 Telegram
    participant BH as 🤖 Bot Handlers
    participant GS as 🎮 GameService
    participant US as 👥 UserService
    participant NS as 🔔 NotificationService
    participant CF as 🪙 CoinFlip Engine
    participant DB as 🗄️ Database

    %% Criação da Partida
    U1->>TG: 🎮 Jogar → 🪙 Cara ou Coroa → 🆕 Criar Partida
    TG->>BH: handleCreateCoinFlip()
    BH->>TG: Selecionar Aposta [R$5] [R$10] [R$25]...
    U1->>TG: R$ 10,00
    TG->>BH: handleBetSelection(bet_1000)
    BH->>US: getUserById(userId)
    US->>DB: SELECT balance FROM users WHERE id = ?
    DB->>US: balance: "25.50"
    US->>BH: User balance OK
    BH->>US: updateUserBalance(userId, -10.00, 'subtract')
    US->>DB: UPDATE users SET balance = balance - 10.00
    BH->>GS: createGame(userId, {gameType: 'coin_flip', betAmount: 10.00})
    GS->>DB: INSERT INTO games (creator_id, game_type, bet_amount, status='waiting')
    DB->>GS: gameId: 123
    GS->>BH: Game created #123
    BH->>TG: 🎯 Partida #123 criada<br/>⏳ Aguardando oponente...

    %% Entrada do Segundo Jogador
    U2->>TG: 🎮 Jogar → 🪙 Cara ou Coroa → 🔍 Entrar em Partida
    TG->>BH: handleJoinCoinFlip()
    BH->>GS: getAvailableGames('coin_flip')
    GS->>DB: SELECT * FROM games WHERE status='waiting' AND game_type='coin_flip'
    DB->>GS: [Game #123 - R$10,00]
    GS->>BH: Available games list
    BH->>TG: Partidas Disponíveis
    TG->>U2: [🎮 Partida #123 - R$ 10,00]
    
    U2->>TG: Entrar #123
    TG->>BH: handleJoinSpecificGame(123)
    BH->>GS: joinGame(123, user2Id)
    GS->>US: getUserById(user2Id)
    US->>GS: User balance: R$ 15.75
    GS->>US: updateUserBalance(user2Id, -10.00, 'subtract')
    GS->>DB: UPDATE games SET player2_id=?, status='active' WHERE id=123
    DB->>GS: Game updated
    
    %% Notificação para Jogador 1
    GS->>NS: notifyPlayerJoined(user1.chatId, user2.firstName, 123)
    NS->>TG: Send notification to User1
    TG->>U1: 🎮 Jogador2 entrou na sua partida!<br/>[😎 Cara] [👑 Coroa]

    %% Jogadas dos Jogadores
    U1->>TG: 😎 Cara
    TG->>BH: handleMakeMove(123, 'heads')
    BH->>GS: makeMove(123, user1Id, 'heads')
    GS->>DB: UPDATE games SET game_data = '{"player1Choice": "heads"}'
    GS->>BH: {waiting: true, message: "Aguardando jogada do oponente"}
    BH->>TG: ⏳ Aguardando jogada do adversário...

    U2->>TG: 👑 Coroa  
    TG->>BH: handleMakeMove(123, 'tails')
    BH->>GS: makeMove(123, user2Id, 'tails')
    GS->>CF: create(10.00)
    CF->>CF: flipCoin() → result: 'heads'
    CF->>GS: {winner: 'player', choice: 'heads', prize: 19.00}
    
    %% Processamento do Resultado
    GS->>US: updateUserBalance(user1Id, +19.00, 'add')
    GS->>DB: UPDATE users SET balance = balance + 19.00 WHERE id = user1Id
    GS->>DB: INSERT INTO transactions (user_id, type='bet_win', amount='19.00')
    GS->>DB: INSERT INTO transactions (user_id=user2Id, type='bet_loss', amount='10.00')
    GS->>DB: UPDATE games SET status='completed', winner_id=user1Id, prize='19.00', rake_amount='1.00'
    
    %% Notificações de Resultado
    BH->>TG: Enviar resultado para User1
    TG->>U1: 🎉 VOCÊ GANHOU!<br/>💰 Prêmio: R$ 19,00<br/>[🎮 Jogar Novamente]
    
    BH->>TG: Enviar resultado para User2
    TG->>U2: 😔 VOCÊ PERDEU!<br/>🎮 Quer tentar novamente?<br/>[🎮 Jogar Novamente]

    Note over U1,DB: Jogo completo: apostas, resultado, transações, rake (5%)
```

---

## 3. Fluxo Domino Detalhado

```mermaid
stateDiagram-v2
    [*] --> Criando
    
    state Criando {
        [*] --> ValidandoSaldo
        ValidandoSaldo --> ReservandoAposta
        ReservandoAposta --> CriandoPartida
        CriandoPartida --> [*]
    }
    
    Criando --> Aguardando : Partida criada
    
    state Aguardando {
        [*] --> ExibindoParaJogadores
        ExibindoParaJogadores --> ProcessandoEntrada
        ProcessandoEntrada --> [*]
    }
    
    Aguardando --> Inicializando : Jogador 2 entrou
    
    state Inicializando {
        [*] --> Criando28Peças
        Criando28Peças --> Embaralhando
        Embaralhando --> Distribuindo7ParaCada
        Distribuindo7ParaCada --> DefinindoPrimeiroJogador
        DefinindoPrimeiroJogador --> [*]
    }
    
    Inicializando --> Jogando : Jogo inicializado
    
    state Jogando {
        [*] --> VezJogador1
        VezJogador1 --> ValidandoJogada1 : Jogada realizada
        ValidandoJogada1 --> AtualizandoMesa1 : Jogada válida
        ValidandoJogada1 --> VezJogador1 : Jogada inválida
        AtualizandoMesa1 --> VerificandoVitoria1
        VerificandoVitoria1 --> VezJogador2 : Jogo continua
        VerificandoVitoria1 --> JogoTerminado : Jogador 1 venceu
        
        VezJogador2 --> ValidandoJogada2 : Jogada realizada
        ValidandoJogada2 --> AtualizandoMesa2 : Jogada válida
        ValidandoJogada2 --> VezJogador2 : Jogada inválida
        AtualizandoMesa2 --> VerificandoVitoria2
        VerificandoVitoria2 --> VezJogador1 : Jogo continua
        VerificandoVitoria2 --> JogoTerminado : Jogador 2 venceu
        
        VezJogador1 --> PassandoVez1 : Sem jogadas possíveis
        PassandoVez1 --> VezJogador2
        VezJogador2 --> PassandoVez2 : Sem jogadas possíveis  
        PassandoVez2 --> VerificandoBloqueio
        VerificandoBloqueio --> JogoBloqueado : Ambos sem jogadas
        VerificandoBloqueio --> VezJogador1 : Jogo continua
        
        JogoBloqueado --> ContandoPontos
        ContandoPontos --> JogoTerminado
    }
    
    Jogando --> Finalizando : Jogo terminou
    
    state Finalizando {
        [*] --> CalculandoVencedor
        CalculandoVencedor --> CalculandoPremio
        CalculandoPremio --> ProcessandoPagamentos
        ProcessandoPagamentos --> CalculandoRake
        CalculandoRake --> CriandoTransacoes
        CriandoTransacoes --> [*]
    }
    
    Finalizando --> [*] : Jogo finalizado

    note right of Criando
        🔍 Validação de saldo
        💰 Reserva de aposta (R$ 10,00)
        🗄️ Status: 'waiting'
    end note
    
    note right of Aguardando  
        📋 Listagem para outros jogadores
        🎯 Entrada do 2º jogador
        🔄 Status: 'active'
    end note
    
    note right of Inicializando
        🀱 28 peças (0-0 até 6-6)
        🎲 Embaralhamento
        ✋ 7 peças por jogador
        🎯 Mesa vazia
    end note
    
    note right of Jogando
        ✅ Validação de jogadas
        🀱 Atualização da mesa
        🏆 Verificação de vitória
        🚫 Detecção de bloqueio
    end note
    
    note right of Finalizando
        🧮 Cálculo de pontos
        💰 Distribuição de prêmios
        📊 Rake da casa (5%)
        📝 Histórico de transações
    end note
```

---

## 4. Sistema de Transações

```mermaid
flowchart TD
    START[💰 Transação Iniciada] --> TYPE{Tipo de Transação}
    
    TYPE -->|bet_loss| LOSS[💸 Perda de Aposta]
    TYPE -->|bet_win| WIN[🏆 Ganho de Aposta]
    TYPE -->|deposit| DEPOSIT[💳 Depósito]
    TYPE -->|withdrawal| WITHDRAW[🏧 Saque]
    
    LOSS --> VALIDATE_LOSS{Validar Perda?}
    WIN --> VALIDATE_WIN{Validar Ganho?}
    DEPOSIT --> VALIDATE_DEPOSIT{Validar Depósito?}
    WITHDRAW --> VALIDATE_WITHDRAW{Validar Saque?}
    
    VALIDATE_LOSS -->|✅ OK| DEBIT_LOSS[➖ Debitar Aposta]
    VALIDATE_LOSS -->|❌ Erro| ERROR[❌ Erro na Transação]
    
    VALIDATE_WIN -->|✅ OK| CREDIT_WIN[➕ Creditar Prêmio]
    VALIDATE_WIN -->|❌ Erro| ERROR
    
    VALIDATE_DEPOSIT -->|✅ OK| CREDIT_DEPOSIT[➕ Creditar Depósito]
    VALIDATE_DEPOSIT -->|❌ Erro| ERROR
    
    VALIDATE_WITHDRAW -->|✅ OK| DEBIT_WITHDRAW[➖ Debitar Saque]
    VALIDATE_WITHDRAW -->|❌ Saldo Insuficiente| ERROR
    
    DEBIT_LOSS --> CALC_RAKE[📊 Calcular Rake]
    CREDIT_WIN --> CALC_RAKE
    CREDIT_DEPOSIT --> UPDATE_BALANCE
    DEBIT_WITHDRAW --> UPDATE_BALANCE
    
    CALC_RAKE --> HOUSE_RAKE[🏠 Rake da Casa: 5%]
    HOUSE_RAKE --> UPDATE_BALANCE[🔄 Atualizar Saldo]
    
    UPDATE_BALANCE --> CREATE_TRANSACTION[📝 Criar Transação]
    CREATE_TRANSACTION --> LOG_TRANSACTION[📋 Registrar no Histórico]
    LOG_TRANSACTION --> UPDATE_USER[👤 Atualizar Usuário]
    UPDATE_USER --> SUCCESS[✅ Transação Concluída]
    
    ERROR --> ROLLBACK[🔄 Rollback]
    ROLLBACK --> END[🔚 Fim]
    SUCCESS --> END

    %% Styling
    classDef start fill:#28a745,stroke:#1e7e34,color:#fff
    classDef decision fill:#ffc107,stroke:#d39e00,color:#000
    classDef process fill:#007bff,stroke:#0056b3,color:#fff
    classDef error fill:#dc3545,stroke:#a71d2d,color:#fff
    classDef success fill:#28a745,stroke:#1e7e34,color:#fff
    classDef calculation fill:#6f42c1,stroke:#563d7c,color:#fff

    class START start
    class TYPE,VALIDATE_LOSS,VALIDATE_WIN,VALIDATE_DEPOSIT,VALIDATE_WITHDRAW decision
    class LOSS,WIN,DEPOSIT,WITHDRAW,DEBIT_LOSS,CREDIT_WIN,CREDIT_DEPOSIT,DEBIT_WITHDRAW,UPDATE_BALANCE,CREATE_TRANSACTION,LOG_TRANSACTION,UPDATE_USER process
    class ERROR,ROLLBACK error
    class SUCCESS,END success
    class CALC_RAKE,HOUSE_RAKE calculation

    %% Notes
    classDef note fill:#f8f9fa,stroke:#6c757d,color:#000
    
    RAKE_NOTE[💡 Rake Calculation<br/>Coin Flip: 5% do total<br/>Domino: 5% do total<br/>Mínimo: R$ 0,01]
    CALC_RAKE -.-> RAKE_NOTE
    class RAKE_NOTE note
    
    BALANCE_NOTE[💰 Balance Updates<br/>Before: R$ 25,50<br/>After: R$ 35,50<br/>Change: +R$ 10,00]
    UPDATE_BALANCE -.-> BALANCE_NOTE
    class BALANCE_NOTE note
```

---

## 5. Mapa de Handlers

```mermaid
mindmap
  root((🤖 Bot Handlers))
    🏠 Core Handlers
      handleStart
      handleMainMenu
      handleProfile
      handleHelp
      handleBack
    
    💼 Wallet Handlers
      handleWallet
      handleBalance
      handleDeposit
      handleWithdraw
      handleHistory
      handleTransaction
    
    🎮 Game Handlers
      handleGames
      handleGameMenu
      handleBetSelection
      handleJoinSpecificGame
    
    🪙 Coin Flip Handlers
      handleCreateCoinFlip
      handleJoinCoinFlip
      handleMakeMove
      handleCoinFlipChoice
      handleCoinFlipResult
    
    🀱 Domino Handlers
      handleCreateDomino
      handleJoinDomino
      handleJoinSpecificDomino
      handleDominoState
      handleDominoMove
      handleDominoPass
      handleDominoResult
    
    🔔 Notification Handlers
      handlePlayerJoined
      handleGameResult
      handleGameExpired
      handleSystemNotification
    
    ⚙️ Admin Handlers
      handleAdminPanel
      handleUserManagement
      handleGameStatistics
      handleSystemHealth
    
    🛠️ Utility Handlers
      handleError
      handleCallback
      handleInlineQuery
      handleSession
      handleMiddleware
```

---

## 6. Arquitetura de Dados

```mermaid
graph TB
    subgraph "📱 Interface Layer"
        TG[Telegram API]
        KB[Keyboards]
        MSG[Messages]
    end
    
    subgraph "🤖 Bot Layer"
        BH[Bot Handlers]
        MW[Middleware]
        CTX[Context Management]
        SESS[Session Management]
    end
    
    subgraph "🔧 Service Layer"
        US[User Service]
        GS[Game Service]
        NS[Notification Service]
    end
    
    subgraph "🎯 Game Engine Layer"
        BG[Base Game]
        CF[Coin Flip Engine]
        DOM[Domino Engine]
        VAL[Game Validators]
    end
    
    subgraph "🗄️ Repository Layer"
        UR[User Repository]
        GR[Game Repository]
        TR[Transaction Repository]
    end
    
    subgraph "💾 Database Layer"
        DB[(PostgreSQL)]
        SCHEMA[Drizzle Schema]
        CONN[Connection Pool]
    end
    
    subgraph "⚙️ Configuration Layer"
        CFG[Config Manager]
        ENV[Environment Variables]
        CONST[Constants]
    end
    
    %% Data Flow
    TG --> BH
    KB --> BH
    MSG --> BH
    
    BH --> MW
    MW --> CTX
    CTX --> SESS
    
    BH --> US
    BH --> GS
    BH --> NS
    
    US --> UR
    GS --> GR
    GS --> BG
    NS --> BH
    
    BG --> CF
    BG --> DOM
    BG --> VAL
    
    UR --> DB
    GR --> DB
    TR --> DB
    
    DB --> SCHEMA
    SCHEMA --> CONN
    
    US --> CFG
    GS --> CFG
    CFG --> ENV
    CFG --> CONST
    
    %% Reverse Data Flow
    DB --> UR
    DB --> GR
    DB --> TR
    
    UR --> US
    GR --> GS
    TR --> US
    
    CF --> GS
    DOM --> GS
    VAL --> GS
    
    US --> BH
    GS --> BH
    
    SESS --> CTX
    CTX --> MW
    MW --> BH
    
    BH --> TG

    %% Styling
    classDef interface fill:#e3f2fd,stroke:#1976d2,color:#000
    classDef bot fill:#f3e5f5,stroke:#7b1fa2,color:#000
    classDef service fill:#e8f5e8,stroke:#2e7d32,color:#000
    classDef game fill:#fff3e0,stroke:#ef6c00,color:#000
    classDef repository fill:#fce4ec,stroke:#c2185b,color:#000
    classDef database fill:#f1f8e9,stroke:#558b2f,color:#000
    classDef config fill:#e0f2f1,stroke:#00695c,color:#000

    class TG,KB,MSG interface
    class BH,MW,CTX,SESS bot
    class US,GS,NS service
    class BG,CF,DOM,VAL game
    class UR,GR,TR repository
    class DB,SCHEMA,CONN database
    class CFG,ENV,CONST config
```

---

## 7. Estados de Sistema

```mermaid
stateDiagram-v2
    [*] --> UserRegistration
    
    state UserRegistration {
        [*] --> NewUser
        NewUser --> ValidatingTelegram
        ValidatingTelegram --> CreatingUser
        CreatingUser --> SettingInitialBalance
        SettingInitialBalance --> UserActive
        
        ValidatingTelegram --> ExistingUser : User found
        ExistingUser --> UpdatingActivity
        UpdatingActivity --> UserActive
    }
    
    UserRegistration --> MainMenu : User authenticated
    
    state MainMenu {
        [*] --> DisplayingOptions
        DisplayingOptions --> Games : 🎮 Jogar
        DisplayingOptions --> Wallet : 💼 Carteira
        DisplayingOptions --> Profile : 👤 Perfil
        DisplayingOptions --> Help : ❓ Ajuda
    }
    
    state Games {
        [*] --> GameSelection
        GameSelection --> CoinFlip : 🪙 Cara ou Coroa
        GameSelection --> Domino : 🀱 Dominó
        GameSelection --> OtherGames : 🎲 Outros
        
        CoinFlip --> GameCreation
        Domino --> GameCreation
        
        GameCreation --> BetSelection
        BetSelection --> CreateGame : Criar Partida
        BetSelection --> JoinGame : Entrar Partida
        
        CreateGame --> WaitingForPlayer
        JoinGame --> GameActive
        
        WaitingForPlayer --> GameActive : Player joined
        WaitingForPlayer --> GameExpired : Timeout
        
        GameActive --> GamePlay
        GamePlay --> GameCompleted : Game finished
        GamePlay --> GameCancelled : Player left
        
        GameCompleted --> Results
        Results --> TransactionProcessing
        TransactionProcessing --> [*]
        
        GameExpired --> RefundProcessing
        GameCancelled --> RefundProcessing
        RefundProcessing --> [*]
    }
    
    state Wallet {
        [*] --> WalletMenu
        WalletMenu --> ViewBalance : Ver Saldo
        WalletMenu --> DepositFunds : Depositar
        WalletMenu --> WithdrawFunds : Sacar
        WalletMenu --> ViewHistory : Histórico
        
        ViewBalance --> [*]
        DepositFunds --> ProcessingDeposit
        WithdrawFunds --> ProcessingWithdrawal
        ViewHistory --> [*]
        
        ProcessingDeposit --> [*]
        ProcessingWithdrawal --> [*]
    }
    
    state Profile {
        [*] --> DisplayingProfile
        DisplayingProfile --> ViewStats : Ver Estatísticas
        DisplayingProfile --> EditProfile : Editar Perfil
        DisplayingProfile --> ViewGames : Ver Jogos
        
        ViewStats --> [*]
        EditProfile --> [*]
        ViewGames --> [*]
    }
    
    Games --> MainMenu : Voltar
    Wallet --> MainMenu : Voltar
    Profile --> MainMenu : Voltar
    Help --> MainMenu : Voltar
    
    MainMenu --> [*] : User logout

    note right of UserRegistration
        🔐 Autenticação via Telegram
        👤 Criação/busca de usuário
        💰 Saldo inicial: R$ 0,00
        📊 Configuração de sessão
    end note
    
    note right of Games
        🎮 Suporte a múltiplos jogos
        💰 Apostas de R$ 5,00 a R$ 1.000,00
        👥 Sistema multiplayer PvP
        ⏱️ Timeout de 15 minutos
    end note
    
    note right of Wallet
        💳 Transações em tempo real
        📊 Histórico completo
        🔒 Validações de segurança
        💰 Rake automático (5%)
    end note
```

---

## 8. Notificações em Tempo Real

```mermaid
sequenceDiagram
    participant U1 as 👤 Creator
    participant U2 as 👤 Joiner
    participant BOT as 🤖 Bot
    participant NS as 🔔 NotificationService
    participant GS as 🎮 GameService
    participant DB as 🗄️ Database

    %% Game Creation
    U1->>BOT: Create Game
    BOT->>GS: createGame()
    GS->>DB: INSERT game
    BOT->>U1: 🎯 Game #123 created<br/>⏳ Waiting for opponent...

    %% Player Joins
    U2->>BOT: Join Game #123
    BOT->>GS: joinGame(123, U2)
    GS->>DB: UPDATE game SET player2_id
    GS->>NS: notifyPlayerJoined()
    
    %% Real-time Notification
    NS->>BOT: Send notification to U1
    BOT->>U1: 🎮 Player2 joined your game!<br/>🆔 Game: #123<br/>[😎 Heads] [👑 Tails]
    
    BOT->>U2: ✅ You joined game #123<br/>⏳ Waiting for creator's move...

    %% Game Moves
    U1->>BOT: Choose Heads
    BOT->>GS: makeMove(123, U1, 'heads')
    GS->>DB: UPDATE game_data
    BOT->>U1: ⏳ Waiting for opponent...
    BOT->>U2: 🎯 Your turn to choose!<br/>[😎 Heads] [👑 Tails]

    U2->>BOT: Choose Tails
    BOT->>GS: makeMove(123, U2, 'tails')
    GS->>GS: processGameResult()
    GS->>DB: UPDATE game status='completed'

    %% Result Notifications
    alt U1 Wins
        BOT->>U1: 🎉 YOU WON!<br/>💰 Prize: R$ 19.00<br/>[🎮 Play Again]
        BOT->>U2: 😔 YOU LOST!<br/>💸 Lost: R$ 10.00<br/>[🎮 Try Again]
    else U2 Wins
        BOT->>U2: 🎉 YOU WON!<br/>💰 Prize: R$ 19.00<br/>[🎮 Play Again]
        BOT->>U1: 😔 YOU LOST!<br/>💸 Lost: R$ 10.00<br/>[🎮 Try Again]
    end

    %% Transaction Notifications
    GS->>NS: notifyBalanceUpdate()
    NS->>BOT: Send balance updates
    BOT->>U1: 💰 Balance updated: R$ 34.50
    BOT->>U2: 💰 Balance updated: R$ 5.75

    Note over U1,DB: Real-time notifications for all game events
    Note over NS: Notification service handles all user communications
    Note over GS: Game service triggers notifications at key events
```

---

## 📊 Resumo dos Fluxos

### 🎯 **Características Principais:**
- **Sistema Multiplayer PvP**: Coin Flip e Domino com oponentes reais
- **Notificações em Tempo Real**: Avisos instantâneos para todas as ações
- **Transações Automáticas**: Processamento seguro de apostas e prêmios
- **Estado Persistente**: Jogos podem ser pausados e retomados
- **Rake Automático**: 5% de comissão da casa calculada automaticamente

### 🎮 **Jogos Implementados:**
- **🪙 Coin Flip**: Multiplayer PvP, 1.95x payout, resultado instantâneo
- **🀱 Domino**: Multiplayer PvP, 1.9x payout, múltiplas rodadas, estado complexo
- **🔜 Em Desenvolvimento**: Dados, Pedra-Papel-Tesoura, Torneios

### 🔧 **Tecnologias:**
- **Backend**: Node.js + TypeScript + Telegraf.js
- **Database**: PostgreSQL + Drizzle ORM
- **Architecture**: Clean Architecture + Repository Pattern
- **Validation**: Zod schemas + middleware
- **Logging**: Winston + structured logging

### 📊 **Estatísticas:**
- **32+ Bot Handlers** documentados e funcionais
- **3 Services principais** (User, Game, Notification)
- **3 Repositories** (User, Game, Transaction)
- **2 Game Engines** completamente implementados
- **5 tipos de transação** (bet_win, bet_loss, deposit, withdrawal, rake)
- **Sistema de rake 5%** implementado automaticamente

### 💰 **Sistema Financeiro:**
- **Apostas**: R$ 5,00 a R$ 1.000,00
- **Rake**: 5% automático em todos os jogos
- **Transações**: Tempo real com histórico completo
- **Validações**: Saldo, limites, timeouts

---

*📝 Documentação gerada automaticamente - Baseada na análise completa do código*
*🔄 Última atualização: Janeiro 2025*

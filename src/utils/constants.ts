/* eslint-disable @typescript-eslint/no-explicit-any */
// Emojis
export const EMOJIS = {
  MONEY: '💰',
  GAME: '🎮',
  TROPHY: '🏆',
  FIRE: '🔥',
  CHART: '📊',
  DEPOSIT: '💳',
  WITHDRAW: '💸',
  PROFILE: '👤',
  RANKING: '🏅',
  HISTORY: '📋',
  RULES: '📖',
  SUPPORT: '🆘',
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  WAITING: '⏳',
  PLAY: '▶️',
  PAUSE: '⏸️',
  STOP: '⏹️',
  COIN: '🪙',
  DICE: '🎲',
  ROCK: '🪨',
  PAPER: '📄',
  SCISSORS: '✂️',
  DOMINO: '🀄',
  HEADS: '😎',
  TAILS: '👑',
  WALLET: '💼',
  HELP: '❓',
  BACK: '⬅️',
  BALANCE: '💰',
  STATS: '📊',
  USERS: '👥',
  COINS: '🪙',
  GAMES: '🎯',
  SETTINGS: '⚙️',
  QUESTION: '❓',
  CUSTOM: '✏️',
  CHECK: '✅',
  CROSS: '❌',
  INACTIVE: '🚫',
  EXIT: '🚪',
  HOME: '🏠',
} as const;

export const GAME_TYPES = {
  COIN_FLIP: 'coin_flip',
  ROCK_PAPER_SCISSORS: 'rock_paper_scissors',
  DICE: 'dice',
  TOURNAMENT: 'tournament',
  DOMINO: 'domino',
} as const;

// Messages
export const MESSAGES = {
  // Welcome messages
  WELCOME_NEW_USER: (name?: string) => `🎉 Bem-vindo, ${name || 'jogador'}!\n\nSua conta foi criada com sucesso!\n💰 Saldo inicial: R$ 0,00`,
  WELCOME_BACK: (name?: string) => `👋 Olá novamente, ${name || 'jogador'}!`,
  
  // Menu messages
  MAIN_MENU: '🎮 *Menu Principal*\n\nEscolha uma opção:',
  GAME_MENU: '🎮 *Menu de Jogos*\n\nEscolha um jogo para começar:',
  
  // Wallet messages
  WALLET_MENU: (balance: string) => `💼 *Carteira*\n\n💰 Saldo: R$ ${balance}\n\nEscolha uma opção:`,
  BALANCE_INFO: (balance: string) => `💰 *Seu Saldo*\n\nSaldo atual: R$ ${balance}`,
  
  // Game specific messages
  SELECT_BET_AMOUNT: '💰 *Selecione o valor da aposta:*',
  COIN_FLIP_CHOICE: (amount: number) => `🪙 *Cara ou Coroa* - R$ ${amount.toFixed(2)}\n\nEscolha sua aposta:`,
  COIN_FLIP_MULTIPLAYER_OPTIONS: '🪙 *Cara ou Coroa - Multiplayer*\n\nEste jogo é sempre entre duas pessoas!\n\nEscolha uma opção:',
  
  // Domino specific messages
  DOMINO_MULTIPLAYER_OPTIONS: '🀱 *Dominó - Multiplayer*\n\nJogo estratégico para 2 jogadores!\n\nEscolha uma opção:',
  
  // Multiplayer messages
  GAME_CREATED_WAITING: (gameId: number, amount: number) => 
    `🎮 *Partida Criada!*\n\n💰 Valor: R$ ${amount.toFixed(2)}\n🆔 ID: #${gameId}\n⏳ Aguardando adversário...\n\nCompartilhe o ID com alguém para jogar!`,
  
  AVAILABLE_GAMES: '🔍 *Partidas Disponíveis*\n\nEscolha uma partida para entrar:',
  NO_AVAILABLE_GAMES: '😔 *Nenhuma partida disponível*\n\nCrie uma nova partida ou tente novamente mais tarde.',
  
  GAME_JOINED: (gameId: number, creatorName: string, amount: number) => 
    `🎮 *Você entrou na partida!*\n\n🆔 ID: #${gameId}\n👤 Adversário: ${creatorName}\n💰 Valor: R$ ${amount.toFixed(2)}\n\nFaça sua escolha:`,
  
  OPPONENT_JOINED: (playerName: string) => 
    `🎮 *${playerName} entrou na sua partida!*\n\nAgora faça sua escolha:`,
  
  WAITING_OPPONENT_MOVE: '⏳ *Aguardando jogada do adversário...*\n\nSua escolha foi registrada!',
  
  MULTIPLAYER_RESULT_WIN: (gameId: number, amount: number, opponentChoice: string, yourChoice: string, opponentName: string) => 
    `🎉 *VOCÊ GANHOU!*\n\n🆔 Partida: #${gameId}\n💰 Prêmio: R$ ${amount.toFixed(2)}\n👤 Adversário: ${opponentName}\n\nVocê: ${yourChoice}\nAdversário: ${opponentChoice}`,
  
  MULTIPLAYER_RESULT_LOSE: (gameId: number, amount: number, opponentChoice: string, yourChoice: string, opponentName: string) => 
    `😔 *VOCÊ PERDEU!*\n\n🆔 Partida: #${gameId}\n💸 Perdeu: R$ ${amount.toFixed(2)}\n👤 Adversário: ${opponentName}\n\nVocê: ${yourChoice}\nAdversário: ${opponentChoice}`,
  
  // Game results
  COIN_FLIP_WIN: (bet: number, win: number, playerChoice: string, result: string) => 
    `🎉 *VOCÊ GANHOU!*\n\n💰 Aposta: R$ ${bet.toFixed(2)}\n🏆 Ganhos: R$ ${win.toFixed(2)}\n\nVocê escolheu: ${playerChoice}\nResultado: ${result}`,
  
  COIN_FLIP_LOSE: (bet: number, playerChoice: string, result: string) => 
    `😔 *VOCÊ PERDEU!*\n\n💸 Aposta perdida: R$ ${bet.toFixed(2)}\n\nVocê escolheu: ${playerChoice}\nResultado: ${result}`,
  
  COIN_FLIP_TIE: (bet: number, playerChoice: string, result: string) => 
    `🤝 *EMPATE!*\n\n💰 Aposta devolvida: R$ ${bet.toFixed(2)}\n\nVocê: ${playerChoice}\nBot: ${result}`,
  
  // Error messages
  ERROR_GENERIC: '❌ Ocorreu um erro inesperado.\n\nTente novamente em alguns instantes.',
  USER_NOT_FOUND: '❌ Usuário não encontrado!',
  INSUFFICIENT_BALANCE: '❌ Saldo insuficiente!\n💰 Seu saldo atual é insuficiente para esta aposta.',
  INVALID_SESSION: '❌ Sessão inválida!\n\nTente novamente.',
  
  // Help messages
  HELP_MAIN: '❓ *Ajuda do GameBot*\n\nEscolha um tópico para mais informações:',
  
  // Profile messages
  PROFILE_INFO: (user: any) => `👤 *Seu Perfil*\n\nNome: ${user.firstName} ${user.lastName || ''}\nUsername: @${user.username || 'não definido'}\nSaldo: R$ ${user.balance}\nMembro desde: ${new Date(user.createdAt).toLocaleDateString('pt-BR')}`,
  
  // Game creation
  GAME_CREATED: (gameId: number, gameType: string, amount: number) => 
    `🎮 Partida criada!\n\n🎯 Jogo: ${gameType}\n💰 Valor: R$ ${amount.toFixed(2)}\n🆔 ID: ${gameId}`,
  
  // Domino specific messages
  DOMINO_GAME_CREATED: (gameId: number, amount: number) => 
    `🀱 *Partida de Dominó Criada!*\n\n💰 Valor: R$ ${amount.toFixed(2)}\n🆔 ID: #${gameId}\n⏳ Aguardando adversário...\n\nCompartilhe o ID para jogar!`,
  
  DOMINO_GAME_JOINED: (gameId: number, creatorName: string, amount: number) => 
    `🀱 *Você entrou na partida de Dominó!*\n\n🆔 ID: #${gameId}\n👤 Adversário: ${creatorName}\n💰 Valor: R$ ${amount.toFixed(2)}\n\nO jogo está começando...`,
  
  DOMINO_YOUR_TURN: '⚡ *É SUA VEZ!*\n\nEscolha uma peça para jogar:',
  DOMINO_WAITING_OPPONENT: '💤 *Aguardando adversário...*\n\nSua jogada foi registrada!',
  DOMINO_NO_MOVES: '❌ *Sem jogadas possíveis!*\n\nVocê deve passar a vez.',
  
  DOMINO_RESULT_WIN: (gameId: number, amount: number, details: string) => 
    `🏆 *VOCÊ GANHOU NO DOMINÓ!*\n\n🆔 Partida: #${gameId}\n💰 Prêmio: R$ ${amount.toFixed(2)}\n\n${details}`,
  
  DOMINO_RESULT_LOSE: (gameId: number, amount: number, details: string) => 
    `😔 *VOCÊ PERDEU NO DOMINÓ!*\n\n🆔 Partida: #${gameId}\n💸 Perdeu: R$ ${amount.toFixed(2)}\n\n${details}`,
  
  DOMINO_RESULT_TIE: (gameId: number, details: string) => 
    `🤝 *EMPATE NO DOMINÓ!*\n\n🆔 Partida: #${gameId}\n💰 Aposta devolvida\n\n${details}`,
} as const;

// Bet amounts (in cents for precision)
export const BET_AMOUNTS = [500, 1000, 2500, 5000, 10000] as const; // R$ 5, 10, 25, 50, 100

// Game choices
export const COIN_CHOICES = {
  HEADS: 'heads',
  TAILS: 'tails',
} as const;

export const COIN_CHOICE_LABELS = {
  heads: '😎 Cara',
  tails: '👑 Coroa',
} as const;

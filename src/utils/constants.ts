/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Coleção de emojis utilizados em toda a aplicação.
 * 
 * Padroniza os emojis para consistência visual e facilita
 * manutenção através de referências centralizadas.
 */
export const EMOJIS = {
  /** Emoji de dinheiro/prêmio */
  MONEY: '💰',
  /** Emoji de jogo/gaming */
  GAME: '🎮',
  /** Emoji de troféu/vitória */
  TROPHY: '🏆',
  /** Emoji de fogo/destaque */
  FIRE: '🔥',
  /** Emoji de gráfico/estatísticas */
  CHART: '📊',
  /** Emoji de depósito/cartão */
  DEPOSIT: '💳',
  /** Emoji de saque/dinheiro saindo */
  WITHDRAW: '💸',
  /** Emoji de perfil/usuário */
  PROFILE: '👤',
  /** Emoji de ranking/medalha */
  RANKING: '🏅',
  /** Emoji de histórico/lista */
  HISTORY: '📋',
  /** Emoji de regras/livro */
  RULES: '📖',
  /** Emoji de suporte/ajuda */
  SUPPORT: '🆘',
  /** Emoji de sucesso/confirmação */
  SUCCESS: '✅',
  /** Emoji de erro/falha */
  ERROR: '❌',
  /** Emoji de aviso/atenção */
  WARNING: '⚠️',
  /** Emoji de informação */
  INFO: 'ℹ️',
  /** Emoji de aguardando/tempo */
  WAITING: '⏳',
  /** Emoji de jogar/iniciar */
  PLAY: '▶️',
  /** Emoji de pausar */
  PAUSE: '⏸️',
  /** Emoji de parar */
  STOP: '⏹️',
  /** Emoji de moeda */
  COIN: '🪙',
  /** Emoji de dado */
  DICE: '🎲',
  /** Emoji de pedra */
  ROCK: '🪨',
  /** Emoji de papel */
  PAPER: '📄',
  /** Emoji de tesoura */
  SCISSORS: '✂️',
  /** Emoji de dominó */
  DOMINO: '🀄',
  /** Emoji para cara da moeda */
  HEADS: '😎',
  /** Emoji para coroa da moeda */
  TAILS: '👑',
  /** Emoji de carteira */
  WALLET: '💼',
  /** Emoji de ajuda/pergunta */
  HELP: '❓',
  /** Emoji de voltar */
  BACK: '⬅️',
  /** Emoji de saldo */
  BALANCE: '💰',
  /** Emoji de estatísticas */
  STATS: '📊',
  /** Emoji de usuários */
  USERS: '👥',
  /** Emoji de moedas */
  COINS: '🪙',
  /** Emoji de jogos */
  GAMES: '🎯',
  /** Emoji de configurações */
  SETTINGS: '⚙️',
  /** Emoji de pergunta */
  QUESTION: '❓',
  /** Emoji de customização */
  CUSTOM: '✏️',
  /** Emoji de check/confirmação */
  CHECK: '✅',
  /** Emoji de X/cancelar */
  CROSS: '❌',
  /** Emoji de inativo */
  INACTIVE: '🚫',
  /** Emoji de sair */
  EXIT: '🚪',
  /** Emoji de home/início */
  HOME: '🏠',
} as const;

/**
 * Identificadores dos tipos de jogos suportados.
 * 
 * Constantes para referenciar tipos de jogos de forma
 * type-safe em todo o sistema.
 */
export const GAME_TYPES = {
  /** Jogo Cara ou Coroa */
  /** Jogo Cara ou Coroa */
  COIN_FLIP: 'coin_flip',
  /** Jogo Pedra, Papel, Tesoura */
  ROCK_PAPER_SCISSORS: 'rock_paper_scissors',
  /** Jogo de Dados */
  DICE: 'dice',
  /** Torneios eliminatórios */
  TOURNAMENT: 'tournament',
  /** Jogo de Dominó */
  DOMINO: 'domino',
} as const;

/**
 * Mensagens padronizadas utilizadas no bot do Telegram.
 * 
 * Centraliza todos os textos exibidos aos usuários para facilitar
 * manutenção, tradução e consistência na comunicação.
 */
export const MESSAGES = {
  /** Mensagens de boas-vindas */
  
  /** Mensagem para novos usuários */
  WELCOME_NEW_USER: (name?: string) => `🎉 Bem-vindo, ${name || 'jogador'}!\n\nSua conta foi criada com sucesso!\n💰 Saldo inicial: R$ 0,00`,
  
  /** Mensagem para usuários retornando */
  WELCOME_BACK: (name?: string) => `👋 Olá novamente, ${name || 'jogador'}!`,
  
  /** Mensagens de menu */
  
  /** Menu principal do bot */
  MAIN_MENU: '🎮 *Menu Principal*\n\nEscolha uma opção:',
  
  /** Menu de seleção de jogos */
  GAME_MENU: '🎮 *Menu de Jogos*\n\nEscolha um jogo para começar:',
  
  /** Mensagens de carteira/saldo */
  
  /** Menu da carteira com saldo */
  WALLET_MENU: (balance: string) => `💼 *Carteira*\n\n💰 Saldo: R$ ${balance}\n\nEscolha uma opção:`,
  
  /** Informação de saldo atual */
  BALANCE_INFO: (balance: string) => `💰 *Seu Saldo*\n\nSaldo atual: R$ ${balance}`,
  
  /** Mensagens específicas de jogos */
  
  /** Seleção de valor de aposta */
  SELECT_BET_AMOUNT: '💰 *Selecione o valor da aposta:*',
  
  /** Seleção no Cara ou Coroa */
  COIN_FLIP_CHOICE: (amount: number) => `🪙 *Cara ou Coroa* - R$ ${amount.toFixed(2)}\n\nEscolha sua aposta:`,
  
  /** Opções multiplayer Cara ou Coroa */
  COIN_FLIP_MULTIPLAYER_OPTIONS: '🪙 *Cara ou Coroa - Multiplayer*\n\nEste jogo é sempre entre duas pessoas!\n\nEscolha uma opção:',
  
  /** Mensagens específicas do Dominó */
  
  /** Opções multiplayer Dominó */
  DOMINO_MULTIPLAYER_OPTIONS: '🀱 *Dominó - Multiplayer*\n\nJogo estratégico para 2 jogadores!\n\nEscolha uma opção:',
  
  /** Mensagens de jogos multiplayer */
  
  /** Confirmação de jogo criado */
  GAME_CREATED_WAITING: (gameId: number, amount: number) => 
    `🎮 *Partida Criada!*\n\n💰 Valor: R$ ${amount.toFixed(2)}\n🆔 ID: #${gameId}\n⏳ Aguardando adversário...\n\nCompartilhe o ID com alguém para jogar!`,
  
  /** Lista de jogos disponíveis */
  AVAILABLE_GAMES: '🔍 *Partidas Disponíveis*\n\nEscolha uma partida para entrar:',
  
  /** Quando não há jogos disponíveis */
  NO_AVAILABLE_GAMES: '😔 *Nenhuma partida disponível*\n\nCrie uma nova partida ou tente novamente mais tarde.',
  
  /** Confirmação de entrada em jogo */
  GAME_JOINED: (gameId: number, creatorName: string, amount: number) => 
    `🎮 *Você entrou na partida!*\n\n🆔 ID: #${gameId}\n👤 Adversário: ${creatorName}\n💰 Valor: R$ ${amount.toFixed(2)}\n\nFaça sua escolha:`,
  
  /** Notificação para criador quando alguém entra */
  OPPONENT_JOINED: (playerName: string) => 
    `🎮 *${playerName} entrou na sua partida!*\n\nAgora faça sua escolha:`,
  
  /** Aguardando jogada do oponente */
  WAITING_OPPONENT_MOVE: '⏳ *Aguardando jogada do adversário...*\n\nSua escolha foi registrada!',
  
  /** Resultado de vitória multiplayer */
  MULTIPLAYER_RESULT_WIN: (gameId: number, amount: number, opponentChoice: string, yourChoice: string, opponentName: string) => 
    `🎉 *VOCÊ GANHOU!*\n\n🆔 Partida: #${gameId}\n💰 Prêmio: R$ ${amount.toFixed(2)}\n👤 Adversário: ${opponentName}\n\nVocê: ${yourChoice}\nAdversário: ${opponentChoice}`,
  
  /** Resultado de derrota multiplayer */
  MULTIPLAYER_RESULT_LOSE: (gameId: number, amount: number, opponentChoice: string, yourChoice: string, opponentName: string) => 
    `😔 *VOCÊ PERDEU!*\n\n🆔 Partida: #${gameId}\n💸 Perdeu: R$ ${amount.toFixed(2)}\n👤 Adversário: ${opponentName}\n\nVocê: ${yourChoice}\nAdversário: ${opponentChoice}`,
  
  /** Resultados de jogos single-player */
  
  /** Vitória no Cara ou Coroa */
  COIN_FLIP_WIN: (bet: number, win: number, playerChoice: string, result: string) => 
    `🎉 *VOCÊ GANHOU!*\n\n💰 Aposta: R$ ${bet.toFixed(2)}\n🏆 Ganhos: R$ ${win.toFixed(2)}\n\nVocê escolheu: ${playerChoice}\nResultado: ${result}`,
  
  /** Derrota no Cara ou Coroa */
  COIN_FLIP_LOSE: (bet: number, playerChoice: string, result: string) => 
    `😔 *VOCÊ PERDEU!*\n\n💸 Aposta perdida: R$ ${bet.toFixed(2)}\n\nVocê escolheu: ${playerChoice}\nResultado: ${result}`,
  
  /** Empate no Cara ou Coroa */
  COIN_FLIP_TIE: (bet: number, playerChoice: string, result: string) => 
    `🤝 *EMPATE!*\n\n💰 Aposta devolvida: R$ ${bet.toFixed(2)}\n\nVocê: ${playerChoice}\nBot: ${result}`,
  
  /** Mensagens de erro */
  
  /** Erro genérico */
  ERROR_GENERIC: '❌ Ocorreu um erro inesperado.\n\nTente novamente em alguns instantes.',
  
  /** Usuário não encontrado */
  USER_NOT_FOUND: '❌ Usuário não encontrado!',
  
  /** Saldo insuficiente */
  INSUFFICIENT_BALANCE: '❌ Saldo insuficiente!\n💰 Seu saldo atual é insuficiente para esta aposta.',
  
  /** Sessão inválida */
  INVALID_SESSION: '❌ Sessão inválida!\n\nTente novamente.',
  
  /** Mensagens de ajuda */
  
  /** Menu principal de ajuda */
  HELP_MAIN: '❓ *Ajuda do GameBot*\n\nEscolha um tópico para mais informações:',
  
  /** Mensagens de perfil */
  
  /** Informações do perfil do usuário */
  PROFILE_INFO: (user: any) => `👤 *Seu Perfil*\n\nNome: ${user.firstName} ${user.lastName || ''}\nUsername: @${user.username || 'não definido'}\nSaldo: R$ ${user.balance}\nMembro desde: ${new Date(user.createdAt).toLocaleDateString('pt-BR')}`,
  
  /** Criação de jogos */
  
  /** Confirmação de jogo criado */
  GAME_CREATED: (gameId: number, gameType: string, amount: number) => 
    `🎮 Partida criada!\n\n🎯 Jogo: ${gameType}\n💰 Valor: R$ ${amount.toFixed(2)}\n🆔 ID: ${gameId}`,
  
  /** Mensagens específicas do Dominó */
  
  /** Jogo de Dominó criado */
  DOMINO_GAME_CREATED: (gameId: number, amount: number) => 
    `🀱 *Partida de Dominó Criada!*\n\n💰 Valor: R$ ${amount.toFixed(2)}\n🆔 ID: #${gameId}\n⏳ Aguardando adversário...\n\nCompartilhe o ID para jogar!`,
  
  /** Entrada em jogo de Dominó */
  DOMINO_GAME_JOINED: (gameId: number, creatorName: string, amount: number) => 
    `🀱 *Você entrou na partida de Dominó!*\n\n🆔 ID: #${gameId}\n👤 Adversário: ${creatorName}\n💰 Valor: R$ ${amount.toFixed(2)}\n\nO jogo está começando...`,
  
  /** É a vez do jogador no Dominó */
  DOMINO_YOUR_TURN: '⚡ *É SUA VEZ!*\n\nEscolha uma peça para jogar:',
  
  /** Aguardando oponente no Dominó */
  DOMINO_WAITING_OPPONENT: '💤 *Aguardando adversário...*\n\nSua jogada foi registrada!',
  
  /** Sem jogadas possíveis no Dominó */
  DOMINO_NO_MOVES: '❌ *Sem jogadas possíveis!*\n\nVocê deve passar a vez.',
  
  /** Vitória no Dominó */
  DOMINO_RESULT_WIN: (gameId: number, amount: number, details: string) => 
    `🏆 *VOCÊ GANHOU NO DOMINÓ!*\n\n🆔 Partida: #${gameId}\n💰 Prêmio: R$ ${amount.toFixed(2)}\n\n${details}`,
  
  /** Derrota no Dominó */
  DOMINO_RESULT_LOSE: (gameId: number, amount: number, details: string) => 
    `😔 *VOCÊ PERDEU NO DOMINÓ!*\n\n🆔 Partida: #${gameId}\n💸 Perdeu: R$ ${amount.toFixed(2)}\n\n${details}`,
  
  /** Empate no Dominó */
  DOMINO_RESULT_TIE: (gameId: number, details: string) => 
    `🤝 *EMPATE NO DOMINÓ!*\n\n🆔 Partida: #${gameId}\n💰 Aposta devolvida\n\n${details}`,
} as const;

/**
 * Valores de aposta disponíveis no sistema.
 * 
 * Valores em centavos para precisão matemática,
 * evitando problemas de ponto flutuante.
 */
export const BET_AMOUNTS = [500, 1000, 2500, 5000, 10000] as const; // R$ 5, 10, 25, 50, 100

/**
 * Escolhas possíveis no jogo Cara ou Coroa.
 */
export const COIN_CHOICES = {
  /** Cara da moeda */
  HEADS: 'heads',
  /** Coroa da moeda */
  TAILS: 'tails',
} as const;

/**
 * Rótulos visuais para as escolhas de Cara ou Coroa.
 * 
 * Mapeia as escolhas para suas representações visuais
 * com emoji e texto em português.
 */
export const COIN_CHOICE_LABELS = {
  /** Rótulo para cara */
  heads: '😎 Cara',
  /** Rótulo para coroa */
  tails: '👑 Coroa',
} as const;

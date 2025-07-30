'use strict';

// ===========================================
// ゲーム状態管理
// ===========================================

const gameState = {

  // ゲーム設定
  totalPlayers: 4, // プレイヤー総数
  timerMinutes: 3, // 制限時間（分）
  gameMode: 'tamed', // ゲームモード

  // プレイヤー情報
  players: [], // プレイヤー情報
  master: null, // マスター

  // ゲーム進行
  currentScreen: 'setup', // 現在の画面
  currentPlayerIndex: 0, // プレイヤー順次操作画面用
  roundCount: 0, // ラウンド数

  // ワード設定
  villagerWord: '', // 村人ワード
  wolfWord: '', // ウルフワード

  // 配役
  wolfIndex: null, // ウルフのインデックス

  // タイマー
  timer: null, // タイマーのインターバルID
  timeRemaining: 0, // 残り時間
  isTimerPaused: false, // タイマーの一時停止フラグ

  // 投票情報
  accusedPlayer: [], // 最多投票者
  isVoting: false, // 投票中フラグ
  isVoteEnded: false, // 投票終了フラグ

  // ウルフの勝利判定
  isWolfWinner: null, // ウルフの勝利判定フラグ

  // 逆転チャンス
  wolfGuess: '',

}

// ===========================================
//  ワードセット
// ===========================================

let wordSets = [];

// JSONファイルからワードセットを読み込み
async function loadWordSets() {
  try {
    const response = await fetch('wordsets.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    wordSets = (await response.json()).wordSets;
    console.log('ワードセットを読み込みました:', wordSets.length, 'セット');
  } catch (error) {
    console.error('ワードセットの読み込みに失敗しました:', error);

    // フォールバック用のデフォルトワードセット
    wordSets = [
      {
        word1: 'りんご',
        word2: 'みかん'
      },
      {
        word1: 'コーヒー',
        word2: '紅茶'
      },
      {
        word1: '猫',
        word2: '犬'
      }
    ];
  }
}

// ===========================================
//  DOM要素の取得
// ===========================================

const elements = {

  // 画面（プログラムとしては現状未使用（一覧の明示目的））
  topPage: document.getElementById('top-page'),
  setupScreen: document.getElementById('setup-screen'),
  wordSetScreen: document.getElementById('word-set-screen'),
  wordDistributionScreen: document.getElementById('word-distribution-screen'),
  discussionScreen: document.getElementById('discussion-screen'),
  voteScreen: document.getElementById('vote-screen'),
  voteResultScreen: document.getElementById('vote-result-screen'),
  wolfChanceScreen: document.getElementById('wolf-chance-screen'),
  wolfChanceResultScreen: document.getElementById('wolf-chance-result-screen'),
  gameResultScreen: document.getElementById('game-result-screen'),
  finalResultScreen: document.getElementById('final-result-screen'),

  // モーダルマスク
  modalMask: document.getElementById('modal-mask'),
  // ラウンドカウント
  roundCount: document.getElementById('round-count'),

  // ヘルプ画面
  helpModal: document.getElementById('help-modal'),
  helpModalMask: document.getElementById('help-modal-mask'),
  showHelpBtn: document.getElementById('show-help-btn'),
  closeHelpBtn: document.getElementById('close-help-btn'),

  // トップページ
  startNewGameBtn: document.getElementById('start-new-game-btn'),
  continueGameBtn: document.getElementById('continue-game-btn'),

  // 設定画面
  tamedMode: document.getElementById('tamed-mode'),
  wildMode: document.getElementById('wild-mode'),
  gameModeLabel: document.querySelectorAll('.setup-screen__form-toggle-label'),
  gameModeSlider: document.getElementById('game-mode-slider'),
  gameModeDescription: document.getElementById('game-mode-description'),
  totalPlayers: document.getElementById('total-players'),
  totalPlayersCautionText: document.getElementById('total-players-caution-text'),
  playerNamesContainer: document.getElementById('player-names-container'),
  timerMinutes: document.getElementById('timer-minutes'),
  startGameBtn: document.getElementById('start-game-btn'),

  // ワードセット画面（家畜モード）
  wordSetMasterPlayer: document.getElementById('word-set-master-player'),
  wordSetVillagerWord: document.getElementById('word-set-villager-word'),
  wordSetWolfWord: document.getElementById('word-set-wolf-word'),
  wordSetErrorText: document.getElementById('word-set-error-text'),
  wordSetSwapWordsBtn: document.getElementById('word-set-swap-words-btn'),
  wordSetConfirmBtn: document.getElementById('word-set-confirm-btn'),

  // ワード配布画面
  currentPlayerName: document.getElementById('current-player-name'),
  WordDistributionCurrentText: document.getElementById('word-distribution-current-text'),
  revealWordBtn: document.getElementById('reveal-word-btn'),
  wordModal: document.getElementById('word-modal'),
  wordModalPlayerName: document.getElementById('word-modal-player-name'),
  modalWord: document.getElementById('modal-word'),
  nextPlayerBtn: document.getElementById('next-player-btn'),
  showDiscussionBtn: document.getElementById('show-discussion-btn'),

  // 討論画面
  timerDisplay: document.getElementById('timer-display'),
  startTimerBtn: document.getElementById('start-timer-btn'),
  pauseTimerBtn: document.getElementById('pause-timer-btn'),
  resumeTimerBtn: document.getElementById('resume-timer-btn'),
  endDiscussionBtn: document.getElementById('end-discussion-btn'),
  wolfSound: document.getElementById('wolf-sound'),
  masterPlayerName: document.getElementById('master-player-name'),
  playersList: document.getElementById('players-list'),

  // 投票画面
  startVoteBtn: document.getElementById('start-vote-btn'),
  voteResultBtn: document.getElementById('vote-result-btn'),
  continueDiscussionBtn: document.getElementById('continue-discussion-btn'),
  voteModal: document.getElementById('vote-modal'),
  voteModalPlayerName: document.getElementById('vote-modal-player-name'),
  voteModalOptions: document.getElementById('vote-modal-options'),
  voteModalSubmitBtn: document.getElementById('vote-modal-submit-btn'),

  // 投票結果画面
  voteResultAccusedPlayer: document.getElementById('vote-result-accused-player'),
  voteResultSuccess: document.getElementById('vote-result-success'),
  voteResultFailure: document.getElementById('vote-result-failure'),
  voteResultWolfPlayer: document.querySelectorAll('.vote-result-screen__wolf-player'),
  voteResultVoltHistoryList: document.getElementById('vote-result-volt-history-list'),
  wolfChanceBtn: document.getElementById('wolf-chance-btn'),
  gameResultBtnVote: document.getElementById('game-result-btn-vote'),

  // 逆転チャンス画面
  wolfGuess: document.getElementById('wolf-guess'),
  submitGuessBtn: document.getElementById('submit-guess-btn'),

  // 逆転チャンス結果画面
  wolfGuessDisplay: document.getElementById('wolf-guess-display'),
  wolfChanceResultSuccess: document.getElementById('wolf-chance-result-success'),
  wolfChanceResultFailure: document.getElementById('wolf-chance-result-failure'),
  wolfChanceResultVillagerWord: document.querySelectorAll('.wolf-chance-result-screen__villager-word'),
  gameResultBtnWolfChance: document.getElementById('game-result-btn-wolf-chance'),
  modifyResultBtn: document.getElementById('modify-result-btn'),

  // 結果画面
  gameResultTitle: document.getElementById('game-result-title'),
  gameResultVillager: document.getElementById('game-result-villager'),
  gameResultWolf: document.getElementById('game-result-wolf'),
  scoreList: document.getElementById('score-list'),
  nextGameBtn: document.getElementById('next-game-btn'),
  endGameBtn: document.getElementById('end-game-btn'),

  // 最終結果画面
  endResultScoreList: document.getElementById('end-result-score-list'),
  backToTopBtn: document.getElementById('back-to-top-btn'),
}

// ===========================================
//  初期化
// ===========================================

async function init() {
  await loadWordSets();
  setupEventListeners();
  setupTopPage();
}

// ===========================================
//  イベントリスナーの設定
// ===========================================

function setupEventListeners() {

  // ヘルプ画面
  elements.showHelpBtn.addEventListener('click', showHelpScreenModal);
  elements.closeHelpBtn.addEventListener('click', closeHelpScreenModal);
  elements.helpModalMask.addEventListener('click', maskClickToCloseHelp);

  // トップページ
  elements.startNewGameBtn.addEventListener('click', () => {
    initGameState();
    showSetupScreen();
  });

  elements.continueGameBtn.addEventListener('click', () => {
    loadGameState();
    showScreen(gameState.currentScreen);
  });

  // 設定画面
  elements.totalPlayers.addEventListener('change', (e) => {
    validateNumberInput(e);
    updatePlayerNameInputs();
  });
  elements.timerMinutes.addEventListener('change', (e) => { validateNumberInput(e); });
  elements.tamedMode.addEventListener('change', (e) => { updateGameMode(e); });
  elements.wildMode.addEventListener('change', (e) => { updateGameMode(e); });
  elements.startGameBtn.addEventListener('click', registerGameSettings);

  // ワードセット画面
  elements.wordSetVillagerWord.addEventListener('input', validateWordInput);
  elements.wordSetWolfWord.addEventListener('input', validateWordInput);
  elements.wordSetSwapWordsBtn.addEventListener('click', wordSetSwap);
  elements.wordSetConfirmBtn.addEventListener('click', settingTamedModeWords);

  // ワード配布画面
  elements.revealWordBtn.addEventListener('click', showWordModal);
  elements.nextPlayerBtn.addEventListener('click', nextPlayer);
  elements.showDiscussionBtn.addEventListener('click', showDiscussionScreen);

  // 討論画面
  elements.startTimerBtn.addEventListener('click', startDiscussion);
  elements.pauseTimerBtn.addEventListener('click', pauseTimer);
  elements.resumeTimerBtn.addEventListener('click', resumeTimer);
  elements.endDiscussionBtn.addEventListener('click', endDiscussion);

  // 投票画面
  elements.startVoteBtn.addEventListener('click', startVote);
  elements.continueDiscussionBtn.addEventListener('click', showDiscussionScreen);
  elements.voteModalSubmitBtn.addEventListener('click', submitVote);
  elements.voteResultBtn.addEventListener('click', isWolfAccused);

  // 投票結果画面
  elements.wolfChanceBtn.addEventListener('click', showWolfChanceScreen);
  elements.gameResultBtnVote.addEventListener('click', calculateScore);

  // 逆転チャンス画面
  elements.wolfGuess.addEventListener('input', validateGuessInput);
  elements.submitGuessBtn.addEventListener('click', submitWolfGuess);

  // 逆転チャンス結果画面
  elements.gameResultBtnWolfChance.addEventListener('click', calculateScore);
  elements.modifyResultBtn.addEventListener('click', modifyWolfGuessResult);

  // ゲーム結果画面
  elements.nextGameBtn.addEventListener('click', setupRound);
  elements.endGameBtn.addEventListener('click', showEndResultScreen);

  // 最終結果画面
  elements.backToTopBtn.addEventListener('click', backToTop);
}

// ===========================================
//  画面表示
// ===========================================

function showScreen(screenName) {

  // すべての画面を非表示
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('screen--active');
  });

  // 指定された画面を表示
  document.getElementById(`${screenName}-screen`).classList.add('screen--active');

  window.scrollTo(0, 0);
  gameState.currentScreen = screenName;
}

// ===========================================
//  トップページ
// ===========================================

// トップページのセットアップ
function setupTopPage() {
  // ゲーム状態が保存されていれば、続きからボタンを表示
  if (localStorage.getItem('wordWolfGameState')) {
    elements.continueGameBtn.disabled = false;
  } else {
    elements.continueGameBtn.disabled = true;
  }
}

// ===========================================
//  ヘルプ画面
// ===========================================


function showHelpScreenModal() {
  elements.helpModal.classList.add('help-screen__modal--active');
  elements.helpModalMask.classList.add('help-screen__modal-mask--active');
  elements.showHelpBtn.classList.remove('help-screen__btn--active');
}

function closeHelpScreenModal() {
  elements.helpModal.classList.remove('help-screen__modal--active');
  elements.helpModalMask.classList.remove('help-screen__modal-mask--active');
  elements.showHelpBtn.classList.add('help-screen__btn--active');
}

function maskClickToCloseHelp() {
  elements.closeHelpBtn.click();
}

// ===========================================
//  ゲーム設定画面
// ===========================================

function showSetupScreen() {
  showScreen('setup');
  updatePlayerNameInputs();
}

// プレイヤー名入力フィールド数の更新
function updatePlayerNameInputs() {
  const totalPlayers = parseInt(elements.totalPlayers.value);

  // 既存の入力値を保持
  const existingValues = [];
  const inputs = document.querySelectorAll('.setup-screen__form-input--player-name');
  inputs.forEach(input => {
    existingValues.push(input.value);
  });

  // 既存の入力フィールドをクリア
  elements.playerNamesContainer.innerHTML = '';

  // 新しい入力フィールドを作成
  for (let i = 0; i < totalPlayers; i++) {
    const playerForm = document.createElement('form');
    playerForm.className = 'setup-screen__form-group';
    playerForm.onsubmit = (e) => { e.preventDefault(); };

    const label = document.createElement('label');
    label.className = 'setup-screen__form-label';
    label.htmlFor = `player-name-${i + 1}`;
    label.textContent = `プレイヤー${i + 1}:`;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'setup-screen__form-input setup-screen__form-input--player-name';
    input.placeholder = '5文字以内で入力してください';
    input.id = label.htmlFor;
    input.maxLength = 5;

    // 既存フォームに入力がある場合引き継ぐ
    if (existingValues[i]) {
      input.value = existingValues[i];
    }

    playerForm.appendChild(label);
    playerForm.appendChild(input);
    elements.playerNamesContainer.appendChild(playerForm);
  }
}

// ゲームモード選択
function updateGameMode(e) {
  gameState.gameMode = e.target.value;
  elements.gameModeLabel.forEach(label => {
    label.classList.remove('setup-screen__form-toggle-label--active');
  });
  e.target.labels[0].classList.add('setup-screen__form-toggle-label--active');
  elements.gameModeSlider.className = `setup-screen__form-toggle-slider setup-screen__form-toggle-slider--${e.target.value}`;
  // ディスクリプションの表示
  elements.gameModeDescription.className = `setup-screen__form-description-frame setup-screen__form-description-frame--${e.target.value}`;

  validatePlayerCountByMode();
}

function validatePlayerCountByMode() {
  if (gameState.gameMode === 'tamed') {
    elements.totalPlayers.min = 4;
    elements.totalPlayers.max = 8;
  } else if (gameState.gameMode === 'wild') {
    elements.totalPlayers.min = 3;
    elements.totalPlayers.max = 7;
  }
  elements.totalPlayersCautionText.textContent = `プレイ人数：${elements.totalPlayers.min}～${elements.totalPlayers.max}人`;
  elements.totalPlayers.dispatchEvent(new Event('change', { bubbles: true }));
}

function validateNumberInput(e) {
  const input = e.target; // イベントの対象要素（input）
  const min = parseInt(input.min, 10); // inputのmin属性を取得
  const max = parseInt(input.max, 10); // inputのmax属性を取得
  let value = parseInt(input.value, 10); // inputのvalue属性を取得

  if (isNaN(value)) { // 数値でない場合はボタンを無効化
    elements.startGameBtn.disabled = true;
    return;
  } else { // 数値である場合はボタンを有効化
    elements.startGameBtn.disabled = false;
  }

  if (value < min) input.value = min; // 最小値未満の場合は最小値にする
  if (value > max) input.value = max; // 最大値より大きい場合は最大値にする
}

// ゲーム設定情報を登録
function registerGameSettings() {
  gameState.totalPlayers = parseInt(elements.totalPlayers.value);
  gameState.timerMinutes = parseInt(elements.timerMinutes.value);

  // プレイヤー情報を収集
  const playerNameInputs = document.querySelectorAll('.setup-screen__form-input--player-name');
  gameState.players = []; // 一旦クリア

  // プレイヤー情報を登録
  playerNameInputs.forEach((input, index) => {
    const name = input.value.trim() || `プレイヤー${index + 1}`;
    gameState.players.push({
      index: index,
      name: name,
      word: '',
      votedIndex: null, // 投票対象のインデックス
      votesReceived: 0,      // 投票された数
      score: 0,
      wolfCount: 0, // ウルフになった回数
    });
  });

  // ワード配布画面への遷移
  gameState.roundCount = 0;
  setupRound();
}

// ===========================================
//  ラウンドセット
// ===========================================

function setupRound() {
  if (gameState.gameMode === 'tamed') {
    initWordSetScreen();
  } else if (gameState.gameMode === 'wild') {
    settingWildModeWords();
    startRound();
  }
}

// スタートラウンド
function startRound() {
  gameState.roundCount++;
  assignWolfAndWords();

  gameState.currentPlayerIndex = 0;
  showWordDistributionScreen();
  roundCountAnimation();
}

// ウルフとワードを決定
function assignWolfAndWords() {
  // ウルフのインデックスを決定
  gameState.wolfIndex = Math.floor(Math.random() * gameState.players.length);
  gameState.players[gameState.wolfIndex].wolfCount++;

  // プレイヤーにワードを配布
  gameState.players.forEach(player => {
    player.word = player.index === gameState.wolfIndex ? gameState.wolfWord : gameState.villagerWord;
  });
}

function settingWildModeWords() {
  // ランダムにワードセットを選択し、どちらをウルフワードにするかもランダムに決定
  const selectedWordSet = wordSets[Math.floor(Math.random() * wordSets.length)];
  const isFirstWordWolf = Math.random() < 0.5; // 50%の確率で最初のワードをウルフワードにする

  if (isFirstWordWolf) {
    gameState.villagerWord = selectedWordSet.word2;
    gameState.wolfWord = selectedWordSet.word1;
  } else {
    gameState.villagerWord = selectedWordSet.word1;
    gameState.wolfWord = selectedWordSet.word2;
  }
}

// ラウンドカウントアニメーション
function roundCountAnimation() {
  elements.roundCount.textContent = `Round ${gameState.roundCount}`;
  elements.modalMask.classList.add('modal-mask--active');
  elements.roundCount.classList.add('modal-mask__round-count--active');
  // アニメーション中はヘルプボタンを非表示
  elements.showHelpBtn.classList.remove('help-screen__btn--active');

  setTimeout(() => {
    elements.modalMask.classList.remove('modal-mask--active');
    elements.roundCount.classList.remove('modal-mask__round-count--active');
    elements.showHelpBtn.classList.add('help-screen__btn--active');

  }, 2000);
}

// ===========================================
//  ワードセット画面（家畜モード）
// ===========================================

function initWordSetScreen() {
  assignMaster();
  showWordSetScreen();
}

// ワードセット画面を表示
function showWordSetScreen() {
  showScreen('word-set');
  setupWordSetScreen();
}

// ワードセット画面のUIを設定
function setupWordSetScreen() {
  elements.wordSetMasterPlayer.textContent = `マスターは${gameState.master.name}です`;
  elements.wordSetVillagerWord.value = '';
  elements.wordSetWolfWord.value = '';
  elements.wordSetConfirmBtn.disabled = true;

  saveGameState();
}

// マスターを選出
function assignMaster() {
  // マスターがいる場合はプレイヤー末尾に戻す
  if (gameState.master) {
    gameState.players.push(gameState.master);
  }
  // 先頭プレイヤーをマスターにする
  gameState.master = gameState.players.shift();

  // 全員のインデックスを再設定
  gameState.master.index = null;
  gameState.players.forEach((players, index) => {
    players.index = index;
  });
}

function validateWordInput() {
  const villager = elements.wordSetVillagerWord.value.trim();
  const wolf = elements.wordSetWolfWord.value.trim();

  if (!villager || !wolf) {
    elements.wordSetConfirmBtn.disabled = true;
    elements.wordSetErrorText.classList.remove('word-set-screen__form-error-text--active');
    return;
  }

  if (villager === wolf) {
    elements.wordSetErrorText.classList.add('word-set-screen__form-error-text--active');
    elements.wordSetConfirmBtn.disabled = true;
    return;
  }

  elements.wordSetErrorText.classList.remove('word-set-screen__form-error-text--active');
  elements.wordSetConfirmBtn.disabled = false;
}

function wordSetSwap() {
  const toWolfWord = elements.wordSetVillagerWord.value;
  const toVillagerWord = elements.wordSetWolfWord.value;
  elements.wordSetVillagerWord.value = toVillagerWord;
  elements.wordSetWolfWord.value = toWolfWord;
}

function settingTamedModeWords() {
  gameState.villagerWord = elements.wordSetVillagerWord.value.trim();
  gameState.wolfWord = elements.wordSetWolfWord.value.trim();

  startRound();
}

// ===========================================
//  ワード配布画面
// ===========================================

// ワード配布画面を表示
function showWordDistributionScreen() {
  showScreen('word-distribution');
  setupWordDistributionScreen();
}

// ワード配布画面のUIを設定
function setupWordDistributionScreen() {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer) return;

  const currentPlayerWord = `${currentPlayer.name}のワード`
  elements.currentPlayerName.textContent = currentPlayerWord;
  elements.WordDistributionCurrentText.textContent = `${currentPlayer.name}だけ確認してください`

  elements.wordModalPlayerName.textContent = currentPlayerWord;

  saveGameState();
}

// ワードモーダルを表示
function showWordModal() {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  elements.wordModal.classList.add('word-distribution-screen__modal--active');
  elements.modalMask.classList.add('modal-mask--active');

  elements.modalWord.textContent = currentPlayer.word;

  // 最後のプレイヤーかチェック
  if (gameState.currentPlayerIndex === gameState.players.length - 1) {
    elements.nextPlayerBtn.style.display = 'none';
    elements.showDiscussionBtn.style.display = 'inline-block';
  } else {
    elements.nextPlayerBtn.style.display = 'inline-block';
    elements.showDiscussionBtn.style.display = 'none';
  }
}

// ワードモーダルを閉じる
function closeWordModal() {
  elements.wordModal.classList.remove('word-distribution-screen__modal--active');
  elements.modalMask.classList.remove('modal-mask--active');
}

// 次のプレイヤーへ
function nextPlayer() {
  closeWordModal();
  setTimeout(() => {
    gameState.currentPlayerIndex++;
    showWordDistributionScreen();
  }, 100);
}

// ===========================================
//  討論画面
// ===========================================

// 討論画面を表示
function showDiscussionScreen() {
  closeWordModal();

  showScreen('discussion');
  setupDiscussionScreen();
}

// 討論画面のUIを設定
function setupDiscussionScreen() {
  createPlayersList();
  gameState.timeRemaining = gameState.timerMinutes * 60;
  gameState.isTimerPaused = false;

  // 討論開始ボタンを表示、タイマーコントロールは非表示
  elements.startTimerBtn.style.display = 'inline-block';
  elements.timerDisplay.textContent = `${gameState.timerMinutes.toString().padStart(2, '0')}:00`;
  elements.pauseTimerBtn.style.display = 'none';
  elements.resumeTimerBtn.style.display = 'none';
  elements.endDiscussionBtn.style.display = 'none';

  saveGameState();
}

// プレイヤー一覧を作成
function createPlayersList() {
  if (gameState.gameMode === 'tamed') {
    elements.masterPlayerName.textContent = `マスター：${gameState.master.name}`
  }
  elements.playersList.innerHTML = '';

  gameState.players.forEach(player => {
    const listItem = document.createElement('li');
    listItem.className = 'discussion-screen__player-item';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'discussion-screen__player-item-header';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'discussion-screen__player-item-name';
    nameSpan.textContent = player.name;

    const scoreSpan = document.createElement('span');
    scoreSpan.className = 'discussion-screen__player-item-score';
    scoreSpan.textContent = `${player.score}点`;

    const wordDiv = document.createElement('div');
    wordDiv.className = 'discussion-screen__player-item-word';
    wordDiv.textContent = `${player.word}`;

    headerDiv.appendChild(nameSpan);
    headerDiv.appendChild(scoreSpan);
    listItem.appendChild(headerDiv);
    listItem.appendChild(wordDiv);

    // クリックでワード表示/非表示
    listItem.addEventListener('click', () => {
      const isOpen = wordDiv.classList.contains('discussion-screen__player-item-word--show');
      document.querySelectorAll('.discussion-screen__player-item-word').forEach(wordEl => {
        wordEl.classList.remove('discussion-screen__player-item-word--show');
      });
      // 既に開いていなければ開く（トグル動作）
      if (!isOpen) {
        wordDiv.classList.add('discussion-screen__player-item-word--show');
      }
    });

    elements.playersList.appendChild(listItem);
  });
}

// 討論開始（タイマー開始とUI切り替え）
function startDiscussion() {
  elements.startTimerBtn.style.display = 'none';
  elements.pauseTimerBtn.style.display = 'inline-block';
  elements.endDiscussionBtn.style.display = 'inline-block';
  startTimer();
}

// 討論終了
function endDiscussion() {
  if (confirm('討論を終了して投票に進みますか？')) {
    if (gameState.timer) {
      clearInterval(gameState.timer);
    }

    initVote();
  }
}

// ===========================================
//  タイマー
// ===========================================

// タイマー開始
function startTimer() {
  setupAudio();

  if (gameState.timer) {
    clearInterval(gameState.timer);
  }
  
  gameState.timer = setInterval(() => {
    if (!gameState.isTimerPaused) {
      gameState.timeRemaining--;
      updateTimerDisplay();
      
      if (gameState.timeRemaining <= 0) {
        clearInterval(gameState.timer);
        timerEnd();
      }
    }
  }, 1000);
  
  updateTimerDisplay();
}

// オーディオの準備
async function setupAudio() {
  try {
    await elements.wolfSound.play()
    elements.wolfSound.pause();
    elements.wolfSound.currentTime = 0;
    elements.wolfSound.muted = false;
  } catch (e) {
    console.warn('オーディオの読み込みに失敗：', e);
  }
}

// タイマー表示更新
function updateTimerDisplay() {
  const minutes = Math.floor(gameState.timeRemaining / 60);
  const seconds = gameState.timeRemaining % 60;
  elements.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// タイマー一時停止
function pauseTimer() {
  gameState.isTimerPaused = true;
  elements.pauseTimerBtn.style.display = 'none';
  elements.resumeTimerBtn.style.display = 'inline-block';
}

// タイマー再開
function resumeTimer() {
  gameState.isTimerPaused = false;
  elements.pauseTimerBtn.style.display = 'inline-block';
  elements.resumeTimerBtn.style.display = 'none';
}

// タイマー終了
function timerEnd() {
  playTimerSound();

  // 投票画面に移動
  initVote();
}

function playTimerSound() {
  elements.wolfSound.play();
}

// ===========================================
//  投票画面
// ===========================================

// 投票情報初期化（討論画面からの遷移のみ動作）
function initVote() {
  gameState.currentPlayerIndex = 0;
  gameState.isVoting = false;
  gameState.isVoteEnded = false;

  // 投票数を0で初期化
  gameState.players.forEach(player => { player.votesReceived = 0; });

  showVoteScreen();
}

// 投票開始画面の表示
function showVoteScreen() {
  showScreen('vote');
  setupVoteScreen();
}

// 投票画面のUIを設定
function setupVoteScreen() {
  if (!gameState.isVoteEnded) {
    elements.startVoteBtn.style.display = 'inline-block';
    elements.continueDiscussionBtn.style.display = 'inline-block';
    elements.voteResultBtn.style.display = 'none';
  } else {
    elements.startVoteBtn.style.display = 'none';
    elements.continueDiscussionBtn.style.display = 'none';
    elements.voteResultBtn.style.display = 'inline-block';
  }

  // 投票中の場合はモーダルを表示
  if (gameState.isVoting) {
    elements.voteModal.classList.add('vote-screen__modal--active');
    elements.modalMask.classList.add('modal-mask--active');
  } else {
    elements.voteModal.classList.remove('vote-screen__modal--active');
    elements.modalMask.classList.remove('modal-mask--active');
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  elements.voteModalPlayerName.textContent = `${currentPlayer.name}の投票`;

  createVoteOptions();
  // elements.voteModalSubmitBtn.style.display = 'none';
  elements.voteModalSubmitBtn.disabled = true;

  saveGameState();
}

// 投票開始
function startVote() {
  gameState.isVoting = true;
  setupVoteScreen();
}

// 投票オプション生成
function createVoteOptions() {
  elements.voteModalOptions.innerHTML = '';
  gameState.players.forEach(player => {
    if (player.index === gameState.currentPlayerIndex) return; // 自分以外
    const optionDiv = document.createElement('li');
    optionDiv.className = 'vote-screen__option-item';
    optionDiv.textContent = player.name;
    optionDiv.dataset.playerIndex = player.index;
    optionDiv.addEventListener('click', () => {
      selectVoteOption(optionDiv, player.index);
    });
    elements.voteModalOptions.appendChild(optionDiv);
  });
}

// 投票オプション選択
function selectVoteOption(optionElement, playerIndex) {
  document.querySelectorAll('.vote-screen__option-item').forEach(option => {
    option.classList.remove('vote-screen__option-item--selected');
  });
  optionElement.classList.add('vote-screen__option-item--selected');
  // elements.voteModalSubmitBtn.style.display = 'inline-block';
  elements.voteModalSubmitBtn.disabled = false;
  // 選択indexを保持
  gameState.players[gameState.currentPlayerIndex].votedIndex = playerIndex;
}

// 投票ボタン押下
function submitVote() {
  const selectedIndex = gameState.players[gameState.currentPlayerIndex].votedIndex;
  gameState.players[selectedIndex].votesReceived++;

  // 次のプレイヤーへ
  if (gameState.currentPlayerIndex < gameState.players.length - 1) {
    showVoteNextModalAnimation();
  } else {
    endVote();
  }
}

// 次のプレイヤーへのモーダルアニメーション
function showVoteNextModalAnimation() {
  elements.voteModal.classList.remove('vote-screen__modal--active');
  setTimeout(() => {
    gameState.currentPlayerIndex++;
    setupVoteScreen();
  }, 500);
}

// 投票終了
function endVote() {
  gameState.isVoting = false;
  gameState.isVoteEnded = true;
  setupVoteScreen();
}

// 投票数をカウントし、ウルフの指名判定を行う
function isWolfAccused() {
  gameState.accusedPlayer = [];

  // 最多得票者を特定
  const maxVotes = Math.max(...gameState.players.map(player => player.votesReceived));
  gameState.accusedPlayer = gameState.players.filter(player => player.votesReceived === maxVotes);

  // 最多得票者が1人の場合
  if (gameState.accusedPlayer.length === 1) {
    // ウルフの指名判定
    if (gameState.accusedPlayer[0].index === gameState.wolfIndex) {
      gameState.isWolfWinner = false; // ウルフが指名された場合
    } else {
      gameState.isWolfWinner = true; // ウルフが指名されなかった場合
    }
  } else {
    gameState.isWolfWinner = true; // 票が割れた場合はウルフの勝利
  }

  showVoteResultScreen();
}

// ===========================================
//  投票結果画面
// ===========================================

// 投票結果画面の表示
function showVoteResultScreen() {
  showScreen('vote-result');
  setupVoteResultScreen();
}

// 投票結果画面のUIを設定
function setupVoteResultScreen() {
  // 名前表示
  if (gameState.accusedPlayer.length === 1) {
    elements.voteResultAccusedPlayer.textContent = `${gameState.accusedPlayer[0].name}が選ばれました`;
  } else {
    elements.voteResultAccusedPlayer.textContent = '投票が割れました';
  }

  // 結果表示の切り替え
  if (gameState.isWolfWinner) {
    elements.voteResultSuccess.style.display = 'none';
    elements.voteResultFailure.style.display = 'block';
    elements.wolfChanceBtn.style.display = 'none';
    elements.gameResultBtnVote.style.display = 'inline-block';
  } else {
    elements.voteResultSuccess.style.display = 'block';
    elements.voteResultFailure.style.display = 'none';
    elements.wolfChanceBtn.style.display = 'inline-block';
    elements.gameResultBtnVote.style.display = 'none';
  }

  elements.voteResultWolfPlayer.forEach(player => {
    player.textContent = `${gameState.players[gameState.wolfIndex].name}がウルフでした`;
  });

  createVoteHistory();

  saveGameState();
}

// 投票履歴を作成
function createVoteHistory() {
  elements.voteResultVoltHistoryList.innerHTML = '';

  gameState.players.forEach((player) => {
    const itemDiv = document.createElement('li');
    itemDiv.className = 'vote-result-screen__volt-history-item';

    const playerSpan = document.createElement('span');
    playerSpan.className = 'vote-result-screen__volt-history-player';
    playerSpan.textContent = player.name;

    const arrowSpan = document.createElement('span');
    arrowSpan.className = 'vote-result-screen__volt-history-arrow';
    arrowSpan.innerHTML = '&#10140;';

    const votedPlayerSpan = document.createElement('span');
    votedPlayerSpan.className = 'vote-result-screen__volt-history-player';
    votedPlayerSpan.textContent = gameState.players[player.votedIndex].name;

    itemDiv.appendChild(playerSpan);
    itemDiv.appendChild(arrowSpan);
    itemDiv.appendChild(votedPlayerSpan);
    elements.voteResultVoltHistoryList.appendChild(itemDiv);
  });
}

// ===========================================
//  逆転チャンス画面
// ===========================================

// 逆転チャンス画面の表示
function showWolfChanceScreen() {
  showScreen('wolf-chance');
  setupWolfChanceScreen();
}

// 逆転チャンス画面のUIを設定
function setupWolfChanceScreen() {
  elements.wolfGuess.value = '';

  saveGameState();
}

function validateGuessInput() {
  elements.submitGuessBtn.disabled = !elements.wolfGuess.value.trim();
}

// ウルフの推測提出
function submitWolfGuess() {
  gameState.wolfGuess = elements.wolfGuess.value.trim();

  // 成否判定
  gameState.isWolfWinner = gameState.wolfGuess === gameState.villagerWord;

  showWolfChanceResultScreen();
}

// ===========================================
//  逆転チャンス結果画面
// ===========================================

// 逆転チャンス結果画面の表示
function showWolfChanceResultScreen() {
  showScreen('wolf-chance-result');
  setupWolfChanceResultScreen();
}

// 逆転チャンス結果画面のUIを設定
function setupWolfChanceResultScreen() {
  elements.wolfGuessDisplay.innerHTML = `ウルフの推測<br>「${gameState.wolfGuess}」`
  if (gameState.isWolfWinner) {
    elements.wolfChanceResultSuccess.style.display = 'block';
    elements.wolfChanceResultFailure.style.display = 'none';
  } else {
    elements.wolfChanceResultSuccess.style.display = 'none';
    elements.wolfChanceResultFailure.style.display = 'block';
  }

  elements.wolfChanceResultVillagerWord.forEach(word => {
    word.textContent = `村人のワードは${gameState.villagerWord}でした`;
  });

  saveGameState();
}

function modifyWolfGuessResult() {
  gameState.isWolfWinner = !gameState.isWolfWinner;

  showWolfChanceResultScreen()
}

// ===========================================
//  配点計算
// ===========================================

// 投票結果による配点計算
function calculateScore() {
  if (gameState.isWolfWinner) { // ウルフの勝利
    gameState.players[gameState.wolfIndex].score++;

  } else if (!gameState.isWolfWinner) { // 村人の勝利の場合
    gameState.players.forEach(player => {
      if (player.index !== gameState.wolfIndex) { // 村人の場合
        if (player.votedIndex === gameState.wolfIndex) { // ウルフに投票していた場合
          player.score++;
        }
      }
    });
  }

  showGameResult();
}

// ===========================================
//  ゲーム結果画面
// ===========================================

// ゲーム結果画面を表示
function showGameResult() {
  showScreen('game-result');
  setupGameResultScreen();
}

// ゲーム結果画面のUIを設定
function setupGameResultScreen() {
  elements.gameResultTitle.innerHTML = `ゲーム結果：Round ${gameState.roundCount}`;
  if (gameState.isWolfWinner) {
    elements.gameResultWolf.style.display = 'block';
    elements.gameResultVillager.style.display = 'none';
  } else if (!gameState.isWolfWinner) {
    elements.gameResultVillager.style.display = 'block';
    elements.gameResultWolf.style.display = 'none';
  }
  // スコアボード表示
  showScoreBoard();

  saveGameState();
}

// スコアボード表示
function showScoreBoard() {
  // マスターとプレイヤーを合流
  playerMarge();
  // スコアでソート
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

  elements.scoreList.innerHTML = '';
  sortedPlayers.forEach(player => {
    const listItem = document.createElement('li');
    listItem.className = 'game-result-screen__score-item';

    const playerDiv = document.createElement('div');
    playerDiv.className = 'game-result-screen__score-player';

    const playerSpan = document.createElement('span');
    playerSpan.textContent = `${player.name}`;

    const scoreSpan = document.createElement('span');
    scoreSpan.textContent = `${player.score}点`;

    playerDiv.appendChild(playerSpan);
    playerDiv.appendChild(scoreSpan);
    listItem.appendChild(playerDiv);

    const wordDiv = document.createElement('div');
    if (player.index !== null) {
      if (player.index === gameState.wolfIndex) {
        wordDiv.className = 'game-result-screen__score-word game-result-screen__score-word-wolf';
      } else {
        wordDiv.className = 'game-result-screen__score-word game-result-screen__score-word-villager';
      }
      wordDiv.textContent = `${player.word}`;
      addScoreIcon(player, listItem);
    } else {
      wordDiv.className = 'game-result-screen__score-word game-result-screen__score-word-master';
      wordDiv.textContent = 'ゲームマスター';
    }

    listItem.appendChild(wordDiv);
    elements.scoreList.appendChild(listItem);
  });
}

function playerMarge() {
  // マスターがいる場合はプレイヤー末尾に戻す
  if (gameState.master) {
    gameState.players.push(gameState.master);
    gameState.master = null;
  }
}

// スコアアイコンの追加
function addScoreIcon(player, listItem) {
  const plusSpan = document.createElement('span');
  plusSpan.className = 'game-result-screen__score-plus';
  plusSpan.textContent = `WIN`;

  if (gameState.isWolfWinner) {
    if (player.index === gameState.wolfIndex) {
      // ウルフが勝利かつ自身がウルフの場合
      listItem.appendChild(plusSpan);
    }
  } else {
    if (player.index !== gameState.wolfIndex) {
      if (player.votedIndex === gameState.wolfIndex) {
        // ウルフが敗北かつ自身が村人かつウルフに投票していた場合
        listItem.appendChild(plusSpan);
      }
    }
  }
}

// ===========================================
//  最終結果画面
// ===========================================

// 最終結果画面を表示
function showEndResultScreen() {
  showScreen('end-result');
  setupEndResultScreen();
}

// 最終結果画面のUIを設定
function setupEndResultScreen() {
  // トータルスコアボード表示
  showTotalScoreBoard();

  saveGameState();
}

// トータルスコアボード表示
function showTotalScoreBoard() {
  // 最大スコアを取得
  const maxScore = Math.max(...gameState.players.map(player => player.score));
  // スコアでソート
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

  elements.endResultScoreList.innerHTML = '';
  sortedPlayers.forEach(player => {
    const listItem = document.createElement('li');
    listItem.className = 'end-result-screen__score-item';

    const playerSpan = document.createElement('span');
    playerSpan.textContent = `${player.name} (ウルフ: ${player.wolfCount}回)`;

    const scoreSpan = document.createElement('span');
    scoreSpan.textContent = `${player.score}点`;

    // 勝者マーク表示
    if (player.score === maxScore) {
      const winnerSpan = document.createElement('span');
      winnerSpan.className = 'end-result-screen__score-winner';
      winnerSpan.textContent = '🏆';
      listItem.appendChild(winnerSpan);
    }

    listItem.appendChild(playerSpan);
    listItem.appendChild(scoreSpan);

    elements.endResultScoreList.appendChild(listItem);
  });
}

// トップ画面に戻る
function backToTop() {
  showScreen('top-page');
  initGameState();
  setupTopPage();
}

// ===========================================
//  ゲーム状態の管理
// ===========================================

// ゲーム状態の保存
function saveGameState() {
  try {
    localStorage.setItem('wordWolfGameState', JSON.stringify(gameState));
  } catch (error) {
    console.error('ゲーム状態の保存に失敗しました:', error);
  }
}

// ゲーム状態の初期化
function initGameState() {
  try {
    localStorage.removeItem('wordWolfGameState');
  } catch (error) {
    console.error('ゲーム状態の初期化に失敗しました:', error);
  }
}

// ゲーム状態の読み込み
function loadGameState() {
  try {
    const savedState = localStorage.getItem('wordWolfGameState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      Object.assign(gameState, parsedState); // ゲーム状態を上書き

      // 各画面の状態を復元
      switch (gameState.currentScreen) {
        case 'word-set':
          showWordSetScreen();
          break;
        case 'word-distribution':
          showWordDistributionScreen();
          break;
        case 'discussion':
          showDiscussionScreen();
          break;
        case 'vote':
          showVoteScreen();
          break;
        case 'vote-result':
          showVoteResultScreen();
          break;
        case 'wolf-chance':
          showWolfChanceScreen();
          break;
        case 'wolf-chance-result':
          showWolfChanceResultScreen();
          break;
        case 'game-result':
          showGameResult();
          break;
        case 'end-result':
          showEndResultScreen();
          break;
      }

    }
  } catch (error) {
    console.error('ゲーム状態の読み込みに失敗しました:', error);
  }
}

// ===========================================
//  ページ読み込み時に初期化
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
  init().catch(error => {
    console.error('初期化に失敗しました:', error);
  });
});
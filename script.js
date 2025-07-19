'use strict';

// ===========================================
// ゲーム状態管理
// ===========================================

const gameState = {

  // ゲーム設定
  totalPlayers: 4, // プレイヤー総数
  timerMinutes: 3, // 制限時間（分）

  // プレイヤー情報
  players: [], // プレイヤー情報

  // ゲーム進行
  currentScreen: 'setup', // 現在の画面
  currentPlayerIndex: 0, // プレイヤー順次操作画面用

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
  votesCount: {}, // 投票数
  accusedPlayer: null, // 最多投票者
  isVoteEnded: false, // 投票終了フラグ

  // ウルフの勝利判定
  isWolfWinner: null, // ウルフの勝利判定フラグ

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

  // トップページ
  startNewGameBtn: document.getElementById('start-new-game-btn'),
  continueGameBtn: document.getElementById('continue-game-btn'),

  // 設定画面
  totalPlayers: document.getElementById('total-players'),
  playerNamesContainer: document.getElementById('player-names-container'),
  timerMinutes: document.getElementById('timer-minutes'),
  startGameBtn: document.getElementById('start-game-btn'),

  // ワード配布画面
  currentPlayerName: document.getElementById('current-player-name'),
  revealWordBtn: document.getElementById('reveal-word-btn'),
  wordModal: document.getElementById('word-modal'),
  wordModalPlayerName: document.getElementById('word-modal-player-name'),
  modalWord: document.getElementById('modal-word'),
  nextPlayerBtn: document.getElementById('next-player-btn'),
  showDiscussionBtn: document.getElementById('show-discussion-btn'),

  // 討論画面
  playersList: document.getElementById('players-list'),
  startTimerBtn: document.getElementById('start-timer-btn'),
  pauseTimerBtn: document.getElementById('pause-timer-btn'),
  resumeTimerBtn: document.getElementById('resume-timer-btn'),
  endDiscussionBtn: document.getElementById('end-discussion-btn'),
  timerDisplay: document.getElementById('timer-display'),

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
  wolfChanceResultSuccess: document.getElementById('wolf-chance-result-success'),
  wolfChanceResultFailure: document.getElementById('wolf-chance-result-failure'),
  wolfChanceResultVillagerWord: document.querySelectorAll('.wolf-chance-result-screen__villager-word'),
  gameResultBtnWolfChance: document.getElementById('game-result-btn-wolf-chance'),

  // 結果画面
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
  updatePlayerNameInputs();
}

// ===========================================
//  イベントリスナーの設定
// ===========================================

function setupEventListeners() {

  // トップページ
  elements.startNewGameBtn.addEventListener('click', () => {
    initGameState();
    showScreen('setup');
  });

  elements.continueGameBtn.addEventListener('click', () => {
    loadGameState();
    showScreen(gameState.currentScreen);
  });

  // 設定画面
  elements.totalPlayers.addEventListener('change', updatePlayerNameInputs);
  elements.startGameBtn.addEventListener('click', registerGameSettings);

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
  elements.startVoteBtn.addEventListener('click', showVoteModal);
  elements.continueDiscussionBtn.addEventListener('click', showDiscussionScreen);
  elements.voteModalSubmitBtn.addEventListener('click', submitVote);
  elements.voteResultBtn.addEventListener('click', isWolfAccused);

  // 投票結果画面
  elements.wolfChanceBtn.addEventListener('click', showWolfChanceScreen);
  elements.gameResultBtnVote.addEventListener('click', calculateScore);

  // 逆転チャンス画面
  elements.submitGuessBtn.addEventListener('click', submitWolfGuess);

  // 逆転チャンス結果画面
  elements.gameResultBtnWolfChance.addEventListener('click', calculateScore);

  // ゲーム結果画面
  elements.nextGameBtn.addEventListener('click', startRound);
  elements.endGameBtn.addEventListener('click', showEndResultScreen);

  // 最終結果画面
  elements.backToTopBtn.addEventListener('click', backToTop);
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
//  プレイヤー名入力フィールド数の更新
// ===========================================

function updatePlayerNameInputs() {
  const totalPlayers = parseInt(elements.totalPlayers.value);

  // 既存の入力フィールドをクリア
  elements.playerNamesContainer.innerHTML = '';

  // 新しい入力フィールドを作成
  for (let i = 0; i < totalPlayers; i++) {
    const playerDiv = document.createElement('div');
    playerDiv.className = 'setup-screen__form-group';

    const label = document.createElement('label');
    label.className = 'setup-screen__form-label';
    label.htmlFor = `player-name-${i + 1}`;
    label.textContent = `プレイヤー${i + 1}:`;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'setup-screen__form-input setup-screen__form-input--player-name';
    input.placeholder = '10文字以内で入力してください';
    input.id = label.htmlFor;
    input.maxLength = 10;

    playerDiv.appendChild(label);
    playerDiv.appendChild(input);
    elements.playerNamesContainer.appendChild(playerDiv);
  }
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
}

// ===========================================
//  ゲーム設定
// ===========================================

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
      score: 0,
      wolfCount: 0,
    });
  });

  // ワード配布画面への遷移
  startRound();
}

// スタートラウンド
function startRound() {
  assignWolfAndWords();

  gameState.currentPlayerIndex = 0;
  showWordDistributionScreen();
}

// ウルフとワードを決定
function assignWolfAndWords() {

  // ウルフのインデックスを決定
  gameState.wolfIndex = Math.floor(Math.random() * gameState.players.length);
  gameState.players[gameState.wolfIndex].wolfCount++;

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

  // プレイヤーにワードを配布
  gameState.players.forEach(player => {
    player.word = player.index === gameState.wolfIndex ? gameState.wolfWord : gameState.villagerWord;
  });
}

// ===========================================
//  ワード配布画面
// ===========================================


// ワード配布画面への遷移
function showWordDistributionScreen() {
  setupWordDistributionScreen();

  gameState.currentScreen = 'word-distribution';
  showScreen('word-distribution');

  saveGameState();
}

// 現在のプレイヤーのワードを表示
function setupWordDistributionScreen() {
  closeWordModal();

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer) return;

  const currentPlayerWord = `${currentPlayer.name}のワード`

  elements.currentPlayerName.textContent = currentPlayerWord;
  elements.wordModalPlayerName.textContent = currentPlayerWord;
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
  gameState.currentPlayerIndex++;
  setupWordDistributionScreen();

  saveGameState();
}

// ===========================================
//  討論画面
// ===========================================

// 討論画面への遷移とUI初期化
function showDiscussionScreen() {
  closeWordModal();

  setupDiscussionScreen();

  gameState.currentScreen = 'discussion';
  showScreen('discussion');

  saveGameState();
}

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
}

// プレイヤー一覧を作成
function createPlayersList() {
  elements.playersList.innerHTML = '';

  gameState.players.forEach((player, index) => {
    const playerDiv = document.createElement('div');
    playerDiv.className = 'discussion-screen__player-item';

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
    wordDiv.textContent = `ワード: ${player.word}`;

    headerDiv.appendChild(nameSpan);
    headerDiv.appendChild(scoreSpan);
    playerDiv.appendChild(headerDiv);
    playerDiv.appendChild(wordDiv);

    // クリックでワード表示/非表示
    playerDiv.addEventListener('click', () => {
      const isOpen = wordDiv.classList.contains('discussion-screen__player-item-word--show');
      document.querySelectorAll('.discussion-screen__player-item-word').forEach(wordEl => {
        wordEl.classList.remove('discussion-screen__player-item-word--show');
      });
      // 既に開いていなければ開く（トグル動作）
      if (!isOpen) {
        wordDiv.classList.add('discussion-screen__player-item-word--show');
      }
    });

    elements.playersList.appendChild(playerDiv);
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
  // 音を鳴らす（ブラウザの制限により、ユーザーアクションが必要）
  // if ('AudioContext' in window || 'webkitAudioContext' in window) {
  //   playTimerSound();
  // }

  // 投票画面に移動
  initVote();
}

// ===========================================
//  投票画面
// ===========================================

// 投票情報初期化
function initVote() {
  gameState.currentPlayerIndex = 0;
  gameState.isVoteEnded = false;

  // 投票数を0で初期化
  gameState.players.forEach((p, idx) => { gameState.votesCount[idx] = 0; });

  showVoteScreen();
}

// 投票開始画面の表示
function showVoteScreen() {

  if (!gameState.isVoteEnded) {
    elements.startVoteBtn.style.display = 'inline-block';
    elements.continueDiscussionBtn.style.display = 'inline-block';
    elements.voteResultBtn.style.display = 'none';
  } else {
    elements.startVoteBtn.style.display = 'none';
    elements.continueDiscussionBtn.style.display = 'none';
    elements.voteResultBtn.style.display = 'inline-block';
  }

  gameState.currentScreen = 'vote';
  showScreen('vote');

  saveGameState();
}

// 各プレイヤー投票画面の表示
function showVoteModal() {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  elements.voteModal.classList.add('vote-screen__modal--active');
  elements.modalMask.classList.add('modal-mask--active');
  elements.voteModalPlayerName.textContent = `${currentPlayer.name}の投票`;

  createVoteOptions();

  elements.voteModalSubmitBtn.style.display = 'none';

  saveGameState();
}

// 投票オプション生成
function createVoteOptions() {
  elements.voteModalOptions.innerHTML = '';
  gameState.players.forEach((player, idx) => {
    if (idx === gameState.currentPlayerIndex) return; // 自分以外
    const optionDiv = document.createElement('li');
    optionDiv.className = 'vote-screen__option-item';
    optionDiv.textContent = player.name;
    optionDiv.dataset.playerIndex = idx;
    optionDiv.addEventListener('click', () => {
      selectVoteOption(optionDiv, idx);
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
  elements.voteModalSubmitBtn.style.display = 'inline-block';
  // 一時的に選択indexを保存
  elements.voteModalSubmitBtn.dataset.selectedIndex = playerIndex;
}

// 投票ボタン押下
function submitVote() {
  const selectedIndex = parseInt(elements.voteModalSubmitBtn.dataset.selectedIndex);
  gameState.votesCount[selectedIndex]++;
  gameState.players[gameState.currentPlayerIndex].votedIndex = selectedIndex;

  // 次のプレイヤーへ
  if (gameState.currentPlayerIndex < gameState.players.length - 1) {
    showVoteNextModalAnimation();
  } else {
    gameState.isVoteEnded = true;
    elements.voteModal.classList.remove('vote-screen__modal--active');
    elements.modalMask.classList.remove('modal-mask--active');
    elements.startVoteBtn.style.display = 'none';
    elements.continueDiscussionBtn.style.display = 'none';
    elements.voteResultBtn.style.display = 'inline-block';
    saveGameState();
  }
}

// 次のプレイヤーへのモーダルアニメーション
function showVoteNextModalAnimation() {
  elements.voteModal.classList.remove('vote-screen__modal--active');
  setTimeout(() => {
    gameState.currentPlayerIndex++;
    showVoteModal();
  }, 500);
}

// 投票数をカウントし、ウルフの指名判定を行う
function isWolfAccused() {
  gameState.accusedPlayer = null;

  // 最多得票者を特定
  const maxVotes = Math.max(...Object.values(gameState.votesCount));
  const maxVotePlayers = Object.keys(gameState.votesCount).filter(index => gameState.votesCount[index] === maxVotes);

  // 最多得票者が1人の場合
  if (maxVotePlayers.length === 1) {
    gameState.accusedPlayer = gameState.players[maxVotePlayers[0]];

    // ウルフの指名判定
    if (gameState.accusedPlayer.index === gameState.wolfIndex) {
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

  // 名前表示
  if (gameState.accusedPlayer) {
    elements.voteResultAccusedPlayer.textContent = `${gameState.accusedPlayer.name}が選ばれました`;
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

  gameState.currentScreen = 'vote-result';
  showScreen('vote-result');

  saveGameState();
}

// 投票履歴を作成
function createVoteHistory() {
  elements.voteResultVoltHistoryList.innerHTML = '';

  gameState.players.forEach((player, idx) => {
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
    votedPlayerSpan.textContent = gameState.players[gameState.players[idx].votedIndex].name;

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
  elements.wolfGuess.value = '';

  gameState.currentScreen = 'wolf-chance';
  showScreen('wolf-chance');

  saveGameState();
}

// ウルフの推測提出
function submitWolfGuess() {
  const guess = elements.wolfGuess.value.trim();
  if (!guess) {
    alert('推測を入力してください。');
    return;
  }

  // 成否判定
  gameState.isWolfWinner = guess === gameState.villagerWord;

  showWolfChanceResultScreen();
}

// ===========================================
//  逆転チャンス結果画面
// ===========================================

// 逆転チャンス結果画面の表示
function showWolfChanceResultScreen() {

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

  gameState.currentScreen = 'wolf-chance-result';
  showScreen('wolf-chance-result');

  saveGameState();
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

function showGameResult() {

  if (gameState.isWolfWinner) {
    elements.gameResultWolf.style.display = 'block';
    elements.gameResultVillager.style.display = 'none';
  } else if (!gameState.isWolfWinner) {
    elements.gameResultVillager.style.display = 'block';
    elements.gameResultWolf.style.display = 'none';
  }

  // スコアボード表示
  showScoreBoard();

  gameState.currentScreen = 'game-result';
  showScreen('game-result');

  saveGameState();
}

// スコアボード表示
function showScoreBoard() {

  // スコアでソート
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

  elements.scoreList.innerHTML = '';
  sortedPlayers.forEach(player => {
    const itemDiv = document.createElement('li');
    itemDiv.className = 'game-result-screen__score-item';

    const playerSpan = document.createElement('span');
    if (player.index === gameState.wolfIndex) {
      playerSpan.textContent = `${player.name} (ウルフ)`;
    } else {
      playerSpan.textContent = `${player.name} (村人)`;
    }

    const scoreSpan = document.createElement('span');
    scoreSpan.textContent = `${player.score}点`;

    itemDiv.appendChild(playerSpan);
    itemDiv.appendChild(scoreSpan);

    elements.scoreList.appendChild(itemDiv);
  });
}

// ===========================================
//  最終結果画面
// ===========================================

// 最終結果画面を表示
function showEndResultScreen() {
  // 勝者を決定
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

  showTotalScoreBoard();

  gameState.currentScreen = 'end-result';
  showScreen('end-result');

  saveGameState();
}

// トータルスコアボード表示
function showTotalScoreBoard() {
  // スコアでソート
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

  elements.endResultScoreList.innerHTML = '';
  sortedPlayers.forEach(player => {
    const itemDiv = document.createElement('li');
    itemDiv.className = 'end-result-screen__score-item';

    const playerSpan = document.createElement('span');
    playerSpan.textContent = `${player.name} (ウルフ: ${player.wolfCount}回)`;

    const scoreSpan = document.createElement('span');
    scoreSpan.textContent = `${player.score}点`;

    itemDiv.appendChild(playerSpan);
    itemDiv.appendChild(scoreSpan);

    elements.endResultScoreList.appendChild(itemDiv);
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
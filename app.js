/**
 * 夢授業スライド・アプリケーション - コアロジック (app.js)
 */

(function () {
  // --- 状態管理 ---
  let decks = [];
  let currentDeck = null;
  let currentSlideIndex = 0;
  let isEditMode = false;
  let activeTheme = "theme-cyber";

  // タイマー状態
  let timerInterval = null;
  let timerDuration = 900; // デフォルト15分 (900秒)
  let timerSeconds = 900;
  let audioCtx = null;

  // ペン・描画状態
  let isPenMode = false;
  let isDrawing = false;
  let penColor = "#ff3b30";
  let lastX = 0;
  let lastY = 0;

  // 音声読み上げ状態
  let isSpeaking = false;
  const synth = window.speechSynthesis;
  let utterance = null;
  let audioPlayer = null; // VOICEVOX再生用
  let isAutoSpeakEnabled = false; // 自動読み上げ有効フラグ
  let voicevoxAbortController = null; // VOICEVOX通信キャンセル用
  let autoSpeakTimeoutId = null; // 自動読み上げ遅延タイマーID

  // レーザーポインター状態
  let isLaserMode = false;

  // DOM要素の参照
  let elements = {};

  // --- 初期化処理 ---
  window.addEventListener("DOMContentLoaded", () => {
    initElements();
    loadDecks();
    initEventListeners();
    setupDrawingCanvas();
    renderDeckSelector();
    loadDeck(decks[0].id);

    // 自動再生設定の復元
    loadAutoSpeakConfig();
  });

  // DOM要素の取得
  function initElements() {
    elements = {
      appContainer: document.getElementById("app-container"),
      deckSelector: document.getElementById("deck-selector"),
      slideContainer: document.getElementById("slide-container"),
      slidePlayer: document.getElementById("slide-player"),
      drawingCanvas: document.getElementById("drawing-canvas"),
      laserPointer: document.getElementById("laser-pointer"),
      
      // ボタン類
      btnToggleEdit: document.getElementById("btn-toggle-edit"),
      btnPlayFullscreen: document.getElementById("btn-play-fullscreen"),
      btnCloseEditor: document.getElementById("btn-close-editor"),
      btnSlidePrev: document.getElementById("btn-slide-prev"),
      btnSlideNext: document.getElementById("btn-slide-next"),
      
      // サイドバー
      editorSidebar: document.getElementById("editor-sidebar"),
      tabSlides: document.getElementById("tab-slides"),
      tabContent: document.getElementById("tab-content"),
      tabSettings: document.getElementById("tab-settings"),
      panelSlides: document.getElementById("panel-slides"),
      panelContent: document.getElementById("panel-content"),
      panelSettings: document.getElementById("panel-settings"),
      
      editDeckTitle: document.getElementById("edit-deck-title"),
      btnAddSlide: document.getElementById("btn-add-slide"),
      slideThumbnailList: document.getElementById("slide-thumbnail-list"),
      
      // 編集フォーム
      editSlideLayout: document.getElementById("edit-slide-layout"),
      editSlideTitle: document.getElementById("edit-slide-title"),
      editSlideSubtitle: document.getElementById("edit-slide-subtitle"),
      dynamicFieldsContainer: document.getElementById("dynamic-fields-container"),
      editSlideNotes: document.getElementById("edit-slide-notes"),
      
      // フローティング・コントロールバー
      btnCtrlFirst: document.getElementById("btn-ctrl-first"),
      btnCtrlPrev: document.getElementById("btn-ctrl-prev"),
      btnCtrlNext: document.getElementById("btn-ctrl-next"),
      btnCtrlLast: document.getElementById("btn-ctrl-last"),
      slideCounter: document.getElementById("slide-counter"),
      
      // コントロールバー - タイマー
      timerText: document.getElementById("timer-text"),
      timerProgress: document.getElementById("timer-progress"),
      btnTimerToggle: document.getElementById("btn-timer-toggle"),
      btnTimerReset: document.getElementById("btn-timer-reset"),
      timerToggleIcon: document.getElementById("timer-toggle-icon"),
      timerPresetSelector: document.getElementById("timer-preset-selector"),
      
      // コントロールバー - ツール
      btnToolLaser: document.getElementById("btn-tool-laser"),
      btnToolPen: document.getElementById("btn-tool-pen"),
      penColorSelector: document.getElementById("pen-color-selector"),
      btnToolClear: document.getElementById("btn-tool-clear"),
      btnToolSpeak: document.getElementById("btn-tool-speak"),
      btnToolAutoSpeak: document.getElementById("btn-tool-autospeak"),
      
      // コントロールバー - アピアランス
      themeSelector: document.getElementById("theme-selector"),
      btnToggleNotes: document.getElementById("btn-toggle-notes"),
      btnCtrlFullscreen: document.getElementById("btn-ctrl-fullscreen"),
      
      // 発表者ノート & トースト
      presenterNotesDrawer: document.getElementById("presenter-notes-drawer"),
      notesContent: document.getElementById("notes-content"),
      btnCloseNotes: document.getElementById("btn-close-notes"),
      alarmToast: document.getElementById("alarm-toast"),
      
      // 設定パネルボタン
      btnSaveLocal: document.getElementById("btn-save-local"),
      btnResetPreset: document.getElementById("btn-reset-preset"),
      btnExportJson: document.getElementById("btn-export-json"),
      fileImportJson: document.getElementById("file-import-json"),
      btnExportStandalone: document.getElementById("btn-export-standalone")
    };
  }

  // デッキデータのロード
  function loadDecks() {
    let saved = null;
    try {
      saved = localStorage.getItem("yume_slides_decks");
    } catch (e) {
      console.warn("ローカルストレージにアクセスできません。一時メモリ上のデータを使用します。", e);
    }

    let usePreset = false;
    if (saved) {
      try {
        decks = JSON.parse(saved);
        // AIエンジニアデッキが存在しない、またはAI関連のスライドが含まれていない場合はプリセットで上書き
        const hasCareer = decks.some(d => d.id === "career");
        const hasAISlide = decks.some(d => d.slides && d.slides.some(s => s.title && s.title.includes("AI")));
        // 旧漢字「赤堀 淳一」、旧用語「社会人講師」、Scratchスライドの有無、不要となった orientation デッキ、または新コピー（ひみつ道具）が含まれない場合もプリセットで更新
        const hasOldName = saved.includes("赤堀 淳一");
        const hasOldTerm = saved.includes("社会人講師");
        const hasScratch = saved.includes("car-scratch");
        const hasOrientation = decks.some(d => d.id === "orientation");
        const hasNewCopy = saved.includes("ひみつ道具");
        const hasThankYou = saved.includes("ありがとうございました");
        if (!hasCareer || !hasAISlide || hasOldName || hasOldTerm || !hasScratch || hasOrientation || !hasNewCopy || !hasThankYou) {
          usePreset = true;
        }
      } catch (e) {
        console.error("ローカルストレージのデータ破損。初期プリセットをロードします。", e);
        usePreset = true;
      }
    } else {
      usePreset = true;
    }

    if (usePreset) {
      decks = [...window.YUME_DECKS];
      saveDecksToStorage();
    }
  }

  // デッキデータをローカルストレージに保存
  function saveDecksToStorage() {
    try {
      localStorage.setItem("yume_slides_decks", JSON.stringify(decks));
    } catch (e) {
      console.warn("ローカルストレージへの保存に失敗しました（メモリ上のみで保存されます）。", e);
    }
  }


  // デッキ選択ドロップダウンの描画
  function renderDeckSelector() {
    elements.deckSelector.innerHTML = "";
    decks.forEach(deck => {
      const option = document.createElement("option");
      option.value = deck.id;
      option.textContent = deck.title;
      elements.deckSelector.appendChild(option);
    });
  }

  // スライドデッキのロード
  function loadDeck(deckId) {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;

    currentDeck = deck;
    currentSlideIndex = 0;
    
    // エディタ内のタイトルフィールド更新
    elements.editDeckTitle.value = deck.title;
    
    // スライド描画
    renderSlide();
    updateSlideCounter();
    
    // 編集モードならサムネイルも更新
    if (isEditMode) {
      renderSlideThumbnails();
      populateEditorFields();
    }
  }

  // --- スライド描画エンジン ---
  function renderSlide() {
    if (!currentDeck || !currentDeck.slides || currentDeck.slides.length === 0) {
      elements.slideContainer.innerHTML = "<div class='no-slides'>スライドがありません。</div>";
      return;
    }

    const slide = currentDeck.slides[currentSlideIndex];
    elements.slideContainer.innerHTML = "";

    // 共通のラッパーを作成
    const slideWrapper = document.createElement("div");
    slideWrapper.className = `slide-content layout-${slide.layout} active`;

    // レイアウト別に出力を分岐
    switch (slide.layout) {
      case "title":
        renderTitleLayout(slide, slideWrapper);
        break;
      case "list":
        renderListLayout(slide, slideWrapper);
        break;
      case "split":
        renderSplitLayout(slide, slideWrapper);
        break;
      case "timeline":
        renderTimelineLayout(slide, slideWrapper);
        break;
      case "quote":
        renderQuoteLayout(slide, slideWrapper);
        break;
      case "kamishibai":
        renderKamishibaiLayout(slide, slideWrapper);
        break;
      default:
        renderListLayout(slide, slideWrapper);
    }

    elements.slideContainer.appendChild(slideWrapper);

    // スピーカーノートの更新
    elements.notesContent.textContent = slide.notes || "スピーカーノートはありません。";
    if (isEditMode) {
      elements.editSlideNotes.value = slide.notes || "";
    }

    // キャンバスのリセット (前のスライドの手書きを消去)
    clearCanvas();
  }

  // 1. タイトルレイアウトの描画
  function renderTitleLayout(slide, container) {
    const bgText = slide.content.bgText || "DREAM";
    const caption = slide.content.caption || "";

    container.innerHTML = `
      <div class="bg-text">${escapeHtml(bgText)}</div>
      <h1>${escapeHtml(slide.title)}</h1>
      ${slide.subtitle ? `<p class="subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
      ${caption ? `<div class="caption">${escapeHtml(caption)}</div>` : ''}
    `;
  }

  // 2. リストレイアウトの描画
  function renderListLayout(slide, container) {
    const bullets = slide.content.bullets || [];
    let bulletsHtml = bullets.map(b => `
      <div class="bullet-item">
        <span class="bullet-icon">
          <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/></svg>
        </span>
        <div class="bullet-text">${escapeHtml(b)}</div>
      </div>
    `).join("");

    container.innerHTML = `
      <h2>${escapeHtml(slide.title)}</h2>
      ${slide.subtitle ? `<p class="slide-sub">${escapeHtml(slide.subtitle)}</p>` : ''}
      <div class="bullets-container">
        ${bulletsHtml}
      </div>
    `;
  }

  // 3. 2分割レイアウトの描画
  function renderSplitLayout(slide, container) {
    const content = slide.content;
    const leftTitle = content.leftTitle || "項目 A";
    const leftBullets = content.leftBullets || [];
    const rightTitle = content.rightTitle || "項目 B";
    const rightBullets = content.rightBullets || [];

    const leftHtml = leftBullets.map(b => `
      <div class="bullet-item">
        <span class="bullet-icon">
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/></svg>
        </span>
        <div class="bullet-text">${escapeHtml(b)}</div>
      </div>
    `).join("");

    const rightHtml = rightBullets.map(b => `
      <div class="bullet-item">
        <span class="bullet-icon">
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/></svg>
        </span>
        <div class="bullet-text">${escapeHtml(b)}</div>
      </div>
    `).join("");

    container.innerHTML = `
      <h2>${escapeHtml(slide.title)}</h2>
      ${slide.subtitle ? `<p class="slide-sub">${escapeHtml(slide.subtitle)}</p>` : ''}
      <div class="split-columns">
        <div class="split-col">
          <h3>${escapeHtml(leftTitle)}</h3>
          <div class="bullets-container">${leftHtml}</div>
        </div>
        <div class="split-col">
          <h3>${escapeHtml(rightTitle)}</h3>
          <div class="bullets-container">${rightHtml}</div>
        </div>
      </div>
    `;
  }

  // 4. タイムラインレイアウトの描画
  function renderTimelineLayout(slide, container) {
    const steps = slide.content.steps || [];
    
    let nodesHtml = "";
    steps.forEach((step, idx) => {
      nodesHtml += `
        <div class="timeline-node ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
          <div class="timeline-dot"></div>
          <div class="timeline-label">${escapeHtml(step.label)}</div>
          <div class="timeline-desc-card">
            ${escapeHtml(step.desc)}
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <h2>${escapeHtml(slide.title)}</h2>
      ${slide.subtitle ? `<p class="slide-sub">${escapeHtml(slide.subtitle)}</p>` : ''}
      <div class="timeline-track-container">
        <div class="timeline-line">
          <div class="timeline-line-progress" id="timeline-progress-bar"></div>
        </div>
        ${nodesHtml}
      </div>
    `;

    // タイムラインのノードクリックイベント設定
    const nodes = container.querySelectorAll(".timeline-node");
    const progressBar = container.querySelector("#timeline-progress-bar");

    const updateTimelineProgress = (activeIndex) => {
      nodes.forEach((node, idx) => {
        if (idx <= activeIndex) {
          node.classList.add("active");
        } else {
          node.classList.remove("active");
        }
      });
      // 進行バーの幅を設定
      const percent = steps.length > 1 ? (activeIndex / (steps.length - 1)) * 90 : 0;
      progressBar.style.width = `${percent}%`;
    };

    nodes.forEach(node => {
      node.addEventListener("click", () => {
        const idx = parseInt(node.getAttribute("data-idx"));
        updateTimelineProgress(idx);
      });
    });

    // 初期状態の進捗バーセット (1つめアクティブ)
    setTimeout(() => {
      updateTimelineProgress(0);
    }, 100);
  }

  // 5. 引用レイアウトの描画
  function renderQuoteLayout(slide, container) {
    const quote = slide.content.quote || "";
    const author = slide.content.author || "";
    const bullets = slide.content.bullets || [];

    let bulletsHtml = bullets.map(b => `
      <div class="bullet-item">
        <span class="bullet-icon">
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/></svg>
        </span>
        <div class="bullet-text">${escapeHtml(b)}</div>
      </div>
    `).join("");

    container.innerHTML = `
      <h2>${escapeHtml(slide.title)}</h2>
      ${slide.subtitle ? `<p class="slide-sub">${escapeHtml(slide.subtitle)}</p>` : ''}
      <div class="quote-wrapper">
        <div class="quote-icon-bg">“</div>
        <blockquote class="quote-text">「 ${escapeHtml(quote)} 」</blockquote>
        ${author ? `<div class="quote-author">${escapeHtml(author)}</div>` : ''}
        ${bullets.length > 0 ? `<div class="quote-bullets">${bulletsHtml}</div>` : ''}
      </div>
    `;
  }

  // 6. 紙芝居レイアウトの描画
  function renderKamishibaiLayout(slide, container) {
    const image = slide.content.image || "";
    const description = slide.content.description || "";
    const subtitle = slide.subtitle || "";
    
    const imgHtml = image 
      ? `<div class="kamishibai-img-wrapper"><img src="${escapeHtml(image)}" class="kamishibai-img" alt="Illustration"></div>`
      : `<div class="kamishibai-img-wrapper kamishibai-placeholder">
           <svg viewBox="0 0 24 24" width="64" height="64"><path fill="currentColor" d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M13.96,12.29L11.21,15.83L9.25,13.47L6.5,17H17.5L13.96,12.29Z"/></svg>
           <span>イラストが設定されていません</span>
         </div>`;

    container.innerHTML = `
      <div class="kamishibai-layout-container">
        ${imgHtml}
        <div class="kamishibai-text-container">
          <h2>${escapeHtml(slide.title)}</h2>
          ${subtitle ? `<p class="slide-sub">${escapeHtml(subtitle)}</p>` : ''}
          <div class="kamishibai-description">${escapeHtml(description).replace(/\n/g, '<br>')}</div>
        </div>
      </div>
    `;
  }

  // HTMLエスケープユーティリティ
  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --- スライド移動処理 ---
  function goToSlide(index) {
    if (!currentDeck) return;
    if (index < 0 || index >= currentDeck.slides.length) return;

    // ページ遷移時に読み上げをストップ
    if (synth && synth.speaking) {
      synth.cancel();
      setSpeakState(false);
    }
    if (audioPlayer) {
      // 停止処理によるエラー発火（フォールバック起動）を防ぐためにイベントを解除する
      audioPlayer.onerror = null;
      audioPlayer.onended = null;
      audioPlayer.onplay = null;
      audioPlayer.pause();
      audioPlayer.src = "";
      setSpeakState(false);
    }

    // 進行中のVOICEVOX通信があれば即座にキャンセル（中断）
    if (voicevoxAbortController) {
      voicevoxAbortController.abort();
      voicevoxAbortController = null;
      console.log("進行中のVOICEVOX通信をキャンセルしました。");
    }

    // 保留中の自動読み上げ予約をクリア
    if (autoSpeakTimeoutId) {
      clearTimeout(autoSpeakTimeoutId);
      autoSpeakTimeoutId = null;
    }

    currentSlideIndex = index;
    renderSlide();
    updateSlideCounter();

    // 編集パネル表示項目更新
    if (isEditMode) {
      updateActiveThumbnail();
      populateEditorFields();
    }

    // 自動読み上げが有効なら、一瞬待って再生を開始
    if (isAutoSpeakEnabled) {
      autoSpeakTimeoutId = setTimeout(() => {
        // 遷移途中で別のスライドに移った場合に多重起動するのを防ぐため、状態を確認
        if (currentSlideIndex === index && !synth.speaking && (!audioPlayer || audioPlayer.paused)) {
          if (!isSpeaking) {
            toggleSpeak();
          }
        }
      }, 350); // スライド遷移アニメーションが終わるのを少し待つ
    }
  }

  function nextSlide() {
    if (!currentDeck) return;
    if (currentSlideIndex < currentDeck.slides.length - 1) {
      goToSlide(currentSlideIndex + 1);
    }
  }

  function prevSlide() {
    if (!currentDeck) return;
    if (currentSlideIndex > 0) {
      goToSlide(currentSlideIndex - 1);
    }
  }

  function firstSlide() {
    goToSlide(0);
  }

  function lastSlide() {
    if (!currentDeck) return;
    goToSlide(currentDeck.slides.length - 1);
  }

  function updateSlideCounter() {
    if (!currentDeck) {
      elements.slideCounter.textContent = "0 / 0";
      return;
    }
    elements.slideCounter.textContent = `${currentSlideIndex + 1} / ${currentDeck.slides.length}`;
  }

  // --- イベントリスナー設定 ---
  function initEventListeners() {
    // デッキ切り替え
    elements.deckSelector.addEventListener("change", (e) => {
      loadDeck(e.target.value);
    });

    // 左右アローボタン
    elements.btnSlidePrev.addEventListener("click", prevSlide);
    elements.btnSlideNext.addEventListener("click", nextSlide);

    // キーボードショートカット
    document.addEventListener("keydown", (e) => {
      // フォーム入力中のショートカット無効化
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA" || document.activeElement.tagName === "SELECT") {
        return;
      }

      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
          nextSlide();
          e.preventDefault();
          break;
        case "ArrowLeft":
        case "PageUp":
        case "Backspace":
          prevSlide();
          e.preventDefault();
          break;
        case "Home":
          firstSlide();
          e.preventDefault();
          break;
        case "End":
          lastSlide();
          e.preventDefault();
          break;
        case "Escape":
          // フルスクリーン解除、描画解除、ポインター解除
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          if (isPenMode) togglePenMode(false);
          if (isLaserMode) toggleLaserMode(false);
          break;
        case "t":
        case "T":
          // タイマーの一時停止・再生
          toggleTimer();
          break;
        case "v":
        case "V":
          // 音声再生・停止
          toggleSpeak();
          e.preventDefault();
          break;
        case "a":
        case "A":
          // 自動読み上げモードのトグル
          toggleAutoSpeak();
          e.preventDefault();
          break;
      }
    });

    // モバイルスワイプ対応
    let touchStartX = 0;
    elements.slidePlayer.addEventListener("touchstart", (e) => {
      // 描画モード時はスワイプを無効化
      if (isPenMode) return;
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    elements.slidePlayer.addEventListener("touchend", (e) => {
      if (isPenMode) return;
      let touchEndX = e.changedTouches[0].screenX;
      let diff = touchEndX - touchStartX;
      if (diff < -50) {
        nextSlide();
      } else if (diff > 50) {
        prevSlide();
      }
    }, { passive: true });

    // コントロールバーナビゲーション
    elements.btnCtrlFirst.addEventListener("click", firstSlide);
    elements.btnCtrlPrev.addEventListener("click", prevSlide);
    elements.btnCtrlNext.addEventListener("click", nextSlide);
    elements.btnCtrlLast.addEventListener("click", lastSlide);

    // フルスクリーン切り替え
    elements.btnPlayFullscreen.addEventListener("click", toggleFullscreen);
    elements.btnCtrlFullscreen.addEventListener("click", toggleFullscreen);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // 編集モードトグル
    elements.btnToggleEdit.addEventListener("click", () => toggleEditMode(!isEditMode));
    elements.btnCloseEditor.addEventListener("click", () => toggleEditMode(false));

    // エディタサイドバーのタブ切り替え
    elements.tabSlides.addEventListener("click", () => switchEditorTab("slides"));
    elements.tabContent.addEventListener("click", () => switchEditorTab("content"));
    elements.tabSettings.addEventListener("click", () => switchEditorTab("settings"));

    // テーマセレクター
    elements.themeSelector.addEventListener("change", (e) => {
      setTheme(e.target.value);
    });

    // スピーカーノートトグル
    elements.btnToggleNotes.addEventListener("click", toggleSpeakerNotes);
    elements.btnCloseNotes.addEventListener("click", () => toggleSpeakerNotes(false));

    // タイマー操作
    elements.btnTimerToggle.addEventListener("click", toggleTimer);
    elements.btnTimerReset.addEventListener("click", resetTimer);
    elements.timerPresetSelector.addEventListener("change", (e) => {
      setTimerDuration(parseInt(e.target.value));
    });

    // ツール類
    elements.btnToolPen.addEventListener("click", () => togglePenMode(!isPenMode));
    elements.btnToolLaser.addEventListener("click", () => toggleLaserMode(!isLaserMode));
    elements.btnToolClear.addEventListener("click", clearCanvas);
    elements.btnToolSpeak.addEventListener("click", toggleSpeak);
    elements.btnToolAutoSpeak.addEventListener("click", toggleAutoSpeak);

    // ペンカラー選択
    elements.penColorSelector.querySelectorAll(".color-dot").forEach(dot => {
      dot.addEventListener("click", (e) => {
        elements.penColorSelector.querySelectorAll(".color-dot").forEach(d => d.classList.remove("active"));
        dot.classList.add("active");
        penColor = dot.getAttribute("data-color");
      });
    });

    // 設定・保存関連
    elements.btnSaveLocal.addEventListener("click", () => {
      saveDecksToStorage();
      alert("ブラウザに保存しました。");
    });
    elements.btnResetPreset.addEventListener("click", resetToPresets);
    elements.btnExportJson.addEventListener("click", exportDecksToJson);
    elements.fileImportJson.addEventListener("change", importDecksFromJson);
    elements.btnExportStandalone.addEventListener("click", exportStandaloneHtml);

    // デッキタイトル編集
    elements.editDeckTitle.addEventListener("input", (e) => {
      if (currentDeck) {
        currentDeck.title = e.target.value;
        saveDecksToStorage();
        renderDeckSelector();
        elements.deckSelector.value = currentDeck.id;
      }
    });

    // スライド追加
    elements.btnAddSlide.addEventListener("click", addSlide);

    // 編集フォーム入力変更検知
    elements.editSlideLayout.addEventListener("change", handleLayoutChange);
    elements.editSlideTitle.addEventListener("input", handleSlideTextChange);
    elements.editSlideSubtitle.addEventListener("input", handleSlideTextChange);
    elements.editSlideNotes.addEventListener("input", handleSlideNotesChange);
  }

  // --- フルスクリーン制御 ---
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      elements.appContainer.requestFullscreen().catch(err => {
        alert(`フルスクリーン化に失敗しました: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  function handleFullscreenChange() {
    if (document.fullscreenElement) {
      elements.appContainer.classList.add("fullscreen-mode");
      // フルスクリーン開始時に自動でペンとレーザーはOFFにする
      togglePenMode(false);
      toggleLaserMode(false);
    } else {
      elements.appContainer.classList.remove("fullscreen-mode");
    }
    // サイズ変更に合わせてキャンバス再設定
    setTimeout(resizeCanvas, 100);
  }

  // --- テーマ制御 ---
  function setTheme(themeClass) {
    elements.appContainer.className = elements.appContainer.className.replace(/theme-\w+/g, "");
    elements.appContainer.classList.add(themeClass);
    activeTheme = themeClass;
    elements.themeSelector.value = themeClass;
  }

  // --- スピーカーノートトグル ---
  function toggleSpeakerNotes(forceState) {
    const isVisible = typeof forceState === "boolean" ? !forceState : elements.presenterNotesDrawer.classList.contains("active");
    if (isVisible) {
      elements.presenterNotesDrawer.classList.remove("active");
      elements.btnToggleNotes.classList.remove("active");
    } else {
      elements.presenterNotesDrawer.classList.add("active");
      elements.btnToggleNotes.classList.add("active");
    }
  }

  // --- 編集モード制御 ---
  function toggleEditMode(state) {
    isEditMode = state;
    if (isEditMode) {
      elements.appContainer.classList.add("layout-editor");
      elements.btnToggleEdit.classList.add("btn-primary");
      elements.btnToggleEdit.classList.remove("btn-secondary");
      renderSlideThumbnails();
      populateEditorFields();
      switchEditorTab("slides");
    } else {
      elements.appContainer.classList.remove("layout-editor");
      elements.btnToggleEdit.classList.remove("btn-primary");
      elements.btnToggleEdit.classList.add("btn-secondary");
    }
    // レイアウト変化に合わせてキャンバスをリサイズ
    setTimeout(resizeCanvas, 300);
  }

  function switchEditorTab(tabName) {
    elements.tabSlides.classList.remove("active");
    elements.tabContent.classList.remove("active");
    elements.tabSettings.classList.remove("active");
    elements.panelSlides.classList.remove("active");
    elements.panelContent.classList.remove("active");
    elements.panelSettings.classList.remove("active");

    if (tabName === "slides") {
      elements.tabSlides.classList.add("active");
      elements.panelSlides.classList.add("active");
    } else if (tabName === "content") {
      elements.tabContent.classList.add("active");
      elements.panelContent.classList.add("active");
    } else if (tabName === "settings") {
      elements.tabSettings.classList.add("active");
      elements.panelSettings.classList.add("active");
    }
  }

  // --- 15分カウントダウンタイマー (Web Audio API) ---
  
  // AudioContextの取得 (遅延生成してブラウザのジェスチャー制限を回避)
  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // チャイム音合成
  function playChime() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // 音階の周波数定義 (G5 -> E5 の美しい和音チャイム)
      const frequencies = [783.99, 659.25]; // G5, E5
      const delays = [0, 0.4];
      const durations = [1.2, 1.6];

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // 正弦波でクリアなベル音、三角波を少し混ぜてふくよかにする
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + delays[idx]);

        // アタック・リリース音量エンベロープ
        gainNode.gain.setValueAtTime(0, now + delays[idx]);
        // アタック: 0.05秒で最大音量
        gainNode.gain.linearRampToValueAtTime(0.3, now + delays[idx] + 0.05);
        // ディケイ・リリース: 指数関数的に減衰
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delays[idx] + durations[idx]);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + delays[idx]);
        osc.stop(now + delays[idx] + durations[idx]);
      });
    } catch (e) {
      console.warn("Web Audio API チャイム再生に失敗しました。", e);
    }
  }

  function setTimerDuration(seconds) {
    timerDuration = seconds;
    resetTimer();
  }

  function toggleTimer() {
    if (timerInterval) {
      // 一時停止
      clearInterval(timerInterval);
      timerInterval = null;
      elements.timerToggleIcon.innerHTML = `<path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/>`;
    } else {
      // 開始
      getAudioContext(); // オーディオ初期化
      timerInterval = setInterval(updateTimer, 1000);
      elements.timerToggleIcon.innerHTML = `<path fill="currentColor" d="M14,19H18V5H14M6,19H10V5H6V19Z"/>`;
    }
  }

  function resetTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    timerSeconds = timerDuration;
    updateTimerDisplay();
    elements.timerToggleIcon.innerHTML = `<path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/>`;
  }

  function updateTimer() {
    if (timerSeconds > 0) {
      timerSeconds--;
      updateTimerDisplay();
    } else {
      // タイムアップ！
      clearInterval(timerInterval);
      timerInterval = null;
      elements.timerToggleIcon.innerHTML = `<path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/>`;
      
      // チャイム再生
      playChime();
      
      // トーストアラート表示
      showAlarmToast();
    }
  }

  function updateTimerDisplay() {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    elements.timerText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // 進捗率
    const percent = ((timerDuration - timerSeconds) / timerDuration) * 100;
    elements.timerProgress.style.width = `${percent}%`;

    // 残り時間警告色
    const remainingPercent = (timerSeconds / timerDuration) * 100;
    elements.timerProgress.className = "timer-progress";
    if (remainingPercent <= 10) {
      elements.timerProgress.classList.add("danger");
    } else if (remainingPercent <= 20) {
      elements.timerProgress.classList.add("warning");
    }
  }

  function showAlarmToast() {
    elements.alarmToast.classList.add("active");
    // 5秒後に自動消去
    setTimeout(() => {
      elements.alarmToast.classList.remove("active");
    }, 5000);
  }

  // --- 手書きキャンバス & レーザーポインター機能 ---
  function setupDrawingCanvas() {
    const canvas = elements.drawingCanvas;
    const ctx = canvas.getContext("2d");

    // リサイズ処理
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // キャンバス上のマウスイベント
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);

    // タッチイベント
    canvas.addEventListener("touchstart", (e) => {
      if (!isPenMode) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      lastX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
      lastY = ((touch.clientY - rect.top) / rect.height) * canvas.height;
      isDrawing = true;
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener("touchmove", (e) => {
      if (!isPenMode || !isDrawing) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = ((touch.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((touch.clientY - rect.top) / rect.height) * canvas.height;
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = penColor;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // 光彩エフェクト
      ctx.shadowBlur = 4;
      ctx.shadowColor = penColor;
      ctx.stroke();
      
      lastX = x;
      lastY = y;
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener("touchend", stopDrawing);

    // レーザーポインター移動追従
    elements.slidePlayer.addEventListener("mousemove", (e) => {
      if (!isLaserMode) return;
      const rect = elements.slidePlayer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      elements.laserPointer.style.left = `${x}px`;
      elements.laserPointer.style.top = `${y}px`;
    });

    elements.slidePlayer.addEventListener("mouseenter", () => {
      if (isLaserMode) elements.laserPointer.style.display = "block";
    });

    elements.slidePlayer.addEventListener("mouseleave", () => {
      elements.laserPointer.style.display = "none";
    });
  }

  function resizeCanvas() {
    const canvas = elements.drawingCanvas;
    const rect = elements.slideContainer.getBoundingClientRect();
    
    // スライドコンテナとぴったり重なるように配置
    canvas.style.left = `${rect.left - elements.slidePlayer.getBoundingClientRect().left}px`;
    canvas.style.top = `${rect.top - elements.slidePlayer.getBoundingClientRect().top}px`;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // 内部解像度を実際の描画ピクセルサイズに同期
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  function startDrawing(e) {
    if (!isPenMode) return;
    const canvas = elements.drawingCanvas;
    const rect = canvas.getBoundingClientRect();
    // スケール計算を考慮
    lastX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    lastY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    isDrawing = true;
  }

  function draw(e) {
    if (!isPenMode || !isDrawing) return;
    const canvas = elements.drawingCanvas;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // ネオン風グローエフェクト
    ctx.shadowBlur = 4;
    ctx.shadowColor = penColor;
    ctx.stroke();

    lastX = x;
    lastY = y;
  }

  function stopDrawing() {
    isDrawing = false;
  }

  function clearCanvas() {
    const canvas = elements.drawingCanvas;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function togglePenMode(state) {
    isPenMode = state;
    if (isPenMode) {
      // ペンONならレーザーポインターOFF
      toggleLaserMode(false);
      elements.appContainer.classList.add("drawing-mode");
      elements.btnToolPen.classList.add("active");
      elements.penColorSelector.classList.remove("hidden");
      elements.btnToolClear.classList.remove("hidden");
      resizeCanvas(); // リサイズ
    } else {
      elements.appContainer.classList.remove("drawing-mode");
      elements.btnToolPen.classList.remove("active");
      elements.penColorSelector.classList.add("hidden");
      elements.btnToolClear.classList.add("hidden");
    }
  }

  function toggleLaserMode(state) {
    isLaserMode = state;
    if (isLaserMode) {
      // レーザーONならペンOFF
      togglePenMode(false);
      elements.slidePlayer.classList.add("laser-mode");
      elements.btnToolLaser.classList.add("active");
      elements.laserPointer.style.display = "block";
    } else {
      elements.slidePlayer.classList.remove("laser-mode");
      elements.btnToolLaser.classList.remove("active");
      elements.laserPointer.style.display = "none";
    }
  }

  // --- 音声読み上げ機能 (SpeechSynthesis & VOICEVOX) ---
  function toggleSpeak() {
    if (!currentDeck) {
      console.warn("デッキがロードされていません。");
      return;
    }
    
    // 再生中ならキャンセルして停止（通信中の場合も含む）
    if (synth.speaking || (audioPlayer && !audioPlayer.paused) || voicevoxAbortController) {
      console.log("音声再生を停止します。");
      synth.cancel();
      if (audioPlayer) {
        // 停止処理によってonerrorやonendedが誤作動してフォールバックが発火するのを防ぐため、ハンドラを解除する
        audioPlayer.onerror = null;
        audioPlayer.onended = null;
        audioPlayer.onplay = null;
        audioPlayer.pause();
        audioPlayer.src = "";
      }
      if (voicevoxAbortController) {
        voicevoxAbortController.abort();
        voicevoxAbortController = null;
      }
      setSpeakState(false);
      return;
    }

    const slide = currentDeck.slides[currentSlideIndex];
    let textToSpeak = "";

    // スライドのレイアウトに合わせて読み上げる文面を構成
    if (slide.layout === "kamishibai") {
      textToSpeak = `${slide.title}。${slide.subtitle || ""}。${slide.content.description || ""}`;
    } else if (slide.layout === "title") {
      textToSpeak = `${slide.title}。${slide.subtitle || ""}。`;
    } else if (slide.layout === "list") {
      textToSpeak = `${slide.title}。${(slide.content.bullets || []).join("。")}`;
    } else if (slide.layout === "split") {
      textToSpeak = `${slide.title}。左の項目：${slide.content.leftTitle}。${(slide.content.leftBullets || []).join("。")}。右の項目：${slide.content.rightTitle}。${(slide.content.rightBullets || []).join("。")}`;
    } else if (slide.layout === "timeline") {
      const stepTexts = (slide.content.steps || []).map(s => `${s.label}、${s.desc}`).join("。");
      textToSpeak = `${slide.title}。${stepTexts}`;
    } else if (slide.layout === "quote") {
      textToSpeak = `${slide.title}。メッセージ：${slide.content.quote}。著者：${slide.content.author}`;
    }

    // 絵文字や記号などを除正、英語アルファベットの読み間違い（AI -> エーアイなど）をカナに置換
    textToSpeak = textToSpeak
      .replace(/💬/g, "")
      .replace(/💡/g, "")
      .replace(/AI/g, "エーアイ")
      .replace(/Scratch/g, "スクラッチ")
      .replace(/LT/g, "エルティー")
      .replace(/IT/g, "アイティー")
      .replace(/PC/g, "ピーシー")
      .replace(/\r?\n/g, " ") // 改行をスペースに置換してAPIの挙動を安定させる
      .replace(/\s+/g, " ");   // 連続する空白を1つにまとめる

    if (!textToSpeak.trim()) {
      console.warn("読み上げるテキストがありません。");
      return;
    }

    console.log("読み上げテキスト:", textToSpeak);

    // HTTPS環境（GitHub Pagesなど）の場合は、ローカルのVOICEVOX（HTTP）へのリクエストが
    // Mixed Contentポリシーでブロックされるため、最初から標準音声（Web Speech API）を使用する。
    if (window.location.protocol === "https:") {
      console.log("HTTPS環境のため、Mixed Contentエラーを回避するために標準音声合成（Web Speech API）を使用します。");
      playWithWebSpeech(textToSpeak);
      return;
    }

    // VOICEVOXのローカルAPIにリクエストを投げる
    // デフォルト: ずんだもん（スピーカーID 3）
    const voicevoxUrl = "http://127.0.0.1:50021";
    console.log("VOICEVOXでの再生を試みます...", voicevoxUrl);
    playWithVoicevox(textToSpeak);

    async function playWithVoicevox(text) {
      // 既存の通信があれば中断
      if (voicevoxAbortController) {
        voicevoxAbortController.abort();
      }
      voicevoxAbortController = new AbortController();
      const signal = voicevoxAbortController.signal;

      // タイムアウト設定用の関数
      const setupTimeout = (ms) => {
        return setTimeout(() => {
          if (voicevoxAbortController && !signal.aborted) {
            console.log("VOICEVOX通信タイムアウトによる中断");
            voicevoxAbortController.abort();
          }
        }, ms);
      };

      try {
        // 1. audio_queryの取得（長文対応のため5秒でタイムアウト）
        const queryTimeout = setupTimeout(5000);
        const queryRes = await fetch(`${voicevoxUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=3`, {
          method: "POST",
          signal: signal
        });
        clearTimeout(queryTimeout);

        if (!queryRes.ok) throw new Error(`VOICEVOX audio_query failed with status ${queryRes.status}`);
        const queryJson = await queryRes.json();

        // イントネーションのスピードを少し調整可能 (例: 話速 1.15)
        queryJson.speedScale = 1.15; 

        // 2. 音声合成の取得（長文かつCPU合成対応のため15秒でタイムアウト）
        const synthTimeout = setupTimeout(15000);
        console.log("VOICEVOXでの音声合成を実行中...");
        const synthRes = await fetch(`${voicevoxUrl}/synthesis?speaker=3`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(queryJson),
          signal: signal
        });
        clearTimeout(synthTimeout);

        if (!synthRes.ok) throw new Error(`VOICEVOX synthesis failed with status ${synthRes.status}`);
        const audioBlob = await synthRes.blob();
        console.log("VOICEVOXでの音声合成に成功しました。再生を開始します。");

        // 正常終了したのでコントローラーをクリア
        voicevoxAbortController = null;

        const audioUrl = URL.createObjectURL(audioBlob);
        if (!audioPlayer) {
          audioPlayer = new Audio();
        }
        audioPlayer.src = audioUrl;
        audioPlayer.onplay = () => setSpeakState(true);
        audioPlayer.onended = () => {
          setSpeakState(false);
          URL.revokeObjectURL(audioUrl);
        };
        audioPlayer.onerror = (err) => {
          console.error("AudioPlayerでエラーが発生したため、標準音声合成へフォールバックします。", err);
          playWithWebSpeech(text);
        };
        
        audioPlayer.play().catch(err => {
          console.error("AudioPlayerの再生に失敗したため、標準音声合成へフォールバックします。", err);
          playWithWebSpeech(text);
        });
      } catch (e) {
        // 意図的なキャンセルの場合は何もしない
        if (signal.aborted) {
          console.log("VOICEVOX再生はユーザーの操作またはスライド遷移によりキャンセルされました。");
          return;
        }
        console.log("VOICEVOX接続エラー、タイムアウト、またはCORS制限のため標準音声合成（Web Speech API）で読み上げます。", e.message);
        playWithWebSpeech(text);
      }
    }

    function playWithWebSpeech(text) {
      console.log("標準音声合成（Web Speech API）で読み上げを開始します。");
      // 既存の読み上げを確実にキャンセル
      synth.cancel();

      utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      
      const voices = synth.getVoices();
      const jaVoice = voices.find(v => v.lang.includes("ja"));
      if (jaVoice) {
        utterance.voice = jaVoice;
        console.log("日本語音声を適用しました:", jaVoice.name);
      } else {
        console.log("日本語音声が見つからないため、ブラウザデフォルトで再生します。");
      }

      utterance.onstart = () => {
        console.log("標準音声合成の再生が開始されました。");
        setSpeakState(true);
      };
      utterance.onend = () => {
        console.log("標準音声合成の再生が完了しました。");
        setSpeakState(false);
      };
      utterance.onerror = (event) => {
        console.error("標準音声合成の再生エラーが発生しました:", event.error, event);
        setSpeakState(false);
      };

      synth.speak(utterance);
    }
  }

  function setSpeakState(state) {
    isSpeaking = state;
    const btn = elements.btnToolSpeak;
    if (!btn) return;
    if (state) {
      btn.classList.add("active");
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16,16H14V8H16V16M10,16H8V8H10V16Z"/></svg>`;
      btn.title = "読み上げを停止 (ショートカット: V)";
    } else {
      btn.classList.remove("active");
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/></svg>`;
      btn.title = "音声で読み上げる (ショートカット: V)";
    }
  }

  function toggleAutoSpeak() {
    isAutoSpeakEnabled = !isAutoSpeakEnabled;
    updateAutoSpeakButtonState();
    try {
      localStorage.setItem("yume_slides_autospeak", isAutoSpeakEnabled);
    } catch (e) {
      console.warn("自動再生設定の保存に失敗しました", e);
    }
  }

  function loadAutoSpeakConfig() {
    try {
      const saved = localStorage.getItem("yume_slides_autospeak");
      if (saved !== null) {
        isAutoSpeakEnabled = saved === "true";
        updateAutoSpeakButtonState();
      }
    } catch (e) {
      console.warn("自動再生設定のロードに失敗しました", e);
    }
  }

  function updateAutoSpeakButtonState() {
    const btn = elements.btnToolAutoSpeak;
    if (!btn) return;
    if (isAutoSpeakEnabled) {
      btn.classList.add("active");
      btn.title = "自動読み上げをOFFにする (ショートカット: A | 現在: ON)";
    } else {
      btn.classList.remove("active");
      btn.title = "自動読み上げをONにする (ショートカット: A | 現在: OFF)";
    }
  }

  // --- スライドサムネイルリスト描画（編集用） ---
  function renderSlideThumbnails() {
    if (!currentDeck) return;
    elements.slideThumbnailList.innerHTML = "";
    
    currentDeck.slides.forEach((slide, idx) => {
      const li = document.createElement("li");
      li.className = `slide-item ${idx === currentSlideIndex ? 'active' : ''}`;
      li.setAttribute("data-index", idx);

      li.innerHTML = `
        <span class="slide-item-index">${idx + 1}</span>
        <div class="slide-item-info">
          <div class="slide-item-title">${escapeHtml(slide.title || "無題のスライド")}</div>
          <div class="slide-item-layout">${getLayoutLabel(slide.layout)}</div>
        </div>
        <div class="slide-item-actions">
          <button class="btn-icon btn-move-up" title="上へ移動">
            <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"/></svg>
          </button>
          <button class="btn-icon btn-move-down" title="下へ移動">
            <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/></svg>
          </button>
          <button class="btn-icon btn-delete" title="削除">
            <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
          </button>
        </div>
      `;

      // クリックでスライド切り替え
      li.addEventListener("click", (e) => {
        // アクションボタン（削除など）クリック時は除く
        if (e.target.closest(".btn-icon")) return;
        goToSlide(idx);
      });

      // 上下移動・削除ボタンのイベント
      li.querySelector(".btn-move-up").addEventListener("click", () => moveSlide(idx, -1));
      li.querySelector(".btn-move-down").addEventListener("click", () => moveSlide(idx, 1));
      li.querySelector(".btn-delete").addEventListener("click", () => deleteSlide(idx));

      elements.slideThumbnailList.appendChild(li);
    });
  }

  function updateActiveThumbnail() {
    const items = elements.slideThumbnailList.querySelectorAll(".slide-item");
    items.forEach((item, idx) => {
      if (idx === currentSlideIndex) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }

  function getLayoutLabel(layout) {
    const labels = {
      title: "タイトル",
      list: "箇条書き",
      split: "2カラム分割",
      timeline: "タイムライン",
      quote: "メッセージ",
      kamishibai: "紙芝居"
    };
    return labels[layout] || layout;
  }

  // --- スライド操作（追加・削除・移動） ---
  function addSlide() {
    if (!currentDeck) return;
    
    const newSlide = {
      id: "slide-" + Date.now(),
      layout: "list",
      title: "新しいスライド",
      subtitle: "説明をここに入力",
      content: {
        bullets: ["箇条書き項目 1", "箇条書き項目 2"]
      },
      notes: "発表用のメモです。"
    };

    currentDeck.slides.splice(currentSlideIndex + 1, 0, newSlide);
    saveDecksToStorage();
    
    renderSlideThumbnails();
    goToSlide(currentSlideIndex + 1);
    switchEditorTab("content");
  }

  function deleteSlide(idx) {
    if (!currentDeck || currentDeck.slides.length <= 1) {
      alert("これ以上スライドを削除できません。最低1枚必要です。");
      return;
    }

    if (confirm("このスライドを削除してよろしいですか？")) {
      currentDeck.slides.splice(idx, 1);
      saveDecksToStorage();

      // インデックスの境界調整
      if (currentSlideIndex >= currentDeck.slides.length) {
        currentSlideIndex = currentDeck.slides.length - 1;
      }
      
      renderSlideThumbnails();
      goToSlide(currentSlideIndex);
    }
  }

  function moveSlide(idx, direction) {
    if (!currentDeck) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= currentDeck.slides.length) return;

    // スワップ
    const temp = currentDeck.slides[idx];
    currentDeck.slides[idx] = currentDeck.slides[targetIdx];
    currentDeck.slides[targetIdx] = temp;
    
    saveDecksToStorage();
    renderSlideThumbnails();
    
    // 現在選択中のインデックスを調整して再表示
    if (currentSlideIndex === idx) {
      goToSlide(targetIdx);
    } else if (currentSlideIndex === targetIdx) {
      goToSlide(idx);
    } else {
      updateActiveThumbnail();
    }
  }

  // --- エディタフォームのバインディング・編集 ---
  function populateEditorFields() {
    if (!currentDeck || currentDeck.slides.length === 0) return;
    const slide = currentDeck.slides[currentSlideIndex];

    elements.editSlideLayout.value = slide.layout;
    elements.editSlideTitle.value = slide.title || "";
    elements.editSlideSubtitle.value = slide.subtitle || "";
    elements.editSlideNotes.value = slide.notes || "";

    renderDynamicFormFields(slide);
  }

  // レイアウトごとの動的入力フィールド生成
  function renderDynamicFormFields(slide) {
    const container = elements.dynamicFieldsContainer;
    container.innerHTML = "";

    switch (slide.layout) {
      case "title":
        container.innerHTML = `
          <div class="form-group">
            <label for="edit-title-bgtext">背景巨大文字 (英数推奨):</label>
            <input type="text" id="edit-title-bgtext" class="form-control" value="${escapeHtml(slide.content.bgText || 'DREAM')}">
          </div>
          <div class="form-group">
            <label for="edit-title-caption">下部組織/名前キャプション:</label>
            <input type="text" id="edit-title-caption" class="form-control" value="${escapeHtml(slide.content.caption || '')}">
          </div>
        `;
        // イベント紐付け
        document.getElementById("edit-title-bgtext").addEventListener("input", e => updateContentField("bgText", e.target.value));
        document.getElementById("edit-title-caption").addEventListener("input", e => updateContentField("caption", e.target.value));
        break;

      case "list":
        container.innerHTML = `
          <div class="form-group">
            <label for="edit-list-bullets">箇条書き (1行1項目):</label>
            <textarea id="edit-list-bullets" class="form-control" rows="6">${(slide.content.bullets || []).join("\n")}</textarea>
          </div>
        `;
        document.getElementById("edit-list-bullets").addEventListener("input", e => {
          const arr = e.target.value.split("\n").filter(line => line.trim() !== "");
          updateContentField("bullets", arr);
        });
        break;

      case "split":
        container.innerHTML = `
          <div class="sub-field-group">
            <div class="sub-field-title">左カラム</div>
            <div class="form-group">
              <label for="edit-split-ltitle">左見出し:</label>
              <input type="text" id="edit-split-ltitle" class="form-control" value="${escapeHtml(slide.content.leftTitle || '')}">
            </div>
            <div class="form-group">
              <label for="edit-split-lbullets">左箇条書き (1行1項目):</label>
              <textarea id="edit-split-lbullets" class="form-control" rows="4">${(slide.content.leftBullets || []).join("\n")}</textarea>
            </div>
          </div>
          <div class="sub-field-group">
            <div class="sub-field-title">右カラム</div>
            <div class="form-group">
              <label for="edit-split-rtitle">右見出し:</label>
              <input type="text" id="edit-split-rtitle" class="form-control" value="${escapeHtml(slide.content.rightTitle || '')}">
            </div>
            <div class="form-group">
              <label for="edit-split-rbullets">右箇条書き (1行1項目):</label>
              <textarea id="edit-split-rbullets" class="form-control" rows="4">${(slide.content.rightBullets || []).join("\n")}</textarea>
            </div>
          </div>
        `;
        document.getElementById("edit-split-ltitle").addEventListener("input", e => updateContentField("leftTitle", e.target.value));
        document.getElementById("edit-split-rtitle").addEventListener("input", e => updateContentField("rightTitle", e.target.value));
        document.getElementById("edit-split-lbullets").addEventListener("input", e => {
          const arr = e.target.value.split("\n").filter(line => line.trim() !== "");
          updateContentField("leftBullets", arr);
        });
        document.getElementById("edit-split-rbullets").addEventListener("input", e => {
          const arr = e.target.value.split("\n").filter(line => line.trim() !== "");
          updateContentField("rightBullets", arr);
        });
        break;

      case "timeline":
        const steps = slide.content.steps || [];
        let stepsInputs = "";
        for (let i = 0; i < 4; i++) {
          const step = steps[i] || { label: `ステップ ${i+1}`, desc: "" };
          stepsInputs += `
            <div class="sub-field-group">
              <div class="sub-field-title">ポイント ${i + 1}</div>
              <div class="form-group">
                <label for="edit-timeline-label-${i}">時期・タイトル:</label>
                <input type="text" id="edit-timeline-label-${i}" class="form-control" value="${escapeHtml(step.label)}">
              </div>
              <div class="form-group">
                <label for="edit-timeline-desc-${i}">詳細説明:</label>
                <textarea id="edit-timeline-desc-${i}" class="form-control" rows="2">${escapeHtml(step.desc)}</textarea>
              </div>
            </div>
          `;
        }
        container.innerHTML = stepsInputs;
        
        // イベントリスナーの一括設定
        for (let i = 0; i < 4; i++) {
          const labelInput = document.getElementById(`edit-timeline-label-${i}`);
          const descInput = document.getElementById(`edit-timeline-desc-${i}`);

          const saveStep = () => {
            const currentSteps = [...(currentDeck.slides[currentSlideIndex].content.steps || [])];
            if (!currentSteps[i]) currentSteps[i] = { label: "", desc: "" };
            currentSteps[i].label = labelInput.value;
            currentSteps[i].desc = descInput.value;
            updateContentField("steps", currentSteps);
          };

          labelInput.addEventListener("input", saveStep);
          descInput.addEventListener("input", saveStep);
        }
        break;

      case "quote":
        container.innerHTML = `
          <div class="form-group">
            <label for="edit-quote-text">引用メッセージ:</label>
            <textarea id="edit-quote-text" class="form-control" rows="3">${escapeHtml(slide.content.quote || '')}</textarea>
          </div>
          <div class="form-group">
            <label for="edit-quote-author">著者・発言者:</label>
            <input type="text" id="edit-quote-author" class="form-control" value="${escapeHtml(slide.content.author || '')}">
          </div>
          <div class="form-group">
            <label for="edit-quote-bullets">補足・解説 (1行1項目・任意):</label>
            <textarea id="edit-quote-bullets" class="form-control" rows="3">${(slide.content.bullets || []).join("\n")}</textarea>
          </div>
        `;
        document.getElementById("edit-quote-text").addEventListener("input", e => updateContentField("quote", e.target.value));
        document.getElementById("edit-quote-author").addEventListener("input", e => updateContentField("author", e.target.value));
        document.getElementById("edit-quote-bullets").addEventListener("input", e => {
          const arr = e.target.value.split("\n").filter(line => line.trim() !== "");
          updateContentField("bullets", arr);
        });
        break;

      case "kamishibai":
        container.innerHTML = `
          <div class="form-group">
            <label for="edit-kamishibai-image">画像 URL (または下部で生成):</label>
            <input type="text" id="edit-kamishibai-image" class="form-control" value="${escapeHtml(slide.content.image || '')}">
          </div>
          <div class="sub-field-group">
            <div class="sub-field-title">🤖 AIイラスト生成 (Pollinations AI)</div>
            <div class="form-group">
              <label for="edit-kamishibai-prompt">画像生成プロンプト (英語推奨):</label>
              <textarea id="edit-kamishibai-prompt" class="form-control" rows="2" placeholder="例: cute robot teaching kids, cartoon style, warm colors">${escapeHtml(slide.content.prompt || '')}</textarea>
            </div>
            <button id="btn-kamishibai-generate" class="btn btn-primary btn-sm" style="margin-top: 8px; justify-content: center;">
              ✨ AIイラスト生成
            </button>
          </div>
          <div class="form-group">
            <label for="edit-kamishibai-desc">ストーリー説明文 (改行可能):</label>
            <textarea id="edit-kamishibai-desc" class="form-control" rows="5">${escapeHtml(slide.content.description || '')}</textarea>
          </div>
        `;

        const imageInput = document.getElementById("edit-kamishibai-image");
        const promptInput = document.getElementById("edit-kamishibai-prompt");
        const descInput = document.getElementById("edit-kamishibai-desc");
        const genBtn = document.getElementById("btn-kamishibai-generate");

        imageInput.addEventListener("input", e => updateContentField("image", e.target.value));
        promptInput.addEventListener("input", e => {
          currentDeck.slides[currentSlideIndex].content.prompt = e.target.value;
          saveDecksToStorage();
        });
        descInput.addEventListener("input", e => updateContentField("description", e.target.value));

        genBtn.addEventListener("click", () => {
          const prompt = promptInput.value.trim() || slide.title || "illustration";
          genBtn.disabled = true;
          genBtn.innerHTML = `
            <svg class="logo-icon" viewBox="0 0 24 24" width="16" height="16" style="animation: logo-spin 1.5s linear infinite; margin-right: 6px;"><path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/></svg>
            <span>生成中...</span>
          `;
          
          const seed = Math.floor(Math.random() * 1000000);
          const enhancedPrompt = `${prompt}, paper play style illustration, pastel colors, clean detailed drawing`;
          const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=800&height=600&nologo=true&seed=${seed}`;

          const img = new Image();
          img.src = imageUrl;
          img.onload = () => {
            imageInput.value = imageUrl;
            updateContentField("image", imageUrl);
            genBtn.disabled = false;
            genBtn.innerHTML = `✨ AIイラスト生成`;
          };
          img.onerror = () => {
            alert("画像の生成に失敗しました。時間をおいて再度お試しください。");
            genBtn.disabled = false;
            genBtn.innerHTML = `✨ AIイラスト生成`;
          };
        });
        break;
    }
  }

  // フォームデータ更新イベントハンドラ
  function handleSlideTextChange(e) {
    if (!currentDeck) return;
    const slide = currentDeck.slides[currentSlideIndex];
    
    if (e.target.id === "edit-slide-title") {
      slide.title = e.target.value;
    } else if (e.target.id === "edit-slide-subtitle") {
      slide.subtitle = e.target.value;
    }

    saveDecksToStorage();
    renderSlide();
    updateActiveSlideThumbnailText();
  }

  function handleSlideNotesChange(e) {
    if (!currentDeck) return;
    const slide = currentDeck.slides[currentSlideIndex];
    slide.notes = e.target.value;
    saveDecksToStorage();
    elements.notesContent.textContent = slide.notes || "スピーカーノートはありません。";
  }

  function handleLayoutChange(e) {
    if (!currentDeck) return;
    const slide = currentDeck.slides[currentSlideIndex];
    const newLayout = e.target.value;
    slide.layout = newLayout;

    // 各レイアウトで必要となるcontent初期構造に調整
    if (newLayout === "title") {
      slide.content = { bgText: "DREAM", caption: currentDeck.title };
    } else if (newLayout === "list") {
      slide.content = { bullets: ["新しい項目 1", "新しい項目 2"] };
    } else if (newLayout === "split") {
      slide.content = { 
        leftTitle: "項目 A", leftBullets: ["詳細 1"], 
        rightTitle: "項目 B", rightBullets: ["詳細 2"] 
      };
    } else if (newLayout === "timeline") {
      slide.content = { 
        steps: [
          { label: "初期", desc: "ここにステップ1の説明" },
          { label: "展開", desc: "ここにステップ2の説明" },
          { label: "転機", desc: "ここにステップ3の説明" },
          { label: "成果", desc: "ここにステップ4の説明" }
        ] 
      };
    } else if (newLayout === "quote") {
      slide.content = { quote: "新しい名言", author: "著者", bullets: [] };
    } else if (newLayout === "kamishibai") {
      slide.content = { 
        image: "", 
        prompt: slide.title || "illustration", 
        description: "ここにストーリー説明文が入ります。" 
      };
    }

    saveDecksToStorage();
    renderSlide();
    renderSlideThumbnails(); // サムネイルのレイアウト名表記を更新
    populateEditorFields();
  }

  function updateContentField(key, value) {
    if (!currentDeck) return;
    currentDeck.slides[currentSlideIndex].content[key] = value;
    saveDecksToStorage();
    renderSlide();
  }

  function updateActiveSlideThumbnailText() {
    const activeThumb = elements.slideThumbnailList.querySelector(".slide-item.active");
    if (activeThumb && currentDeck) {
      const slide = currentDeck.slides[currentSlideIndex];
      activeThumb.querySelector(".slide-item-title").textContent = slide.title || "無題のスライド";
    }
  }

  // --- 設定パネルアクション (インポート/エクスポート/初期化) ---
  
  function resetToPresets() {
    if (confirm("編集内容がすべて削除され、初期状態に戻ります。よろしいですか？")) {
      decks = [...window.YUME_DECKS];
      saveDecksToStorage();
      renderDeckSelector();
      loadDeck(decks[0].id);
      if (isEditMode) {
        renderSlideThumbnails();
        populateEditorFields();
      }
      alert("初期プリセットに戻しました。");
    }
  }

  function exportDecksToJson() {
    const jsonStr = JSON.stringify(decks, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `yume_slides_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importDecksFromJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const imported = JSON.parse(evt.target.result);
        if (Array.isArray(imported) && imported.length > 0 && imported[0].slides) {
          decks = imported;
          saveDecksToStorage();
          renderDeckSelector();
          loadDeck(decks[0].id);
          alert("スライドデータを読み込みました。");
        } else {
          alert("無効なJSONフォーマットです。夢授業スライドのデータファイルを選択してください。");
        }
      } catch (err) {
        alert(`JSON解析エラー: ${err.message}`);
      }
    };
    reader.readAsText(file);
  }

  // 自己完結（オフライン）HTML生成・ダウンロード
  function exportStandaloneHtml() {
    if (!currentDeck) return;
    
    // 現在のCSSとJSを取得するためにローカルサーバーからフェッチを試みる
    // CORSエラー等でフェッチが失敗した場合は、テンプレートデータからインライン化
    const fetchCss = fetch("style.css").then(r => r.text()).catch(() => "");
    const fetchJs = fetch("app.js").then(r => r.text()).catch(() => "");

    Promise.all([fetchCss, fetchJs]).then(([cssText, jsText]) => {
      // ローカル開発中でフェッチできればそれを使うが、もし空なら現在のHTMLや内部コードを適宜挿入
      const docHtml = document.documentElement.outerHTML;
      
      // index.html のスケルトンから単一HTMLを組み上げる
      let template = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(currentDeck.title)} - 夢授業</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    ${cssText || '/* style.css placeholder (開発環境サーバー上でダウンロードするとCSSが埋め込まれます) */'}
  </style>
</head>
<body class="${activeTheme}">
  <div id="app-container" class="layout-viewer">
    
    <header id="top-navbar" class="top-navbar">
      <div class="nav-left">
        <span class="app-logo">
          <svg viewBox="0 0 24 24" width="24" height="24" class="logo-icon">
            <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,14.09 19.2,15.97 17.9,17.4L16.47,15.97C17.43,14.89 18,13.5 18,12A6,6 0 0,0 12,6V4M12,8A4,4 0 0,1 16,12C16,13 15.6,13.9 15,14.58L13.59,13.17C13.85,12.87 14,12.45 14,12A2,2 0 0,0 12,10V8M12,12A2,2 0 0,1 10,14V16A4,4 0 0,0 14,12H12M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6V8A4,4 0 0,0 8,12A4,4 0 0,0 12,16V18M12,20V22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20Z"/>
          </svg>
          夢授業スライド (オフライン版)
        </span>
        <select id="deck-selector" class="deck-selector"></select>
      </div>
      <div class="nav-right">
        <button id="btn-toggle-edit" class="btn btn-secondary">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z"/></svg>
          <span>編集モード</span>
        </button>
        <button id="btn-play-fullscreen" class="btn btn-primary">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M5,5H10V7H7V10H5V5M14,5H19V10H17V7H14V5M17,14H19V19H14V17H17V14M10,17V19H5V14H7V17H10Z"/></svg>
          <span>全画面発表</span>
        </button>
      </div>
    </header>

    <main class="main-workspace">
      <section id="slide-player" class="slide-player">
        <div id="slide-container" class="slide-container"></div>
        <canvas id="drawing-canvas"></canvas>
        <div id="laser-pointer" class="laser-pointer"></div>
        <button id="btn-slide-prev" class="nav-arrow nav-arrow-left">
          <svg viewBox="0 0 24 24" width="36" height="36"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"/></svg>
        </button>
        <button id="btn-slide-next" class="nav-arrow nav-arrow-right">
          <svg viewBox="0 0 24 24" width="36" height="36"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/></svg>
        </button>
      </section>

      <aside id="editor-sidebar" class="editor-sidebar">
        <div class="sidebar-header">
          <h3>スライド編集パネル</h3>
          <button id="btn-close-editor" class="btn-icon">
            <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>
          </button>
        </div>
        <div class="sidebar-tabs">
          <button id="tab-slides" class="tab-btn active">スライド一覧</button>
          <button id="tab-content" class="tab-btn">スライド内容</button>
          <button id="tab-settings" class="tab-btn">保存/入出力</button>
        </div>
        <div class="sidebar-scroll-content">
          <div id="panel-slides" class="editor-panel active">
            <div class="deck-meta-edit">
              <label for="edit-deck-title">タイトル:</label>
              <input type="text" id="edit-deck-title" class="form-control">
            </div>
            <div class="slide-list-controls">
              <button id="btn-add-slide" class="btn btn-sm btn-secondary">＋ スライド追加</button>
            </div>
            <ul id="slide-thumbnail-list" class="slide-thumbnail-list"></ul>
          </div>
          <div id="panel-content" class="editor-panel">
            <div class="form-group">
              <label for="edit-slide-layout">レイアウト:</label>
              <select id="edit-slide-layout" class="form-control">
                <option value="title">タイトルスライド</option>
                <option value="list">箇条書きスライド</option>
                <option value="split">左右2分割スライド</option>
                <option value="timeline">タイムライン</option>
                <option value="quote">名言・メッセージ</option>
                <option value="kamishibai">紙芝居（イラスト＋ストーリー）</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit-slide-title">スライドタイトル:</label>
              <input type="text" id="edit-slide-title" class="form-control">
            </div>
            <div class="form-group">
              <label for="edit-slide-subtitle">サブタイトル:</label>
              <input type="text" id="edit-slide-subtitle" class="form-control">
            </div>
            <div id="dynamic-fields-container"></div>
            <div class="form-group">
              <label for="edit-slide-notes">発表者ノート:</label>
              <textarea id="edit-slide-notes" class="form-control text-area-notes" rows="4"></textarea>
            </div>
          </div>
          <div id="panel-settings" class="editor-panel">
            <div class="settings-section">
              <h4>データの保存と復元</h4>
              <div class="btn-stack">
                <button id="btn-save-local" class="btn btn-secondary">保存</button>
                <button id="btn-reset-preset" class="btn btn-danger">初期化</button>
              </div>
            </div>
            <div class="settings-section">
              <h4>外部ファイル</h4>
              <div class="btn-stack">
                <button id="btn-export-json" class="btn btn-secondary">JSONとして書き出し</button>
                <div class="file-input-wrapper">
                  <button class="btn btn-secondary btn-file-dummy">JSON読み込み</button>
                  <input type="file" id="file-import-json" accept=".json">
                </div>
              </div>
            </div>
            <div class="settings-section">
              <h4>オフライン配布用HTML</h4>
              <button id="btn-export-standalone" class="btn btn-primary">オフライン用HTMLのダウンロード</button>
            </div>
          </div>
        </div>
      </aside>
    </main>

    <div id="presenter-control-bar" class="presenter-control-bar">
      <div class="control-group nav-controls">
        <button id="btn-ctrl-first" class="btn-control"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M18.41,16.59L13.82,12L18.41,7.41L17,6L11,12L17,18L18.41,16.59M6,6H8V18H6V6Z"/></svg></button>
        <button id="btn-ctrl-prev" class="btn-control"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"/></svg></button>
        <span id="slide-counter" class="slide-counter">0 / 0</span>
        <button id="btn-ctrl-next" class="btn-control"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/></svg></button>
        <button id="btn-ctrl-last" class="btn-control"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M5.59,7.41L10.18,12L5.59,16.59L7,18L13,12L7,6L5.59,7.41M16,6H18V18H16V6Z"/></svg></button>
      </div>
      <div class="divider"></div>
      <div class="control-group timer-controls">
        <span class="control-icon"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/></svg></span>
        <div class="timer-display-container">
          <span id="timer-text" class="timer-text">15:00</span>
          <div class="timer-progress-bar"><div id="timer-progress" class="timer-progress"></div></div>
        </div>
        <button id="btn-timer-toggle" class="btn-control"><svg id="timer-toggle-icon" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg></button>
        <button id="btn-timer-reset" class="btn-control"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12,5V1L7,6L12,11V7A6,6 0 0,1 18,13A6,6 0 0,1 12,19A6,6 0 0,1 6,13H4A8,8 0 0,0 12,21A8,8 0 0,0 20,13A8,8 0 0,0 12,5Z"/></svg></button>
        <select id="timer-preset-selector" class="timer-preset-selector">
          <option value="900">15分</option>
          <option value="600">10分</option>
          <option value="300">5分</option>
          <option value="60">1分</option>
          <option value="10">10秒</option>
        </select>
      </div>
      <div class="divider"></div>
      <div class="control-group tool-controls">
        <button id="btn-tool-laser" class="btn-control"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M12 20C7.58 20 4 16.42 4 12S7.58 4 12 4 20 7.58 20 12 16.42 20 12 20M12 11C11.45 11 11 11.45 11 12S11.45 13 12 13 13 12.55 13 12 12.55 11 12 11M12 7C9.24 7 7 9.24 7 12S9.24 17 12 17 17 14.76 17 12 14.76 7 12 7Z"/></svg></button>
        <button id="btn-tool-pen" class="btn-control"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.94L14.06,6.19L3,17.25Z"/></svg></button>
        <div id="pen-color-selector" class="pen-color-selector hidden">
          <button class="color-dot color-red active" data-color="#ff3b30"></button>
          <button class="color-dot color-blue" data-color="#007aff"></button>
          <button class="color-dot color-green" data-color="#34c759"></button>
          <button class="color-dot color-yellow" data-color="#ffcc00"></button>
        </div>
        <button id="btn-tool-clear" class="btn-control hidden"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19.36,2.72L20.78,4.14L15.06,9.85C16.13,11.39 16.28,13.24 15.38,14.44L9.06,8.12C10.26,7.22 12.11,7.37 13.65,8.44L19.36,2.72M5.93,17.57C3.97,15.62 3.97,12.45 5.93,10.5L9.06,13.62L5.93,17.57M18.5,18.5C18.5,19.88 15.37,21 11.5,21C7.63,21 4.5,19.88 4.5,18.5V17.5H18.5V18.5Z"/></svg></button>
        <button id="btn-tool-speak" class="btn-control"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/></svg></button>
      </div>
      <div class="divider"></div>
      <div class="control-group appearance-controls">
        <span class="control-icon"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,13.3 19.47,14.47 18.61,15.32L16.47,13.17C17.38,12.19 17.36,10.66 16.42,9.7C15.47,8.75 13.94,8.73 12.96,9.65L10.82,7.5C11.19,7.18 11.57,6.91 12,6.7V4M12,8A4,4 0 0,0 8,12C8,12.43 8.07,12.85 8.2,13.24L6.44,15C5.53,14.15 5,12.94 5,11.6V8A6,6 0 0,1 11,2H12A8,8 0 0,1 12,8Z"/></svg></span>
        <select id="theme-selector" class="theme-selector">
          <option value="theme-ocean">Kitakyushu Ocean</option>
          <option value="theme-cafe">Warm Cafe</option>
          <option value="theme-cyber">Future Cyber</option>
          <option value="theme-sakura">Sakura Pink</option>
        </select>
        <button id="btn-toggle-notes" class="btn-control"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.3,21.6C10.1,21.8 9.8,22 9,22M10,16H18V14H10V16M10,12H18V10H10V12M10,8H18V6H10V8M4,6V16H8V18.1L10.1,16H20V4H4V6Z"/></svg></button>
        <button id="btn-ctrl-fullscreen" class="btn-control"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M5,5H10V7H7V10H5V5M14,5H19V10H17V7H14V5M17,14H19V19H14V17H17V14M10,17V19H5V14H7V17H10Z"/></svg></button>
      </div>
    </div>

    <div id="presenter-notes-drawer" class="presenter-notes-drawer">
      <div class="notes-header">
        <h4>🗣️ スピーカーノート (発表用メモ)</h4>
        <button id="btn-close-notes" class="btn-icon"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg></button>
      </div>
      <div id="notes-content" class="notes-content"></div>
    </div>

    <div id="alarm-toast" class="alarm-toast hidden">
      <div class="toast-icon">⏰</div>
      <div class="toast-body">
        <h4>15分セッション終了！</h4>
        <p>次のグループへ交代してください。</p>
      </div>
    </div>
  </div>

  <script>
    // プリセットスライドデータをインライン展開
    window.YUME_DECKS = ${JSON.stringify(decks)};
    
    // JSのロジック本体をインライン展開
    ${jsText.replace(/<\/script>/g, "<\\/script>") || '/* app.js placeholder (開発環境サーバー上でダウンロードすると実行JSが埋め込まれます) */'}
  </script>
</body>
</html>`;

      const blob = new Blob([template], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `yume_slides_${currentDeck.id}_standalone.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

})();

class MonopolyUI {
  constructor(game, board3d, sounds) {
    this.game = game;
    this.board3d = board3d;
    this.sounds = sounds;
    this.ai = new MonopolyAI(game);
    this.isWheelSpinning = false;
    this.wheelRotation = 0;

    this.initDOM();
  }

  initDOM() {
    this.bindEvents();
    this.renderPlayersBar();
    this.updateTurnUI();
    this.drawFortuneWheel();
  }

  bindEvents() {
    const rollBtn = document.getElementById("btn-roll");
    if (rollBtn) {
      rollBtn.addEventListener("click", () => this.handleRollClick());
    }

    document.getElementById("btn-properties")?.addEventListener("click", () => {
      this.sounds.playButton();
      this.openPropertiesModal();
    });

    document.getElementById("btn-trade")?.addEventListener("click", () => {
      this.sounds.playButton();
      this.openTradeModal();
    });

    document.getElementById("btn-wheel")?.addEventListener("click", () => {
      this.sounds.playButton();
      this.openWheelModal();
    });

    document.getElementById("btn-settings")?.addEventListener("click", () => {
      this.sounds.playButton();
      this.openSettingsModal();
    });

    document.getElementById("btn-log")?.addEventListener("click", () => {
      this.sounds.playButton();
      this.toggleGameLog();
    });

    document.querySelectorAll(".modal-close").forEach(btn => {
      btn.addEventListener("click", (e) => {
        this.sounds.playButton();
        const modal = e.target.closest(".modal-overlay");
        if (modal) modal.classList.remove("active");
      });
    });

    document.getElementById("btn-spin-wheel")?.addEventListener("click", () => {
      this.spinWheel();
    });

    document.getElementById("setting-sound")?.addEventListener("change", (e) => {
      this.sounds.enabled = e.target.checked;
    });

    document.getElementById("setting-volume")?.addEventListener("input", (e) => {
      this.sounds.volume = parseFloat(e.target.value);
    });

    document.getElementById("setting-speed")?.addEventListener("change", (e) => {
      this.game.settings.gameSpeed = parseFloat(e.target.value);
    });

    document.getElementById("setting-camera")?.addEventListener("change", (e) => {
      this.board3d.setCameraMode(e.target.value);
    });

    document.getElementById("btn-restart-game")?.addEventListener("click", () => {
      this.restartGame();
    });
  }

  handleRollClick() {
    this.sounds.init();
    const curPlayer = this.game.getCurrentPlayer();
    if (curPlayer.bankrupt) return;

    if (curPlayer.inJail) {
      this.openJailModal();
      return;
    }

    this.executePlayerTurn(curPlayer);
  }

  executePlayerTurn(player) {
    const rollBtn = document.getElementById("btn-roll");
    if (rollBtn) rollBtn.disabled = true;

    this.sounds.playDiceRoll();
    const rollResult = this.game.rollDice();
    if (!rollResult) return;

    this.board3d.animateDiceRoll(rollResult.dice[0], rollResult.dice[1], () => {
      this.sounds.playDiceBounce();

      if (rollResult.doubles === 3) {
        this.sounds.playJail();
        this.showToast(`🚨 تم إرسال [${player.name}] إلى السجن بسبب 3 رميات مزدوجة!`, "danger");
        this.board3d.animatePawnMove(player.id, player.position, 10, null, () => {
          this.endCurrentTurn();
        });
        return;
      }

      const fromPos = player.position;
      const toPos = (fromPos + rollResult.total) % 40;
      this.game.movePlayer(player, rollResult.total);

      this.board3d.animatePawnMove(player.id, fromPos, toPos, 
        () => {
          this.sounds.playPawnHop();
        },
        () => {
          this.handleTileArrival(player);
        }
      );
    });
  }

  handleTileArrival(player) {
    const actionResult = this.game.handleTileLanding(player);
    this.updatePlayersBar();

    if (actionResult.action === "buyable") {
      if (player.isAI) {
        if (this.ai.shouldBuy(player, actionResult.tile)) {
          this.game.buyProperty(player, actionResult.tile.id);
          this.sounds.playCashRegister();
          this.showToast(`🏡 اشترى [${player.name}] العقار [${actionResult.tile.name}]!`, "success");
        }
        this.endCurrentTurn();
      } else {
        this.openBuyModal(actionResult.tile);
      }
    } else if (actionResult.action === "rent") {
      this.sounds.playCoin();
      this.showToast(`💸 دفع [${player.name}] $${actionResult.rent} إيجاراً لـ [${actionResult.owner.name}]`, "info");
      this.endCurrentTurn();
    } else if (actionResult.action === "jackpot") {
      this.sounds.playFanfare();
      this.showToast(`🎉 مبروك! ربح [${player.name}] وعاء الموقف المجاني: $${actionResult.amount}!`, "jackpot");
      this.endCurrentTurn();
    } else if (actionResult.action === "gotojail") {
      this.sounds.playJail();
      this.board3d.animatePawnMove(player.id, player.position, 10, null, () => {
        this.endCurrentTurn();
      });
    } else if (actionResult.action === "spin_wheel") {
      this.openWheelModal();
    } else {
      this.endCurrentTurn();
    }
  }

  endCurrentTurn() {
    this.updatePlayersBar();
    this.game.endTurn();

    const rollBtn = document.getElementById("btn-roll");
    if (rollBtn) rollBtn.disabled = false;

    this.updateTurnUI();

    const curPlayer = this.game.getCurrentPlayer();
    if (curPlayer.isAI && !curPlayer.bankrupt) {
      setTimeout(() => {
        this.runAITurn(curPlayer);
      }, 1000 / this.game.settings.gameSpeed);
    }
  }

  runAITurn(aiPlayer) {
    this.ai.processTurn(aiPlayer, (action) => {
      this.updatePlayersBar();
    });

    if (aiPlayer.inJail) {
      const rollRes = this.game.rollDice();
      this.board3d.animateDiceRoll(rollRes.dice[0], rollRes.dice[1], () => {
        if (rollRes.freed) {
          const fromPos = aiPlayer.position;
          this.game.movePlayer(aiPlayer, rollRes.total);
          this.board3d.animatePawnMove(aiPlayer.id, fromPos, aiPlayer.position, null, () => {
            this.handleTileArrival(aiPlayer);
          });
        } else {
          this.endCurrentTurn();
        }
      });
    } else {
      this.executePlayerTurn(aiPlayer);
    }
  }

  openBuyModal(tile) {
    const modal = document.getElementById("modal-buy");
    if (!modal) return;
    document.getElementById("buy-prop-name").innerText = tile.name;
    document.getElementById("buy-prop-price").innerText = `$${tile.price}`;
    document.getElementById("buy-prop-header").style.backgroundColor = tile.color || "#4CAF50";
    
    const rentList = document.getElementById("buy-prop-rents");
    if (rentList && tile.rent) {
      rentList.innerHTML = `
        <li>الإيجار الأساسي: <strong>$${tile.rent[0]}</strong></li>
        <li>مع منزل واحد: <strong>$${tile.rent[1]}</strong></li>
        <li>مع فندق: <strong>$${tile.rent[5]}</strong></li>
      `;
    }

    const confirmBtn = document.getElementById("btn-confirm-buy");
    const passBtn = document.getElementById("btn-pass-buy");

    confirmBtn.onclick = () => {
      this.sounds.playCashRegister();
      this.game.buyProperty(this.game.getCurrentPlayer(), tile.id);
      modal.classList.remove("active");
      this.endCurrentTurn();
    };

    passBtn.onclick = () => {
      this.sounds.playButton();
      modal.classList.remove("active");
      this.endCurrentTurn();
    };

    modal.classList.add("active");
  }

  openJailModal() {
    const modal = document.getElementById("modal-jail");
    if (!modal) return;
    const p = this.game.getCurrentPlayer();

    const rollBtn = document.getElementById("btn-jail-roll");
    const bailBtn = document.getElementById("btn-jail-bail");
    const cardBtn = document.getElementById("btn-jail-card");

    cardBtn.style.display = (p.getOutOfJailCards > 0) ? "block" : "none";

    rollBtn.onclick = () => {
      modal.classList.remove("active");
      this.executePlayerTurn(p);
    };

    bailBtn.onclick = () => {
      if (this.game.payJailBail(p)) {
        this.sounds.playCashRegister();
        modal.classList.remove("active");
        this.executePlayerTurn(p);
      } else {
        this.showToast("لا تملك $50 لدفع الكفالة!", "warning");
      }
    };

    cardBtn.onclick = () => {
      if (this.game.useJailCard(p)) {
        this.sounds.playFanfare();
        modal.classList.remove("active");
        this.executePlayerTurn(p);
      }
    };

    modal.classList.add("active");
  }

  drawFortuneWheel() {
    const canvas = document.getElementById("wheel-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = cx - 12;
    const segs = WHEEL_SEGMENTS;
    const segAngle = (Math.PI * 2) / segs.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.wheelRotation);

    segs.forEach((seg, i) => {
      const angle = i * segAngle;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, angle, angle + segAngle);
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();

      const pegX = Math.cos(angle) * (r - 4);
      const pegY = Math.sin(angle) * (r - 4);
      ctx.beginPath();
      ctx.arc(pegX, pegY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#FFD700";
      ctx.fill();

      ctx.save();
      ctx.rotate(angle + segAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 13px sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.fillText(seg.label, r - 22, 5);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD700";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#FFF8E1";
    ctx.stroke();

    ctx.restore();
  }

  spinWheel() {
    if (this.isWheelSpinning) return;
    this.isWheelSpinning = true;

    const btn = document.getElementById("btn-spin-wheel");
    if (btn) btn.disabled = true;

    const randomSegIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const segAngle = (Math.PI * 2) / WHEEL_SEGMENTS.length;
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = extraSpins * Math.PI * 2 + (WHEEL_SEGMENTS.length - randomSegIndex - 0.5) * segAngle - Math.PI / 2;

    const startRot = this.wheelRotation;
    const delta = targetAngle - (startRot % (Math.PI * 2));
    const startTime = performance.now();
    const duration = 4000;

    let lastTickAngle = startRot;

    const animateSpin = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      const ease = 1 - Math.pow(1 - progress, 3);
      this.wheelRotation = startRot + delta * ease;
      this.drawFortuneWheel();

      if (Math.abs(this.wheelRotation - lastTickAngle) >= segAngle) {
        this.sounds.playWheelTick();
        lastTickAngle = this.wheelRotation;
      }

      if (progress < 1.0) {
        requestAnimationFrame(animateSpin);
      } else {
        this.isWheelSpinning = false;
        if (btn) btn.disabled = false;

        const winningSegment = WHEEL_SEGMENTS[randomSegIndex];
        this.sounds.playFanfare();
        this.game.applyWheelReward(this.game.getCurrentPlayer(), winningSegment);
        this.showToast(`🎉 فزت بـ: ${winningSegment.label}!`, "jackpot");
        this.updatePlayersBar();
      }
    };

    requestAnimationFrame(animateSpin);
  }

  openWheelModal() {
    const modal = document.getElementById("modal-wheel");
    if (modal) modal.classList.add("active");
  }

  openPropertiesModal() {
    const modal = document.getElementById("modal-properties");
    if (!modal) return;
    const player = this.game.getCurrentPlayer();
    const list = document.getElementById("properties-list");
    list.innerHTML = "";

    const owned = Object.keys(this.game.propertiesState)
      .map(Number)
      .filter(id => this.game.propertiesState[id].owner === player.id);

    if (owned.length === 0) {
      list.innerHTML = `<div class="empty-state">لا تملك أي عقارات حالياً! اشترِ العقارات عند الوقوف عليها.</div>`;
      modal.classList.add("active");
      return;
    }

    owned.forEach(id => {
      const tile = this.game.tiles[id];
      const state = this.game.propertiesState[id];
      const card = document.createElement("div");
      card.className = "prop-manage-card";
      
      const canBuild = this.game.canBuildHouse(player, id);
      const canDemolish = this.game.canDemolishHouse(player, id);
      const canMort = this.game.canMortgage(player, id);
      const canUnmort = this.game.canUnmortgage(player, id);

      card.innerHTML = `
        <div class="prop-card-top" style="border-right: 6px solid ${tile.color || '#999'}">
          <div class="prop-name">${tile.name} ${state.isMortgaged ? '<span class="badge-mortgaged">مرهون</span>' : ''}</div>
          <div class="prop-houses">${state.houses === 5 ? 'فندق 🏨' : (state.houses > 0 ? `${state.houses} منازل 🏠` : 'أرض خالية')}</div>
        </div>
        <div class="prop-card-actions">
          ${tile.houseCost ? `
            <button class="btn-sm btn-build" ${canBuild ? '' : 'disabled'}>+ بناء ($${tile.houseCost})</button>
            <button class="btn-sm btn-demolish" ${canDemolish ? '' : 'disabled'}>- هدم (+$${Math.floor(tile.houseCost / 2)})</button>
          ` : ''}
          ${state.isMortgaged ? `
            <button class="btn-sm btn-unmortgage" ${canUnmort ? '' : 'disabled'}>فك الرهن (-$${tile.unmortgage})</button>
          ` : `
            <button class="btn-sm btn-mortgage" ${canMort ? '' : 'disabled'}>رهن (+$${tile.mortgage})</button>
          `}
        </div>
      `;

      card.querySelector(".btn-build")?.addEventListener("click", () => {
        if (this.game.buildHouse(player, id)) {
          this.sounds.playHammer();
          this.board3d.updateBuildings(id, state.houses);
          this.openPropertiesModal();
          this.updatePlayersBar();
        }
      });

      card.querySelector(".btn-demolish")?.addEventListener("click", () => {
        if (this.game.demolishHouse(player, id)) {
          this.sounds.playCoin();
          this.board3d.updateBuildings(id, state.houses);
          this.openPropertiesModal();
          this.updatePlayersBar();
        }
      });

      card.querySelector(".btn-mortgage")?.addEventListener("click", () => {
        if (this.game.mortgageProperty(player, id)) {
          this.sounds.playMortgage();
          this.openPropertiesModal();
          this.updatePlayersBar();
        }
      });

      card.querySelector(".btn-unmortgage")?.addEventListener("click", () => {
        if (this.game.unmortgageProperty(player, id)) {
          this.sounds.playCashRegister();
          this.openPropertiesModal();
          this.updatePlayersBar();
        }
      });

      list.appendChild(card);
    });

    modal.classList.add("active");
  }

  openTradeModal() {
    const modal = document.getElementById("modal-trade");
    if (!modal) return;
    const human = this.game.getCurrentPlayer();

    const partnerSelect = document.getElementById("trade-partner-select");
    partnerSelect.innerHTML = "";
    this.game.players.forEach(p => {
      if (p.id !== human.id && !p.bankrupt) {
        partnerSelect.innerHTML += `<option value="${p.id}">${p.avatar} ${p.name} ($${p.cash})</option>`;
      }
    });

    const renderTradeLists = () => {
      const partnerId = parseInt(partnerSelect.value, 10);
      const partner = this.game.players[partnerId];
      if (!partner) return;

      const myPropsList = document.getElementById("trade-my-props");
      const theirPropsList = document.getElementById("trade-their-props");
      myPropsList.innerHTML = "";
      theirPropsList.innerHTML = "";

      Object.keys(this.game.propertiesState).map(Number).forEach(id => {
        if (this.game.propertiesState[id].owner === human.id) {
          const t = this.game.tiles[id];
          myPropsList.innerHTML += `
            <label class="trade-prop-item">
              <input type="checkbox" name="my_props" value="${id}">
              <span class="color-dot" style="background:${t.color || '#999'}"></span>
              ${t.name} ($${t.price})
            </label>
          `;
        }
      });

      Object.keys(this.game.propertiesState).map(Number).forEach(id => {
        if (this.game.propertiesState[id].owner === partner.id) {
          const t = this.game.tiles[id];
          theirPropsList.innerHTML += `
            <label class="trade-prop-item">
              <input type="checkbox" name="their_props" value="${id}">
              <span class="color-dot" style="background:${t.color || '#999'}"></span>
              ${t.name} ($${t.price})
            </label>
          `;
        }
      });
    };

    partnerSelect.onchange = renderTradeLists;
    renderTradeLists();

    const submitBtn = document.getElementById("btn-submit-trade");
    submitBtn.onclick = () => {
      const partnerId = parseInt(partnerSelect.value, 10);
      const partner = this.game.players[partnerId];
      const myOfferCash = parseInt(document.getElementById("trade-my-cash").value || "0", 10);
      const theirOfferCash = parseInt(document.getElementById("trade-their-cash").value || "0", 10);

      const myProps = Array.from(document.querySelectorAll("input[name='my_props']:checked")).map(cb => parseInt(cb.value, 10));
      const theirProps = Array.from(document.querySelectorAll("input[name='their_props']:checked")).map(cb => parseInt(cb.value, 10));

      const evaluation = this.ai.evaluateTrade(partner, human, myProps, myOfferCash, theirProps, theirOfferCash);

      if (evaluation.accept) {
        this.game.executeTrade(human, partner, myProps, myOfferCash, theirProps, theirOfferCash);
        this.sounds.playFanfare();
        this.showToast(`🤝 وافق [${partner.name}]: "${evaluation.reason}"`, "success");
        modal.classList.remove("active");
        this.updatePlayersBar();
      } else {
        this.sounds.playJail();
        this.showToast(`❌ رفض [${partner.name}]: "${evaluation.reason}"`, "warning");
      }
    };

    modal.classList.add("active");
  }

  openSettingsModal() {
    const modal = document.getElementById("modal-settings");
    if (modal) modal.classList.add("active");
  }

  toggleGameLog() {
    const drawer = document.getElementById("log-drawer");
    if (!drawer) return;
    drawer.classList.toggle("open");
    this.renderGameLog();
  }

  renderGameLog() {
    const list = document.getElementById("log-list");
    if (!list) return;
    list.innerHTML = this.game.gameLog.map(item => `
      <div class="log-entry log-${item.type}">
        <span class="log-time">${item.time}</span>
        <span class="log-text">${item.text}</span>
      </div>
    `).join("");
  }

  renderPlayersBar() {
    const bar = document.getElementById("players-bar");
    if (!bar) return;
    bar.innerHTML = this.game.players.map(p => `
      <div class="player-card ${p.id === this.game.currentTurnIndex ? 'active' : ''} ${p.bankrupt ? 'bankrupt' : ''}" id="player-card-${p.id}">
        <div class="player-avatar" style="border-color:${p.color}">${p.avatar}</div>
        <div class="player-info">
          <div class="player-name">${p.name} ${p.inJail ? '🔒' : ''} ${p.shield ? '🛡️' : ''}</div>
          <div class="player-cash">$${p.cash}</div>
        </div>
      </div>
    `).join("");
  }

  updatePlayersBar() {
    this.game.players.forEach(p => {
      const card = document.getElementById(`player-card-${p.id}`);
      if (card) {
        card.className = `player-card ${p.id === this.game.currentTurnIndex ? 'active' : ''} ${p.bankrupt ? 'bankrupt' : ''}`;
        const cashEl = card.querySelector(".player-cash");
        if (cashEl) cashEl.innerText = `$${p.cash}`;
        const nameEl = card.querySelector(".player-name");
        if (nameEl) nameEl.innerHTML = `${p.name} ${p.inJail ? '🔒' : ''} ${p.shield ? '🛡️' : ''}`;
      }
    });

    const poolEl = document.getElementById("jackpot-pool-amount");
    if (poolEl) poolEl.innerText = `$${this.game.freeParkingPool}`;
  }

  updateTurnUI() {
    const curPlayer = this.game.getCurrentPlayer();
    const turnIndicator = document.getElementById("turn-indicator");
    if (turnIndicator) {
      turnIndicator.innerHTML = `دور اللاعب: <strong>${curPlayer.avatar} ${curPlayer.name}</strong>`;
      turnIndicator.style.borderColor = curPlayer.color;
    }
    this.updatePlayersBar();
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }

  restartGame() {
    location.reload();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MonopolyUI };
}

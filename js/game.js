class MonopolyGame {
  constructor(config = {}) {
    this.tiles = JSON.parse(JSON.stringify(TILES));
    this.propertyGroups = PROPERTY_GROUPS;
    this.chanceDeck = this.shuffle([...CHANCE_CARDS]);
    this.chestDeck = this.shuffle([...CHEST_CARDS]);
    
    this.settings = {
      startingCash: config.startingCash || 1500,
      freeParkingJackpot: config.freeParkingJackpot !== undefined ? config.freeParkingJackpot : true,
      doubleGo: config.doubleGo !== undefined ? config.doubleGo : true,
      quickMode: config.quickMode || false,
      gameSpeed: config.gameSpeed || 1,
      aiCount: config.aiCount !== undefined ? config.aiCount : 3,
      tactileHaptics: true
    };

    this.freeParkingPool = 100;
    this.currentTurnIndex = 0;
    this.consecutiveDoubles = 0;
    this.lastDice = [1, 1];
    this.lastDiceTotal = 2;
    this.isDouble = false;
    this.turnState = "READY_TO_ROLL";
    this.gameLog = [];
    this.extraRollGranted = false;

    this.propertiesState = {};
    this.tiles.forEach(t => {
      if (t.price) {
        this.propertiesState[t.id] = {
          owner: null,
          houses: 0,
          isMortgaged: false
        };
      }
    });

    this.players = [];
    const playerCount = 1 + this.settings.aiCount;
    for (let i = 0; i < playerCount; i++) {
      const pCfg = PLAYER_CONFIGS[i] || {
        id: i,
        name: `لاعب ${i + 1}`,
        token: "car",
        color: "#FF9800",
        avatar: "🎮",
        isAI: i > 0
      };
      this.players.push({
        id: i,
        name: pCfg.name,
        token: pCfg.token,
        color: pCfg.color,
        avatar: pCfg.avatar,
        isAI: pCfg.isAI,
        cash: this.settings.startingCash,
        position: 0,
        inJail: false,
        jailTurns: 0,
        getOutOfJailCards: 0,
        shield: false,
        bankrupt: false
      });
    }

    if (this.settings.quickMode) {
      this.dealRandomProperties();
    }
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  log(msg, type = "info") {
    this.gameLog.unshift({ text: msg, type, time: new Date().toLocaleTimeString() });
    if (this.gameLog.length > 50) this.gameLog.pop();
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  dealRandomProperties() {
    const unowned = Object.keys(this.propertiesState).map(Number);
    this.shuffle(unowned);
    this.players.forEach(p => {
      for (let k = 0; k < 2; k++) {
        if (unowned.length > 0) {
          const tileId = unowned.pop();
          this.propertiesState[tileId].owner = p.id;
          const tile = this.tiles[tileId];
          p.cash -= tile.price;
          this.log(`وضع البداية السريعة: مُنح [${p.name}] عقار [${tile.name}]`, "trade");
        }
      }
    });
  }

  hasMonopoly(playerId, group) {
    if (!this.propertyGroups[group]) return false;
    const groupTileIds = this.propertyGroups[group];
    return groupTileIds.every(id => this.propertiesState[id] && this.propertiesState[id].owner === playerId);
  }

  calculateRent(tileId, diceRoll = this.lastDiceTotal) {
    const tile = this.tiles[tileId];
    const state = this.propertiesState[tileId];
    if (!state || state.owner === null || state.isMortgaged) return 0;

    if (tile.type === "railroad") {
      const rrGroup = this.propertyGroups["rr"];
      const ownedCount = rrGroup.filter(id => this.propertiesState[id].owner === state.owner).length;
      return tile.rent[Math.max(0, Math.min(ownedCount - 1, 3))];
    }

    if (tile.type === "utility") {
      const utilGroup = this.propertyGroups["util"];
      const ownedCount = utilGroup.filter(id => this.propertiesState[id].owner === state.owner).length;
      const multiplier = ownedCount === 2 ? 10 : 4;
      return diceRoll * multiplier;
    }

    if (tile.type === "property") {
      if (state.houses > 0) {
        return tile.rent[state.houses];
      } else {
        const isMono = this.hasMonopoly(state.owner, tile.group);
        return isMono ? tile.rent[0] * 2 : tile.rent[0];
      }
    }

    return 0;
  }

  rollDice(forcedDice = null) {
    const player = this.getCurrentPlayer();
    if (player.bankrupt) {
      this.endTurn();
      return null;
    }

    const d1 = forcedDice ? forcedDice[0] : Math.floor(Math.random() * 6) + 1;
    const d2 = forcedDice ? forcedDice[1] : Math.floor(Math.random() * 6) + 1;
    this.lastDice = [d1, d2];
    this.lastDiceTotal = d1 + d2;
    this.isDouble = (d1 === d2);

    this.log(`🎲 رمى [${player.name}] النرد: ${d1} + ${d2} = ${this.lastDiceTotal} ${this.isDouble ? "⚡ رمية مزدوجة!" : ""}`, "dice");

    if (player.inJail) {
      return this.handleJailRoll(d1, d2);
    }

    if (this.isDouble) {
      this.consecutiveDoubles++;
      if (this.consecutiveDoubles >= 3) {
        this.log(`🚨 رمى [${player.name}] 3 رميات مزدوجة متتالية! يُرسل مباشرة إلى السجن!`, "danger");
        this.sendToJail(player);
        return { dice: [d1, d2], inJail: true, doubles: 3 };
      }
    } else {
      this.consecutiveDoubles = 0;
    }

    return { dice: [d1, d2], isDouble: this.isDouble, total: this.lastDiceTotal };
  }

  handleJailRoll(d1, d2) {
    const player = this.getCurrentPlayer();
    player.jailTurns++;

    if (d1 === d2) {
      player.inJail = false;
      player.jailTurns = 0;
      this.consecutiveDoubles = 0;
      this.log(`🎉 رمية مزدوجة (${d1}+${d2})! أُطلق سراح [${player.name}] من السجن مجاناً!`, "success");
      return { dice: [d1, d2], freed: true, total: d1 + d2 };
    } else if (player.jailTurns >= 3) {
      this.log(`⏰ فشلت المحاولة 3 في السجن! يجب على [${player.name}] دفع كفالة $50 للمغادرة.`, "warning");
      this.payMoney(player, 50, "كفالة السجن الإلزامية");
      player.inJail = false;
      player.jailTurns = 0;
      return { dice: [d1, d2], freed: true, forcedPay: true, total: d1 + d2 };
    } else {
      this.log(`🔒 لم يحصل [${player.name}] على رمية مزدوجة (${d1}+${d2}). يبقى في السجن (${player.jailTurns}/3).`, "info");
      return { dice: [d1, d2], freed: false, total: d1 + d2 };
    }
  }

  payJailBail(player = this.getCurrentPlayer()) {
    if (!player.inJail) return false;
    if (player.cash >= 50) {
      this.payMoney(player, 50, "كفالة الخروج من السجن");
      player.inJail = false;
      player.jailTurns = 0;
      this.log(`🔓 دفع [${player.name}] كفالة $50 وأصبح حراً!`, "success");
      return true;
    }
    return false;
  }

  useJailCard(player = this.getCurrentPlayer()) {
    if (!player.inJail || player.getOutOfJailCards <= 0) return false;
    player.getOutOfJailCards--;
    player.inJail = false;
    player.jailTurns = 0;
    this.log(`🎫 استخدم [${player.name}] بطاقة الخروج المجاني من السجن وأصبح حراً!`, "success");
    return true;
  }

  sendToJail(player = this.getCurrentPlayer()) {
    player.position = 10;
    player.inJail = true;
    player.jailTurns = 0;
    this.consecutiveDoubles = 0;
    this.turnState = "TURN_OVER";
  }

  movePlayer(player, steps) {
    const oldPos = player.position;
    const newPos = (oldPos + steps) % 40;
    
    if (newPos < oldPos && oldPos !== 0) {
      const salary = 200;
      player.cash += salary;
      this.log(`🚩 مرّ [${player.name}] بنقطة الانطلاق (GO) وحصل على راتب $${salary}!`, "success");
    } else if (newPos === 0 && this.settings.doubleGo) {
      const salary = 400;
      player.cash += salary;
      this.log(`🎯 هبوط مباشر على نقطة الانطلاق (GO)! مكافأة مضاعفة $${salary}!`, "jackpot");
    }

    player.position = newPos;
    return newPos;
  }

  handleTileLanding(player = this.getCurrentPlayer()) {
    const tile = this.tiles[player.position];
    this.log(`📍 هبط [${player.name}] على [${tile.name}] (${tile.id})`, "move");

    if (tile.type === "gotojail") {
      this.log(`🚨 شرطة المرور تقبض على [${player.name}]! إلى السجن مباشرة!`, "danger");
      this.sendToJail(player);
      return { action: "gotojail" };
    }

    if (tile.type === "parking") {
      if (this.settings.freeParkingJackpot && this.freeParkingPool > 0) {
        const win = this.freeParkingPool;
        player.cash += win;
        this.freeParkingPool = 0;
        this.log(`🚗💰 ربح [${player.name}] وعاء الموقف المجاني المتراكم: $${win}!`, "jackpot");
        return { action: "jackpot", amount: win };
      }
      return { action: "parking" };
    }

    if (tile.type === "tax") {
      const taxAmount = tile.amount;
      this.payMoney(player, taxAmount, tile.name);
      if (this.settings.freeParkingJackpot) {
        this.freeParkingPool += taxAmount;
      }
      return { action: "tax", amount: taxAmount };
    }

    if (tile.type === "chance") {
      const card = this.chanceDeck.shift();
      this.chanceDeck.push(card);
      return this.executeCard(player, card, "فرصة 🎲");
    }

    if (tile.type === "chest") {
      const card = this.chestDeck.shift();
      this.chestDeck.push(card);
      return this.executeCard(player, card, "صندوق المجتمع 📦");
    }

    if (tile.price) {
      const pState = this.propertiesState[tile.id];
      if (pState.owner === null) {
        return { action: "buyable", tile, price: tile.price };
      } else if (pState.owner === player.id) {
        return { action: "own_property", tile };
      } else {
        const owner = this.players[pState.owner];
        if (pState.isMortgaged) {
          this.log(`العقار [${tile.name}] مرهون حالياً. لا يُدفع إيجار.`, "info");
          return { action: "mortgaged", tile };
        }

        if (player.shield) {
          player.shield = false;
          this.log(`🛡️ درع الحماية أنقذ [${player.name}] من دفع الإيجار لـ [${owner.name}]!`, "shield");
          return { action: "shield_used", tile };
        }

        const rent = this.calculateRent(tile.id);
        this.payRent(player, owner, rent, tile);
        return { action: "rent", owner, rent, tile };
      }
    }

    return { action: "none" };
  }

  buyProperty(player = this.getCurrentPlayer(), tileId = player.position) {
    const tile = this.tiles[tileId];
    const pState = this.propertiesState[tileId];
    if (!tile || !pState || pState.owner !== null) return false;
    if (player.cash < tile.price) {
      this.log(`❌ لا يملك [${player.name}] نقوداً كافية لشراء [${tile.name}] ($${tile.price})`, "warning");
      return false;
    }

    player.cash -= tile.price;
    pState.owner = player.id;
    this.log(`🏡 اشترى [${player.name}] العقار [${tile.name}] بمبلغ $${tile.price}!`, "success");
    return true;
  }

  payRent(payer, receiver, amount, tile) {
    this.payMoney(payer, amount, `إيجار [${tile.name}] إلى [${receiver.name}]`);
    receiver.cash += amount;
    this.log(`💸 دفع [${payer.name}] مبلغ $${amount} إيجاراً لـ [${receiver.name}]`, "rent");
  }

  payMoney(player, amount, reason = "") {
    player.cash -= amount;
    this.log(`🔻 دفع [${player.name}] $${amount} (${reason})`, "expense");
    if (player.cash < 0) {
      this.log(`⚠️ تحذير: رصيد [${player.name}] تحت الصفر ($${player.cash})! يجب بيع مبانٍ أو رهن عقارات`, "warning");
    }
  }

  executeCard(player, card, deckTitle) {
    this.log(`🃏 سحب [${player.name}] بطاقة [${deckTitle}]: ${card.text}`, "card");
    if (card.action === "goto") {
      player.position = card.tile;
      return this.handleTileLanding(player);
    }
    if (card.action === "goto_jail") {
      this.sendToJail(player);
      return { action: "gotojail" };
    }
    if (card.action === "cash") {
      player.cash += card.amount;
      return { action: "cash", amount: card.amount, text: card.text };
    }
    if (card.action === "jail_card") {
      player.getOutOfJailCards++;
      return { action: "jail_card", text: card.text };
    }
    if (card.action === "collect_all") {
      this.players.forEach(p => {
        if (p.id !== player.id && !p.bankrupt) {
          p.cash -= card.amount;
          player.cash += card.amount;
        }
      });
      return { action: "collect_all", text: card.text };
    }
    if (card.action === "repairs") {
      let totalCost = 0;
      Object.keys(this.propertiesState).forEach(id => {
        const prop = this.propertiesState[id];
        if (prop.owner === player.id) {
          if (prop.houses === 5) totalCost += card.hotel;
          else totalCost += prop.houses * card.house;
        }
      });
      this.payMoney(player, totalCost, "تكاليف الصيانة والترميم");
      return { action: "repairs", amount: totalCost };
    }
    if (card.action === "spin_wheel") {
      return { action: "spin_wheel", text: card.text };
    }
    return { action: "card", text: card.text };
  }

  canBuildHouse(player, tileId) {
    const tile = this.tiles[tileId];
    const state = this.propertiesState[tileId];
    if (!tile || !state || state.owner !== player.id || state.isMortgaged) return false;
    if (tile.type !== "property" || state.houses >= 5) return false;
    if (player.cash < tile.houseCost) return false;

    if (!this.hasMonopoly(player.id, tile.group)) return false;

    const groupIds = this.propertyGroups[tile.group];
    const anyMortgaged = groupIds.some(id => this.propertiesState[id].isMortgaged);
    if (anyMortgaged) return false;

    const currentHouses = state.houses;
    const minHousesInGroup = Math.min(...groupIds.map(id => this.propertiesState[id].houses));
    return currentHouses === minHousesInGroup;
  }

  buildHouse(player, tileId) {
    if (!this.canBuildHouse(player, tileId)) return false;
    const tile = this.tiles[tileId];
    const state = this.propertiesState[tileId];
    player.cash -= tile.houseCost;
    state.houses++;
    const isHotel = state.houses === 5;
    this.log(`🔨 بنى [${player.name}] ${isHotel ? "فندقاً فخماً 🏨" : "منزلاً 🏠"} على [${tile.name}] بتكلفة $${tile.houseCost}`, "build");
    return true;
  }

  canDemolishHouse(player, tileId) {
    const tile = this.tiles[tileId];
    const state = this.propertiesState[tileId];
    if (!tile || !state || state.owner !== player.id || state.houses <= 0) return false;

    const groupIds = this.propertyGroups[tile.group];
    const maxHousesInGroup = Math.max(...groupIds.map(id => this.propertiesState[id].houses));
    return state.houses === maxHousesInGroup;
  }

  demolishHouse(player, tileId) {
    if (!this.canDemolishHouse(player, tileId)) return false;
    const tile = this.tiles[tileId];
    const state = this.propertiesState[tileId];
    const refund = Math.floor(tile.houseCost / 2);
    state.houses--;
    player.cash += refund;
    this.log(`🏚️ هدم [${player.name}] مبنى على [${tile.name}] واسترد نصف القيمة: $${refund}`, "demolish");
    return true;
  }

  canMortgage(player, tileId) {
    const tile = this.tiles[tileId];
    const state = this.propertiesState[tileId];
    if (!tile || !state || state.owner !== player.id || state.isMortgaged) return false;

    if (tile.type === "property") {
      const groupIds = this.propertyGroups[tile.group];
      const hasBuildings = groupIds.some(id => this.propertiesState[id].houses > 0);
      if (hasBuildings) return false;
    }
    return true;
  }

  mortgageProperty(player, tileId) {
    if (!this.canMortgage(player, tileId)) return false;
    const tile = this.tiles[tileId];
    const state = this.propertiesState[tileId];
    state.isMortgaged = true;
    player.cash += tile.mortgage;
    this.log(`📜 رهن [${player.name}] عقاره [${tile.name}] للبنك واستلم $${tile.mortgage}`, "mortgage");
    return true;
  }

  canUnmortgage(player, tileId) {
    const tile = this.tiles[tileId];
    const state = this.propertiesState[tileId];
    if (!tile || !state || state.owner !== player.id || !state.isMortgaged) return false;
    return player.cash >= tile.unmortgage;
  }

  unmortgageProperty(player, tileId) {
    if (!this.canUnmortgage(player, tileId)) return false;
    const tile = this.tiles[tileId];
    const state = this.propertiesState[tileId];
    player.cash -= tile.unmortgage;
    state.isMortgaged = false;
    this.log(`✨ فك [${player.name}] رهن عقاره [${tile.name}] بدفع $${tile.unmortgage} (مع فائدة 10%)`, "success");
    return true;
  }

  applyWheelReward(player, segment) {
    this.log(`🎡 حظ عجلة الحظ لـ [${player.name}]: [${segment.label}]!`, "jackpot");
    switch (segment.type) {
      case "cash":
        player.cash += segment.value;
        break;
      case "free_house": {
        const owned = Object.keys(this.propertiesState)
          .map(Number)
          .filter(id => this.propertiesState[id].owner === player.id && this.propertiesState[id].houses < 5);
        if (owned.length > 0) {
          this.propertiesState[owned[0]].houses++;
          this.log(`🎁 أضيف منزل مجاني للعقار [${this.tiles[owned[0]].name}]!`, "success");
        } else {
          player.cash += 150;
        }
        break;
      }
      case "extra_roll":
        this.extraRollGranted = true;
        this.log(`🎲 حصل [${player.name}] على دور رمي إضافي مجاني!`, "success");
        break;
      case "shield":
        player.shield = true;
        this.log(`🛡️ حصل [${player.name}] على درع حماية ضد الإيجار القادم!`, "shield");
        break;
      case "steal_cash":
        this.players.forEach(p => {
          if (p.id !== player.id && !p.bankrupt && p.cash > 0) {
            const stolen = Math.floor(p.cash * segment.value);
            p.cash -= stolen;
            player.cash += stolen;
          }
        });
        this.log(`🧲 سرق المغناطيس 10% من رصيد المنافسين لـ [${player.name}]!`, "success");
        break;
      case "goto_go":
        player.position = 0;
        player.cash += 200;
        this.log(`🚀 انطلق [${player.name}] فوراً إلى البداية وحصل على $200!`, "jackpot");
        break;
    }
  }

  executeTrade(p1, p2, p1GiveProps, p1GiveCash, p2GiveProps, p2GiveCash) {
    if (p1.cash < p1GiveCash || p2.cash < p2GiveCash) return { success: false, reason: "عدم كفاية الرصيد النقدي" };

    p1.cash = p1.cash - p1GiveCash + p2GiveCash;
    p2.cash = p2.cash - p2GiveCash + p1GiveCash;

    p1GiveProps.forEach(id => {
      this.propertiesState[id].owner = p2.id;
    });
    p2GiveProps.forEach(id => {
      this.propertiesState[id].owner = p1.id;
    });

    this.log(`🤝 تم بنجاح إبرام صفقة تفاوض تجارية بين [${p1.name}] و [${p2.name}]!`, "trade");
    return { success: true };
  }

  endTurn() {
    if (this.isDouble && !this.getCurrentPlayer().inJail && this.consecutiveDoubles < 3 && !this.getCurrentPlayer().bankrupt) {
      this.turnState = "READY_TO_ROLL";
      this.log(`⚡ رمية مزدوجة! يحق لـ [${this.getCurrentPlayer().name}] رمي النرد مرة أخرى!`, "dice");
      return;
    }

    if (this.extraRollGranted && !this.getCurrentPlayer().bankrupt) {
      this.extraRollGranted = false;
      this.turnState = "READY_TO_ROLL";
      this.log(`🎁 رمية إضافية بفضل عجلة الحظ لـ [${this.getCurrentPlayer().name}]!`, "dice");
      return;
    }

    this.consecutiveDoubles = 0;
    let nextIdx = (this.currentTurnIndex + 1) % this.players.length;
    let loopCount = 0;
    while (this.players[nextIdx].bankrupt && loopCount < this.players.length) {
      nextIdx = (nextIdx + 1) % this.players.length;
      loopCount++;
    }

    this.currentTurnIndex = nextIdx;
    this.turnState = "READY_TO_ROLL";
    this.log(`👉 جاء الدور على: [${this.getCurrentPlayer().name}]`, "info");
  }

  checkWinner() {
    const active = this.players.filter(p => !p.bankrupt);
    if (active.length === 1) {
      return active[0];
    }
    return null;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MonopolyGame };
}

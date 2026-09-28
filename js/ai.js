class MonopolyAI {
  constructor(game) {
    this.game = game;
  }

  processTurn(aiPlayer, onAction) {
    if (!aiPlayer.isAI || aiPlayer.bankrupt) return;

    if (aiPlayer.inJail) {
      if (aiPlayer.getOutOfJailCards > 0) {
        this.game.useJailCard(aiPlayer);
        if (onAction) onAction("jail_freed_card");
      } else if (aiPlayer.cash > 400) {
        this.game.payJailBail(aiPlayer);
        if (onAction) onAction("jail_freed_bail");
      }
    }

    this.tryBuildHouses(aiPlayer);
  }

  shouldBuy(aiPlayer, tile) {
    if (aiPlayer.cash < tile.price) return false;
    const cashReserve = 120;
    if (aiPlayer.cash - tile.price >= cashReserve) return true;

    const groupIds = this.game.propertyGroups[tile.group] || [];
    const ownedInGroup = groupIds.filter(id => this.game.propertiesState[id] && this.game.propertiesState[id].owner === aiPlayer.id).length;
    if (ownedInGroup === groupIds.length - 1) {
      return (aiPlayer.cash >= tile.price);
    }

    return (aiPlayer.cash - tile.price >= cashReserve);
  }

  tryBuildHouses(aiPlayer) {
    if (aiPlayer.cash < 300) return;

    Object.keys(this.game.propertyGroups).forEach(group => {
      if (group === "rr" || group === "util") return;
      if (this.game.hasMonopoly(aiPlayer.id, group)) {
        const ids = this.game.propertyGroups[group];
        ids.sort((a, b) => this.game.propertiesState[a].houses - this.game.propertiesState[b].houses);
        for (const id of ids) {
          const tile = this.game.tiles[id];
          if (aiPlayer.cash - tile.houseCost > 200 && this.game.canBuildHouse(aiPlayer, id)) {
            this.game.buildHouse(aiPlayer, id);
          }
        }
      }
    });
  }

  handleEmergencyCash(aiPlayer, requiredAmount) {
    for (const group of Object.keys(this.game.propertyGroups)) {
      if (group === "rr" || group === "util") continue;
      const ids = this.game.propertyGroups[group];
      for (const id of ids) {
        while (this.game.canDemolishHouse(aiPlayer, id) && aiPlayer.cash < requiredAmount) {
          this.game.demolishHouse(aiPlayer, id);
        }
      }
    }

    if (aiPlayer.cash < requiredAmount) {
      const owned = Object.keys(this.game.propertiesState)
        .map(Number)
        .filter(id => this.game.propertiesState[id].owner === aiPlayer.id && !this.game.propertiesState[id].isMortgaged);

      owned.sort((a, b) => {
        const aTile = this.game.tiles[a];
        const bTile = this.game.tiles[b];
        const aMono = aTile.group ? this.game.hasMonopoly(aiPlayer.id, aTile.group) : false;
        const bMono = bTile.group ? this.game.hasMonopoly(aiPlayer.id, bTile.group) : false;
        if (aMono && !bMono) return 1;
        if (!aMono && bMono) return -1;
        return aTile.price - bTile.price;
      });

      for (const id of owned) {
        if (aiPlayer.cash >= requiredAmount) break;
        if (this.game.canMortgage(aiPlayer, id)) {
          this.game.mortgageProperty(aiPlayer, id);
        }
      }
    }

    if (aiPlayer.cash < 0) {
      aiPlayer.bankrupt = true;
      this.game.log(`💀 أعلن [${aiPlayer.name}] إفلاسه رسمياً وخرج من اللعبة!`, "danger");
      return false;
    }
    return true;
  }

  evaluateTrade(aiPlayer, humanPlayer, offerProps, offerCash, reqProps, reqCash) {
    let valueToAI = offerCash;
    let createsAIMonopoly = false;

    offerProps.forEach(id => {
      const tile = this.game.tiles[id];
      valueToAI += tile.price * 1.2;
      if (tile.group) {
        const groupIds = this.game.propertyGroups[tile.group] || [];
        const aiHas = groupIds.filter(gid => this.game.propertiesState[gid].owner === aiPlayer.id).length;
        if (aiHas === groupIds.length - 1) {
          createsAIMonopoly = true;
          valueToAI += 400;
        }
      }
    });

    let valueFromAI = reqCash;
    let breaksAIMonopoly = false;

    reqProps.forEach(id => {
      const tile = this.game.tiles[id];
      valueFromAI += tile.price * 1.2;
      if (tile.group) {
        if (this.game.hasMonopoly(aiPlayer.id, tile.group)) {
          breaksAIMonopoly = true;
          valueFromAI += 500;
        }
      }
    });

    if (reqCash > aiPlayer.cash - 100) {
      return { accept: false, reason: `أنا بحاجة لاحتياطي نقدي ولا أستطيع دفع $${reqCash} حالياً!` };
    }

    if (breaksAIMonopoly && !createsAIMonopoly) {
      return { accept: false, reason: "هذه الصفقة تكسر احتكاري لأحد المجموعات المهمة!" };
    }

    const netAdvantage = valueToAI - valueFromAI;

    if (netAdvantage >= 0) {
      return { accept: true, reason: "صفقة ممتازة! أوافق على شروط التبادل بكل سرور." };
    } else if (netAdvantage >= -60 && Math.random() > 0.4) {
      return { accept: true, reason: "أوافق على هذا التبادل لنستمر في اللعبة." };
    } else {
      return { accept: false, reason: `العرض غير متكافئ! الفارق يميل لصالحك بمقدار $${Math.abs(Math.round(netAdvantage))}.` };
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MonopolyAI };
}

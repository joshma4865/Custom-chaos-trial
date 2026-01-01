
"use strict";

const VOWS_FEAR_MAP = {
    "pain": [1, 2, 2],
    "grit": [1, 1, 1],
    "wards": [1, 1],
    "frenzy": [3, 3],
    "hordes": [1, 1, 1],
    "menace": [1, 2],
    "return": [1, 1],
    "fangs": [2, 3],
    "scars": [1, 2, 2],
    "debt": [1, 1],
    "shadow": [2],
    "forfeit": [3],
    "time": [1, 2, 3],
    "void": [1, 1, 1, 2],
    "hubris": [1, 1],
    "denial": [2],
    "rivals": [2, 3, 3, 4]
};

const ARCANA_GRASP_ARRAY = [
    ["The Sorceress", 1],
    ["The Wayward Son", 1],
    ["The Huntress", 2],
    ["Eternity", 3],
    ["The Moon", 0],
    ["The Furies", 2],
    ["Persistence", 2],
    ["The Messenger", 1],
    ["The Unseen", 5],
    ["Night", 2],
    ["The Swift Runner", 1],
    ["Death", 4],
    ["The Centaur", 0],
    ["Origination", 5],
    ["The Lovers", 3],
    ["The Enchantress", 3],
    ["The Boatman", 5],
    ["The Artificer", 3],
    ["Excellence", 5],
    ["The Queen", 0],
    ["The Fates", 0],
    ["The Champions", 4],
    ["Strength", 4],
    ["Divinity", 0],
    ["Judgement", 0]
];

const GOD_KEEPSAKES = [
    "Cloud Bangle", "Iridescent Fan", "Vivid Sea", "Barley Sheaf",
    "Harmonic Photon", "Beautiful Mirror", "Adamant Shard",
    "Everlasting Ember", "Sword Hilt"
];

const FATES_WHIM_KEEPSAKES = ["Calling Card", "Jeweled Pom", "Time Piece"];

function deepCopy(item) {
    if (item === null || typeof item !== "object") return item;
    if (Array.isArray(item)) {
        const copy = [];
        for (let i = 0; i < item.length; i++) copy[i] = deepCopy(item[i]);
        return copy;
    }
    const copy = {};
    for (const key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key)) copy[key] = deepCopy(item[key]);
    }
    return copy;
}

function openTab(e, section) {
    const sections = document.querySelectorAll(".section");
    sections.forEach(s => s.classList.remove("active-pane"));
    const tabs = document.querySelectorAll(".tab-button");
    tabs.forEach(tab => tab.classList.remove("active-button"));
    document.getElementById(section).classList.add("active-pane");
    e.currentTarget.classList.add("active-button");
}

function toggleSeedInput() {
    const isRandom = document.getElementById("use-random-seed").checked;
    const container = document.getElementById("manual-seed-container");
    container.style.display = isRandom ? "none" : "block";
}

function showNotification(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 15000);
}

function loadFearConfig(fearConfig) {
    const vows = document.querySelectorAll(".vow-setting");
    for (let i = 0; i < vows.length; i += 2) {
        const vowFears = fearConfig[Math.floor(i / 2)];
        vows[i].value = vowFears[1];
        vows[i + 1].value = vowFears[2];
    }
}

function loadArcanaConfig(arcanaConfig) {
    const arcanaMap = new Map(arcanaConfig);
    const containers = document.querySelectorAll(".tri-state-toggle");
    containers.forEach(container => {
        const cardId = container.querySelector('input').dataset.card;
        const savedValue = arcanaMap.get(cardId) || "rand";
        const targetInput = container.querySelector(`input[value="${savedValue}"]`);
        if (targetInput) {
            targetInput.checked = true;
        }
    });
}

function loadKeepsakeConfig(keepsakeConfig) {
    const keepsakes = document.querySelectorAll(".ks-setting");
    const enabledSet = new Set();
    keepsakeConfig.forEach((biomePool, biomeIndex) => {
        biomePool.forEach(ksName => enabledSet.add(`${biomeIndex}:${ksName}`));
    });

    for (const ks of keepsakes) {
        const biomeIndex = parseInt(ks.dataset.biome) - 1;
        const key = `${biomeIndex}:${ks.dataset.ks}`;
        ks.checked = enabledSet.has(key);
    }
}

function loadNamedToggleConfig(namedConfig, configName) {
    const configItems = document.querySelectorAll(`.${configName}-item`);
    let j = 0;
    for (let i = 0; i < configItems.length; i++) {
        const configText = configItems[i].querySelector("span").innerText;
        if (namedConfig[j] == configText) {
            j++;
            configItems[i].querySelector(`.${configName}-setting`).checked = true;
        } else {
            configItems[i].querySelector(`.${configName}-setting`).checked = false;
        }
    }
}

function loadGeneralConfig(config) {
    document.getElementById(config["region"]).checked = true;
    document.getElementById("fear-level").value = config.fear;
    const generalConfigs = document.querySelectorAll(".setting-general");
    for (const generalConfig of generalConfigs) {
        if (config[generalConfig.id]) {
            generalConfig.checked = true;
        } else {
            generalConfig.checked = false;
        }
    }
}

function exportSettings() {
    const settingsString = JSON.stringify(getTrialSettings());
    const blob = new Blob([settingsString], { type: "application/json" });
    const settingsURL = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = settingsURL;
    link.download = "settings.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function importSettings() {
    fileInput.click();
}

async function loadSettings(settings) {
    if (!settings) {
        const response = await fetch("defaultSettings.json");
        settings = await response.json();
        showNotification("Default settings loaded");
    }
    loadFearConfig(settings["fear"]);
    loadArcanaConfig(settings["arcana"]);
    loadKeepsakeConfig(settings["keepsake"]);
    loadNamedToggleConfig(settings["aspect"], "aspect");
    loadNamedToggleConfig(settings["familiar"], "familiar");
    loadGeneralConfig(settings["general"]);
    saveSettingsLocally(settings);
    updateForcedFearDisplay();
    updateForcedGraspDisplay();
}

function saveSettingsLocally(settings) {
    const settingsString = JSON.stringify(settings);
    localStorage.setItem("settings", settingsString);
}

function performBulkAction(action, category) {
    if (category === 'arcana') {
        const containers = document.querySelectorAll('#arcana .tri-state-toggle');
        containers.forEach(container => {
            const radio = container.querySelector(`input[value="${action}"]`);
            if (radio) radio.checked = true;
        });
        updateForcedGraspDisplay();
    } else {
        const toggles = document.querySelectorAll(`.${category}-setting`);
        for (const toggle of toggles) {
            if (action === "disable") {
                toggle.checked = false;
            } else {
                toggle.checked = true;
            }
        }
    }
}

function toggleKeepsake(action, biome) {
    const keepsakeBiomes = document.querySelectorAll("[data-biome]");
    for (const keepsakeBiome of keepsakeBiomes) {
        if (keepsakeBiome.dataset.biome != biome) {
            continue;
        }
        if (action == "enable") {
            keepsakeBiome.checked = true;
        } else {
            keepsakeBiome.checked = false;
        }
    }
}

function createPRNG(seed) {
    seed = Math.floor(seed);

    const getNext = function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };

    return {
        random: function (max = 1, min = 0) {
            return getNext() * (max - min) + min;
        },
        randomInt: function (max, min = 0) {
            return Math.floor(this.random(max, min));
        },
        seed: seed
    };
}

function getFearConfig() {
    const vows = document.querySelectorAll(".vow-setting");
    const fearConfig = [];
    for (let i = 0; i < vows.length; i += 2) {
        fearConfig.push([vows[i].dataset.vow, vows[i].value, vows[i + 1].value]);
    }
    return fearConfig;
}

function getArcanaConfig() {
    const containers = document.querySelectorAll(".tri-state-toggle");
    const arcanaConfig = [];
    containers.forEach(container => {
        const activeInput = container.querySelector('input[type="radio"]:checked');
        if (activeInput) {
            arcanaConfig.push([activeInput.dataset.card, activeInput.value]);
        }
    });
    return arcanaConfig;
}

function getKeepsakeConfig() {
    const keepsakes = document.querySelectorAll(".ks-setting:checked");
    const keepsakeConfig = [[], [], [], []];
    for (const keepsake of keepsakes) {
        const biome = parseInt(keepsake.dataset.biome) - 1;
        const keepsakeName = keepsake.dataset.ks;
        keepsakeConfig[biome].push(keepsakeName);
    }
    return keepsakeConfig
}

function getNamedToggleConfig(setting) {
    const toggleDivs = document.querySelectorAll(`.${setting}-item`);
    const togglesConfig = [];
    for (const div of toggleDivs) {
        const text = div.querySelector(`.${setting}-span`);
        const toggle = div.querySelector(`.${setting}-setting`);
        if (toggle.checked) {
            togglesConfig.push(text.innerText);
        }
    }
    return togglesConfig;
}

function getGeneralConfig() {
    const generalConfigs = document.querySelectorAll(".setting-general:checked");
    const region = document.querySelector(".region-radio:checked").value;
    const fear = document.getElementById("fear-level").value
    const generalConfigObject = { "region": region, "fear": fear };
    for (const config of generalConfigs) {
        generalConfigObject[config.id] = true;
    }
    console.log(generalConfigObject);
    return generalConfigObject;
}

function getTrialSettings() {
    const settings = {};
    settings["fear"] = getFearConfig();
    settings["arcana"] = getArcanaConfig();
    settings["keepsake"] = getKeepsakeConfig();
    settings["aspect"] = getNamedToggleConfig("aspect");
    settings["familiar"] = getNamedToggleConfig("familiar");
    settings["general"] = getGeneralConfig();
    return settings;
}

function recurseFear(target, config, results, pool, rng) {
    if (target == 0) {
        return true;
    } else if (target <= 0) {
        return false;
    }

    let successful = false;
    while (pool.length) {
        const vowIndex = rng.randomInt(pool.length)
        const randomVow = pool[vowIndex];
        const vowName = randomVow[0];
        const fearAmounts = randomVow[1];
        const fear = fearAmounts.shift();

        if (!fearAmounts.length) {
            pool.splice(vowIndex, 1);
        }

        successful = recurseFear(target - fear, config, results, deepCopy(pool), rng);
        if (successful) {
            if (!results[vowName]) {
                results[vowName] = [0, 0];
            }
            results[vowName][0] += 1;
            results[vowName][1] += fear;
            return true;
        }

    }

    return successful;
}

function rollFear(settings, rng) {
    const fearConfig = settings["fear"];
    const fearPool = deepCopy(VOWS_FEAR_MAP);
    const targetFear = parseInt(settings["general"]["fear"]);
    const resultsFear = {};
    let currentFear = 0;
    for (const vow of fearConfig) {
        const vowName = vow[0];
        const min = vow[1];
        const max = vow[2];
        const vowFear = fearPool[vowName];
        vowFear.splice(max);
        const vowForced = vowFear.splice(0, min);
        const vowForcedFear = vowForced.reduce((accum, value) => accum + value, 0);
        if (vowForced.length > 0) {
            resultsFear[vowName] = [vowForced.length, vowForcedFear];
        }
        currentFear += vowForcedFear;
        if (!vowFear.length) {
            delete fearPool[vowName]
        }
    }
    const success = recurseFear(targetFear - currentFear, fearConfig, resultsFear, Object.entries(fearPool), rng);
    return success ? resultsFear : null;

}

function activateAwakening(selected) {
    const graspCount = [0, 0, 0, 0, 0];
    let selectedCount = 0;
    for (const i in selected) {
        if (!selected[i]) continue;
        selectedCount++;
        const cost = ARCANA_GRASP_ARRAY[i][1];
        graspCount[cost - 1] += 1;
    }

    if (selectedCount > 0) {
        selected[24] = selectedCount <= 3;
        selected[19] = graspCount.every(count => count <= 2);
    }
    if (selected[3] || selected[8] || selected[9]) selected[4] = true;
    if (selected[15] && selected[16] && selected[21]) selected[20] = true;
    selected[12] = graspCount.every(count => count > 0);

    let divinity = false;
    for (let i = 0; i < 5; i++) {
        let r = true, c = true;
        for (let j = 0; j < 5; j++) {
            if (!selected[i * 5 + j]) r = false;
            if (!selected[j * 5 + i]) c = false;
        }
        if (r || c) {
            divinity = true;
            break;
        }
    }
    selected[23] = divinity;

    return selected;
}

function recurseArcana(grasp, pool, selected, disableDnS, rng) {
    let bestSelection = [...selected];
    let minGrasp = grasp;

    function solve(currentGrasp, currentPool, currentSelected) {
        if (currentGrasp < minGrasp) {
            minGrasp = currentGrasp;
            bestSelection = [...currentSelected];
        }

        if (currentGrasp === 0) return true;
        if (currentPool.length === 0) return false;

        let branchPool = [...currentPool];

        while (branchPool.length > 0) {
            const randomIndex = rng.randomInt(branchPool.length);
            const cardData = branchPool[randomIndex];
            const cardId = cardData[0];
            const cardCost = cardData[1];

            branchPool.splice(randomIndex, 1);

            if (cardCost <= currentGrasp) {
                const nextSelected = [...currentSelected];
                nextSelected[cardId] = true;

                let nextPool = branchPool.filter(c => c[0] !== cardId);

                if (disableDnS) {
                    if (cardId === 11) {
                        nextPool = nextPool.filter(c => c[0] !== 22);
                    } else if (cardId === 22) {
                        nextPool = nextPool.filter(c => c[0] !== 11);
                    }
                }

                if (solve(currentGrasp - cardCost, nextPool, nextSelected)) {
                    return true;
                }
            }
        }
        return false;
    }

    const exactMatch = solve(grasp, pool, selected);
    if (!exactMatch && minGrasp > 0) {
        showNotification(`No configuration found to use all grasp with the forced and disabled cards. Unused grasp: ${minGrasp}`);
    }
    return activateAwakening(bestSelection);
}

function rollArcana(grasp, settings, rng) {
    const arcanaConfig = settings["arcana"];
    const forceDS = settings["general"]["force-ds"];
    const disableDnS = settings["general"]["disable-ds"];

    const arcanaLookup = {};
    arcanaConfig.forEach(([id, state]) => {
        arcanaLookup[parseInt(id)] = state;
    });
    let selected = Array.from({ length: 25 }, () => false);
    const deadIndices = new Set();

    for (let i = 0; i < ARCANA_GRASP_ARRAY.length; i++) {
        const cardGrasp = ARCANA_GRASP_ARRAY[i][1];
        if (cardGrasp === 0) {
            deadIndices.add(i);
            continue;
        }

        const state = arcanaLookup[i];
        if (state === "force") {
            if (grasp < cardGrasp) return null;
            selected[i] = true;
            grasp -= cardGrasp;
            deadIndices.add(i);
        } else if (state === "disable") {
            deadIndices.add(i);
        }
    }

    if (forceDS && !selected[11] && !selected[22]) {
        const canForceDeath = arcanaLookup[11] !== "disable";
        const canForceStrength = arcanaLookup[22] !== "disable";

        if (canForceDeath || canForceStrength) {
            let cardNumber;
            if (canForceDeath && canForceStrength) {
                cardNumber = rng.randomInt(2) === 0 ? 11 : 22;
            } else {
                cardNumber = canForceDeath ? 11 : 22;
            }

            if (grasp >= 4) {
                selected[cardNumber] = true;
                grasp -= 4;
                deadIndices.add(cardNumber);
            } else {
                return null;
            }
        }
    }

    if (grasp < 0) return null;
    const bothForcedManually = (arcanaLookup[11] === "force" && arcanaLookup[22] === "force");
    const dsConstraintActive = disableDnS && !bothForcedManually;

    if (dsConstraintActive) {
        if (selected[11]) deadIndices.add(22);
        if (selected[22]) deadIndices.add(11);
    }

    const randomPool = [];
    ARCANA_GRASP_ARRAY.forEach((card, index) => {
        if (!deadIndices.has(index)) {
            randomPool.push([index, card[1]]);
        }
    });

    if (randomPool.length) {
        selected = recurseArcana(grasp, randomPool, selected, disableDnS, rng);
    }

    const finalSelection = [];
    selected.forEach((isActive, index) => {
        if (isActive) {
            finalSelection.push([...ARCANA_GRASP_ARRAY[index]]);
        }
    });
    return finalSelection;
}

function updateForcedGraspDisplay() {
    const containers = document.querySelectorAll(".tri-state-toggle");
    let totalForcedGrasp = 0;
    let isDeathForced = false;
    let isStrengthForced = false;
    let isDeathDisabled = false;
    let isStrengthDisabled = false;

    containers.forEach(container => {
        const activeInput = container.querySelector('input[type="radio"]:checked');
        if (activeInput) {
            const cardId = parseInt(activeInput.dataset.card);
            if (activeInput.value === "force") {
                totalForcedGrasp += ARCANA_GRASP_ARRAY[cardId][1];
                if (cardId === 11) isDeathForced = true;
                if (cardId === 22) isStrengthForced = true;
            } else if (activeInput.value === "disable") {
                if (cardId === 11) isDeathDisabled = true;
                if (cardId === 22) isStrengthDisabled = true;
            }
        }
    });

    const forceDS = document.getElementById("force-ds");
    if (forceDS && forceDS.checked) {
        if (!isDeathForced && !isStrengthForced) {
            if (!isDeathDisabled || !isStrengthDisabled) {
                totalForcedGrasp += 4;
            }
        }
    }

    const graspSpan = document.querySelector(".min-grasp");
    if (graspSpan) {
        graspSpan.innerText = `Current forced grasp: ${totalForcedGrasp}`;
    }
}

function rollKeepsake(settings, strengthActive, fwhimActive, rng) {
    const regionKeepsakes = settings["keepsake"];
    const disableDD = settings["general"]["disable-dd"];
    const results = [];
    const usedKeepsakes = new Set();
    let godKeepsakeSelected = false;

    const getFilteredPool = (pool) => {
        return pool.filter(ks => {
            if (strengthActive && disableDD) {
                if (ks === "Luckier Tooth" || ks === "Engraved Pin") return false;
            }
            if (!fwhimActive || godKeepsakeSelected) {
                if (FATES_WHIM_KEEPSAKES.includes(ks)) return false;
            }
            return !usedKeepsakes.has(ks);
        });
    };

    for (let i = 0; i < regionKeepsakes.length; i++) {
        const pool = getFilteredPool(regionKeepsakes[i]);
        if (pool.length === 0) {
            results.push(null);
            continue;
        }

        const choice = pool[rng.randomInt(pool.length)];
        results.push(choice);
        usedKeepsakes.add(choice);
        if (GOD_KEEPSAKES.includes(choice)) {
            godKeepsakeSelected = true;
        }

        if (choice === "Gorgon Amulet") {
            const extraPool = getFilteredPool(regionKeepsakes[i]);
            if (extraPool.length > 0) {
                const altChoice = extraPool[rng.randomInt(extraPool.length)];
                results.push(altChoice);
                usedKeepsakes.add(altChoice);
                if (GOD_KEEPSAKES.includes(altChoice)) godKeepsakeSelected = true;
            } else {
                results.push(null);
            }
        }
    }

    return results;
}

function displayResults(res) {
    const container = document.querySelector(".results");
    container.innerHTML = "";

    const regionClass = res.region === "Underworld" ? "res-underworld" : "res-surface";

    let html = `
        <div class="result-card">
            <h2 class="result-title ${regionClass}">${res.region} Trial</h2>
            <p class="result-seed">Seed: ${res.seed}</p>

            <div class="result-section">
                <h3 class="section-subtitle fear-color">Oath of the Unseen (Fear: ${res["fearAmount"]})</h3>
                <div class="fear-grid">
    `;

    const fearEntries = Object.entries(res.fear);
    if (fearEntries.length === 0) {
        html += `<p class="empty-text">No fear active</p>`;
    } else {
        fearEntries.forEach(([vow, [lvls, fear]]) => {
            html += `
                <div class="fear-item-res">
                    <span class="vow-name">${vow.toUpperCase()}</span>
                    <span class="vow-details">Lvl ${lvls} (+${fear} Fear)</span>
                </div>`;
        });
    }

    html += `</div></div>`;

    html += `
        <div class="result-section">
            <h3 class="section-subtitle arcana-color">Arcana Loadout (Grasp: ${res.grasp})</h3>
            <div class="arcana-grid">
    `;
    if (res.arcana.length === 0) {
        html += `<p class="empty-text">Free Selection with your Available Grasp</p>`;
    } else {
        res.arcana.forEach(([name, cost]) => {
            html += `<div class="arcana-item-res"><span>${name}</span><span class="grasp-cost">${cost}</span></div>`;
        });
    }
    html += `</div></div>`;

    html += `
        <div class="result-section">
            <h3 class="section-subtitle silver-color">Keepsakes</h3>
            <div class="keepsake-progression">
    `;
    let regionNumber = 1;
    for (let i = 0; i < res.keepsake.length; i++) {
        let ks = res.keepsake[i];
        let displayKs = ks || "Free Selection";
        if (ks === "Gorgon Amulet" && i + 1 < res.keepsake.length) {
            const altKs = res.keepsake[i + 1] || "Free Selection";
            displayKs += ` <span class="dd-note">(Or ${altKs} if you have Death Defiance)</span>`;
            i++;
        }
        html += `
            <details class="ks-step">
                <summary>Region ${regionNumber}</summary>
                <div class="ks-reveal">${displayKs}</div>
            </details>`;
        regionNumber++;
    }
    html += `</div></div>`;

    html += `
        <div class="result-section dual-grid">
            <div>
                <h3 class="section-subtitle silver-color">Weapon Aspect</h3>
                <p class="meta-val">${res.aspect || "Free Selection"}</p>
            </div>
            <div>
                <h3 class="section-subtitle silver-color">Familiar</h3>
                <p class="meta-val">${res.familiar || "Free Selection"}</p>
            </div>
        </div>
    </div>`;

    container.innerHTML = html;
    container.scrollIntoView({ behavior: 'smooth' });
}

function generateTrial() {
    const settings = getTrialSettings();
    saveSettingsLocally(settings);

    let seed;
    const useRandom = document.getElementById("use-random-seed").checked;
    const manualInput = document.getElementById("manual-seed").value;
    if (useRandom) {
        seed = Date.now() % 1000000000;
    } else {
        seed = parseInt(manualInput) || 1;
        seed = Math.max(1, Math.min(999999999, seed));
    }
    const rng = createPRNG(seed);

    const results = {};
    results["fear"] = rollFear(settings, rng);
    if (!results["fear"]) {
        showNotification("Can't get to target fear from the current fear settings. Change the fear settings or trial fear to a possible configuration");
        return;
    }
    const voidGraspMap = [30, 18, 12, 6, 0];
    if (results["fear"]["void"]) {
        results["grasp"] = voidGraspMap[results["fear"]["void"][0]];
    } else {
        results["grasp"] = 30;
    }

    results["arcana"] = rollArcana(results["grasp"], settings, rng);
    if (!results["arcana"]) {
        showNotification("The forced grasp goes over the selected grasp limit. Try again, reduce the maximum vow of void, or reduce your forced grasp");
        return;
    }
    const activeArcanaNames = results["arcana"].map(c => c[0]);
    const strength = activeArcanaNames.includes("Strength");
    const fwhim = !activeArcanaNames.includes("The Champions") && !activeArcanaNames.includes("The Enchantress");

    results["keepsake"] = rollKeepsake(settings, strength, fwhim, rng);

    const aspectPool = settings["aspect"];
    if (aspectPool.length > 0) {
        results["aspect"] = aspectPool[rng.randomInt(aspectPool.length)];
    } else {
        results["aspect"] = "";
    }

    let familiarPool = settings["familiar"];
    const disableDD = settings["general"]["disable-dd"];
    console.log(disableDD && strength, disableDD, strength);
    if (strength && disableDD) {
        familiarPool = familiarPool.filter(f => f !== "Toula");
        console.log(familiarPool);
    }
    if (familiarPool.length > 0) {
        results["familiar"] = familiarPool[rng.randomInt(familiarPool.length)];
    } else {
        results["familiar"] = "";
    }

    const regionInput = document.querySelector('input[name="region"]:checked').value;
    let selectedRegion = regionInput;
    if (regionInput === "random") {
        selectedRegion = rng.randomInt(2) === 0 ? "Underworld" : "Surface";
    } else {
        selectedRegion = regionInput.charAt(0).toUpperCase() + regionInput.slice(1);
    }

    results["fearAmount"] = document.getElementById("fear-level").value;
    results["region"] = selectedRegion;
    results.seed = rng.seed;
    displayResults(results);
}

function updateForcedFearDisplay(event) {
    const fearInput = document.getElementById("fear-level");
    const trialFear = parseInt(fearInput.value) || 0;
    const vows = document.querySelectorAll(".vow-setting");

    if (event && event.target.classList.contains("vow-setting")) {
        const currentInput = event.target;
        const isMinInput = currentInput.previousElementSibling &&
            currentInput.previousElementSibling.innerText.includes("Min");

        if (isMinInput) {
            const maxInput = currentInput.nextElementSibling.nextElementSibling;
            if (parseInt(currentInput.value) > parseInt(maxInput.value)) {
                showNotification("Min value cannot exceed Max value");
                currentInput.value = maxInput.value;
            }
        } else {
            const minInput = currentInput.previousElementSibling.previousElementSibling;
            if (parseInt(currentInput.value) < parseInt(minInput.value)) {
                showNotification("Max value cannot be lower than Min value");
                currentInput.value = minInput.value;
            }
        }
    }

    let totalForcedFear = 0;
    for (let i = 0; i < vows.length; i += 2) {
        const minInput = vows[i];
        const vowName = minInput.dataset.vow;
        const levelCount = parseInt(minInput.value) || 0;
        const fearValues = VOWS_FEAR_MAP[vowName]; // cite: script.js
        for (let j = 0; j < levelCount; j++) {
            totalForcedFear += fearValues[j];
        }
    }

    if (event && event.target.id === "fear-level") {
        if (trialFear < totalForcedFear) {
            showNotification("Trial fear cannot be lower than forced fear");
            fearInput.value = totalForcedFear;
        }
    } else if (totalForcedFear > trialFear) {
        showNotification("Forced fear cannot exceed trial fear");
        if (event && event.target) {
            event.target.value = event.target.defaultValue || 0;
            return updateForcedFearDisplay(event); // Re-run to update totals
        }
    }

    const displaySpan = document.querySelector(".min-fear");
    if (displaySpan) displaySpan.innerText = `Current forced fear: ${totalForcedFear}`;

    if (event && event.target) event.target.defaultValue = event.target.value;
}

function updateForcedGraspDisplay() {
    const containers = document.querySelectorAll(".tri-state-toggle");
    let totalForcedGrasp = 0;
    let isDeathForced = false;
    let isStrengthForced = false;
    let isDeathDisabled = false;
    let isStrengthDisabled = false;

    containers.forEach(container => {
        const activeInput = container.querySelector('input[type="radio"]:checked');
        if (activeInput) {
            const cardId = parseInt(activeInput.dataset.card);
            if (activeInput.value === "force") {
                totalForcedGrasp += ARCANA_GRASP_ARRAY[cardId][1];
                if (cardId === 11) isDeathForced = true;
                if (cardId === 22) isStrengthForced = true;
            } else if (activeInput.value === "disable") {
                if (cardId === 11) isDeathDisabled = true;
                if (cardId === 22) isStrengthDisabled = true;
            }
        }
    });

    const forceDS = document.getElementById("force-ds");
    if (forceDS.checked && !isDeathForced && !isStrengthForced) {
        if (!isDeathDisabled || !isStrengthDisabled) {
            totalForcedGrasp += 4;
        }
    }

    const graspSpan = document.querySelector(".min-grasp");
    if (graspSpan) {
        graspSpan.innerText = `Current forced grasp: ${totalForcedGrasp}`;
    }
}
const fileInput = document.getElementById("file-input");
fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    const fileReader = new FileReader();
    fileReader.addEventListener("load", async e => {
        fileInput.value = "";
        await loadSettings(JSON.parse(e.target.result));
        showNotification("Setting File Loaded");
    });
    fileReader.readAsText(file);
});

document.querySelector("table").addEventListener("click", e => {
    const anchor = e.target.closest(".ks-name");
    if (anchor) {
        const group = anchor.closest("tr").querySelectorAll(".ks-setting");
        for (const keepsake of group) {
            keepsake.checked = !keepsake.checked;
        }
    }
})

document.getElementById("force-ds").addEventListener("click", updateForcedGraspDisplay);

document.addEventListener("DOMContentLoaded", async () => {
    const savedSettings = localStorage.getItem("settings");
    if (savedSettings) {
        const settingsObject = JSON.parse(savedSettings);
        await loadSettings(settingsObject);
        showNotification("Last used settings restored");
    }

    document.querySelectorAll(".vow-setting, #fear-level").forEach(el => {
        el.addEventListener("change", updateForcedFearDisplay);
    });
    document.querySelectorAll(".tri-state-toggle input").forEach(radio => {
        radio.addEventListener("change", updateForcedGraspDisplay);
    });
    setTimeout(() => {
        updateForcedFearDisplay();
        updateForcedGraspDisplay();
    }, 100);
});



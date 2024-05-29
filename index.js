!(function (window, document) {
  const playersList = document.querySelector('#players-list');
  const playersTotal = document.querySelector('#players-total');
  const playersTotalLeft = document.querySelector('#players-total-left');
  const playersTotalRight = document.querySelector('#players-total-right');
  const playersTotalAny = document.querySelector('#players-total-any');
  const button = document.querySelector("#random-pairs");
  const pairsList = document.querySelector("#pairs-list");
  const pairsTotal = document.querySelector("#pairs-total");
  const remainList = document.querySelector("#remain-list");
  const remainTotal = document.querySelector("#remain-total");
  const copyButtons = document.querySelectorAll("button[data-action=\"copy\"");

  const copyIcon = `<svg viewBox="0 0 448 512" class="w-[16px] h-[16px] mt-1"><path d="M384 336H192c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16l140.1 0L400 115.9V320c0 8.8-7.2 16-16 16zM192 384H384c35.3 0 64-28.7 64-64V115.9c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1H192c-35.3 0-64 28.7-64 64V320c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H256c35.3 0 64-28.7 64-64V416H272v32c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192c0-8.8 7.2-16 16-16H96V128H64z" /></svg>`;
  const copyDoneIcon = `✅`;

  function createToken(data) {
    return btoa(JSON.stringify(data));
  }

  function readToken(value) {
    if (!value) return {};
    return JSON.parse(atob(value));
  }

  function parseTextToList(element) {
    const text = element.innerText;
    return text.split("\n").filter((v) => ![undefined, null, ""].includes(v));
  }

  function getPlayersList() {
    return parseTextToList(playersList);
  }
  
  function getPairsList() {
    return parseTextToList(pairsList);
  }

  function getRemainList() {
    return parseTextToList(remainList);
  }

  function groupPlayesBySide(list) {
    return list.reduce((grouped, player) => {
      const playerName = player.split(" ");
      const side = playerName.pop();
      if (side.toLowerCase() === "e") {
        grouped.left.push(playerName.join(" "));
      } else if (side.toLowerCase() === "d") {
        grouped.right.push(playerName.join(" "));
      } else {
        if (!["e", "d", "d/e", "e/d"].includes(side.toLowerCase())) {
          grouped.any.push(player);
        } else {
          grouped.any.push(playerName.join(" "));
        }
      }
      return grouped;
    }, { left: [], right: [], any: [] });
  }

  function updatePlayersTotal() {
    const list = getPlayersList();
    const { left, right, any } = groupPlayesBySide(list);
    playersTotal.innerText = list.length;
    playersTotalLeft.innerText = left.length;
    playersTotalRight.innerText = right.length;
    playersTotalAny.innerText = any.length;
    pairsTotal.innerText = getPairsList().length;
    remainTotal.innerText = getRemainList().length;
  }

  function updateLists({ players, pairs, remain }) {
    if (players) playersList.innerText = players.join("\n");
    if (pairs) pairsList.innerText = pairs.join("\n");
    if (remain) remainList.innerText = remain.join("\n");
  }

  function handlePaste(e) {
    e.preventDefault()
    const text = e.clipboardData.getData('text');
    playersList.innerText = text;
    updatePlayersTotal();
  }

  function distributeAnySidePlayers(left, right, any = []) {
    if (any.length > 0) {
      if (left.length > right.length) {
        return { left, right: [...right, ...any]};
      } else if (left.length < right.length) {
        return { left: [...left, ...any], right};
      }
      
    }
    return any.reduce((res, anySidePlayer, idx) => {
      if (res.left.length > res.right.length) {
        return { ...res, right: [...res.right, anySidePlayer]};
      } else if (res.left.length < res.right.length) {
        return { ...res, left: [...res.left, anySidePlayer]};
      } else {
        const side = idx % 2 == 0 ? "right" : "left";
        return { ...res, [side]: [...res[side], anySidePlayer]};
      }
    }, { left, right });
  }

  function getRandomArrayIndex(length) {
    return Math.floor(Math.random() * length);
  }

  function extractRandomArrayItem(list = []) {
    const index = getRandomArrayIndex(list.length);
    const item = list[index];
    const newList = list.filter((_, idx) => idx !== index);
    return [item, newList];
  }

  function createPairs({ left, right, any }, pairs = []) {
    if (!!any) {
      return createPairs(distributeAnySidePlayers(left, right, any), pairs);
    } else {
      if (left.length === 0 || right.length === 0) {
        return [
          pairs,
          left.length === 0
            ? right.map((v) => `${v} D`)
            : left.map((v) => `${v} E`)
        ];
      } else {
        const [leftPlayer, leftList] = extractRandomArrayItem(left);
        const [rightPlayer, rightList] = extractRandomArrayItem(right);
        return createPairs(
          { left: leftList, right: rightList },
          [...pairs, [leftPlayer, rightPlayer]]
        );
      }
    }
  }

  function updateQueryParams() {
    const data = {
      players: getPlayersList(),
      pairs: getPairsList(),
      remain: getRemainList(),
    };
    const url = new URL(window.location);
    url.searchParams.set('token', createToken(data));
    window.history.pushState({}, '', url);
  }

  function exec() {
    const list = getPlayersList();
    const grouped = groupPlayesBySide(list);
    const [pairs, remain] = createPairs(grouped);
    updateLists({
      pairs: pairs.map((pair) => pair.join(" & ")),
      remain,
    });
    updatePlayersTotal();
    updateQueryParams();
  }

  function copyToClipboard(e) {
    const btn = e.currentTarget;
    const targetId = btn.getAttribute("data-target");
    console.log(btn)
    console.log(btn.getAttribute("data-target"))
    const target = document.getElementById(targetId);
    console.log(target)
    const content = target.innerText;
    window.navigator.clipboard.writeText(content);
    btn.innerHTML = copyDoneIcon;
    setTimeout(() => {
      btn.innerHTML = copyIcon;
    }, 1000);
  }

  playersList.addEventListener("paste", handlePaste);
  playersList.addEventListener("input", updatePlayersTotal);
  button.addEventListener("click", exec);
  
  copyButtons.forEach((btn) => {
    btn.innerHTML = copyIcon;
    btn.addEventListener("click", copyToClipboard);
  });

  const url = new URL(window.location);
  updateLists(readToken(url.searchParams.get('token')));
  updatePlayersTotal();
})(window, document)
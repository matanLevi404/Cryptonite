$(() => {
  // FIXED SETTINGS
  let coinsList;
  let liveCoins = [];
  let copyLiveCoins;
  let sixthCoin;
  let timingObject = {};
  let chartIntervalId;
  let coinData = [[], [], [], [], []];
  // FIXED SETTINGS

  function fetchApi(apiUrl) {
    $(".grid-home").html(`<div class="loading">Loading&#8230;</div>`);
    $.get(apiUrl, loadAllCoins);
  }

  function loadAllCoins(coins) {
    localStorage.setItem("coinsList", JSON.stringify(coins));
    coinsList = coins;

    $(".grid-home").find(".loading").css("display", "none");
    for (let i = 0; i < coins.length; i++) drawCoin(coins[i]);
  }

  function drawCoin(coin) {
    const id = coin.id;
    const symbol = coin.symbol.toUpperCase();
    const name = coin.name;
    $(".grid-home").html(
      $(".grid-home").html() +
        `
            <div class="col ${symbol}" name="${id}">
                <div class="col-item flex">
                  <div class="symbol">${symbol}</div>
                  <div class="switch flex">
                    <div class="toggle" id="${symbol}">
                      <div class="circle"></div>
                    </div>
                  </div>
                </div>
                <div class="col-item name flex"><span>${name}</span></div>
                <div class="col-item flex">
                  <button class="more-info btn colored-btn" id="${coin.symbol}" name="${id}">More info</button>
                </div>
                <div class="col-item info flex" id="info" name="${id}"></div>
            </div>`
    );

    $(document).on("click", `#${symbol}`, goLive);
    $(document).on("click", `#${coin.symbol}`, moreInfo);
  }

  // HANDLE ALL ON/OFF LIVE COINS
  function goLive() {
    const theId = $(this).attr("id");
    if (liveCoins.includes(theId)) {
      const i = liveCoins.indexOf(theId);
      liveCoins.splice(i, 1);
    } else if (liveCoins.length < 5) liveCoins.push(theId);
    else {
      sixthCoin = $(this);
      $(".more-info").attr("disabled", true);
      popUpHandler();
      return;
    }
    $(this).toggleClass("active");
    arrChangeListener(liveCoins);
  }

  function popUpHandler() {
    $(".active-coins").html("");
    copyLiveCoins = liveCoins.slice();
    $(".back").addClass("show");
    for (let i = 0; i < liveCoins.length; i++) {
      const insider = $(`.${liveCoins[i]}`).html();
      const clone = `<div class="col ${liveCoins[i]}">${insider}</div>`;
      $(".active-coins").html($(".active-coins").html() + clone);
    }
  }

  function saveChanges() {
    let sixthCoinId = $(sixthCoin).attr("id");
    if (copyLiveCoins.length == liveCoins.length) {
      $(".back").removeClass("show");
      $(".more-info").attr("disabled", false);
      return;
    }
    for (let i = 0; i < copyLiveCoins.length; i++)
      if (!liveCoins.includes(copyLiveCoins[i]))
        $(`#${copyLiveCoins[i]}`).removeClass("active");

    $(`#${sixthCoinId}`).addClass("active");
    liveCoins.push(sixthCoinId);
    arrChangeListener(liveCoins);
    $(".back").removeClass("show");
    $(".more-info").attr("disabled", false);
  }

  function cancelChanges() {
    liveCoins = copyLiveCoins.slice();
    arrChangeListener(liveCoins);
    $(".back").removeClass("show");
    $(".more-info").attr("disabled", false);
  }

  $(".cancel").on("click", cancelChanges);
  $(".ok").on("click", saveChanges);
  // HANDLE ALL ON/OFF LIVE COINS

  // SHOW MORE INFO
  function moreInfo() {
    const idName = $(this).attr("name");
    $(`.col[name="${idName}"]`).toggleClass("open");
    if ($(`.info[name="${idName}"]`).html() == "") {
      callApiForInfo(idName);
    } else if (new Date().getMinutes() - timingObject[idName] >= 1)
      callApiForInfo(idName);
    timingObject[idName] = new Date().getMinutes();
  }

  function callApiForInfo(idName) {
    console.log(idName);
    $(`.info[name="${idName}"]`).html(
      `<div class="loading">Loading&#8230;</div>`
    );
    $.get(`https://api.coingecko.com/api/v3/coins/${idName}`, (data) => {
      localStorage.setItem(idName, JSON.stringify(data));
      drawInfo(idName, data);
    });
  }

  function drawInfo(idName, data) {
    $(`.info[name="${idName}"]`).html("");
    $(`.info[name="${idName}"]`).html(`
        <div class="info-item coin-img"><img src="${data.image.small}" alt="coin image"></div>
        <div class="info-item USD"><span id="USD">${data.market_data.current_price.usd} &#36</span></div>
        <div class="info-item EUR"><span id="EUR">${data.market_data.current_price.eur} &#128</span></div>
        <div class="info-item ILS"><span id="ILS">${data.market_data.current_price.ils} &#8362</span></div>
    `);
    console.log(data);
  }
  // SHOW MORE INFO

  // SEARCH FUNCTIONALITY
  function searchLiveCoins() {
    const searchInp = $(".search-bar").val();
    const allCoins = coinsList.map((coin) => {
      return coin.symbol.toUpperCase();
    });
    if (searchInp == "") {
      for (let i = 0; i < allCoins.length; i++)
        $(`.${allCoins[i]}`).css("display", "block");
      homeGrid();
      return;
    }
    for (let i = 0; i < allCoins.length; i++)
      if (!(searchInp == allCoins[i]) || !liveCoins.includes(searchInp))
        $(`.${allCoins[i]}`).css("display", "none");
      else $(`.${allCoins[i]}`).css("display", "block");

    homeGrid();
  }
  $(".search-btn").on("click", searchLiveCoins);
  // SEARCH FUNCTIONALITY

  // liveCoins CHANGE LISTENER
  function arrChangeListener() {
    clearInterval(chartIntervalId);
    const liveCoinsStr = liveCoins.join(",");
    if (liveCoinsStr == "") {
      $("#chart").html(
        "<span>you have not picked any coins to follow :(</span>"
      );
      return;
    }
    coinData = [[], [], [], [], []];
    chartIntervalId = setInterval(() => {
      $.get(
        `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${liveCoinsStr}&tsyms=USD`,
        drawChart
      );
    }, 1500);
  }

  function drawChart(data) {
    $("#chart").html("");
    let allDataPoints = [];
    for (let i = 0; i < 5; i++)
      if (Object.keys(data)[i] != undefined)
        coinData[i].push({ x: new Date(), y: data[Object.keys(data)[i]].USD });

    for (let i = 0; i < 5; i++) {
      if (Object.keys(data)[i] != undefined)
        allDataPoints.push({
          type: "line",
          name: `${Object.keys(data)[i]}`,
          showInLegend: true,
          xValueFormatString: "HH:mm",
          yValueFormatString: "#,##0 USD",
          dataPoints: coinData[i],
        });
    }
    chartViewer(allDataPoints);
  }

  function chartViewer(allData) {
    let chart = new CanvasJS.Chart("chart", {
      title: {
        text: "Selected coins Live",
      },
      subtitles: [
        {
          text: "Click Legend to Hide or Unhide Data Series",
        },
      ],
      axisX: {
        valueFormatString: "HH:mm:ss",
      },
      axisY: {
        title: "Coin Value",
        titleFontColor: "#4F81BC",
        lineColor: "#4F81BC",
        labelFontColor: "#4F81BC",
        tickColor: "#4F81BC",
        includeZero: false,
      },
      axisY2: {
        title: "",
        titleFontColor: "#C0504E",
        lineColor: "#C0504E",
        labelFontColor: "#C0504E",
        tickColor: "#C0504E",
        includeZero: false,
      },
      toolTip: {
        shared: true,
      },
      legend: {
        cursor: "pointer",
      },
      data: allData,
    });

    chart.render();
  }
  // liveCoins CHANGE LISTENER

  // SLIDER PAGINATING HANDLER
  function homeGrid() {
    $("body").css("overflow-y", "scroll");
    $(".slider-container").css("transform", "translateX(0vw)");
  }

  function liveGrid() {
    $("body").css("overflow", "hidden");
    $(".slider-container").css("transform", "translateX(-100vw)");
  }

  function aboutGrid() {
    $("body").css("overflow-y", "hidden");
    $(".slider-container").css("transform", "translateX(-200vw)");
  }

  $(".home").on("click", homeGrid);
  $(".live").on("click", liveGrid);
  $(".about").on("click", aboutGrid);
  // SLIDER PAGINATING HANDLER

  // ON LOAD
  $(document).ready(() => {
    $("nody").html(`<div class="loading">Loading&#8230;</div>`);
    fetchApi(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&page=1&per_page=51"
    );
  });
  // ON LOAD
});

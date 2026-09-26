/*
=========================================================
PO 1-MIN STRATEGY BOT V1
=========================================================

INDICATORS
- Bollinger Bands
- EMA 9
- EMA 21
- RSI 14
- Support / Resistance
- Volatility
- Market Condition

SIGNALS
- CALL
- PUT
- NO TRADE

TIMEFRAMES
- 1 MIN
- 2 MIN
- 3 MIN

DATA
V1 uses generated demo candles.
Real OTC candles require an OTC data connector.

NO REAL TRADES ARE EXECUTED.
=========================================================
*/


// =======================================================
// OTC PAIRS
// =======================================================

const OTC_PAIRS = [
  "EUR/USD OTC",
  "GBP/USD OTC",
  "EUR/JPY OTC",
  "AUD/JPY OTC",
  "USD/JPY OTC",
  "AUD/USD OTC",
  "USD/CAD OTC",
  "EUR/GBP OTC",
  "NZD/CAD OTC",
  "GBP/JPY OTC",
  "EUR/AUD OTC",
  "EUR/CAD OTC",
  "EUR/CHF OTC",
  "GBP/AUD OTC",
  "GBP/CAD OTC",
  "GBP/CHF OTC",
  "AUD/CAD OTC",
  "AUD/CHF OTC",
  "NZD/USD OTC",
  "NZD/JPY OTC",
  "NZD/CHF OTC",
  "CAD/JPY OTC",
  "CHF/JPY OTC"
];


// =======================================================
// STATE
// =======================================================

let selectedExpiry = 1;

const signalHistory = [];


// =======================================================
// DOM
// =======================================================

const pairSelect =
  document.getElementById("pair");

const analyzeBtn =
  document.getElementById("analyzeBtn");

const signalDisplay =
  document.getElementById("signalDisplay");

const signalText =
  document.getElementById("signalText");

const confidenceElement =
  document.getElementById("confidence");

const entryElement =
  document.getElementById("entry");

const expiryElement =
  document.getElementById("expiryTime");


// =======================================================
// LOAD PAIRS
// =======================================================

function loadPairs() {

  pairSelect.innerHTML = "";

  OTC_PAIRS.forEach(pair => {

    const option =
      document.createElement("option");

    option.value = pair;
    option.textContent = pair;

    pairSelect.appendChild(option);

  });

}

loadPairs();


// =======================================================
// EXPIRATION
// =======================================================

document.querySelectorAll(".expiry")
  .forEach(button => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll(".expiry")
        .forEach(btn =>
          btn.classList.remove("active")
        );

      button.classList.add("active");

      selectedExpiry =
        Number(button.dataset.expiry);

    });

  });


// =======================================================
// RANDOM
// =======================================================

function random(min, max) {

  return Math.random() *
    (max - min) + min;

}


// =======================================================
// DEMO CANDLES
// =======================================================

function generateCandles(count = 200) {

  const candles = [];

  let price =
    random(1.05, 1.25);

  for (let i = 0; i < count; i++) {

    const movement =
      random(-0.0015, 0.0015);

    const open = price;

    const close =
      price + movement;

    const high =
      Math.max(open, close) +
      random(0, 0.0007);

    const low =
      Math.min(open, close) -
      random(0, 0.0007);

    candles.push({
      open,
      high,
      low,
      close
    });

    price = close;

  }

  return candles;

}


// =======================================================
// EMA
// =======================================================

function EMA(values, period) {

  if (values.length < period) {
    return null;
  }

  const multiplier =
    2 / (period + 1);

  let ema =
    values
      .slice(0, period)
      .reduce((a, b) => a + b, 0)
      / period;

  for (
    let i = period;
    i < values.length;
    i++
  ) {

    ema =
      (values[i] - ema) *
      multiplier + ema;

  }

  return ema;

}


// =======================================================
// RSI 14
// =======================================================

function RSI(values, period = 14) {

  if (values.length <= period) {
    return 50;
  }

  let gains = 0;
  let losses = 0;

  for (
    let i = 1;
    i <= period;
    i++
  ) {

    const change =
      values[i] - values[i - 1];

    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }

  }

  let avgGain =
    gains / period;

  let avgLoss =
    losses / period;

  for (
    let i = period + 1;
    i < values.length;
    i++
  ) {

    const change =
      values[i] - values[i - 1];

    const gain =
      change > 0 ? change : 0;

    const loss =
      change < 0
        ? Math.abs(change)
        : 0;

    avgGain =
      ((avgGain * (period - 1)) +
        gain) / period;

    avgLoss =
      ((avgLoss * (period - 1)) +
        loss) / period;

  }

  if (avgLoss === 0) {
    return 100;
  }

  const rs =
    avgGain / avgLoss;

  return 100 -
    (100 / (1 + rs));

}


// =======================================================
// BOLLINGER BANDS
// =======================================================

function Bollinger(values, period = 20) {

  const data =
    values.slice(-period);

  const middle =
    data.reduce((a, b) => a + b, 0)
    / data.length;

  const variance =
    data.reduce(
      (sum, value) =>
        sum +
        Math.pow(value - middle, 2),
      0
    ) / data.length;

  const deviation =
    Math.sqrt(variance);

  return {

    middle,

    upper:
      middle + (2 * deviation),

    lower:
      middle - (2 * deviation)

  };

}


// =======================================================
// SUPPORT / RESISTANCE
// =======================================================

function SupportResistance(candles) {

  const recent =
    candles.slice(-30);

  const support =
    Math.min(
      ...recent.map(c => c.low)
    );

  const resistance =
    Math.max(
      ...recent.map(c => c.high)
    );

  return {
    support,
    resistance
  };

}


// =======================================================
// VOLATILITY
// =======================================================

function Volatility(candles) {

  const recent =
    candles.slice(-20);

  const ranges =
    recent.map(
      c => c.high - c.low
    );

  const average =
    ranges.reduce(
      (a, b) => a + b,
      0
    ) / ranges.length;

  return average;

}


// =======================================================
// MARKET CONDITION
// =======================================================

function MarketCondition(
  candles,
  ema9,
  ema21
) {

  const recent =
    candles.slice(-20);

  const movements =
    recent.map(
      c =>
        Math.abs(
          c.close - c.open
        )
    );

  const average =
    movements.reduce(
      (a, b) => a + b,
      0
    ) / movements.length;

  const emaDistance =
    Math.abs(
      ema9 - ema21
    );

  /*
    Very small movement +
    very small EMA separation
    = flat market.
  */

  if (
    average < 0.00003 ||
    emaDistance < 0.00001
  ) {

    return "FLAT";

  }

  return "TRENDING";

}


// =======================================================
// CROSS DETECTION
// =======================================================

function calculatePreviousEMA(
  values,
  period
) {

  if (values.length <= period) {
    return null;
  }

  return EMA(
    values.slice(0, -1),
    period
  );

}


function bullishCross(
  values
) {

  const currentEMA9 =
    EMA(values, 9);

  const currentEMA21 =
    EMA(values, 21);

  const previousEMA9 =
    calculatePreviousEMA(values, 9);

  const previousEMA21 =
    calculatePreviousEMA(values, 21);

  return (
    previousEMA9 <= previousEMA21 &&
    currentEMA9 > currentEMA21
  );

}


function bearishCross(
  values
) {

  const currentEMA9 =
    EMA(values, 9);

  const currentEMA21 =
    EMA(values, 21);

  const previousEMA9 =
    calculatePreviousEMA(values, 9);

  const previousEMA21 =
    calculatePreviousEMA(values, 21);

  return (
    previousEMA9 >= previousEMA21 &&
    currentEMA9 < currentEMA21
  );

}


// =======================================================
// RSI EXIT
// =======================================================

function RSIExitUp(values) {

  const current =
    RSI(values, 14);

  const previous =
    RSI(
      values.slice(0, -1),
      14
    );

  return (
    previous <= 30 &&
    current > 30
  );

}


function RSIExitDown(values) {

  const current =
    RSI(values, 14);

  const previous =
    RSI(
      values.slice(0, -1),
      14
    );

  return (
    previous >= 70 &&
    current < 70
  );

}


// =======================================================
// SUPPORT BOUNCE
// =======================================================

function SupportBounce(
  candles,
  support
) {

  const previous =
    candles[candles.length - 2];

  const current =
    candles[candles.length - 1];

  const supportDistance =
    Math.abs(
      previous.low - support
    );

  const bounce =
    current.close > previous.close;

  return (
    supportDistance <
      Math.abs(support) * 0.001 &&
    bounce
  );

}


// =======================================================
// RESISTANCE BOUNCE
// =======================================================

function ResistanceBounce(
  candles,
  resistance
) {

  const previous =
    candles[candles.length - 2];

  const current =
    candles[candles.length - 1];

  const resistanceDistance =
    Math.abs(
      resistance - previous.high
    );

  const bounce =
    current.close < previous.close;

  return (
    resistanceDistance <
      Math.abs(resistance) * 0.001 &&
    bounce
  );

}


// =======================================================
// TIME
// =======================================================

function formatTime(date) {

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }
  );

}


// =======================================================
// MAIN STRATEGY
// =======================================================

function analyzeStrategy(
  expiryMinutes
) {

  const candles =
    generateCandles(200);

  const closes =
    candles.map(
      candle => candle.close
    );

  const currentPrice =
    closes[closes.length - 1];

  const previousPrice =
    closes[closes.length - 2];


  // INDICATORS

  const ema9 =
    EMA(closes, 9);

  const ema21 =
    EMA(closes, 21);

  const rsi =
    RSI(closes, 14);

  const previousRSI =
    RSI(
      closes.slice(0, -1),
      14
    );

  const bb =
    Bollinger(closes, 20);

  const sr =
    SupportResistance(candles);

  const volatility =
    Volatility(candles);

  const market =
    MarketCondition(
      candles,
      ema9,
      ema21
    );


  // =====================================================
  // CONDITIONS
  // =====================================================

  const emaBullCross =
    bullishCross(closes);

  const emaBearCross =
    bearishCross(closes);


  const priceAboveEMA =
    currentPrice > ema9 &&
    currentPrice > ema21;

  const priceBelowEMA =
    currentPrice < ema9 &&
    currentPrice < ema21;


  const rsiExitsOversold =
    previousRSI <= 30 &&
    rsi > 30;

  const rsiExitsOverbought =
    previousRSI >= 70 &&
    rsi < 70;


  const supportBounce =
    SupportBounce(
      candles,
      sr.support
    );

  const resistanceBounce =
    ResistanceBounce(
      candles,
      sr.resistance
    );


  const volatilityOK =
    volatility > 0.00005;


  const marketOK =
    market !== "FLAT";


  const bollingerBull =
    currentPrice > bb.middle &&
    currentPrice <= bb.upper;

  const bollingerBear =
    currentPrice < bb.middle &&
    currentPrice >= bb.lower;


  // =====================================================
  // SCORE
  // =====================================================

  let callScore = 0;
  let putScore = 0;


  if (emaBullCross) {
    callScore += 3;
  }

  if (priceAboveEMA) {
    callScore += 1;
  }

  if (rsiExitsOversold) {
    callScore += 3;
  }

  if (supportBounce) {
    callScore += 2;
  }

  if (bollingerBull) {
    callScore += 1;
  }


  if (emaBearCross) {
    putScore += 3;
  }

  if (priceBelowEMA) {
    putScore += 1;
  }

  if (rsiExitsOverbought) {
    putScore += 3;
  }

  if (resistanceBounce) {
    putScore += 2;
  }

  if (bollingerBear) {
    putScore += 1;
  }


  // =====================================================
  // FINAL SIGNAL
  // =====================================================

  let signal =
    "NO TRADE";

  let confidence = 0;


  /*
    We require several conditions to agree.
    A single indicator cannot create a trade signal.
  */

  if (
    marketOK &&
    volatilityOK &&
    callScore >= 6 &&
    callScore > putScore
  ) {

    signal =
      "CALL";

    confidence =
      Math.min(
        95,
        65 +
        callScore * 4 +
        Math.floor(random(0, 6))
      );

  }

  else if (
    marketOK &&
    volatilityOK &&
    putScore >= 6 &&
    putScore > callScore
  ) {

    signal =
      "PUT";

    confidence =
      Math.min(
        95,
        65 +
        putScore * 4 +
        Math.floor(random(0, 6))
      );

  }


  return {

    signal,

    confidence,

    expiryMinutes,

    currentPrice,

    ema9,

    ema21,

    rsi,

    previousRSI,

    bb,

    support: sr.support,

    resistance: sr.resistance,

    volatility,

    market,

    conditions: {

      emaBullCross,

      emaBearCross,

      priceAboveEMA,

      priceBelowEMA,

      rsiExitsOversold,

      rsiExitsOverbought,

      supportBounce,

      resistanceBounce,

      volatilityOK,

      bollingerBull,

      bollingerBear

    }

  };

}


// =======================================================
// UPDATE MAIN SIGNAL
// =======================================================

function updateMainSignal(result) {

  signalDisplay.className =
    "signal-display";

  if (result.signal === "CALL") {

    signalDisplay.classList.add(
      "call"
    );

  }

  else if (result.signal === "PUT") {

    signalDisplay.classList.add(
      "put"
    );

  }

  else {

    signalDisplay.classList.add(
      "no-trade"
    );

  }


  signalText.textContent =
    result.signal;

  confidenceElement.textContent =
    result.confidence + "%";


  const entry =
    new Date();

  const expiry =
    new Date(
      entry.getTime() +
      result.expiryMinutes *
      60000
    );


  entryElement.textContent =
    formatTime(entry);

  expiryElement.textContent =
    formatTime(expiry);


  // EMA

  document.getElementById(
    "emaStatus"
  ).textContent =
    result.ema9 > result.ema21
      ? "BULLISH"
      : "BEARISH";


  // Bollinger

  document.getElementById(
    "bbStatus"
  ).textContent =
    result.currentPrice >
    result.bb.middle
      ? "ABOVE MID"
      : "BELOW MID";


  // RSI

  document.getElementById(
    "rsiStatus"
  ).textContent =
    result.rsi.toFixed(1);


  // Support

  document.getElementById(
    "supportStatus"
  ).textContent =
    result.conditions.supportBounce
      ? "BOUNCE"
      : "NO BOUNCE";


  // Resistance

  document.getElementById(
    "resistanceStatus"
  ).textContent =
    result.conditions.resistanceBounce
      ? "BOUNCE"
      : "NO BOUNCE";


  // Volatility

  document.getElementById(
    "volatilityStatus"
  ).textContent =
    result.conditions.volatilityOK
      ? "OK"
      : "LOW";


  // Market

  document.getElementById(
    "marketStatus"
  ).textContent =
    result.market;

}


// =======================================================
// UPDATE ALL TIMEFRAMES
// =======================================================

function updateAllSignals(
  results
) {

  results.forEach(result => {

    const signalElement =
      document.getElementById(
        "signal" +
        result.expiryMinutes
      );

    const confidenceElement =
      document.getElementById(
        "confidence" +
        result.expiryMinutes
      );


    signalElement.textContent =
      result.signal;

    confidenceElement.textContent =
      result.confidence + "%";


    if (
      result.signal === "CALL"
    ) {

      signalElement.style.color =
        "#39e68a";

    }

    else if (
      result.signal === "PUT"
    ) {

      signalElement.style.color =
        "#ff6570";

    }

    else {

      signalElement.style.color =
        "#aeb9c5";

    }

  });

}


// =======================================================
// HISTORY
// =======================================================

function addHistory(result) {

  const entry =
    new Date();

  const expiry =
    new Date(
      entry.getTime() +
      result.expiryMinutes *
      60000
    );


  signalHistory.unshift({

    pair:
      pairSelect.value,

    timeframe:
      result.expiryMinutes,

    signal:
      result.signal,

    confidence:
      result.confidence,

    entry:
      formatTime(entry),

    expiry:
      formatTime(expiry)

  });


  if (
    signalHistory.length > 30
  ) {

    signalHistory.pop();

  }


  renderHistory();

}


// =======================================================
// RENDER HISTORY
// =======================================================

function renderHistory() {

  const list =
    document.getElementById(
      "historyList"
    );


  if (
    signalHistory.length === 0
  ) {

    list.innerHTML =
      '<p class="empty">No signals analyzed yet.</p>';

    return;

  }


  list.innerHTML =
    signalHistory.map(
      item => `

      <div class="history-item">

        <div class="history-top">

          <span>
            ${item.pair}
          </span>

          <strong class="history-signal ${
            item.signal
              .toLowerCase()
              .replace(" ", "-")
          }">

            ${item.signal}

          </strong>

        </div>

        <div class="history-bottom">

          ${item.timeframe} MIN
          • ${item.confidence}%
          • Entry ${item.entry}
          • Expiry ${item.expiry}

        </div>

      </div>

    `
    ).join("");

}


// =======================================================
// ANALYZE ALL TIMEFRAMES
// =======================================================

function analyzeAllTimeframes() {

  const results = [];

  for (
    let minutes = 1;
    minutes <= 3;
    minutes++
  ) {

    /*
      Each timeframe gets its own
      independent strategy analysis.
    */

    const result =
      analyzeStrategy(minutes);

    results.push(result);

  }

  return results;

}


// =======================================================
// ANALYZE BUTTON
// =======================================================

analyzeBtn.addEventListener(
  "click",
  () => {

    analyzeBtn.disabled =
      true;

    analyzeBtn.textContent =
      "ANALYZING...";


    setTimeout(() => {

      const results =
        analyzeAllTimeframes();


      updateAllSignals(
        results
      );


      const selectedResult =
        results.find(
          result =>
            result.expiryMinutes ===
            selectedExpiry
        );


      updateMainSignal(
        selectedResult
      );


      addHistory(
        selectedResult
      );


      analyzeBtn.disabled =
        false;

      analyzeBtn.textContent =
        "ANALYZE MARKET";

    }, 500);

  }
);


// =======================================================
// STARTUP
// =======================================================

console.log(
  "PO 1-Min Strategy Bot V1 started."
);

console.log(
  "OTC pairs:",
  OTC_PAIRS.length
);

console.log(
  "Indicators: Bollinger, EMA9, EMA21, RSI14, S/R, Volatility"
);

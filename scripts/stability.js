import fs from "fs";

const DAYS_OPTIONS = [30, 90];

const LIG1_POOL =
  "0xd6791279b261c36c1e079ece8cb05079cc5e7e38";

const ASSETS = [
  { name: "LIG1", type: "gecko_pool" },
  { name: "Bitcoin", type: "coingecko", id: "bitcoin" },
  { name: "Ethereum", type: "coingecko", id: "ethereum" },
  { name: "S&P 500", type: "yahoo", id: "^GSPC" },
  { name: "Alphabet", type: "yahoo", id: "GOOGL" },
  { name: "Gold", type: "yahoo", id: "GC=F" }
];

// ---------------- FETCH FUNCTIONS ----------------

async function fetchCoinGecko(id, days) {
  const url =
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko error ${id}`);
  const data = await res.json();
  return data.prices.map(p => p[1]);
}

async function fetchYahoo(symbol, days) {
  const range = days === 30 ? "1mo" : "3mo";
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Yahoo error ${symbol}`);
  const data = await res.json();
  return data.chart.result[0].indicators.quote[0].close.filter(Boolean);
}

async function fetchGeckoPool(days) {
  const url =
    `https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools/${LIG1_POOL}/ohlcv/day` +
    `?aggregate=1&limit=${days}` +
    `&currency=usd&token=base` +
    `&include_empty_intervals=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("GeckoTerminal error LIG1");
  const data = await res.json();

  const ohlcv = data.data.attributes.ohlcv_list;

  if (!Array.isArray(ohlcv)) {
    throw new Error("Invalid OHLCV data for LIG1");
  }

  // close price = Index 4
  // reverse, weil API meist newest-first liefert
  return ohlcv
    .map(candle => candle[4])
    .filter(v => v != null)
    .reverse();
}

// ---------------- CALCULATIONS ----------------

function calculateReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

function stdDev(arr) {
  const mean =
    arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance =
    arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function maxDrawdown(prices) {
  let peak = prices[0];
  let maxDD = 0;

  for (let p of prices) {
    if (p > peak) peak = p;
    const dd = (p - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }
  return Math.abs(maxDD);
}

function normalize(value, max) {
  return max === 0 ? 0 : (value / max) * 100;
}

// ---------------- MAIN PROCESS ----------------

async function processDays(days) {
  const results = [];

  for (let asset of ASSETS) {
    let prices;

    if (asset.type === "coingecko") {
      prices = await fetchCoinGecko(asset.id, days);
    }

    if (asset.type === "yahoo") {
      prices = await fetchYahoo(asset.id, days);
    }

    if (asset.type === "gecko_pool") {
      prices = await fetchGeckoPool(days);
    }

    if (!prices || prices.length < 10) {
      console.log(asset.name, "nicht genügend Daten");
      continue;
    }

    const first = prices[0];
    const last = prices[prices.length - 1];

    const performance = (last / first - 1);
    const value1000 = 1000 * (1 + performance);

    results.push({
      asset: asset.name,
      performance: performance,
      value_1000: value1000
    });
  }

  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(
    `data/performance-${days}.json`,
    JSON.stringify(results, null, 2)
  );
}

async function run() {
  for (let d of DAYS_OPTIONS) {
    await processDays(d);
  }
}

run();

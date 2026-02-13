import fs from "fs";

const START_DATE = new Date("2026-01-16T00:00:00Z");

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

async function fetchCoinGecko(id) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=max`
  );
  if (!res.ok) throw new Error(`CoinGecko error ${id}`);
  const data = await res.json();
  return data.prices; // [timestamp, price]
}

async function fetchYahoo(symbol) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1y&interval=1d`
  );
  if (!res.ok) throw new Error(`Yahoo error ${symbol}`);
  const data = await res.json();
  const result = data.chart.result[0];

  return result.timestamp.map((t, i) => [
    t * 1000,
    result.indicators.quote[0].close[i]
  ]);
}

async function fetchGeckoPool() {
  const res = await fetch(
    `https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools/${LIG1_POOL}/ohlcv/day?limit=365&currency=usd&token=base&include_empty_intervals=true`
  );
  if (!res.ok) throw new Error("GeckoTerminal error LIG1");

  const data = await res.json();
  const list = data.data.attributes.ohlcv_list.reverse();

  return list.map(candle => [
    candle[0] * 1000,
    candle[4]
  ]);
}

// ---------------- MAIN PROCESS ----------------

async function processSinceStart() {
  const results = [];

  for (let asset of ASSETS) {

    let dataPoints;

    if (asset.type === "coingecko") {
      dataPoints = await fetchCoinGecko(asset.id);
    }

    if (asset.type === "yahoo") {
      dataPoints = await fetchYahoo(asset.id);
    }

    if (asset.type === "gecko_pool") {
      dataPoints = await fetchGeckoPool();
    }

    if (!dataPoints || dataPoints.length < 5) continue;

    // Preis am oder nach START_DATE finden
    let startPrice = null;
    let lastPrice = dataPoints[dataPoints.length - 1][1];

    for (let [timestamp, price] of dataPoints) {
      if (timestamp >= START_DATE.getTime() && price != null) {
        startPrice = price;
        break;
      }
    }

    if (!startPrice) {
      console.log(asset.name, "kein Startpreis gefunden");
      continue;
    }

    const performance = (lastPrice / startPrice - 1);
    const value1000 = 1000 * (1 + performance);

    results.push({
      asset: asset.name,
      performance_percent: (performance * 100),
      value_from_1000: value1000
    });
  }

  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(
    `data/performance-since-2026-01-16.json`,
    JSON.stringify(results, null, 2)
  );
}

processSinceStart();

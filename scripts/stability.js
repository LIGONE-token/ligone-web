import fs from "fs";
import fetch from "node-fetch";

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

// ---------------- FETCH ----------------

async function fetchCoinGecko(id) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=max`
  );
  const data = await res.json();
  return data.prices;
}

async function fetchYahoo(symbol) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1y&interval=1d`
  );
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
  const data = await res.json();
  const list = data.data.attributes.ohlcv_list.reverse();

  return list.map(c => [
    c[0] * 1000,
    c[4]
  ]);
}

// ---------------- MAIN ----------------

async function processSinceStart() {

  const results = [];

  for (let asset of ASSETS) {

    let dataPoints;

    if (asset.type === "coingecko")
      dataPoints = await fetchCoinGecko(asset.id);

    if (asset.type === "yahoo")
      dataPoints = await fetchYahoo(asset.id);

    if (asset.type === "gecko_pool")
      dataPoints = await fetchGeckoPool();

    if (!dataPoints || dataPoints.length < 5) continue;

    let startPrice = null;
    let lastPrice = dataPoints[dataPoints.length - 1][1];
    let dayCount = 0;

    for (let i = 0; i < dataPoints.length; i++) {
      const [timestamp, price] = dataPoints[i];

      if (timestamp >= START_DATE.getTime() && price != null) {
        startPrice = price;
        dayCount = dataPoints.length - i;
        break;
      }
    }

    if (!startPrice || dayCount < 2) continue;

    const totalPerformance = (lastPrice / startPrice - 1);
    const avgDaily = Math.pow((1 + totalPerformance), (1 / dayCount)) - 1;

    results.push({
      asset: asset.name,
      total_percent: totalPerformance * 100,
      avg_daily_percent: avgDaily * 100
    });
  }

  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(
    `data/performance-since-2026-01-16.json`,
    JSON.stringify(results, null, 2)
  );
}

processSinceStart();

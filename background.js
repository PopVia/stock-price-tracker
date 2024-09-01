const apiKey = 'cqca2cpr01qmbcu94ht0cqca2cpr01qmbcu94htg';

// Initialize alarms when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('fetchStockPrices', { periodInMinutes: 1 });
});

// Handle alarms
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'fetchStockPrices') {
    chrome.storage.local.get('stocks', function(data) {
      const stocks = data.stocks || ['BAC', 'F', 'PFE'];

      stocks.forEach(stock => {
        fetch(`https://finnhub.io/api/v1/quote?symbol=${stock}&token=${apiKey}`)
          .then(response => response.json())
          .then(data => {
            chrome.storage.local.get('stockPrices', function(priceData) {
              const stockPrices = priceData.stockPrices || {};
              if (!stockPrices[stock]) {
                stockPrices[stock] = [];
              }
              stockPrices[stock].push({
                price: data.c,
                change: data.d,
                timestamp: new Date().toLocaleString()
              });

              // Limit the stored prices to the last 100 entries per stock
              if (stockPrices[stock].length > 100) {
                stockPrices[stock].shift();
              }

              chrome.storage.local.set({ stockPrices }, function() {
                console.log(`Stored price for ${stock}: $${data.c} (${data.d})`);
              });
            });
          })
          .catch(error => console.error('Error fetching stock price:', error));
      });
    });
  }
});

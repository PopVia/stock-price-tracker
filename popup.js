document.addEventListener('DOMContentLoaded', function() {
  const stockListElement = document.getElementById('stock-list');
  const stockInputElement = document.getElementById('stock-input');
  const addStockButton = document.getElementById('add-stock');

  const apiKey = 'cqca2cpr01qmbcu94ht0cqca2cpr01qmbcu94htg';

  chrome.storage.local.get('stocks', function(data) {
    const stocks = data.stocks;
    displayStocks(stocks);
    fetchStockPrices(stocks);
  });

  addStockButton.addEventListener('click', function() {
    const newStock = stockInputElement.value.toUpperCase().trim();
    if (newStock) {
      chrome.storage.local.get('stocks', function(data) {
        const stocks = data.stocks || [];
        if (!stocks.includes(newStock)) {
          stocks.push(newStock);
          chrome.storage.local.set({ stocks }, function() {
            displayStocks(stocks);
            fetchStockPrices(stocks);
          });
        }
      });
    }
    stockInputElement.value = '';
  });

  function displayStocks(stocks) {
    stockListElement.innerHTML = '';
    stocks.forEach(stock => {
      const stockItem = document.createElement('div');
      stockItem.className = 'stock-item';
      stockItem.id = `stock-${stock}`;

      const stockInfo = document.createElement('span');
      stockInfo.className = 'stock-info';
      stockInfo.textContent = `${stock}: Fetching...`;

      const removeButton = document.createElement('button');
      removeButton.className = 'remove-button';
      removeButton.textContent = 'Remove';
      removeButton.addEventListener('click', function() {
        removeStock(stock);
      });

      stockItem.appendChild(stockInfo);
      stockItem.appendChild(removeButton);
      stockListElement.appendChild(stockItem);
    });
  }

  function fetchStockPrices(stocks) {
    stocks.forEach(stock => {
      fetch(`https://finnhub.io/api/v1/quote?symbol=${stock}&token=${apiKey}`)
        .then(response => response.json())
        .then(data => {
          const stockItem = document.getElementById(`stock-${stock}`).querySelector('.stock-info');
          if (stockItem) {
            stockItem.textContent = `${stock}: $${data.c.toFixed(2)} (${data.d >= 0 ? '+' : ''}${data.d.toFixed(2)})`;
          }
        })
        .catch(error => console.error('Error fetching stock price:', error));
    });
  }

  function removeStock(stock) {
    chrome.storage.local.get('stocks', function(data) {
      const stocks = data.stocks || [];
      const index = stocks.indexOf(stock);
      if (index > -1) {
        stocks.splice(index, 1);
        chrome.storage.local.set({ stocks }, function() {
          displayStocks(stocks);
          fetchStockPrices(stocks);
        });
      }
    });
  }
});

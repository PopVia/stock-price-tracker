const apiKey = 'cqca2cpr01qmbcu94ht0cqca2cpr01qmbcu94htg';
const baseUrl = 'https://finnhub.io/api/v1/quote?symbol=';



// General function to fetch and display stock data
async function fetchAndDisplayStockData(stockSymbol, container, includeRemoveButton = false, removeFunction = null) {
  try {
    const response = await fetch(`${baseUrl}${stockSymbol}&token=${apiKey}`);
    if (!response.ok) throw new Error('API call failed');
    const data = await response.json();
    
    if (data && data.c) {
      const stockElement = document.createElement('div');
      stockElement.classList.add('watchlist-item');

      // Stock symbol, price, and change display
      const stockInfo = document.createElement('div');
      stockInfo.classList.add('stock-info');
      const changeIcon = data.d >= 0 ? '<i class="fas fa-arrow-up"></i>' : '<i class="fas fa-arrow-down"></i>';
      stockInfo.innerHTML = `
        <span class="stock-symbol">${stockSymbol}</span>
        <span class="stock-price">$${data.c.toFixed(2)}</span>
        <span class="stock-change" style="color: ${data.d >= 0 ? 'green' : 'red'};">
          ${data.d >= 0 ? '+' : ''}${data.d.toFixed(2)} ${changeIcon}
        </span>
      `;

      stockElement.appendChild(stockInfo);

      // If a remove button is needed (e.g., in the watchlist or portfolio), add it
      if (includeRemoveButton && removeFunction) {
        const removeButton = createRemoveButton(stockSymbol, removeFunction);
        stockElement.appendChild(removeButton);
      }

      container.appendChild(stockElement);
    } else {
      alert('No data available for this symbol');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to fetch stock data. Please try again.');
  }
}

// Function to create a remove button
function createRemoveButton(stockSymbol, removeFunction) {
  const removeButton = document.createElement('button');
  removeButton.classList.add('remove-button');
  removeButton.innerHTML = '<i class="fas fa-minus"></i>'; // FontAwesome minus icon
  removeButton.addEventListener('click', () => removeFunction(stockSymbol));
  return removeButton;
}

// Event listener for the "Search" button on the Home page
document.getElementById('search-stock').addEventListener('click', async () => {
  const stockInput = document.getElementById('stock-input');
  const stockSymbol = stockInput.value.trim().toUpperCase();

  if (!stockSymbol) {
    alert('Please enter a stock symbol');
    return;
  }

  const stockDataElement = document.getElementById('stock-data');
  stockDataElement.innerHTML = ''; // Clear previous data

  try {
    const response = await fetch(`${baseUrl}${stockSymbol}&token=${apiKey}`);
    if (!response.ok) throw new Error('API call failed');
    const data = await response.json();

    if (data && data.c) {
      const changeIcon = data.d >= 0 ? '<i class="fas fa-arrow-up"></i>' : '<i class="fas fa-arrow-down"></i>';
      stockDataElement.innerHTML = `
        <h3>${stockSymbol}</h3>
        <p>Current Price: $${data.c.toFixed(2)}</p>
        <p> Day Change: <span class="stock-change" style="color: ${data.d >= 0 ? 'green' : 'red'};">
          ${data.d >= 0 ? '+' : ''}${data.d.toFixed(2)} ${changeIcon}
        </span></p>
      `;
    } else {
      alert('No data available for this symbol');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to fetch stock data. Please try again.');
  }

  // Reset the button to "Add to Watchlist"
  const button = document.getElementById('add-to-watchlist');
  button.innerHTML = '<i class="fas fa-plus"></i> Add to Watchlist';
  button.classList.remove('added');

  // Check if the stock is already in the watchlist
  chrome.storage.local.get({ watchlist: [] }, (result) => {
    if (result.watchlist.includes(stockSymbol)) {
      button.innerHTML = '<i class="fas fa-check"></i> Added to Watchlist';
      button.classList.add('added');
    }
  });

  button.style.display = 'block';
});

// Add to watchlist button functionality
document.getElementById('add-to-watchlist').addEventListener('click', () => {
  const stockSymbol = document.getElementById('stock-input').value.trim().toUpperCase();
  if (stockSymbol) {
    chrome.storage.local.get({ watchlist: [] }, (result) => {
      const currentWatchlist = result.watchlist || [];
      const button = document.getElementById('add-to-watchlist');
      const icon = button.querySelector('i');

      // Toggle watchlist status
      if (currentWatchlist.includes(stockSymbol)) {
        // Remove from watchlist
        const updatedWatchlist = currentWatchlist.filter(item => item !== stockSymbol);
        chrome.storage.local.set({ watchlist: updatedWatchlist }, () => {
          button.innerHTML = '<i class="fas fa-plus"></i> Add to Watchlist'; // Change button text and icon
          icon.className = 'fas fa-plus'; // Change icon to 'plus'
          loadWatchlist(); // Update watchlist display
        });
      } else {
        // Add to watchlist
        const updatedWatchlist = [...currentWatchlist, stockSymbol];
        chrome.storage.local.set({ watchlist: updatedWatchlist }, () => {
          button.innerHTML = '<i class="fas fa-check"></i> Added to Watchlist'; // Change button text and icon
          icon.className = 'fas fa-check'; // Change icon to 'check'
          loadWatchlist(); // Update watchlist display
        });
      }
    });
  }
});

// Load watchlist content with current price and change
function loadWatchlist() {
  chrome.storage.local.get({ watchlist: [] }, async (result) => {
    const watchlistElement = document.getElementById('watchlist');
    watchlistElement.innerHTML = '';

    for (const stock of result.watchlist) {
      await fetchAndDisplayStockData(stock, watchlistElement, true, removeStockFromWatchlist);
    }
  });
}

// Function to remove stock from the watchlist
function removeStockFromWatchlist(stock) {
  chrome.storage.local.get({ watchlist: [] }, (result) => {
    const updatedWatchlist = result.watchlist.filter(item => item !== stock);
    chrome.storage.local.set({ watchlist: updatedWatchlist }, () => {
      loadWatchlist();
    });
  });
}

// Initial load of watchlist on Watchlist tab activation
document.getElementById('watchlist-tab').addEventListener('click', loadWatchlist);

// Add to portfolio button functionality
document.getElementById('add-to-portfolio').addEventListener('click', () => {
  const stockSymbol = document.getElementById('stock-input').value.trim().toUpperCase();
  const purchasePrice = parseFloat(prompt(`Enter the purchase price for ${stockSymbol}`));
  const quantity = parseInt(prompt(`Enter the quantity of shares for ${stockSymbol}`));

  if (!stockSymbol || isNaN(purchasePrice) || isNaN(quantity) || purchasePrice <= 0 || quantity <= 0) {
    alert('Please enter valid stock symbol, purchase price, and quantity');
    return;
  }

  // Store portfolio in chrome storage
  chrome.storage.local.get({ portfolio: [] }, (result) => {
    let currentPortfolio = result.portfolio || [];
    let stockExists = false;

    // Check if the stock already exists in the portfolio
    currentPortfolio = currentPortfolio.map(stock => {
      if (stock.stockSymbol === stockSymbol) {
        stockExists = true;

        // Calculate the new total quantity
        const newQuantity = stock.quantity + quantity;

        // Calculate the weighted average purchase price
        const newPurchasePrice = ((stock.purchasePrice * stock.quantity) + (purchasePrice * quantity)) / newQuantity;

        return {
          stockSymbol: stock.stockSymbol,
          purchasePrice: newPurchasePrice,
          quantity: newQuantity
        };
      }
      return stock;
    });

    // If the stock doesn't exist, add it to the portfolio
    if (!stockExists) {
      currentPortfolio.push({ stockSymbol, purchasePrice, quantity });
    }

    // Store the updated portfolio in chrome storage
    chrome.storage.local.set({ portfolio: currentPortfolio }, () => {
      alert(`${stockSymbol} has been added/updated in your portfolio`);
    });
  });
});

// Load portfolio content with total invested, current value, and P&L at the top
function loadPortfolio() {
  console.log("Loading portfolio..."); // Debug statement
  chrome.storage.local.get({ portfolio: [] }, async (result) => {
    const portfolioElement = document.getElementById('portfolio');
    const portfolioSummaryElement = document.getElementById('portfolio-summary');
    portfolioElement.innerHTML = '';
    portfolioSummaryElement.innerHTML = '';

    if (result.portfolio.length === 0) {
      console.log("No stocks in portfolio."); // Debug statement
      portfolioElement.innerHTML = '<p>No stocks in your portfolio.</p>';
      return;
    }

    let totalInvested = 0;
    let totalCurrentValue = 0;

    for (const stock of result.portfolio) {
      const { stockSymbol, purchasePrice, quantity } = stock;

      // Skip undefined or invalid stock symbols
      if (!stockSymbol || typeof stockSymbol !== 'string') {
        console.log("Skipping invalid stock symbol:", stock);
        continue;
      }

      try {
        const response = await fetch(`${baseUrl}${stockSymbol}&token=${apiKey}`);
        if (!response.ok) throw new Error('API call failed');
        const data = await response.json();

        if (data && data.c) {
          const currentPrice = data.c;
          const investedValue = purchasePrice * quantity;
          const currentValue = currentPrice * quantity;

          totalInvested += investedValue;
          totalCurrentValue += currentValue;

          const stockElement = document.createElement('div');
          stockElement.classList.add('portfolio-item');

          const stockInfo = document.createElement('div');
          stockInfo.classList.add('stock-info');
          stockInfo.innerHTML = `
            <span class="stock-symbol">${stockSymbol}</span><br>
            <span>Invested: $${investedValue}</span><br>
            <span>LTP: $${data.c.toFixed(2)}</span>
          `;

          // Reuse the remove button creation logic
          const removeButton = createRemoveButton(stockSymbol, removeStockFromPortfolio);

          stockElement.appendChild(stockInfo);
          stockElement.appendChild(removeButton); // Add remove button to the portfolio item

          portfolioElement.appendChild(stockElement);
        } else {
          console.log(`No data available for symbol: ${stockSymbol}`); // Debug statement
          portfolioElement.innerHTML += `<p>No data available for symbol: ${stockSymbol}</p>`;
        }
      } catch (error) {
        console.error(`Error fetching data for ${stockSymbol}:`, error);
        portfolioElement.innerHTML += `<p>Error fetching data for ${stockSymbol}</p>`;
      }
    }

    // Calculate the total P&L
    const totalPnl = totalCurrentValue - totalInvested;
    const pnlClass = totalPnl >= 0 ? 'portfolio-gain' : 'portfolio-loss';
    const changeIcon = totalPnl >= 0 ? '<i class="fas fa-arrow-up"></i>' : '<i class "fas fa-arrow-down"></i>';

    // Display the portfolio summary
    portfolioSummaryElement.innerHTML = `
      <div class="portfolio-summary">
        <span>Invested: $${totalInvested.toFixed(2)}</span>
        <span>Current: $${totalCurrentValue.toFixed(2)}</span>
        <p>P&L: <span class="${pnlClass}">$${totalPnl.toFixed(2)} ${changeIcon}</span></p>
      </div>
    `;
  });
}


// Function to remove stock from the portfolio
function removeStockFromPortfolio(stockSymbol) {
  chrome.storage.local.get({ portfolio: [] }, (result) => {
    const updatedPortfolio = result.portfolio.filter(item => item.stockSymbol !== stockSymbol);
    chrome.storage.local.set({ portfolio: updatedPortfolio }, () => {
      loadPortfolio(); // Reload the portfolio after removal
      alert(`${stockSymbol} has been removed from your portfolio.`);
    });
  });
}

// Load portfolio on Portfolio tab activation
document.getElementById('portfolio-tab').addEventListener('click', loadPortfolio);

// Navigation tabs functionality
document.getElementById('home-tab').addEventListener('click', () => switchTab('home-content'));
document.getElementById('portfolio-tab').addEventListener('click', () => switchTab('portfolio-content'));
document.getElementById('watchlist-tab').addEventListener('click', () => switchTab('watchlist-content'));
document.getElementById('trade-tab').addEventListener('click', () => switchTab('trade-content'));

function switchTab(tabId) {
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');

  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => item.classList.remove('active'));
  document.getElementById(`${tabId}-tab`).classList.add('active');
}

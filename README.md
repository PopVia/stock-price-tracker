# Stock Price Tracker

## Prompts used for MVP

Help me make a chrome browser plugin that displays current up-to-date stock prices.

Allow users to search for stock symbols via company name.

Allow users to add stock symbols.

We are using this finnhub API https://finnhub.io/docs/api/quote

our fetch request will look like:
fetch(`https://finnhub.io/api/v1/quote?symbol=${stock}&token=cqca2cpr01qmbcu94ht0cqca2cpr01qmbcu94htg`)

Incoming JSON

{"c":14.48,"d":0.09,"dp":0.6254,"h":14.63,"l":14.28,"o":14.29,"pc":14.39,"t":1721246402}

For each row display the symbol, current price ("c") and price change ("d").

Add the option to remove tracked stocks from the list.

## Resources

https://finnhub.io/docs/api/quote

fetch(`https://finnhub.io/api/v1/quote?symbol=${stock}&token=cqca2cpr01qmbcu94ht0cqca2cpr01qmbcu94htg`)

Sample response
{
  "c": 261.74,
  "h": 263.31,
  "l": 260.68,
  "o": 261.07,
  "pc": 259.45,
  "t": 1582641000
}

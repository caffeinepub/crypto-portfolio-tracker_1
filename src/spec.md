# Crypto Portfolio Tracker

## Overview
A crypto portfolio tracker application that allows users to manually input their cryptocurrency holdings and staking rewards, visualize their portfolio performance through interactive charts, and track their investments over various time periods. All monetary values are displayed in British Pounds (GBP).

## Core Features

### Portfolio Management
- Users can manually add cryptocurrency holdings by specifying:
  - Cryptocurrency name/symbol with autocomplete dropdown functionality
  - Amount held
  - Amount invested (in GBP)
- Users can record staking rewards with amount and date
- Users can edit or remove existing holdings and rewards
- Users can increment existing holdings by adding additional units purchased, which automatically recalculates total current value and amount invested
- All portfolio data is persisted in the backend

### Cryptocurrency Symbol Autocomplete
- Autocomplete dropdown in the AddHoldingDialog component for cryptocurrency symbol input
- Predefined list of popular cryptocurrencies including BTC, ETH, ADA, SOL, DOT, AVAX, MATIC, XRP, SUI, ONYX, XTZ, BONK, AMP, and others
- Real-time filtering of suggestions based on user input
- Click or keyboard selection to automatically fill the symbol field
- Accessible keyboard navigation (arrow keys, enter, escape)
- Seamless integration with existing theme and form design
- Clear, readable suggestion display

### Holdings Management Interface
- Display holdings with "Amount Invested (£)" instead of "Cost Basis"
- Each holding row includes a "+" button to increment the amount purchased
- Increment functionality allows users to add additional units to existing holdings
- Automatic recalculation of total current value and amount invested when holdings are incremented
- All input and output formatting aligned with GBP currency display

### Dashboard
- Display total portfolio value in GBP (£)
- Show overall gain/loss in GBP (absolute and percentage)
- Calculate and display percentage change over selected time periods
- Summary cards showing key portfolio metrics in GBP
- Metrics reflect updated invested amounts and added holdings values

### Interactive Charts
- Line chart showing portfolio value evolution over time in GBP
- Visual representation of portfolio performance trends
- Charts update based on selected time range filters and reflect incremented holdings
- All chart labels and tooltips display values in GBP

### Time Range Filters
- 1 day view
- 1 week view  
- 1 month view
- 6 months view
- 1 year view
- All time view
- Charts and metrics adjust dynamically based on selected time range

### Data Integration
- Fetch real-time cryptocurrency prices from Revolut X Exchange APIs or CoinGecko in GBP
- Extended symbol-to-ID mappings to support all cryptocurrencies including Sui, Onyxcoin, Tezos, Bonk, AMP, and others
- Calculate current portfolio values using live market data in GBP
- Historical price data for performance calculations over different time periods in GBP
- Handle rate limits and missing data gracefully when fetching price data
- Ensure accurate price display for all supported cryptocurrencies

## Backend Requirements
- Store user portfolio holdings (cryptocurrency, amount, amount invested in GBP)
- Store staking rewards records (amount, date, cryptocurrency)
- Support incrementing existing holdings with additional units purchased
- Provide endpoints to retrieve, add, update, delete, and increment portfolio entries
- Calculate portfolio metrics and historical performance data in GBP
- Integrate with cryptocurrency price APIs for current and historical pricing in GBP
- Convert and provide all monetary values in GBP currency
- Handle extended cryptocurrency symbol mappings for price fetching

## UI Requirements
- Clean, responsive design that works on desktop and mobile
- Intuitive forms for adding/editing holdings and staking rewards with GBP currency formatting
- "Amount Invested (£)" labeling instead of "Cost Basis" across all components
- "+" button functionality for incrementing holdings with automatic recalculation
- Autocomplete dropdown component with smooth animations and hover states
- Clear data visualization with interactive charts displaying GBP values
- Easy-to-use time range selector
- Dashboard layout with organized sections for metrics and charts
- All price displays formatted with £ symbol and GBP currency formatting
- Consistent GBP currency representation across all components and tables
- Keyboard accessibility for all interactive elements including autocomplete
- Application content displayed in English language

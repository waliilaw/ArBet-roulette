# Pixelated Roulette Game with Arweave AO Integration

A pixelated roulette game built with Next.js and Arweave AO integration, allowing users to place bets using the Arweave blockchain.

## Features

- Pixelated UI design for a retro gaming experience
- Fully functional roulette wheel with betting options
- Arweave AO integration for verifiable randomness and on-chain transactions
- Connect with Wander wallet for Arweave integration
- Place different types of bets (straight, red/black, odd/even, etc.)
- Sound effects for an immersive experience
- Responsive design that works on desktop and mobile

## Prerequisites

Before running this project, you need to have the following:

- Node.js (v16 or higher)
- NPM or Yarn package manager
- Wander wallet extension installed in your browser

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/roulette-game.git
cd roulette
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up your environment variables:

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_ROULETTE_CONTRACT_ID=your-contract-id
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to play the game.

## Deployment

### Deploying the Smart Contract

To deploy the Arweave AO process:

```bash
npm run deploy:ao
# or
yarn deploy:ao
```

### Deploying the Web App

Build and deploy the Next.js application:

```bash
npm run build
npm run start
# or
yarn build
yarn start
```

## How to Play

1. Connect your Wander wallet
2. Enter a bet amount in AR
3. Select a bet type (straight number, red/black, odd/even, etc.)
4. Click "ADD BET" to add your bet to the list
5. Click "SPIN" to start the roulette wheel
6. Wait for the result and see if you won!

## Tech Stack

- Next.js - React framework
- TypeScript - Static typing
- Tailwind CSS - Styling
- Arweave - Blockchain storage
- AO - Arweave's computation layer
- React Custom Roulette - Wheel component

## License

This project is licensed under the MIT License.

## Credits

- Sound effects from [OpenGameArt](https://opengameart.org)
- Pixel art styling inspired by classic arcade games 
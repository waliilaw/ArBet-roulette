"use client"

import { useState, useEffect, useCallback } from "react"
import { Wheel } from 'react-custom-roulette'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useArweaveWallet } from "@/hooks/use-arweave-wallet"
import { WalletDisplay } from "@/components/wallet-display"
import { WalletNotFound } from "@/components/wallet-not-found"
import { SoundToggle, useSoundEffects } from "@/components/sound-toggle"
import { generateRouletteResult } from "@/lib/ao-randomness"
import { placeBet, claimWinnings, fetchArweaveBalance } from "@/lib/arweave-integration"
import { ROULETTE_NUMBERS, getNumberColor, formatArAmount, calculateBetPayout } from "@/lib/utils"

// Game states
type GameState = "idle" | "spinning" | "won" | "lost"

// Bet types
type BetType = "straight" | "split" | "street" | "corner" | "sixline" | "dozen" | "column" | "red" | "black" | "even" | "odd" | "high" | "low"

// Bet interface
interface Bet {
  type: BetType;
  value: number | string;
  amount: number;
}

// Configure roulette wheel data
const wheelData = ROULETTE_NUMBERS.map(number => ({
  option: number.toString(),
  style: {
    backgroundColor: getNumberColor(number) === 'red' ? '#E81416' : 
                      getNumberColor(number) === 'black' ? '#1A1A1A' : '#33A333',
    textColor: '#ffffff',
  }
}))

export default function RouletteGame() {
  // Game state
  const [gameState, setGameState] = useState<GameState>("idle")
  const [betAmount, setBetAmount] = useState("")
  const [currentBetType, setCurrentBetType] = useState<BetType>("straight")
  const [currentBetValue, setCurrentBetValue] = useState<number | string>(0)
  const [bets, setBets] = useState<Bet[]>([])
  const [mustSpin, setMustSpin] = useState(false)
  const [spinResult, setSpinResult] = useState(0)
  const [prizeNumber, setPrizeNumber] = useState(0)
  const [winAmount, setWinAmount] = useState(0)
  const [currentGameId, setCurrentGameId] = useState<string>("")
  const [transactionLoading, setTransactionLoading] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Sound effects
  const { playSpinSound, playWinSound, playLoseSound, playBetSound } = useSoundEffects(soundEnabled)

  // Arweave wallet integration
  const { 
    connected, 
    address, 
    balance, 
    isConnecting, 
    isWalletInstalled,
    isBraveBrowser,
    walletError,
    connect,
    disconnect
  } = useArweaveWallet()

  // Calculate total bet amount
  const totalBetAmount = bets.reduce((acc, bet) => acc + bet.amount, 0)

  // Handle wallet connection
  const handleConnectWallet = useCallback(async () => {
    if (isConnecting) return;
    try {
      await connect();
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }, [connect, isConnecting])

  // Reset game to initial state
  const resetGame = useCallback(() => {
    setGameState("idle")
    setBets([])
    setMustSpin(false)
    setSpinResult(0)
    setPrizeNumber(0)
    setWinAmount(0)
    setCurrentGameId("")
  }, [])

  // Add bet
  const addBet = useCallback(() => {
    if (!betAmount || parseFloat(betAmount) <= 0) return;
    
    // Play bet sound
    playBetSound();
    
    const amount = parseFloat(betAmount);
    
    // Add bet to list
    setBets(prevBets => [
      ...prevBets, 
      { 
        type: currentBetType, 
        value: currentBetValue,
        amount
      }
    ]);
    
    // Reset bet amount
    setBetAmount("");
  }, [betAmount, currentBetType, currentBetValue, playBetSound]);

  // Remove bet
  const removeBet = useCallback((index: number) => {
    setBets(prevBets => prevBets.filter((_, i) => i !== index));
  }, []);

  // Start spin
  const startSpin = useCallback(async () => {
    if (gameState === "spinning" || bets.length === 0) return;
    
    if (!connected) {
      handleConnectWallet();
      return;
    }
    
    try {
      setTransactionLoading(true);
      
      // Get total bet amount
      const totalAmount = bets.reduce((acc, bet) => acc + bet.amount, 0);
      
      // Check if user has enough balance
      if (parseFloat(balance) < totalAmount) {
        alert(`Insufficient balance: ${balance} AR. You need ${totalAmount.toFixed(4)} AR to place this bet.`);
        setTransactionLoading(false);
        return;
      }
      
      // Place bet on Arweave
      const { gameId } = await placeBet(
        totalAmount.toString(),
        "multiple",
        JSON.stringify(bets)
      );
      
      setCurrentGameId(gameId);
      setGameState("spinning");
      
      // Generate result from AO
      const result = await generateRouletteResult();
      
      // Find index in the wheel data
      const resultIndex = ROULETTE_NUMBERS.findIndex(num => num === result);
      
      // Set prize number and result
      setPrizeNumber(resultIndex);
      setSpinResult(result);
      
      // Play spin sound
      playSpinSound();
      
      // Start spinning the wheel
      setMustSpin(true);
      
      setTransactionLoading(false);
      
    } catch (error) {
      console.error("Error starting spin:", error);
      setTransactionLoading(false);
      setGameState("idle");
    }
  }, [gameState, bets, connected, handleConnectWallet, balance, playSpinSound]);

  // Handle spin stop
  const handleSpinStop = useCallback(async () => {
    setMustSpin(false);
    
    // Calculate if user won
    let totalWin = 0;
    let won = false;
    
    // Check each bet against the result
    bets.forEach(bet => {
      let betWon = false;
      
      switch(bet.type) {
        case "straight":
          betWon = spinResult === Number(bet.value);
          break;
        case "red":
          betWon = getNumberColor(spinResult) === "red";
          break;
        case "black":
          betWon = getNumberColor(spinResult) === "black";
          break;
        case "even":
          betWon = spinResult !== 0 && spinResult % 2 === 0;
          break;
        case "odd":
          betWon = spinResult !== 0 && spinResult % 2 === 1;
          break;
        case "high":
          betWon = spinResult >= 19 && spinResult <= 36;
          break;
        case "low":
          betWon = spinResult >= 1 && spinResult <= 18;
          break;
        // Add more bet types as needed
      }
      
      if (betWon) {
        const payout = calculateBetPayout(bet.amount, bet.type);
        totalWin += payout + bet.amount; // Payout plus original bet
        won = true;
      }
    });
    
    // Set game state based on win/loss
    if (won) {
      setGameState("won");
      setWinAmount(totalWin);
      playWinSound();
      
      try {
        if (currentGameId) {
          // Claim winnings on Arweave
          await claimWinnings(
            currentGameId,
            totalWin.toString(),
            spinResult
          );
          
          // Update balance
          if (address) {
            await fetchArweaveBalance(address);
          }
        }
      } catch (error) {
        console.error("Error claiming winnings:", error);
      }
    } else {
      setGameState("lost");
      playLoseSound();
    }
  }, [spinResult, bets, playWinSound, playLoseSound, currentGameId, address]);

  // Render bet options
  const renderBetOptions = () => {
    return (
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button 
          className={`pixel-button ${currentBetType === 'red' ? 'bg-roulette-red' : 'bg-gray-800'}`}
          onClick={() => setCurrentBetType('red')}
        >
          RED
        </Button>
        <Button 
          className={`pixel-button ${currentBetType === 'black' ? 'bg-roulette-black' : 'bg-gray-800'}`}
          onClick={() => setCurrentBetType('black')}
        >
          BLACK
        </Button>
        <Button 
          className={`pixel-button ${currentBetType === 'even' ? 'bg-blue-700' : 'bg-gray-800'}`}
          onClick={() => setCurrentBetType('even')}
        >
          EVEN
        </Button>
        <Button 
          className={`pixel-button ${currentBetType === 'odd' ? 'bg-blue-700' : 'bg-gray-800'}`}
          onClick={() => setCurrentBetType('odd')}
        >
          ODD
        </Button>
        <Button 
          className={`pixel-button ${currentBetType === 'low' ? 'bg-purple-700' : 'bg-gray-800'}`}
          onClick={() => setCurrentBetType('low')}
        >
          1-18
        </Button>
        <Button 
          className={`pixel-button ${currentBetType === 'high' ? 'bg-purple-700' : 'bg-gray-800'}`}
          onClick={() => setCurrentBetType('high')}
        >
          19-36
        </Button>
        <Button 
          className={`pixel-button ${currentBetType === 'straight' ? 'bg-green-700' : 'bg-gray-800'} col-span-2`}
          onClick={() => setCurrentBetType('straight')}
        >
          STRAIGHT (NUMBER)
        </Button>
        {currentBetType === 'straight' && (
          <div className="col-span-2 my-2">
            <Input
              type="number"
              min="0"
              max="36"
              value={currentBetValue.toString()}
              onChange={(e) => setCurrentBetValue(parseInt(e.target.value) || 0)}
              className="pixel-input"
              placeholder="Enter number (0-36)"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl w-full mx-auto flex flex-col items-center">
      {/* Wallet Section */}
      <div className="w-full mb-6">
        {!isWalletInstalled ? (
          <WalletNotFound onConnectClick={handleConnectWallet} isBrave={isBraveBrowser} />
        ) : connected ? (
          <WalletDisplay address={address} balance={balance} disconnect={disconnect} />
        ) : (
          <div className="pixel-panel p-4 bg-gray-900 mb-4 text-center">
            <Button 
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="w-full p-3 bg-blue-700 hover:bg-blue-600 text-white font-pixel pixel-button"
            >
              {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Roulette Wheel Section */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <Wheel
              mustStartSpinning={mustSpin}
              prizeNumber={prizeNumber}
              data={wheelData}
              backgroundColors={['#3e3e3e', '#df3428']}
              textColors={['#ffffff']}
              outerBorderColor="#f9d71c"
              outerBorderWidth={5}
              innerBorderColor="#f9d71c"
              innerBorderWidth={15}
              innerRadius={0}
              perpendicularText={false}
              textDistance={85}
              onStopSpinning={handleSpinStop}
              radiusLineColor="#dddddd"
              radiusLineWidth={1}
            />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              {gameState === "spinning" ? (
                <div className="text-xl text-white font-pixel animate-pulse">
                  SPINNING...
                </div>
              ) : gameState === "won" ? (
                <div className="text-xl text-green-400 font-pixel">
                  YOU WON<br/>{formatArAmount(winAmount)} AR
                </div>
              ) : gameState === "lost" ? (
                <div className="text-xl text-red-400 font-pixel">
                  YOU LOST
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              className="mr-4 bg-green-700 hover:bg-green-600 pixel-button"
              onClick={startSpin}
              disabled={gameState === "spinning" || bets.length === 0 || transactionLoading}
            >
              {transactionLoading ? "PROCESSING..." : "SPIN"}
            </Button>
            <Button
              className="bg-blue-700 hover:bg-blue-600 pixel-button"
              onClick={resetGame}
              disabled={gameState === "spinning" || transactionLoading}
            >
              NEW GAME
            </Button>
            <div className="ml-4">
              <SoundToggle enabled={soundEnabled} onToggle={setSoundEnabled} />
            </div>
          </div>
          
          {/* Result Display */}
          {spinResult > 0 && gameState !== "spinning" && (
            <div className="mt-4 pixel-panel p-2 bg-gray-900 text-center">
              <span className="font-pixel text-yellow-400">RESULT: </span>
              <span 
                className={`font-pixel font-bold ${
                  getNumberColor(spinResult) === 'red' ? 'text-red-500' :
                  getNumberColor(spinResult) === 'black' ? 'text-white' : 'text-green-500'
                }`}
              >
                {spinResult} - {getNumberColor(spinResult).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {/* Betting Panel */}
        <div className="pixel-panel p-4 bg-gray-900">
          <h2 className="text-2xl font-pixel text-yellow-400 mb-6 text-center">PLACE YOUR BETS</h2>
          
          {/* Bet Amount Input */}
          <div className="mb-6">
            <Label htmlFor="betAmount" className="font-pixel text-white mb-2 block">BET AMOUNT (AR)</Label>
            <div className="flex">
              <Input
                id="betAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="pixel-input flex-1 mr-2"
                placeholder="Enter bet amount"
                disabled={gameState === "spinning"}
              />
              <Button
                onClick={addBet}
                disabled={!betAmount || parseFloat(betAmount) <= 0 || gameState === "spinning"}
                className="bg-green-700 hover:bg-green-600 pixel-button"
              >
                ADD BET
              </Button>
            </div>
          </div>
          
          {/* Bet Type Selection */}
          {renderBetOptions()}
          
          {/* Bets List */}
          <div className="mt-4">
            <h3 className="font-pixel text-white mb-2">YOUR BETS:</h3>
            <div className="max-h-48 overflow-y-auto bg-gray-800 border-2 border-gray-700 p-2">
              {bets.length === 0 ? (
                <p className="text-gray-400 font-pixel text-xs text-center p-2">No bets placed</p>
              ) : (
                <ul className="space-y-2">
                  {bets.map((bet, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                      <div className="font-pixel text-xs">
                        <span className="text-yellow-400">{bet.type.toUpperCase()}: </span>
                        <span className="text-white">
                          {bet.type === 'straight' ? `Number ${bet.value}` : 
                           bet.type === 'red' ? 'Red' :
                           bet.type === 'black' ? 'Black' :
                           bet.type === 'even' ? 'Even' :
                           bet.type === 'odd' ? 'Odd' :
                           bet.type === 'high' ? '19-36' :
                           bet.type === 'low' ? '1-18' : bet.value}
                        </span>
                        <span className="text-green-400 ml-2">{formatArAmount(bet.amount)} AR</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => removeBet(index)}
                        disabled={gameState === "spinning"}
                        className="bg-red-700 hover:bg-red-600 text-xs h-6 w-6 p-0"
                      >
                        X
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Total Bet Amount */}
            <div className="mt-4 bg-gray-800 border-2 border-gray-700 p-2 rounded flex justify-between items-center">
              <span className="font-pixel text-yellow-400">TOTAL BET:</span>
              <span className="font-pixel text-white">{formatArAmount(totalBetAmount)} AR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
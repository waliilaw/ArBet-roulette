-- Roulette Game Smart Contract for Arweave AO

-- Initialize the state if needed
if not Handlers.initState then
  Handlers.initState = function(state)
    return {
      games = {},
      wallets = {},
      houseEdge = 0.03,  -- 3% house edge
      contractBalance = 0,
      minBet = 0.01,     -- Minimum bet in AR
      maxBet = 10,       -- Maximum bet in AR
      version = "1.0.0"
    }
  end
end

-- Generate a random roulette result (0-36)
function generateRandomNumber()
  -- In a real contract, this would use AO's verifiable randomness
  -- For demo, we're using Lua's math.random with a timestamp seed
  math.randomseed(os.time())
  return math.random(0, 36)
end

-- Handle bet placement
Handlers.placeBet = function(state, action)
  local from = action.From
  local amount = tonumber(action.amount) or 0
  local betType = action.betType
  local betValue = action.betValue
  local timestamp = action.timestamp or os.time()
  local gameId = ao.id .. "-" .. from .. "-" .. timestamp
  
  -- Validate the bet
  if amount < state.minBet then
    return { result = "error", message = "Bet below minimum amount" }
  end
  
  if amount > state.maxBet then
    return { result = "error", message = "Bet above maximum amount" }
  end
  
  -- Generate the result
  local result = generateRandomNumber()
  
  -- Store the game
  state.games[gameId] = {
    player = from,
    amount = amount,
    betType = betType,
    betValue = betValue,
    result = result,
    timestamp = timestamp,
    status = "played"
  }
  
  -- Initialize player wallet if needed
  if not state.wallets[from] then
    state.wallets[from] = { balance = 0, bets = 0, wins = 0 }
  end
  
  -- Update player stats
  state.wallets[from].bets = state.wallets[from].bets + 1
  
  -- Add to contract balance
  state.contractBalance = state.contractBalance + amount
  
  -- Return the game result to be processed client-side
  return {
    result = "success",
    gameId = gameId,
    playerAddress = from,
    betAmount = amount,
    rouletteResult = result
  }
end

-- Handle claiming winnings
Handlers.claimWinnings = function(state, action)
  local from = action.From
  local gameId = action.gameId
  local result = tonumber(action.result)
  local claimAmount = tonumber(action.amount) or 0
  
  -- Validate the claim
  if not state.games[gameId] then
    return { result = "error", message = "Game not found" }
  end
  
  local game = state.games[gameId]
  
  if game.player ~= from then
    return { result = "error", message = "Not the player of this game" }
  end
  
  if game.status ~= "played" then
    return { result = "error", message = "Game already processed" }
  end
  
  if game.result ~= result then
    return { result = "error", message = "Result mismatch" }
  end
  
  -- Mark the game as claimed
  state.games[gameId].status = "claimed"
  
  -- Update player stats
  state.wallets[from].wins = state.wallets[from].wins + 1
  state.wallets[from].balance = state.wallets[from].balance + claimAmount
  
  -- Deduct from contract balance
  state.contractBalance = state.contractBalance - claimAmount
  
  -- Return success
  return {
    result = "success",
    gameId = gameId,
    playerAddress = from,
    winAmount = claimAmount
  }
end

-- Get game details
Handlers.getGame = function(state, action)
  local gameId = action.gameId
  
  if not state.games[gameId] then
    return { result = "error", message = "Game not found" }
  end
  
  return { 
    result = "success",
    game = state.games[gameId]
  }
end

-- Get player stats
Handlers.getPlayerStats = function(state, action)
  local address = action.address
  
  if not state.wallets[address] then
    return { 
      result = "success",
      stats = { balance = 0, bets = 0, wins = 0 }
    }
  end
  
  return { 
    result = "success",
    stats = state.wallets[address]
  }
end 
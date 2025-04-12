-- Roulette Game Smart Contract for Arweave AO

-- Initialize state if needed
if not Handlers.utils then
  Handlers.utils = {}
end

if not Handlers.games then
  Handlers.games = {}
end

-- Utils functions
Handlers.utils.hash = function(data)
  return ao.sha256(data)
end

Handlers.utils.generateSeed = function()
  local timestamp = os.time()
  local nonce = math.random(1, 10000000)
  local processId = ao.id
  local blockHeight = ao.block.height
  local seedStr = tostring(timestamp) .. tostring(nonce) .. processId .. tostring(blockHeight)
  return Handlers.utils.hash(seedStr)
end

-- Generate a random roulette number (0-36)
Handlers.utils.generateRandomRouletteNumber = function(seed)
  local seed = seed or Handlers.utils.generateSeed()
  local hashInput = seed
  local hash = Handlers.utils.hash(hashInput)
  
  -- Convert first 4 bytes of hash to a number
  local num = 0
  for i = 1, 4 do
    num = num * 256 + string.byte(hash, i, i)
  end
  
  -- Get a number between 0 and 36
  return num % 37
end

-- Handler for GetRandomness action
Handlers.getRandomness = function(msg)
  if msg.Tags.Action ~= "GetRandomness" then return end
  
  -- Generate a seed based on current block and message info
  local seed = Handlers.utils.generateSeed()
  
  -- Generate random roulette number
  local rouletteNumber = Handlers.utils.generateRandomRouletteNumber(seed)
  
  -- Store the game result in state for verification
  local gameId = msg.Tags.GameId or tostring(os.time()) .. "_" .. tostring(math.random(1000000))
  
  Handlers.games[gameId] = {
    number = rouletteNumber,
    timestamp = os.time(),
    from = msg.From
  }
  
  -- Send the number back to the sender
  ao.send({
    Target = msg.From,
    Data = json.encode({
      success = true,
      gameId = gameId,
      number = rouletteNumber
    })
  })
end

-- Handler for verifying game results
Handlers.verifyGameResult = function(msg)
  if msg.Tags.Action ~= "VerifyGameResult" then return end
  
  local gameId = msg.Tags.GameId
  
  -- Check if we have the game in state
  if not Handlers.games[gameId] then
    return ao.send({
      Target = msg.From,
      Data = json.encode({
        success = false,
        error = "Game not found"
      })
    })
  end
  
  local game = Handlers.games[gameId]
  
  -- Parse the message data to get the result to verify
  local data = json.decode(msg.Data)
  local resultToVerify = data.result
  
  -- Check if the result matches the stored number
  local isValid = (resultToVerify == game.number)
  
  -- Send verification result
  ao.send({
    Target = msg.From,
    Data = json.encode({
      success = true,
      gameId = gameId,
      isValid = isValid
    })
  })
end

-- Register message handlers
Handlers.add("getRandomness", Handlers.getRandomness)
Handlers.add("verifyGameResult", Handlers.verifyGameResult)

-- Process initialization message
function handle(msg)
  -- Log the incoming message
  ao.log("Received message: " .. json.encode(msg))
  
  -- Handle different message types
  if msg.Tags.Action == "GetRandomness" then
    Handlers.getRandomness(msg)
  elseif msg.Tags.Action == "VerifyGameResult" then
    Handlers.verifyGameResult(msg)
  else
    -- Unknown action
    ao.send({
      Target = msg.From,
      Data = json.encode({
        success = false,
        error = "Unknown action"
      })
    })
  end
end 
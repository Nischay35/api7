const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
app.use(express.json())
let db = null
const PlayerdbObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}
const MatchdbObjectToResponseObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}
const StatisticsToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    totalScore: dbObject.totalScore,
    totalFours: dbObject.totalFours,
    totalSixes: dbObject.totalSixes,
  }
}
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at 3000')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
  }
}
initializeDBAndServer()
app.get('/players/', async (request, response) => {
  const getQuery = `select * from player_details order by player_id;`
  const players = await db.all(getQuery)
  response.send(
    players.map(eachPlayer => PlayerdbObjectToResponseObject(eachPlayer)),
  )
})
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getQuery = `select * from player_details where player_id=${playerId};`
  const player = await db.get(getQuery)
  response.send(PlayerdbObjectToResponseObject(player))
})
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const getQuery = `update player_details set player_name='${playerName}' where player_id=${playerId};`
  await db.run(getQuery)
  response.send('Player Details Updated')
})
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getQuery = `select * from match_details where match_id=${matchId};`
  const match = await db.get(getQuery)
  response.send(MatchdbObjectToResponseObject(match))
})
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getQuery = `select * from match_details natural join player_match_score where player_match_score.player_id=${playerId};`
  const matches = await db.all(getQuery)
  response.send(
    matches.map(eachMatch => MatchdbObjectToResponseObject(eachMatch)),
  )
})
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getQuery = `select * from player_details natural join player_match_score where player_match_score.match_id=${matchId};`
  const players = await db.all(getQuery)
  response.send(
    players.map(eachPlayer => PlayerdbObjectToResponseObject(eachPlayer)),
  )
})
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getQuery = `select player_id,player_name,sum(score) as totalScore,sum(fours) as totalFours,sum(sixes) as totalSixes from player_match_score inner join player_details on player_match_score.player_id=player_details.player_id where player_match_score.player_id=${playerId};`
  const statistics = await db.get(getQuery)
  response.send(StatisticsToResponseObject(statistics))
})
module.exports = app

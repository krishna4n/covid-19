const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;

const initiateDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error ${e.message}`);
    process.exit(1);
  }
};

initiateDBAndServer();

app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state`;
  const statesObject = await db.all(getStatesQuery);
  const statesList = statesObject.map((obj) => {
    return {
      stateId: obj.state_id,
      stateName: obj.state_name,
      population: obj.population,
    };
  });
  response.send(statesList);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId}`;
  const stateRecord = await db.get(getStateQuery);
  const stateObject = {
    stateId: stateRecord.state_id,
    stateName: stateRecord.state_name,
    population: stateRecord.population,
  };
  response.send(stateObject);
});

app.post("/districts/", async (request, response) => {
  const districtBody = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = districtBody;
  const postDistrictQuery = `INSERT INTO district 
  (district_name,state_id,cases,cured,active,deaths) 
  values('${districtName}',${stateId},${cases},${cured},${cured},${deaths})`;
  await db.run(postDistrictQuery);

  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district 
  WHERE district_id = ${districtId} order by district_id asc`;
  const districtRecord = await db.get(getDistrictQuery);
  const districtObject = {
    districtId: districtRecord.district_id,
    districtName: districtRecord.district_name,
    stateId: districtRecord.state_id,
    cases: districtRecord.cases,
    cured: districtRecord.cured,
    active: districtRecord.active,
    deaths: districtRecord.deaths,
  };
  response.send(districtObject);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `DELETE FROM district WHERE district_id = ${districtId}`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtBody = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = districtBody;
  const updateQuery = `UPDATE district set
     district_name = '${districtName}',
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths} where district_id = ${districtId}`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateCountQuery = `select sum(cases) as totalCases,sum(cured) as totalCured,sum(active) as totalActive,sum(deaths) as totalDeaths from district
   where state_id= ${stateId} group by state_id`;
  const stateCount = await db.get(getStateCountQuery);

  response.send(stateCount);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `select state_name from state join district on state.state_id = district.state_id where district.district_id=${districtId}`;
  const stateName = await db.get(getStateNameQuery);
  const stateNameObject = {
    stateName: stateName.state_name,
  };
  response.send(stateNameObject);
});

module.exports = app;

const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running successfully at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB ERROR ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDBObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDBObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertTotalDbObjectToResponseObject = (eachCase) => {
  return {
    totalCases: eachCase.total_cases,
    totalCured: eachCase.total_cured,
    totalActive: eachCase.total_active,
    totalDeaths: eachCase.total_deaths,
  };
};

//api 1

app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state ORDER BY state_id;`;

  const stateArray = await db.all(getStatesQuery);
  response.send(
    stateArray.map((eachState) => convertDBObjectToResponseObject(eachState))
  );
});

//api 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
      *
    FROM 
      state 
    WHERE 
      state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertDBObjectToResponseObject(state));
});

//api 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  INSERT INTO
    district ( district_name, state_id, cases,cured,active,deaths)
  VALUES
    ('${districtName}', ${stateId}, ${cases},${cured},${active},${deaths});`;

  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//api 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
      *
    FROM 
      district 
    WHERE 
      district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertDistrictDBObjectToResponseObject(district));
});

//api 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteDistrictQuery = `
  DELETE FROM district where district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//api 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  //   const updateDistrictQuery =
  const updateDistrictQuery = `
            UPDATE
              district
            SET
              district_name = '${districtName}',
              state_id = ${stateId},
              cases = ${cases},
              cured = ${cured},
              active = ${active},
              deaths = ${deaths}
            WHERE
              district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//api 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getStatisticsQuery = `
    SELECT SUM(cases) AS total_cases,
    SUM(cured) AS total_cured,
    SUM(active) AS total_active,
    SUM(deaths) AS total_deaths
    FROM district WHERE state_id = ${stateId};`;
  const statisticsArray = await db.get(getStatisticsQuery);
  response.send(convertTotalDbObjectToResponseObject(statisticsArray));
});

//api 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getDetailsQuery = `SELECT 
  state_name 
  FROM state
  INNER JOIN 
  district 
  ON 
  state.state_id = district.state_id 
  WHERE 
  district.district_id = ${districtId};`;

  const details = await db.get(getDetailsQuery);
  response.send(convertDBObjectToResponseObject(details));
});

module.exports = app;

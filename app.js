const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initilizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initilizeDbAndServer();

// GET API
const stateNamePascal = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStateQuery = `
    SELECT * FROM state
    ORDER BY state_id 
    `;
  const stateArray = await db.all(getStateQuery);
  response.send(stateArray.map((state) => stateNamePascal(state)));
});

// GET ID API

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateIdQuery = `
    SELECT * FROM state 
    WHERE
    state_id = ${stateId};
    `;
  const state = await db.get(getStateIdQuery);
  response.send(stateNamePascal(state));
});

// POST METHOD API

const convertDistrictDbToResponseDb = (dbObject) => {
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

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO 
    district (district_name,state_id,cases,cured,active,deaths)
    VALUES 
    (
     '${districtName}',
     '${stateId}',
     ${cases},
     ${cured} ,
     ${active},
     ${deaths}

    ) ;
    
    `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

// district id api

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    SELECT * FROM district 
    WHERE
    district_id = ${districtId};
    `;
  const district = await db.get(getDistrictIdQuery);
  response.send(convertDistrictDbToResponseDb(district));
});

// DELETE API

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    DELETE  FROM district 
    WHERE
    district_id = ${districtId};
    `;
  const district = await db.get(getDistrictIdQuery);
  response.send("District Removed");
});

// put id API

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtAddedQuery = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtAddedQuery;
  const updatedDetailsQuery = `
    UPDATE district 
    SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
     
    `;
  await db.run(updatedDetailsQuery);
  response.send("District Details Updated");
});

//STATE API TOTALCASES

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getDistrictQuery = `
    SELECT 
    SUM(cases) as  totalCases,
    SUM(cured) as totalCured ,
    SUM(active)  as totalActive,
    SUM(deaths)  as totalDeaths 

    FROM district 
    WHERE 
    state_id = ${stateId};
    
    `;
  const district = await db.get(getDistrictQuery);
  response.send(district);
});

//get district ids api

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
select state_id from district
where district_id = ${districtId};
  
    `;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `
select state_name as stateName from state
where state_id = ${getDistrictIdQueryResponse.state_id};`;

  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;

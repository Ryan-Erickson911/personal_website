// server.js
import express from "express";
import fetch from "node-fetch";

const app = express();

app.get("/api/epaairnow", async (req, res) => {
  const url = `https://aqs.epa.gov/data/api/dailyData/byBox?email=${process.env.epa_email}&key=${process.env.epa_key}&param=44201&bdate=20150501&edate=20150502&minlat=33.3&maxlat=33.6&minlon=-87.0&maxlon=-86.7`;

  const response = await fetch(url);
  const data = await response.json();
  res.json(data);
});

app.listen(3000);
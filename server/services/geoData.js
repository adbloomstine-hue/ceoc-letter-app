const fs = require('fs');
const path = require('path');

let assemblyData = null;
let senateData = null;

function loadGeoData() {
  assemblyData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/assembly.geojson'), 'utf8')
  );
  senateData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/senate.geojson'), 'utf8')
  );
  console.log(`Loaded ${assemblyData.features.length} assembly districts`);
  console.log(`Loaded ${senateData.features.length} senate districts`);
}

function getAssemblyData() { return assemblyData; }
function getSenateData() { return senateData; }

module.exports = { loadGeoData, getAssemblyData, getSenateData };

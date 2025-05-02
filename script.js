var allRows = "";


const date = new Date();
date.setDate(date.getDate() + 3)

let day = date.getDate().toString().padStart(2, '0');
let month = (date.getMonth() + 1).toString().padStart(2, '0');
let year = date.getFullYear();

const now = `${year}-${month}-${day}`;

date.setDate(date.getDate() + 7)

day = date.getDate().toString().padStart(2, '0');
month = (date.getMonth() + 1).toString().padStart(2, '0');
year = date.getFullYear();

const then = `${year}-${month}-${day}`;

window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("datum").setAttribute("min", now);
    document.getElementById("datum").setAttribute("max", then);
})







//      database stuff
let bestellungen = []
let toSave = []
function save() {
    if(document.getElementById("name").value == "" || document.getElementById("klasse").value == "" || document.getElementById("datum").value == "") return;

    toSave.push(document.getElementById("name").value);
    toSave.push(document.getElementById("klasse").value);

    for(let i = 0; i < (cloneCount + 1); i++) {
        const bestellungenX = document.getElementById("bestellungen" + i.toString());
        console.log(bestellungenX)

        if (bestellungenX.querySelector("#bestellung").value == "" || bestellungenX.querySelector("#bestellungsanzahl").value == "") return;

        bestellungen.push([bestellungenX.querySelector("#bestellung").value, bestellungenX.querySelector("#bestellungsanzahl").value]);
        //bestellungen.shift();
        console.log(bestellungen)
    }

    toSave.push(bestellungen);

    toSave.push(document.getElementById("datum").value);

    console.log("toSave: " + toSave);
    saveRowFromArray(toSave);

    toSave = [];
    bestellungen = [];
}


















// ❗❗❗ Hier deine Supabase-Daten einfügen ❗❗❗
const SUPABASE_URL   = 'https://fnwcphvzpsqvjwueaqcn.supabase.co';
const SUPABASE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZud2NwaHZ6cHNxdmp3dWVhcWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjc4NzUsImV4cCI6MjA2MTYwMzg3NX0.vM8LA9weK8B6RTJS3aym27dQphLeN4YqDElFDzNmUjM ';
const TABLE_NAME     = 'bestellungen';

// Definiere hier die Spalten-Reihenfolge
var COLUMNS = ['name','klasse','bestellung','datum'];

async function getAllRows2D() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&order=datum.asc`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      }
    }
  );

  if (!response.ok) {
    throw new Error('Fehler beim Laden der Daten');
  }

  const data = await response.json(); // Hole die Daten als Array von Objekten

  // Mapping der Objekte zu einem Array von Arrays basierend auf den Spalten
  return data.map(row =>
    COLUMNS.map(col => row[col]) // Hole die Daten für jede Spalte in der Reihenfolge von COLUMNS
  );
}

// Lösche alte Einträge, dann lade die aktuellen
(async () => {
  await deleteOlderThanOneDay();
  allRows = sortByDate(await getAllRows2D());
  console.log("allRows is ready.");
  console.log(allRows);
})();




// 2) Funktion: Ein einzelnes Zeilen-Array in die DB speichern
async function saveRowFromArray(rowArray) {
  if (rowArray.length !== COLUMNS.length) {
    throw new Error('Array-Länge passt nicht zu Spalten-Länge');
  }
  // Baue das Payload-Objekt
  const payload = {};
  COLUMNS.forEach((col, i) => {
    payload[col] = rowArray[i];
  });

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABLE_NAME}`,
    {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer':        'return=minimal'
      },
      body: JSON.stringify(payload)
    }
  );
  if (!res.ok) throw new Error(await res.text());
  if(!res.ok) console.log("Nö :/");
}




/**
 * Löscht alle Datensätze, bei denen das Datum mehr als 1 Tag alt ist.
 */
async function deleteOlderThanOneDay() {
  // 1 Tag in Millisekunden
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // Datum von vor 1 Tag im ISO-Format "YYYY-MM-DD"
  const dateThreshold = new Date(Date.now() - ONE_DAY)
    .toISOString()
    .split('T')[0];

  // DELETE-Request an Supabase: löscht alle Zeilen mit datum < dateThreshold
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?datum=lt.${dateThreshold}`,
    {
      method: 'DELETE',
      headers: {
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type':  'application/json'
      }
    }
  );

  if (!res.ok) {
    throw new Error('Fehler beim Löschen: ' + (await res.text()));
  }

  console.log(`Alle Einträge vor ${dateThreshold} wurden gelöscht.`);
}

function sortByDate(rows2D, columns) {
  // finde den Index der Datum-Spalte
  const dateIndex = COLUMNS.indexOf("datum");
  if (dateIndex === -1) {
    throw new Error("Spalte 'Datum' nicht gefunden in columns!");
  }

  // Kopie des Arrays, damit das Original nicht verändert wird
  return rows2D
    .slice()
    .sort((a, b) => {
      // new Date(...) übernimmt ISO-Strings wie "2025-04-30"
      const d1 = new Date(a[dateIndex]);
      const d2 = new Date(b[dateIndex]);
      return d1 - d2;
    });
}
var creds = require("./credentials.js");

var Airtable = require('airtable');
var base = new Airtable({ apiKey: creds.airtableToken }).base('app3LaHmFy2p9reo7');

var d = new Date();
const number = new Number(d.getFullYear().toString() + (d.getMonth() + 1).toString() + d.getDate().toString() + d.getHours().toString() + d.getMinutes().toString());

console.log(number);
base('Parcel Request').create([
    {
        "fields": {
            "Name": "дядя сеня",
            "Start date": new Date().toString('yyyy-MM-dd HH:mm:ss'),
            "Status": "Added",
            "FromName": "коня в пальто",
            "FromAddress": "123 Main St",
            "ParcelInfo": "Parcel info",
            "nobmer": number,
        }
    },

], function (err, records) {
    if (err) {
        console.error(err);
        return;
    }
    records.forEach(function (record) {
        console.log(record.getId());
    });
});

// Output

// recXUFubD9KkUNNon
// recXUFubD9KkUNNon
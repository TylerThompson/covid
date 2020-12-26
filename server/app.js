const express = require('express');
const request = require('request');
const fs = require('fs');
const csv = require('csv-parser');
const cors = require('cors');
const cron = require('node-cron');
//
const countryList = require('./country_list.json');
const PORT = process.env.PORT || 3000;

const db = 'covid-19';
const collection = 'covid_statistics';

const app = express();
app.use(cors());

const MongoClient = require('mongodb').MongoClient;
const url = `mongodb://localhost:27017/${db}`;

async function runScheduler() {
    console.log('Running Scheduler');
    let dateObj = new Date;
    let month = dateObj.getMonth() + 1;
    let day = dateObj.getDate() - 1;
    let year = dateObj.getFullYear();

    let month_name = ["JAN", "FEB", "MAR", "APR", "MAY", "JUNE", "JULY", "AUG", "SEP", "OCT", "NOV", "DEC"];
    let formattedMonth = month;

    if (month < 10) {
        month = "0" + month;
    }
    if (day < 10) {
        day = "0" + day;
    }
    newdate = month + "-" + day + "-" + year;
    let formatted_date = day + " " + month_name[formattedMonth - 1] + " " + year;
    let fileName = newdate + '.csv';
    const results = [];
    let data = [];
    let totalConfirmed = 0;
    let totalDeaths = 0;
    let totalRecovered = 0;

    const file = fs.createWriteStream(fileName);

    await new Promise((resolve, reject) => {
        request({ uri: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/' + fileName })
            .pipe(file)
            .on('finish', () => {
                fs.createReadStream(fileName)
                    .pipe(csv())
                    .on('data', (data) => results.push(data))
                    .on('end', () => {
                        if (results.length > 0) {
                            for (let i = 0; i < results.length; i++) {
                                totalConfirmed = parseInt(results[i].Confirmed) + totalConfirmed;
                                totalDeaths = parseInt(results[i].Deaths) + totalDeaths;
                                totalRecovered = parseInt(results[i].Recovered) + totalRecovered;
                            }

                            for (let j = 0; j < countryList.length; j++) {
                                let country_obj = JSON.parse(JSON.stringify(countryList[j]));
                                let state = getStatistics(country_obj, results);
                                data.push(state);
                            }

                            let items = {
                                total_confirmed: totalConfirmed,
                                total_deaths: totalDeaths,
                                total_recovered: totalRecovered,
                                last_date_updated: formatted_date,
                                country_statistics: data.sort((a, b) => b.confirmed - a.confirmed)
                            }

                            MongoClient.connect(url, function (err, client) {
                                let database = client.db(db);
                                database.collection(collection).deleteOne({});
                                database.collection(collection).insertOne(items);
                            });
                        } else {
                            if (results.length == 0) {
                                // console.log('results not uploaded yet');
                                reject();
                            }
                        }
                    });
                resolve();
            })
            .on('error', (error) => {
                reject(error);
            })
    }).catch(error => {
        console.log(`Something happened: ${error}`);
    });
}

cron.schedule('22 59 * * * *', async function () {
    try {
        runScheduler();
    } catch (e) {
        console.log('There was an error');
    }
});

app.get('/', async function (req, res) {
    MongoClient.connect(url, function (err, client) {
        if (err) throw err;

        let database = client.db(db);
        database.collection(collection).findOne().then(function (result) {
            if (result) {
                res.json(result);
            }
        })
    });
});

app.get('/markers.geojson', function (req, res) {
    MongoClient.connect(url, function (err, client) {
        if (err) throw err;

        let database = client.db(db);
        database.collection(collection).findOne().then(function (results) {
            if (results) {
                let data = [];
                let result = JSON.parse(JSON.stringify(results));
                let total_cases = 0;
                let country;

                for (let i = 0; i < result.country_statistics.length; i++) {
                    country = result.country_statistics[i].country;

                    for (let j = 0; j < result.country_statistics[i].states.length; j++) {

                        let state_name;
                        let state_address;
                        let latitude;
                        let longitude;
                        let confirmed = 0;
                        let deaths = 0;
                        let recovered = 0;
                        let name = result.country_statistics[i].states[j].name;

                        result.country_statistics[i].states.filter(city => city.name === name).map(e => {
                            state_name = e.name;
                            state_address = e.address;
                            latitude = e.latitude;
                            longitude = e.longitude;
                            confirmed = confirmed + parseInt(e.confirmed);
                            deaths = deaths + parseInt(e.deaths);
                            recovered = recovered + parseInt(e.recovered);
                            total_cases = parseInt(confirmed) + parseInt(deaths) + parseInt(recovered);
                        });

                        let item = {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [longitude, latitude]
                            },
                            properties: {
                                key: j,
                                country: country,
                                name: state_name,
                                address: state_address,
                                confirmed: confirmed,
                                deaths: deaths,
                                recovered: recovered,
                                total_cases: total_cases
                            }
                        }
                        data.push(item);
                    }
                }
                data = data.filter((obj, pos, arr) => {
                    return arr.map(mapObj => mapObj.properties.name).indexOf(obj.properties.name) == pos;
                });
                res.json(data);
            }
        })
    });
});

function getStatistics(country_obj, results) {
    const statistics = [];
    let country;
    let code;
    let flag;
    let coordinates;
    let confirmed = 0;
    let deaths = 0;
    let recovered = 0;
    let state_name;
    let state_latitude;
    let state_longitude;
    let state_address;
    let state_confirmed_count = 0;
    let state_deaths_count = 0;
    let state_recovered_count = 0;

    let country_statistics;

    for (let i = 0; i < results.length; i++) {
        if (results[i].Country_Region == country_obj.country) {
            country = results[i].Country_Region;
            code = country_obj.code;
            flag = country_obj.flag;
            coordinates = country_obj.coordinates;

            confirmed = parseInt(results[i].Confirmed) + confirmed;
            deaths = parseInt(results[i].Deaths) + deaths;
            recovered = parseInt(results[i].Recovered) + recovered;

            if (results[i].Province_State.length > 0) {
                state_name = results[i].Province_State;
            } else {
                state_name = country;
            }
            state_address = results[i].Combined_Key;

            if (results[i].Lat !== undefined && results[i].Lat.length > 0 && results[i].Long_ !== undefined && results[i].Long_.length > 0) {
                state_latitude = parseFloat(results[i].Lat);
                state_longitude = parseFloat(results[i].Long_);
            } else {
                state_latitude = 0.0;
                state_longitude = 0.0;
            }

            state_confirmed_count = results[i].Confirmed;
            state_deaths_count = results[i].Deaths;
            state_recovered_count = results[i].Recovered;

            let state_statistics = {
                key: Math.random().toString(36).substr(2, 5),
                name: state_name,
                address: state_address,
                latitude: state_latitude,
                longitude: state_longitude,
                confirmed: state_confirmed_count,
                deaths: state_deaths_count,
                recovered: state_recovered_count
            }
            statistics.push(state_statistics);
        }
    }

    country_statistics = {
        country: country,
        code: code,
        flag: flag,
        coordinates: coordinates,
        confirmed: confirmed,
        deaths: deaths,
        recovered: recovered,
        states: statistics.sort().filter((el, i, a) => (i === a.indexOf(el)))
    }
    return country_statistics;
}

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}!`);
    runScheduler();
});

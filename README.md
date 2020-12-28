<p align="center">
<img src="https://covid19.tylerthompson.me/img/apple-touch-icon.png" alt="...">
</p>
# Coronavirus - (COVID-19) Application
The idea behind this application is to displays the statistics of Coronavirus (COVID-19) around the world and the data are being collected from [Johns Hopkins University Center for Systems Science and Engineering JHU CSSE](https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data) and it updates the cases constantly on this website around the world. 

## Technical Overview
This application runs on a react front-end with a nodeJS backend.
It parses the data from [JHU CSSE](https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data) and stores it in MongoDB database and then uses that data to populate the coordinates on Mapbox using a GeoJSON format.


### Website Link
[https://covid19.tylerthompson.me](https://covid19.tylerthompson.me)


### Setup
``````````````````````````
git clone repo

cd covid

mongod (Start MongoDB database)
``````````````````````````


### Server Installation
``````````````````````````
cd server 
npm install
npm start
``````````````````````````
Open [http://localhost:9000](http://localhost:9000) to view it in the browser.

### Client Installation
``````````````````````````
cd client 
npm install
npm start
``````````````````````````
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Change the constants values in Client app
````````````````````````````````````````````````
export const BASE_URL = `http://127.0.0.1:3000`;
export const MAPBOX_ACCESS_TOKEN = `MAPBOX_API_TOKEN`;
````````````````````````````````````````````````

### Note
If you face any problems or have any suggestions on improving the things, then feel free to raise an issue.

### License
This project is licensed under the [MIT License](LICENSE)

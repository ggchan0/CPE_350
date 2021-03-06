// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Geocoding:
//  https://maps.googleapis.com/maps/api/geocode/json?address=San+Luis+Obispo&key=AIzaSyCkHrlXd689gOtezH8UTc_h_M0D9_vHV_4

// timezondb
//  http://api.timezonedb.com/v2/get-time-zone?key=8V0WC5W7SB8A&format=json&by=position&lat=35.2827524&lng=-120.6596156


'use strict';
const http = require('http');               //Joke API requires no ssl
const https = require('https');              //Google Custom Search requires ssl authentication
const fs = require('fs');
const weather_host = 'api.worldweatheronline.com';
const weather_api_key = 'f5d74c18030441ae8be173926180903';

const search_host = 'www.googleapis.com';
const search_api_key = 'AIzaSyBHR7ched0g9KlxpWAzAZe1Id_7yi8Xovo';
const cse_id = '007799595185471624536%3Ajdruqtribrg';

const geo_host = 'maps.googleapis.com';
const geo_api_key = 'AIzaSyCkHrlXd689gOtezH8UTc_h_M0D9_vHV_4';

const time_host = 'api.timezonedb.com';
const time_api_key = '8V0WC5W7SB8A';

const joke_api = 'api.yomomma.info';
 

exports.lakki = (req, res) => {

   let intent = req.body.queryResult.intent.displayName;

    if(intent == "my_google_search" || intent == "my_google_search_fallback"){
        let text = req.body.queryResult.queryText;
        callGoogleSearchAPI(text).then((output) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillment_text': output}));
        }).catch((error) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillment_text': error}));
        });
    }
    else if(intent == "my_weather" ){
        let city = req.body.queryResult.parameters['geo-city']; // city is a required param
        let state = "";
        let country = "";
        let location = city;
      
        if(req.body.queryResult.parameters['geo-state-us'] != ""){
            state = ", " + req.body.queryResult.parameters['geo-state-us'];
            location += state;
        }
        if(req.body.queryResult.parameters['geo-country'] != ""){
            country = ", " + req.body.queryResult.parameters['geo-country'];
            location += country;
        }
        
        // Get the date for the weather forecast (if present)
        let date = '';
        if (req.body.queryResult.parameters['date'] != "") {
            date = req.body.queryResult.parameters['date'];
            console.log('Date: ' + date);
        }

        // Call the geocoding API
        callGeocodingAPI(location).then((output) => {
            // Call the weather API
            callWeatherApi(output, location, date).then((new_output) => {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ 'fulfillment_text': new_output}));
            }).catch((new_error) => {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ 'fulfillment_text': new_error}));
            });
        }).catch((error) => {
            // If there is an error let the user know
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillment_text': error}));
        });

        
    } else if (intent == "my_time"){
     	let city = req.body.queryResult.parameters['geo-city']; // city is a required param
      	let state = "";
      	let country = "";
      	let location = city;
      
      	if(req.body.queryResult.parameters['geo-state'] != ""){
        	state = "," + req.body.queryResult.parameters['geo-state'];
        	location += state;
      	}
      	if(req.body.queryResult.parameters['geo-country'] != ""){
        	country = "," + req.body.queryResult.parameters['geo-country'];
        	location += country;
      	}

      	// Call the geocoding API
     	callGeocodingAPI(location).then((output) => {
            //Call Timezone API
     		callTimeAPI(output).then((new_output) => {
     			res.setHeader('Content-Type', 'application/json');
        		res.send(JSON.stringify({ 'fulfillment_text': new_output}));
     		}).catch((new_error) => {
     			res.setHeader('Content-Type', 'application/json');
        		res.send(JSON.stringify({ 'fulfillment_text': new_error}));
     		});
      	}).catch((error) => {
        	// If there is an error let the user know
        	res.setHeader('Content-Type', 'application/json');
        	res.send(JSON.stringify({ 'fulfillment_text': error}));
      	});
    } else if (intent == "joke"){
        callJokeAPI().then((output) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillment_text': output}));
        }).catch((error) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillment_text': error}));
        });
    }
};

function callJokeAPI(){
    return new Promise((resolve, reject) =>{
        http.get({host: joke_api, path: ''}, (res) => {
            let body = ''; // var to store the response chunks
            res.on('data', (d) => { body += d; }); // store each response chunk
            res.on('end', () => {
                // After all the data has been received parse the JSON for desired data
                let response = JSON.parse(body);
                let joke = response['joke'];
                
                console.log(joke);
                resolve(joke);
            });
            res.on('error', (error) => {
                reject(error);
            }); 
        });
    });
};


function callTimeAPI (latLng){
	return new Promise((resolve, reject) =>{
		let lat = latLng.split(",")[0].trim();
		let lng = latLng.split(",")[1].trim();
		let path = '/v2/get-time-zone?format=json&by=position' + '&key=' + time_api_key +
			'&lat=' + lat + '&lng=' + lng;  
		//let path = '/v2/get-time-zone?format=json&by=position&key=8V0WC5W7SB8A&lat=33.7489954&lng=-84.3879824';
		https.get({host: time_host, path: path}, (res) => {
        	let body = ''; // var to store the response chunks
        	res.on('data', (d) => { body += d; }); // store each response chunk
        	res.on('end', () => {
            	// After all the data has been received parse the JSON for desired data
            	let response = JSON.parse(body);
            	let date_time = response['formatted'];
            	// Create response
            	let output = "Current Time is: " + date_time.split(" ")[1].trim();
            	// Resolve the promise with the output text
            	console.log(output);
            	resolve(output);
        	});
        	res.on('error', (error) => {
            	reject(error);
        	});
    	});
	});
};


function callGeocodingAPI (location){
    return new Promise((resolve, reject) => {
    // Create the path for the HTTP request to get the weather
    let path = '/maps/api/geocode/json?' +
        'address=' + encodeURIComponent(location) + '&key=' + geo_api_key;

  	//let path = '/maps/api/geocode/json?address=San%20Luis%20Obispo&key=AIzaSyCkHrlXd689gOtezH8UTc_h_M0D9_vHV_4';
    
    	// Make the HTTP request to get the weather
    	https.get({host: geo_host, path: path}, (res) => {
        	let body = ''; // var to store the response chunks
        	res.on('data', (d) => { body += d; }); // store each response chunk
        	res.on('end', () => {
	            // After all the data has been received parse the JSON for desired data
	            let response = JSON.parse(body);
	            let results = response['results'][0];
	            let geometry = results['geometry'];
	            let location = geometry['location'];
	            let lat = location['lat'];
	            let lng = location['lng'];
	            // Create response
	            let output = lat+","+lng;
	            // Resolve the promise with the output text
	            console.log(output);
	            resolve(output);
	        });
	        res.on('error', (error) => {
	            reject(error);
	        });
    	});
    });
}

function callWeatherApi (latLong, location, date) {
    return new Promise((resolve, reject) => {
    // Create the path for the HTTP request to get the weather
    let path = '/premium/v1/weather.ashx?format=json&num_of_days=1' +
        '&q=' + encodeURIComponent(latLong) + '&key=' + weather_api_key + '&date=' + date;
    console.log('API Request: ' + weather_host + path);
    // Make the HTTP request to get the weather
    https.get({host: weather_host, path: path}, (res) => {
        let body = ''; // var to store the response chunks
        res.on('data', (d) => { body += d; }); // store each response chunk
        res.on('end', () => {
	            // After all the data has been received parse the JSON for desired data
	            let response = JSON.parse(body);
	            let forecast = response['data']['weather'][0];
	            let conditions = response['data']['current_condition'][0];
	            let currentConditions = conditions['weatherDesc'][0]['value'];
	            // Create response
	            let output = `Current conditions in ${location}
                    are ${currentConditions} with a projected high of
	               ${forecast['maxtempC']}C or ${forecast['maxtempF']}F and a low of
	               ${forecast['mintempC']}C or ${forecast['mintempF']}F on
	               ${forecast['date']}.`;
	            // Resolve the promise with the output text
	            console.log(output);
	            resolve(output);
	        });
	        res.on('error', (error) => {
	            reject(error);
	        });
    	});
    });
}

function callGoogleSearchAPI (text) {
    return new Promise((resolve, reject) => {
    let path = '/customsearch/v1?key=' + search_api_key + '&cx=' + cse_id + '&q=' + encodeURIComponent(text);
    console.log('API Request' + search_host + path);

    // Make the HTTP request to get the search results
    https.get({host: search_host, path: path}, (res) => {
        let body = ''; // var to store the response chunks
        res.on('data', (d) => { body += d; }); // store each response chunk
        res.on('end', () => {
                // After all the data has been received parse the JSON for desired data
                let response = JSON.parse(body);
                let items = response['items'];
                let totalResults = response['searchInformation']['formattedTotalResults'];
                let totalTime = response['searchInformation']['formattedSearchTime'];
                let imFeelingLucky = items[0];
                let output = `Total search results: ${totalResults}\n
                    Total search duration: ${totalTime}\n
                    First Result:\n
                    ${imFeelingLucky.title}
                    ${imFeelingLucky.link} `;

                console.log(output);
                resolve(output);
            });
            res.on('error', (error) => {
                reject(error);
            });
        });
    });
}

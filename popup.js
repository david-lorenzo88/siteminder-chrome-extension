// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const INTERVAL_DAYS = 14;
let btnGetStopSales = document.getElementById('btn-get-stop-sales')
var stopSales = {};
var rooms = {};
var resultDiv = document.getElementById('result');
var totalParts = 0;

var hotelierIdInput = document.getElementById('hotelierId');

chrome.storage.sync.get({
    hotelierId: '',
  }, function(items) {
    hotelierIdInput.value = items.hotelierId;    
    if(hotelierIdInput.value === ''){
		document.getElementById('alert').innerHTML = '¡ATENCIÓN! Debes especificar un Hotelier ID. Puedes guardarlo en la configuración para futuras ocasiones.';
	}
});



var initialDateInput = document.getElementById('initialDate');
var endDateInput = document.getElementById('endDate');
initialDateInput.value = moment().format('YYYY-MM-DD');
endDateInput.value = moment().add(1, 'years').format('YYYY-MM-DD');

btnGetStopSales.onclick = function(element) {

	
	resultDiv.innerHTML = "Obteniendo habitaciones...";
	getRooms(function(){
		var init = moment(initialDateInput.value, 'YYYY-MM-DD');
		var end = moment(endDateInput.value, 'YYYY-MM-DD');
		totalParts = Math.ceil(end.diff(init, 'days') / INTERVAL_DAYS);
		resultDiv.innerHTML = '<div id="availability-counter">Obteniendo disponibilidad...</div>';
		getInventory(init, end, saveResult, resultDiv, 1);	
	});
  	
};

function getRooms(callback){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "https://app.siteminder.com/web/extranet/reloaded/hoteliers/"+hotelierIdInput.value+"/roomTypes", true);
	xhr.onreadystatechange = function() {
		
	  	if (xhr.readyState == 4) {
	    	// JSON.parse does not evaluate the attacker's scripts.
	    	var result = JSON.parse(xhr.responseText.substring(6));
	    	for(var i in result){
	    		var room = result[i];
	    		rooms[room.id] = room.name;
	    	}
	    	callback();
	  	}
	}
	xhr.send();
}



function printResult(result){

	var html = '<ul>';
	for(var roomId in result){

		var initialDate = null;
		var endDate = null;
		var length = result[roomId].length;
		var i = 0;

		html += '<li><strong>'+rooms[roomId]+':</strong></li>';
		html += '<ul>';
		
		for(var date in result[roomId]){
			var avail = result[roomId][date];

			if(initialDate === null && avail === 0){
				initialDate = moment(date);
			}
			if(endDate === null && avail !== 0){
				endDate = moment(date).subtract(1, 'days');
			}

			if(initialDate !== null && endDate !== null){
				html += '<li>'+initialDate.format('DD/MM/YYYY') + ' - ' + endDate.format('DD/MM/YYYY') + '</li>';
			}

			if(++i == length && endDate === null){
				html += '<li>'+initialDate.format('DD/MM/YYYY') + ' - ' + moment().format('DD/MM/YYYY') + '</li>';
			}

			if(avail !== 0){
				initialDate = null;
				endDate = null;
			}
		}
		
		html += '</ul>';
	}
	html += '</ul>';
	resultDiv.innerHTML = html;
}

function saveResult(result){
	if(typeof(stopSales) === 'undefined'){
		console.error('stopSales not defined');
		return;
	}
	
	for(var i in result.roomTypeDates){
		var item = result.roomTypeDates[i];
		var roomType = {};
		if(stopSales.hasOwnProperty(item.roomTypeId)){
			roomType = stopSales[item.roomTypeId];
		}
		if(!roomType.hasOwnProperty(item.date)){
			roomType[item.date] = item.availability;
		}
		stopSales[item.roomTypeId] = roomType;
	}
	console.log(stopSales);
}

function getInventory(currentDate, endDate, saveResultCb, resultDiv, counter){
	resultDiv.innerHTML = "Obteniendo disponibilidad " + counter + '/'+totalParts;

	var xhr = new XMLHttpRequest();
	xhr.open("GET", "https://app.siteminder.com/web/extranet/reloaded/hoteliers/"+hotelierIdInput.value+"/inventory?startDate="+currentDate.format('YYYY-MM-DD'), true);
	xhr.onreadystatechange = function() {
		console.log(xhr);
	  	if (xhr.readyState == 4) {
	    	// JSON.parse does not evaluate the attacker's scripts.
	    	saveResultCb(JSON.parse(xhr.responseText.substring(6)));
	    	currentDate.add(INTERVAL_DAYS, 'days');
	    	if(currentDate.isSameOrBefore(endDate)){
	    		getInventory(currentDate, endDate, saveResultCb, resultDiv, ++counter);
	    	} else {
	    		resultDiv.innerHTML = "Generando resultados...";
	    		printResult(stopSales);
	    	}
	  	}
	}
	xhr.send();
}

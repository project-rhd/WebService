/**
 * @author Yikai Gong
 */

var db = {};
db.urlPrefix = 'http://115.146.92.196:5984/';
db.streetsUrl = 'street_tweets/';
db.melbUrl = 'melbourne_tweets/';
var default_startDate_str = "02 September 2014";
var default_endDate_str = "19 October 2014";
var day_str = 'Monday';
var streetsViewArray = [];
var melbViewArray = [];
var map;
var Mon_streets_traffic = [], Tue_streets_traffic = [], Wedn_streets_traffic = [], Thur_streets_traffic = [], Fri_streets_traffic = [], Sat_streets_traffic = [], Sun_streets_traffic = [];
var Mon_streets_noTraffic = [], Tue_streets_noTraffic = [], Wedn_streets_noTraffic = [], Thur_streets_noTraffic = [], Fri_streets_noTraffic = [], Sat_streets_noTraffic = [], Sun_streets_noTraffic = [];
var Mon_melb = [], Tue_melb = [], Wedn_melb = [], Thur_melb = [], Fri_melb = [], Sat_melb = [], Sun_melb = [];
var markers = [];

//'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'
function statistic_dayOfWeek_main(){
    //set day ticker
    document.getElementById('datSelection').addEventListener('change',function(){
        var selection = document.getElementById('datSelection').value;
        switch (selection){
            case '1':
                day_str = "Monday";
                drawBarChartOnDay(Mon_streets_traffic, Mon_streets_noTraffic, Mon_melb);
                resetMarkers(Mon_streets_traffic);
                $('.day_label').html(day_str);
                break;
            case '2':
                day_str = "Tuesday";
                drawBarChartOnDay(Tue_streets_traffic, Tue_streets_noTraffic, Tue_melb);
                resetMarkers(Tue_streets_traffic);
                $('.day_label').html(day_str);
                break;
            case '3':
                day_str = "Wednesday";
                drawBarChartOnDay(Wedn_streets_traffic, Wedn_streets_noTraffic, Wedn_melb);
                resetMarkers(Wedn_streets_traffic);
                $('.day_label').html(day_str);
                break;
            case '4':
                day_str = "Thursday";
                drawBarChartOnDay(Thur_streets_traffic, Thur_streets_noTraffic, Thur_melb);
                resetMarkers(Thur_streets_traffic);
                $('.day_label').html(day_str);
                break;
            case '5':
                day_str = "Friday";
                drawBarChartOnDay(Fri_streets_traffic, Fri_streets_noTraffic, Fri_melb);
                resetMarkers(Fri_streets_traffic);
                $('.day_label').html(day_str);
                break;
            case '6':
                day_str = "Saturday";
                drawBarChartOnDay(Sat_streets_traffic, Sat_streets_noTraffic, Sat_melb);
                resetMarkers(Sat_streets_traffic);
                $('.day_label').html(day_str);
                break;
            case '0':
                day_str = "Sunday";
                drawBarChartOnDay(Sun_streets_traffic, Sun_streets_noTraffic, Sun_melb);
                resetMarkers(Sun_streets_traffic);
                $('.day_label').html(day_str);
                break;
        }
    });
    //init map
    drawMap();
    //retrieve a default day - Monday
    var default_startDate = Date.parse(default_startDate_str);
    var default_endDate = Date.parse(default_endDate_str);
    getDataFromCoudhdb(default_startDate, default_endDate);
}

var onStreetReady = false;
var onCityReady = false;
function getDataFromCoudhdb(dateStart, dateEnd){
    var json = {startkey : dateStart, endkey : dateEnd};
    onStreetReady = false;
    onCityReady = false;

    $.ajax({
        url: db.urlPrefix + db.streetsUrl +'_design/Time/_view/Time_Coordinates',
        data: json,
        type: 'get',
        dataType: 'jsonp',
        success: function(data) {
            var rows = data.rows;
            streetsViewArray = rows;
            for (var i in rows){
                var day = rows[i].value[1];
                if (day == 1)
                    if(rows[i].value[3]==false)
                        Mon_streets_noTraffic.push(rows[i]);
                    else
                        Mon_streets_traffic.push(rows[i]);
                else if(day == 2){
                    if(rows[i].value[3]==false)
                        Tue_streets_noTraffic.push(rows[i]);
                    else
                        Tue_streets_traffic.push(rows[i]);
                }else if(day == 3){
                    if(rows[i].value[3]==false)
                        Wedn_streets_noTraffic.push(rows[i]);
                    else
                        Wedn_streets_traffic.push(rows[i]);
                }else if(day == 4){
                    if(rows[i].value[3]==false)
                        Thur_streets_noTraffic.push(rows[i]);
                    else
                        Thur_streets_traffic.push(rows[i]);
                }else if(day == 5){
                    if(rows[i].value[3]==false)
                        Fri_streets_noTraffic.push(rows[i]);
                    else
                        Fri_streets_traffic.push(rows[i]);
                }else if(day == 6){
                    if(rows[i].value[3]==false)
                        Sat_streets_noTraffic.push(rows[i]);
                    else
                        Sat_streets_traffic.push(rows[i]);
                }else if(day == 0){
                    if(rows[i].value[3]==false)
                        Sun_streets_noTraffic.push(rows[i]);
                    else
                        Sun_streets_traffic.push(rows[i]);
                }
            }
            onStreetReady = true;
            drawCharts();
        },
        error : function(e){
            console.log(e);
        }
    });
    $.ajax({
        url: db.urlPrefix + db.melbUrl +'_design/Keywords/_view/Time_Text',
        data:json,
        type: 'get',
        dataType: 'jsonp',
        success: function(data) {
            var rows = data.rows;
            melbViewArray = rows;
            for (var i in rows){
                var day = rows[i].value[1];
                if (day == 1)
                    Mon_melb.push(rows[i]);
                else if(day == 2){
                    Tue_melb.push(rows[i]);
                }else if(day == 3){
                    Wedn_melb.push(rows[i]);
                }else if(day == 4){
                    Thur_melb.push(rows[i]);
                }else if(day == 5){
                    Fri_melb.push(rows[i]);
                }else if(day == 6){
                    Sat_melb.push(rows[i]);
                }else if(day == 0){
                    Sun_melb.push(rows[i]);
                }
            }
            onCityReady = true;
            drawCharts();
        },
        error : function(e){
            console.log(e);
        }
    });
}

function drawCharts(){
    if(onCityReady==false || onStreetReady==false) return;
    console.log(streetsViewArray);
    console.log(melbViewArray);
    drawBarChart();
    drawBarChartOnDay(Mon_streets_traffic, Mon_streets_noTraffic, Mon_melb);
    //rest markers once data has been retrieved
    resetMarkers(Mon_streets_traffic);
    document.getElementById('datSelection').disabled = false;
}

var categories_dayOfWeek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function drawBarChart(){
    $('#columnChart').highcharts({
        chart: {
            type: 'column'
        },
        colors: ['#000000', '#FFF263', '#FF9655'],
        title: {
            text: 'During 22-9-2014 to 20-10-2014 (Four weeks)'
        },
        subtitle: {
            text: null
        },
        xAxis: {
            categories: categories_dayOfWeek
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Number of tweets'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y}</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0,
                stacking: 'normal'
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Traffic relevant Tweets on Streets',
            data: [Mon_streets_traffic.length, Tue_streets_traffic.length, Wedn_streets_traffic.length, Thur_streets_traffic.length, Fri_streets_traffic.length, Sat_streets_traffic.length, Sun_streets_traffic.length],
            stack: 'streets'
        },{
            name: 'Traffic irrelevant Tweets on Streets',
            data: [Mon_streets_noTraffic.length, Tue_streets_noTraffic.length, Wedn_streets_noTraffic.length, Thur_streets_noTraffic.length, Fri_streets_noTraffic.length, Sat_streets_noTraffic.length, Sun_streets_noTraffic.length],
            stack: 'streets'
        },{
            name: 'Tweets Talking about traffic jam',
            data: [Mon_melb.length, Tue_melb.length, Wedn_melb.length, Thur_melb.length, Fri_melb.length, Sat_melb.length, Sun_melb.length],
            stack:'city'
        }]
    });
}

function drawBarChartOnDay(streets_traffic, streets_noTraffic, melb){
    document.getElementById('datSelection').disabled = true;
    var categories_Times = [];
    var count_streets_traffic = [];
    var count_streets_noTraffic = [];
    var count_melb = [];
    for(var i =0; i<24; i++){
        categories_Times.push(i+":00");
        count_streets_traffic.push(0);
        count_streets_noTraffic.push(0);
        count_melb.push(0);
    }
    for (var i in streets_traffic){
        var time = (new Date(streets_traffic[i].key)).getHours();
        count_streets_traffic[time] += 1;
    }
    for (var i in streets_noTraffic){
        var time = (new Date(streets_noTraffic[i].key)).getHours();
        count_streets_noTraffic[time] += 1;
    }
    for (var i in melb){
        var time = (new Date(melb[i].key)).getHours();
        count_melb[time] += 1;
    }
    $('#columnChart2').highcharts({
        chart: {
            type: 'column'
        },
//        colors: ['#000000', '#FFF263', '#FF9655'],
        title: {
            text: 'Tweets on ' + day_str + ' during last 4 weeks'
        },
        subtitle: {
            text: null
        },
        xAxis: {
            categories: categories_Times,
            labels: {
                rotation: -45
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Number of tweets'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y}</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0,
                stacking: 'normal'
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Traffic relevant Tweets on Streets',
            data: count_streets_traffic  ,
            stack: 'streets'
        },{
            name: 'Traffic irrelevant Tweets on Streets',
            data: count_streets_noTraffic,
            stack: 'streets'
        },{
            name: 'Tweets Talking about traffic jam',
            data: count_melb,
            stack:'city'
        }]
    });
    document.getElementById('datSelection').disabled = false;
}

function resetMarkers(streets_traffic){
    deleteMarkders();
    for (var i in streets_traffic) {
        var value = streets_traffic[i].value;
        var coordinates = value[0];
        if(coordinates != null){
            var options = {
                position: new google.maps.LatLng(coordinates[0], coordinates[1]),
                icon : circleGreen
            };
            var marker = new google.maps.Marker(options);
            marker.time = streets_traffic[i].key;
            marker.isTrafficRelated = value[3];
            addlistenerToMarker(marker, streets_traffic[i], map);
            markers.push(marker);
        }
    }
    for (var i in markers){
        markers[i].setMap(map);
    }
}

function addlistenerToMarker(marker, row, map){
    google.maps.event.addListener(marker, 'click', function(){
        $.ajax({
            url: db.urlPrefix + db.streetsUrl + row.id,
            type: 'get',
            dataType: 'jsonp',
            success: function(data) {
                var date = new Date(data.created_at);
                var user = data.user;
                var imageUrl = user.profile_background_image_url;
                var userURL = "https://twitter.com/" + user.screen_name;
                var profileImage = '<image src="'+ imageUrl +'" height="42" width="42">';
                var content = profileImage + '</br>' +'Created at: ' + date + '</br>' + 'User: ' + '<a href ="'+userURL+'" target="_blank">' + user.name + '</a>' +'</br>' + 'Text: ' + data.text;
                var infowindow = new google.maps.InfoWindow({content:content, title:"Context"});
                if(marker.infowindow != undefined && isInfoWindowOpen(marker.infowindow))
                    marker.infowindow.close();
                marker.infowindow = infowindow;
                marker.infowindow.open(map, marker);
            },
            error : function(e){
                console.log(e);
            }
        });
    });
    if(marker.isTrafficRelated == false){
        google.maps.event.addListener(marker, "mouseover", function (e) { marker.setIcon(circle2); });
        google.maps.event.addListener(marker, "mouseout", function (e) { marker.setIcon(circle); });
    }else{
        google.maps.event.addListener(marker, "mouseover", function (e) { marker.setIcon(circleGreen2); });
        google.maps.event.addListener(marker, "mouseout", function (e) { marker.setIcon(circleGreen); });
    }
}

function deleteMarkders(){
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

var circleGreen ={
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: 'green',
    fillOpacity: 0.9,
    scale: 3,
    strokeColor: 'green',
    strokeWeight: 1
};

var circleGreen2 ={
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: 'green',
    fillOpacity: 0.9,
    scale: 6.5,
    strokeColor: 'green',
    strokeWeight: 1
};

function drawMap(){
    var mapOptions = {
        zoom: 9,
        center: { lat: -37.814107, lng: 144.963280},
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
}

function isInfoWindowOpen(infoWindow){
    var map = infoWindow.getMap();
    return (map !== null && typeof map !== "undefined");
}

function updateMarkers(){

}

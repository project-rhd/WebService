/**
 * @author Yikai Gong
 */
var socket;
var markers = [];
var tweets = {}
var totalTweetsCounter = 0;
var realtimeCounter = 0;
var queryList = [];
function realtime_main(){
    drawMap();
    //start receiving real-time data at last
    initSocket();
    drawSplineChart();
    initQueryFunction();
}

function drawMap(){
    var mapOptions = {
        zoom: 9,
        center: { lat: -37.814107, lng: 144.963280},
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
}

function initSocket(){
    var pathArray = window.location.pathname.substr(0, window.location.pathname.lastIndexOf('/'));
    socket = new WebSocket('ws://' + window.location.host +pathArray+ '/webAppEndPoint');
    socket.onopen = function (event) {
        console.log("socketopen");
        document.getElementById("serviceStatus").innerHTML=' ON';
        socket.onmessage = function (event) {
            var json = JSON.parse(event.data);
            handleIncommingTweet(json);
        };
        socket.onclose = function (event) {
            console.log('Socket has closed', event);
            document.getElementById("serviceStatus").innerHTML=' OFF';
//            alert('Socket closed !');
        };
        window.addEventListener("beforeunload", function () {
            socket.close();
        });
    }
}

function handleIncommingTweet(tweetJson){
    realtimeCounter += 1;
    var tweetId = tweetJson.id_str;
    tweets[tweetId] = tweetJson;
    // handle tweets including geo info
    if(tweetJson.geo){
        var coordinates = tweetJson.geo.coordinates;
        var position = new google.maps.LatLng(coordinates[0], coordinates[1]);
        var options;
        var marker;
        if(isTrafficRelated(tweetJson.text)){
            options = {
                position: position,
                icon: circleGreen
            }
            marker = new google.maps.Marker(options);
            marker.color = 'green';
        } else if(isQueryRelated(tweetJson.text)){
            options = {
                position: position,
                icon: circlePurple
            }
            marker = new google.maps.Marker(options);
            marker.color = 'purple';
        } else{
            options = {
                position: position,
                icon: circle
            }
            marker = new google.maps.Marker(options);
            marker.color = 'red';
        }
        marker.id = tweetId;
        addlistenerToMarker(marker, tweetJson, map);
        markers.push(marker);
        marker.setMap(map);
        if(markers.length>150){
            var markerToBeRemoved = markers[0];
            markerToBeRemoved.setMap(null);
            markers.shift();
        }
        directiveMarker.setPosition(position);
        directiveMarker.setMap(map);
    }
    console.log(tweetJson.text + "   id: " + tweetId);
    appendTweetsIntoMsgArea(tweetJson);
}

var circle ={
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: 'crimson',
    fillOpacity: 0.9,
    scale: 3,
    strokeColor: 'crimson',
    strokeWeight: 1
};

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

var circle2 ={
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: 'blue',
    fillOpacity: 1.2,
    scale: 6.5,
    strokeColor: 'blue',
    strokeWeight: 1
};

var circlePurple ={
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: 'purple',
    fillOpacity: 0.9,
    scale: 3,
    strokeColor: 'purple',
    strokeWeight: 1
};

var circlepurple2 ={
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: 'purple',
    fillOpacity: 0.9,
    scale: 6.5,
    strokeColor: 'purple',
    strokeWeight: 1
};

var directiveMarker = new google.maps.Marker({
    animation: google.maps.Animation.DROP,
    icon: 'image/redMarder.png'
});

function addlistenerToMarker(marker, tweetJson, map){
    google.maps.event.addListener(marker, 'click', function(){
        var date = new Date(tweetJson.created_at);
        var user = tweetJson.user;
        var imageUrl = user.profile_background_image_url;
        var userURL = "https://twitter.com/" + user.screen_name;
        var profileImage = '<image src="'+ imageUrl +'" height="42" width="42">';
        var content = profileImage + '</br>' +'Created at: ' + date + '</br>' + 'User: ' + '<a href ="'+userURL+'" target="_blank">' + user.name + '</a>' +'</br>' + 'Text: ' + tweetJson.text;
//        var content = 'Created at: ' + date + '</br>' + 'Text: ' + tweetJson.text;
        var infowindow = new google.maps.InfoWindow({content:content, title:"Context"});
        if(marker.infowindow != undefined && isInfoWindowOpen(marker.infowindow))
            marker.infowindow.close();
        marker.infowindow = infowindow;
        marker.infowindow.open(map, marker);
    });
    if(marker.color && marker.color=='red'){
        google.maps.event.addListener(marker, "mouseover", function (e) { marker.setIcon(circle2); });
        google.maps.event.addListener(marker, "mouseout", function (e) { marker.setIcon(circle); });
    }else if(marker.color && marker.color=='green'){
        google.maps.event.addListener(marker, "mouseover", function (e) { marker.setIcon(circleGreen2); });
        google.maps.event.addListener(marker, "mouseout", function (e) { marker.setIcon(circleGreen); });
    }else if(marker.color && marker.color=='purple'){
        google.maps.event.addListener(marker, "mouseover", function (e) { marker.setIcon(circlepurple2); });
        google.maps.event.addListener(marker, "mouseout", function (e) { marker.setIcon(circlePurple); });
    }

}

function isInfoWindowOpen(infoWindow){
    var map = infoWindow.getMap();
    return (map !== null && typeof map !== "undefined");
}

function isTrafficRelated(text){
    var content = text.replace(/[^\x00-\x7F]/g, "");
    if(content.toLowerCase().match(/ jam |traffic jam|congestion|hold-up|traffic calming|blockage|traffic|bottleneck|logjam|gridlock|rush hour|roadblock|clog/g)){
        return true;
    }
    else
        return false;
}

function isQueryRelated(text){
    if(queryList.length == 0) return false;

    var content = text.replace(/[^\x00-\x7F]/g, "");
    var filterStr = "";
    for(var i in queryList){
        if(i == 0)
            filterStr += queryList[i];
        else
            filterStr += ("|"+queryList[i]);
    }
    console.log(filterStr);
    var regex = new RegExp(filterStr,"g");
    if(content.toLowerCase().match(regex)){
        return true;
    }
    else
        return false;
}

function appendTweetsIntoMsgArea(tweetJson){
    var date = new Date(tweetJson.created_at);
    var content = tweetJson.text;
    var user = tweetJson.user;
    var userName = user.name;
    var imageUrl = user.profile_background_image_url;
    var screenName = user.screen_name;

    var para = document.createElement("p");
    var userPageLink = document.createElement("a");
    userPageLink.href = "https://twitter.com/" + screenName;
    userPageLink.target = "_blank";
    userPageLink.appendChild(document.createTextNode(userName));
    para.appendChild(document.createTextNode("Created at: "))
    para.appendChild(document.createTextNode(date));
    para.appendChild(document.createElement("br"));
    para.appendChild(document.createTextNode("User: "))
    para.appendChild(userPageLink);
    para.appendChild(document.createElement("br"));
    para.appendChild(document.createTextNode("Content: "))
    para.appendChild(document.createTextNode(content));

    if(isTrafficRelated(content)){
        para.style.color = "green";
    }else if(isQueryRelated(content)){
        para.style.color = "purple";
    }
    document.getElementById("msg_area").appendChild(para);

    $("#msg_area").scrollTop($("#msg_area")[0].scrollHeight);
}

function drawSplineChart(){
    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });
    $('#splineChart').highcharts({
        chart: {
            type: 'spline',
            animation: Highcharts.svg, // don't animate in old IE
            marginRight: 2,
            events: {
                load: function () {

                    // set up the updating of the chart each second
                    var series = this.series[0];
                    setInterval(function () {
                        var x = (new Date()).getTime(), // current time
                            y = realtimeCounter;
//                        console.log(new Date(x));
                        totalTweetsCounter += realtimeCounter;
                        document.getElementById("totalTweetsCounter").innerHTML = totalTweetsCounter;
                        realtimeCounter = 0;
                        series.addPoint([x, y], true, true);
                    }, 1000);
                }
            }
        },
        title: {
            text: null
        },
        xAxis: {
            type: 'datetime',
            tickPixelInterval: 100
        },
        yAxis: {
            title: {
                text: null
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        tooltip: {
            formatter: function () {
                return '<b>' + this.series.name + '</b><br/>' +
                    Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' +
                    Highcharts.numberFormat(this.y, 2);
            }
        },
        legend: {
            enabled: false
        },
        exporting: {
            enabled: false
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Real Time Num of Tweets',
            data: (function () {
                // generate an array of random data
                var data = [],
                    time = (new Date()).getTime(),
                    i;
                for (i = -19; i <= 0; i += 1) {
                    data.push({
                        x: time + i * 1000,
                        y: 0
                    });
                }
                return data;
            }())
        }]
    });
}

function initQueryFunction(){
    document.getElementById("queryCheckBox").addEventListener('click', function(){
        var checked = document.getElementById("queryCheckBox").checked
        if(checked == true){
            document.getElementById("queryInput").disabled = true;
            var queryInput = document.getElementById("queryInput").value;
            queryList = queryInput.split(/\s+/);
        }
        else{
            document.getElementById("queryInput").disabled = false;
            queryList = [];
        }
    });
    document.getElementById("removeCustomMarkers").addEventListener('click', function(){
       clearAllCustomMarkers();
    });
}

function clearAllCustomMarkers(){
    for(var i in markers){
        var marker = markers[i];
        if(marker.color && marker.color == 'purple'){
            marker.setMap(null);
        }
    }
}
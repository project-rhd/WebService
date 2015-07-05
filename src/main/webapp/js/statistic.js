/**
 * @author Yikai Gong
 */

var map;
var markers = [];
var datePicker;
var default_date_str = "01 October 2014";
var streetsViewArray = [];
var melbViewArray = [];
var db = {};
db.urlPrefix = 'http://115.146.92.196:5984/';
db.streetsUrl = 'street_tweets/';
db.melbUrl = 'melbourne_tweets/';

function statistic_main(){
    drawMap();
    $('#fromTime').datetimepicker({
        language:  'en',
        weekStart: 1,
        autoclose: 1,
        startView: 1,
        minuteStep:10,
        minView: 0,
        maxView: 1,
        forceParse: 0
    }).on('changeDate', function(ev){
        var d = new Date(ev.date);
        var timeInLocalZone = new Date(d.setTime(d.getTime() + d.getTimezoneOffset()*60*1000));
        document.getElementById("fromTime").data = timeInLocalZone;
    });
    $('#toTime').datetimepicker({
        language:  'en',
        weekStart: 1,
        autoclose: 1,
        startView: 1,
        minuteStep:10,
        minView: 0,
        maxView: 1,
        forceParse: 0
    }).on('changeDate', function(ev){
        var d = new Date(ev.date);
        var timeInLocalZone = new Date(d.setTime(d.getTime() + d.getTimezoneOffset()*60*1000));
        document.getElementById("toTime").data = timeInLocalZone;
    });
    datePicker = $('.form_date').datetimepicker({
        language:  'en',
        startDate: new Date("22 September 2014"),
        endDate: new Date(),
        weekStart: 1,
        todayBtn:  1,
        autoclose: 1,
        todayHighlight: 1,
        startView: 2,
        minView: 2,
        forceParse: 0
    }).on('changeDate', function(ev){
        var date = ev.date.valueOf();
        var d = new Date(date);
        d.setTime(d.getTime() + d.getTimezoneOffset()*60*1000 );
        d.setHours(0,0,0,0);
        date = Date.parse(d.toString());
        var dateEnd = date+86400000;
        updatePage();
        getStreetsDataByDate(date, dateEnd);
    }).datetimepicker('update', new Date(default_date_str));
//    document.getElementById("dateInput").value = default_date_str;
    var default_date = Date.parse(default_date_str);
    var default_dateEnd = default_date + 86399999;
    updatePage();
    getStreetsDataByDate(default_date, default_dateEnd);

    document.getElementById("updateMarkers").addEventListener("click", updateMarkers);
}

var onStreetReady = false;
var onCityReady = false;
function getStreetsDataByDate(dateStart, dateEnd){
    var json = {startkey : dateStart, endkey : dateEnd};
    var dataArray = [];
    onStreetReady = false;
    onCityReady = false;
    for(var i=0;i<24;i++){
        dataArray.push({hour: i.toString()+":00"});
    }
    $.ajax({
        url: db.urlPrefix + db.streetsUrl +'_design/Time/_view/Time_Coordinates',
        data: json,
        type: 'get',
        dataType: 'jsonp',
        success: function(data) {
            deleteMarkders();
            var rows = data.rows;
            streetsViewArray = rows;
            var counter = [];
            for (var i in rows){
                //prepare markers for map
                var value = rows[i].value;
                var coordinates = value[0];
                var options = {
                    position: new google.maps.LatLng(coordinates[0], coordinates[1])
                };
                if(value[3] == false)
                    options.icon = circle;
                else
                    options.icon = circleGreen;
                var marker = new google.maps.Marker(options);
                marker.time = rows[i].key;
                marker.isTrafficRelated = value[3];
                addlistenerToMarker(marker, rows[i], map);
                markers.push(marker);

                //prepare dataArray for line chart
                if(counter[new Date(rows[i].key).getHours()]==undefined)
                    counter[new Date(rows[i].key).getHours()]=1;
                else
                    counter[new Date(rows[i].key).getHours()]+=1;
            }
            for(var i=0;i<24;i++){
                dataArray[i].onStreet = counter[i];
            }
            onStreetReady = true;
            updateMarkers();
            drawCharts(dataArray);
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
            var counter = [];
            for (var i in rows){
                if(counter[new Date(rows[i].key).getHours()]==undefined)
                    counter[new Date(rows[i].key).getHours()]=1;
                else
                    counter[new Date(rows[i].key).getHours()]+=1;
            }
            for(var i=0;i<24;i++){
                dataArray[i].onCity = counter[i];
            }
            onCityReady = true;
            drawCharts(dataArray);
        },
        error : function(e){
            console.log(e);
        }
    });
}

function drawCharts(dataArray){
    if(onCityReady==false || onStreetReady==false) return;
    console.log(dataArray);
    $('#lineChart').html('');
    var lineChart = new Morris.Line({
        element: 'lineChart',
        data: dataArray,
        xkey: 'hour',
        ykeys: ['onStreet', 'onCity'],
        lineColors: ['Blue', 'HotPink'],
        parseTime: false,
        labels: ['<b>Tweets on main streets</b>', '<b>Traffic relevant tweets in city</b>']
    });
    prepareChartData();
    drawColumnChart();
    drawBarChart();
    drawPieChart();
//    drawAreaChart();
}

function drawMap(){
    var mapOptions = {
        zoom: 13,
        center: { lat: -37.814107, lng: 144.963280},
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
}

function updateMarkers(){
    var timeStartObj = document.getElementById("fromTime").data;
    var timeEndObj = document.getElementById("toTime").data;
    var timeStart = Date.parse(timeStartObj.toString());
    var timeEnd = Date.parse(timeEndObj.toString());

    $('.time_label').html('from '+timeStartObj.getHours().padLeft()+':'+timeStartObj.getMinutes().padLeft() + ' to ' +
        (timeEndObj.getHours()==0?24:timeEndObj.getHours()).padLeft()+':'+timeEndObj.getMinutes().padLeft());

    for (var i = 0; i < markers.length; i++) {
        if(markers[i].time > timeStart && markers[i].time < timeEnd)
            markers[i].setMap(map);
        else
            markers[i].setMap(null);
    }
}


function isInfoWindowOpen(infoWindow){
    var map = infoWindow.getMap();
    return (map !== null && typeof map !== "undefined");
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

function updatePage(){
    var date = $('.form_date').find("input").val();
    $(".panel-label").html(date);
    updateTimePicker(date);
}

function deleteMarkders(){
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

function updateTimePicker(fromTimeStr){
    console.log("fromTimeStr:" + fromTimeStr);
    var toTimeStr = (new Date(Date.parse(fromTimeStr) + 86400000)).toString();

    $('#fromTime').datetimepicker('update', new Date(fromTimeStr));
    $('#fromTime').datetimepicker('setStartDate', new Date(fromTimeStr));
    $('#fromTime').datetimepicker('setEndDate', new Date(toTimeStr));
    document.getElementById("fromTime").data = new Date(fromTimeStr);

    $('#toTime').datetimepicker('update', new Date(toTimeStr));
    $('#toTime').datetimepicker('setStartDate', new Date(fromTimeStr));
    $('#toTime').datetimepicker('setEndDate', new Date(toTimeStr));
    document.getElementById("toTime").data = new Date(toTimeStr);
}

var circle ={
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: 'crimson',
    fillOpacity: 0.9,
    scale: 3,
    strokeColor: 'crimson',
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

var categories, totalOnStreets, CBDStreets, CITYLINK, WEST_GATE_FREEWAY, EASTERN_FREEWAY, MONASH_FREEWAY, otherMainStreets;

function prepareChartData(){
    categories = [];
    totalOnStreets = {name:'Total on Streets', data:[]};
    CBDStreets = {name:'Streets in CBD', data:[]};
    CITYLINK = {name:'CITYLINK', data:[]};
    WEST_GATE_FREEWAY = {name:'WEST GATE FREEWAY', data:[]};
    EASTERN_FREEWAY = {name:'EASTERN FREEWAY', data:[]};
    MONASH_FREEWAY = {name:'MONASH FREEWAY', data:[]};
    otherMainStreets = {name:'Other Main Streets', data:[]};
    for(var i =0; i<24; i++){
        categories.push(i+":00");
        totalOnStreets.data[i]=0;
        CBDStreets.data[i]=0;
        CITYLINK.data[i]=0;
        WEST_GATE_FREEWAY.data[i]=0;
        EASTERN_FREEWAY.data[i]=0;
        MONASH_FREEWAY.data[i]=0;
        otherMainStreets.data[i]=0;
    }
    for(var i in streetsViewArray){
        var timeNum = streetsViewArray[i].key;
        var hour = new Date(timeNum).getHours();
        var value = streetsViewArray[i].value;
        var streetName = value[2];
        if (streetName == 'CITYLINK'){
            countNum(CITYLINK, hour);
        }else if(streetName == 'WEST GATE FREEWAY'){
            countNum(WEST_GATE_FREEWAY, hour);
        }else if(streetName == 'EASTERN FREEWAY'){
            countNum(EASTERN_FREEWAY, hour);
        }else if(streetName == 'MONASH FREEWAY'){
            countNum(MONASH_FREEWAY, hour);
        }else if(streetName =='DANDENONG ROAD'||streetName=='NEPEAN HIGHWAY'||streetName=='BRIGHTON ROAD'||streetName=='BARKERS ROAD'
            ||streetName=='VICTORIA STREET'||streetName=='FOOTSCRAY ROAD'||streetName=='DYNON ROAD'||streetName=='MOUNT ALEXANDER ROAD'
            ||streetName=='FLEMINGTON ROAD'||streetName=='ROYAL PARADE'||streetName=='PEEL STREET'||streetName=='ELIZABETH STREET'
            ||streetName=='BARKLY STREET'||streetName=='SUNSHINE ROAD'||streetName=='BUCKLEY STREET'||streetName=='NAPIER STREET'){
            countNum(otherMainStreets, hour)
        }else{
            countNum(CBDStreets, hour);
        }
        countNum(totalOnStreets, hour);
    }
}

function drawBarChart(){
    $('#barChart').highcharts({
        chart: {
            type: 'bar'
        },
        title: {
            text: 'Street Tweets'
        },
        subtitle: {
            text: 'Comparing along time '
        },
        xAxis: {
            categories: categories,
            title: {
                text: 'Time'
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Number of tweets',
                align: 'high'
            },
            labels: {
                overflow: 'justify'
            }
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true

                },
                borderWidth : 1
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: -40,
            y: 100,
            floating: true,
            borderWidth: 1,
            backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
            shadow: true
        },
        credits: {
            enabled: false
        },
        series: [totalOnStreets, CBDStreets, CITYLINK, WEST_GATE_FREEWAY, EASTERN_FREEWAY, MONASH_FREEWAY, otherMainStreets]
    });
}

function drawPieChart(){
    var CITYLINK = ['CITYLINK', 0];
    var WEST_GATE_FREEWAY = ['WEST GATE FREEWAY', 0];
    var EASTERN_FREEWAY = ['EASTERN FREEWAY', 0];
    var MONASH_FREEWAY = ['MONASH FREEWAY', 0];
    var otherMainStreets = ['Other Main Streets', 0];
    for(var i in streetsViewArray){
        var value = streetsViewArray[i].value;
        var streetName = value[2];
        if (streetName == 'CITYLINK'){
            CITYLINK[1] += 1;
        }else if(streetName == 'WEST GATE FREEWAY'){
            WEST_GATE_FREEWAY[1] += 1;
        }else if(streetName == 'EASTERN FREEWAY'){
            EASTERN_FREEWAY[1] += 1;
        }else if(streetName == 'MONASH FREEWAY'){
            MONASH_FREEWAY[1] += 1;
        }else if(streetName =='DANDENONG ROAD'||streetName=='NEPEAN HIGHWAY'||streetName=='BRIGHTON ROAD'||streetName=='BARKERS ROAD'
                ||streetName=='VICTORIA STREET'||streetName=='FOOTSCRAY ROAD'||streetName=='DYNON ROAD'||streetName=='MOUNT ALEXANDER ROAD'
                ||streetName=='FLEMINGTON ROAD'||streetName=='ROYAL PARADE'||streetName=='PEEL STREET'||streetName=='ELIZABETH STREET'
                ||streetName=='BARKLY STREET'||streetName=='SUNSHINE ROAD'||streetName=='BUCKLEY STREET'||streetName=='NAPIER STREET'){
            otherMainStreets[1] += 1;
        }
    }
    $('#pieChart').highcharts({
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false
        },
        title: {
            text: null
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: false
                },
                showInLegend: true
            }
        },
        credits: {
            enabled: false
        },
        series: [{
            type: 'pie',
            name: 'Percentage',
            data: [otherMainStreets, CITYLINK, WEST_GATE_FREEWAY, EASTERN_FREEWAY, MONASH_FREEWAY]
        }]
    });
}

function drawAreaChart(){
    var CITYLINK_ = {name:'CITYLINK', data:[]};
    var WEST_GATE_FREEWAY_ = {name:'WEST GATE FREEWAY', data:[]};
    var EASTERN_FREEWAY_ = {name:'EASTERN FREEWAY', data:[]};
    var MONASH_FREEWAY_ = {name:'MONASH FREEWAY', data:[]};
    var otherMainStreets_ = {name:'Other Main Streets', data:[]};
    for(var i = 0; i<22; i+=3){
        CITYLINK_.data[(i/3)] = CITYLINK.data[i] + CITYLINK.data[i+1] + CITYLINK.data[i+2];
        WEST_GATE_FREEWAY_.data[(i/3)] = WEST_GATE_FREEWAY.data[i] + WEST_GATE_FREEWAY.data[i+1] + WEST_GATE_FREEWAY.data[i+2];
        EASTERN_FREEWAY_.data[(i/3)] = EASTERN_FREEWAY.data[i] + EASTERN_FREEWAY.data[i+1] + EASTERN_FREEWAY.data[i+2];
        MONASH_FREEWAY_.data[(i/3)] = MONASH_FREEWAY.data[i] + MONASH_FREEWAY.data[i+1] + MONASH_FREEWAY.data[i+2];
        otherMainStreets_.data[(i/3)] = otherMainStreets.data[i] + otherMainStreets.data[i+1] + otherMainStreets.data[i+2];
    }
    $('#areaChart').highcharts({
        chart: {
            type: 'area'
        },
        title: {
            text: null
        },
        subtitle: {
            text: null
        },
        xAxis: {
            categories: ['0:00', '3:00', '6:00', '9:00', '12:00', '15:00', '18:00', '21:00'],
            tickmarkPlacement: 'on',
            title: {
                enabled: false
            }
        },
        yAxis: {
            title: {
                text: null
            }
        },
        tooltip: {
            pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.percentage:.1f}%</b> ({point.y:,.0f} millions)<br/>',
            shared: true
        },
        plotOptions: {
            area: {
                stacking: 'percent',
                lineColor: '#ffffff',
                lineWidth: 1,
                marker: {
                    lineWidth: 1,
                    lineColor: '#ffffff'
                }
            }
        },
        series: [CITYLINK_, EASTERN_FREEWAY_, WEST_GATE_FREEWAY_, MONASH_FREEWAY_, otherMainStreets_]
    });
}

function drawColumnChart(){
    $('#columnChart').highcharts({
        chart: {
            type: 'column'
        },
        title: {
            text: 'Tweets on Main Streets'
        },
        xAxis: {
            categories: categories
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Number of Tweets'
            },
            stackLabels: {
                enabled: true,
                style: {
                    fontWeight: 'bold',
                    color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                }
            }
        },
        legend: {
            align: 'right',
            x: -70,
            verticalAlign: 'top',
            y: 20,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
            borderColor: '#CCC',
            borderWidth: 1,
            shadow: false
        },
        tooltip: {
            formatter: function () {
                return '<b>' + this.x + '</b><br/>' +
                    this.series.name + ': ' + this.y + '<br/>' +
                    'Total: ' + this.point.stackTotal;
            }
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                dataLabels: {
                    enabled: true,
                    color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
                    style: {
                        textShadow: '0 0 3px black, 0 0 3px black'
                    }
                }
            }
        },
        series: [otherMainStreets, CITYLINK, EASTERN_FREEWAY, WEST_GATE_FREEWAY, MONASH_FREEWAY]
    });

}

function countNum(dataObj, hour){
    if(dataObj.data[hour]==undefined)
        dataObj.data[hour]=1;
    else
        dataObj.data[hour]+=1
}

function isInfoWindowOpen(infoWindow){
    var map = infoWindow.getMap();
    return (map !== null && typeof map !== "undefined");
}


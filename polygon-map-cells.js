// Dots.js

// Used to create an array of x, y coordinates from a set of options

var d3_delaunay = require('./d3-delaunay'); //require the voronoi script

// rounding function ----------------------------

function round(value, decimals) {
    var number = Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    number = isNaN(number)? 0 : number; // if the number in NaN set it to 0.
    return number;
}

// coords function ------------------------------

// generates a set of coordinates for one cirlce, with a given radius and arc length

function generateCoordinates(centreX,centreY,radius,arcLength){

    // generate angle ---------------------------

    const diameter = (2 * radius * Math.PI); // calculate the diameter 
    const numberOfCoords = Math.round(diameter/arcLength); // the number of arc lengths in the circle
    const angle = Math.abs((360/numberOfCoords)); // the angle to increment by each time
    
    var currentAngle = 0; //the intial angle to use when 
    var allCoordinates = []; //array to store all coordinate objects

    while(currentAngle < 360){
        allCoordinates.push({ //pushes a new coordinate to the array
            x: round((centreX + (radius * Math.cos(currentAngle * (Math.PI/180)))),6),
            y: round((centreY + (radius * Math.sin(currentAngle * (Math.PI/180)))),6),
        });
        currentAngle = currentAngle + angle; // increases the target angle by the incrementer
    }

    var newCoordinates = [];

    // check for duplicates 

    for(var i = 0; i < allCoordinates.length; i++){
        var currentPoint = allCoordinates[i];
        var flag = false;
        for(var j = 0; j < newCoordinates.length; j++){
            if(newCoordinates[j].x === currentPoint.x && newCoordinates[j].y === currentPoint.y){
                flag = true;
            }
        }
        if(flag === false){
            newCoordinates.push(currentPoint);
        }
    }

    return newCoordinates; //returns the set of coordinates
}

// convert dots to 2d array ---------------------

function to2d(dots){
    var newDots = []; //creates a new array for the new 2d array
    var dots_ = dots.dots || dots; //seelcts either the dots or the coordinates
    for(var i = 0; i < dots_.length; i++){
        newDots.push([dots_[i].long || dots_[i].x ,dots_[i].lat || dots_[i].y ]); //pushes the x,y or lat,long 
    }
    return newDots; //returns the new array
}

// multiple circle generate ---------------------

// uses the above function multiple times to create a number of circles and points

function dots(options){

    var maxRadius = options.maxRadius; //pulls variables from options
    var centreX = options.centreX;
    var centreY = options.centreY;
    var arcLength = options.arcLength;
    var centre = (options.centre === undefined) ? true : options.centre;

    var numberOfCircles = Math.floor(maxRadius/arcLength); //calculates the number of rings to complete

    var allDots = []; // creates a holder for the first creation of dots
    allDotsNew = []; //creates a holder for the second creation of dots

    if(centre === true){ // adds centre coordinate if asked to
        allDots.push([{x: centreX,y: centreY}]);
    }

    for(var i = 0; i < numberOfCircles; i++){ //creates all the dots and places in 2D array
        allDots.push(generateCoordinates(centreX,centreY,(arcLength * (i + 1)),arcLength));
    }
    for(var j = 0; j < allDots.length; j++){ //concatenates all the dots into a 1D array
        allDotsNew = allDotsNew.concat(allDots[j]);
    }

    var dots_ = { //creates a returnable object 
        number: allDotsNew.length,
        xMin: (centreX - (numberOfCircles * arcLength)) - (arcLength/2), //adder to make slightly cleaner
        xMax: (centreX + (numberOfCircles * arcLength)) + (arcLength/2),
        yMin: (centreY - (numberOfCircles * arcLength)) - (arcLength/2),
        yMax: (centreY + (numberOfCircles * arcLength)) + (arcLength/2),
        dots: allDotsNew,
    }

    return (dots_); //returns the dots

}

// create coordinates from displacement ---------

function toLatLong(points,centre){

    var coords = [];
    var earthRadius = 6371000; //radius in metres

    for(var i = 0; i < points.dots.length; i++){
        var dx = points.dots[i].x;
        var dy = points.dots[i].y;

        var newLatitude = centre.lat + (dy / earthRadius) * (180 / Math.PI); // calculate new latitude
        var newLongitude = centre.long + (dx / earthRadius) * (180 / Math.PI) / Math.cos(centre.lat * Math.PI/180); //calculate new longitude

        coords.push({ // create enw object
            lat: newLatitude,
            long: newLongitude,
        });
    }

    return coords;
    
}

function toLat(centre,displacement){ // requires y
    var earthRadius = 6371000;
    var dy = displacement;
    var newLatitude = centre.lat + (dy / earthRadius) * (180 / Math.PI);
    return newLatitude;

}

function toLong(centre,displacement){ //requires x
    var earthRadius = 6371000;
    var dx = displacement;
    var newLongitude = centre.long + (dx / earthRadius) * (180 / Math.PI) / Math.cos(centre.lat * Math.PI/180);
    return newLongitude;
}

// create the polygons --------------------------

function toPolygon(coordinates,points,latlong){
    var newArray = to2d(coordinates); //create the 2d array

    var delaunay = d3_delaunay.Delaunay.from(newArray); //create the delaunay diagram

    var newLimits = [toLong(latlong,points.xMin),toLat(latlong,points.yMin),toLong(latlong,points.xMax),toLat(latlong,points.yMax)];

    var voronoi = delaunay.voronoi(newLimits); //create the voronoi

    var cells = voronoi.cellPolygons(); //grab the polygons

    for(var i = 0; i < cells.length; i++){ //reverse the lat and long
        for(var j = 0; j < cells[i].length; j++){
            cells[i][j].reverse();
        }
    }

    return cells;

}

// create cells ---------------------------------

function createCells(coordinates,polygons){
    var newCells = [];

    for(var i = 1; i <= coordinates.length; i++){ // joins the centre points and the polygons
        newCells.push({
            coordinates:coordinates[i-1],
            polygon: polygons[i-1],
        })
    }

    return newCells;
}

// create all cells -----------------------------

module.exports = function (options){
    var maxRadius = options.maxRadius; //pulls variables from options
    var latitude = options.centre.lat;
    var longitude = options.centre.long;
    var arcLength = options.arcLength;

    if(arcLength === "auto"){
        arcLength = Math.round((12.9642*maxRadius) + 9.7619)
        if(arcLength < 300){
            arcLength = 300
        }
    }

    // create array of points -------------------

    var points = dots({
        maxRadius: (maxRadius*1000) + arcLength, //adder to sort out voronoi problem
        arcLength: arcLength,
        centreX: 0,
        centreY: 0,
        centre: true,
    });

    var numberInOuter = generateCoordinates(0,0,(maxRadius*1000) + arcLength,arcLength).length;

    // Create coordinates for the map -----------
    
    var coordinates = toLatLong(points,{lat:latitude,long:longitude});

    // Create polygons for the map --------------

    var polygons = toPolygon(coordinates,points,{lat:latitude,long:longitude});

    // Combine polygons and points --------------

    coordinates = coordinates.slice(0,-1*(numberInOuter));
    polygons = polygons.slice(0,-1*(numberInOuter));

    var cells = createCells(coordinates,polygons);
    
    return cells;
}

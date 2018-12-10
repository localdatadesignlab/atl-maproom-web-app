// Define socket address (Ubuntu server address)
var socket = io('http://maproom.lmc.gatech.edu:8080/');

// Global Variables
var activeRectangle = document.getElementById("longRect");
var rectWidth = 730;
var rectHeight = 200;
var propertyAssessmentEnabled = false;

/**
 * when arrow keys are pressed from the Projector to align the map,
 * Socket emmit sends changes back to be updated on Controller
 */

 socket.on('pushSensorUpdate', function(data) {
   console.log("New sensor reading: " + data.distance)
 })

socket.on('projNudge', function(data) {

  direction = data.direction
  var deltaDistance = 1;
  var deltaDegrees = 1;
  var deltaZoom = 0.03

  if (direction === 'up') {
      map.panBy([0, -deltaDistance]);
  } else if (direction === 'down') {
      map.panBy([0, deltaDistance]);
  } else if (direction === 'left') {
      map.panBy([-deltaDistance, 0]);
  } else if (direction === 'right') {
      map.panBy([deltaDistance, 0]);
  } else if (direction === 'ccw') {
      map.easeTo({bearing: map.getBearing() - deltaDegrees});
  } else if (direction === 'cw') {
      map.easeTo({bearing: map.getBearing() + deltaDegrees});
  } else if (direction === 'zoom_in') {
      map.easeTo({zoom: map.getZoom() + deltaZoom});
  } else if (direction === 'zoom_out') {
      map.easeTo({zoom: map.getZoom() - deltaZoom});
  }
});

mapboxgl.accessToken = 'pk.eyJ1IjoiYXRsbWFwcm9vbSIsImEiOiJjamtiZzJ6dGIybTBkM3dwYXQ2c3lrMWs3In0.tJzsvakNHTk7G4iu73aP7g';

/**
 * creates the MapBox GL map with initial parameters
 */

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/atlmaproom/cjkbg9s6m8njm2roxkx8gprzj', // style from online MapBox GL Studio
    zoom: 12,
    bearing: 0, // refers to rotation angle
    center: [-84.3951, 33.7634],
    interactive: true
});

/**
 * the x & y coordinates of a single point
 * @typedef {Object} Point
 * @property {number} x - the x coordinate
 * @property {number} y - the y coordinate
 */

/**
 * the Point of each corner of a box
 * @typedef {Object} PixelCoordinates
 * @property {Object} ur - Point of upper right corner
 * @property {Object} ul - Point of upper left corner
 * @property {Object} br - Point of bottom right corner
 * @property {Object} bl - Point of bottom left corner
 */

/**
 * returns the PixelCoordinates of the selection box
 * @return {PixelCoordinates}
 *         the x & y coordinates of each corner of the selection box
 */

function getPixelCoordinates(){
  // get width & height from current rectangle
  width = rectWidth;
  height = rectHeight;
  // get map center in pixel coordinates
  var center = map.project(map.getCenter());
  // calculate pixel coordinates of corners
  var ur = {"x":(center.x + width/2), "y":(center.y - height/2)}; // upper right
  var ul = {"x":(center.x - width/2), "y":(center.y - height/2)}; // upper left
  var br = {"x":(center.x + width/2), "y":(center.y + height/2)}; // bottom right
  var bl = {"x":(center.x - width/2), "y":(center.y + height/2)}; // bottom left
  // return an json of pixel coordinates
  return {"ur":ur, "ul":ul, "br":br, "bl":bl};
}

/**
 * the lng & lat coordinates of a single point
 * @typedef {Object} GeoPoint
 * @property {number} lng - the lng coordinate
 * @property {number} lat - the lat coordinate
 */

/**
 * the GeoPoint of each corner of a box
 * @typedef {Object} GeoCoordinates
 * @property {Object} ur - GeoPoint of upper right corner
 * @property {Object} ul - GeoPoint of upper left corner
 * @property {Object} br - GeoPoint of bottom right corner
 * @property {Object} bl - GeoPoint of bottom left corner
 */

 /**
  * returns the GeoCoordinates of the selection box
  * @return {GeoCoordinates}
  *         the lng & lat coordinates of each corner of the selection box
  */

function getGeoCoordinates(){
  // grab pixel coordinates from helper method
  var pixelCoordinates = getPixelCoordinates();
  // unproject to geographic coordinates
  var ur = map.unproject(pixelCoordinates.ur);
  var ul = map.unproject(pixelCoordinates.ul);
  var br = map.unproject(pixelCoordinates.br);
  var bl = map.unproject(pixelCoordinates.bl);
  // return a json of geographic coordinates
  return {"ur":ur, "ul":ul, "br":br, "bl":bl};
}

/**
 * the GeoPoint central to the right-most and left-most squares of a box
 * @typedef {Object} EndCenters
 * @property {Object} rc - GeoPoint of right center
 * @property {Object} lc - GeoPoint of left center
 */

/**
 * returns the EndCenters of the selection box
 * @return {EndCenters}
 *        the lng & lat coordinates of the right-most and left-most squares of the selection box
 */
function getEndCenters(){
  var height = rectHeight;
  // get upper right & upper left pixels
  var pixelCoordinates = getPixelCoordinates();
  var ur = pixelCoordinates.ur;
  var ul = pixelCoordinates.ul;
  // calculate pixel coordinates for right & left center
  var rcPixel = {"x":(ur.x - height/2), "y":(ur.y + height/2)};
  var lcPixel = {"x":(ul.x + height/2), "y":(ul.y + height/2)};
  var rc = map.unproject(rcPixel);
  var lc = map.unproject(lcPixel);
  // return a json of geographic coordinates
  return {"rc":rc, "lc":lc};
}

/**
 * function to toggle the size of selection rectangle between shortRect & longRect;
 * CURRENTLY UNUSED - to activate, remove "display:none;" in changeRect CSS
 */
function toggleRectangle() {
    var x = document.getElementById("shortRect");
    var y = document.getElementById("longRect");
    if (x.style.display === "none") { // turn short rectangle on
        x.style.display = "block";
        y.style.display = "none";
        activeRectangle = x;
        rectWidth = 900;
        rectHeight = 300;
    } else {                          // turn long rectangle on
        x.style.display = "none";
        y.style.display = "block";
        activeRectangle = y;
        rectWidth = 730;
        rectHeight = 200;
    }
}

/**
 * event listener calling toggleRectangle() when changeRect button is pressed,
 * then updating all map parameters so Projector can properly display
 */
document.getElementById('changeRect').addEventListener('click', function () {
  toggleRectangle();
  console.log("Sending rectangle change to server...")
  socket.emit('locUpdate', {'center': map.getCenter(), 'zoom': map.getZoom(),
                            'bearing':map.getBearing(), 'geoCoordinates':getGeoCoordinates(),
                            'activeRectangle':activeRectangle.id, 'endCenters':getEndCenters()})
});

/**
 * when button is clicked, all user interaction (pinch/drag) with map is
 * disabled to "lock" so map does not become disaligned while drawing
 */
document.getElementById('interactionButton').addEventListener('click', function(){
  map.boxZoom.disable();
  map.scrollZoom.disable();
  map.dragPan.disable();
  map.dragRotate.disable();
  map.keyboard.disable();
  map.doubleClickZoom.disable();
  map.touchZoomRotate.disable();
});

/**
 * adds BeltLine and data layer sources from MapBox GL Studio
 * and then adds the layers to the map to be toggled
 */
map.on('load', function () {
      var nav = new mapboxgl.NavigationControl({
      showCompass: true
    });
    var scale = new mapboxgl.ScaleControl({
       maxWidth: 80,
       unit: 'imperial'
    });
    map.addControl(scale);
    scale.setUnit('imperial');
    map.addControl(nav, 'bottom-left');
    // beltline layer
    map.addSource('beltline', {
        type: 'vector',
        url: 'mapbox://atlmaproom.9v2e99o9'
    });
    map.addLayer({
        'id': 'beltline',
        'type': 'line',
        'source': 'beltline',
        'source-layer': 'Beltline_Weave-9xlpb5',
        'layout': {
            'visibility': 'visible',
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': 'yellow green',
            'line-width': 8
        }
    });
    // property layer
    // Change median income later
    map.addSource('ACS', {
        type: 'vector',
        url: 'mapbox://atlmaproom.c97zkvti'
    });
    map.addLayer({
        'id': 'Median Income Change',
        'type': 'fill',
        'source': 'ACS',
        'source-layer': 'merged2-53z777',
        'layout': {
            'visibility': 'none',
        },
        'paint': {
            'fill-outline-color': '#f7ff05',
            'fill-color': {
              property:'P_C_M_I',
              stops: [
                [-100, '#00a4d1'],
                [0, '#fffcd6'],
                [100, '#e92f2f']
              ]
            },
            'fill-opacity': 0.5
        }
    });
    map.addLayer({
        'id': 'College Educated Change',
        'type': 'fill',
        'source': 'ACS',
        'source-layer': 'merged2-53z777',
        'layout': {
            'visibility': 'none',
        },
        'paint': {
            'fill-outline-color': '#f7ff05',
            'fill-color': {
              property:'C_C_E_P',
              stops: [
                [-40, '#00a4d1'],
                [0, '#fffcd6'],
                [40, '#e92f2f']
              ]
            },
            'fill-opacity': 0.5
        }
    });
    map.addLayer({
        'id': 'White Occupants Change',
        'type': 'fill',
        'source': 'ACS',
        'source-layer': 'merged2-53z777',
        'layout': {
            'visibility': 'none',
        },
        'paint': {
            'fill-outline-color': '#f7ff05',
            'fill-color': {
              property:'C_W_P__',
              stops: [
                [-30, '#00a4d1'],
                [0, '#fffcd6'],
                [30, '#e92f2f']
              ]
            },
            'fill-opacity': 0.5
        }
    });
    // MARTA Buses and Rail (all one color)
    map.addSource('MARTA', {
        type: 'vector',
        url: 'mapbox://atlmaproom.cxppjs0d'
    });
    map.addLayer({
        'id': 'MARTA',
        'type': 'line',
        'source': 'MARTA',
        'source-layer': 'marta-bi9p6y',
        'layout': {
            'visibility': 'none',
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-width': 3,
            'line-color': "#32ffd9",
            'line-opacity': 0.8
        }
    });

    map.addLayer({
        'id': 'ATLMaps:r9hrz',
        'type': 'raster',
        'source': {
        'type': 'raster',
        'tiles': [
            'https://geoserver.ecds.emory.edu/ATLMaps/wms?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.0&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=ATLMaps:r9hrz'
        ],
        'tileSize': 256
        }
    });

  map.addLayer({
    'id': 'ATLMaps:r9jr2',
    'type': 'raster',
    'source': {
      'type': 'raster',
      'tiles': [
        'https://geoserver.ecds.emory.edu/ATLMaps/wms?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.0&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=ATLMaps:r9jr2'
      ],
      'tileSize': 256
    }
  });
});

/**
 * when the user interacts with the map (pinch/drag to move, zoom, or rotate)
 * all changes are emitted to the server to update the view in Projector
 */
map.on('moveend', function (e) {
      console.log("Sending move change to server...")
      socket.emit('mapUpdate', {'center': map.getCenter(), 'zoom': map.getZoom(),
                                'bearing':map.getBearing(), 'geoCoordinates':getGeoCoordinates(),
                                'activeRectangle':activeRectangle.id, 'endCenters':getEndCenters()})
});

/**
 * link layers to buttons to toggle on screen
 */
var toggleableLayerIds = ['ATLMaps:r9hrz', 'ATLMaps:r9jr2', 'Property Assessment', 'Median Income Change', 'College Educated Change', 'White Occupants Change', 'MARTA' ];

for (var i = 0; i < toggleableLayerIds.length; i++) {
    var id = toggleableLayerIds[i];
    var link = document.createElement('a');
    link.href = '#';
    link.textContent = id;
    link.onclick = function (e) {
        var clickedLayer = this.textContent;
        e.preventDefault();
        e.stopPropagation();
        if (!(clickedLayer===('Property Assessment'))){
            var visibility = map.getLayoutProperty(clickedLayer, 'visibility');
            if (visibility === 'visible') {
              map.setLayoutProperty(clickedLayer, 'visibility', 'none');
              socket.emit('hideLayer', {'clickedLayer':clickedLayer})
              this.className = '';
            } else {
              this.className = 'active';
              map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
              socket.emit('showLayer', {'clickedLayer':clickedLayer})
          };
        }else{
            if (propertyAssessmentEnabled){
                console.log("Removing property assessments...");
                socket.emit("removeTA", {'info':'none'});
                propertyAssessmentEnabled = false;
                this.className = "";
            }else{
                socket.emit("addTA", {'info':'none'});
                propertyAssessmentEnabled = true;
                this.className = 'active';
            }
        }
        console.log("Sending layer change to server...")
    };

    var layers = document.getElementById('menu');
    layers.appendChild(link);
}

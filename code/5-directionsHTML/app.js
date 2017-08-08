/// <reference path="../../typings/index.d.ts"/>
// set up Argon
var app = Argon.init();
// set up THREE.  Create a scene, a perspective camera and an object
// for the user's location
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera();
var userLocation = new THREE.Object3D;
scene.add(camera);
scene.add(userLocation);
// The CSS3DArgonRenderer supports mono and stereo views, and
// includes both 3D elements and a place to put things that appear
// fixed to the screen (heads-up-display)
var renderer = new THREE.CSS3DArgonRenderer();
app.view.element.appendChild(renderer.domElement);

// Tell argon what local coordinate system you want.  The default coordinate
// frame used by Argon is Cesium's FIXED frame, which is centered at the center
// of the earth and oriented with the earth's axes.
// The FIXED frame is inconvenient for a number of reasons: the numbers used are
// large and cause issues with rendering, and the orientation of the user's "local
// view of the world" is different that the FIXED orientation (my perception of "up"
// does not correspond to one of the FIXED axes).
// Therefore, Argon uses a local coordinate frame that sits on a plane tangent to
// the earth near the user's current location.  This frame automatically changes if the
// user moves more than a few kilometers.
// The EUS frame cooresponds to the typical 3D computer graphics coordinate frame, so we use
// that here.  The other option Argon supports is localOriginEastNorthUp, which is
// more similar to what is used in the geospatial industry
app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);
// creating 6 divs to indicate the x y z positioning

var divEast = document.createElement('div');
var divEastFrame = document.createElement('iframe');
divEastFrame.setAttribute("src","http://ask.metafilter.com/");
divEast.appendChild(divEastFrame);

var divWest = document.createElement('div');
var divWestFrame = document.createElement('iframe');
divWestFrame.setAttribute("src","http://metatalk.metafilter.com/");
divWest.appendChild(divWestFrame);

var divSouth = document.createElement('div');
var divSouthFrame = document.createElement('iframe');
divSouthFrame.setAttribute("src","http://www.metafilter.com");
divSouth.appendChild(divSouthFrame);

var divNorth = document.createElement('div');
divNorth.setAttribute("style","pointer-events: auto !important;");
// var divNorthButton = document.createElement('button');
// divNorthButton.innerText = 'button';
// divNorth.appendChild(divNorthButton);
var divNorthFrame = document.createElement('iframe');
divNorthFrame.setAttribute("src","http://fanfare.metafilter.com/");
divNorthFrame.setAttribute("style","pointer-events: auto !important;");
divNorth.appendChild(divNorthFrame);


// Put content in each one  (should do this as a couple of functions)
divEast.className = "cssContent";
divWest.className = "cssContent";
divSouth.className = "cssContent";
divNorth.className = "cssContent";

// create 6 CSS3DObjects in the scene graph.  The CSS3DObject object
// is used by the CSS3DArgonRenderer. Because an HTML element can only
// appear once in the DOM, we need two elements to create a stereo view.
// The CSS3DArgonRenderer manages these for you, using the CSS3DObject.
// You can pass a single DIV to the CSS3DObject, which
// will be cloned to create a second matching DIV in stereo mode, or you
// can pass in two DIVs in an array (one for the left and one for the
// right eyes).  If the content of the DIV does not change as the
// application runs, letting the CSS3DArgonRenderer clone them is
// simplest.  If it is changing, passing in two and updating both
// yourself is simplest.
var cssEast = new THREE.CSS3DObject(divEast);
var cssWest = new THREE.CSS3DObject(divWest);
var cssSouth = new THREE.CSS3DObject(divSouth);
var cssNorth = new THREE.CSS3DObject(divNorth);

var rad = function(degrees) {
  return Math.PI * degrees / 180;
};

var baseDistance = 1000.0;

// east
cssEast.position.x = baseDistance * Math.cos(rad(45));
cssEast.position.y = -baseDistance * Math.cos(rad(45));
cssEast.position.z = 0;

// cssEast.rotation.x = rad(-45);
// cssEast.rotation.y = rad(315);
// cssEast.rotation.z = rad(45);

// west
cssWest.position.x = -baseDistance * Math.cos(rad(45));
cssWest.position.y = -baseDistance * Math.cos(rad(45));
cssWest.position.z = 0;

// cssWest.rotation.x = rad(0);
// cssWest.rotation.y = rad(135);
// cssWest.rotation.z = rad(0);

// south
cssSouth.position.x = 0;
cssSouth.position.y = -baseDistance * Math.cos(rad(45));
cssSouth.position.z = baseDistance * Math.cos(rad(45));

// cssSouth.rotation.x = rad(-45);
// cssSouth.rotation.y = rad(215);
// cssSouth.rotation.z = rad(45);

// north
cssNorth.position.x = 0;
// cssNorth.position.y = -baseDistance * Math.cos(rad(45));
cssNorth.position.z = -baseDistance * Math.cos(rad(45));

// cssNorth.rotation.x = rad(-45);
// cssNorth.rotation.y = rad(45);
// cssNorth.rotation.z = rad(45);

userLocation.add(cssEast);
userLocation.add(cssWest);
userLocation.add(cssSouth);
userLocation.add(cssNorth);


// cssWest.rotation = new THREE.Euler( 0, 0, 0, 'XZY' );

cssEast.rotateY(rad(270));
cssWest.rotateY(rad(90));
cssSouth.rotateY(rad(180));
cssNorth.rotateY(rad(0));

cssEast.rotateX(rad(-45));
cssWest.rotateX(rad(-45));
cssSouth.rotateX(rad(-45));
// cssNorth.rotateX(rad(-45));

// cssSouth.rotation.y = rad(180);

// the updateEvent is called each time the 3D world should be
// rendered, before the renderEvent.  The state of your application
// should be updated here.
app.updateEvent.addEventListener(function () {
    // get the position and orientation (the "pose") of the user
    // in the local coordinate frame.
    var userPose = app.context.getEntityPose(app.context.user);
    // assuming we know the user's pose, set the position of our
    // THREE user object to match it
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(userPose.position);
    }
});
// for the CSS renderer, we want to use requestAnimationFrame to
// limit the number of repairs of the DOM.  Otherwise, as the
// DOM elements are updated, extra repairs of the DOM could be
// initiated.  Extra repairs do not appear to happen within the
// animation callback.
var viewport = null;
var subViews = null;
var rAFpending = false;
app.renderEvent.addEventListener(function () {
    // only schedule a new callback if the old one has completed
    if (!rAFpending) {
        rAFpending = true;
        viewport = app.view.getViewport();
        subViews = app.view.getSubviews();
        window.requestAnimationFrame(renderFunc);
    }
});
// the animation callback.
function renderFunc() {
    // if we have 1 subView, we're in mono mode.  If more, stereo.
    var monoMode = subViews.length == 1;
    rAFpending = false;
    // set the renderer to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both views if we are in stereo viewing mode
    renderer.setSize(viewport.width, viewport.height);

    // there is 1 subview in monocular mode, 2 in stereo mode
    for (var _i = 0, subViews_1 = subViews; _i < subViews_1.length; _i++) {
        var subview = subViews_1[_i];
        // set the position and orientation of the camera for
        // this subview
        camera.position.copy(subview.pose.position);
        camera.quaternion.copy(subview.pose.orientation);
        // the underlying system provide a full projection matrix
        // for the camera.  Use it, and then update the FOV of the
        // camera from it (needed by the CSS Perspective DIV)
        camera.projectionMatrix.fromArray(subview.projectionMatrix);
        camera.fov = subview.frustum.fovy * 180 / Math.PI;
        // set the viewport for this view
        var _a = subview.viewport, x = _a.x, y = _a.y, width = _a.width, height = _a.height;
        renderer.setViewport(x, y, width, height, subview.index);
        // render this view.
        renderer.render(scene, camera, subview.index);
        
    }
}

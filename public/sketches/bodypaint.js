// KNN Classification on Webcam Images with poseNet

// labels (feel free to add more)
let labels = [
  "A",
  "B",
  "C"
];

let prevX, prevY;
let ex, ey;
let firstLoop = true;

let w = 15;
let o = 1;

let timer;

let ra= 0;

let myColor;

var socket;

// webcam
let video;
let flippedVideo;
let videoWidth = 160;
let videoHeight = videoWidth/4*3;

// poseNet
let poseNet;
let poses = [];

// Create a KNN classifier
const knnClassifier = ml5.KNNClassifier();
let inputData = []; // get values in 'gotResultModel'
let predictions = [];
let mostPredictedClass = "";
let biggestPredictedClass = "";
let valueMostPredictedClass = 0.0;

function setup() {
  socket = io.connect();
  socket.on('mouse', newDrawing);
  // canvas
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvas');
  // generate gui
  generateGui(labels);

  // init webcam
  video = createCapture(VIDEO);
  video.size(videoWidth, videoHeight);
  video.hide();

  // init poseNet Model, see https://github.com/tensorflow/tfjs-models/tree/master/posenet
  // flip horizontal und just pose of one person
  poseNet = ml5.poseNet(video, {
    flipHorizontal: true,
    detectionType: 'single'
  }, modelReady);
  select('#output').html('... loading model');

  // detect if new pose detected and call 'gotResultModel'
  poseNet.on('pose', gotResultsModel);
  loadKNN();

  //set my color (HSV!)
  myColor = [random(0, 360), 95, 95];

  timer = 5;

}

function draw() {
  // clear background
  //background(255);
  //clear upper area
  fill(255);
  noStroke();
  
  // show video (flipped)
  
  push();
  translate(videoWidth, 0);
  scale(-1, 1);
  videoImg = image(video, 0, 0, videoWidth, videoHeight);
  pop();
  

  // show results of poseNet
  /*drawKeypoints();
  drawSkeleton();*/

  if (mostPredictedClass == "C") {

      timer++;
      w = w + o ;
      if (w > 30) {
        o = -1;
      }
        if (w < 5) {
          o = 1;
        }
  
    }


   console.log(mostPredictedClass);

  //drawStickman(poses, myColor, 0);

  drawWithYourFace();
  fillInSpaces(prevX, prevY, ex, ey, myColor[0], myColor[1], myColor[2],w);

  //setting current x,y to previous x,y 
  prevX = ex;
  prevY = ey;

  if (ra == 100) {
    classify();
   }
   ra++

}


function drawWithYourFace() {
  for(let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;
    let nose = pose.nose;
    if (nose.confidence > 0.2) {
      //nose relative position to canvas
      ex = nose.x/videoWidth * width;
      ey = nose.y/videoHeight * height;
      if(firstLoop) {
        prevX = ex; 
        prevY = ey;
        firstLoop = false;
      }
      sendmouse(ex, ey,w);
      noStroke();
      colorMode(HSB);
      fill(myColor[0], myColor[1], myColor[2]);
      colorMode(RGB);
      ellipse(ex, ey, w, w);
    }
  }



}

function fillInSpaces(fx, fy, pfx, pfy, r, g, b,w) { //tries to fill in spaces between ellipses with a line 
  colorMode(HSB);
  stroke(r, g, b);
  strokeWeight(w);
  noFill();
  line(pfx, pfy, fx, fy);
  colorMode(RGB);
}

/*function drawStickman(p, c, s) {
  drawHead(p, c, s);
  drawBody(p, c, s);
}

function drawHead(p, c, s) {
  for(let i = 0; i < p.length; i++) {
    let pose = p[i].pose;
    let nose = pose.nose;
    let lEar = pose.leftEar;
    let rEar = pose.rightEar;
    let headRadius;
    
    if(lEar.confidence > 0.2 && rEar.confidence > 0.2) {
      headRadius = dist(lEar.x, lEar.y, rEar.x, rEar.y);
    }
    else {
      headRadius = 0;
    }

    if (nose.confidence > 0.2 && headRadius > 0 && nose.y+headRadius < 160) {
      fill(c[0], c[1], c[2]);
      noStroke();
      ellipse(nose.x+s, nose.y, headRadius, headRadius);
    }
  }
  drawFace(p, s);
}

function drawFace(p, s) {
  for(let i = 0; i < p.length; i++) {
    let pose = p[i].pose;
    let facePoints = [pose.rightEye, pose.leftEye];

    for(let i = 0; i < facePoints.length; i++) {
      if(facePoints[i].confidence > 0.2) {
        fill(0, 0, 0);
        noStroke();
        ellipse(facePoints[i].x+s, facePoints[i].y, 10, 10);
      }
    }
  }
}

function drawBody(p, c, s) {
   // loop through all the skeletons detected
   for (let i = 0; i < p.length; i++) {
    let skeleton = p[i].skeleton;
    // for every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(c[0], c[1], c[2]);
      strokeWeight(4);
      line(partA.position.x+s, partA.position.y, partB.position.x+s, partB.position.y);
    }
  }
}*/


function sendmouse(xpos, ypos,w) {
  // We are sending!
  //console.log("sendmouse: " + xpos + " " + ypos);
  
  // Make a little object with x and y
  let data = {
    x: xpos,
    y: ypos,
    pX: prevX,
    pY: prevY,
    color: myColor,
    pose: poses,
    wi: w
  };

  // Send that object to the socket
  socket.emit('mouse', data);
}

function newDrawing(data){
  colorMode(HSB);
  noStroke();
  fill(data.color[0], data.color[1], data.color[2]);
  ellipse(data.x,data.y,data.wi,data.wi);
  fillInSpaces(data.pX, data.pY, data.x, data.y, data.color[0], data.color[1], data.color[2],data.wi);
  colorMode(RGB);
  //drawStickman(data.pose, data.color, videoWidth);
}


// model ready
function modelReady() {
  select('#output').html('model loaded');
}

// results of current model (p.ex. PoseNet, handpose, facemesh...)
function gotResultsModel(result) {
  poses = result;
  // just update input data if new input data available
  if (poses.length > 0) {
    inputData = poses[0].pose.keypoints.map(p => [p.score, p.position.x, p.position.y]);
    // console.log(inputData);
  }
}

///////////////////////////
// Visualization PoseNet //
///////////////////////////

// draw ellipses over the detected keypoints
function drawKeypoints() {
  // loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // for each pose detected, loop through all the keypoints
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      // a keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = pose.keypoints[j];
      // only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        fill(0, 255, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
}

// draw the skeletons
function drawSkeleton() {
  // loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    let skeleton = poses[i].skeleton;
    // for every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(0, 255, 0);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}

/////////////////////////////////////
// KNN CLASSIFICTATION STARTS HERE //
/////////////////////////////////////


// Add the current frame from the video to the classifier
function addExample(label) {

  // Add an example (= input data) with a label to the classifier
  if (inputData.length > 0) {
    knnClassifier.addExample(inputData, label);
  }

  // update counts
  updateCounts();

}

// Predict the current frame.
function classify() {

  // if there are no labels through error and return
  if (knnClassifier.getNumLabels() <= 0) {
    console.error('There is no examples in any label');
    return;
  }

  // Use knnClassifier to classify which label do these features belong to
  if (inputData.length > 0) {
    knnClassifier.classify(inputData, gotResults);
  }
  print("CLASSIFYING");
}


// Show the results
function gotResults(err, result) {

  // Display any error
  if (err) {
    console.error(err);
  }

  if (result.confidencesByLabel) {

    const confidences = result.confidencesByLabel; // array object

    // get key/label highest values and its value
    let keyHighestValue = Object.keys(confidences).reduce((a, b) => confidences[a] > confidences[b] ? a : b);
    mostPredictedClass = keyHighestValue;
 
    valueMostPredictedClass = confidences[keyHighestValue];

    // get confidence for each class
    for (let i = 0; i < labels.length; i++) {
      let confidence = confidences[labels[i]];
      predictions[i] = confidence;

   
    }
  }

  // classify again
  classify();
}


// Save dataset as myKNNDataset.json
function saveKNN() {
  knnClassifier.save('myKNNDataset');
}

// Load dataset to the classifier
function loadKNN() {
  knnClassifier.load('data/myKNNDataset.json', updateCounts);
}

// Update the example count for each label	
function updateCounts() {

  const counts = knnClassifier.getCountByLabel();

  for (let i = 0; i < labels.length; i++) {
    select('#counter_' + labels[i]).html(counts[labels[i]] || 0);
  }
}

// Clear the examples in one label
function clearLabel(classLabel) {
  if (knnClassifier.getNumLabels() <= 0) {
    console.error('There is no examples in any label');
    return;
  }
  knnClassifier.clearLabel(classLabel);
  updateCounts();
}

// Clear all the examples in all labels
function clearAllLabels() {
  if (knnClassifier.getNumLabels() <= 0) {
    console.error('There is no examples in any label');
    return;
  }
  knnClassifier.clearAllLabels();
  updateCounts();
}

/////////////////
// generate gui //
//////////////////
function generateGui(lc) {

  // main gui
  const gui_main = createDiv().parent('gui');

  // load
  const loadButton = createButton("Load Dataset").parent(gui_main);
  loadButton.class("button");
  loadButton.mousePressed(function () {
    loadKNN();
  });

  // save
  const saveButton = createButton("Save Dataset").parent(gui_main);
  saveButton.class("button");
  saveButton.mousePressed(function () {
    saveKNN();
  });

  // clear
  const clearButton = createButton("Clear Dataset").parent(gui_main);
  clearButton.class("button");
  clearButton.mousePressed(function () {
    clearAllLabels();
  });

  // predict
  const predictButton = createButton("Start Prediction").parent(gui_main);
  predictButton.class("button");
  predictButton.id("predict-button");
  predictButton.mousePressed(function () {
    classify();
  });

  // gui classes

  for (let i = 0; i < lc.length; i++) {

    // container buttons class
    const gui_class = createDiv().parent('gui');

    // add example button
    const add_example_button = createButton(lc[i]).parent(gui_class);
    add_example_button.html("Add an Example to Class " + lc[i]);
    add_example_button.class("button");
    add_example_button.mousePressed(function () {
      // add one example immediately
      addExample(lc[i]);
    });

    // clear examples button
    const clear_examples_button = createButton(lc[i]).parent(gui_class);
    clear_examples_button.html("Clear Class " + lc[i]);
    clear_examples_button.class("button");
    // add example while button pressed
    clear_examples_button.mousePressed(function () {
      clearLabel(lc[i]);
    });


    // counter examples
    const counter_examples = createSpan('0').parent(gui_class);
    counter_examples.class("text-gui");
    counter_examples.id("counter_" + lc[i]);

  }

  // debug
  const text_output = createDiv().parent('gui');
  text_output.id('output');
  text_output.html('...');
}
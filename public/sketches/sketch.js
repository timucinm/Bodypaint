// KNN Classification on Webcam Images with poseNet

// labels (feel free to add more)
let labels = [
  "A",
  "B",
  "C"
];

// webcam
let video;

// poseNet
let poseNet;
let poses = [];

// Create a KNN classifier
const knnClassifier = ml5.KNNClassifier();
let inputData = []; // get values in 'gotResultModel'
let predictions = [];
let mostPredictedClass = "";
let valueMostPredictedClass = 0.0;

let myFont, lightFont;

let mainPoseBlack, mainPoseRed, leftArm, leftArmTrans,
    rightArm, rightArmTrans, bothArm, bothArmTrans;

let timer;

function preload() {
  myFont = loadFont('assets/paintFont.otf');
  lightFont = loadFont('assets/lightFont.otf');

  bgIm = loadImage('assets/canvasIm.jpg');

  mainPoseBlack = loadImage('assets/mainPoseBlack.png');
  mainPoseRed = loadImage('assets/mainPoseRed.png');
  leftArm = loadImage('assets/leftArm.png');
  leftArmTrans = loadImage('assets/leftArmTrans.png');
  rightArm = loadImage('assets/rightArm.png');
  rightArmTrans = loadImage('assets/rightArmTrans.png');
  bothArm = loadImage('assets/bothArm.png');
  bothArmTrans = loadImage('assets/bothArmTrans.png');
}

function setup() {

  // canvas
  const canvas = createCanvas(1280, 720);
  canvas.parent('canvas');

  // // generate gui
  // generateGui(labels);

  // init webcam
  video = createCapture(VIDEO);
  video.size(width, height);
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
  textAlign(CENTER, CENTER);

  knnClassifier.load('data/myKNNDataset.json', updateCounts);

  timer = 5;
}

function draw() {
  
  // clear background
  imageMode(CENTER);
  background(0);
  image(bgIm, width / 2, height / 2, width, height);

  // show results of poseNet


  fill(0);
  noStroke();

  textFont(myFont);
  textSize(80);
  text("Body Paint", width / 2, 75);

  textFont(lightFont);
  textSize(50);
  text("Your face", width / 4 - 90, height / 2 + 120);
  text("Right arm", width / 4  * 3 + 75, height / 2 + 120);



  textSize(80);
  text("Keep both of your arms up to start!", width / 2, height - 80);

  image(mainPoseBlack, width / 4 - 90, height / 2 - 50, 250, 250);
  image(rightArmTrans, width / 4 * 3 + 90, height / 2 - 50, 250, 250);

  textSize(50);

  drawKeypoints();
  drawSkeleton();


  if(mostPredictedClass == "C") {
    if (valueMostPredictedClass = 1.0) {

    image(bgIm, width / 2, height / 2, width, height);
    image(bothArm, width / 2, height / 2 - 100, 500, 500);

    textFont(lightFont);
    textSize(80);
    text("Get Ready! " + timer, width / 2, height - 120);

    if(frameCount % 30 == 0 && timer > 0) {
      timer--;
      // console.log(timer);
    }
    else if (timer == 0) {                 
      redirectToPaint();
    }
  }
  }

  // textAlign(CENTER, CENTER);
  // textSize(56);
  // console.log(mostPredictedClass);
  // console.log(label);

}

function redirectToPaint() {
  window.location.href = "bodypaint.html";
}


function mouseMoved() { 
  classify();
}

// POSENET------------------------------------------------------------------------------------------------------------------------------------------------------

// model ready
function modelReady() {
  select('#output').html('model loaded');
  classify();
}

// results of current model (p.ex. PoseNet, handpose, facemesh...)
function gotResultsModel(result) {
  poses = result;
  // just update input data if new input data available
  if (poses.length > 0) {
    inputData = poses[0].pose.keypoints.map(p => [p.score, p.position.x, p.position.y]);
    //console.log(inputData);
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
        fill(255, 0, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
        // console.log(poses);
      }
      if (keypoint = pose.keypoints[0]) {
        if (keypoint.position.x < width/2) {
        image(mainPoseRed, width / 4 - 90, height / 2 - 50, 250, 250);
        text("is the brush", width / 4 - 90, height / 2 + 170);
      }
      if (keypoint.position.x > width/2) {
        image(rightArm, width / 4 * 3 + 90, height / 2 - 50, 250, 250);
        text("change the size", width / 4  * 3 + 75, height / 2 + 170);
      }
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
      stroke(255, 0, 0);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}

/////////////////////////////////////
// KNN CLASSIFICTATION STARTS HERE //
/////////////////////////////////////

// // Add the current input data to the classifier
function addExample(label) {

  // Add an example (= input data) with a label to the classifier
  if (inputData.length > 0) {
    knnClassifier.addExample(inputData, label);
  }

  // update counts
  updateCounts();

}

// Predict the current pose.
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
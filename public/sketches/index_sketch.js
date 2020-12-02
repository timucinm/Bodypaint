let drawX, guessX, buttonsY;
let bg;
let drawB, guessB;

var socket;
var dataIn;
let stat, wD;

let words = ["tree", "car", "lamp", "plate", "monitor", "dog"];
let word, answer;

var input;
var button;

let onButton;

var dataCopy;

let myFont, drawIm2, drawSe2, poseIm2, poseSe2, bgIm;

let chosen;

function preload() {
    myFont = loadFont('assets/paintFont.otf');
    bgIm = loadImage('assets/canvasIm.jpg');
    drawIm2 = loadImage('assets/draw2.png');
    drawSe2 = loadImage('assets/drawSelect2.png');
    poseIm2 = loadImage('assets/pose2.png');
    poseSe2 = loadImage('assets/poseSelect2.png');
}

function setup(){
    const canvas =  createCanvas(1280,720);
    // layout();

    canvas.parent('canvas');
    drawX = width / 4 - 50;
    guessX = width / 4  * 3;
    buttonsY = height / 2;

    bg = 0;

    drawB = false;
    guessB = false;
    onButton = true;

    chosen = false;

    rectMode(CENTER);
    imageMode(CENTER);
    textAlign(CENTER, CENTER);

    if(!chosen) {
        background(0);
        image(bgIm, width / 2, height / 2, width, height);

        textFont(myFont);
        fill(0);
        noStroke();

        textSize(80);
        text("Body Paint", width / 2, 75);

        textSize(50);
        text("Choose your role", width / 2, height / 2);
        text("Draw", width / 4 - 50, height - 100);
        text("Guess", width / 4  * 3, height - 100);

        image(drawIm2, drawX, buttonsY, 400, 400);
        image(poseIm2, guessX + 50, buttonsY + 20, 400, 400);
    }
 
    socket = io.connect('http://localhost:3000');
    socket.on('button', newDrawing);
    // socket.on('button', drawRes);

    word = random(words);
    dataIn = {stat: 0, wD: word};
}

function redirectToPaint() {
    window.location.href = "bodypaint.html";
    console.log("hi");
}

function redirectToGuess() {
    window.location.href = "guessing.html";
    console.log("hi");
}

function mousePressed(){
    console.log("word beg: " + dataIn.wD);
    //dataCopy = word;

    if (onButton){
        if(((mouseX > drawX - 100) && (mouseX < drawX + 100)) && 
        ((mouseY > buttonsY - 200) && (mouseY < buttonsY + 200))){
            console.log("draw");
            drawB = true;
            onButton = false;
            dataIn.stat = 1;
            chosen = true;
            redirectToPaint();

            // image(bgIm, width / 2, height / 2, width, height);
            // fill(0);
            // noStroke();
            // textSize(100);
            // text("Draw", width / 2, 75);
            // fill(255, 0, 0);
            // textSize(80);
            // text(data.wD, width / 2, 175);
        }

        if(((mouseX > guessX - 100) && (mouseX < guessX + 100)) && 
        ((mouseY > buttonsY - 200) && (mouseY < buttonsY + 200))){
            console.log("guess");
            guessB = true;
            onButton = false;
            dataIn.stat = 2;
            chosen = true;
            redirectToGuess();

            // image(bgIm, width / 2, height / 2, width, height);
            // fill(0);
            // noStroke();
            // textSize(100);
            // text("Guess", width / 2, 75);

            // input = createInput();
            // input.position(width / 2 - 70, 225);

            // button = createButton("submit");
            // button.position(width / 2 + 70, 225);
            // button.mousePressed(drawRes);
        }
        socket.emit('button', dataIn);
        
        console.log(dataIn);
    }
}

function newDrawing(dataIn) {
    if(dataIn.stat == 1) {
        console.log("guess");
        onButton = false;
        chosen = true;
        answer = dataIn.wD;
        redirectToGuess();
    }
    
    if(dataIn.stat == 2) {
        console.log("draw");
        onButton = false;
        chosen = true;
        answer = dataIn.wD;
        redirectToPaint();
    }

    console.log(dataIn);
}
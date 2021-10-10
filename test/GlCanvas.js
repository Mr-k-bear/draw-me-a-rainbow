import * as Rainbow from "../build/Rainbow.module.js";

let canvasDom = window.canvasDom = document.createElement("canvas");
let canvas = window.canvas = new Rainbow.GLCanvas(canvasDom);

let ctx = canvasDom.getContext("2d");

canvas.dom.className = "canvas-div";
document.body.appendChild(canvas.dom);

function render(){

    requestAnimationFrame(render);

    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(canvas.mouseUvX * canvas.width, canvas.mouseUvY * canvas.height, 10, 0, Math.PI*2);
    ctx.closePath();
    ctx.stroke();

    if(canvas.mouseDown) ctx.fill();
}

requestAnimationFrame(render);
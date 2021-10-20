import * as Rainbow from "../build/Rainbow.module.js";

window.Rainbow = Rainbow;

class Tester extends Rainbow.GLRenderer {

    constructor(){
        
        super();

        this.canvas.dom.className = "main";
        document.body.appendChild(this.canvas.dom);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.cleanColor = [147 / 255, 187 / 255, 219 / 255, 1];

        this.flutterShader = new Rainbow.FlutterShader(this.gl);
        this.rainbowShader = new Rainbow.RainbowShader(this.gl);

        this.planet = new Rainbow.Planet(this.gl);
        this.start = new Rainbow.Start(this.gl);
        this.rainbow = new Rainbow.Rainbow(this.gl);

        this.box = new Rainbow.TestBox(this.gl);
        this.axis = new Rainbow.TestAxis(this.gl);
        this.shader = new Rainbow.BasicsShader(this.gl);
        this.camera = new Rainbow.Camera(this.canvas);

        this.axis.r = 100;
        this.start.pos[0] = -1;
        this.planet.pos[0] = 1;

        // 开启自动绘制
        this.rainbow.autoDraw();
        // this.rainbow.testDrawBezierPoint();

        this.canvas.addListener("resize", ()=>{
            this.render();
        });

        this.canvas.addListener("mousemove", ()=>{

            // 相机旋转
            if (this.canvas.mouseDown)
            this.camera.ctrl(this.canvas.mouseMotionX, this.canvas.mouseMotionY);

            // 射线追踪
            let [o, p] = this.camera.rayTrack(
                this.canvas.mouseGlX, this.canvas.mouseGlY
            );

        })
    }

    render(t){

        this.gl.viewport(0,0,this.canvas.width,this.canvas.height);

        this.clean();

        this.camera.generateMat();

        this.planet.update(t);
        this.start.update(t);
        this.rainbow.update(t);

        this.planet.draw(this.camera, this.flutterShader);
        this.start.draw(this.camera, this.flutterShader);
        this.rainbow.draw(this.camera, this.rainbowShader);
        
        this.box.draw(this.camera, this.shader);
        this.axis.draw(this.camera, this.shader);
        
    }
}

let tester = window.tester = new Tester();
let clock = window.clock = new Rainbow.Clock();

clock.setFn(tester.render.bind(tester));
clock.useStats();
clock.run();
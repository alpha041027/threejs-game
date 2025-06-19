/* 1111111111111111111111
 * 颜色常量定义
 * 用于统一管理3D对象的材质颜色
 */
var Colors = {
    red: 0x96514d,        // 棕红（温和警示色，代替鲜红色）
    white: 0xf5f0e1,      // 米白（柔和背景色或字体色）
    brown: 0x6e4b1f,      // 深棕（树干、地面、飞机机身）
    brownDark: 0x3e2b12,  // 深褐（阴影、金属结构）
    pink: 0xc5a27e,       // 肤色米棕（自然皮肤或木纹装饰）
    yellow: 0xd7b36a,     // 枯叶黄（金币、能量条、亮点）
    blue: 0x4a7c59        // 森林绿（森林背景/能量晶体）
};


/* 
 * 游戏全局变量
 * 管理游戏状态和性能计时
 */
var game;               // 游戏状态对象
var deltaTime = 0;      // 帧间隔时间(ms)
var newTime = new Date().getTime();  // 当前帧时间戳
var oldTime = new Date().getTime();  // 上一帧时间戳

// 对象池(优化性能)
var ennemiesPool = [];  // 敌人对象池
var particlesPool = []; // 粒子对象池
var particlesInUse = [];// 使用中的粒子

/**
 * 重置游戏状态
 * 初始化所有游戏参数为默认值
 */
function resetGame(){
  game = {
    // 速度相关参数
    speed:0,                      // 当前实际速度
    initSpeed:.00035,             // 初始速度
    baseSpeed:.00035,             // 基础速度
    targetBaseSpeed:.00035,       // 目标基础速度
    incrementSpeedByTime:.0000025,// 随时间增加的速度
    incrementSpeedByLevel:.000005,// 随等级增加的速度
    distanceForSpeedUpdate:100,   // 速度更新间隔距离
    speedLastUpdate:0,            // 上次速度更新时间戳

      // 距离和能量相关参数
    distance:0,                   // 飞行总距离
    ratioSpeedDistance:50,        // 速度到距离的转换系数
    energy:100,                   // 当前能量值(0-100)
    ratioSpeedEnergy:3,            // 速度对能量消耗的影响系数

    // 等级系统
    level:1,                      // 当前等级
    levelLastUpdate:0,            // 上次等级更新时间戳
    distanceForLevelUpdate:1000,  // 等级提升所需距离

    // 飞机相关参数
          planeDefaultHeight:100,
          planeAmpHeight:80,
          planeAmpWidth:75,
          planeMoveSensivity:0.005,
          planeRotXSensivity:0.0008,
          planeRotZSensivity:0.0004,
          planeFallSpeed:.001,
          planeMinSpeed:1.2,
          planeMaxSpeed:1.6,
          planeSpeed:0,
          planeCollisionDisplacementX:0,
          planeCollisionSpeedX:0,

          planeCollisionDisplacementY:0,
          planeCollisionSpeedY:0,

    // 海洋相关参数
          seaRadius:600,
          seaLength:800,
          //seaRotationSpeed:0.006,
          wavesMinAmp : 5,
          wavesMaxAmp : 20,
          wavesMinSpeed : 0.001,
          wavesMaxSpeed : 0.003,
    
          cameraFarPos:500,
          cameraNearPos:150,
          cameraSensivity:0.002,

    // 硬币和敌人相关参数
          coinDistanceTolerance:15,
          coinValue:3,
          coinsSpeed:.5,
          coinLastSpawn:0,
          distanceForCoinsSpawn:100,

          comboCount: 0,        // 当前Combo计数
          comboTimer: 0,         // 剩余Combo时间
          comboDuration :1500,   // Combo有效时间（毫秒）
          maxCombo:0,           // 记录历史最大Combo


          ennemyDistanceTolerance:10,
          ennemyValue:10,
          ennemiesSpeed:.6,
          ennemyLastSpawn:0,
          distanceForEnnemiesSpawn:50,

          status : "playing",
         };
  fieldLevel.innerHTML = Math.floor(game.level);
}

//THREEJS相关变量

var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane,
    renderer,
    container,
    controls;

//SCREEN & MOUSE

var HEIGHT, WIDTH,
    mousePos = { x: 0, y: 0 };

//初始化--ThreeJs,屏幕和鼠标事件

function createScene() {

  // 获取窗口的高度和宽度
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  // 创建场景
  scene = new THREE.Scene();

  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 50;
  nearPlane = .1;
  farPlane = 10000;
  // 创建透视相机
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
    );
  // 设置场景雾效
  scene.fog = new THREE.Fog(0xf7d9aa, 100,950);
  // 设置相机位置
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = game.planeDefaultHeight;
  //camera.lookAt(new THREE.Vector3(0, 400, 0));

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);

  // 启用阴影贴图
  renderer.shadowMap.enabled = true;

  container = document.getElementById('world');
  // 将渲染器的 DOM 元素添加到容器中
  container.appendChild(renderer.domElement);

  // 监听窗口大小变化事件
  window.addEventListener('resize', handleWindowResize, false);

  /*
  // 创建轨道控制器
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  // 设置控制器最小极角
  controls.minPolarAngle = -Math.PI / 2;
  // 设置控制器最大极角
  controls.maxPolarAngle = Math.PI ;

  //controls.noZoom = true;
  //controls.noPan = true;
  //*/
}

// MOUSE AND SCREEN EVENTS

function handleWindowResize() {
  // 获取窗口高度
  HEIGHT = window.innerHeight;
  // 获取窗口宽度
  WIDTH = window.innerWidth;
  // 设置渲染器大小
  renderer.setSize(WIDTH, HEIGHT);
  // 更新相机宽高比
  camera.aspect = WIDTH / HEIGHT;
  // 更新相机投影矩阵
  camera.updateProjectionMatrix();
}

function handleMouseMove(event) {
  // 将鼠标位置转换为纹理坐标

  var tx = -1 + (event.clientX / WIDTH)*2;
  var ty = 1 - (event.clientY / HEIGHT)*2;

  // 将转换后的坐标赋值给 mousePos 对象
  mousePos = {x:tx, y:ty};
}

function handleTouchMove(event) {
    event.preventDefault();
    var tx = -1 + (event.touches[0].pageX / WIDTH)*2;
    var ty = 1 - (event.touches[0].pageY / HEIGHT)*2;

    // 将触摸点坐标保存到mousePos对象中
    mousePos = {x:tx, y:ty};
}

function handleMouseUp(event){
  // 判断游戏状态是否为等待重玩状态
  if (game.status == "waitingReplay"){
    // 重置游戏
    resetGame();
    // 隐藏重玩按钮
    hideReplay();
  }
}


function handleTouchEnd(event){
  // 如果游戏状态为等待重玩
  if (game.status == "waitingReplay"){
    // 重置游戏
    resetGame();
    // 隐藏重玩按钮
    hideReplay();
  }
}

// 光源

var ambientLight, hemisphereLight, shadowLight;

function createLights() {

  // 创建半球光源
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)

  // 创建环境光
  ambientLight = new THREE.AmbientLight(0xdc8874, .5);

  // 创建方向光源
  shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;

  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 4096;
  shadowLight.shadow.mapSize.height = 4096;

  // 创建投影相机的辅助工具
  var ch = new THREE.CameraHelper(shadowLight.shadow.camera);
  //scene.add(ch);// 将辅助工具添加到场景中

  scene.add(hemisphereLight);
  scene.add(shadowLight);
  scene.add(ambientLight);

}


/**
 * 飞行员模型类
 * 构建飞机驾驶员的3D模型
 */
var Pilot = function(){
  this.mesh = new THREE.Object3D();  // 创建空容器对象
  this.mesh.name = "pilot";          // 设置对象名称(调试用)
  this.angleHairs=0;                // 头发动画角度

  //身体
  var bodyGeom = new THREE.BoxGeometry(15,15,15);
  var bodyMat = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
  var body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(2,-12,0);

  this.mesh.add(body);

  //脸部
  var faceGeom = new THREE.BoxGeometry(10,10,10);
  var faceMat = new THREE.MeshLambertMaterial({color:Colors.pink});
  var face = new THREE.Mesh(faceGeom, faceMat);
  this.mesh.add(face);

  //头发
  var hairGeom = new THREE.BoxGeometry(4,4,4);
  var hairMat = new THREE.MeshLambertMaterial({color:Colors.brown});
  var hair = new THREE.Mesh(hairGeom, hairMat);
  hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,0));
  var hairs = new THREE.Object3D();

  this.hairsTop = new THREE.Object3D();

  for (var i=0; i<12; i++){
    var h = hair.clone();
    var col = i%3;
    var row = Math.floor(i/3);
    var startPosZ = -4;
    var startPosX = -4;
    h.position.set(startPosX + row*4, 0, startPosZ + col*4);
    h.geometry.applyMatrix(new THREE.Matrix4().makeScale(1,1,1));
    this.hairsTop.add(h);
  }
  hairs.add(this.hairsTop);

  var hairSideGeom = new THREE.BoxGeometry(12,4,2);
  hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6,0,0));
  var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
  var hairSideL = hairSideR.clone();
  hairSideR.position.set(8,-2,6);
  hairSideL.position.set(8,-2,-6);
  hairs.add(hairSideR);
  hairs.add(hairSideL);

  var hairBackGeom = new THREE.BoxGeometry(2,8,10);
  var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
  hairBack.position.set(-1,-4,0)
  hairs.add(hairBack);
  hairs.position.set(-5,5,0);

  this.mesh.add(hairs);

  //眼镜
  var glassGeom = new THREE.BoxGeometry(5,5,5);
  var glassMat = new THREE.MeshLambertMaterial({color:Colors.brown});
  var glassR = new THREE.Mesh(glassGeom,glassMat);
  glassR.position.set(6,0,3);
  var glassL = glassR.clone();
  glassL.position.z = -glassR.position.z

  var glassAGeom = new THREE.BoxGeometry(11,1,11);
  var glassA = new THREE.Mesh(glassAGeom, glassMat);
  this.mesh.add(glassR);
  this.mesh.add(glassL);
  this.mesh.add(glassA);

  //耳朵
  var earGeom = new THREE.BoxGeometry(2,3,2);
  var earL = new THREE.Mesh(earGeom,faceMat);
  earL.position.set(0,0,-6);
  var earR = earL.clone();
  earR.position.set(0,0,6);
  this.mesh.add(earL);
  this.mesh.add(earR);
}

// 更新头发动画
Pilot.prototype.updateHairs = function(){
  //*
   var hairs = this.hairsTop.children;

   var l = hairs.length;
   for (var i=0; i<l; i++){
      var h = hairs[i];
      h.scale.y = .75 + Math.cos(this.angleHairs+i/3)*.25;
   }
  this.angleHairs += game.speed*deltaTime*40;
  //*/
}

/**
 * 飞机模型类
 * 构建完整的3D飞机模型(包含机身、机翼、螺旋桨等)
 */
var AirPlane = function(){
  this.mesh = new THREE.Object3D();  // 创建空容器对象
  this.mesh.name = "airPlane";       // 设置对象名称(调试用)

  /* 驾驶舱（cabin） */
  var geomCabin = new THREE.BoxGeometry(80,50,50,1,1,1);  // 创建立方体几何
  var matCabin = new THREE.MeshPhongMaterial({
    color:Colors.red, 
    shading:THREE.FlatShading  // 使用平面着色(性能优化)
  });
//对部分顶点手动调整以制作倾斜或弯曲外形：
  geomCabin.vertices[4].y-=10;
  geomCabin.vertices[4].z+=20;
  geomCabin.vertices[5].y-=10;
  geomCabin.vertices[5].z-=20;
  geomCabin.vertices[6].y+=30;
  geomCabin.vertices[6].z+=20;
  geomCabin.vertices[7].y+=30;
  geomCabin.vertices[7].z-=20;

  var cabin = new THREE.Mesh(geomCabin, matCabin);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  this.mesh.add(cabin);

  /* 引擎 */
  var geomEngine = new THREE.BoxGeometry(20,50,50,1,1,1);  // 引擎几何体
  var matEngine = new THREE.MeshPhongMaterial({
    color:Colors.white, 
    shading:THREE.FlatShading
  });
  var engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 50;
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);

  // 尾翼

  var geomTailPlane = new THREE.BoxGeometry(15,20,5,1,1,1);
  var matTailPlane = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
  tailPlane.position.set(-40,20,0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  this.mesh.add(tailPlane);

  // 机翼

  var geomSideWing = new THREE.BoxGeometry(30,5,120,1,1,1);
  var matSideWing = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
  sideWing.position.set(0,15,0);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);

    //挡风玻璃
  var geomWindshield = new THREE.BoxGeometry(3,15,20,1,1,1);
  var matWindshield = new THREE.MeshPhongMaterial({color:Colors.white,transparent:true, opacity:.3, shading:THREE.FlatShading});;
  var windshield = new THREE.Mesh(geomWindshield, matWindshield);
  windshield.position.set(5,27,0);

  windshield.castShadow = true;
  windshield.receiveShadow = true;

  this.mesh.add(windshield);

  //螺旋桨
  //对部分顶点手动调整以制作倾斜或弯曲外形：
  var geomPropeller = new THREE.BoxGeometry(20,10,10,1,1,1);
  geomPropeller.vertices[4].y-=5;
  geomPropeller.vertices[4].z+=5;
  geomPropeller.vertices[5].y-=5;
  geomPropeller.vertices[5].z-=5;
  geomPropeller.vertices[6].y+=5;
  geomPropeller.vertices[6].z+=5;
  geomPropeller.vertices[7].y+=5;
  geomPropeller.vertices[7].z-=5;
  var matPropeller = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
  this.propeller = new THREE.Mesh(geomPropeller, matPropeller);

  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;

  //桨叶
  var geomBlade = new THREE.BoxGeometry(1,80,10,1,1,1);
  var matBlade = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
  //使用两个交叉桨叶实现动态旋转：

  var blade1 = new THREE.Mesh(geomBlade, matBlade);
  blade1.position.set(8,0,0);

  blade1.castShadow = true;
  blade1.receiveShadow = true;

  var blade2 = blade1.clone();
  blade2.rotation.x = Math.PI/2;

  blade2.castShadow = true;
  blade2.receiveShadow = true;

  this.propeller.add(blade1);
  this.propeller.add(blade2);
  this.propeller.position.set(60,0,0);
  this.mesh.add(this.propeller);

  //起落架
  var wheelProtecGeom = new THREE.BoxGeometry(30,15,10,1,1,1);
  var wheelProtecMat = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var wheelProtecR = new THREE.Mesh(wheelProtecGeom,wheelProtecMat);
  wheelProtecR.position.set(25,-20,25);
  this.mesh.add(wheelProtecR);

  var wheelTireGeom = new THREE.BoxGeometry(24,24,4);
  var wheelTireMat = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
  var wheelTireR = new THREE.Mesh(wheelTireGeom,wheelTireMat);
  wheelTireR.position.set(25,-28,25);

  var wheelAxisGeom = new THREE.BoxGeometry(10,10,6);
  var wheelAxisMat = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
  var wheelAxis = new THREE.Mesh(wheelAxisGeom,wheelAxisMat);
  wheelTireR.add(wheelAxis);

  this.mesh.add(wheelTireR);

  var wheelProtecL = wheelProtecR.clone();
  wheelProtecL.position.z = -wheelProtecR.position.z ;
  this.mesh.add(wheelProtecL);

  var wheelTireL = wheelTireR.clone();
  wheelTireL.position.z = -wheelTireR.position.z;
  this.mesh.add(wheelTireL);

  var wheelTireB = wheelTireR.clone();
  wheelTireB.scale.set(.5,.5,.5);
  wheelTireB.position.set(-35,-5,0);
  this.mesh.add(wheelTireB);
  //suspension 代表支撑结构，有轻微旋转模拟斜撑
  var suspensionGeom = new THREE.BoxGeometry(4,20,4);
  suspensionGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0,10,0))
  var suspensionMat = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var suspension = new THREE.Mesh(suspensionGeom,suspensionMat);
  suspension.position.set(-35,-5,0);
  suspension.rotation.z = -.3;
  this.mesh.add(suspension);

//将飞机驾驶员添加到飞机上，并调整位置和旋转角度：
  this.pilot = new Pilot();
  this.pilot.mesh.position.set(-10,27,0);
  this.mesh.add(this.pilot.mesh);


  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;

};

/**
 * 天空
 * 创建随机分布的云朵
 */
Sky = function(){
  this.mesh = new THREE.Object3D();  // 天空容器
  this.nClouds = 20;                // 云朵数量
  this.clouds = [];                // 存储所有云朵
  var stepAngle = Math.PI*2 / this.nClouds; // 计算云朵分布角度间隔，将云朵沿圆形轨道均匀分布，形成环状。
  for(var i=0; i<this.nClouds; i++){
    var c = new Cloud();
    this.clouds.push(c);
    var a = stepAngle*i;
    //h 表示云朵距圆心的半径位置，加入了 150～350 范围的浮动。
    var h = game.seaRadius + 150 + Math.random()*200;
    //将每个云朵放置在半径为 h 的圆周上，模拟天空环绕效果。
    c.mesh.position.y = Math.sin(a)*h;
    c.mesh.position.x = Math.cos(a)*h;
    //云朵在 Z 方向上进一步随机拉开距离，增加远近层次感。
    c.mesh.position.z = -300-Math.random()*500;
    c.mesh.rotation.z = a + Math.PI/2;
    var s = 1+Math.random()*2;
    c.mesh.scale.set(s,s,s);// 随机缩放每朵云
    this.mesh.add(c.mesh);
  }
}

//遍历每个云朵，让它自转或内部元素转动，模拟飘动效果。
Sky.prototype.moveClouds = function(){
  for(var i=0; i<this.nClouds; i++){
    var c = this.clouds[i];
    c.rotate();
  }
  this.mesh.rotation.z += game.speed*deltaTime;

}

/**
 * 海洋环境类
 * 创建带有波浪动画的海洋表面
 */
Sea = function(){
  // 使用圆柱体几何创建海洋表面
  var geom = new THREE.CylinderGeometry(
    game.seaRadius,    // 半径
    game.seaRadius,    // 顶部半径(与底部相同)
    game.seaLength,    // 高度(长度)
    40,               // 径向分段
    10                // 高度分段
  );
  // 旋转90度使圆柱体水平放置
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));

  //合并顶点并初始化波浪参数
  geom.mergeVertices();
  var l = geom.vertices.length;

  this.waves = [];

  for (var i=0;i<l;i++){
    var v = geom.vertices[i];
    //v.y = Math.random()*30;
    this.waves.push(
      {y:v.y,
       x:v.x,
       z:v.z,
       ang:Math.random()*Math.PI*2,//起始角度
       amp:game.wavesMinAmp + Math.random()*(game.wavesMaxAmp-game.wavesMinAmp),//幅度
       speed:game.wavesMinSpeed + Math.random()*(game.wavesMaxSpeed - game.wavesMinSpeed)//速度
      });
  };

  //半透明蓝色材质 + 平面着色
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.blue,
    transparent:true,
    opacity:.8,
    shading:THREE.FlatShading,

  });

  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.name = "waves";
  this.mesh.receiveShadow = true;

}

Sea.prototype.moveWaves = function (){
  var verts = this.mesh.geometry.vertices;
  var l = verts.length;
  for (var i=0; i<l; i++){
    var v = verts[i];
    var vprops = this.waves[i];
    // 沿 x/y 方向的正弦波动
    v.x =  vprops.x + Math.cos(vprops.ang)*vprops.amp;
    v.y = vprops.y + Math.sin(vprops.ang)*vprops.amp;
    // 更新角度
    vprops.ang += vprops.speed*deltaTime;
    //标记更新
    this.mesh.geometry.verticesNeedUpdate=true;
  }
}

//组合多个小立方体形成一团“云”
Cloud = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "cloud";
  var geom = new THREE.CubeGeometry(20,20,20);
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.white,

  });

  //随机生成 3 到 5 个小块组成一朵云。
  var nBlocs = 3+Math.floor(Math.random()*3);
  for (var i=0; i<nBlocs; i++ ){
    var m = new THREE.Mesh(geom.clone(), mat);
    m.position.x = i*15;
    m.position.y = Math.random()*10;
    m.position.z = Math.random()*10;
    m.rotation.z = Math.random()*Math.PI*2;
    m.rotation.y = Math.random()*Math.PI*2;
    var s = .1 + Math.random()*.9;
    m.scale.set(s,s,s);
    this.mesh.add(m);
    m.castShadow = true;
    m.receiveShadow = true;

  }
  //*/
}

//给云朵中每个子块加上轻微的随机旋转
Cloud.prototype.rotate = function(){
  var l = this.mesh.children.length;
  for(var i=0; i<l; i++){
    var m = this.mesh.children[i];
    m.rotation.z+= Math.random()*.005*(i+1);
    m.rotation.y+= Math.random()*.002*(i+1);
  }
}

/*--敌人系统--*/
//敌人类
Ennemy = function(){
  var geom = new THREE.TetrahedronGeometry(8,2);
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.red,
    shininess:0,
    specular:0xffffff,
    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
  this.mesh.castShadow = true;
  this.angle = 0;// 敌人当前在环绕圆上的角度
  this.dist = 0;// 敌人距离圆心的距离（海平面为圆心）
}

EnnemiesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.ennemiesInUse = []; // 当前激活的敌人数组
}
//生成敌人逻辑规则
/*
敌人数量随着游戏等级 game.level 增加；

使用对象池：优先从 ennemiesPool 中回收的敌人中取出复用；

如果对象池为空，就新建一个 Ennemy()； 
*/
EnnemiesHolder.prototype.spawnEnnemies = function(){
  var nEnnemies = game.level;

  for (var i=0; i<nEnnemies; i++){
    var ennemy;
    if (ennemiesPool.length) {
      ennemy = ennemiesPool.pop();
    }else{
      ennemy = new Ennemy();
    }

    //距离基于海洋半径与飞机高度范围浮动生成
    ennemy.angle = - (i*0.1);
    ennemy.distance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight-20);
    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;

    this.mesh.add(ennemy.mesh);
    this.ennemiesInUse.push(ennemy);
  }
}
//更新敌人状态并处理碰撞
EnnemiesHolder.prototype.rotateEnnemies = function(){
  for (var i=0; i<this.ennemiesInUse.length; i++){
    var ennemy = this.ennemiesInUse[i];
    ennemy.angle += game.speed*deltaTime*game.ennemiesSpeed;

    if (ennemy.angle > Math.PI*2) ennemy.angle -= Math.PI*2;

    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;
    ennemy.mesh.rotation.z += Math.random()*.1;
    ennemy.mesh.rotation.y += Math.random()*.1;

    //var globalEnnemyPosition =  ennemy.mesh.localToWorld(new THREE.Vector3());
    // 计算飞机与敌人的距离向量
    var diffPos = airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
    var d = diffPos.length();  // 获取实际距离
    
    // 碰撞检测(距离小于阈值)
    if (d<game.ennemyDistanceTolerance){
      // 生成碰撞粒子效果（红色）
      particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, Colors.red, 3);

      // 将敌人回收到对象池
      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      
      // 计算碰撞后飞机的反弹速度
      game.planeCollisionSpeedX = 100 * diffPos.x / d;
      game.planeCollisionSpeedY = 100 * diffPos.y / d;
      ambientLight.intensity = 2;  // 增强环境光(碰撞效果)

      removeEnergy();  // 减少能量
      i--;  // 调整循环索引
    }else if (ennemy.angle > Math.PI){
      //敌人绕过视野半圈后也会自动移除，回收到对象池。
      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      i--;
    }
  }
}

/*--粒子系统--*/

//粒子类
Particle = function(){
  var geom = new THREE.SphereGeometry(2, 8, 8);
  var mat = new THREE.MeshPhongMaterial({
    color:0x009999,
    shininess:0,
    specular:0xffffff,
    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
}

//触发爆炸动画
/*pos: 爆炸中心坐标；
color: 爆炸粒子的颜色（通常与击中的敌人颜色一致）；
scale: 初始粒子尺寸缩放；*/
Particle.prototype.explode = function(pos, color, scale){
  var _this = this;
  var _p = this.mesh.parent;

  this.mesh.material.color = new THREE.Color( color);
  this.mesh.material.needsUpdate = true;
  this.mesh.scale.set(scale, scale, scale);

  //随机生成目标位置
  var targetX = pos.x + (-1 + Math.random()*2)*50;
  var targetY = pos.y + (-1 + Math.random()*2)*50;
  //计算粒子移动速度，使其在指定时间内到达目标位置
  var speed = .6+Math.random()*.2;

  //TweenMax 制作动效
  TweenMax.to(this.mesh.rotation, speed, {x:Math.random()*12, y:Math.random()*12});
  TweenMax.to(this.mesh.scale, speed, {x:.1, y:.1, z:.1});
  TweenMax.to(this.mesh.position, speed, {x:targetX, y:targetY, delay:Math.random() *.1, ease:Power2.easeOut, onComplete:function(){
      if(_p) _p.remove(_this.mesh);//从场景中移除粒子
      _this.mesh.scale.set(1,1,1);// 恢复缩放
      particlesPool.unshift(_this); // 回收到粒子池中
    }});
}

ParticlesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.particlesInUse = [];//粒子池
}

//生成多个粒子
ParticlesHolder.prototype.spawnParticles = function(pos, density, color, scale){

  var nPArticles = density;
  for (var i=0; i<nPArticles; i++){
    var particle;
    if (particlesPool.length) {
      particle = particlesPool.pop();
    }else{
      particle = new Particle();
    }
    this.mesh.add(particle.mesh);
    particle.mesh.visible = true;
    var _this = this;
    particle.mesh.position.y = pos.y;
    particle.mesh.position.x = pos.x;
    particle.explode(pos,color, scale);
  }
}

/*--金币系统--*/
//金币类
Coin = function(){
  var geom = new THREE.TetrahedronGeometry(5,0);
  var mat = new THREE.MeshPhongMaterial({
    color:0x009999,
    shininess:0,
    specular:0xffffff,

    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

/*
coinsInUse: 当前场景中活跃的金币；
coinsPool: 金币对象池，避免频繁 new Coin()；
this.mesh: 所有金币都挂载在该 Object3D 上，方便统一管理。 */
CoinsHolder = function (nCoins){
  this.mesh = new THREE.Object3D();
  this.coinsInUse = [];
  this.coinsPool = [];
  for (var i=0; i<nCoins; i++){
    var coin = new Coin();
    this.coinsPool.push(coin);
  }
}

//生成金币逻辑
CoinsHolder.prototype.spawnCoins = function(){

  var nCoins = 1 + Math.floor(Math.random()*10);//随机生成金币数量（1~10）
  var d = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight-20);
  var amplitude = 10 + Math.round(Math.random()*10);

  for (var i=0; i<nCoins; i++){
    var coin;
    if (this.coinsPool.length) {
      coin = this.coinsPool.pop();
    }else{
      coin = new Coin();
    }
    this.mesh.add(coin.mesh);
    this.coinsInUse.push(coin);
    coin.angle = - (i*0.02);
    coin.distance = d + Math.cos(i*.5)*amplitude;

    coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)*coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
  }
}

//更新金币状态（每帧调用）
CoinsHolder.prototype.rotateCoins = function(){
  for (var i=0; i<this.coinsInUse.length; i++){
    var coin = this.coinsInUse[i];
    if (coin.exploding) continue;
    coin.angle += game.speed*deltaTime*game.coinsSpeed;
    if (coin.angle>Math.PI*2) coin.angle -= Math.PI*2;
    coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)*coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
    coin.mesh.rotation.z += Math.random()*.1;
    coin.mesh.rotation.y += Math.random()*.1;

    //var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
    var diffPos = airplane.mesh.position.clone().sub(coin.mesh.position.clone());
    var d = diffPos.length();
    //碰撞检测（飞机 vs 金币）
    if (d<game.coinDistanceTolerance){
      this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
      this.mesh.remove(coin.mesh);
      particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0x009999, .8);
      addEnergy();
      i--;
    }else if (coin.angle > Math.PI){
      //金币飞出视野则回收到池中
      this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
      this.mesh.remove(coin.mesh);
      i--;
    }
  }
}


// 在场景中创建模型
var sea;
var airplane;

function createPlane(){
  airplane = new AirPlane();
  airplane.mesh.scale.set(.25,.25,.25);
  airplane.mesh.position.y = game.planeDefaultHeight;
  scene.add(airplane.mesh);
}

function createSea(){
  sea = new Sea();
  sea.mesh.position.y = -game.seaRadius;
  scene.add(sea.mesh);
}

function createSky(){
  sky = new Sky();
  sky.mesh.position.y = -game.seaRadius;
  scene.add(sky.mesh);
}

function createCoins(){

  coinsHolder = new CoinsHolder(20);
  scene.add(coinsHolder.mesh)
}

function createEnnemies(){
  for (var i=0; i<10; i++){
    var ennemy = new Ennemy();
    ennemiesPool.push(ennemy);
  }
  ennemiesHolder = new EnnemiesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(ennemiesHolder.mesh)
}

function createParticles(){
  for (var i=0; i<10; i++){
    var particle = new Particle();
    particlesPool.push(particle);
  }
  particlesHolder = new ParticlesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(particlesHolder.mesh)
}

/**
 * 游戏主循环
 * 每帧执行，处理游戏逻辑和渲染
 */
function loop(){
  // 计算帧间隔时间(用于平滑动画)
  newTime = new Date().getTime();
  deltaTime = newTime-oldTime;
  oldTime = newTime;

  if (game.status=="playing"){  // 游戏进行中状态

    /* 每100米生成能量晶体 */
    if (Math.floor(game.distance)%game.distanceForCoinsSpawn == 0 && 
        Math.floor(game.distance) > game.coinLastSpawn){
      game.coinLastSpawn = Math.floor(game.distance);
      coinsHolder.spawnCoins();  // 调用晶体生成方法
    }

    // 提升速度
    if (Math.floor(game.distance)%game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate){
      game.speedLastUpdate = Math.floor(game.distance);
      game.targetBaseSpeed += game.incrementSpeedByTime*deltaTime;
    }

    //生成敌人
    if (Math.floor(game.distance)%game.distanceForEnnemiesSpawn == 0 && Math.floor(game.distance) > game.ennemyLastSpawn){
      game.ennemyLastSpawn = Math.floor(game.distance);
      ennemiesHolder.spawnEnnemies();
    }
    //升级
    if (Math.floor(game.distance)%game.distanceForLevelUpdate == 0 && Math.floor(game.distance) > game.levelLastUpdate){
      game.levelLastUpdate = Math.floor(game.distance);
      game.level++;
      fieldLevel.innerHTML = Math.floor(game.level);

      game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel*game.level
    }

    if (game.comboTimer > 0){
      game.comboTimer -= deltaTime;
      if (game.comboTimer <= 0){
        game.comboCount = 0;
        hideComboMessage();  // Combo失效时隐藏
      }
    }


    //实时更新飞机位置、能量、速度
    updatePlane();
    updateDistance();
    updateEnergy();
    game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;//平滑过渡
    game.speed = game.baseSpeed * game.planeSpeed;//飞机最终速度

  }//游戏结束状态
  else if(game.status=="gameover"){
    game.speed *= .99;
    // 模拟坠毁
    airplane.mesh.rotation.z += (-Math.PI/2 - airplane.mesh.rotation.z)*.0002*deltaTime;
    airplane.mesh.rotation.x += 0.0003*deltaTime;
    game.planeFallSpeed *= 1.05;
    airplane.mesh.position.y -= game.planeFallSpeed*deltaTime;

    if (airplane.mesh.position.y <-200){
      showReplay();
      game.status = "waitingReplay";//触发重玩

    }
  }else if (game.status=="waitingReplay"){
    // 空操作，等待玩家点击按钮开始游戏
  }

//其他全局动画
  airplane.propeller.rotation.x +=.2 + game.planeSpeed * deltaTime*.005;
  sea.mesh.rotation.z += game.speed*deltaTime;//*game.seaRotationSpeed;

  if ( sea.mesh.rotation.z > 2*Math.PI)  sea.mesh.rotation.z -= 2*Math.PI;

  ambientLight.intensity += (.5 - ambientLight.intensity)*deltaTime*0.005;

  coinsHolder.rotateCoins();
  ennemiesHolder.rotateEnnemies();

  sky.moveClouds();
  sea.moveWaves();

  renderer.render(scene, camera);
  requestAnimationFrame(loop);//渲染
}

function updateDistance(){
  // 更新游戏距离
  game.distance += game.speed*deltaTime*game.ratioSpeedDistance;
  // 更新页面上的距离显示
  fieldDistance.innerHTML = Math.floor(game.distance);
  // 计算圆形进度条的进度
  var d = 502*(1-(game.distance%game.distanceForLevelUpdate)/game.distanceForLevelUpdate);
  // 更新圆形进度条的属性
  levelCircle.setAttribute("stroke-dashoffset", d);

}

var blinkEnergy=false;

/**
 * 更新能量状态
 * 1. 根据速度持续消耗能量
 * 2. 更新UI显示
 * 3. 低能量时触发警告效果
 */
function updateEnergy(){
  // 计算能量消耗(速度越快消耗越大)
  game.energy -= game.speed*deltaTime*game.ratioSpeedEnergy;
  game.energy = Math.max(0, game.energy);  // 限制最小值为0
  
  // 更新能量条UI
  energyBar.style.right = (100-game.energy)+"%";
  // 能量低于50%时变为红色
  energyBar.style.backgroundColor = (game.energy<50)? "#f25346" : "#68c3c0";

  if (game.energy<30){
    energyBar.style.animationName = "blinking";
  }else{
    energyBar.style.animationName = "none";
  }

  if (game.energy <1){
    game.status = "gameover";
  }
}

function addEnergy(){
  game.energy += game.coinValue;
  game.energy = Math.min(game.energy, 100);

  // Combo逻辑
  game.comboCount++;
  game.comboTimer = game.comboDuration;

  if (game.comboCount > game.maxCombo){
    game.maxCombo = game.comboCount;
  }

  // 如果combo大于等于5，显示“Combo!!”
  if (game.comboCount >= 5){
    showComboMessage();
  }
}

function removeEnergy(){
  game.energy -= game.ennemyValue;
  game.energy = Math.max(0, game.energy);
}


//飞机移动、摄像机视角、碰撞反馈
function updatePlane(){

//   水平位置控制飞行速度，鼠标越右速度越快。垂直位置控制飞机高度。
  game.planeSpeed = normalize(mousePos.x,-.5,.5,game.planeMinSpeed, game.planeMaxSpeed);
  var targetY = normalize(mousePos.y,-.75,.75,game.planeDefaultHeight-game.planeAmpHeight, game.planeDefaultHeight+game.planeAmpHeight);
  var targetX = normalize(mousePos.x,-1,1,-game.planeAmpWidth*.7, -game.planeAmpWidth);

  //碰撞后会有小幅抖动或偏移动画；然后用 easing 方式缓慢恢复。
  game.planeCollisionDisplacementX += game.planeCollisionSpeedX;
  targetX += game.planeCollisionDisplacementX;


  game.planeCollisionDisplacementY += game.planeCollisionSpeedY;
  targetY += game.planeCollisionDisplacementY;

  // 插值移动实现平滑动画
  airplane.mesh.position.y += (targetY-airplane.mesh.position.y)*deltaTime*game.planeMoveSensivity;
  airplane.mesh.position.x += (targetX-airplane.mesh.position.x)*deltaTime*game.planeMoveSensivity;
  //随飞行方向倾斜
  airplane.mesh.rotation.z = (targetY-airplane.mesh.position.y)*deltaTime*game.planeRotXSensivity;
  airplane.mesh.rotation.x = (airplane.mesh.position.y-targetY)*deltaTime*game.planeRotZSensivity;
 
  //摄像机的视角 fov 会根据速度/位置动态变化
  var targetCameraZ = normalize(game.planeSpeed, game.planeMinSpeed, game.planeMaxSpeed, game.cameraNearPos, game.cameraFarPos);
  camera.fov = normalize(mousePos.x,-1,1,40, 80);
  camera.updateProjectionMatrix ()
  camera.position.y += (airplane.mesh.position.y - camera.position.y)*deltaTime*game.cameraSensivity;
  //通过缓慢减速的方式恢复偏移
  game.planeCollisionSpeedX += (0-game.planeCollisionSpeedX)*deltaTime * 0.03;
  game.planeCollisionDisplacementX += (0-game.planeCollisionDisplacementX)*deltaTime *0.01;
  game.planeCollisionSpeedY += (0-game.planeCollisionSpeedY)*deltaTime * 0.03;
  game.planeCollisionDisplacementY += (0-game.planeCollisionDisplacementY)*deltaTime *0.01;

  airplane.pilot.updateHairs();//飞行员动画更新
}

function showReplay(){
  replayMessage.style.display="block";
}

function hideReplay(){
  replayMessage.style.display="none";
}
function showComboMessage(){
  var comboMessage = document.getElementById("comboMessage");
  comboMessage.style.display = "block";

  // 触发动画效果：重新应用动画
  comboMessage.style.animation = "none";
  comboMessage.offsetHeight; // 触发 reflow
  comboMessage.style.animation = null;
}

function hideComboMessage(){
  var comboMessage = document.getElementById("comboMessage");
  comboMessage.style.display = "none";
}


//线性映射工具函数
//将任意值 v 从原始区间 [vmin, vmax] 映射到目标区间 [tmin, tmax]
function normalize(v,vmin,vmax,tmin, tmax){
  var nv = Math.max(Math.min(v,vmax), vmin);
  var dv = vmax-vmin;
  var pc = (nv-vmin)/dv;
  var dt = tmax-tmin;
  var tv = tmin + (pc*dt);
  return tv;
}

var fieldDistance, energyBar, replayMessage, fieldLevel, levelCircle;

/**
 * 游戏初始化函数
 * 1. 获取DOM元素引用
 * 2. 重置游戏状态
 * 3. 创建3D场景和对象
 */
function init(event){
  // 获取UI元素引用
  fieldDistance = document.getElementById("distValue");  // 距离显示
  energyBar = document.getElementById("energyBar");     // 能量条
  replayMessage = document.getElementById("replayMessage"); // 重玩提示
  fieldLevel = document.getElementById("levelValue");   // 等级显示
  levelCircle = document.getElementById("levelCircleStroke"); // 等级进度圈

  resetGame();
  createScene();

  createLights();
  createPlane();
  createSea();
  createSky();
  createCoins();
  createEnnemies();
  createParticles();

  document.addEventListener('mousemove', handleMouseMove, false);
  document.addEventListener('touchmove', handleTouchMove, false);
  document.addEventListener('mouseup', handleMouseUp, false);
  document.addEventListener('touchend', handleTouchEnd, false);

  loop();
}

window.addEventListener('load', init, false);

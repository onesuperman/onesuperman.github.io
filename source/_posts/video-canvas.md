---
title: html5标签之video与canvas的使用
comments: true
date: 2020-11-10 18:23:40
tags:
  - html5
categories:
  - web前端
keywords: html5,video,canvas
description: html5标签之video与canvas的使用
cover: /img/blog_video-canvas.jpg
---
# 前言
最近公司有个项目，需要在线播放视频且需要添加水印，思来想去还是前端实现简单点，特此记录下实现过程，借鉴了下网上的方法，也添加了点自己的东西。
# 思路
需要给播放视频添加水印信息，可以在播放的时候获取到每一帧，然后绘制到canvas画布上，以画布的方式来播放视频（某些情况下可能会有卡顿的情况，如果要求不是很高已经可以满足需要）。
# 效果
![html5标签之video与canvas的使用](/img/blog_video-canvas_1.JPG)
# 代码
## html
```html
<body>
	<video id="video" src="http://localhost:8080/projectdemo/video/getFile.do" style="display: none;"></video>
	<canvas id="canvas" class="canvas"  height="500" width="600"></canvas>
	<footer>
		<button id="videoPlay">播放/暂停</button>
		<button id="videoVolumeUp">音量增大</button>
		<button id="videoVolumeDown">音量减小</button>
		<button id="fullScreen">全屏</button>
	</footer>
</body>
```
## js
```javascript
var vol = 0.1;  //1代表100%音量，每次增减0.1
var time = 10; //单位秒，每次增减10秒
var video = document.getElementById("video");
var canvas = document.getElementById("canvas");
var interval = null;//视频同步绘制
var timeFunName=null;//单击/双击
var interstitial =false;//控制全屏

//将视频每一帧绘制到画布上
function videoToCanvas(){
	canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
	// 添加水印
	createText(canvas.getContext('2d'),"欢迎使用!",canvas);
}


//监听视频加载完成时执行
video.addEventListener('loadeddata', function() {
	videoToCanvas();
});
		
//视频播放
document.getElementById("videoPlay").addEventListener('click', function() {
	video.paused === true ? (video.play(),syncDrawing()) : video.pause();
});
//音量增大
document.getElementById("videoVolumeUp").addEventListener('click', function() {
	(video.volume > 1 || video.volume == 1) ? video.volume = 1: video.volume = video.volume + vol;
});
//音量减小
document.getElementById("videoVolumeDown").addEventListener('click', function() {
	(video.volume < 0.2 || video.volume == 0) ? video.volume = 0: video.volume = video.volume - vol;
});
//全屏
document.getElementById("fullScreen").addEventListener('click', function() {
   fullScreen();
});
canvas.addEventListener('click',function(){
	//单击 播放或暂停
	clearTimeout(timeFunName); 
	timeFunName = setTimeout(function () {                                   
		video.paused === true ? video.play() : video.pause();          
	}, 300);
	
	
});
canvas.addEventListener('dblclick',function(){
	//双击 全屏
	clearTimeout(timeFunName); 
	if(interstitial){
		exitFullScreen();
	}else{
		fullScreen();
	}
});


//视频渲染至画布
function syncDrawing(){
	clearInterval(interval);
	interval = window.setInterval(function() {
	   videoToCanvas();
	}, 1);
}

//键盘事件
document.onkeyup = function (event) {
	var e = event || window.event || arguments.callee.caller.arguments[0];
	//鼠标上下键控制视频音量 左右键控制快进后退
	if (e && e.keyCode === 38) {
		// 按 向上键
		video.volume !== 1 ? video.volume += vol : 1;
		return false;
	} else if (e && e.keyCode === 40) {
		// 按 向下键
		video.volume !== 0 ? video.volume -= vol : 1;
		return false;
	} else if (e && e.keyCode === 37) {
		// 按 向左键
		video.currentTime !== 0 ? video.currentTime -= time : 1;
		return false;
	} else if (e && e.keyCode === 39) {
		// 按 向右键
		video.volume !== video.duration ? video.currentTime += time : 1;
		return false;
	} else if (e && e.keyCode === 32) {
		// 按空格键 判断当前是否暂停
		video.paused === true ? video.play() : video.pause();
		return false;
	}
};


//添加水印
function createText(ctx,text,canvas){
	ctx.fillStyle = "white";
	ctx.font = "60px '微软雅黑'";
	ctx.textAlign = "left";
	//shadowBlur:模式级数
	ctx.shadowBlur = 10;
	ctx.shadowOffsetX = 5;
	ctx.shadowOffsetY = 5;
	ctx.shadowColor = "black";
	//fillText("要添加的文字",x0坐标，y0坐标)
	ctx.fillText(text,canvas.width/2-150,canvas.height/2);
}

//画布全屏
function fullScreen() {
	var element = document.getElementById('canvas'),method = "RequestFullScreen";
	
	var prefixMethod=null;
	["webkit", "moz", "ms", "o", ""].forEach(function(prefix) {
		if (prefixMethod) 
			return;
		if (prefix === "") {
			// 无前缀，方法首字母小写
			method = method.slice(0,1).toLowerCase() + method.slice(1);
		}
		var fsMethod = typeof element[prefix + method];
			if (fsMethod + "" !== "undefined") {
				// 如果是函数,则执行该函数
				if (fsMethod === "function") {
					prefixMethod = element[prefix + method]();
				} else {
					prefixMethod = element[prefix + method];
				}
			}
		}
	);
	interstitial=true;
	return prefixMethod;
};
//退出全屏
function exitFullScreen() {
	try{
		de = document;

		// exit full-screen
		if (de.exitFullscreen) {
			de.exitFullscreen();
		} else if (de.webkitExitFullScreen) {
			de.webkitExitFullScreen();
		} else if (de.webkitCancelFullScreen) {
			de.webkitCancelFullScreen();
		} else if (de.mozCancelFullScreen) {
			de.mozCancelFullScreen();
		} else if (de.msExitFullScreen) {
			de.msExitFullScreen();
		} 
	}
	catch(err){
		alert(err.description);
	}
	interstitial=false;
}
```

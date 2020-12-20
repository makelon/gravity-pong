'use strict';

var pongStart = function() {

var hasMouse, // Whether activated by touch or click
	leftPad,
	balls = [],
	score = 0,
	timeScale = 0.06; // Target frames per millisecond

if (!window.requestAnimationFrame) {
	var frameTime = 1 / timeScale;
	window.requestAnimationFrame = function(cb) {
		window.setTimeout(function() {
			cb(Date.now());
		}, frameTime);
	}
}

// Do all movement in one request for better performance
function drawFrame() {
	window.requestAnimationFrame(function(timestamp) {
		var active = false;
		for (var i in balls) {
			if (balls[i] && balls[i].active) {
				active = true;
				balls[i].move(timestamp);
			}
		}
		if (active) {
			drawFrame();
		}
	});
}

function Pad() {
	this.posY = 0;
	this.hMove = this.move.bind(this);
	this.obj = document.createElement('div');
	this.obj.className = 'pong-pad';
	this.obj.style.height = Pad.height + 'px';
	this.obj.style.width = Pad.width + 'px';
	this.obj.style.bottom = '0';
	this.obj.style.left = '0';
	document.addEventListener('mousemove', this.hMove);
	document.body.appendChild(this.obj);
}

Pad.width = 5;

Pad.prototype.move = function(ev) {
	this.posY = document.documentElement.clientHeight - Math.min(document.documentElement.clientHeight, Math.max(Pad.height, ev.clientY + Pad.height / 2));
	this.obj.style.bottom = this.posY + 'px';
};

Pad.prototype.halt = function() {
	document.removeEventListener('mousemove', this.hMove);
};

Pad.prototype.remove = function() {
	this.halt();
	this.obj.parentNode.removeChild(this.obj);
	leftPad = undefined;
};

function Ball() {
	this.active = false;
	this.posX = 0;
	this.posY = 0;
	this.angle = 0;
	this.velX = 0;
	this.velY = 0;
	this.gravity = Ball.gravity;
	this.chargeStart = 0;
	this.timeLastMove = 0;
	this.hMouseDown = this.mouseDown.bind(this);
	this.hMouseUp = this.mouseUp.bind(this);

	this.obj = document.createElement('div');
	this.obj.className = 'pong-ball';
	this.obj.title = 'Press and hold to charge';
	this.obj.style.bottom = '0';
	this.obj.style.left = '0';
	this.obj.addEventListener('mousedown', this.hMouseDown);
	this.obj.addEventListener('touchstart', this.hMouseDown);
	document.body.appendChild(this.obj);
	if (!Ball.width) {
		Ball.width = this.obj.offsetWidth;
		Ball.size = Ball.width * Math.PI;
	}
	Ball.idle = true;
}

Ball.create = function() {
	var ball = new Ball();
	for (var i = 0; i < balls.length; ++i) {
		if (!balls[i]) {
			balls[i] = ball;
			ball.index = i;
			return;
		}
	}
	ball.index = balls.push(ball) - 1;
};

Ball.count = 0;
Ball.idle = false;
Ball.width = undefined;
Ball.size = undefined;

Ball.prototype.out = function() {
	--Ball.count;
	this.active = false;
	if (Ball.count === 0) {
		leftPad.halt();
		score = 0;
	}
	setTimeout(this.remove.bind(this), 2000);
}

Ball.prototype.remove = function() {
	delete balls[this.index];
	this.obj.parentNode.removeChild(this.obj);
	if (this.active) {
		--Ball.count;
	}
	if (Ball.count === 0) {
		if (leftPad) {
			leftPad.remove();
		}
		if (!Ball.idle) {
			Ball.create();
		}
	}
};

Ball.prototype.move = function(timestamp) {
	var dt = this.timeLastMove ? timeScale * (timestamp - this.timeLastMove) : 1;
	this.posX = this.posX + this.velX * dt;
	this.posY = this.posY + this.velY * dt;
	this.angle = (this.angle + this.velAngle * dt) % 360;
	if (hasMouse) {
		if (this.velX < 0 && (this.posX + this.velX) <= Pad.width) {
			if (this.posY < leftPad.posY + Pad.height && this.posY > leftPad.posY - Ball.width) {
				// Bounce on pad
				this.posX = Pad.width;
				this.velX = -this.velX;
				this.gravity = -this.gravity;
				this.velY -= this.gravity;
				++score;
				if (Ball.count < 5 && !Ball.idle && !(score % 5)) {
					Ball.create();
				}
			}
			else if (this.posX < -Ball.width / 2) {
				// Lose
				this.obj.style.left = -Ball.width / 2 + 'px';
				this.out();
				return;
			}
		}
		else if (this.posX >= document.documentElement.clientWidth - Ball.width) {
			// Bounce of right wall
			this.posX = document.documentElement.clientWidth - Ball.width;
			this.velX = -this.velX;
			this.gravity = -this.gravity;
			this.velY -= this.gravity;
		}
	}
	else if (this.posX >= document.documentElement.clientWidth) {
		// No pad control on touch device
		this.remove();
		return;
	}
	if (this.posY > document.documentElement.clientHeight - Ball.width) {
		// Top of field
		this.posY = document.documentElement.clientHeight - Ball.width;
		this.velY = this.gravity < 0 && this.velY <= 1
			? 0
			: -this.velY - 2 * this.gravity;
	}
	else if (this.posY < 0) {
		// Bottom of field
		this.posY = 0;
		this.velY = this.gravity > 0 && this.velY >= -1
			? 0
			: -this.velY - 2 * this.gravity;
	}
	else {
		this.velY -= this.gravity * dt;
	}
	if (this.velY > Ball.maxVelY) {
		this.velY = Ball.maxVelY;
	}
	else if (this.velY < -Ball.maxVelY) {
		this.velY = -Ball.maxVelY;
	}
	this.obj.style.transform = 'rotate(' + this.angle + 'deg)';
	this.obj.style.left = this.posX + 'px';
	this.obj.style.bottom = this.posY + 'px';
	this.timeLastMove = timestamp;
};

Ball.prototype.mouseDown = function(ev) {
	if (Ball.count === 0) {
		hasMouse = ev.type === 'mousedown';
	}
	ev.preventDefault();
	if (!hasMouse || ev.button === 0) {
		this.chargeStart = Date.now();
		this.obj.removeEventListener('mousedown', this.hMouseDown);
		this.obj.removeEventListener('touchstart', this.hMouseDown);
		document.addEventListener(hasMouse ? 'mouseup' : 'touchend', this.hMouseUp);
	}
};

Ball.prototype.mouseUp = function(ev) {
	ev.preventDefault();
	var charge = Math.min(1, Math.sqrt(Date.now() - this.chargeStart) / Ball.maxCharge);
	this.velX = Math.max(1, charge * Ball.maxVelX);
	this.velY = charge * Ball.maxVelY;
	this.velAngle = this.velX * 360 / Ball.size;
	if (hasMouse) {
		document.removeEventListener('mouseup', this.hMouseUp);
		if (!leftPad) {
			leftPad = new Pad();
			drawFrame();
		}
	}
	else {
		document.removeEventListener('touchend', this.hMouseUp);
	}
	this.obj.removeAttribute('title');
	this.active = true;
	Ball.idle = false;
	++Ball.count;
};

return function init(options) {
	Ball.maxVelX = 'maxVelX' in options && typeof options.maxVelX === 'number' ? options.maxVelX : 25;
	Ball.maxVelY = 'maxVelY' in options && typeof options.maxVelY === 'number' ? options.maxVelY : 35;
	Ball.maxCharge = Math.sqrt('maxCharge' in options && typeof options.maxCharge === 'number' ? options.maxCharge * 1e3 : 5000);
	Ball.gravity = 'gravity' in options && typeof options.gravity === 'number' ? options.gravity : 1;
	Pad.height = 'padHeight' in options && typeof options.padHeight === 'number' ? options.padHeight : 100;
	Ball.create();
};

}();

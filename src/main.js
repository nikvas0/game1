const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;
const CNT_OF_COLUMNS = 5;
const COAL_BOX_WIDTH = 81;
const COAL_BOX_HEIGHT = 65;
const GAP_BETWEEN_COLUMNS = 10;
const WIDTH_OF_COLUMN = MAP_WIDTH / CNT_OF_COLUMNS;
const HEIGHT_OF_GROUND = 32;
const LEVEL_Y_OF_HIGH_GROUND = 60;
const LEVEL_Y_OF_LOW_GROUND = MAP_HEIGHT - 50;
const MAX_CNT_OF_BOXES_IN_COLUMN = 7;
var DELAY_OF_REMOVING = 1753;
var DELAY_OF_CREATING = 1879;
var DELAY_OF_BALANCE = 700;
var GRAVITY_Y = 300;
var SPEED_OF_PLAYER = 320;
var FRICTION = 10000000;
const DELAY_OF_BOOST = 10000.0;
const BOOST = 0.9;
var TIME_OF_STAR_LIVING = 1500;
const CNT_OF_POINTS_TO_CREATE_STAR = 200;



var timeToUseKeyboard = 0.0;
var timeToRemove = 1000.0;
var timeToCreate = 1000.0;
var timeToBoost = 0.0;
var timeToKillStar = 0.0;
var timeForDieForStar = 0.0;
var nextStableTime = 0.0;
var numberOfCurrentColumn = 1;
var playerIsMoving = false;
var isAnythingRemoved = false;
var queueOfBoxes = [];
var eps = 3;
var cntOfExtraBoxes = 0;

var game = new Phaser.Game(MAP_WIDTH, MAP_HEIGHT, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function getRandomInt(l, r) {
	return Math.floor(Math.random() * (r - l) + l);
}

function preload() {
	game.load.image('coalBox', 'assets/coalBox.png');
    game.load.image('sky', 'assets/sky.png');
    game.load.image('ground', 'assets/platform.png');
    game.load.image('star', 'assets/star.png');
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);

}

var player;
var platforms, highGround, lowGround;
var cursors;
var coal;
var score = 0;
var scoreText;


function pushBox(i) {
	if (queueOfBoxes[i-1].length == MAX_CNT_OF_BOXES_IN_COLUMN) {
		finishGame();
	}
	let cx = WIDTH_OF_COLUMN * (i - 1) + WIDTH_OF_COLUMN / 2;
	let cy = LEVEL_Y_OF_HIGH_GROUND + HEIGHT_OF_GROUND / 2 + COAL_BOX_HEIGHT / 2;
	if (cy - COAL_BOX_HEIGHT / 2 >= LEVEL_Y_OF_HIGH_GROUND + HEIGHT_OF_GROUND / 2) {
		let currentBox = coal.create(cx, cy, 'coalBox');
		currentBox.body.bounce = 0;
		queueOfBoxes[i-1].push(currentBox);
	} else {
		score = 0.0;
	}
}

function pushBoxUnder(i) {
	if (queueOfBoxes[i-1].length == MAX_CNT_OF_BOXES_IN_COLUMN) {
		finishGame();
	}
	let cx = WIDTH_OF_COLUMN * (i - 1) + WIDTH_OF_COLUMN / 2;
	let cy = LEVEL_Y_OF_LOW_GROUND - HEIGHT_OF_GROUND / 2 - COAL_BOX_HEIGHT / 2 - COAL_BOX_HEIGHT * queueOfBoxes[i-1].length;
	if (cy - COAL_BOX_HEIGHT / 2 >= LEVEL_Y_OF_HIGH_GROUND + HEIGHT_OF_GROUND / 2) {
		let currentBox = coal.create(cx, cy, 'coalBox');
		currentBox.body.bounce = 0;
		queueOfBoxes[i-1].push(currentBox);
	} else {
		score = 0.0;
	}

}

function popBox(i) {
	if (queueOfBoxes[i].length < 1) {
		finishGame();
	} else {
		let currentBox = queueOfBoxes[i].shift();
		coal.remove(currentBox, true);
	}
}


function fillColumns() {
	for (let i = 1; i <= CNT_OF_COLUMNS; ++i) {
		let currentQueue = [];
		queueOfBoxes.push(currentQueue);
		let cx = WIDTH_OF_COLUMN * (i - 1) + WIDTH_OF_COLUMN / 2;
		let curCntOfColumns = getRandomInt(2, 5);
		let cy = LEVEL_Y_OF_LOW_GROUND - HEIGHT_OF_GROUND / 2 - COAL_BOX_HEIGHT / 2;
		for (let j = 1; j <= curCntOfColumns; ++j) {
			if (cy - COAL_BOX_HEIGHT / 2 < LEVEL_Y_OF_HIGH_GROUND + HEIGHT_OF_GROUND / 2) {
				break;
			}
			let currentBox = coal.create(cx, cy, 'coalBox');
			queueOfBoxes[i-1].push(currentBox);
			cy -= COAL_BOX_HEIGHT;
		}
	}

}

var leftKey, rightKey;

function launchPhysics() {
	game.physics.startSystem(Phaser.Physics.P2JS);
	game.physics.p2.setImpactEvents(true);
	game.physics.p2.gravity.y = GRAVITY_Y;
	game.physics.p2.restitution = 0;
	game.physics.p2.applyDamping = true; 
	game.physics.p2.friction = 10000000;
}

function createBackground() {
	game.add.sprite(0, 0, 'sky');
}

function createPlatforms() {
	platforms = game.add.group();
    platforms.enableBody = true;
	platforms.physicsBodyType = Phaser.Physics.P2JS;
    lowGround = platforms.create(MAP_WIDTH / 2, LEVEL_Y_OF_LOW_GROUND, 'ground');
	lowGround.body.kinematic = true;
	highGround = platforms.create(MAP_WIDTH / 2, LEVEL_Y_OF_HIGH_GROUND, 'ground');
	highGround.body.kinematic = true;
}

function createCoal() {
	coal = game.add.group();
	coal.physicsBodyType = Phaser.Physics.P2JS;
	coal.enableBody = true;
}

function createPlayer() {
	player = game.add.sprite(WIDTH_OF_COLUMN / 2, 20, 'dude');
	player.smoothed = false;
	game.physics.p2.enable(player, false);
	player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);
	player.animations.add('turn', [4], 20, true);
	player.body.fixedRotation = true;
	player.body.inertia = 0;
	player.body.kinematic = true;
}


function createKeyboard() {
	leftKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
	rightKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
	space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    cursors = game.input.keyboard.createCursorKeys();
}

var cntOfExtraBoxesText;
function createScore() {
	scoreText = game.add.text(MAP_WIDTH - 80, 1, 'score: 0', { fontSize: '10px', fill: '#000' });
	cntOfExtraBoxesText = game.add.text(MAP_WIDTH - 180, 1, 'Extra boxes: 0', { fontSize: '10px', fill: '#000' });
}

var stars, star;
var starsCollisionGroup, platformsCollisionGroup;
var playerCollisionGroup;

function createStars() {
	stars = game.add.group();
	stars.physicsBodyType = Phaser.Physics.P2JS;
	stars.enableBody = true;
	
}



function launchCollides() {
	starsCollisionGroup = game.physics.p2.createCollisionGroup();
	playerCollisionGroup = game.physics.p2.createCollisionGroup();
	platformsCollisionGroup = game.physics.p2.createCollisionGroup();
	game.physics.p2.updateBoundsCollisionGroup();
	highGround.body.setCollisionGroup(platformsCollisionGroup);
	//star.body.stati = true;
	player.body.setCollisionGroup(playerCollisionGroup);	
	//player.body.collides(starsCollisionGroup, collectStar, this);
}

function starTouchingWithHighGround() {

}

function create() {
	launchPhysics();
	createBackground();
	createPlatforms();
	createCoal();
	createPlayer();
	createStars();
	launchCollides();
	player.body.collides(starsCollisionGroup, collectStar, this);
	highGround.body.collides(starsCollisionGroup, starTouchingWithHighGround, this);
	fillColumns();
    createKeyboard();
	createScore();
}

var cntOfPushes = 0;
var haveTheStar = false;
function collectStar(body1, body2) {
	cntOfPushes += 1;
	if (cntOfPushes % 2 == 1) {
		return;
	}
	haveTheStar = false;
	updateScore(CNT_OF_COLUMNS * 10);
	for (let i = 1; i <= CNT_OF_COLUMNS; ++i) {
		pushBoxUnder(i);
	}
	star.kill();
} 

function createStar() {
	haveTheStar = true;
	timeToDieForStar = game.time.now + TIME_OF_STAR_LIVING;
	star = stars.create(getRandomInt(WIDTH_OF_COLUMN / 2, MAP_WIDTH - WIDTH_OF_COLUMN / 2), 20, 'star');
	star.body.setCollisionGroup(starsCollisionGroup);
	star.body.collides([playerCollisionGroup, platformsCollisionGroup]);
}


function checkStar() {
	if (haveTheStar && game.time.now >= timeToDieForStar) {
		star.kill();
		haveTheStar = false;
	}
}

function addCollids() {
	/* var hitPlatform = game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(stars, platforms);
	game.physics.arcade.collide(coal, platforms);
	game.physics.arcade.collide(coal, coal); */
}

function tryToRemoveAnything() {
	if (game.time.now >= timeToRemove) {
		let index = getRandomInt(0, CNT_OF_COLUMNS - 1);
		popBox(index);
		timeToRemove = game.time.now + DELAY_OF_REMOVING;
		nextStableTime = game.time.now + DELAY_OF_BALANCE;
		isAnythingRemoved = true;
	}
}

function tryToFinishStabilization() {
	if (game.time.now >= nextStableTime) {
		isAnythingRemoved = false;
	}
}

function tryToCreate() {
	if (!playerIsMoving && game.time.now >= timeToCreate) {
		updateScore(10);
		pushBox(numberOfCurrentColumn);
		timeToCreate = game.time.now + DELAY_OF_CREATING;
	}
}

function tryToMovePlayer() {
	if (leftKey.isDown && game.time.now >= timeToUseKeyboard && numberOfCurrentColumn != 1 && !playerIsMoving) {
        //player.setVelocityX(-SPEED_OF_PLAYER);
		player.body.velocity.x = -SPEED_OF_PLAYER;
		numberOfCurrentColumn -= 1;
        player.animations.play('left', true);
		timeToUseKeyboard = game.time.now + WIDTH_OF_COLUMN / SPEED_OF_PLAYER * 1000;
		playerIsMoving = true;
	}
	else if (rightKey.isDown && game.time.now >= timeToUseKeyboard && numberOfCurrentColumn != CNT_OF_COLUMNS && !playerIsMoving) {
		//player.setVelocityX(SPEED_OF_PLAYER);
		player.body.velocity.x = SPEED_OF_PLAYER;
		numberOfCurrentColumn += 1;
		player.animations.play('right', true);
		timeToUseKeyboard = game.time.now + WIDTH_OF_COLUMN / SPEED_OF_PLAYER * 1000;
		playerIsMoving = true;
	} else if (space.isDown && game.time.now >= timeToUseKeyboard && cntOfExtraBoxes != 0) {
		updateCountOfExtraBoxes(-1);
		pushBoxUnder(numberOfCurrentColumn);
	}
	
	if (playerIsMoving == true && game.time.now >= timeToUseKeyboard) {
		//player.setVelocityX(0);
		player.body.velocity.x = 0;
		playerIsMoving = false;
		player.animations.play('turn');
	}
	

}


function tryToBoost() {
	if (game.time.now >= timeToBoost) {
		SPEED_OF_PLAYER *= (2 - BOOST);
		DELAY_OF_CREATING *= BOOST;
		DELAY_OF_REMOVING *= BOOST;
		DELAY_OF_BALANCE *= BOOST;
		TIME_OF_STAR_LIVING *= BOOST;
		GRAVITY_Y *= (2 - BOOST);
		FRICTION *= (2 - BOOST);
		game.physics.p2.gravity.y = GRAVITY_Y;
		game.physics.p2.friction = FRICTION;
		timeToBoost = game.time.now + DELAY_OF_BOOST;
	}

}


function update() {
    //  Collide the player and the stars with the platforms
	checkStar();
	tryToBoost();
    tryToRemoveAnything();
	tryToCreate();
	tryToMovePlayer();
}

function updateCountOfExtraBoxes(delta) {
	cntOfExtraBoxes += delta;
	cntOfExtraBoxesText.text = 'Extra boxes: ' + cntOfExtraBoxes;
}

function updateScore(delta) {
	let border = (Math.floor(score / CNT_OF_POINTS_TO_CREATE_STAR) + 1) * CNT_OF_POINTS_TO_CREATE_STAR;
    score += delta;
	if (score >= border) {
		updateCountOfExtraBoxes(1);
		createStar();
	}
    scoreText.text = 'Score: ' + score;
}

function finishUpdate() {

}

function finishCreate() {

}

function finishPreload() {

}

function finishGame() {
	finishScore = game.add.text(200, 200, 'Total score: ' + score, { fontSize: '60px', fill: '#FFF' });
	game.update = finishUpdate();
	
	//game = new Phaser.Game(MAP_WIDTH, MAP_HEIGHT, Phaser.AUTO, '', { preload: finishPreload, create: finishCreate, update: finishUpdate });
}
const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;
const CNT_OF_COLUMNS = 5;
const SPEED_OF_PLAYER = 160;
const COAL_BOX_WIDTH = 81;
const COAL_BOX_HEIGHT = 65;
const GAP_BETWEEN_COLUMNS = 10;
const WIDTH_OF_COLUMN = MAP_WIDTH / CNT_OF_COLUMNS;
const HEIGHT_OF_GROUND = 32;
const LEVEL_Y_OF_HIGH_GROUND = 50;
const LEVEL_Y_OF_LOW_GROUND = MAP_HEIGHT - 50;
const HEIGHT_OF_PARTITION = 2;

var timeToUseKeyboard = 0.0;
var numberOfCurrentColumn = 1;
var playerIsMoving = false;

var config = {
	type: Phaser.AUTO,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
	physics: {
        default: 'arcade',
		arcade: {
           gravity: { y: 400 },
           debug: false,
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
};
var game = new Phaser.Game(config);
var platfroms;
var coal;
var player;
var partitions;
var eps = 1; //для того чтобы столбики не провалились под лоуграунд

function getRandomInt(l, r) {
	return Math.floor(Math.random() * (r - l) + l);
}

function preload() {
	this.load.image('sky', 'src/games/firstgame/assets/sky.png');
    this.load.image('ground', 'src/games/firstgame/assets/platform.png');
	this.load.image('coalBox', 'assets/coalBox.png');
	this.load.image('partition', 'assets/partition.png');
	this.load.spritesheet('dude', 'src/games/firstgame/assets/dude.png', { frameWidth: 32, frameHeight: 48 });
}


function create() {
	
	this.add.image(MAP_WIDTH / 2, MAP_HEIGHT / 2, 'sky');	
	
	//partitions
	partitions = this.physics.add.staticGroup();
	
	//coal
	coal = this.physics.add.group({
		key: 'coalBox',
		repeat: -2,
	});
	this.physics.add.collider(coal, partitions);
	
	
	
	//platforms
	platforms = this.physics.add.staticGroup();
	platforms.create(MAP_WIDTH / 2, LEVEL_Y_OF_HIGH_GROUND, 'ground').setScale(2, 1).refreshBody();
	platforms.create(MAP_WIDTH / 2, LEVEL_Y_OF_LOW_GROUND, 'ground').setScale(2, 1).refreshBody();
	this.physics.add.collider(coal, platforms);
	
	//player
	player = this.physics.add.sprite(WIDTH_OF_COLUMN / 2, 10, 'dude');
	player.setCollideWorldBounds(true);
	this.physics.add.collider(player, platforms);
	
	this.anims.create({
		key: 'left',
			frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
			frameRate: 10,
			repeat: -1
	});

	this.anims.create({
		key: 'turn',
		frames: [ { key: 'dude', frame: 4 } ],
		frameRate: 20
	});

	this.anims.create({
		key: 'right',
		frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
		frameRate: 10,
		repeat: -1
	});
	cursors = this.input.keyboard.createCursorKeys();
	
	
	//creating of coal columns
	let childCoal, childPartition;
	for (let i = 1; i <= CNT_OF_COLUMNS; ++i) {
		eps = 1;
		let cx = WIDTH_OF_COLUMN * (i - 1) + WIDTH_OF_COLUMN / 2;
		let curCntOfColumns = getRandomInt(1, 5);
		let cy = LEVEL_Y_OF_LOW_GROUND - HEIGHT_OF_GROUND / 2 - COAL_BOX_HEIGHT / 2;
		for (let j = 1; j <= curCntOfColumns; ++j) {
			if (cy - COAL_BOX_HEIGHT / 2 < LEVEL_Y_OF_HIGH_GROUND + HEIGHT_OF_GROUND / 2) {
				break;
			}
			resCoal = coal.create(cx, cy, 'coalBox');
			
			
			resPartition = partitions.create(cx, cy - COAL_BOX_HEIGHT / 2 - HEIGHT_OF_PARTITION / 2, 'partition');
			if (j == 1) {
				childCoal = resCoal;
				childPartition = resPartition;
			}
			
			cy -= COAL_BOX_HEIGHT + HEIGHT_OF_PARTITION;
		}
	}
	coal.remove(childCoal, true);
	partitions.remove(childPartition, true);
}

function update() {
	//player
	
	
	if (cursors.left.isDown && this.time.now > timeToUseKeyboard && numberOfCurrentColumn != 1 && !playerIsMoving) {
        player.setVelocityX(-SPEED_OF_PLAYER);
		numberOfCurrentColumn -= 1;
        player.anims.play('left', true);
		timeToUseKeyboard = this.time.now + WIDTH_OF_COLUMN / SPEED_OF_PLAYER * 1000;
		playerIsMoving = true;
	}
	else if (cursors.right.isDown && this.time.now > timeToUseKeyboard && numberOfCurrentColumn != CNT_OF_COLUMNS && !playerIsMoving) {
		player.setVelocityX(SPEED_OF_PLAYER);
		numberOfCurrentColumn += 1;
		player.anims.play('right', true);
		timeToUseKeyboard = this.time.now + WIDTH_OF_COLUMN / SPEED_OF_PLAYER * 1000;
		playerIsMoving = true;
	} 
	
	if (playerIsMoving == true && this.time.now > timeToUseKeyboard) {
		player.setVelocityX(0);
		playerIsMoving = false;
		player.anims.play('turn');
	}
	
    if ((cursors.up.isDown || cursors.space.isDown) && player.body.touching.down) {
        player.setVelocityY(-330);
    }
	
}
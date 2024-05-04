var config = {
    type: Phaser.AUTO,
    width: 730, 
    height: 550, 
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 }, 
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};


var game = new Phaser.Game(config);

//Variables var platform;
var cursors; 
var jumpKey;
var background;
var star;
var nade;
var nextStarTimer;
var nextBombTimer;
var starCounter = 0; 
var score = 0;
var scoreText;
var scorePoint;
var usedStarPositions = new Set();
var gameOverText;

//Color Variables
const changingColors = ['#540303', '#4232bf', '#bdae26', '#3c9978', '#84b830', '#c90bde', '#a2c700'];
var colorIndex = 0;

function preload() {
    // Background
    this.load.image('background', 'assets/background.png');
    
    // Platform
    this.load.image('sPlatform1', 'assets/smallPlatform1.png');
    this.load.image('sPlatform2', 'assets/smallPlatform2.png');
    this.load.image('sPlatform3', 'assets/smallPlatform3.png');
    this.load.image('bPlatform1', 'assets/bigplatform.png');
  
    
    // Player
    this.load.spritesheet('player', 'assets/character.png', {
        frameWidth: 60,
        frameHeight: 70
    });

    // Star and Bomb
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/nade.png');
}


function create() {
 
    // Scale Background size
    background = this.add.image(0, 0, 'background').setOrigin(0, 0);
    
    
    background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    
    // Physics for Platform
    platform = this.physics.add.staticGroup();

    // Platform Coordinates
    platform.create(700, 260, 'sPlatform1').setScale(0.37).refreshBody(); //middle right
    platform.create(220, 430, 'sPlatform2').setScale(0.4).refreshBody(); //bottom left
    platform.create(600, 380, 'sPlatform3').setScale(0.4).refreshBody(); //middle right
    platform.create(100, 320, 'sPlatform2').setScale(0.4).refreshBody(); //middle left
    platform.create(370, 200, 'sPlatform3').setScale(0.37).refreshBody(); //middle top left
    platform.create(150, 529, 'bPlatform1').setScale(0.4).refreshBody(); //ground left
    platform.create(450, 529, 'bPlatform1').setScale(0.4).refreshBody(); //ground middle
    platform.create(750, 529, 'bPlatform1').setScale(0.4).refreshBody(); //ground right

    // Player properties
    player = this.physics.add.sprite(500, 400, 'player');
    player.setBounce(0.2); 
    player.setCollideWorldBounds(true); 


    this.physics.add.collider(player, platform);

    // Animations for the player   
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            frames: [{ key: 'player', frame: 4 }],
            frameRate: 5
        });

    cursors = this.input.keyboard.createCursorKeys();
    jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    star = this.physics.add.group({
        key: 'star',
        allowGravity: true 
    });

    this.physics.add.collider(star, platform);
    this.physics.add.overlap(player, star, collectStar, null, this);
    nade = this.physics.add.group({
        key: 'bomb',
        allowGravity: true 
    });

    this.physics.add.collider(nade, platform);
    this.physics.add.overlap(player, nade, hitBomb, null, this);
    scoreText = this.add.text(550, 20, 'Star Collected:' + score, {
        fontSize: '15px',
        fill: '#ffffff'
    });

    scorePoint = this.add.text(550, 40, 'Score:' + score, {
        fontSize: '15px',
        fill: '#ffffff'
    });    
    
    // Respawn time for star
    nextStarTimer = this.time.addEvent({
        delay: 4000,
        callback: createNewStar,
        callbackScope: this,
        loop: true
    });
    
    // Respawn bomb time
    nextBombTimer = this.time.addEvent({
        delay:2000,
        callback: createNewNade,
        callbackScope: this,
        loop: true
    });
}

// Display a victory message
function winGame(player, star) {
    this.add.text(game.config.width / 2, game.config.height / 2, 'You Win!', {
        fontSize: '64px',
        fill: '#00ff00'
    }).setOrigin(0.5);
    this.physics.pause();
}

//Collecting Stars
function collectStar(player, star) {
    star.destroy();
    usedStarPositions.delete(star.x);
    score += 1;
    scoreText.setText('Star Collected: ' + score);
    scorePoint.setText('Score: ' + score *100);
    player.setTint(Phaser.Display.Color.HexStringToColor(changingColors[colorIndex]).color);

    colorIndex = (colorIndex + 1) % changingColors.length;
        starCounter++;
        if (starCounter % 5 === 0) {
            player.setScale(player.scaleX * 1.1, player.scaleY * 1.1);
            starCounter = 0;
        }

         // Create flag platform if score reaches 15 star or 1500 Point
        if (score === 15 || score === 1500) {
            winGame.call(this);
            player.setVelocity(0, 0);
            player.setY(game.config.height + 100); 

        }
    }

//Creating New Stars
function createNewStar() {
    if (star.getChildren().length < 5) {
        var platformArray = platform.getChildren().filter(function(platform) {
            return platform.y <= 710;
        });

        if (platformArray.length > 0) {
            var randomPlatform;
            var starX, platformIndex;

            do {
                platformIndex = Phaser.Math.Between(0, platformArray.length - 2);
                randomPlatform = platformArray[platformIndex];
                starX = Phaser.Math.Between(randomPlatform.x - randomPlatform.width / 5, randomPlatform.x + randomPlatform.width / 1.5);
            } while (usedStarPositions.has(starX)); 

            usedStarPositions.add(starX);
            
            var newStarY = -5;
            var newStar = star.create(starX, newStarY, 'star');
            newStar.setBounce(0.2);
            newStar.setCollideWorldBounds(true);
            newStar.setVelocityY(15);
        }
    }
}

//Creating new Grenade
function createNewNade() {
    if (nade.getChildren().length < 10) {
        var platformArray = platform.getChildren().filter(function(platform) {
            return platform.y <= 710;
        });
        if (platformArray.length > 0) {
            var randomPlatform;
            var bombX, platformIndex;
            do {
                platformIndex = Phaser.Math.Between(0, platformArray.length - 1);
                randomPlatform = platformArray[platformIndex];
                bombX = Phaser.Math.Between(randomPlatform.x - randomPlatform.width / 2, randomPlatform.x + randomPlatform.width / 2);
            } while (usedStarPositions.has(bombX));

            var newNadeY = -40; 
            var newNade = nade.create(bombX, newNadeY, 'bomb');
            newNade.setBounce(0.2);
            newNade.setCollideWorldBounds(true);
            newNade.setVelocityY(5);
        }
    }
}
 
//Trigger event for hitting the Grenade
function hitBomb(player, nade) {
    player.setVelocity(0, 0);
    player.setY(game.config.height + 100); 
    gameOverText = this.add.text(game.config.width / 2, game.config.height / 2, 'Game Over', {
        fontSize: '64px',
        fill: '#7c0000'
    }).setOrigin(0.5);
    this.physics.pause();
}



function update() {
    if (cursors.left.isDown) {
        player.setVelocityX(-250);
        player.anims.play('walk', true);
        player.flipX = false; 

    } else if (cursors.right.isDown) {
        player.setVelocityX(250);
        player.anims.play('walk', true); 
        player.flipX = true; 

    } else {
        player.setVelocityX(0);
        player.anims.play('idle'); 
    }
    if (jumpKey.isDown && player.body.touching.down) {
        player.setVelocityY(-285); 
    }
}

import store from './store/index.js'; 
let game;
let gameOptions = {

    // number of columns
    columns: 6,

    // number of rows, must be high enough to allow object pooling
    rows: 20,

    // tile speed in pixels per second
    tileSpeed: 90,

}
window.onload = function() {
    let gameConfig = {
        type: Phaser.AUTO,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "thegame",
            width: 750,
            height: 1334,
           
        },
        physics: {
            default: "arcade"
        },
        transparent: true,
    }
    game = new Phaser.Game(gameConfig);

    game.scene.add('PlayGame', new PlayGame(store));
    game.scene.add('ScenePaused', ScenePaused);
    
    const gameMenu = new gameService(game, store);
    const backGeound = new livingBackground(game);
}
class PlayGame extends Phaser.Scene{
    constructor(store){
        super("PlayGame");
        this.store = store;
        this.highScore = store.state.score;
        this.score = 0 ;
        this.scoreText = null;
        this.dayPart = 'morning'
        this.isLater = false;
    }
    preload(){
        let imageSize = window.devicePixelRatio;
        
        console.log('imageSize',imageSize)

        this.load.spritesheet("tiles", "stones@" + imageSize + "x.png", {
            frameWidth: 100 * imageSize,
            frameHeight: 100 * imageSize
        });        
        
    }
    create(){
        // background images
        // this.add.image(540, 690, 'morningSky');
        
        // physics group which manages all tiles in game
        this.tileGroup = this.physics.add.group();

        // determining tile size according to game width and columns
        this.tileSize = game.config.width / gameOptions.columns;

        //set part of the day; 

        if(this.dayPart == 'evening' || this.dayPart == 'night') {
            this.isLater = true;
        } else {
            this.isLater = false;
        }
        
        // time to add tiles to the game
        for(let i = 0; i < gameOptions.rows; i++){

            // build an array with integers between 0 and gameOptions.columns - 1: [0, 1, 2, ..., gameOptions.columns - 1]
            let values = this.getRandomLane();

            // save middle column color of first row
            if(i == 0){
                var middleColor = values[Math.floor(gameOptions.columns / 2)].id;
            }

            // now we place the tiles, row by row
            for(let j = 0; j < gameOptions.columns; j++){
                let tileColor = this.isLater ? values[j].id + 5 : values[j].id;
                // add a tile. Tile frame is set according to "values" shuffled array
                let tile = this.tileGroup.create(j * this.tileSize, i * this.tileSize + game.config.height / 4 * 3, "tiles", tileColor);

                // call adjustTile method to adjust tile origin and display size
                this.adjustTile(tile,values[j]);
            }
        }

        // let's build once again an array with integers between 0 and gameOptions.columns - 1
        let values = this.isLater ? Phaser.Utils.Array.NumberArray(5, (gameOptions.columns - 1)+5) : Phaser.Utils.Array.NumberArray(0, gameOptions.columns - 1);

        // remove the item at "middlecolor" position because we don't want it to be randomly selected
        values.splice(middleColor, 1);

        // add the player to the game. Player color is picked amoung "values" array items, which does not contain anymore "middlecolor" value
        this.player = this.tileGroup.create(this.tileSize * Math.floor(gameOptions.columns / 2), game.config.height / 4 * 3 - this.tileSize, "tiles", Phaser.Utils.Array.GetRandom(values));

        // adjust player origin and display size
        this.adjustTile(this.player, {rotated: Math.random() < 0.5});

        // move entire tile group up by gameOptions.tileSpeed pixels / second
        this.tileGroup.setVelocityY(-gameOptions.tileSpeed);

        // can the player move? Yes, at the moment
        this.canMove = true;

        // did we match any tile? No, at the moment
        this.matched = false;

        // score display 
        this.score = 0;
        this.scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#FFF' });

        // wait for player input
        this.input.on("pointerdown", this.moveTile, this);

        setInterval(() => {
            this.events.emit('checktime');
        },100000)
        
    }

    // Generate random lane of brincks
    getRandomLane() {
            let lane = Phaser.Utils.Array.NumberArray(0, gameOptions.columns - 1);

            lane.forEach((column, index) => {
                lane[index] = {
                    id: column,
                    rotated: Math.random() < 0.5
                }
            })

            // then we shuffle the array
            Phaser.Utils.Array.Shuffle(lane);

            return lane;
    }

    // method to set tile origin and display size
    adjustTile(sprite, value){

        // set origin at the top left corner
        sprite.setOrigin(0);

        // set display width and height to "tileSize" pixels
        sprite.displayWidth = this.tileSize;
        sprite.displayHeight = this.tileSize;
    }

    // method to move player tile
    moveTile(pointer){

        // if we can move...
        if(this.canMove){

            // determine column according to input coordinate and tile size
            let column = Math.floor(pointer.x / this.tileSize);

            // get the ditance from current player tile and destination
            let distance = Math.floor(Math.abs(column * this.tileSize - this.player.x) / this.tileSize);

            // did we actually move?
            if(distance > 0){

                // we can't move anymore
                this.canMove = false;

                // tween the player to destination tile
                this.tweens.add({
                    targets: [this.player],
                    x: column * this.tileSize,
                    duration: distance * 30,
                    callbackScope: this,
                    onComplete: function(){

                        // at the end of the tween, check for tile match
                        this.checkMatch();
                    }
                });
            } else {
                this.adjustTile(this.player);
                this.checkMatch();
            }
        }
    }

    // method to check tile matches
    checkMatch(){

        // get tile below player tile
        let tileBelow = this.physics.overlapRect(this.player.x + this.tileSize / 2, this.player.y + this.tileSize * 1.5, 1, 1);

        // "tileBelow" is an array so we have to compare the first - and only - item frame with player frame. Are the two frames the same?
        if(tileBelow[0].gameObject.frame.name == this.player.frame.name){

            // we have a match
            this.matched = true;

            // check the whole row below player tile
            let rowBelow = this.physics.overlapRect(0, this.player.y + this.tileSize * 1.5, game.config.width, 1);

            this.score = this.score + gameOptions.columns;
            this.scoreText.setText('Score: ' + this.score);

            // tween down the player
            this.tweens.add({
                targets: [this.player],
                y: tileBelow[0].gameObject.y,
                duration: 300,
                callbackScope: this,
                onUpdate: function(tween, target){

                    // at each update, we have to adjust player position because tiles continue moving up
                    this.player.y = Math.min(this.player.y, tileBelow[0].gameObject.y)
                },

                // at the end of the tween, we have to move the row at the bottom, to reuse sprites
                onComplete: function(){

                    // the good old array with all integers from zero to gameOptions.columns - 1
                    let values = this.getRandomLane();

                    // place all tiles below the lowest row
                    for(let i = 0; i < gameOptions.columns; i++){
                        let frameName = this.isLater ? values[i].id + 5 : values[i].id;
                        rowBelow[i].gameObject.setFrame(frameName);
                        rowBelow[i].gameObject.y += this.tileSize * gameOptions.rows;
                    }

                    // check for matches again, there could be a combo
                    this.checkMatch();
                }
            });
        }

        // what to do when player moved but there isn't any match?
        else{

            // we can move again
            this.canMove = true;

            // is there a previous match? Did we come here from a previous match?
            if(this.matched){

                // no more matches
                this.matched = false;

                // get the tile below the player
                let tileBelow = this.physics.overlapRect(this.player.x + this.tileSize / 2, this.player.y + this.tileSize * 1.5, 1, 1);

                // the good old array with all integers from zero to gameOptions.columns - 1
                let values = this.isLater ? Phaser.Utils.Array.NumberArray(5, (gameOptions.columns - 1) + 5) : Phaser.Utils.Array.NumberArray(0, gameOptions.columns - 1);
                
                let tileBelowName = this.isLater ? tileBelow[0].gameObject.frame.name - 5 : tileBelow[0].gameObject.frame.name;
                // remove the item at "frame" value of tile below the player pbecause we don't want it to be randomly selected
                values.splice(tileBelowName, 1);

                

                // change player frame
                this.player.setFrame(Phaser.Utils.Array.GetRandom(values));
            }
        }
    }

    // method to be executed at each frame
    update(){

        // if the player touches the top of the screen...
        if(this.player.y < 0){

            // gmae over man, restart the game
            this.scene.pause();
            this.gameOver = true;
            
            if(this.score > this.highScore) {
                this.store.dispatch('addScore', this.score);
                this.highScore = this.score;
            }
        }
    }

    
}

var ScenePaused = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function ScenePaused ()
    {
        Phaser.Scene.call(this, { key: 'ScenePaused' });
    },

    create: function ()
    {
         this.setPauseListeners();
    },

    setPauseListeners() {
        var keyObj = this.input.keyboard.addKey('ESC');  // Get key object
        const gameScene = this.scene.get('PlayGame').scene;

        keyObj.on('up', () => { 
            if(gameScene.isPaused()) {
                gameScene.resume();
            } else  {
                gameScene.pause();
            }
        });
    }

});

class gameService {
    constructor(game, store) {
        this.store = store;
        this.game = game;
        this.modalGameMenu = document.querySelector("#game-menu");
        this.modalPauseMenu = document.querySelector("#pause-menu");
        this.modalEndGame = document.querySelector("#end-game");
        this.startBtn = document.querySelector(".start-game-btn");
        this.closeBtn = document.querySelector(".close-btn");
        this.resumeBtn = document.getElementById("resume-game-btn");
        this.mainBtn = document.querySelectorAll(".main-game-btn");
        this.restartBtn = document.querySelector(".restart-game-btn");
        this.highScoreContainer = document.getElementById('highscore');
        this.finalScoreContainer = document.getElementById('finalscore');
        console.log(this);
        this.init()
    }

    init() {
        this.openMenu();
        this.eventListeners();
        console.log('this.store',this.store);
    }

    eventListeners() {
          this.startBtn.onclick = () => {
            this.game.scene.start('PlayGame');
            this.game.scene.start('ScenePaused');

            this.closeMenu();
            this.initPauseMenu();
            this.initEndGame();
          }

          window.onclick = function(e){
            if(e.target == this.modalGameMenu){
              this.closeMenu()
            }
          }
    }

    openMenu() {
        this.modalGameMenu.style.display = "block";
        this.highScoreContainer.innerHTML = this.store.state.score;
    }

    closeMenu() {
        this.modalGameMenu.style.display = "none"
    }

    initPauseMenu() {
        const gameScene = this.game.scene.getScene('PlayGame');

        gameScene.events.on('pause', () => {
            if(!gameScene.gameOver) this.openPause();
        })
        gameScene.events.on('resume', () => {
            this.closePause()
        })

        //pause modal events
        this.closeBtn.onclick = () => {
            this.closePause()
            gameScene.scene.resume();
        }

        this.resumeBtn.onclick = () => {
            this.closePause()
            gameScene.scene.resume();
        }
        
        this.mainBtn.forEach((buts) => {
            buts.onclick = () => {
                this.closePause()
                this.openMenu()
                this.closeEnd()
            }
        })

    }

    openPause() {
        this.modalPauseMenu.style.display = "block"
    }

    closePause() {
        this.modalPauseMenu.style.display = "none"
    }

    initEndGame() {
        const gameScene = this.game.scene.getScene('PlayGame');
        gameScene.gameOver = false;

        gameScene.events.on('pause', () => {
            if(gameScene.gameOver) this.openEnd()
        })

        this.restartBtn.onclick = () => {
            this.closeEnd()
            gameScene.scene.restart();
            gameScene.gameOver = false;
        }
    }

    openEnd() {
        this.modalEndGame.style.display = "block";
        const gameScene = this.game.scene.getScene('PlayGame');
        this.finalScoreContainer.innerHTML = gameScene.score;
    }

    closeEnd() {
        this.modalEndGame.style.display = "none"
    }
}

class livingBackground {
    constructor(game) { 
        this.gameContainer = document.querySelector("#thegame");
        this.game = game;
        this.gameScene = null;

        this.init();
    }

    init() {
        // this.gameContainer.classList.add('night');
        // partsOfDay[1] = true;
        

        setTimeout(()=>{
            this.gameScene = this.game.scene.getScene('PlayGame');
            this.setBackground();
            
            this.gameScene.events.on('checktime', () => {
               this.setBackground();
            })
        },100)
    }

    partOfDay(timeString, today) {
        /* given a 24-hour time HH, HHMM or HH:MM, 
            return the part of day (morning, afternoon, evening, night)
           if today is true, return (this morning, this afternoon, this evening, tonight)
        */
        if (timeString === undefined || timeString === null) {
            timeString = (new Date).getHours().toString();
        }
        if (today === undefined) {
            today = false;
        }
        
        var hours = timeString.substring(0,2);
        var partOfDay = '';
        var subPartOfDay = false;
        
        if (hours < 12) {
            partOfDay = 'morning';
            if (hours > 14) {
                subPartOfDay = true;
            }
        }
        else if (hours < 17) {
            partOfDay = 'afternoon';
            if (hours > 19) {
                subPartOfDay = true;
            }
        }
        else if (hours < 21) {
            partOfDay = 'evening';
            if (hours > 23) {
                subPartOfDay = true;
            }
        }
        else {
            partOfDay = 'night';
            if (hours > 7) {
                subPartOfDay = true;
            }
        }
        
        if (today) {
            if (partOfDay === 'night') {
                partOfDay = 'tonight';
            }
            else {
                partOfDay = 'this ' + partOfDay;
            }
        }
        
        return [partOfDay, subPartOfDay];
    }

    setBackground() {
        this.gameContainer.removeAttribute('class');
        const dayParts = this.partOfDay();
        this.gameContainer.classList.add(dayParts[0]);
        // this.gameContainer.classList.add('night');
        // partsOfDay[1] = true;
        if(this.gameScene) this.gameScene.dayPart = dayParts[0];

        if(dayParts[1]) {
            this.gameContainer.classList.add('later');
        }
    }
}
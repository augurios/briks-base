class PlayGame extends Phaser.Scene{
  constructor(store, gameOptions){
      super("PlayGame");
      this.store = store;
      this.state = store.state;
      this.highScore = store.state.score;
      this.score = 0 ;
      this.scoreText = null;
      this.dayPart = 'morning'
      this.isLater = false;
      this.gameOptions = gameOptions;
      this.bgsong = null;
      this.gameStart = null;
  }
  preload(){
        if(!this.load.totalComplete) this.loadingBar();     

        let imageSize = Math.round(window.devicePixelRatio);
        // console.log('imageSize',imageSize );
        this.load.spritesheet("tiles", "stones@" + imageSize + "x.png", {
            frameWidth: 100 * imageSize,
            frameHeight: 100 * imageSize
        });

        this.load.audio("bgsong", ["resourses/alSurPorPista(Demo).mp3"]);
        this.load.audio("gameStart", ["resourses/game_start.mp3"]);
        this.load.audio("slides", ["resourses/slide.mp3"]);
        this.load.audio("score", ["resourses/score.mp3"]);
        this.load.audio("pause", ["resourses/pause.mp3"]);

  }
  create(){
      // background images
      // this.add.image(540, 690, 'morningSky');
    //  return;
      this.bgsong = this.sound.add("bgsong", { loop: true });
      this.gameStart = this.sound.add("gameStart", { loop: false });
      this.slideSfx = this.sound.add("slides", { loop: false });
      this.scoreSfx = this.sound.add("score", { loop: false });
      this.pauseMenu = this.sound.add("pause", { loop: false });

      if (this.state.soundOn) this.gameStart.play();
      if (this.state.musicOn) this.bgsong.play();

      // physics group which manages all tiles in game
      this.tileGroup = this.physics.add.group();

      // determining tile size according to game width and columns
      this.tileSize = this.game.config.width / this.gameOptions.columns;

      //set part of the day; 

      if(this.dayPart == 'evening' || this.dayPart == 'night') {
          this.isLater = true;
      } else {
          this.isLater = false;
      }
      
      // time to add tiles to the game
      for(let i = 0; i < this.gameOptions.rows; i++){

          // build an array with integers between 0 and gameOptions.columns - 1: [0, 1, 2, ..., gameOptions.columns - 1]
          let values = this.getRandomLane();

          // save middle column color of first row
          if(i == 0){
              var middleColor = values[Math.floor(this.gameOptions.columns / 2)].id;
          }

          // now we place the tiles, row by row
          for(let j = 0; j < this.gameOptions.columns; j++){
              let tileColor = this.isLater ? values[j].id + 5 : values[j].id;
              // add a tile. Tile frame is set according to "values" shuffled array
              let tile = this.tileGroup.create(j * this.tileSize, i * this.tileSize + this.game.config.height / 4 * 3, "tiles", tileColor);

              // call adjustTile method to adjust tile origin and display size
              this.adjustTile(tile,values[j]);
          }
      }

      // let's build once again an array with integers between 0 and gameOptions.columns - 1
      let values = this.isLater ? Phaser.Utils.Array.NumberArray(5, (this.gameOptions.columns - 1)+5) : Phaser.Utils.Array.NumberArray(0, this.gameOptions.columns - 1);

      // remove the item at "middlecolor" position because we don't want it to be randomly selected
      values.splice(middleColor, 1);

      // add the player to the game. Player color is picked amoung "values" array items, which does not contain anymore "middlecolor" value
      this.player = this.tileGroup.create(this.tileSize * Math.floor(this.gameOptions.columns / 2), this.game.config.height / 4 * 3 - this.tileSize, "tiles", Phaser.Utils.Array.GetRandom(values));

      // adjust player origin and display size
      this.adjustTile(this.player, {rotated: Math.random() < 0.5});

      // move entire tile group up by gameOptions.tileSpeed pixels / second
      this.tileGroup.setVelocityY(-this.gameOptions.tileSpeed);

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
          let lane = Phaser.Utils.Array.NumberArray(0, this.gameOptions.columns - 1);

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
        if (this.state.soundOn) this.slideSfx.play();
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
          let rowBelow = this.physics.overlapRect(0, this.player.y + this.tileSize * 1.5, this.game.config.width, 1);

          this.score = this.score + this.gameOptions.columns;
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
                  for(let i = 0; i < this.gameOptions.columns; i++){
                      let frameName = this.isLater ? values[i].id + 5 : values[i].id;
                      rowBelow[i].gameObject.setFrame(frameName);
                      rowBelow[i].gameObject.y += this.tileSize * this.gameOptions.rows;
                  }
                  if (this.state.soundOn) this.scoreSfx.play();
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
              let values = this.isLater ? Phaser.Utils.Array.NumberArray(5, (this.gameOptions.columns - 1) + 5) : Phaser.Utils.Array.NumberArray(0, this.gameOptions.columns - 1);
              
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
          this.bgsong.destroy();
          this.gameOver = true;
          
          if(this.score > this.highScore) {
              this.store.dispatch('addScore', this.score);
              this.highScore = this.score;
          }
      }
  }

  loadingBar() {
    var progressBar = this.add.graphics();
        var progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);
        
        var width = this.cameras.main.width;
        var height = this.cameras.main.height;
        var loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);
        
        var percentText = this.make.text({
            x: width / 2,
            y: height / 2 - 5,
            text: '0%',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);
        
        var assetText = this.make.text({
            x: width / 2,
            y: height / 2 + 50,
            text: '',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        assetText.setOrigin(0.5, 0.5);
        
        this.load.on('progress', function (value) {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(250, 280, 300 * value, 30);
        });
        
        this.load.on('fileprogress', function (file) {
            assetText.setText('Loading asset: ' + file.key);
        });

        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
        });   
  }
}
export default PlayGame
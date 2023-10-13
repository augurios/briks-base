class gameService {
  constructor(game, store) {
      this.store = store;
      this.game = game;
      this.modalGameMenu = document.querySelector("#game-menu");
      this.modalPauseMenu = document.querySelector("#pause-menu");
      this.modalEndGame = document.querySelector("#end-game");
      this.modalGameOtions = document.querySelector("#game-options");
      this.startBtn = document.querySelector(".start-game-btn");
      this.closeBtn = document.querySelector(".close-btn");
      this.resumeBtn = document.getElementById("resume-game-btn");
      this.mainBtn = document.querySelectorAll(".main-game-btn");
      this.restartBtn = document.querySelector(".restart-game-btn");
      this.optionsBtn = document.querySelector(".options-btn");
      this.optionsChecks = document.querySelectorAll(".game-option input");
      this.highScoreContainer = document.getElementById('highscore');
      this.finalScoreContainer = document.getElementById('finalscore');
      this.optionsDictionary = {
        'music-control' : 'musicOn',
        'sound-control' : 'soundOn',
        'tutorial-control' : 'showTutorial',
      }
      console.log(this);
      this.init()
  }

  init() {
      this.openMenu();
      this.eventListeners();
      this.checkOptionStatus();
  }

  eventListeners() {
        this.startBtn.onclick = () => {
          this.game.scene.start('PlayGame');
          this.game.scene.start('ScenePaused');
          
          this.closeMenu();
          this.initPauseMenu();
          this.initEndGame();
        }

        this.optionsBtn.onclick = () => {
          this.openOptions();
          
          this.closeMenu();
        }

        window.onclick = function(e){
          if(e.target == this.modalGameMenu){
            this.closeMenu()
          }
        }

        this.mainBtn.forEach((buts) => {
            buts.onclick = () => {
                this.backToMain();                
            }
        })
        
        this.optionsChecks.forEach((check) => {
            check.onclick = (event) => {
                this.store.dispatch('toggleOption', this.optionsDictionary[event.target.name]);   
            }
        })
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
          if (gameScene.scene.scene.state.soundOn) gameScene.scene.scene.pauseMenu.play();
      })
      gameScene.events.on('resume', () => {
          this.closePause()
      })

      //pause modal events
      this.closeBtn.onclick = () => {
          this.closePause()
          gameScene.scene.resume();
          gameScene.scene.scene.bgsong.resume();
      }

      this.resumeBtn.onclick = () => {
          this.closePause()
          gameScene.scene.resume();
          gameScene.scene.scene.bgsong.resume();
      }
      
  }

  openPause() {
      this.modalPauseMenu.style.display = "block";
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

  openOptions() {
      this.modalGameOtions.style.display = "block";
  }

  closeOptions() {
      this.modalGameOtions.style.display = "none";
  }

  backToMain() {
      this.closePause()
      this.closeEnd()
      this.closeOptions()
      this.openMenu()
  }

  checkOptionStatus() {
    this.optionsChecks.forEach(input => {
      if(this.optionsDictionary[input.name]) {
        input.checked = this.store.state[this.optionsDictionary[input.name]];
      }
    })
  }
}
export default gameService;
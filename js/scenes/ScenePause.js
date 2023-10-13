export default function () {
  const Scene = new Phaser.Class({

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
          var pauseBtn = document.querySelector(".pause-button");

          keyObj.on('up', () => { 
            this.togglePause();
          });

          pauseBtn.onclick = () => {
            this.togglePause();
          }
          pauseBtn.style.display = "block";
      },

      togglePause() {
        const gameScene = this.scene.get('PlayGame').scene;
        
        if(gameScene.isPaused()) {
            gameScene.resume();
            gameScene.scene.bgsong.resume();
        } else  {
            gameScene.pause();
            gameScene.scene.bgsong.pause();
        }
      }

  });
  return Scene;
}
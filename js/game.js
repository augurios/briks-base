import store from './store/index.js'; 
import PlayGame from './scenes/PlayGame.js';
import ScenePaused from './scenes/ScenePause.js';
import gameService from './components/GameService.js';
import livingBackground from './components/LivingBackground.js';
let game;
let gameOptions = {

    // number of columns
    columns: 6,

    // number of rows, must be high enough to allow object pooling
    rows: 20,

    // tile speed in pixels per second
    tileSpeed: 120,

    //buildVersion
    version: store.state.version,

}

window.onload = function() {
    console.log('window', window, document);
    let windowWidth = window.visualViewport.width * 2
    let windowHeight =  window.visualViewport.height * 2
    if(windowWidth > 960) { windowWidth = 960}

    let gameConfig = {
        type: Phaser.AUTO,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "thegame",
            width: windowWidth,
            height: windowHeight,
           
        },
        physics: {
            default: "arcade"
        },
        transparent: true,
    }
    game = new Phaser.Game(gameConfig);

    game.scene.add('PlayGame', new PlayGame(store, gameOptions));
    game.scene.add('ScenePaused', ScenePaused());
    
    const gameMenu = new gameService(game, store);
    const backGeound = new livingBackground(game);
}


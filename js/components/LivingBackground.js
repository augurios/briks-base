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
      }, 100);
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
};

export default livingBackground;
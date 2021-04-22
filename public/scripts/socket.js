$(function () {
  // enables communication with server
  let socket = io();

  // **** HOME PAGE ****

  // home-canvas config
  let canvas = document.getElementsByClassName("home-canvas")[0];
  canvas.style.width = screen.width + "px";
  canvas.style.height = screen.availHeight + "px";
  canvas.style.minWidth = screen.width + "px";
  canvas.style.minHeight = screen.availHeight + "px";
  canvas.width = screen.width;
  canvas.height = screen.availHeight;

  let ctx = canvas.getContext("2d");
  ctx.lineWidth = 5;
  ctx.setTransform(1,0,0,1,0.5,0.5);
  ctx.translate(0.5, 0.5);  

  $('.home-canvas').draggable({
    containment: [0, 0, 0, 0],

    start: (event) => {
      ctx.beginPath();
      ctx.moveTo(event.pageX + 0.5, event.pageY + 0.5);
    },
    drag: (event) => { 
      ctx.lineTo(event.pageX + 0.5, event.pageY + 0.5);
      ctx.stroke();     
    }
  }); 

  // Disallows invalid nickname input
  $('.nickname-field').on('keydown', function(e) {
    let size = $('.nickname-field').val().length;
    let validNickname = true;

    if (e.key == "Enter") {
      if (size > 0) {
        $('.home-form').submit();
      }
      else {
        validNickname = false;
      }
    }
    else if (size == 0 && e.key == " ") {
      validNickname = false;
    }
    
    if (size > 20) {
      validNickname = false;
    }

    if (!validNickname) {
      return false;
    }
  });

  // Prevents bypassing keydown with paste
  $('.nickname-field').on('keyup change paste click input', function() {
    let value = $('.nickname-field').val();
    let size = value.length;
    if (size > 20) {
      $('.nickname-field').val(value.substr(0, 20));
    }
    else {
      $('.nickname-field').val(value);
    }
  });

  // Submit can be done by pressing enter or clicking 'Play'-- this prevents invalid nickname input submitted via click. 
  $('.nickname-button').on('click', function() {
    let size = $('.nickname-field').val().length;
    if (size == 0) {
      return false;
    }
  });

  // **** GAME PAGE ****

  $('.home-form').submit((event) => {
    event.preventDefault();
    let nickname = $('.home-form').serializeArray()[0].value; 
    let url = window.location.href;
    
    // Adds user as host if invite id in URL is invalid or is without one. 
    // Adds user as guest if invite id in URL is valid.  
    if (url == "https://drawfriends.herokuapp.com/" || url == "http://drawfriends.herokuapp.com/") {
      // Passes screen width and height to server so that it can be fetched by other clients in the same room. 
      socket.emit('add host', nickname, screen.width, screen.height);
    }
    else {
      socket.emit('add guest', nickname, url.substr(url.length - 36, url.length), screen.width, screen.height);
    }

    
    // **** DOM changes for gameroom layout ****
    $('html').css("min-height", window.innerHeight);
    $('html').css("min-width", screen.width);

    $('.box-container').remove();

    $('.body-container').append("<div class='chat-box-container'></div>");
    $('.chat-box-container').append("<div class='chat-box'></div>");

    $('.chat-box').append("<div class='chat-header-container'></div>");
    $('.chat-box').append("<div class='chat-log-container'></div>");
    $('.chat-box').append("<div class='chat-input-container'></div>");

    $('.chat-log-container').append("<div class='chat-log'></div>");
    $('.chat-input-container').append("<div class='chat-text-submit-container'></div>");

    $('.chat-text-submit-container').append("<form class='user-input-form'></form>");
    $('.user-input-form').append("<div class='chat-text-container'></div>")
    $('.user-input-form').append("<div class='chat-buttons-container'></div>")
    
    $('.chat-text-container').append("<textarea class='msg-field' name='msg' placeholder='Send a message'></textarea>");

    $('.chat-buttons-container').append("<div class='left-side-buttons'></div>");
    $('.chat-buttons-container').append("<div class='right-side-buttons'></div>");

    $('.left-side-buttons').append("<div class='palette-icon-container'></div>");
    $('.left-side-buttons').append("<div class='eraser-icon-container'></div>");

    $('.right-side-buttons').append("<div class='settings-icon-container'></div>");
    $('.right-side-buttons').append("<div class='msg-submit-container'></div>");
    
    $('.msg-submit-container').append("<button class='msg-submit' type='submit'>Chat</button>");

    $('.palette-icon-container').append("<div class='palette-icon'></div>");
    $('.eraser-icon-container').append("<span class= 'eraser-icon'>Eraser</span>");
    $('.settings-icon-container').append("<img src='images/settings.png' alt='settings' style='width:21px; height:21px;'>");
    
    $('.chat-text-container').append("<div class='palette'></div>");
    $('.chat-text-container').append("<div class='settings'></div>");
  
    $('.palette').append("<div class='color-container'></div>");
    $('.palette').append("<div class='line-widths-container'></div>");
    

    $('.settings').append("<div class='view-users-container'><span class='view-users-text'>View users</span></div>");
    $('.settings').append("<div class='change-name-color-container'><span class='change-name-color-text'>Change nickname color</span></div>");
    
    $('.change-name-color-container').append("<div class='change-name-color'></div>");
    $('.view-users-container').append("<div class='view-users'></div>");
    
    $('.change-name-color').append("<div class='change-name-color-colors'></div>");
    $('.change-name-color').append("<div class='change-name-color-preview'><span class='preview-name-span'><b>" + nickname + "</b></span></div>");

    $('.palette').hide();
    $('.settings').hide();
    $('.change-name-color').hide();
    $('.view-users').hide();

    let hexCode = "";
    let prevColor = "#000";
    let firstColorActivated = false;
    let colorActive;
    let colors = ["navy", "blue", "aqua", "teal", "olive", "green", "lime", "yellow", "orange", "red", "brown", "maroon", "fuchsia", "purple", "black", "grey"];
    
    for (let i = 0; i < colors.length; i++) {
      $('.color-container').append("<div class='color " + colors[i] + "'></div>");
    }
    
    socket.on('user has joined message', (nickname) => {
      $('.chat-log').append("<li class='user-joined-msg'><b>"+ nickname + "</b> has joined the room</li>");
      
    });

    socket.on('welcome to user room message', (hostName) => {
      $('.chat-log').append("<li class='welcome-to-user-room-msg'>Welcome to <b>"+ hostName + "</b> 's room</li>");
      
    });

    socket.on('user left message', (name) => {
      $('.chat-log').append("<li class='user-msg'><b>" + name + "</b> has left the room</li>");
    });

    socket.on('update lobby', (users) => {
      $('.user-list').remove();
      for (let i = 0; i < users.length; i++) {
        $('.view-users').append("<li class='user-list'>" + users[i].nickname + "</li>");
      }
    });

    // Receives and formats message data received from server and posts to chat log. 
    let chatLog = document.getElementsByClassName('chat-log')[0];
    socket.on('display user msg', (msg, name, color) => {
      $('.chat-log').append("<li class='user-msg'><b style='color: " + color + "'>" + name + "</b>: &nbsp;" + msg + "</li>");
      chatLog.scrollTop = chatLog.scrollHeight;
    });

    
    // Displaying invite link interaction
    socket.on('invite link', (id) => {
      $('.chat-log').append("<li class='inv-link-msg-hidden'>Click <span class='inv-link-span'>here</span> to show invite link</li><li class='inv-link-msg-shown'>https://drawfriends.herokuapp.com/" + id + "<br><span class='hide-inv-span'>hide</span></li>");
      
      $('.inv-link-msg-shown').hide();
      $('.inv-link-span').click(() => { 
        $('.inv-link-msg-hidden').hide();
        $('.inv-link-msg-shown').show();
      });
      $('.hide-inv-span').click(() => {
        $('.inv-link-msg-shown').hide();
        $('.inv-link-msg-hidden').show();
      });
    });


     // Disallows invalid typed messsages
     $('.msg-field').on('keydown', function(e) {
      let size = $('.msg-field').val().length;
      if (e.key == "Enter") {
        e.preventDefault();
        if (size > 0) {
          $('.user-input-form').submit();
        }
      }
      
      if (size == 0 && e.key == " ") {
        return false;
      }

      if (size > 510) {
        e.preventDefault();
      }

      // Expands textarea upwards to fit content
      this.style.height = 0;
      this.style.height = this.scrollHeight + 4 + 'px';

    });

    // Disallows invalid pasted messsages
    $('.msg-field').on('keyup change paste click input', function(e) {
      let value = $('.msg-field').val();
      let size = value.length;
      if (size > 510) {
        $('.msg-field').val(value.substr(0, 510));
      }
      else {
        $('.msg-field').val(value);
      }
    });
    
    // Sends user's message data to server
    $('.user-input-form').submit((event) => {
      event.preventDefault();
      let msg = $('.msg-field').val();
      
      socket.emit('user msg', msg, nickname, nicknameColor);
      $('.msg-field').val("");
      
    });
    
    // Clicking palette interaction
    let paletteActive = false;
    $('.palette-icon-container').click(function() {
      if (!paletteActive) {
        if (!settingsActive) {
          paletteActive = true;
        }
        else {
          $('.change-name-color').hide();
          $('.view-users').hide();
          $('.settings').hide();
          $('.settings-icon-container').css('background-color', '');
          settingsActive = false; 
          paletteActive = true;
        }
        
        $('.palette-icon').css('box-shadow','0 0 7px 0 black');
        $('.palette').show();  
      }
      else {
        $('.palette').hide();
        $('.palette-icon').css('box-shadow','');
        paletteActive = false; 
      }    
    });


    // Clicking palette colors interaction
    $('.color').click(function() {
      if (eraserSelected) {
        eraserSelected = false;
        $('.eraser-icon-container').css('background-color', '');
      }
      if (!firstColorActivated) {
        firstColorActivated = true;
      }
      else {
        colorActive.style.boxShadow = "";
      }

      colorActive = this;  
      colorActive.style.boxShadow = "0 0 10px 0 black";
      hexCode = $(this).css("background-color");
      $('.line').css('background-color', hexCode);
      // Signal a palette color change to other clients in the same room. 
      socket.emit('color change', hexCode, socket.id);   
    });

    // Hovering palette colors interaction
    $('.color').hover(function() {
      if (!eraserSelected) {
        let color = $(this).css("background-color");
        $('.line').css('background-color', color);
        $('.palette-icon').css('background-color', color);
      }
    }, () => {
      if (!eraserSelected) {
        $('.line').css('background-color', hexCode);
        $('.palette-icon').css('background-color', hexCode);
      }
    });

    // Clicking eraser interaction
    let eraserSelected = false;
    let eraserSize = 10;
    $('.eraser-icon-container').click(function() {
      if (!eraserSelected) {
        eraserSelected = true;
        prevColor = hexCode;
        this.style.backgroundColor = 'lightgrey';

        $('.line').css('background-color', '#fff');
      }
      else {
        eraserSelected = false;
        hexCode = prevColor;
        this.style.backgroundColor = '';

        $('.line').css('background-color', prevColor);
      }
      
      // Signals eraser selected to other clients in the same room
      socket.emit('eraser change', hexCode);
    });

    // DOM edits for palette line widths
    let lines = ["thin", "normal", "thick"];
    let lineWidth = 5;
    let firstLineWidthActivated = false;
    let lineWidthActive;
    for (let i = 0; i < lines.length; i++) {
      $('.line-widths-container').append("<div class='" + lines[i] + "-line-container'></div>");
      $('.' + lines[i] + '-line-container').append("<div class='" + lines[i] + " line'></div>");

      // Clicking palette line widths interaction
      $('.' + lines[i] + '-line-container').click(function () {
        if (!firstLineWidthActivated) {
          firstLineWidthActivated = true;
        }
        else {
          lineWidthActive.style.backgroundColor = "";
        }
        lineWidthActive = this;
        lineWidthActive.style.backgroundColor = "lightgrey";
        let className = this.className;
        if (className == "thin-line-container") {
          lineWidth = 1.25;
          eraserSize = lineWidth + 5;
        }
        else if (className == "normal-line-container") {
          lineWidth = 5;
          eraserSize = lineWidth + 5;
        }
        else {
          lineWidth = 10;
          eraserSize = lineWidth + 5;
        }
        socket.emit('line width change', lineWidth, socket.id);
      });
    }

    // Clicking settings interaction
    let settingsActive = false;
    $('.settings-icon-container').click(function() {
      if (!settingsActive) {
        if (!paletteActive) {
          settingsActive = true;
        }
        else {
          $('.palette').hide();
          $('.palette-icon').css('box-shadow','');
          paletteActive = false;
          settingsActive = true;
        }

        this.style.backgroundColor = 'lightgrey';
        $('.settings').css('border-left', '');
        $('.settings').show();  
      }
      
      else {
        $('.settings').hide();
        $('.change-name-color').hide();
        $('.view-users').hide();
        
        this.style.backgroundColor = '';
        settingsActive = false; 
      }    
    });

    // Assigns a random color from nicknameColors to client
    let nicknameColors = ["blue", "aqua", "teal", "olive", "green", "lime", "yellow", "orange", "red", "maroon", "fuchsia", "purple"];
    let randNum = Math.floor(Math.random() * 11);
    let nicknameColor = $('.' + nicknameColors[randNum]).css("background-color");
    let firstNicknameColorActivated = false;
    let nicknameColorActive;
    
    // DOM edits for setting 'change nickname color' palette
    $('.preview-name-span').css('color', nicknameColor);
    for (let i = 0; i < nicknameColors.length; i++) {
      $('.change-name-color-colors').append("<div class='nickname-color " + nicknameColors[i] + "'></div>");
    }

    // Clicking a color on 'change nickname color' palette interaction
    $('.nickname-color').click(function() {   
      if (!firstNicknameColorActivated) {
        firstNicknameColorActivated = true;
      }
      else {
        nicknameColorActive.style.boxShadow = "";
      }

      nicknameColorActive = this;  
      nicknameColorActive.style.boxShadow = "0 0 10px 0 black";
      nicknameColor = $(this).css("background-color");

      // Signals a nickname color change to other clients in gameroom 
      // Client's nickname and tag color are shared
      // 'tag' refers to the nametag that follows a client's pen
      socket.emit('change tag color', nicknameColor, socket.id);
    });

    // Hovering over 'change nickname color' palette colors interaction
    $('.nickname-color').hover(function() {
      let color = $(this).css("background-color");
      $('.preview-name-span').css('color', color);
    }, () => {
      $('.preview-name-span').css('color', nicknameColor);
    });

    // Clicking 'Change nickname color' in settings interaction
    $('.change-name-color-container').click(() => {
      $('.settings').css('border-left', 'none');
      $('.change-name-color').show();
    });

    // Clicking 'View users' in settings interaction
    $('.view-users-container').click(() => {
      $('.settings').css('border-left', 'none');
      $('.view-users').show();
    });
    
    // A primary canvas is on top (highest z-index) of secondary canvases in the DOM and is the one this client draws on.
    // A secondary canvas is unique and owned by a client with a matching id.
    // Drawings made on the primary canvas are simultaneously drawn on all secondary canvases.
    socket.emit('remove then add primary and secondary canvases');
    socket.on('remove then add primary and secondary canvases', (users) => {
      // Removing then adding canvases clears all canvases whenever a user joins or rejoins. This aligns what every client in a room sees. 
      $('canvas').remove();

      $('.palette').hide();
      $('.nametag').remove();

      // Resets gameroom layout to initial state
      if (colorActive != undefined) {
        colorActive.style.boxShadow = "";
        $('.line').css('background-color', '#000');
        $('.palette-icon').css('background-color', '');
        firstColorActivated = false;
      }

      if (lineWidthActive != undefined) {
        lineWidthActive.style.backgroundColor = "";
        firstLineWidthActivated = false;
      }

      if (paletteActive) {
        $('.palette-icon-container').css('background-color', '');
        $('.palette-icon').css('box-shadow', '');
        paletteActive = false;
      }
      if (eraserSelected) {
        $('.eraser-icon-container').css('background-color', '');
        eraserSelected = false; 
      }
  
      // 
      for (let i = 0; i < users.length; i++) {
        // Intially, all canvases are initialzed as primary canvases
        // This avoids having to repeat styling code for secondary canvases 
        $('body').prepend("<canvas id=user" + users[i].socketId + "></canvas>");
        let primaryCanvas = document.getElementById("user" + users[i].socketId);
        primaryCanvas.style.zIndex = i
        primaryCanvas.style.position = "fixed";
        primaryCanvas.style.overflow = "hidden";
        primaryCanvas.style.width = screen.width + "px";
        primaryCanvas.style.height = screen.availHeight + "px";
        primaryCanvas.style.minWidth = screen.width + "px";
        primaryCanvas.style.minHeight = screen.availHeight + "px";
      
        primaryCanvas.width = screen.width;
        primaryCanvas.height = screen.availHeight;
      
    
        if (users[i].socketId != socket.id) {
          let secondaryCanvas = document.getElementById("user" + users[i].socketId);
          let secondaryCtx = secondaryCanvas.getContext("2d"); 
          secondaryCtx.lineWidth = 5;
          secondaryCtx.setTransform(1,0,0,1,0.5,0.5);
          secondaryCtx.translate(0.5, 0.5);

          // Drawings need scaling to accurately reflect their position on various screen sizes
          let xScale = screen.width / users[i].screenWidth;
          let yScale = screen.height / users[i].screenHeight;
          
          // Prevents redunancy when a user joins or rejoins
          socket.removeAllListeners('initialize tag color' + users[i].socketId);
          socket.removeAllListeners('change tag color' + users[i].socketId);
          socket.removeAllListeners('stroke color of secondary canvas' + users[i].socketId);
          socket.removeAllListeners('stroke width of secondary canvas' + users[i].socketId);
          socket.removeAllListeners('start drawing on secondary canvas' + users[i].socketId);
          socket.removeAllListeners('continuation of drawing on secondary canvas' + users[i].socketId);
          socket.removeAllListeners('start erasing on secondary canvas' + users[i].socketId);
          socket.removeAllListeners('continuation of erasing on secondary canvas' + users[i].socketId);

          // The following listeners pick up on changes made by other clients
          // Possible changes include tag color, stroke style, drawing and erasing
          socket.on('initialize tag color' + users[i].socketId, (color) => {
            $('body').prepend("<span class='nametag " + users[i].socketId + "'>" + users[i].nickname + "</span>");
            $('.nametag.' + users[i].socketId).css({backgroundColor: color, zIndex: users.size + 2 + ""});
            $('.nametag.' + users[i].socketId).hide();
          });
          socket.on('change tag color' + users[i].socketId, (color) => {
            $('.nametag.' + users[i].socketId).css('background-color', color);
          });

          socket.on('stroke color of secondary canvas' + users[i].socketId, (hexCode) => {
            secondaryCtx.strokeStyle = hexCode;
          });

          socket.on('stroke width of secondary canvas' + users[i].socketId, (lineWidth) => {
            secondaryCtx.lineWidth = lineWidth;
          });
          
          socket.on('start drawing on secondary canvas' + users[i].socketId, (x, y) => {
            secondaryCtx.beginPath();
            secondaryCtx.moveTo((x + 0.5) * xScale, (y + 0.5) * yScale);
            $('.nametag.' + users[i].socketId).css({top: (y - 5) * yScale + "px", left: (x + 2) * xScale + "px"});
            $('.nametag.' + users[i].socketId).show();
          });

          socket.on('continuation of drawing on secondary canvas' + users[i].socketId, (x, y) => {
            secondaryCtx.lineTo((x + 0.5) * xScale, (y + 0.5) * yScale);
            secondaryCtx.stroke();
            $('.nametag.' + users[i].socketId).css({top: (y - 5) * yScale + "px", left: (x + 2) * xScale + "px"});
          });

          socket.on('start erasing on secondary canvas' + users[i].socketId, (x, y, eraserSize) => {
            secondaryCtx.clearRect(x * xScale, y * yScale, eraserSize, eraserSize);
            $('.nametag.' + users[i].socketId).css({top: (y - 5) * yScale + "px", left: (x + 2) * xScale + "px"});
          });

          socket.on('continuation of erasing on secondary canvas' + users[i].socketId, (x, y, eraserSize) => {
            secondaryCtx.clearRect(x * xScale, y * yScale, eraserSize, eraserSize);
            $('.nametag.' + users[i].socketId).css({top: (y - 5) * yScale + "px", left: (x + 2) * xScale + "px"});
          });

          socket.on('stop on secondary canvas' + users[i].socketId, () => {
            $('.nametag.' + users[i].socketId).hide();
          });
        }
      }

      // Places user's primary canvas at the top of canvas stack. 
      let primaryCanvas = document.getElementById("user" + socket.id);
      primaryCanvas.style.zIndex = users.length;
      
      let primaryCtx = primaryCanvas.getContext("2d");
      primaryCtx.lineWidth = 5;
      primaryCtx.setTransform(1,0,0,1,0.5,0.5);
      primaryCtx.translate(0.5, 0.5);

      socket.emit('initialize tag color', nicknameColor, socket.id);

      socket.on('stroke color of primary canvas', (hexCode) => {
        primaryCtx.strokeStyle = hexCode;
      }); 
      
      socket.on('stroke width of primary canvas', (lineWidth) => {
        primaryCtx.lineWidth = lineWidth;
      });


      // Allows users to dot the canvas by clicking on it
      let dragging = false;
      $('#user' + socket.id).on('mouseup', (event) => {
        if (!dragging && !eraserSelected && event.which != 2 && event.which != 3) {
          primaryCtx.beginPath();
          primaryCtx.moveTo(event.pageX + 0.5, event.pageY + 0.5);
          primaryCtx.lineTo(event.pageX + 0.5, event.pageY + lineWidth + 0.5);
          primaryCtx.stroke();
        }
      });     

      $('#user' + socket.id).draggable({
        containment: [0, 0, 0, 0],
      
        start: (event) => {
          if (!eraserSelected) {
            dragging = false;

            primaryCtx.beginPath();
            primaryCtx.moveTo(event.pageX + 0.5, event.pageY + 0.5);

            socket.emit('start drawing on secondary canvas', event.pageX, event.pageY, socket.id);   
          }
          else {
            primaryCtx.clearRect(event.pageX, event.pageY, eraserSize, eraserSize);

            socket.emit('start erasing on secondary canvas', event.pageX, event.pageY, socket.id, eraserSize);
          }
          
        },

        drag: (event) => { 
          if (!eraserSelected) {
            dragging = true;

            primaryCtx.lineTo(event.pageX + 0.5, event.pageY + 0.5);
            primaryCtx.stroke();
      
            socket.emit('continuation of drawing on secondary canvas', event.pageX, event.pageY, socket.id); 
          }
          else {
            primaryCtx.clearRect(event.pageX, event.pageY, eraserSize, eraserSize);

            socket.emit('continuation of erasing on secondary canvas', event.pageX, event.pageY, socket.id, eraserSize)
          }
              
        },

        stop: () => {
          dragging = false;
          socket.emit('stop on secondary canvas', socket.id);
        }
      }); 
    });

    // **** Mobile detection and response to window size changes ****
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  
    if (check && screen.width <= 500) {
      $('.chat-log').append("<li class='mobile-msg'>This site is best experienced (for now) on a desktop, laptop, or tablet. For drawing on mobile, try using landscape mode.</li>"); 
    }
    else {
      $('.mobile-msg').remove();
    }
    let isAtMaxWidth = screen.availWidth - window.innerWidth === 0;
    let screenPixelRatio = (window.outerWidth - 8) / window.innerWidth;
    let isAtDefaultZoom = screenPixelRatio > 0.92 && screenPixelRatio <= 1.10;
    let screenSizeMsg = false;

    if (!isAtMaxWidth || !isAtDefaultZoom) {
      screenSizeMsg = true;
      if (!check) {
        $('.chat-log').append("<li class='screen-size-msg'>To view the entire canvas, fully maximize this window and/or set page zoom to 100%</li>"); 
      }
      
    }
    
    if (!check) {
      $(window).resize(function() {
      
        let isAtMaxWidth = screen.availWidth - window.innerWidth === 0;
        let screenPixelRatio = (window.outerWidth - 8) / window.innerWidth;
        let isAtDefaultZoom = screenPixelRatio > 0.92 && screenPixelRatio <= 1.10;
        if (!isAtMaxWidth || !isAtDefaultZoom) {
          if (!screenSizeMsg) {
            screenSizeMsg = true;
            $('.chat-log').append("<li class='screen-size-msg'>To view the entire canvas, fully maximize this window and/or set page zoom to 100%</li>"); 
          } 
        }
        else {
          screenSizeMsg = false;
          $('.screen-size-msg').remove();
        }
      });  
    }
    
  });

});
$(document).ready(function() {
  let context = $('.drawingCanvas')[0].getContext("2d");
  let color = '#' + Math.random().toString(16).substr(-6);

  let paint = false;
  let clickX = [];
  let clickY = [];
  let clickDrag = [];
  let colors = [];

  var base = 'http://clicktime.herokuapp.com:80/rooms/';
  var roomName = 'test-lol-awesome-room';
  var socket = io.connect(base + roomName);

  socket.on('welcome', function() {
      // Catch up to the other clients:
      let msg = { message: 'requestingInitStrokes' };
      socket.emit('message', JSON.stringify(msg));
  });

  socket.on('message', function(msg) {
      let data = JSON.parse(msg);

      if (data.message === 'requestingInitStrokes') {
          let msg = {
              message: 'transmittingInitStrokes',
              strokes: [clickX, clickY, clickDrag, colors]
          };
          socket.emit('message', JSON.stringify(msg));
      } else if (data.message === 'transmittingInitStrokes') {
          clickX = data.strokes[0];
          clickY = data.strokes[1];
          clickDrag = data.strokes[2];
          colors = data.strokes[3];
          redraw();
      } else {
          addClick(data);
          redraw();
      }
  });

  socket.on('heartbeat', function () {
      console.log('heartbeat');
  });

  socket.on('error', function (err) {
      console.error(err);

      // Reinitialize client:
      let msg = { message: 'requestingInitStrokes' };
      socket.emit('message', JSON.stringify(msg));
  });

  function addClick(params) {
      clickX.push(params.x);
      clickY.push(params.y);
      clickDrag.push(params.dragging);
      colors.push(params.color);
  }

  function redraw() {
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.lineJoin = "round";
      context.lineWidth = 5;

      for (let i = 0; i < clickX.length; i++) {
        context.strokeStyle = colors[i];
        context.beginPath();
        if (clickDrag[i] && i) {
          context.moveTo(clickX[i - 1], clickY[i - 1]);
        } else {
          context.moveTo(clickX[i] - 1, clickY[i]);
        }
        context.lineTo(clickX[i], clickY[i]);
        context.closePath();
        context.stroke();
      }
  }

  $('.drawingCanvas')
      .mousedown(function(e) {
          let mouseX = e.pageX - this.offsetLeft;
          let mouseY = e.pageY - this.offsetTop;

          paint = true;

          let addClickParams = {
              message: 'newStroke',
              x: e.pageX - this.offsetLeft,
              y: e.pageY - this.offsetTop,
              dragging: false,
              color: color
          };

          addClick(addClickParams);
          socket.emit('message', JSON.stringify(addClickParams));

          redraw();
      })
      .mousemove(function(e) {
          if (paint) {
              let addClickParams = {
                message: 'newStroke',
                x: e.pageX - this.offsetLeft,
                y: e.pageY - this.offsetTop,
                dragging: true,
                color: color
              };

              addClick(addClickParams);
              socket.emit('message', JSON.stringify(addClickParams));

              redraw();
          }
      })
      .mouseup(function(e) {
          paint = false;
      })
      .mouseleave(function(e) {
          paint = false;
      });
});

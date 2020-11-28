var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var config = require('./config.js');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('view engine', 'jade');


app.get('/fishfeedr', function(req, res) {
    var delay = parseFloat(req.query.delay); // in minutes
    var battery = parseFloat(req.query.batt);

    if (!delay) {
        res.status(400).json({"status": "error", "msg": "No delay specified"});
        return;
    }

    if (!battery) {
        res.status(400).json({"status": "error", "msg": "No battery level specified"});
        return;
    }

    // Turn off pump
    const ewelink = require('ewelink-api');
    (async () => {
        const connection = new ewelink({
            phoneNumber: config.sonoff.phone,
            password: config.sonoff.password,
            region: config.sonoff.region,
        });
        await connection.setDevicePowerState(config.sonoff.pump_id, 'off');
    })();

    // Schedule pump turn on after <delay> minutes
    setTimeout(() => {
        (async () => {
            const connection = new ewelink({
                phoneNumber: config.sonoff.phone,
                password: config.sonoff.password,
                region: config.sonoff.region,
            });
            await connection.setDevicePowerState(config.sonoff.pump_id, 'on');
        })();
    }, delay * 60 * 1000);

    // Send battery level to Thingspeak
    var url = 'https://api.thingspeak.com/update?api_key=' + config.thingspeak.key + '&field1=' + battery;
    request.get(url, (error, response, body) => { });

    // Notify on Slack
    var url = 'https://hooks.slack.com/services/' + config.slack.key;
    var bodyToSend = '{"channel": "#fish-tank", "username": "FishFeedr", "text": "Fish feeder rolled.", "icon_emoji": ":slack:"}';
    request.post(url, { form: bodyToSend }, (error, response, body) => { });

    // Respond to client
    res.status(200).json({"status": "ok", "msg": "Fishfeedr routine triggered with a delay of " + delay + " minutes and battery level of " + battery + " recorded" });
});


app.use('/', function(req, res) {
    res.status(200).json({"status": "ok", "msg": "You've reached the API root. Service is running." });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    console.log(err.message);
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
console.log('Running server...');

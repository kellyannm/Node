var express = require('express');
var morgan = require('morgan');
const logger = require('./logger');
var mongoose = require('mongoose');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

module.exports = function (app, config) {
    logger.log('info', "Loading Mongoose functionality");
    mongoose.Promise = require('bluebird');
    mongoose.connect(config.db);
    var db = mongoose.connection;
    db.on('error', function () {
        throw new Error('unable to connect to database at ' + config.db);
    });

    if (process.env.NODE_ENV !== 'test') {
        app.use(morgan('dev'));
        mongoose.set('debug', true);
        mongoose.connection.once('open', function callback() {
            logger.log('info', "Mongoose connected to the database");
        });

        app.use(function (req, res, next) {
            logger.log('Request from ' + req.connection.remoteAddress, 'info');
            next();
        });
    }

    app.use(cors({ orgin: 'http://localhost:9000' }));

    app.use(morgan('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));


    app.use(bodyParser.json());
    var models = fs.readdirSync('./app/models');
    models.forEach((model) => {
        require('../app/models/' + model);
    });
    var controllers = fs.readdirSync('./app/controllers');
    controllers.forEach((controller) => {
        controller = require('../app/controllers/' + controller)(app, config);
    });


    app.use(express.static(config.root + '/public'));

    app.use(function (req, res) {
        res.type('text/plan');
        res.status(404);
        res.send('404 Not Found');
    });


    app.use(function (err, req, res, next) {
        console.log(err);
        if (process.env.NODE_ENV !== 'test') {
            console.log(err.stack, 'error');
        }
        res.type('text/plan');
        if (err.status) {
            res.status(err.status).send(err.message);
        } else {
            res.status(500).send('500 Sever Error');
        }
    });
    console.log("Starting application");

};
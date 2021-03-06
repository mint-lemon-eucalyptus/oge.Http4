var EventEmitter = require('events').EventEmitter;
var util = require('util');
var express = require('express');
var path = require('path');
var engine = require('ejs-locals');
var bodyParser = require('body-parser');
var session = require('express-session');

var qw;

function Http($config, Qw) {
    qw = Qw.log(this);
    this.app = null;
    this.$config = $config;
    if (!!$config.session) {
        qw('enabled shared sessionStore');
        this.sessionStore = session($config.session);
    }

}
util.inherits(Http, EventEmitter);


Http.prototype.prepare = function () {
    var app = express();

    var cfg = this.$config;
    var staticPath = cfg.pathToStatic ? path.join('..', cfg.pathToStatic) : '../../http/static';
    if (!path.isAbsolute(staticPath)) {
        staticPath = path.join(__dirname, staticPath);
    }
    app.use(this.getStaticMiddleware(staticPath));
    qw('static files path:', staticPath);
    app.set('static', staticPath);
    var viewsPath = cfg.pathToViews ? path.join('..', cfg.pathToViews) : '../../http/views';
    if (!path.isAbsolute(viewsPath)) {
        viewsPath = path.join(__dirname, viewsPath);
    }
    app.set('views', viewsPath);
    qw('views path:', viewsPath);
    var uploadsPath = this.$config.uploadDir;
    app.set('uploads', uploadsPath);
    qw('uploads path:', uploadsPath);
    app.engine('ejs', engine);
    app.set('view engine', 'ejs');
    app.set('view options', {
        layout: false
    });
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());
    app.use(bodyParser.raw());

    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
    //  app.use(app.router);

    this.app = app;

};

Http.prototype.getStaticMiddleware = function (a) {
    return express.static(path.join(__dirname, a));
};
Http.prototype.Router = function () {
    return new express.Router();
};
Http.prototype.addRouter = function (path, router) {
    router.use('*', this.notFoundHandler);
    this.app.use(path, router);
};
Http.prototype.addRoute = function (method, path, handler) {
    this.app[method](path, handler);
};
Http.prototype.getApp = function () {
    return this.app;
};
Http.prototype.getVar = function (varName) {
    return this.app.get(varName);
};
Http.prototype.pathToStatic = function (url) {
    return path.join(this.$config.uploadDir, url);
};
Http.prototype.start = function () {
    if (this.$config.port) {
        this.app.use(this.notFoundHandler);
        this.app.listen(this.$config.port, this.$config.ipAddress);
    } else {
        throw Error('port is not set');
    }
};
Http.prototype.notFoundHandler = function (req, res) {
    res.status(404);
    // respond with html page

    if (req.accepts('html')) {
        res.render('404', {url: req.url});
        return;
    }
    // respond with json
    if (req.accepts('json')) {
        res.send({error: 'Not found'});
        return;
    }
    // default to plain-text. send()
    res.type('txt').send('Not found');
};
Http.prototype.express = express;

Http.prototype.EVENT_USER_AVATAR_RELOAD = 'EVENT_USER_AVATAR_RELOAD';
module.exports = Http;
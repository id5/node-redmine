var http = require('http');
var util = require('util');
var url = require('url');
var querystring = require('querystring');
var util = require('util');

function escapeJSONString(key, value) {
  if (typeof value == 'string') {
    return value.replace(/[^ -~\b\t\n\f\r"\\]/g, function(a) {
      return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    });
  }
  return value;
}
function JSONStringify(data) {
  return JSON.stringify(data, escapeJSONString).replace(/\\\\u([\da-f]{4}?)/g, '\\u$1');
}

/**
 *  Redmine
 */
function Redmine(config) {
  if (!config.apiKey || !config.host) {
    throw new Error("Error: apiKey and host must be configured.");
  }

  this.setApiKey(config.apiKey);
  this.setHost(config.host);
  config.port && this.setPort(config.port);
}

Redmine.prototype.version = '0.2.3';

Redmine.JSONStringify = JSONStringify;

Redmine.prototype.setApiKey = function(key) {
  this.apiKey = key;
};

Redmine.prototype.getApiKey = function() {
  return this.apiKey;
};

Redmine.prototype.setHost = function(host) {
  this.host = host;
};

Redmine.prototype.getHost = function() {
  return this.host;
};

Redmine.prototype.setPort = function(port) {
  this.port = port;
};

Redmine.prototype.getPort = function() {
  return this.port;
};

Redmine.prototype.generatePath = function(path, params) {
  if (path.slice(0, 1) != '/') {
    path = '/' + path;
  }
  return path + '?' + querystring.stringify(params);
};

Redmine.prototype.request = function(method, path, params) {
  if (!this.getApiKey() || !this.getHost()) {
    throw new Error("Error: apiKey and host must be configured.");
  }
  const port = this.getPort();

  var options = {
    host: this.getHost(),
    port: port && port || '',
    path: method == 'GET' ? this.generatePath(path, params) : path,
    method: method,
    headers: {
      'X-Redmine-API-Key': this.getApiKey()
    }
  };

  return new Promise((resolve, reject) => {
    var req = http.request(options, function(res) {
      //console.log('STATUS: ' + res.statusCode);
      //console.log('HEADERS: ' + JSON.stringify(res.headers));

      if (res.statusCode != 200 && res.statusCode != 201) {
        reject('Server returns stats code: ' + res.statusCode);
      }

      var body = "";
      res.setEncoding('utf8');

      res.on('data', function (chunk) {
        body += chunk;
      });

      res.on('end', function(e) {
        var data = JSON.parse(body);
        resolve(data);
      });
    });

    req.on('error', function(err) {
      reject(err);
    });

    if (method != 'GET') {
      var body = JSONStringify(params);
      req.setHeader('Content-Length', body.length);
      req.setHeader('Content-Type', 'application/json');
      req.write(body);
    }
    req.end();
  });
 
};

/**
 *  crud apis
 */
Redmine.prototype.getIssue = async function(id) {
  if (typeof id == 'integer') {
    throw new Error('Error: Argument #1 id must be integer');
  }
  return await this.request('GET', '/issues/' + id + '.json', {});
};

Redmine.prototype.getIssues = async function(params) {
  return await this.request('GET', '/issues.json', params);
};

Redmine.prototype.postIssue = async function(params) {
  return await this.request('POST', '/issues.json', {issue: params});
};

Redmine.prototype.updateIssue = async function(id, params) {
  return await this.request('PUT', '/issues/' + id + '.json', {issue: params});
};

Redmine.prototype.deleteIssue = async function(id) {
  return await this.request('DELETE', '/issues/' + id + '.json', {});
};


/*
 * Exports
 */
module.exports = Redmine;

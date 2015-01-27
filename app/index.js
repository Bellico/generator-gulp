'use strict';

var
  $generators = require('yeoman-generator'),
  $tasksList  = require('./tasksList.json'),
  $fs         = require('fs');

module.exports = $generators.Base.extend({

  constructor: function () {
    $generators.Base.apply(this, arguments);
    this.argument('taskName', { type: String, required: false });
    this.option('force');
    this.option('new');
  },

  prompting: function () {
    if (this.taskName) {
      return false;
    }

    var done = this.async();
    var prompts = [];

    if (this.options.new) {
      prompts.push({ type: 'input', name: 'appName', message : 'Your project name', default : this.appname });
      prompts.push({ type: 'input', name: 'userName', message : 'Your Name', default : "Martin Franck <franck.martin12@hotmail.com>" });
    }
    prompts.push({ type: 'checkbox', name: 'tasksList', message : 'Choose your tasks to add in your gulpfile.js', choices: $tasksList });

    this.prompt(prompts, function (answers) {
      this.taskAdding = answers.tasksList;
      this.appName = this._.camelize(answers.appName);
      this.config = answers;
      done();
    }.bind(this));
  },

  configuring : function () {

    function addTask(tasklist, taskAdding, name, direction) {
      if (direction) {
        tasklist.unshift({name: name});
        taskAdding.unshift(name);
      } else {
        tasklist.push({name: name});
        taskAdding.push(name);
      }
    }

    function newPackageJson(context) {
      return {
        name: context._.slugify(context.appName),
        version: "0.0.0", description: "", author: context.config.userName, main: "gulpfile.js", dependencies: {}, devDependencies: { gulp : "*", "gulp-load-plugins" : "*" }
      };
    }

    if (this.taskName) { this.taskAdding = [this.taskName]; }
    if (this.options.new || this.options.force) { addTask($tasksList, this.taskAdding, "init", true); }

    this.packageJson = {};
    this.dependencies = {};
    var pathJson = this.destinationRoot() + '/package.json';

    if (this.options.force) {
      $fs.writeFile('gulpfile.js', '');
      this.packageJson = newPackageJson(this);
      return true;
    }

    try {
      this.packageJson = JSON.parse(this.read(pathJson));
    } catch (error) {
      this.packageJson = newPackageJson(this);
    }
  },

  helpers: function () {
    this.setDep = function (dependencies, depToSet) {
      depToSet.map(function (dep) {
        dependencies[dep] = '*';
      });
    };

    this.merge = function (left, right) {
      for (var key in right) {
        if( right.hasOwnProperty(key)) {
          left[key] = right[key];
        }
      }
    };
  },

  writing : {
    project : function () {
      if (this.options.new) {
        this.copy('.jshintrc', '.jshintrc');
        this.copy('_robots.txt', 'src/robots.txt');
        this.write('READMY.md', this.appName);
        this.write('.gitignore', 'node_modules/');
        this.template('_bower.json', 'bower.json', { appName: this._.slugify(this.appName), userName: this.config.userName });
        this.template('_humans.txt', 'src/humans.txt', { userName: this.config.userName });
        this.template('_index.html', 'src/index.html', { appName: this.appName });
      }
    },

    gulpfile : function () {
      for (var i = 0; i < $tasksList.length; i++) {
        var name = $tasksList[i].name;
        if(this.taskAdding.indexOf(name) >= 0){
          var stream = this.read('../tasks/' + name + '.template');
          if ($tasksList[i].dep) { this.setDep(this.dependencies, $tasksList[i].dep); }
          $fs.appendFile('gulpfile.js', stream + "\n");
        }
      }
    },

    packageJson: function() {
      this.merge(this.packageJson.devDependencies, this.dependencies);
      this.write('package.json', JSON.stringify(this.packageJson, null, 2));
    }

  },

  install : function () {
    this.installDependencies({
      skipMessage: true, //this.options['skip-install-message'],
      skipInstall: this.options['skip-install']
    });
  },

  end : function () {
    this.log("READY !");
  }

});
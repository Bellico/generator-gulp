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

    if (this.options.new) {
      addTask($tasksList, this.taskAdding, "init", true);
      //addTask($tasksList, this.taskAdding, "build", false);
    }

    this.packageJson = {};
    this.dependencies = {};

    if (this.options.force) {
      $fs.writeFile('gulpfile.js', '');
      this.packageJson = {
        name: this._.slugify(this.appName),
        version: "0.0.0", description: "", author: this.config.userName, main: "gulpfile.js", dependencies: {}, devDependencies: { gulp : "*"}
      };
    } else {
      var json = this.read(this.destinationRoot() + '/package.json');
      this.packageJson = JSON.parse(json);
    }
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
      function setDep(dependencies, depToSet) {
        depToSet.map(function (dep) {
          dependencies[dep] = '*';
        });
      }

      for (var i = 0; i < $tasksList.length; i++) {
        var name = $tasksList[i].name;
        if(this.taskAdding.indexOf(name) >= 0){
          var stream = this.read('../tasks/' + name + '.template');
          if ($tasksList[i].dep) { setDep(this.dependencies, $tasksList[i].dep); }
          $fs.appendFile('gulpfile.js', stream + "\n");
        }
      }
    },

    packageJson: function() {
      this.packageJson.devDependencies = this.dependencies;
      this.write('package.json', JSON.stringify(this.packageJson, null, 2));
    }

  },

  install : function () {
   /* this.installDependencies({
      skipMessage: this.options['skip-install-message'],
      skipInstall: this.options['skip-install']
    });*/
  },

  end : function () {
    this.log("READY !");
  }

});